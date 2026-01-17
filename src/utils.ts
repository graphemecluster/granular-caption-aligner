/**
 * Format seconds to (HH:)MM:SS.mmm format
 */
// Actually sexagesimal number with a minimum of 2 elements
export function formatTime(seconds: number): string {
	const units = [String((seconds % 60).toFixed(3)).padStart(6, "0")];
	seconds = Math.floor(seconds / 60);
	// Use `do` for a minimum of 2 elements
	do {
		units.unshift(String(seconds % 60).padStart(2, "0"));
	}
	while ((seconds = Math.floor(seconds / 60)));
	return units.join(":");
}

/**
 * Format playback rate for display (e.g., "2.00x")
 */
export function formatPlaybackRate(rate: number): string {
	return `${rate.toFixed(2)}x`;
}

/**
 * Format volume as percentage (e.g., "75%")
 */
export function formatVolume(volume: number): string {
	return `${Math.round(volume * 100)}%`;
}
