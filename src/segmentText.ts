import LineBreaker from "linebreak";

import parseText from "./parseText";

import type { Break } from "linebreak";

import type { GranularToken, SegmentationOptions } from "./types";

const wordSegmenter = new Intl.Segmenter("zxx", { granularity: "word" });

// Returns a set including 0 (and text.length if text is not empty)
function getLineBreakingOpportunities(text: string): Set<number> {
	const opportunities = new Set([0]);
	const lineBreaker = new LineBreaker(text);
	let opportunity: Break | null;
	while ((opportunity = lineBreaker.nextBreak())) {
		opportunities.add(opportunity.position);
	}
	opportunities.add(text.length);
	return opportunities;
}

export default function segmentText(line: string, options: SegmentationOptions): GranularToken[] {
	// Parse text and extract pipe and suppression positions
	const { text, pipeIndices, suppressionIndices } = parseText(line);

	if (!text) {
		return [];
	}

	// Pre-segment the text using Unicode word segmentation
	const segments = wordSegmenter.segment(text);
	const lineBreakingOpportunities = getLineBreakingOpportunities(text);

	// Start with pipe boundaries (manual segmentation markers)
	const boundaries = new Set([0, text.length]);
	for (const boundary of pipeIndices) {
		boundaries.add(boundary);
	}

	// Add character boundaries if character segmentation is enabled
	if (options.character) {
		for (const boundary of lineBreakingOpportunities) {
			boundaries.add(boundary);
		}
	}

	// Add word boundaries if word segmentation is enabled
	if (options.word) {
		for (const segment of segments) {
			boundaries.add(segment.index);
		}
	}

	// Adjust boundaries based on line breaking opportunities and punctuation mode
	// This algorithm merges or separates punctuation depending on the mode
	const lineBreakingOpportunitiesArray = Array.from(lineBreakingOpportunities).sort((a, b) => a - b);
	for (let i = 0; i < lineBreakingOpportunitiesArray.length; i++) {
		const index = lineBreakingOpportunitiesArray[i];

		// Check if there are boundaries around this line breaking opportunity
		// and if either segment around it contains non-word-like characters
		let foundBoundary = false;

		// Check if there's a boundary exactly at this line breaking opportunity
		// and either the character before or after it is non-word-like
		if (
			boundaries.has(index)
			&& (!(segments.containing(index)?.isWordLike ?? true) || !(segments.containing(index - 1)?.isWordLike ?? true))
		) {
			boundaries.delete(index);
			foundBoundary = true;
		}

		// Scan leftward through consecutive non-word-like segments removing any boundaries found within this range
		let leftMost = index - 1;
		for (; leftMost >= 0 && !(segments.containing(leftMost)?.isWordLike ?? true); leftMost--) {
			if (boundaries.has(leftMost)) {
				boundaries.delete(leftMost);
				foundBoundary = true;
			}
		}

		// Scan rightward through consecutive non-word-like segments removing any boundaries found within this range
		let rightMost = index + 1;
		for (; rightMost <= text.length && !(segments.containing(rightMost - 1)?.isWordLike ?? true); rightMost++) {
			if (boundaries.has(rightMost)) {
				boundaries.delete(rightMost);
				foundBoundary = true;
			}
		}

		// Find the right-most line breaking opportunity within the non-word-like range
		// This is used in merge mode to include punctuation with words
		let rightMostOpportunity = index;
		for (let j = i + 1; j < lineBreakingOpportunitiesArray.length && lineBreakingOpportunitiesArray[j] < rightMost; j++) {
			rightMostOpportunity = lineBreakingOpportunitiesArray[j];
			i = j; // Skip already processed opportunities
		}

		// If there was at least one boundary around this line breaking opportunity,
		// add new boundaries according to the punctuation mode
		if (foundBoundary) {
			switch (options.punctuation) {
				case "ignore": {
					// Separate punctuation: add boundaries immediately before and after the non-word-like segment range
					boundaries.add(leftMost + 1);
					boundaries.add(rightMost - 1);
					break;
				}
				case "merge": {
					// Merge punctuation with words: add boundaries at line breaking opportunities within the non-word-like range
					boundaries.add(index);
					boundaries.add(rightMostOpportunity);
					// Segments between index and rightMostOpportunity will be insignificant
					break;
				}
			}
		}
	}

	// Ensure the start and end of the string are included
	// (they may have been removed during adjustment in merge mode)
	boundaries.add(0);
	boundaries.add(text.length);
	const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);

	// Determine significance for each segment and collapse consecutive insignificant segments
	// A segment is insignificant if it contains only non-word-like characters
	// Handle suppression: backslash in insignificant tokens removes boundaries
	let previousIsInsignificant = false;
	let suppressionFlag = false; // Set when backslash found in insignificant token
	const collapsedBoundaries: { start: number; isSignificant: boolean }[] = [];
	for (let i = 0; i < sortedBoundaries.length - 1; i++) {
		const start = sortedBoundaries[i];
		const end = sortedBoundaries[i + 1];

		// Skip invalid boundaries
		if (start < 0 || end <= 0 || start >= text.length || end > text.length || start >= end) {
			continue;
		}

		// Check if any character in this segment is word-like
		let isSignificant = false;
		for (let j = start; j < end; j++) {
			isSignificant ||= segments.containing(j)?.isWordLike ?? true;
		}

		if (isSignificant) {
			// Check if we should suppress this boundary due to backslash
			if (suppressionFlag || suppressionIndices.has(start)) {
				// Don't add boundary, merge with previous token
				suppressionFlag = false;
			}
			else {
				// Add significant segment normally
				collapsedBoundaries.push({ start, isSignificant: true });
			}
			previousIsInsignificant = false;
		}
		else if (suppressionFlag) {
			// We're in suppression mode from a previous insignificant token
			// Don't add boundary - let this merge with the suppressed sequence
		}
		else {
			// Insignificant token - check for suppression indices
			let hasSuppressionInRange = false;
			for (let j = start; j <= end; j++) {
				if (suppressionIndices.has(j)) {
					hasSuppressionInRange = true;
					break;
				}
			}

			if (hasSuppressionInRange) {
				// Set flag and pop any previous insignificant boundary
				suppressionFlag = true;
				if (previousIsInsignificant && collapsedBoundaries.length > 0) {
					collapsedBoundaries.pop();
				}
				previousIsInsignificant = false;
			}
			else if (previousIsInsignificant) {
				// Collapse consecutive insignificant segments into one
				// by not adding a new boundary here
			}
			else {
				// Add first insignificant segment in a sequence
				collapsedBoundaries.push({ start, isSignificant: false });
				previousIsInsignificant = true;
			}
		}
	}

	// Add final boundary marker
	collapsedBoundaries.push({ start: text.length, isSignificant: false });

	// Extract text substrings from collapsed boundaries
	const tokens: GranularToken[] = [];
	for (let i = 0; i < collapsedBoundaries.length - 1; i++) {
		const start = collapsedBoundaries[i].start;
		const end = collapsedBoundaries[i + 1].start;

		tokens.push({
			text: text.slice(start, end),
			isSignificant: collapsedBoundaries[i].isSignificant,
		});
	}

	return tokens;
}
