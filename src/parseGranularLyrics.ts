import segmentTokens from "./segmentTokens";

import type { Granularity, GranularLine, PunctuationMode } from "./types";

export default function parseGranularLyrics(input: string, granularity: Granularity, punctuation: PunctuationMode): GranularLine[] {
	return input.split(/\r\n|\r(?!\n)|\n/).map(rawLine => {
		if (!rawLine) return { tokens: [], isSignificant: false };
		const tokens = segmentTokens(rawLine, granularity, punctuation);
		return { tokens, isSignificant: tokens.some(token => token.isSignificant) };
	});
}
