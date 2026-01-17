export type PunctuationMode = "ignore" | "merge";
export type RecordingMethod = "spacebarStartEnterEnd" | "spacebarStartRelease" | "midi";

export interface SegmentationOptions {
	character: boolean;
	word: boolean;
	punctuation: PunctuationMode;
}

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

export interface AlignerConfig {
	segmentation: SegmentationOptions;
	recordingMethod: RecordingMethod;
	audioFile: File | null;
	lyricsFile: File | null;
}
