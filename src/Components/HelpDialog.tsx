import { useRef } from "react";

import { QuestionIcon } from "@primer/octicons-react";

interface HelpDialogProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function HelpDialog({ isOpen, onClose }: HelpDialogProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);

	// Sync dialog open/close state
	if (dialogRef.current) {
		if (isOpen && !dialogRef.current.open) {
			dialogRef.current.showModal();
		}
		else if (!isOpen && dialogRef.current.open) {
			dialogRef.current.close();
		}
	}

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
								<QuestionIcon size={22} className="relative top-px" />Keyboard Controls
							</h2>

							<div className="space-y-6">
								{/* Recording Controls */}
								<section>
									<h3 className="text-lg font-semibold mb-2 text-gray-800">Recording Controls</h3>
									<div className="space-y-1">
										<div className="flex items-baseline gap-4">
											<div className="flex gap-2 min-w-36">
												<kbd>Space</kbd> or <kbd>Z</kbd>
											</div>
											<span className="text-gray-700">Mark start time (release to mark end for “press/release” method)</span>
										</div>
										<div className="flex items-baseline gap-4">
											<div className="flex gap-2 min-w-36">
												<kbd>Enter</kbd> or <kbd>C</kbd>
											</div>
											<span className="text-gray-700">Mark end time (optional)</span>
										</div>
										<div className="flex items-baseline gap-4">
											<div className="flex gap-2 min-w-36">
												<kbd>A</kbd>
											</div>
											<span className="text-gray-700">Previous token (clear current)</span>
										</div>
										<div className="flex items-baseline gap-4">
											<div className="flex gap-2 min-w-36">
												<kbd>D</kbd>
											</div>
											<span className="text-gray-700">Next token (skip current)</span>
										</div>
									</div>
								</section>

								{/* Line Navigation */}
								<section>
									<h3 className="text-lg font-semibold mb-2 text-gray-800">Line Navigation</h3>
									<div className="space-y-1">
										<div className="flex items-baseline gap-4">
											<div className="flex gap-2 min-w-36">
												<kbd>W</kbd>
											</div>
											<span className="text-gray-700">Previous line</span>
										</div>
										<div className="flex items-baseline gap-4">
											<div className="flex gap-2 min-w-36">
												<kbd>S</kbd>
											</div>
											<span className="text-gray-700">Next line</span>
										</div>
										<div className="flex items-baseline gap-4">
											<div className="flex gap-2 min-w-36">
												<kbd>Home</kbd>
											</div>
											<span className="text-gray-700">Jump to first line</span>
										</div>
										<div className="flex items-baseline gap-4">
											<div className="flex gap-2 min-w-36">
												<kbd>End</kbd>
											</div>
											<span className="text-gray-700">Jump to last line</span>
										</div>
										<div className="flex items-baseline gap-4">
											<div className="flex gap-2 min-w-36">
												<kbd>Page Up</kbd>
											</div>
											<span className="text-gray-700">Jump 5 lines backward</span>
										</div>
										<div className="flex items-baseline gap-4">
											<div className="flex gap-2 min-w-36">
												<kbd>Page Down</kbd>
											</div>
											<span className="text-gray-700">Jump 5 lines forward</span>
										</div>
										<div className="flex items-baseline gap-4">
											<div className="flex gap-2 min-w-36">
												Mouse Wheel
											</div>
											<span className="text-gray-700">Scroll through lines</span>
										</div>
									</div>
								</section>

								{/* Audio Playback */}
								<section>
									<h3 className="text-lg font-semibold mb-2 text-gray-800">Audio Playback</h3>
									<div className="space-y-1">
										<div className="flex items-baseline gap-4">
											<div className="flex gap-2 min-w-36">
												<kbd>Numpad 0</kbd>
											</div>
											<span className="text-gray-700">Play/pause audio</span>
										</div>
										<div className="flex items-baseline gap-4">
											<div className="flex gap-2 min-w-36">
												<kbd>↑</kbd>
											</div>
											<span className="text-gray-700">Speed up playback</span>
										</div>
										<div className="flex items-baseline gap-4">
											<div className="flex gap-2 min-w-36">
												<kbd>↓</kbd>
											</div>
											<span className="text-gray-700">Slow down playback</span>
										</div>
										<div className="flex items-baseline gap-4">
											<div className="flex gap-2 min-w-36">
												<kbd>←</kbd>
											</div>
											<span className="text-gray-700">Seek backward</span>
										</div>
										<div className="flex items-baseline gap-4">
											<div className="flex gap-2 min-w-36">
												<kbd>→</kbd>
											</div>
											<span className="text-gray-700">Seek forward</span>
										</div>
									</div>
								</section>

								{/* File Operations */}
								<section>
									<h3 className="text-lg font-semibold mb-2 text-gray-800">File Operations</h3>
									<div className="space-y-1">
										<div className="flex items-baseline gap-4">
											<div className="flex gap-2 min-w-36">
												<kbd>Ctrl</kbd> + <kbd>S</kbd>
											</div>
											<span className="text-gray-700">Save aligned captions as .gst file</span>
										</div>
									</div>
								</section>

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
