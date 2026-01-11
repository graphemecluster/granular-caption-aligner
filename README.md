# Granular Caption Aligner

A powerful tool for creating granular subtitle timing alignments using TypeScript, TailwindCSS, and Remotion.

Visit [this page](https://graphemecluster.github.io/granular-caption-aligner) to give it a try!

## Features

- **Multiple Granularity Levels**: Align captions at whole line, character, word, or pipe-separated segments
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

Insignificant tokens (like spaces) are stored as plain text between braces.

## Granularity Options

### Whole Line
Treats each line as a single unit. Punctuation handling determines how trailing punctuation is separated.

### Character
Segments text by line-breaking opportunities (useful for CJK languages). Similar to word segmentation for European languages.

### Word
Segments text using the Unicode word segmentation algorithm (`Intl.Segmenter`).

### Pipe (|)
Uses pipe characters as explicit segment boundaries. Useful for pre-segmented lyrics.

## Punctuation Handling

### Ignore
Separates trailing punctuation into insignificant tokens. Only word-like segments are marked as significant.

### Part of Previous
Fuses trailing punctuation into the previous significant token.

## Recording Methods

### Spacebar Start, Enter End
- Press **Spacebar** to mark the start of a token
- Press **Enter** to mark the end (optional - next spacebar press will end the previous token)

### Spacebar Start/Release
- Press **Spacebar** to mark start
- Release **Spacebar** to mark end

## Usage

1. **Configure**: Select granularity, punctuation mode, and recording method
2. **Upload Files**: Add your audio file and lyrics file
3. **Start Alignment**: Begin the recording interface
4. **Record Timing**: Use keyboard controls to mark token boundaries
5. **Save**: Press **Ctrl+S** or click Save to export as `.gst`

## Escaping Special Characters

In input lyrics files, use backtick (`` ` ``) to escape special characters:
- Newline: `` `n ``
- Carriage return: `` `r ``
- Tab: `` `t ``
- Pipe: `` `| ``
- Backslash: `` `\\ ``
- Braces: `` `{ ``, `` `} ``
- Brackets: `` `[ ``, `` `] ``
- Backtick: ``` `` ```
