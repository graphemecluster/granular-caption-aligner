import type { Granularity, GranularToken, PunctuationMode } from "./types";

const wordSegmenter = new Intl.Segmenter("zxx", { granularity: "word" });

function segmentByWordBoundaries(text: string): { segment: string; isWordLike: boolean }[] {
	const segments = Array.from(wordSegmenter.segment(text));
	return segments.map(s => ({ segment: s.segment, isWordLike: s.isWordLike ?? false }));
}

// Detect line breaking opportunities using off-DOM measurement
export function segmentByLineBreakingOpportunity(text: string): string[] {
	const div = document.createElement("div");
	div.className = "sr-only w-0 whitespace-pre-wrap";
	document.body.appendChild(div);

	const textNode = document.createTextNode(text);
	div.appendChild(textNode);

	const segments: string[] = [];
	let segmentStart = 0;
	let lastY = -1;
	let index = 0;

	for (const char of text) {
		const range = new Range();
		range.setStart(textNode, index);
		range.setEnd(textNode, index + char.length);
		const rect = range.getBoundingClientRect();

		if (lastY !== -1 && rect.y !== lastY) {
			segments.push(text.slice(segmentStart, index));
			segmentStart = index;
		}

		lastY = rect.y;
		index += char.length;
	}

	if (segmentStart < text.length) {
		segments.push(text.slice(segmentStart));
	}

	document.body.removeChild(div);
	return segments;
}

// Split by pipe with backtick escaping
function splitByPipe(text: string): string[] {
	const segments: string[] = [];
	let current = "";
	let escaped = false;

	for (const char of text) {
		if (escaped) {
			current += char;
			escaped = false;
		}
		else if (char === "`") {
			escaped = true;
			// Don't include the backtick itself
		}
		else if (char === "|") {
			segments.push(current);
			current = "";
		}
		else {
			current += char;
		}
	}

	segments.push(current);
	return segments.filter(s => s !== ""); // Filter out insignificant segments
}

// Process all backtick escapes in text
function processEscapes(text: string): string {
	let result = "";
	let escaped = false;

	for (const char of text) {
		if (escaped) {
			result += char;
			escaped = false;
		}
		else if (char === "`") {
			escaped = true;
		}
		else {
			result += char;
		}
	}

	return result;
}

/*
 * Apply punctuation handling based on granularity and mode:
 *
 * IGNORE mode:
 * - Word: Each segment is significant only if .isWordLike === true
 * - Whole line, character: Segment by word boundaries, separate leading/trailing punctuation
 * - Pipe: Split by pipes, then segment each part, separate leading/trailing punctuation
 *
 * PART OF PREVIOUS mode:
 * - Whole line & character: Treat entire text as one significant token
 * - Word: Segment by word boundaries, fuse non-word-like elements into the previous word-like element
 * - Pipe: Split by pipes, merge leading punctuation of each segment with previous segment
 */
function applyPunctuationMode(
	text: string,
	granularity: Granularity,
	mode: PunctuationMode,
): { text: string; isSignificant: boolean }[] {
	switch (granularity) {
		// For pipe granularity, handle pipe splitting here
		case "pipe": {
			const pipeSegments = splitByPipe(text);
			const result: { text: string; isSignificant: boolean }[] = [];

			for (const segment of pipeSegments) {
				if (!segment) continue;

				// Whitespace-only segments are insignificant
				if (/^\s+$/.test(segment)) {
					result.push({ text: segment, isSignificant: false });
					continue;
				}

				const wordSegments = segmentByWordBoundaries(segment);
				const firstWordLikeIndex = wordSegments.findIndex(s => s.isWordLike);
				const lastWordLikeIndex = wordSegments.findLastIndex(s => s.isWordLike);

				if (lastWordLikeIndex === -1) {
					// No word-like elements - this is pure punctuation
					if (mode === "partOfPrevious" && result.length > 0) {
						// Merge with previous significant token
						for (let j = result.length - 1; j >= 0; j--) {
							if (result[j].isSignificant) {
								result[j].text += segment;
								break;
							}
						}
					}
					else {
						result.push({ text: segment, isSignificant: false });
					}
					continue;
				}

				switch (mode) {
					case "ignore": {
						// Leading punctuation
						if (firstWordLikeIndex > 0) {
							const leadingText = wordSegments.slice(0, firstWordLikeIndex).map(s => s.segment).join("");
							result.push({ text: leadingText, isSignificant: false });
						}

						// Significant part
						const significantText = wordSegments.slice(firstWordLikeIndex, lastWordLikeIndex + 1).map(s => s.segment).join("");
						result.push({ text: significantText, isSignificant: true });

						// Trailing punctuation
						if (lastWordLikeIndex < wordSegments.length - 1) {
							const trailingText = wordSegments.slice(lastWordLikeIndex + 1).map(s => s.segment).join("");
							result.push({ text: trailingText, isSignificant: false });
						}
						break;
					}
					case "partOfPrevious": {
						if (firstWordLikeIndex > 0) {
							// Has leading punctuation - merge with previous
							const leadingText = wordSegments.slice(0, firstWordLikeIndex).map(s => s.segment).join("");
							if (result.length > 0) {
								for (let j = result.length - 1; j >= 0; j--) {
									if (result[j].isSignificant) {
										result[j].text += leadingText;
										break;
									}
								}
							}
							else {
								result.push({ text: leadingText, isSignificant: false });
							}
						}

						// Rest of segment is significant
						const remainingText = wordSegments.slice(firstWordLikeIndex).map(s => s.segment).join("");
						result.push({ text: remainingText, isSignificant: true });
						break;
					}
				}
			}

			return result;
		}

		case "wholeLine":
		case "character": {
			switch (mode) {
				// For whole line and character with "partOfPrevious", treat entire text as significant
				case "partOfPrevious":
					return [{ text, isSignificant: true }];

				// For whole line and character with "ignore" mode: separate leading/trailing punctuation
				case "ignore": {
					const wordSegments = segmentByWordBoundaries(text);
					const lastWordLikeIndex = wordSegments.findLastIndex(s => s.isWordLike);

					if (lastWordLikeIndex === -1) {
						return [{ text, isSignificant: false }];
					}

					const firstWordLikeIndex = wordSegments.findIndex(s => s.isWordLike);
					const result: { text: string; isSignificant: boolean }[] = [];

					// Leading punctuation
					if (firstWordLikeIndex > 0) {
						const leadingText = wordSegments.slice(0, firstWordLikeIndex).map(s => s.segment).join("");
						if (leadingText) result.push({ text: leadingText, isSignificant: false });
					}

					// Significant part
					const significantText = wordSegments.slice(firstWordLikeIndex, lastWordLikeIndex + 1).map(s => s.segment).join("");
					if (significantText) result.push({ text: significantText, isSignificant: true });

					// Trailing punctuation
					if (lastWordLikeIndex < wordSegments.length - 1) {
						const trailingText = wordSegments.slice(lastWordLikeIndex + 1).map(s => s.segment).join("");
						if (trailingText) result.push({ text: trailingText, isSignificant: false });
					}

					return result;
				}
			}

			// @ts-expect-error - Suppress unreachable code warning (ESLint complains if there is no break statement)
			break;
		}

		case "word": {
			switch (mode) {
				// For word granularity with "ignore": each isWordLike segment is significant
				case "ignore": {
					const wordSegments = segmentByWordBoundaries(text);
					return wordSegments.map(({ segment, isWordLike }) => ({
						text: segment,
						isSignificant: isWordLike,
					}));
				}

				// For word granularity with "partOfPrevious": fuse non-wordLike into previous
				case "partOfPrevious": {
					const wordSegments = segmentByWordBoundaries(text);
					const result: { text: string; isSignificant: boolean }[] = [];
					let currentText = "";
					let hasWordInCurrent = false;

					for (const { segment, isWordLike } of wordSegments) {
						if (isWordLike && currentText) {
							result.push({ text: currentText, isSignificant: hasWordInCurrent });
							currentText = segment;
							hasWordInCurrent = true;
						}
						else {
							currentText += segment;
							if (isWordLike) hasWordInCurrent = true;
						}
					}

					if (currentText) {
						result.push({ text: currentText, isSignificant: hasWordInCurrent });
					}

					return result;
				}
			}

			// @ts-expect-error - Suppress unreachable code warning (ESLint complains if there is no break statement)
			break;
		}
	}

	// @ts-expect-error - Suppress unreachable code warning (return something just in case)
	return [{ text, isSignificant: true }];
}

export default function segmentTokens(line: string, granularity: Granularity, punctuation: PunctuationMode): GranularToken[] {
	const tokens: GranularToken[] = [];

	switch (granularity) {
		case "wholeLine": {
			// Don't split by whitespace - treat the whole line as a single unit
			// Process escapes first
			const cleanText = processEscapes(line);
			const processed = applyPunctuationMode(cleanText, granularity, punctuation);

			for (const { text, isSignificant } of processed) {
				tokens.push({
					text,
					isSignificant,
				});
			}
			break;
		}
		case "pipe": {
			// applyPunctuationMode handles pipe splitting and punctuation merging internally
			const processed = applyPunctuationMode(line, granularity, punctuation);

			for (const { text, isSignificant } of processed) {
				tokens.push({
					text,
					isSignificant,
				});
			}
			break;
		}
		case "character": {
			// Process escapes first, then use off-DOM line breaking opportunity detection
			const cleanText = processEscapes(line);
			const charSegments = segmentByLineBreakingOpportunity(cleanText);

			for (const segment of charSegments) {
				// Whitespace-only segments are insignificant
				if (/^\s+$/.test(segment)) {
					tokens.push({
						text: segment,
						isSignificant: false,
					});
					continue;
				}

				const processed = applyPunctuationMode(segment, granularity, punctuation);

				for (const { text, isSignificant } of processed) {
					tokens.push({
						text,
						isSignificant,
					});
				}
			}
			break;
		}
		case "word": {
			// Process escapes first, then split by whitespace, then segment by word boundaries
			const cleanText = processEscapes(line);
			const parts = cleanText.split(/(\s+)/);

			for (const part of parts) {
				if (!part) continue;

				if (/^\s+$/.test(part)) {
					tokens.push({
						text: part,
						isSignificant: false,
					});
					continue;
				}

				const processed = applyPunctuationMode(part, granularity, punctuation);

				for (const { text, isSignificant } of processed) {
					tokens.push({
						text,
						isSignificant,
					});
				}
			}
			break;
		}
	}

	return tokens;
}
