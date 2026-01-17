import { useReducer } from "react";

import type { GranularLine, GranularToken } from "../types";

interface RecordingState {
	lines: GranularLine[];
	currentLineIndex: number;
	autoAdvanced: boolean;
}

type RecordingAction =
	| { type: "RESET"; initialLines: GranularLine[] }
	| { type: "RECORD_START"; currentTime: number }
	| { type: "RECORD_END"; currentTime: number }
	| { type: "REVERT" }
	| { type: "IGNORE" }
	| { type: "NAVIGATE_TO_LINE"; lineIndex: number };

function cloneLines(initialLines: GranularLine[]): GranularLine[] {
	return initialLines.map(line => ({
		...line,
		tokens: line.tokens.map(t => ({ ...t })),
	}));
}

function recordingReducer(state: RecordingState, action: RecordingAction): RecordingState {
	switch (action.type) {
		case "RESET": {
			const lines = cloneLines(action.initialLines);
			// Find next significant line
			for (let i = 0; i < lines.length; i++) {
				if (lines[i].isSignificant) {
					return { lines: lines, currentLineIndex: i, autoAdvanced: false };
				}
			}
			return { lines, currentLineIndex: 0, autoAdvanced: false };
		}

		case "RECORD_START": {
			const newState = recordingReducer(state, { type: "RECORD_END", currentTime: action.currentTime });
			const newLines = newState.lines;

			const currentLine = newLines[newState.currentLineIndex];
			if (!currentLine.isSignificant) return newState;

			// Check if we need to clear and re-record this line
			const allRecordedInLine = currentLine.tokens
				.filter(t => t.isSignificant)
				.every(t => t.startTime !== undefined && t.endTime !== undefined);

			// Both are valid condition for re-recording:
			// - The first happens when the end is manually recorded
			// - The second happens when the end is automatically recorded by the above recursive call
			if (allRecordedInLine || state.autoAdvanced || newState.autoAdvanced) {
				// Clear the entire line for re-recording
				for (const token of currentLine.tokens) {
					if (token.isSignificant) {
						delete token.startTime;
						delete token.endTime;
					}
				}
			}

			// Find first token without startTime in current line
			for (const token of currentLine.tokens) {
				if (token.isSignificant && token.startTime === undefined) {
					token.startTime = action.currentTime;
					break;
				}
			}

			return { lines: newLines, currentLineIndex: newState.currentLineIndex, autoAdvanced: false };
		}

		case "RECORD_END": {
			const newLines = cloneLines(state.lines);

			const currentLine = newLines[state.currentLineIndex];
			if (!currentLine.isSignificant) return state;

			// Find token with startTime but without endTime in current line
			let foundPendingEnd = false;
			for (const token of currentLine.tokens) {
				if (token.isSignificant && token.startTime !== undefined && token.endTime === undefined) {
					token.endTime = action.currentTime;
					foundPendingEnd = true;
					break;
				}
			}

			if (!foundPendingEnd) {
				// No pendingEnd token found, nothing to end
				return state;
			}

			// Check if current line has all significant tokens started
			const allStartedInLine = currentLine.tokens
				.filter(t => t.isSignificant)
				.every(t => t.startTime !== undefined);

			if (allStartedInLine) {
				// Find next significant line
				for (let i = state.currentLineIndex + 1; i < newLines.length; i++) {
					if (newLines[i].isSignificant) {
						return { lines: newLines, currentLineIndex: i, autoAdvanced: true };
					}
				}
			}

			return { lines: newLines, currentLineIndex: state.currentLineIndex, autoAdvanced: false };
		}

		case "REVERT": {
			const newLines = cloneLines(state.lines);

			const currentLine = newLines[state.currentLineIndex];
			if (!currentLine.isSignificant) return state;

			// The whole line is empty / valid condition for re-recording: just navigate back to the previous line
			const allEmptyInLine = currentLine.tokens
				.filter(t => t.isSignificant)
				.every(t => t.startTime === undefined);

			const allRecordedInLine = currentLine.tokens
				.filter(t => t.isSignificant)
				.every(t => t.startTime !== undefined && t.endTime !== undefined);

			if (allEmptyInLine || allRecordedInLine || state.autoAdvanced) {
				for (let i = state.currentLineIndex - 1; i >= 0; i--) {
					if (newLines[i].isSignificant) {
						return { lines: newLines, currentLineIndex: i, autoAdvanced: false };
					}
				}
			}

			// Check if current line has all significant tokens started
			const allStartedInLine = currentLine.tokens
				.filter(t => t.isSignificant)
				.every(t => t.startTime !== undefined);

			if (allStartedInLine) {
				// Find token with startTime but without endTime in current line
				for (const token of currentLine.tokens) {
					if (token.isSignificant && token.startTime !== undefined && token.endTime === undefined) {
						token.startTime = undefined;
						break;
					}
				}
			}
			else {
				// Find the current and previous token. The first token without startTime is the current token
				let previousToken: GranularToken | undefined;
				let currentToken: GranularToken | undefined;
				for (const token of currentLine.tokens) {
					if (token.isSignificant) {
						previousToken = currentToken;
						currentToken = token;
						if (token.startTime === undefined) {
							// Clear startTime and endTime of the previous token (and the current token just in case)
							token.endTime = undefined;
							if (previousToken) {
								previousToken.startTime = undefined;
								previousToken.endTime = undefined;
							}
							break;
						}
					}
				}
			}

			return { lines: newLines, currentLineIndex: state.currentLineIndex, autoAdvanced: false };
		}

		case "IGNORE": {
			// Set startTime and endTime to null to mark as manually ignored
			const newState = recordingReducer(state, { type: "RECORD_START", currentTime: null! });
			return recordingReducer(newState, { type: "RECORD_END", currentTime: null! });
		}

		case "NAVIGATE_TO_LINE": {
			const newLines = cloneLines(state.lines);

			return { lines: newLines, currentLineIndex: action.lineIndex, autoAdvanced: false };
		}

		default:
			return state;
	}
}

export default function useRecordingReducer(initialLines: GranularLine[]) {
	return useReducer(
		recordingReducer,
		{ lines: initialLines, currentLineIndex: 0, autoAdvanced: false },
		state => recordingReducer(state, { type: "RESET", initialLines }),
	);
}
