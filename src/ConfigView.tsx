import { useState } from "react";

import { MarkGithubIcon } from "@primer/octicons-react";

import type { AlignerConfig, Granularity, PunctuationMode, RecordingMethod } from "./types";

interface ConfigViewProps {
	onStart: (config: AlignerConfig) => void;
}

export default function ConfigView({ onStart }: ConfigViewProps) {
	const [granularity, setGranularity] = useState<Granularity>("word");
	const [punctuation, setPunctuation] = useState<PunctuationMode>("ignore");
	const [recordingMethod, setRecordingMethod] = useState<RecordingMethod>("spacebarStartEnterEnd");
	const [audioFile, setAudioFile] = useState<File | null>(null);
	const [lyricsFile, setLyricsFile] = useState<File | null>(null);

	function handleStart() {
		if (!audioFile || !lyricsFile) {
			alert("Please upload both audio and lyrics files");
			return;
		}

		onStart({
			granularity,
			punctuation,
			recordingMethod,
			audioFile,
			lyricsFile,
		});
	}

	return (
		<div className="bg-gray-50 grid place-items-center p-8">
			<div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full relative">
				<a
					href="https://github.com/graphemecluster/granular-caption-aligner"
					target="_blank"
					rel="noopener noreferrer"
					className="absolute top-8 right-6 text-gray-500 hover:text-gray-800 transition-colors"
					aria-label="GitHub">
					<MarkGithubIcon size={32} />
				</a>

				<h1 className="text-3xl font-bold -mt-1 mb-6 text-gray-800">Granular Caption Aligner (Beta)</h1>

				<div className="space-y-6">
					{/* Granularity */}
					<fieldset>
						<legend className="block text-sm font-semibold text-gray-700 mb-2">
							Granularity
						</legend>
						<div className="space-y-2">
							<label className="flex items-center">
								<input
									type="radio"
									value="wholeLine"
									checked={granularity === "wholeLine"}
									onChange={e => setGranularity(e.target.value as Granularity)}
									className="mr-2" />
								<span>Whole Line</span>
							</label>
							<label className="flex items-center">
								<input
									type="radio"
									value="character"
									checked={granularity === "character"}
									onChange={e => setGranularity(e.target.value as Granularity)}
									className="mr-2" />
								<span>Character (Line Breaking Opportunity)</span>
							</label>
							<label className="flex items-center">
								<input
									type="radio"
									value="word"
									checked={granularity === "word"}
									onChange={e => setGranularity(e.target.value as Granularity)}
									className="mr-2" />
								<span>Word</span>
							</label>
							<label className="flex items-center">
								<input
									type="radio"
									value="pipe"
									checked={granularity === "pipe"}
									onChange={e => setGranularity(e.target.value as Granularity)}
									className="mr-2" />
								<span>Separated by Pipe (|)</span>
							</label>
						</div>
					</fieldset>

					{/* Punctuation */}
					<fieldset>
						<legend className="block text-sm font-semibold text-gray-700 mb-2">
							Punctuation Handling
						</legend>
						<div className="space-y-2">
							<label className="flex items-center">
								<input
									type="radio"
									value="ignore"
									checked={punctuation === "ignore"}
									onChange={e => setPunctuation(e.target.value as PunctuationMode)}
									className="mr-2" />
								<span>Ignore (separate insignificant token)</span>
							</label>
							<label className="flex items-center">
								<input
									type="radio"
									value="partOfPrevious"
									checked={punctuation === "partOfPrevious"}
									onChange={e => setPunctuation(e.target.value as PunctuationMode)}
									className="mr-2" />
								<span>Part of Previous Unit</span>
							</label>
						</div>
					</fieldset>

					{/* Recording Method */}
					<fieldset>
						<legend className="block text-sm font-semibold text-gray-700 mb-2">
							Recording Method
						</legend>
						<div className="space-y-2">
							<label className="flex items-center">
								<input
									type="radio"
									value="spacebarStartEnterEnd"
									checked={recordingMethod === "spacebarStartEnterEnd"}
									onChange={e => setRecordingMethod(e.target.value as RecordingMethod)}
									className="mr-2" />
								<span>Spacebar for start, Enter for end (optional)</span>
							</label>
							<label className="flex items-center">
								<input
									type="radio"
									value="spacebarStartRelease"
									checked={recordingMethod === "spacebarStartRelease"}
									onChange={e => setRecordingMethod(e.target.value as RecordingMethod)}
									className="mr-2" />
								<span>Spacebar press for start, release for end</span>
							</label>
							<label className="flex items-center">
								<input
									type="radio"
									value="midi"
									checked={recordingMethod === "midi"}
									onChange={e => setRecordingMethod(e.target.value as RecordingMethod)}
									className="mr-2"
									disabled />
								<span className="text-gray-400">MIDI Keyboard (future)</span>
							</label>
						</div>
					</fieldset>

					{/* File Uploads */}
					<fieldset>
						<legend className="block text-sm font-semibold text-gray-700 mb-2">
							Audio File
						</legend>
						<input
							type="file"
							accept="audio/*"
							onChange={e => setAudioFile(e.target.files?.[0] || null)}
							className="w-full border border-gray-300 rounded px-3 py-2" />
					</fieldset>

					<fieldset>
						<legend className="block text-sm font-semibold text-gray-700 mb-2">
							Lyrics File
						</legend>
						<input
							type="file"
							accept="*"
							onChange={e => setLyricsFile(e.target.files?.[0] || null)}
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
