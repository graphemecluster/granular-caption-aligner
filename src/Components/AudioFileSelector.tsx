interface AudioFileSelectorProps {
	audioFile: File | null;
	onAudioFileChange: (file: File | null) => void;
}

export default function AudioFileSelector({ audioFile, onAudioFileChange }: AudioFileSelectorProps) {
	return (
		<fieldset>
			<legend className="block font-semibold text-gray-700 mb-2">
				Audio File
			</legend>
			<input
				type="file"
				accept="audio/*"
				onChange={e => onAudioFileChange(e.target.files?.[0] || null)}
				className="w-full border border-gray-300 rounded px-3 py-2" />
			{audioFile && <p className="text-sm text-gray-600 mt-1">{audioFile.name}</p>}
		</fieldset>
	);
}
