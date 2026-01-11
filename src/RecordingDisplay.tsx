import LineRenderer from "./LineRenderer";

import type { GranularLine } from "./types";

export function RecordingDisplay({
	lines,
	currentLineIndex,
	autoAdvanced,
}: {
	lines: GranularLine[];
	currentLineIndex: number;
	autoAdvanced: boolean;
}) {
	const previousLines = lines.slice(0, currentLineIndex);
	const currentLine = lines[currentLineIndex];
	const nextLines = lines.slice(currentLineIndex + 1);

	// Compute pendingEnd and pendingStart tokens (following RECORD_START/RECORD_END logic)
	let pendingEndToken = null;
	let pendingStartToken = null;

	if (currentLine && currentLine.isSignificant) {
		if (autoAdvanced) {
			// This line will be cleared for re-recording from the start (first significant token) without pendingEnd token
			pendingStartToken = currentLine.tokens.find(t => t.isSignificant) ?? null;
		}
		else {
			// First check for pending end in current line
			for (const token of currentLine.tokens) {
				if (token.isSignificant && token.startTime !== undefined && token.endTime === undefined) {
					pendingEndToken = token;
					break;
				}
			}

			// Then determine pending start
			// Check if all significant tokens have startTime
			const allStartedInLine = currentLine.tokens
				.filter(t => t.isSignificant)
				.every(t => t.startTime !== undefined);

			if (allStartedInLine) {
				// Check if all tokens are fully recorded (for re-recording scenario)
				const allRecordedInLine = currentLine.tokens
					.filter(t => t.isSignificant)
					.every(t => t.startTime !== undefined && t.endTime !== undefined);

				if (allRecordedInLine) {
					// Render first significant token as pending start (will be cleared for re-recording)
					pendingStartToken = currentLine.tokens.find(t => t.isSignificant) ?? null;
				}
				else {
					// Find next significant line and highlight first significant token
					// (auto-advancing will always cause the next significant line to be cleared for re-recording)
					for (let i = currentLineIndex + 1; i < lines.length; i++) {
						if (lines[i].isSignificant) {
							pendingStartToken = lines[i].tokens.find(t => t.isSignificant) ?? null;
							break;
						}
					}
				}
			}
			else {
				// Find first token without startTime in current line
				for (const token of currentLine.tokens) {
					if (token.isSignificant && token.startTime === undefined) {
						pendingStartToken = token;
						break;
					}
				}
			}
		}
	}

	return (
		<div className="flex flex-col overflow-hidden text-center whitespace-pre">
			{/* Previous lines - aligned to bottom */}
			<div className="flex-1 relative">
				<div className="absolute inset-0 flex flex-col justify-end gap-2 pb-4">
					{previousLines.map((line, lineIndex) => (
						<LineRenderer
							key={lineIndex}
							line={line}
							pendingStartToken={pendingStartToken}
							pendingEndToken={pendingEndToken}
							className="text-4xl opacity-80" />
					))}
				</div>
			</div>

			{/* Current line - centered */}
			<div className="flex-none">
				{currentLine && (
					<LineRenderer
						line={currentLine}
						pendingStartToken={pendingStartToken}
						pendingEndToken={pendingEndToken}
						className="text-6xl" />
				)}
			</div>

			{/* Next lines - aligned to top */}
			<div className="flex-1 relative">
				<div className="absolute inset-0 flex flex-col justify-start gap-2 pt-4">
					{nextLines.map((line, idx) => {
						const lineIndex = currentLineIndex + 1 + idx;
						return (
							<LineRenderer
								key={lineIndex}
								line={line}
								pendingStartToken={pendingStartToken}
								pendingEndToken={pendingEndToken}
								className="text-4xl opacity-80" />
						);
					})}
				</div>
			</div>
		</div>
	);
}
