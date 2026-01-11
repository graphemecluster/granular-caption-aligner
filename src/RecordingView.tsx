import { useCallback, useEffect, useRef, useState } from "react";

import { MarkGithubIcon } from "@primer/octicons-react";

import exportGST from "./exportGST";
import { RecordingDisplay } from "./RecordingDisplay";
import useRecordingReducer from "./useRecordingReducer";

import type { AlignerConfig, GranularLine } from "./types";

function formatTime(seconds: number) {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${String(secs).padStart(2, "0")}`;
}

interface RecordingViewProps {
	config: AlignerConfig;
	parsedLines: GranularLine[];
	onBack: () => void;
}

export default function RecordingView({ config, parsedLines, onBack }: RecordingViewProps) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [audioUrl, setAudioUrl] = useState<string>("");
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);

	const getCurrentTime = useCallback(() => {
		if (audioRef.current) {
			return audioRef.current.currentTime;
		}
		return 0;
	}, []);

	const [{ lines, currentLineIndex, autoAdvanced }, dispatch] = useRecordingReducer(parsedLines);

	const reset = useCallback(() => {
		if (!confirm("Are you should you want to reset? This will clear ALL recorded times.")) return;
		dispatch({ type: "RESET", initialLines: parsedLines });
	}, [parsedLines, dispatch]);

	const recordStartTime = useCallback(() => {
		dispatch({ type: "RECORD_START", currentTime: getCurrentTime() });
	}, [getCurrentTime, dispatch]);

	const recordEndTime = useCallback(() => {
		dispatch({ type: "RECORD_END", currentTime: getCurrentTime() });
	}, [getCurrentTime, dispatch]);

	const navigateToLine = useCallback((lineIndex: number) => {
		dispatch({ type: "NAVIGATE_TO_LINE", lineIndex });
	}, [dispatch]);

	// Get significant line indices for navigation
	const significantLineIndices = parsedLines
		.map((line, idx) => ({ line, idx }))
		.filter(({ line }) => line.isSignificant)
		.map(({ idx }) => idx);

	// Get current position in significant lines (1-based for UI)
	const currentSignificantIndex = significantLineIndices.indexOf(currentLineIndex);
	const totalSignificantLines = significantLineIndices.length;

	useEffect(() => {
		if (config.audioFile) {
			const url = URL.createObjectURL(config.audioFile);
			setAudioUrl(url);
			return () => URL.revokeObjectURL(url);
		}
		return undefined;
	}, [config.audioFile]);

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return undefined;

		function updateTime() {
			setCurrentTime(audio!.currentTime);
		}
		function updateDuration() {
			setDuration(audio!.duration);
		}
		function handlePlay() {
			setIsPlaying(true);
		}
		function handlePause() {
			setIsPlaying(false);
		}

		audio.addEventListener("timeupdate", updateTime);
		audio.addEventListener("loadedmetadata", updateDuration);
		audio.addEventListener("play", handlePlay);
		audio.addEventListener("pause", handlePause);

		return () => {
			audio.removeEventListener("timeupdate", updateTime);
			audio.removeEventListener("loadedmetadata", updateDuration);
			audio.removeEventListener("play", handlePlay);
			audio.removeEventListener("pause", handlePause);
		};
	}, [audioUrl]);

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.code === "Space" && !e.repeat) {
				e.preventDefault();
				recordStartTime();
			}
			else if (e.code === "Enter" && !e.repeat && config.recordingMethod === "spacebarStartEnterEnd") {
				e.preventDefault();
				recordEndTime();
			}
			else if (e.code === "ArrowUp") { // Allow repeat
				e.preventDefault();
				// Navigate to previous significant line
				if (currentSignificantIndex > 0) {
					const prevLineIndex = significantLineIndices[currentSignificantIndex - 1];
					navigateToLine(prevLineIndex);
				}
			}
			else if (e.code === "ArrowDown") { // Allow repeat
				e.preventDefault();
				// Navigate to next significant line
				if (currentSignificantIndex < totalSignificantLines - 1) {
					const nextLineIndex = significantLineIndices[currentSignificantIndex + 1];
					navigateToLine(nextLineIndex);
				}
			}
		}

		function handleKeyUp(e: KeyboardEvent) {
			if (e.code === "Space" && config.recordingMethod === "spacebarStartRelease") {
				e.preventDefault();
				recordEndTime();
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		};
	}, [config.recordingMethod, recordStartTime, recordEndTime, currentSignificantIndex, totalSignificantLines, significantLineIndices, navigateToLine]);

	const handleSaveFile = useCallback(() => {
		const gstContent = exportGST(lines);
		const blob = new Blob([gstContent], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `aligned-${Date.now()}.gst`;
		a.click();
		URL.revokeObjectURL(url);
	}, [lines]);

	useEffect(() => {
		function handleSave(e: KeyboardEvent) {
			if ((e.ctrlKey || e.metaKey) && e.key === "s") {
				e.preventDefault();
				handleSaveFile();
			}
		}

		window.addEventListener("keydown", handleSave);
		return () => window.removeEventListener("keydown", handleSave);
	}, [handleSaveFile]);

	function handlePlayPause() {
		if (audioRef.current) {
			if (audioRef.current.paused) {
				audioRef.current.play();
			}
			else {
				audioRef.current.pause();
			}
		}
	}

	function handleSeek(time: number) {
		if (audioRef.current) {
			audioRef.current.currentTime = time;
		}
	}

	function handleLineNavigationChange(value: number) {
		const lineIndex = significantLineIndices[value - 1];
		if (lineIndex !== undefined) {
			navigateToLine(lineIndex);
		}
	}

	useEffect(() => {
		// Confirm before closing the webpage
		function preventDefault(e: BeforeUnloadEvent) {
			e.preventDefault();
		}

		window.addEventListener("beforeunload", preventDefault);
		return () => {
			window.removeEventListener("beforeunload", preventDefault);
		};
	}, []);

	return (
		<div className="bg-gray-900 flex flex-col h-screen">
			<div className="flex-none bg-gray-800 p-4 flex items-center justify-between gap-4">
				<button
					onClick={onBack}
					className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors cursor-pointer">
					← Back
				</button>

				{/* Audio Controls */}
				<div className="flex-1 flex items-center gap-4">
					<button
						onClick={handlePlayPause}
						className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition-colors cursor-pointer">
						{isPlaying ? "Pause" : "Play"}
					</button>

					<span className="text-white text-sm">{formatTime(currentTime)}</span>

					<input
						type="range"
						min="0"
						max={duration || 0}
						step="any"
						value={currentTime}
						onChange={e => handleSeek(Number(e.target.value))}
						className="flex-1" />

					<span className="text-white text-sm">{formatTime(duration)}</span>
				</div>

				<div className="flex gap-4">
					<button
						onClick={reset}
						className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded transition-colors cursor-pointer">
						Reset
					</button>

					<button
						onClick={handleSaveFile}
						className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition-colors cursor-pointer">
						Save (Ctrl+S)
					</button>
				</div>
			</div>

			<div className="flex-1 flex bg-black gap-4">
				<div className="flex-1 grid place-items-stretch">
					<RecordingDisplay lines={lines} currentLineIndex={currentLineIndex} autoAdvanced={autoAdvanced} />
				</div>

				{/* Line Navigation */}
				<div className="flex-none bg-gray-700 p-4 flex items-center gap-4">
					<input
						type="range"
						min="1"
						max={totalSignificantLines}
						value={currentSignificantIndex + 1}
						onChange={e => handleLineNavigationChange(Number(e.target.value))}
						className="self-stretch [writing-mode:vertical-lr]" />
					<div className="flex flex-col items-center gap-2">
						<input
							type="number"
							min="1"
							max={totalSignificantLines}
							value={currentSignificantIndex + 1}
							onChange={e => handleLineNavigationChange(Number(e.target.value))}
							className="text-white text-right px-2 py-1 rounded border" />
						<span className="text-white text-sm">/ {totalSignificantLines}</span>
					</div>
				</div>
			</div>

			<audio ref={audioRef} src={audioUrl} />

			<div className="flex-none bg-gray-800 p-4 text-white text-sm">
				<div className="flex gap-6">
					<div className="flex items-center gap-2">
						<span className="inline-block w-4 h-4 bg-gray-500 rounded"></span>
						<span>Insignificant</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="inline-block w-4 h-4 bg-gray-300 rounded"></span>
						<span>Not Recorded</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="inline-block w-4 h-4 bg-yellow-300 rounded"></span>
						<span>Pending Start</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="inline-block w-4 h-4 bg-orange-800 rounded"></span>
						<span>Pending End</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="inline-block w-4 h-4 bg-teal-500 rounded"></span>
						<span>Partially Recorded</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="inline-block w-4 h-4 bg-green-600 rounded"></span>
						<span>Recorded</span>
					</div>
					<div className="flex-1"></div>
					<a
						href="https://github.com/graphemecluster/granular-caption-aligner"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white -m-2 px-3 rounded transition-colors cursor-pointer">
						<MarkGithubIcon size={20} />GitHub
					</a>
				</div>
			</div>
		</div>
	);
}
