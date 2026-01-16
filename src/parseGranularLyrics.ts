import segmentText from "./segmentText";

import type { GranularLine, SegmentationOptions } from "./types";

export default function parseGranularLyrics(input: string, options: SegmentationOptions): GranularLine[] {
	return input.split(/\r\n|\r(?!\n)|\n/).map(rawLine => {
		if (!rawLine) return { tokens: [], isSignificant: false };
		const tokens = segmentText(rawLine, options);
		return { tokens, isSignificant: tokens.some(token => token.isSignificant) };
	});
}
