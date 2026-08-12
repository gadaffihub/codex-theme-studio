# Codex theme schema

Verified against Codex CLI 0.147.0, two-face 0.5.1, syntect 5.3.0, all 32 embedded themes, and the live `/theme` picker.

## Codex-visible behavior

- Global `foreground` is the fallback syntax colour.
- Scope `foreground` and bold `fontStyle` affect fenced code and diffs.
- Scope backgrounds affect diff lines; Codex deliberately skips backgrounds in ordinary highlighted code.
- TextMate accepts `bold`, `italic`, and `underline`, including combinations. Codex CLI 0.147.0 visibly renders only bold, so new and converted themes emit only bold. Imported unsupported styles remain untouched unless their rule is edited.
- Diff `+` and `-` markers remain terminal ANSI green and red.
- The terminal owns the TUI background, prompt, selection, caret, ANSI accents, and dimmed diff line numbers.
- The studio does not expose terminal-owned colours as Codex theme controls. A collapsed preview setting changes the simulated terminal palette only.
- `Ansi`, `Base16`, and `Base16-256` encode terminal palette indices as `#II000000`; alpha `01` means the terminal default. The preview decodes both markers against its selected terminal palette.

## TextMate document

Top-level fields preserved by the editor include `name`, `author`, `settings`, and any imported metadata. `settings[0].settings` contains globals; later entries contain `name`, a comma-separated TextMate `scope`, and scoped `settings`.

Syntect parses these 30 global fields, but Codex 0.147's theme preview visibly uses only the fallback `foreground` plus scoped rules:

`foreground`, `background`, `caret`, `lineHighlight`, `misspelling`, `minimapBorder`, `accent`, `popupCss`, `phantomCss`, `bracketContentsForeground`, `bracketContentsOptions`, `bracketsForeground`, `bracketsBackground`, `bracketsOptions`, `tagsForeground`, `tagsOptions`, `highlight`, `findHighlight`, `findHighlightForeground`, `gutter`, `gutterForeground`, `selection`, `selectionForeground`, `selectionBorder`, `inactiveSelection`, `inactiveSelectionForeground`, `guide`, `activeGuide`, `stackGuide`, and `shadow`.

The bundled files also contain TextMate passthrough fields such as `invisibles`, `lineHighlightBorder`, `highlightForeground`, `block_caret`, and global `fontStyle`; syntect ignores these. Theme Studio preserves unsupported imported metadata but does not place non-working controls in the beginner interface.

Official installation behavior: [OpenAI CLI customization](https://learn.chatgpt.com/docs/cli-customization).
