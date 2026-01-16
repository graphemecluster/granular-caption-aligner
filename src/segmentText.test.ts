import { describe, expect, test } from "bun:test";

import segmentText from "./segmentText";

import type { SegmentationOptions } from "./types";

// Common option objects
const NO_AUTO = { character: false, word: false, punctuation: "ignore" } as const;
const NO_AUTO_MERGE = { character: false, word: false, punctuation: "merge" } as const;
const CHAR_IGNORE = { character: true, word: false, punctuation: "ignore" } as const;
const CHAR_MERGE = { character: true, word: false, punctuation: "merge" } as const;
const WORD_IGNORE = { character: false, word: true, punctuation: "ignore" } as const;
const WORD_MERGE = { character: false, word: true, punctuation: "merge" } as const;

// Helper to extract token texts
function getTokenTexts(options: SegmentationOptions, input: string): string[] {
	return segmentText(input, options).map(t => t.text);
}

// Helper to extract significant flags
function getSignificance(options: SegmentationOptions, input: string): boolean[] {
	return segmentText(input, options).map(t => t.isSignificant);
}

describe("Punctuation-only text", () => {
	test("All insignificant in both ignore and merge mode", () => {
		const input = "*()「.,」+-";

		// All tokens should be insignificant regardless of segmentation mode
		expect(getSignificance(NO_AUTO, input)).toEqual([false]);
		expect(getSignificance(NO_AUTO_MERGE, input)).toEqual([false]);
		expect(getSignificance(CHAR_IGNORE, input)).toEqual([false]);
		expect(getSignificance(CHAR_MERGE, input)).toEqual([false]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([false]);
		expect(getSignificance(WORD_MERGE, input)).toEqual([false]);
	});
});

describe("Punctuation and pipe combinations", () => {
	test("English with period - word ignore", () => {
		const input = "Hello world.";
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["Hello", " ", "world", "."]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true, false, true, false]);
	});

	test("Mixed English-CJK with period - word ignore", () => {
		const input = "Hello字字English。";
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["Hello", "字字", "English", "。"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true, true, true, false]);
	});

	test("CJK-English-CJK with period - word ignore", () => {
		const input = "字字English字字。";
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["字字", "English", "字字", "。"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true, true, true, false]);
	});

	test("English with comma, no pipe - word ignore", () => {
		const input = "Hello，world";
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["Hello", "，", "world"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true, false, true]);
	});

	test("Pipe after Hello, comma before world - word ignore", () => {
		const input = "Hello|，world";
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["Hello", "，", "world"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true, false, true]);
	});

	test("Comma after Hello, pipe before world - word ignore", () => {
		const input = "Hello，|world";
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["Hello", "，", "world"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true, false, true]);
	});

	test("Pipes on both sides of comma - word ignore", () => {
		const input = "Hello|，|world";
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["Hello", "，", "world"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true, false, true]);
	});

	test("CJK with comma, no pipe - word ignore", () => {
		const input = "字字，字字";
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["字字", "，", "字字"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true, false, true]);
	});

	test("CJK: pipe after first, comma before second - word ignore", () => {
		const input = "字字|，字字";
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["字字", "，", "字字"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true, false, true]);
	});

	test("CJK: comma after first, pipe before second - word ignore", () => {
		const input = "字字，|字字";
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["字字", "，", "字字"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true, false, true]);
	});

	test("CJK: pipes on both sides of comma - word ignore", () => {
		const input = "字字|，|字字";
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["字字", "，", "字字"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true, false, true]);
	});

	test("English-CJK mixed with punctuation - word ignore", () => {
		const input = "Hello world.字字。";
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["Hello", " ", "world", ".", "字字", "。"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true, false, true, false, true, false]);
	});

	test("CJK-English-CJK mixed with punctuation - word ignore", () => {
		const input = "字字English，字字。";
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["字字", "English", "，", "字字", "。"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true, true, false, true, false]);
	});
});

describe("CJK text with punctuation", () => {
	const input = "「字字，字。」";

	test("No auto segmentation, merge mode: whole line", () => {
		expect(getTokenTexts(NO_AUTO_MERGE, input)).toEqual(["「字字，字。」"]);
		expect(getSignificance(NO_AUTO_MERGE, input)).toEqual([true]);
	});

	test("No auto segmentation, ignore mode: only 字字，字 is significant", () => {
		expect(getTokenTexts(NO_AUTO, input)).toEqual(["「", "字字，字", "。」"]);
		expect(getSignificance(NO_AUTO, input)).toEqual([false, true, false]);
	});

	test("Character segmentation, ignore mode: each 字 is significant", () => {
		expect(getTokenTexts(CHAR_IGNORE, input)).toEqual(["「", "字", "字", "，", "字", "。」"]);
		expect(getSignificance(CHAR_IGNORE, input)).toEqual([false, true, true, false, true, false]);
	});

	test("Character segmentation, merge mode: punctuation merged with adjacent characters", () => {
		expect(getTokenTexts(CHAR_MERGE, input)).toEqual(["「字", "字，", "字。」"]);
		expect(getSignificance(CHAR_MERGE, input)).toEqual([true, true, true]);
	});

	test("Word segmentation, ignore mode: 字字 and 字 are significant", () => {
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["「", "字字", "，", "字", "。」"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([false, true, false, true, false]);
	});

	test("Word segmentation, merge mode: punctuation merged", () => {
		expect(getTokenTexts(WORD_MERGE, input)).toEqual(["「字字，", "字。」"]);
		expect(getSignificance(WORD_MERGE, input)).toEqual([true, true]);
	});
});

describe("English text with punctuation", () => {
	const input = "(Hello, world!)";

	test("No auto segmentation, merge mode: whole line", () => {
		expect(getTokenTexts(NO_AUTO_MERGE, input)).toEqual(["(Hello, world!)"]);
		expect(getSignificance(NO_AUTO_MERGE, input)).toEqual([true]);
	});

	test("No auto segmentation, ignore mode: Hello, world is significant", () => {
		expect(getTokenTexts(NO_AUTO, input)).toEqual(["(", "Hello, world", "!)"]);
		expect(getSignificance(NO_AUTO, input)).toEqual([false, true, false]);
	});

	test("Word segmentation, ignore mode: Hello and world are significant", () => {
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["(", "Hello", ", ", "world", "!)"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([false, true, false, true, false]);
	});

	test("Word segmentation, merge mode: punctuation merged with words", () => {
		expect(getTokenTexts(WORD_MERGE, input)).toEqual(["(Hello, ", "world!)"]);
		expect(getSignificance(WORD_MERGE, input)).toEqual([true, true]);
	});
});

describe("Text with unbalanced parentheses", () => {
	test("))a(( - without spaces, punctuation separate in ignore mode", () => {
		// In ignore mode, line breaking opportunities cause punctuation to separate
		expect(getTokenTexts(NO_AUTO, "))a((")).toEqual(["))", "a", "(("]);
		expect(getSignificance(NO_AUTO, "))a((")).toEqual([false, true, false]);

		expect(getTokenTexts(CHAR_IGNORE, "))a((")).toEqual(["))", "a", "(("]);
		expect(getSignificance(CHAR_IGNORE, "))a((")).toEqual([false, true, false]);

		// In merge mode, they can stay together
		expect(getTokenTexts(WORD_MERGE, "))a((")).toEqual(["))a(("]);
		expect(getSignificance(WORD_MERGE, "))a((")).toEqual([true]);
	});

	test("))a(( - word ignore mode: only a is significant", () => {
		expect(getTokenTexts(WORD_IGNORE, "))a((")).toEqual(["))", "a", "(("]);
		expect(getSignificance(WORD_IGNORE, "))a((")).toEqual([false, true, false]);
	});

	test(")) a (( - ignore mode: only a is significant", () => {
		const input = ")) a ((";
		expect(getTokenTexts(NO_AUTO, input)).toEqual([")) ", "a", " (("]);
		expect(getSignificance(NO_AUTO, input)).toEqual([false, true, false]);

		expect(getTokenTexts(WORD_IGNORE, input)).toEqual([")) ", "a", " (("]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([false, true, false]);
	});

	test(")) a (( - merge mode: only 'a ' (with space) is significant", () => {
		const input = ")) a ((";
		expect(getTokenTexts(NO_AUTO_MERGE, input)).toEqual([")) ", "a ", "(("]);
		expect(getSignificance(NO_AUTO_MERGE, input)).toEqual([false, true, false]);

		expect(getTokenTexts(WORD_MERGE, input)).toEqual([")) ", "a ", "(("]);
		expect(getSignificance(WORD_MERGE, input)).toEqual([false, true, false]);
	});

	test(") ((a)) ( - ignore mode separates punctuation", () => {
		const input = ") ((a)) (";
		// In no-auto ignore mode, punctuation separates
		expect(getTokenTexts(NO_AUTO, input)).toEqual([") ((", "a", ")) ("]);
		expect(getSignificance(NO_AUTO, input)).toEqual([false, true, false]);

		expect(getTokenTexts(WORD_IGNORE, input)).toEqual([") ((", "a", ")) ("]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([false, true, false]);
	});

	test(") ((a)) ( - merge mode: ((a)) with space is significant", () => {
		const input = ") ((a)) (";
		expect(getTokenTexts(NO_AUTO_MERGE, input)).toEqual([") ", "((a)) ", "("]);
		expect(getSignificance(NO_AUTO_MERGE, input)).toEqual([false, true, false]);

		expect(getTokenTexts(WORD_MERGE, input)).toEqual([") ", "((a)) ", "("]);
		expect(getSignificance(WORD_MERGE, input)).toEqual([false, true, false]);
	});

	test("））字（（ - only 字 is significant", () => {
		const input = "））字（（";
		expect(getTokenTexts(NO_AUTO, input)).toEqual(["））", "字", "（（"]);
		expect(getSignificance(NO_AUTO, input)).toEqual([false, true, false]);

		expect(getTokenTexts(NO_AUTO_MERGE, input)).toEqual(["））", "字", "（（"]);
		expect(getSignificance(NO_AUTO_MERGE, input)).toEqual([false, true, false]);

		expect(getTokenTexts(CHAR_IGNORE, input)).toEqual(["））", "字", "（（"]);
		expect(getSignificance(CHAR_IGNORE, input)).toEqual([false, true, false]);
	});

	test("）（（字））（ - ignore mode separates punctuation from characters", () => {
		const input = "）（（字））（";
		// In ignore mode, punctuation separates
		expect(getTokenTexts(NO_AUTO, input)).toEqual(["）（（", "字", "））（"]);
		expect(getSignificance(NO_AUTO, input)).toEqual([false, true, false]);

		expect(getTokenTexts(NO_AUTO_MERGE, input)).toEqual(["）", "（（字））", "（"]);
		expect(getSignificance(NO_AUTO_MERGE, input)).toEqual([false, true, false]);

		expect(getTokenTexts(CHAR_IGNORE, input)).toEqual(["）（（", "字", "））（"]);
		expect(getSignificance(CHAR_IGNORE, input)).toEqual([false, true, false]);

		expect(getTokenTexts(CHAR_MERGE, input)).toEqual(["）", "（（字））", "（"]);
		expect(getSignificance(CHAR_MERGE, input)).toEqual([false, true, false]);
	});
});

describe("Pipe segmentation", () => {
	test("(a|) (|) ()| (a) - ignore mode: pipes create boundaries", () => {
		const input = "(a|) (|) ()| (a)";
		// The empty pipes create empty segments which collapse
		expect(getTokenTexts(NO_AUTO, input)).toEqual(["(", "a", ") () () (", "a", ")"]);
		expect(getSignificance(NO_AUTO, input)).toEqual([false, true, false, true, false]);
	});

	test("(a|) (|) ()| (a) - merge mode: pipes with parentheses", () => {
		const input = "(a|) (|) ()| (a)";
		expect(getTokenTexts(NO_AUTO_MERGE, input)).toEqual(["(a) ", "() () ", "(a)"]);
		expect(getSignificance(NO_AUTO_MERGE, input)).toEqual([true, false, true]);
	});

	test(") (a)| |(a) ( - ignore mode: pipes create boundaries", () => {
		const input = ") (a)| |(a) (";
		expect(getTokenTexts(NO_AUTO, input)).toEqual([") (", "a", ") (", "a", ") ("]);
		expect(getSignificance(NO_AUTO, input)).toEqual([false, true, false, true, false]);
	});

	test(") (a)| |(a) ( - merge mode: two (a) 's are significant", () => {
		const input = ") (a)| |(a) (";
		expect(getTokenTexts(NO_AUTO_MERGE, input)).toEqual([") ", "(a) ", "(a) ", "("]);
		expect(getSignificance(NO_AUTO_MERGE, input)).toEqual([false, true, true, false]);
	});
});

describe("Parentheses without spaces", () => {
	test("a(a - brackets insignificant when separated individually", () => {
		const input = "a(a";
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["a", "(", "a"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true, false, true]);
	});

	test("a)a - brackets insignificant when separated individually", () => {
		const input = "a)a";
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["a", ")", "a"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true, false, true]);
	});
});

describe("Complex mixed text", () => {
	test("|Hel|lo world|.字|字字Eng|lish|，|字字|English字|字。字字。 - ignore mode", () => {
		const input = "|Hel|lo world|.字|字字Eng|lish|，|字字|English字|字。字字。";
		expect(getTokenTexts(NO_AUTO, input)).toEqual([
			"Hel",
			"lo world",
			".",
			"字",
			"字字Eng",
			"lish",
			"，",
			"字字",
			"English字",
			"字。字字",
			"。",
		]);
		expect(getSignificance(NO_AUTO, input)).toEqual([
			true,
			true,
			false,
			true,
			true,
			true,
			false,
			true,
			true,
			true,
			false,
		]);
	});

	test("|Hel|lo world|.字|字字Eng|lish|，|字字|English字|字。字字。 - merge mode", () => {
		const input = "|Hel|lo world|.字|字字Eng|lish|，|字字|English字|字。字字。";
		expect(getTokenTexts(NO_AUTO_MERGE, input)).toEqual([
			"Hel",
			"lo world.",
			"字",
			"字字Eng",
			"lish，",
			"字字",
			"English字",
			"字。字字。",
		]);
		expect(getSignificance(NO_AUTO_MERGE, input)).toEqual([
			true,
			true,
			true,
			true,
			true,
			true,
			true,
			true,
		]);
	});

	test("Hel|lo world|.|「|字|字」字|Eng|lish，| - ignore mode", () => {
		const input = "Hel|lo world|.|「|字|字」字|Eng|lish，|";
		expect(getTokenTexts(NO_AUTO, input)).toEqual([
			"Hel",
			"lo world",
			".「",
			"字",
			"字」字",
			"Eng",
			"lish",
			"，",
		]);
		expect(getSignificance(NO_AUTO, input)).toEqual([
			true,
			true,
			false,
			true,
			true,
			true,
			true,
			false,
		]);
	});

	test("Hel|lo world|.|「|字|字」字|Eng|lish，| - merge mode", () => {
		const input = "Hel|lo world|.|「|字|字」字|Eng|lish，|";
		expect(getTokenTexts(NO_AUTO_MERGE, input)).toEqual([
			"Hel",
			"lo world.",
			"「字",
			"字」字",
			"Eng",
			"lish，",
		]);
		expect(getSignificance(NO_AUTO_MERGE, input)).toEqual([
			true,
			true,
			true,
			true,
			true,
			true,
		]);
	});

	test("字字（|English）|Eng(|English) Eng字字。 - ignore mode", () => {
		const input = "字字（|English）|Eng(|English) Eng字字。";
		expect(getTokenTexts(NO_AUTO, input)).toEqual([
			"字字",
			"（",
			"English",
			"）",
			"Eng(",
			"English) Eng字字",
			"。",
		]);
		expect(getSignificance(NO_AUTO, input)).toEqual([
			true,
			false,
			true,
			false,
			true,
			true,
			false,
		]);
	});

	test("字字（|English）|Eng(|English) Eng字字。 - merge mode", () => {
		const input = "字字（|English）|Eng(|English) Eng字字。";
		expect(getTokenTexts(NO_AUTO_MERGE, input)).toEqual([
			"字字",
			"（English）",
			"Eng(",
			"English) Eng字字。",
		]);
		expect(getSignificance(NO_AUTO_MERGE, input)).toEqual([
			true,
			true,
			true,
			true,
		]);
	});

	test("字字（English|）|Eng (English|)Eng字字。 - ignore mode", () => {
		const input = "字字（English|）|Eng (English|)Eng字字。";
		expect(getTokenTexts(NO_AUTO, input)).toEqual([
			"字字（English",
			"）",
			"Eng (English",
			")Eng字字",
			"。",
		]);
		expect(getSignificance(NO_AUTO, input)).toEqual([
			true,
			false,
			true,
			true,
			false,
		]);
	});

	test("字字（English|）|Eng (English|)Eng字字。 - merge mode", () => {
		const input = "字字（English|）|Eng (English|)Eng字字。";
		expect(getTokenTexts(NO_AUTO_MERGE, input)).toEqual([
			"字字（English）",
			"Eng (English",
			")Eng字字。",
		]);
		expect(getSignificance(NO_AUTO_MERGE, input)).toEqual([
			true,
			true,
			true,
		]);
	});

	test("|Eng|：「字字|」|「|字字|」「字字」「|字字|」！ - ignore mode", () => {
		const input = "|Eng|：「字字|」|「|字字|」「字字」「|字字|」！";
		expect(getTokenTexts(NO_AUTO, input)).toEqual([
			"Eng",
			"：「",
			"字字",
			"」「",
			"字字",
			"」「",
			"字字",
			"」「",
			"字字",
			"」！",
		]);
		expect(getSignificance(NO_AUTO, input)).toEqual([
			true,
			false,
			true,
			false,
			true,
			false,
			true,
			false,
			true,
			false,
		]);
	});

	test("|Eng|：「字字|」|「|字字|」「字字」「|字字|」！ - merge mode", () => {
		const input = "|Eng|：「字字|」|「|字字|」「字字」「|字字|」！";
		expect(getTokenTexts(NO_AUTO_MERGE, input)).toEqual([
			"Eng：",
			"「字字」",
			"「字字」",
			"「字字」",
			"「字字」！",
		]);
		expect(getSignificance(NO_AUTO_MERGE, input)).toEqual([
			true,
			true,
			true,
			true,
			true,
		]);
	});
});

describe("Segmentation suppression", () => {
	test("Backslash after space: Hong \\Kong", () => {
		const input = "Hong \\Kong";
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["Hong Kong"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true]);
	});

	test("Backslash before space: Hong\\ Kong", () => {
		const input = "Hong\\ Kong";
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["Hong Kong"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true]);
	});

	test("Multiple backslashes: Hong\\ \\Kong", () => {
		const input = "Hong\\ \\Kong";
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["Hong Kong"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true]);
	});

	test("Backslash with pipe - backslash takes precedence: Hong| \\Kong", () => {
		const input = "Hong| \\Kong";
		// Backslash in the space after pipe suppresses the boundary
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["Hong Kong"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true]);
	});

	test("Backslash with pipe - backslash takes precedence: Hong\\ |Kong", () => {
		const input = "Hong\\ |Kong";
		// Backslash in the space before pipe suppresses the boundary
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["Hong Kong"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true]);
	});

	test("CJK suppression: 字\\統", () => {
		const input = "字\\統";
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["字統"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true]);
	});

	test("CJK with pipe - backslash takes precedence: 字|\\統", () => {
		const input = "字|\\統";
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["字統"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true]);
	});

	test("CJK with pipe - backslash takes precedence: 字\\|統", () => {
		const input = "字\\|統";
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["字統"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true]);
	});
});

describe("Suppression with consecutive insignificant tokens", () => {
	test("Backslash before closing parens: a\\))a - word ignore", () => {
		const input = "a\\))a";
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["a))a"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true]);
	});

	test("Backslash after first paren: a)\\)a - word ignore", () => {
		const input = "a)\\)a";
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["a))a"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true]);
	});

	test("Backslash after closing parens: a))\\a - word ignore", () => {
		const input = "a))\\a";
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["a))a"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true]);
	});

	test("Multiple backslashes: a\\)\\)\\a - word ignore", () => {
		const input = "a\\)\\)\\a";
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["a))a"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true]);
	});
});

describe("Edge cases", () => {
	test("Empty line", () => {
		const input = "";
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual([]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([]);
	});

	test("Only punctuation - ignore mode", () => {
		const input = "...";
		const result = segmentText(input, WORD_IGNORE);
		expect(result.every(t => !t.isSignificant)).toBe(true);
	});

	test("Only punctuation - merge mode", () => {
		const input = "...";
		const result = segmentText(input, WORD_MERGE);
		expect(result.map(t => t.text).join("")).toBe("...");
	});

	test("Escaped pipe using backtick", () => {
		const input = "Hello`|world";
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["Hello", "|", "world"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true, false, true]);
	});

	test("Escaped backslash using backtick", () => {
		const input = "Hello`\\world";
		expect(getTokenTexts(WORD_IGNORE, input)).toEqual(["Hello", "\\", "world"]);
		expect(getSignificance(WORD_IGNORE, input)).toEqual([true, false, true]);
	});

	test("Only spaces", () => {
		const input = "   ";
		const result = segmentText(input, WORD_IGNORE);
		expect(result.every(t => !t.isSignificant)).toBe(true);
	});
});
