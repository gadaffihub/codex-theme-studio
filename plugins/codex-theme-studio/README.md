# Codex Theme Studio

Design Codex CLI and Claude Code themes inside the terminal—not by learning TextMate selectors or JSON keys.

Run `/theme-studio`. Choose a visible terminal element. Pick a colour. Save directly to the native `/theme` store.

## What it does

- Shows one authentic, clickable Codex terminal and one direct colour list
- Shows one authentic, clickable Claude Code terminal and one direct colour list
- Covers all 26 Codex syntax categories and all 61 Claude Code colour tokens
- Uses the same Enter action for every item: palette number or hex value
- Supports arrows, Page Up/Down, letter keys, resize, and mouse clicks
- Opens every theme bundled with Codex, including ANSI and Base16 variants
- Creates new palettes, randomizes colours, and converts editable Codex ↔ Claude drafts
- Validates and saves themes directly to the correct `/theme` directory
- Opens in a new Terminal window by default; supports a verified tab or restoring overlay
- Exposes MCP tools for deterministic listing, starter creation, conversion, and native saving

No build step, Python package, account, analytics, or network service is required. The terminal app requires Python 3 and uses only its standard library.

## Install the plugin

```sh
codex plugin marketplace add /path/to/codex-theme-studio
codex plugin add codex-theme-studio@codex-theme-studio
```

Restart Codex, then run:

```text
/theme-studio
/theme-studio --claude --tab
/theme-studio-help
/theme
```

The bundled command and skills are:

- `/theme-studio` — open the terminal editor
- `$codex-theme-studio:theme-studio` — let the agent open or operate the editor
- `$codex-theme-studio:theme-switch` — safely select an installed Codex or Claude theme
- `$codex-theme-studio:theme-studio-help` — show the compact workflow

The bundled MCP server provides `list_themes`, `create_theme`, and `convert_theme`. Each reuses the terminal editor's validators and native-store writers.

`/theme-studio` designs themes. Codex and Claude Code's native `/theme` command previews and selects saved themes.

## Make a theme

1. Press `1` for Codex or `2` for Claude.
2. Press `N` for a new theme or `O` to open one.
3. Use arrows in the terminal preview; press Enter or click the exact coloured element.
4. Press `V` for the complete plain-language colour list.
5. Enter palette `1–8` or a hex colour. Codex also supports `B` for bold and `D` for diff-line fills; Claude uses Space to enable or inherit a token.
6. Press `C` to convert into an editable draft for the other product.
7. Press `S` to validate and save directly to `$CODEX_HOME/themes` or `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/themes`; run `/theme` to select it.

## Launch modes

```sh
scripts/theme-studio.sh --window              # default, detached window
scripts/theme-studio.sh --tab                 # verified new Terminal tab
scripts/theme-studio.sh --overlay             # current shell; restores on exit
scripts/theme-studio.sh --set-default tab     # persist preference
```

Window and tab return immediately without owning or signalling the live agent. Direct-shell overlay uses the same terminal mechanism as Codex's `Ctrl+T` transcript: enter the alternate screen, render full-screen, then restore the saved terminal buffer on exit. The plugin cannot insert an external widget into Codex's private in-process overlay, so `/theme-studio` converts an overlay preference to a detached window; run `scripts/theme-studio.sh --overlay` from a normal interactive shell for same-terminal mode.

Codex `.tmTheme` files control fenced-code and diff highlighting. Terminal-owned text, background, prompt, and ANSI colours remain terminal settings and are shown only to make the preview accurate. See [OpenAI's CLI customization guide](https://learn.chatgpt.com/docs/cli-customization).

Claude Code JSON themes control its documented interface tokens. See [Anthropic's terminal configuration guide](https://code.claude.com/docs/en/terminal-config).

## Run without Codex

Run the terminal app directly:

```sh
scripts/theme-studio.sh
```

The optional browser companion remains available with:

```sh
python3 server.py
```

It opens a token-protected loopback URL. Press Ctrl+C in that shell when finished.

## Test

```sh
python3 -m unittest -v test_tui.py test_server.py test_mcp.py
node test_app.js
node test_convert.js
```

These checks validate theme serialization, all clickable coverage, both conversion directions, direct installation, and the local server.

## Contribute

The project is plain HTML, CSS, JavaScript, and Python standard library. Edit the files, run the four commands above, then test both editors in a browser. Keep the interface to two surfaces per product: one clickable terminal and one direct colour list.

MIT licensed. Bundled themes retain their upstream licenses; see `THIRD_PARTY_NOTICES.md`.
