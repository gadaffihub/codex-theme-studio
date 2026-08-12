---
name: theme-studio-help
description: Show the Theme Studio quick reference when the user asks for theme help, available actions, or how to create, edit, install, or select a Codex or Claude Code theme.
---

# Theme Studio help

Show this compact guide; change nothing:

```text
Theme Studio

Run /theme-studio                       Open the terminal editor
Say “Create a warm theme”               Start a new theme
Say “Change my string colour to cyan”   Edit a theme
Say “Switch Codex to Nord”              Select an installed theme
Run /theme-studio-help                  Show this guide

In the editor: V switches Preview/List; arrows or J/K move; Enter or click edits; S saves; Q exits.
Launch: new window by default; use --tab or direct-shell --overlay; M saves the next-launch preference.
Agent tools: list themes, create a starter, or convert a saved theme without opening the editor.
In Codex or Claude Code: run /theme to browse and switch themes yourself.
```

Explicit skill names: `$codex-theme-studio:theme-studio`, `$codex-theme-studio:theme-switch`, and `$codex-theme-studio:theme-studio-help`.

Save writes directly to the correct theme directory; it does not download a loose file or select it automatically.

If the user supplied a goal, recommend exactly one next action.
