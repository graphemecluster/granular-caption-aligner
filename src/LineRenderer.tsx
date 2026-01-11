import TokenRenderer from "./TokenRenderer";

import type { GranularLine, GranularToken } from "./types";

interface LineRendererProps {
	line: GranularLine;
	pendingStartToken: GranularToken | null;
	pendingEndToken: GranularToken | null;
	className?: string;
}

export default function LineRenderer({ line, pendingStartToken, pendingEndToken, className }: LineRendererProps) {
	// Don't add !line.isSignificant - insignificant tokens may be visible
	if (!line.tokens.length) {
		// When there are no tokens, render a non-breaking space to maintain a regular line height
		return <div className={className}>&nbsp;</div>;
	}

	return (
		<div className={className}>
			{line.tokens.map((token, tokenIndex) => (
				<TokenRenderer
					key={tokenIndex}
					text={token.text}
					isSignificant={token.isSignificant}
					isPartiallyRecorded={token.startTime !== undefined}
					isRecorded={token.startTime !== undefined && token.endTime !== undefined}
					isPendingStart={token === pendingStartToken}
					isPendingEnd={token === pendingEndToken} />
			))}
		</div>
	);
}
