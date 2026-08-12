<div align="center">

# C/ CODEX THEME STUDIO

### Make the CLI look like yours—without learning its theme format.

A terminal-native studio for creating, editing, converting, and saving themes for **Codex CLI** and **Claude Code**.

[![Tests](https://github.com/gadaffihub/codex-theme-studio/actions/workflows/test.yml/badge.svg)](https://github.com/gadaffihub/codex-theme-studio/actions/workflows/test.yml)
[![MIT](https://img.shields.io/badge/license-MIT-181818.svg)](LICENSE)
[![No dependencies](https://img.shields.io/badge/dependencies-none-00a896.svg)](#run-it)

</div>

---

Codex Theme Studio replaces hand-editing `.tmTheme` and JSON files with one direct workflow. Open a theme or start fresh, choose the visible part you want to change, set its colour, and see the result immediately.

When it feels right, save it directly into the CLI theme picker. No loose theme file lands in Downloads.

## Design, don't decipher

| | |
|---|---|
| **Create** | Start with a clean theme matched to your device, or randomize a new palette. |
| **Remix** | Load any of the 32 themes bundled with Codex—including ANSI and Base16 variants—or open your own `.tmTheme`. |
| **Point and style** | Choose a keyword, string, comment, diff line, prompt, status, or other visible part—never a schema key. |
| **See the whole interface** | Use one clickable terminal preview for Codex and one for Claude Code. |
| **Tune everything** | Edit syntax scopes, fallback colours, diff backgrounds, punctuation, tags, invalid syntax, and supported font emphasis. |
| **Translate** | Convert a Codex theme into an editable Claude theme—or a Claude theme into an editable Codex theme. |
| **Save it** | Validate and write directly to the native `/theme` store. No Downloads cleanup. |
| **Automate it** | Let an agent list, create, or convert themes through the bundled local MCP server. |

The editor follows the device's light or dark appearance. Every colour has a live example. Advanced TextMate selectors remain preserved and available when needed, but ordinary theme design requires none.

## Codex themes

The Codex editor works with standard TextMate `.tmTheme` files and mirrors what Codex renders in fenced code blocks and file diffs.

1. Press `N` for a new theme or `O` to open one.
2. Move through the real terminal preview—or press `V` for **All colours**.
3. Set text colours, supported diff backgrounds, and bold emphasis while watching the preview update.
4. Press `S`, then select the saved theme with `/theme` in Codex CLI.

ANSI, Base16, and Base16-256 palette references are resolved against the preview terminal, so those themes do not appear blank.

Codex `.tmTheme` files control fenced-code and diff syntax. Terminal-owned colours remain visible for accuracy but are not presented as theme settings. Codex derives its prompt surface from the terminal background.

## Claude Code themes

Press `2` to build a Claude Code JSON theme with the same interaction.

- Choose any documented Claude base: dark, light, Daltonized, or ANSI.
- Enable only the overrides you want to own.
- Style assistant text, prompts, status colours, diffs, message backgrounds, selections, shimmers, subagents, and rainbow tokens.
- Preview the result in a Claude Code terminal before saving it.

The output is written to Claude's native custom-theme format with no runtime dependency. Save it, then run `/theme` in Claude Code to select it.

## Convert between Codex and Claude

Press `C` to open the closest editable equivalent in the other editor. The studio maps syntax roles, interface accents, selections, and diff colours; because TextMate scopes and Claude tokens describe different surfaces, conversion creates an unsaved draft for review.

## Run it

### Install as a Codex plugin

```sh
codex plugin marketplace add https://github.com/gadaffihub/codex-theme-studio
codex plugin add codex-theme-studio@codex-theme-studio
```

Start a new Codex thread, then speak normally:

```text
Open Theme Studio
Create a warm high-contrast theme
Change my string colour to cyan
Switch Codex to Nord
Theme Studio help
```

For explicit invocation, use `/theme-studio` or `$codex-theme-studio:theme-studio`. Use `$codex-theme-studio:theme-switch` to select an installed theme and `$codex-theme-studio:theme-studio-help` for the compact guide. `/theme` remains the native theme picker.

### Run as a standalone app

```sh
git clone https://github.com/gadaffihub/codex-theme-studio.git
cd codex-theme-studio
./start-theme-studio.command
```

The launcher opens the terminal editor in the current shell. For the optional browser companion, run `python3 plugins/codex-theme-studio/server.py` and open <http://127.0.0.1:8765>.

The same-terminal editor uses the alternate screen—the mechanism Codex uses for its `Ctrl+T` transcript—so closing Theme Studio restores the previous terminal buffer. Plugins cannot inject third-party widgets into Codex's private live overlay; plugin launches therefore open a new window by default, while direct-shell `--overlay` provides the restoring same-terminal experience.

Python 3 is required. No Python package, build tool, framework, account, analytics, or internet connection is required after cloning; both editors otherwise use standard-library Python and plain HTML, CSS, and JavaScript.

## Where themes go

| Editor | Save destination | Select inside the CLI |
|---|---|---|
| Codex CLI | `$CODEX_HOME/themes` or `~/.codex/themes` | `/theme` |
| Claude Code | `$CLAUDE_CONFIG_DIR/themes` or `~/.claude/themes` | `/theme` |

The studio validates files before writing them. It does not silently select a theme. The theme-switch skill changes the requested product's saved theme only when explicitly invoked.

Theme behavior and selection are documented by [OpenAI's Codex CLI customization guide](https://learn.chatgpt.com/docs/cli-customization) and [Anthropic's Claude Code terminal configuration guide](https://code.claude.com/docs/en/terminal-config).

## Build on it

```sh
cd plugins/codex-theme-studio
node --check app.js
node --check claude.js
node --check theme-convert.js
node test_app.js
node test_convert.js
python3 -m unittest -v test_server.py
python3 -m unittest -v test_tui.py
python3 -m unittest -v test_mcp.py
```

Pull requests are welcome—especially clearer mappings, accessibility improvements, and compatibility fixes for newer Codex or Claude theme fields.

The editor is MIT-licensed. Bundled themes retain their upstream licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
