# Granular Caption Aligner

A powerful tool for creating granular subtitle timing alignments, written in TypeScript, React and TailwindCSS.

Visit [this page](https://graphemecluster.github.io/granular-caption-aligner) to give it a try!

## Features

- **Automatic and Manual Segmentation**: Split segments at character and/or word levels, or add pipes (`|`) to split explicitly
- **Flexible Punctuation Handling**: Choose how punctuation is treated during segmentation
- **Multiple Recording Methods**: 
  - Spacebar for start, Enter for end (optional)
  - Spacebar press for start, release for end
  - MIDI keyboard support (future extension)
- **Real-time Visual Feedback**: Color-coded token states during recording
- **Export to GST Format**: Save aligned captions in the custom `.gst` format

## File Format

The Granular Subtitle (`.gst`) format stores precise timing information for each token:

```
{00:00.249|00:00.595|Hap}{00:00.738|00:00.816|py} {00:00.918|00:01.325|birth}{00:01.472|00:01.903|day} {00:02.020|00:02.438|to} {00:02.573|00:03.241|you}
```

Each token is represented as `{start|end|text}` where:
- `start`: Start time in `mm:ss.sss` format
- `end`: End time in `mm:ss.sss` format
- `text`: The token text

Insignificant tokens (like spaces) are stored as plain text between curly brackets.

## Segmentation

Pipe characters (`|`) always create explicit segment boundaries. Use pipes to manually mark where you want segments to split, regardless of other segmentation settings.

Backslash (`\`) suppresses automatic segmentation between adjacent tokens. For example, `Hong\ Kong` or `Hong \Kong` with word segmentation treats "Hong Kong" as a single token instead of separating at the space.

Text may be further segmented automatically by:

### Character
When enabled, adds boundaries at every line-breaking opportunity according to the Unicode Line Breaking Algorithm ([UAX #14](https://unicode.org/reports/tr14/)). Particularly useful for CJK languages where characters can break between any two characters.

### Word
When enabled, adds boundaries based on the Unicode Word Segmentation Algorithm ([UAX #29](https://unicode.org/reports/tr29/)). Useful for European languages that use spaces between words.

**Note**: You can enable both character and word segmentation simultaneously for maximum granularity.

## Punctuation Modes

### Ignore
Punctuation is separated into insignificant tokens. For example, `"(Hello, world!)"` with word segmentation becomes: `[(]` `[Hello]` `[, ]` `[world]` `[!)]` where only the words are marked as significant.

### Merge
Punctuation "sticks" to adjacent words. Open punctuation like `(`, `{`, `[`, `「`, `《` attach to the following word, while closing punctuation and most other punctuation attach to the preceding word. For example, `"(Hello, world!)"` becomes: `[(Hello, ]` `[world!)]` where punctuation is included with the words.

## Recording Methods

### Spacebar Start, Enter End
- Press **Spacebar** to mark the start of a token
- Press **Enter** to mark the end (optional - next spacebar press will end the previous token)

### Spacebar Start/Release
- Press **Spacebar** to mark start
- Release **Spacebar** to mark end

## Usage

1. **Configure**: Select granularity, punctuation mode, and recording method
2. **Upload Files**: Add your audio file and transcript file
3. **Start Alignment**: Begin the recording interface
4. **Record Timing**: Use keyboard controls to mark token boundaries
5. **Save**: Press **Ctrl+S** or click Save to export as `.gst`

## Escaping Special Characters

In your transcript, use backtick (`` ` ``) to escape special characters:
- Newline: `` `n ``
- Carriage return: `` `r ``
- Tab: `` `t ``
- Pipe: `` `| ``
- Backslash: `` `\ ``
- Curly brackets: `` `{ ``, `` `} ``
- Square Brackets: `` `[ ``, `` `] ``
- Angle brackets: `` `< ``, `` `> ``
- Backtick: ``` `` ```
