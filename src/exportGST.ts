import type { GranularLine } from "./types";

function formatTime(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${String(mins).padStart(2, "0")}:${String(secs.toFixed(3)).padStart(6, "0")}`;
}

const specialCharsMapping: Record<string, string | undefined> = {
	"\n": "n",
	"\r": "r",
	"\t": "t",
};

function escapeSpecialChars(text: string): string {
	const specialChars = /[\n\r\t|\\{}[\]<>`]/g;
	return text.replace(specialChars, match => `\`${specialCharsMapping[match] || match}`);
}

export default function exportGST(lines: GranularLine[]): string {
	const result: string[] = [];

	for (const line of lines) {
		const lineTokens: string[] = [];

		for (const token of line.tokens) {
			if (!token.isSignificant) {
				lineTokens.push(escapeSpecialChars(token.text));
			}
			else if (token.startTime !== undefined || token.endTime !== undefined) {
				const start = token.startTime === undefined ? "" : formatTime(token.startTime);
				const end = token.endTime === undefined ? "" : formatTime(token.endTime);
				const text = escapeSpecialChars(token.text);
				lineTokens.push(`{${start}|${end}|${text}}`);
			}
			else {
				// Not yet recorded - export with pipe separator
				lineTokens.push(escapeSpecialChars(token.text));
			}
		}

		result.push(lineTokens.join(""));
	}

	return result.join("\n");
}
