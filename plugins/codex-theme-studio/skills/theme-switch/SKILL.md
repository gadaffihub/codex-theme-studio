---
name: theme-switch
description: Switch an installed Codex CLI or Claude Code theme when the user names a theme or asks Codex to select or activate one. Use the product implied by the conversation; ask only when both are plausible.
---

# Switch theme

1. Determine Codex or Claude Code from the request. If unclear, ask which.
2. Resolve the requested theme before writing:
   - Codex custom themes: `${CODEX_HOME:-$HOME/.codex}/themes/*.tmTheme`
   - Claude themes: `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/themes/*.json`
3. If multiple names match, show them and ask. Never guess.
4. Preserve unrelated configuration and make one change:
   - Codex: set `theme = "<name>"` inside `[tui]` in `${CODEX_HOME:-$HOME/.codex}/config.toml`.
   - Claude Code: set JSON key `theme` to `custom:<slug>` in `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/settings.json`.
5. Parse the result, confirm the selected theme, and say a new session may be required.

For built-in themes or visual browsing, direct the user to `/theme` inside Codex or Claude Code.
