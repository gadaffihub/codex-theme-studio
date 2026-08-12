---
name: theme-studio
description: Open and use terminal-native Theme Studio when the user wants to create, edit, preview, compare, convert, or save a Codex CLI .tmTheme or Claude Code JSON theme.
---

# Theme Studio

Launch the terminal editor by running `scripts/theme-studio.sh --agent` from this plugin's root. Add `--codex` or `--claude` when the request identifies a product. Report whether it opened in a window or tab.

Launch modes:

- `window` is the default and opens a detached Terminal window.
- `tab` opens a verified new Terminal tab; it never targets the active agent tab.
- `overlay` uses the current interactive shell's alternate screen and restores it on exit, matching Codex's `Ctrl+T` enter/leave-screen lifecycle. Codex exposes no plugin API for inserting an external widget into its private live overlay, so `--agent` converts overlay to a window. Tell users to run `scripts/theme-studio.sh --overlay` directly from a normal interactive shell when they want same-terminal mode.
- Persist a preference with `scripts/theme-studio.sh --set-default window|tab|overlay`.

Translate the request into one plain instruction before opening it:

- Create: start a new theme and preserve the user's stated mood or palette.
- Change: open the named theme; if the name is ambiguous, list matches.
- Edit visually: use `V` to switch between the authentic terminal preview and direct colour list. Arrows move; Enter edits by palette or hex; mouse clicks edit visible items.
- Complete it for the user when interactive terminal control is available; never ask the user to translate their request into scope or token names.

The app is local and dependency-free. `S` validates and writes directly to `${CODEX_HOME:-$HOME/.codex}/themes` for Codex or `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/themes` for Claude Code. Never use a download as installation. `C` opens a mapped, editable draft in the other product; conversion is approximate because the products style different surfaces.

Use the bundled Theme Studio MCP tools for non-interactive listing, starter creation, conversion, and native saving. Launch the TUI when the user wants visual editing.

After saving, tell the user to run `/theme` in the relevant product. Do not change their selected theme unless they explicitly ask; use `$codex-theme-studio:theme-switch` when they do.
