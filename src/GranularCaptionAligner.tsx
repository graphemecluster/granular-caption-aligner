import { useState } from "react";

import ConfigView from "./ConfigView";
import parseGranularLyrics from "./parseGranularLyrics";
import RecordingView from "./RecordingView";

import type { AlignerConfig, GranularLine } from "./types";

export default function GranularCaptionAligner() {
	const [started, setStarted] = useState(false);
	const [config, setConfig] = useState<AlignerConfig | null>(null);
	const [parsedLines, setParsedLines] = useState<GranularLine[]>([]);

	async function handleStart(newConfig: AlignerConfig) {
		if (!newConfig.lyricsFile) return;

		const lyricsText = await newConfig.lyricsFile.text();
		const segmentedLines = parseGranularLyrics(lyricsText, newConfig.granularity, newConfig.punctuation);

		setConfig(newConfig);
		setParsedLines(segmentedLines);
		setStarted(true);
	}

	function handleBack() {
		if (!confirm("Are you should you want to go back? This will clear ALL recorded times.")) return;
		setStarted(false);
		setConfig(null);
		setParsedLines([]);
	}

	if (!started || !config) {
		return <ConfigView onStart={handleStart} />;
	}

	return <RecordingView config={config} parsedLines={parsedLines} onBack={handleBack} />;
}
