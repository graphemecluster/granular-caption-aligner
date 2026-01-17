import { useState } from "react";

import { MarkGithubIcon } from "@primer/octicons-react";

import type { AlignerConfig, PunctuationMode, RecordingMethod } from "../types";

interface ConfigViewProps {
	onStart: (config: AlignerConfig) => void;
}

export default function ConfigView({ onStart }: ConfigViewProps) {
	const [config, setConfig] = useState<AlignerConfig>({
		segmentation: {
			character: false,
			word: false,
			punctuation: "ignore",
		},
		recordingMethod: "spacebarStartEnterEnd",
		audioFile: null,
		lyricsFile: null,
	});

	function handleStart() {
		if (!config.audioFile || !config.lyricsFile) {
			alert("Please upload both audio and transcript files");
			return;
		}

		onStart(config);
	}

	return (
		<div className="bg-gray-50 grid place-items-center p-8">
			<div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl w-full relative">
				<a
					href="https://github.com/graphemecluster/granular-caption-aligner"
					target="_blank"
					rel="noopener noreferrer"
					className="absolute top-8 right-8 text-gray-500 hover:text-gray-800 transition-colors"
					aria-label="GitHub">
					<MarkGithubIcon size={32} />
				</a>

				<h1 className="text-3xl font-bold -mt-1 mb-6 text-gray-800">Granular Caption Aligner (Beta)</h1>

				<div className="space-y-6">
					{/* Segmentation */}
					<fieldset>
						<legend className="block font-semibold text-gray-700 mb-2">
							Segmentation
						</legend>
						<p className="text-sm text-gray-600 mb-2">
							In your transcript, use pipes (|) to manually mark segment boundaries.
						</p>
						<p className="text-sm text-gray-600 mb-3">
							You may choose to further segment automatically by:
						</p>
						<div className="space-y-2">
							<label className="flex items-baseline">
								<input
									type="checkbox"
									checked={config.segmentation.character}
									onChange={e => setConfig({ ...config, segmentation: { ...config.segmentation, character: e.target.checked } })}
									className="mr-2" />
								<span>
									<strong>Character:</strong> Add boundaries at Unicode line-breaking opportunities. Best for texts in CJK or languages that don’t use spaces to separate words.
								</span>
							</label>
							<label className="flex items-baseline">
								<input
									type="checkbox"
									checked={config.segmentation.word}
									onChange={e => setConfig({ ...config, segmentation: { ...config.segmentation, word: e.target.checked } })}
									className="mr-2" />
								<span>
									<strong>Word:</strong> Add boundaries at Unicode word breaks. Tip: Cut syllables manually by pipes, then check this box to further split by spaces.
								</span>
							</label>
						</div>
						<p className="text-sm text-gray-600 mt-3">
							<strong>Note:</strong> If none of the above is checked and no pipes are inserted, each line becomes a single segment.
						</p>
						<p className="text-sm text-gray-600 mt-2">
							Use backslashes (\) to suppress automatic boundaries and join adjacent segments.
						</p>
						<p className="text-sm text-gray-600 mt-2">
							To include literal pipes or backslashes, escape them by backticks (that is, replace them by `| or `\).
						</p>
					</fieldset>

					{/* Punctuation */}
					<fieldset>
						<legend className="block font-semibold text-gray-700 mb-2">
							Punctuation
						</legend>
						<p className="text-sm text-gray-600 mb-3">
							Determine how punctuation is handled during segmentation.
						</p>
						<div className="space-y-2">
							<label className="flex items-baseline">
								<input
									type="radio"
									value="ignore"
									checked={config.segmentation.punctuation === "ignore"}
									onChange={e => setConfig({ ...config, segmentation: { ...config.segmentation, punctuation: e.target.value as PunctuationMode } })}
									className="mr-2" />
								<span>
									<strong>Ignore:</strong> Punctuation marks are separated into their own insignificant tokens.
								</span>
							</label>
							<label className="flex items-baseline">
								<input
									type="radio"
									value="merge"
									checked={config.segmentation.punctuation === "merge"}
									onChange={e => setConfig({ ...config, segmentation: { ...config.segmentation, punctuation: e.target.value as PunctuationMode } })}
									className="mr-2" />
								<span>
									<strong>Merge:</strong> Punctuation marks that “stick” to adjacent words are merged into single tokens.
								</span>
							</label>
						</div>
					</fieldset>

					{/* Recording Method */}
					<fieldset>
						<legend className="block font-semibold text-gray-700 mb-2">
							Recording Method
						</legend>
						<div className="space-y-2">
							<label className="flex items-baseline">
								<input
									type="radio"
									value="spacebarStartEnterEnd"
									checked={config.recordingMethod === "spacebarStartEnterEnd"}
									onChange={e => setConfig({ ...config, recordingMethod: e.target.value as RecordingMethod })}
									className="mr-2" />
								<span>Spacebar for start, Enter for end (optional)</span>
							</label>
							<label className="flex items-baseline">
								<input
									type="radio"
									value="spacebarStartRelease"
									checked={config.recordingMethod === "spacebarStartRelease"}
									onChange={e => setConfig({ ...config, recordingMethod: e.target.value as RecordingMethod })}
									className="mr-2" />
								<span>Spacebar press for start, release for end</span>
							</label>
							<label className="flex items-baseline">
								<input
									type="radio"
									value="midi"
									checked={config.recordingMethod === "midi"}
									onChange={e => setConfig({ ...config, recordingMethod: e.target.value as RecordingMethod })}
									className="mr-2"
									disabled />
								<span className="text-gray-400">MIDI Keyboard (future)</span>
							</label>
						</div>
					</fieldset>

					{/* File Uploads */}
					<fieldset>
						<legend className="block font-semibold text-gray-700 mb-2">
							Audio File
						</legend>
						<input
							type="file"
							accept="audio/*"
							onChange={e => setConfig({ ...config, audioFile: e.target.files?.[0] || null })}
							className="w-full border border-gray-300 rounded px-3 py-2" />
					</fieldset>

					<fieldset>
						<legend className="block font-semibold text-gray-700 mb-2">
							Transcript File
						</legend>
						<input
							type="file"
							accept="*"
							onChange={e => setConfig({ ...config, lyricsFile: e.target.files?.[0] || null })}
							className="w-full border border-gray-300 rounded px-3 py-2" />
					</fieldset>

					{/* Start Button */}
					<button
						onClick={handleStart}
						className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors cursor-pointer">
						Start Alignment
					</button>
				</div>
			</div>
		</div>
	);
}
