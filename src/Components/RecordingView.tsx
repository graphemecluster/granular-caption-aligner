import { useCallback, useEffect, useRef, useState } from "react";

import { GearIcon, MarkGithubIcon, PauseIcon, PlayIcon, QuestionIcon, SquareCircleIcon } from "@primer/octicons-react";

import HelpDialog from "./HelpDialog";
import { RecordingDisplay } from "./RecordingDisplay";
import SettingsDialog from "./SettingsDialog";
import exportGST from "../format/exportGST";
import useRecordingReducer from "../hooks/useRecordingReducer";
import { formatPlaybackRate, formatTime, formatVolume } from "../utils";

import type { AlignerConfig, GranularLine, Settings } from "../types";

interface RecordingViewProps {
	config: AlignerConfig;
	parsedLines: GranularLine[];
	onBack: () => void;
}

export default function RecordingView({ config, parsedLines, onBack }: RecordingViewProps) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [audioUrl, setAudioUrl] = useState<string>("");
	const [audioState, setAudioState] = useState({
		isPlaying: false,
		currentTime: 0,
		duration: 0,
	});
	const [audioControls, setAudioControls] = useState({
		playbackRate: 1,
		volume: 1,
	});
	const [settings, setSettings] = useState<Settings>({
		speedChangeFactor: 4,
		seekSeconds: 5,
	});
	const [configOverrides, setConfigOverrides] = useState({
		audioFile: config.audioFile,
		recordingMethod: config.recordingMethod,
	});
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [isHelpOpen, setIsHelpOpen] = useState(false);

	const getCurrentTime = useCallback(() => audioRef.current?.currentTime ?? 0, []);

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
		const file = configOverrides.audioFile ?? config.audioFile;
		if (file) {
			const url = URL.createObjectURL(file);
			setAudioUrl(url);
			return () => URL.revokeObjectURL(url);
		}
		return undefined;
	}, [configOverrides.audioFile, config.audioFile]);

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return undefined;

		audio.playbackRate = audioControls.playbackRate;
		audio.volume = audioControls.volume;

		// Use requestAnimationFrame instead of "timeupdate" event for more frequent update
		let animationFrame = requestAnimationFrame(updateTime);

		function updateTime() {
			setAudioState(prev => ({ ...prev, currentTime: audio!.currentTime }));
			animationFrame = requestAnimationFrame(updateTime);
		}
		function updateDuration() {
			setAudioState(prev => ({ ...prev, duration: audio!.duration }));
		}
		function handlePlay() {
			setAudioState(prev => ({ ...prev, isPlaying: true }));
		}
		function handlePause() {
			setAudioState(prev => ({ ...prev, isPlaying: false }));
		}

		audio.addEventListener("loadedmetadata", updateDuration);
		audio.addEventListener("play", handlePlay);
		audio.addEventListener("pause", handlePause);

		return () => {
			cancelAnimationFrame(animationFrame);
			audio.removeEventListener("loadedmetadata", updateDuration);
			audio.removeEventListener("play", handlePlay);
			audio.removeEventListener("pause", handlePause);
		};
	}, [audioUrl, audioControls.playbackRate, audioControls.volume]);

	useEffect(() => {
		function handleWheel(e: WheelEvent) {
			// Don't handle wheel events when dialog is open
			if (isSettingsOpen || isHelpOpen) return;

			e.preventDefault();
			if (e.deltaY < 0) {
				// Scroll up - previous line
				if (currentSignificantIndex > 0) {
					navigateToLine(significantLineIndices[currentSignificantIndex - 1]);
				}
			}
			else if (e.deltaY > 0) {
				// Scroll down - next line
				if (currentSignificantIndex < totalSignificantLines - 1) {
					navigateToLine(significantLineIndices[currentSignificantIndex + 1]);
				}
			}
		}

		function handleKeyDown(e: KeyboardEvent) {
			// Don't handle keyboard events when dialog is open
			if (isSettingsOpen || isHelpOpen) return;

			if ((e.code === "Space" || e.code === "KeyZ") && !e.repeat) {
				e.preventDefault();
				// Mark start time of the current token
				recordStartTime();
			}
			else if ((e.code === "Enter" || e.code === "KeyC") && !e.repeat && configOverrides.recordingMethod === "spacebarStartEnterEnd") {
				e.preventDefault();
				// Mark end time of the current token
				recordEndTime();
			}
			// Allow key repeat for all of the following keys except Home, End and Numpad0
			// WASD Navigation
			else if (e.code === "KeyW") {
				e.preventDefault();
				// Navigate to previous significant line
				if (currentSignificantIndex > 0) {
					navigateToLine(significantLineIndices[currentSignificantIndex - 1]);
				}
			}
			else if (e.code === "KeyS") {
				e.preventDefault();
				// Navigate to next significant line
				if (currentSignificantIndex < totalSignificantLines - 1) {
					navigateToLine(significantLineIndices[currentSignificantIndex + 1]);
				}
			}
			else if (e.code === "KeyA") {
				e.preventDefault();
				// Revert current line
				dispatch({ type: "REVERT" });
			}
			else if (e.code === "KeyD") {
				e.preventDefault();
				// Ignore current line
				dispatch({ type: "IGNORE" });
			}
			// Real Navigation Keys
			else if (e.code === "Home" && !e.repeat) {
				e.preventDefault();
				// Navigate to the first significant line
				navigateToLine(significantLineIndices[0]);
			}
			else if (e.code === "End" && !e.repeat) {
				e.preventDefault();
				// Navigate to the last significant line
				navigateToLine(significantLineIndices[totalSignificantLines - 1]);
			}
			else if (e.code === "PageUp") {
				e.preventDefault();
				// Navigate to the significant line five lines above
				navigateToLine(significantLineIndices[Math.max(0, currentSignificantIndex - 5)]);
			}
			else if (e.code === "PageDown") {
				e.preventDefault();
				// Navigate to the significant line five lines below
				navigateToLine(significantLineIndices[Math.min(totalSignificantLines - 1, currentSignificantIndex + 5)]);
			}
			// Arrow Keys for Audio Control
			else if (e.code === "ArrowUp") {
				e.preventDefault();
				// Speed up playback
				setAudioControls(prev => ({
					...prev,
					playbackRate: Math.min(4, prev.playbackRate * 2 ** (1 / settings.speedChangeFactor)),
				}));
			}
			else if (e.code === "ArrowDown") {
				e.preventDefault();
				// Slow down playback
				setAudioControls(prev => ({
					...prev,
					playbackRate: Math.max(0.25, prev.playbackRate / 2 ** (1 / settings.speedChangeFactor)),
				}));
			}
			else if (e.code === "ArrowLeft") {
				e.preventDefault();
				// Seek backward
				if (audioRef.current) {
					audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - settings.seekSeconds);
				}
			}
			else if (e.code === "ArrowRight") {
				e.preventDefault();
				// Seek forward
				if (audioRef.current) {
					audioRef.current.currentTime = Math.min(audioState.duration, audioRef.current.currentTime + settings.seekSeconds);
				}
			}
			else if (e.code === "Numpad0" && !e.repeat) {
				e.preventDefault();
				// Play/pause audio
				handlePlayPause();
			}
		}

		function handleKeyUp(e: KeyboardEvent) {
			// Don't handle keyboard events when dialog is open
			if (isSettingsOpen || isHelpOpen) return;

			if ((e.code === "Space" || e.code === "KeyZ") && configOverrides.recordingMethod === "spacebarStartRelease") {
				e.preventDefault();
				recordEndTime();
			}
		}

		window.addEventListener("wheel", handleWheel, { passive: false });
		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);

		return () => {
			window.removeEventListener("wheel", handleWheel);
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		};
	}, [configOverrides.recordingMethod, recordStartTime, recordEndTime, currentSignificantIndex, totalSignificantLines, significantLineIndices, navigateToLine, dispatch, settings, audioState.duration, isSettingsOpen, isHelpOpen]);

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
				void audioRef.current.play();
			}
			else {
				audioRef.current.pause();
			}
		}
	}

	function handleStop() {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
		}
	}

	function handleSeek(time: number) {
		if (audioRef.current) {
			audioRef.current.currentTime = time;
		}
	}

	function handleLineNavigationChange(value: number) {
		// Adding undefined to stop ESLint from complaining about unnecessary conditional
		const lineIndex = significantLineIndices[value - 1] as number | undefined;
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
		<div className="bg-gray-900 flex flex-col">
			<div className="flex-none bg-gray-800 p-4 flex items-center justify-between gap-4">
				<button
					onClick={onBack}
					className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded transition-colors cursor-pointer">
					←&nbsp;Back
				</button>

				{/* Audio Controls */}
				<div className="flex-1 flex items-center gap-4">
					<button
						onClick={handlePlayPause}
						className="bg-sky-600 hover:bg-sky-700 text-white px-2.5 py-2 rounded transition-colors cursor-pointer">
						{audioState.isPlaying ? <PauseIcon size={20} aria-label="Pause" /> : <PlayIcon size={20} aria-label="Play" />}
					</button>

					<span className="text-white text-sm">{formatTime(audioState.currentTime)}</span>

					<input
						type="range"
						min="0"
						max={audioState.duration || 0}
						step="any"
						value={audioState.currentTime}
						onChange={e => handleSeek(Number(e.target.value))}
						className="flex-1" />

					<span className="text-white text-sm">{formatTime(audioState.duration)}</span>

					<button
						onClick={handleStop}
						className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-2.5 py-2 rounded transition-colors cursor-pointer">
						<SquareCircleIcon size={20} aria-label="Stop" />
					</button>

					<div className="flex flex-col gap-2">
						<div className="flex items-center gap-2">
							<label className="contents">
								<span className="text-white text-xs text-right flex-1">Speed</span>
								<input
									type="range"
									min="-2"
									max="2"
									step="any"
									value={Math.log2(audioControls.playbackRate)}
									onChange={e => setAudioControls(prev => ({ ...prev, playbackRate: 2 ** Number(e.target.value) }))}
									className="w-28" />
							</label>
							<span className="text-white text-xs w-8">{formatPlaybackRate(audioControls.playbackRate)}</span>
						</div>

						<div className="flex items-center gap-2">
							<label className="contents">
								<span className="text-white text-xs text-right flex-1">Volume</span>
								<input
									type="range"
									min="0"
									max="1"
									step="any"
									value={audioControls.volume}
									onChange={e => setAudioControls(prev => ({ ...prev, volume: Number(e.target.value) }))}
									className="w-28" />
							</label>
							<span className="text-white text-xs w-8">{formatVolume(audioControls.volume)}</span>
						</div>
					</div>
				</div>

				<div className="flex gap-4">
					<button
						onClick={() => setIsSettingsOpen(true)}
						className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded transition-colors cursor-pointer">
						<GearIcon size={18} />
						Settings
					</button>

					<button
						onClick={reset}
						className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded transition-colors cursor-pointer">
						Reset
					</button>

					<button
						onClick={handleSaveFile}
						className="flex flex-col justify-center gap-0.5 bg-teal-600 hover:bg-teal-700 text-white leading-none px-5 rounded transition-colors cursor-pointer">
						<div>Save</div>
						<div className="text-gray-200 text-[0.625rem]">Ctrl+S</div>
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

			{/* eslint-disable-next-line jsx-a11y/media-has-caption */}
			<audio ref={audioRef} src={audioUrl} />

			<SettingsDialog
				isOpen={isSettingsOpen}
				onClose={() => setIsSettingsOpen(false)}
				audioFile={configOverrides.audioFile}
				onAudioFileChange={file => setConfigOverrides(prev => ({ ...prev, audioFile: file }))}
				recordingMethod={configOverrides.recordingMethod}
				onRecordingMethodChange={method => setConfigOverrides(prev => ({ ...prev, recordingMethod: method }))}
				settings={settings}
				onSettingsChange={setSettings} />

			<HelpDialog
				isOpen={isHelpOpen}
				onClose={() => setIsHelpOpen(false)} />

			<div className="flex-none bg-gray-800 p-4 text-white text-sm whitespace-nowrap">
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
					<div className="flex items-center gap-2">
						<span className="inline-block w-4 h-4 bg-red-600 rounded"></span>
						<span>Manually Ignored</span>
					</div>

					<div className="flex-1"></div>

					<button
						onClick={() => setIsHelpOpen(true)}
						className="flex items-center gap-2 bg-cyan-700 hover:bg-cyan-800 text-white -m-2 px-3.5 py-2 rounded transition-colors cursor-pointer">
						<QuestionIcon size={18} />
						Help
					</button>

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
