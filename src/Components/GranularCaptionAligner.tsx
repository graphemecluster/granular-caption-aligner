import { useState } from "react";

import ConfigView from "./ConfigView";
import RecordingView from "./RecordingView";
import parseGranularLyrics from "../format/parseGranularLyrics";

import type { AlignerConfig, GranularLine } from "../types";

export default function GranularCaptionAligner() {
	const [started, setStarted] = useState(false);
	const [config, setConfig] = useState<AlignerConfig | null>(null);
	const [parsedLines, setParsedLines] = useState<GranularLine[]>([]);

	async function handleStart(newConfig: AlignerConfig) {
		if (!newConfig.lyricsFile) return;

		const lyricsText = await newConfig.lyricsFile.text();
		const segmentedLines = parseGranularLyrics(lyricsText, newConfig.segmentation);

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
