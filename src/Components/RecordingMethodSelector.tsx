import type { RecordingMethod } from "../types";

interface RecordingMethodSelectorProps {
	recordingMethod: RecordingMethod;
	onRecordingMethodChange: (method: RecordingMethod) => void;
}

export default function RecordingMethodSelector({ recordingMethod, onRecordingMethodChange }: RecordingMethodSelectorProps) {
	return (
		<fieldset>
			<legend className="block font-semibold text-gray-700 mb-2">
				Recording Method
			</legend>
			<div className="space-y-2">
				<label className="flex items-baseline">
					<input
						type="radio"
						value="spacebarStartEnterEnd"
						checked={recordingMethod === "spacebarStartEnterEnd"}
						onChange={e => onRecordingMethodChange(e.target.value as RecordingMethod)}
						className="mr-2" />
					<span>Spacebar for start, Enter for end (optional)</span>
				</label>
				<label className="flex items-baseline">
					<input
						type="radio"
						value="spacebarStartRelease"
						checked={recordingMethod === "spacebarStartRelease"}
						onChange={e => onRecordingMethodChange(e.target.value as RecordingMethod)}
						className="mr-2" />
					<span>Spacebar press for start, release for end</span>
				</label>
				<label className="flex items-baseline">
					<input
						type="radio"
						value="midi"
						checked={recordingMethod === "midi"}
						onChange={e => onRecordingMethodChange(e.target.value as RecordingMethod)}
						className="mr-2"
						disabled />
					<span className="text-gray-400">MIDI Keyboard (future)</span>
				</label>
			</div>
		</fieldset>
	);
}
