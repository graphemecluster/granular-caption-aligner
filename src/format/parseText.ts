interface ParsedText {
	text: string;
	pipeIndices: Set<number>;
	suppressionIndices: Set<number>;
}

// Parse special characters and extract pipe and suppression positions
export default function parseText(input: string): ParsedText {
	const pipeIndices = new Set<number>([0]);
	const suppressionIndices = new Set<number>();
	let text = "";
	let escaped = false;

	for (const char of input) {
		if (escaped) {
			// Process escape sequences
			switch (char) {
				case "n":
					text += "\n";
					break;
				case "r":
					text += "\r";
					break;
				case "t":
					text += "\t";
					break;
				case "|":
				case "\\":
				case "{":
				case "}":
				case "[":
				case "]":
				case "<":
				case ">":
				case "`":
					text += char;
					break;
				default:
					// Invalid escape, keep both backtick and char
					text += `\`${char}`;
			}
			escaped = false;
		}
		else if (char === "`") {
			escaped = true;
		}
		else if (char === "|") {
			// Record pipe position in the output text (before removing it)
			pipeIndices.add(text.length);
			// Don't include the pipe in the output
		}
		else if (char === "\\") {
			// Record suppression position (before removing it)
			suppressionIndices.add(text.length);
			// Don't include the backslash in the output
		}
		else {
			text += char;
		}
	}

	if (escaped) {
		// Trailing backtick
		text += "`";
	}

	pipeIndices.add(text.length);
	return { text, pipeIndices, suppressionIndices };
}
