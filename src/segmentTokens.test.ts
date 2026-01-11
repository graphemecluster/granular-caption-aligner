import { describe, expect, spyOn, test } from "bun:test";

import segmentTokens from "./segmentTokens";
import * as segmentTokensModule from "./segmentTokens";

import type { GranularToken } from "./types";

// Helper to extract token texts
function getTokenTexts(tokens: GranularToken[]): string[] {
	return tokens.map(t => t.text);
}

// Helper to extract significant flags
function getSignificance(tokens: GranularToken[]): boolean[] {
	return tokens.map(t => t.isSignificant);
}

describe("segmentTokens - Whole Line granularity", () => {
	test("ignore mode: English with trailing punctuation", () => {
		const input = "Hello world.";
		const result = segmentTokens(input, "wholeLine", "ignore");
		const texts = getTokenTexts(result);
		const significance = getSignificance(result);

		expect(texts).toEqual(["Hello world", "."]);
		expect(significance).toEqual([true, false]);
	});

	test("ignore mode: Chinese with trailing punctuation", () => {
		const input = "字字字。";
		const result = segmentTokens(input, "wholeLine", "ignore");
		const texts = getTokenTexts(result);
		const significance = getSignificance(result);

		expect(texts).toEqual(["字字字", "。"]);
		expect(significance).toEqual([true, false]);
	});

	test("ignore mode: Mixed English and Chinese with punctuation", () => {
		const input = "Hello字字，";
		const result = segmentTokens(input, "wholeLine", "ignore");
		const texts = getTokenTexts(result);
		const significance = getSignificance(result);

		expect(texts).toEqual(["Hello字字", "，"]);
		expect(significance).toEqual([true, false]);
	});

	test("partOfPrevious mode: treats entire line as significant", () => {
		const input = "Hello world.";
		const result = segmentTokens(input, "wholeLine", "partOfPrevious");
		const texts = getTokenTexts(result);
		const significance = getSignificance(result);

		expect(texts).toEqual(["Hello world."]);
		expect(significance).toEqual([true]);
	});

	test("partOfPrevious mode: Chinese with punctuation", () => {
		const input = "字字字。";
		const result = segmentTokens(input, "wholeLine", "partOfPrevious");
		const texts = getTokenTexts(result);
		const significance = getSignificance(result);

		expect(texts).toEqual(["字字字。"]);
		expect(significance).toEqual([true]);
	});
});

describe("segmentTokens - Word granularity", () => {
	test("ignore mode: English separates words and punctuation", () => {
		const input = "Hello world.";
		const result = segmentTokens(input, "word", "ignore");
		const texts = getTokenTexts(result);
		const significance = getSignificance(result);

		expect(texts).toEqual(["Hello", " ", "world", "."]);
		expect(significance).toEqual([true, false, true, false]);
	});

	test("ignore mode: Chinese characters as separate words", () => {
		const input = "字字字。";
		const result = segmentTokens(input, "word", "ignore");
		const texts = getTokenTexts(result);
		const significance = getSignificance(result);

		// Based on hint: 字, 字字, 。
		expect(texts).toEqual(["字", "字字", "。"]);
		expect(significance).toEqual([true, true, false]);
	});

	test("ignore mode: Mixed text", () => {
		const input = "Hello字字English，";
		const result = segmentTokens(input, "word", "ignore");
		const texts = getTokenTexts(result);
		const significance = getSignificance(result);

		expect(texts).toEqual(["Hello", "字字", "English", "，"]);
		expect(significance).toEqual([true, true, true, false]);
	});

	test("partOfPrevious mode: fuses punctuation into words", () => {
		const input = "Hello world.";
		const result = segmentTokens(input, "word", "partOfPrevious");
		const texts = getTokenTexts(result);
		const significance = getSignificance(result);

		// First token "Hello" is significant, space " " is insignificant, "world." is significant (has previous word)
		expect(texts).toEqual(["Hello", " ", "world."]);
		expect(significance).toEqual([true, false, true]);
	});

	test("partOfPrevious mode: Chinese with punctuation", () => {
		const input = "字字字。";
		const result = segmentTokens(input, "word", "partOfPrevious");
		const texts = getTokenTexts(result);
		const significance = getSignificance(result);

		expect(texts).toEqual(["字", "字字。"]);
		expect(significance).toEqual([true, true]);
	});

	test("partOfPrevious mode: Multiple words with trailing punctuation", () => {
		const input = "字字English字字。";
		const result = segmentTokens(input, "word", "partOfPrevious");
		const texts = getTokenTexts(result);
		const significance = getSignificance(result);

		expect(texts).toEqual(["字字", "English", "字字。"]);
		expect(significance).toEqual([true, true, true]);
	});
});

describe("segmentTokens - Pipe granularity", () => {
	test("ignore mode: splits by pipe and separates trailing punctuation", () => {
		const input = "Hello|world.";
		const result = segmentTokens(input, "pipe", "ignore");
		const texts = getTokenTexts(result);
		const significance = getSignificance(result);

		expect(texts).toEqual(["Hello", "world", "."]);
		expect(significance).toEqual([true, true, false]);
	});

	test("ignore mode: Chinese with pipes and punctuation", () => {
		const input = "字字|字字。";
		const result = segmentTokens(input, "pipe", "ignore");
		const texts = getTokenTexts(result);
		const significance = getSignificance(result);

		expect(texts).toEqual(["字字", "字字", "。"]);
		expect(significance).toEqual([true, true, false]);
	});

	test("ignore mode: Escaped pipe using backtick", () => {
		const input = "Hello`|world";
		const result = segmentTokens(input, "pipe", "ignore");
		const texts = getTokenTexts(result);
		const significance = getSignificance(result);

		expect(texts).toEqual(["Hello|world"]);
		expect(significance).toEqual([true]);
	});

	test("ignore mode: Hello|，|world - three tokens", () => {
		const input = "Hello|，|world";
		const result = segmentTokens(input, "pipe", "ignore");
		const texts = getTokenTexts(result);
		const significance = getSignificance(result);

		expect(texts).toEqual(["Hello", "，", "world"]);
		expect(significance).toEqual([true, false, true]);
	});

	test("ignore mode: Hello|，world - three tokens", () => {
		const input = "Hello|，world";
		const result = segmentTokens(input, "pipe", "ignore");
		const texts = getTokenTexts(result);
		const significance = getSignificance(result);

		expect(texts).toEqual(["Hello", "，", "world"]);
		expect(significance).toEqual([true, false, true]);
	});

	test("ignore mode: Hello，|world - three tokens", () => {
		const input = "Hello，|world";
		const result = segmentTokens(input, "pipe", "ignore");
		const texts = getTokenTexts(result);
		const significance = getSignificance(result);

		expect(texts).toEqual(["Hello", "，", "world"]);
		expect(significance).toEqual([true, false, true]);
	});

	test("partOfPrevious mode: Hello|，|world - two significant tokens", () => {
		const input = "Hello|，|world";
		const result = segmentTokens(input, "pipe", "partOfPrevious");
		const texts = getTokenTexts(result);
		const significance = getSignificance(result);

		// Should work like Hello，|world - comma fuses with previous
		expect(texts).toEqual(["Hello，", "world"]);
		expect(significance).toEqual([true, true]);
	});

	test("partOfPrevious mode: Hello|，world - two significant tokens", () => {
		const input = "Hello|，world";
		const result = segmentTokens(input, "pipe", "partOfPrevious");
		const texts = getTokenTexts(result);
		const significance = getSignificance(result);

		// Leading comma before world should fuse with Hello
		expect(texts).toEqual(["Hello，", "world"]);
		expect(significance).toEqual([true, true]);
	});

	test("partOfPrevious mode: Hello，|world - two significant tokens", () => {
		const input = "Hello，|world";
		const result = segmentTokens(input, "pipe", "partOfPrevious");
		const texts = getTokenTexts(result);
		const significance = getSignificance(result);

		// Comma after Hello stays with Hello
		expect(texts).toEqual(["Hello，", "world"]);
		expect(significance).toEqual([true, true]);
	});

	test("partOfPrevious mode: leading punctuation fuses with previous", () => {
		const input = "Hello|，world";
		const result = segmentTokens(input, "pipe", "partOfPrevious");
		const texts = getTokenTexts(result);
		const significance = getSignificance(result);

		// Leading "，" before "world" should be fused into previous segment
		expect(texts).toEqual(["Hello，", "world"]);
		expect(significance).toEqual([true, true]);
	});

	test("partOfPrevious mode: segment starting with word has no leading punctuation to fuse", () => {
		const input = "Hello|world";
		const result = segmentTokens(input, "pipe", "partOfPrevious");
		const texts = getTokenTexts(result);
		const significance = getSignificance(result);

		expect(texts).toEqual(["Hello", "world"]);
		expect(significance).toEqual([true, true]);
	});

	test("partOfPrevious mode: Chinese with leading punctuation", () => {
		const input = "字字|，字字";
		const result = segmentTokens(input, "pipe", "partOfPrevious");
		const texts = getTokenTexts(result);
		const significance = getSignificance(result);

		expect(texts).toEqual(["字字，", "字字"]);
		expect(significance).toEqual([true, true]);
	});
});

describe("segmentTokens - Character granularity", () => {
	// Mock segmentByLineBreakingOpportunity for testing since DOM isn't available in tests
	// Based on the hint: "Hello world.字字字English，字字English字字。字字。"
	// breaks as: "Hello |world.|字|字|字|English，|字|字|English|字|字。|字|字。|"

	test("ignore mode: Mixed content with line breaks - separates trailing punctuation", () => {
		const input = "Hello world.字字字English，字字English字字。字字。";

		// Mock the line breaking function to return our expected segments
		spyOn(segmentTokensModule, "segmentByLineBreakingOpportunity").mockReturnValue(["Hello ", "world.", "字", "字", "字", "English，", "字", "字", "English", "字", "字。", "字", "字。"]);

		// This test verifies punctuation handling logic
		// Each segment should have trailing punctuation separated in ignore mode
		const result = segmentTokens(input, "character", "ignore");
		const texts = getTokenTexts(result);
		const significance = getSignificance(result);

		// Verify that punctuation-only tokens are insignificant
		for (let i = 0; i < texts.length; i++) {
			const token = texts[i];
			const isSignificant = significance[i];

			if (/^[.,，。]+$/.test(token)) {
				expect(isSignificant).toBe(false);
			}
		}
	});

	test("ignore mode: English with trailing period", () => {
		const input = "Hello.";
		const result = segmentTokens(input, "character", "ignore");
		const texts = getTokenTexts(result);
		const significance = getSignificance(result);

		// Last token should be insignificant punctuation
		const lastToken = texts[texts.length - 1];
		const lastSignificance = significance[significance.length - 1];

		expect(lastToken).toMatch(/[.。]/);
		expect(lastSignificance).toBe(false);
	});

	test("ignore mode: Chinese with trailing punctuation", () => {
		const input = "字字。";
		const result = segmentTokens(input, "character", "ignore");
		const significance = getSignificance(result);

		// Last token should be insignificant
		const lastSignificance = significance[significance.length - 1];
		expect(lastSignificance).toBe(false);
	});

	test("partOfPrevious mode: English with punctuation", () => {
		const input = "Hello.";
		const result = segmentTokens(input, "character", "partOfPrevious");
		const significance = getSignificance(result);

		// All segments should be significant when using partOfPrevious
		expect(significance.every(s => s)).toBe(true);
	});

	test("partOfPrevious mode: Mixed content", () => {
		const input = "Hello world.字字。";
		const result = segmentTokens(input, "character", "partOfPrevious");
		const significance = getSignificance(result);

		// All segments should be significant
		expect(significance.every(s => s)).toBe(true);
	});

	test("partOfPrevious mode: Chinese with comma and period", () => {
		const input = "字字English，字字。";
		const result = segmentTokens(input, "character", "partOfPrevious");
		const texts = getTokenTexts(result);
		const significance = getSignificance(result);

		// All segments should be significant
		expect(significance.every(s => s)).toBe(true);

		// Should have the complete text (cleaned of escapes)
		const joinedText = texts.join("");
		expect(joinedText).toContain("字字");
		expect(joinedText).toContain("English");
	});
});

describe("segmentTokens - Edge cases", () => {
	test("Empty line - ignore mode", () => {
		const input = "";
		const result = segmentTokens(input, "word", "ignore");
		const significance = getSignificance(result);

		// All segments should be insignificant
		expect(significance.every(s => !s)).toBe(true);
		expect(result).toEqual([]);
	});

	test("Only punctuation - ignore mode", () => {
		const input = "...";
		const result = segmentTokens(input, "word", "ignore");
		const significance = getSignificance(result);

		// All segments should be insignificant
		expect(significance.every(s => !s)).toBe(true);
	});

	test("Only punctuation - partOfPrevious mode", () => {
		const input = "...";
		const result = segmentTokens(input, "word", "partOfPrevious");
		const texts = getTokenTexts(result);

		// Should still have the text
		expect(texts.join("")).toBe("...");
	});

	test("Complex mixed content", () => {
		const input = "Hello world.字字字English，字字English字字。字字。";
		const result = segmentTokens(input, "word", "ignore");
		const texts = getTokenTexts(result);
		const significance = getSignificance(result);

		// Based on the hint about word segmentation
		expect(texts).toContain("Hello");
		expect(texts).toContain("world");
		expect(texts).toContain("English");

		// Commas and periods should be insignificant
		const punctuationIndices = texts
			.map((text, idx) => ({ text, idx }))
			.filter(({ text }) => /[.,，。]/.test(text))
			.map(({ idx }) => idx);

		punctuationIndices.forEach(idx => {
			expect(significance[idx]).toBe(false);
		});
	});
});
