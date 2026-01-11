export type Granularity = "wholeLine" | "character" | "word" | "pipe";
export type PunctuationMode = "ignore" | "partOfPrevious";
export type RecordingMethod = "spacebarStartEnterEnd" | "spacebarStartRelease" | "midi";

export interface GranularToken {
	text: string;
	startTime?: number; // in seconds
	endTime?: number; // in seconds
	isSignificant: boolean;
}

export interface GranularLine {
	tokens: GranularToken[];
	isSignificant: boolean; // lines with any significant token
}

export interface ParsedLyrics {
	lines: GranularLine[];
}

export interface AlignerConfig {
	granularity: Granularity;
	punctuation: PunctuationMode;
	recordingMethod: RecordingMethod;
	audioFile: File | null;
	lyricsFile: File | null;
}
