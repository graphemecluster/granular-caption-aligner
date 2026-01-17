import { useEffect, useRef } from "react";

import { GearIcon } from "@primer/octicons-react";

import AudioFileSelector from "./AudioFileSelector";
import RecordingMethodSelector from "./RecordingMethodSelector";

import type { RecordingMethod, Settings } from "../types";

interface SettingsDialogProps {
	isOpen: boolean;
	onClose: () => void;
	audioFile: File | null;
	onAudioFileChange: (file: File | null) => void;
	recordingMethod: RecordingMethod;
	onRecordingMethodChange: (method: RecordingMethod) => void;
	settings: Settings;
	onSettingsChange: (settings: Settings) => void;
}

export default function SettingsDialog({
	isOpen,
	onClose,
	audioFile,
	onAudioFileChange,
	recordingMethod,
	onRecordingMethodChange,
	settings,
	onSettingsChange,
}: SettingsDialogProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		// Sync dialog open/close state
		if (dialogRef.current) {
			if (isOpen && !dialogRef.current.open) {
				dialogRef.current.showModal();
			}
			else if (!isOpen && dialogRef.current.open) {
				dialogRef.current.close();
			}
		}
	}, [isOpen]);

	return (
		<dialog
			ref={dialogRef}
			onClose={onClose}
			className="inset-0 w-full h-full max-w-none max-h-none bg-transparent backdrop:bg-black/30">
			<div className="h-full max-h-none flex flex-col items-stretch justify-center">
				{/* Trick to center the dialog while maintaining maximum width when the screen has room for it */}
				<div className="max-h-full">
					<div className="p-6">
						<div className="mx-auto bg-white rounded-lg shadow-lg p-6 max-w-2xl">
							<h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
								<GearIcon size={22} className="relative top-px" />Settings
							</h2>

							<div className="space-y-6">
								<AudioFileSelector
									audioFile={audioFile}
									onAudioFileChange={onAudioFileChange} />

								<RecordingMethodSelector
									recordingMethod={recordingMethod}
									onRecordingMethodChange={onRecordingMethodChange} />

								<fieldset>
									<legend className="block font-semibold text-gray-700 mb-2">
										Audio Playback Keyboard Controls
									</legend>
									<div className="space-y-2">
										<div className="flex items-baseline gap-2">
											<label className="contents">
												<span className="font-medium flex-1 text-right">Speed Change Factor:</span>
												<input
													type="number"
													min="1"
													max="10"
													value={settings.speedChangeFactor}
													onChange={e => onSettingsChange({ ...settings, speedChangeFactor: Number(e.target.value) })}
													className="border border-gray-300 rounded px-2 py-1" />
											</label>
											<span className="text-sm text-gray-600 w-7/12">
												↑/↓ Arrow keys slow down/speed up by 2<sup aria-label="1 over x" className="inline-block text-center">
													<div className="border-b px-0.5 leading-[1.2]">1</div>
													<div className="px-0.5 leading-[0.8]">x</div>
												</sup>{" "}
												factor
											</span>
										</div>
										<div className="flex items-baseline gap-2">
											<label className="contents">
												<span className="font-medium flex-1 text-right">Seek Seconds:</span>
												<input
													type="number"
													min="1"
													max="30"
													value={settings.seekSeconds}
													onChange={e => onSettingsChange({ ...settings, seekSeconds: Number(e.target.value) })}
													className="border border-gray-300 rounded px-2 py-1" />
											</label>
											<span className="text-sm text-gray-600 w-7/12">
												←/→ Arrow keys seek forward/backward by n seconds
											</span>
										</div>
									</div>
								</fieldset>

								<div className="flex justify-end gap-4">
									<button
										onClick={onClose}
										className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded transition-colors cursor-pointer">
										Close
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</dialog>
	);
}
