import json
import plistlib
import os
import subprocess
import sys
import tempfile
import unittest
import curses
from pathlib import Path
from unittest.mock import patch

import theme_core as core
import theme_studio_tui as tui


class ThemeCoreTests(unittest.TestCase):
    def test_every_editable_item_has_unique_preview_coverage(self):
        self.assertEqual(len(core.CODEX_RULES), 26)
        self.assertEqual(len(core.CLAUDE_TOKENS), 61)
        self.assertEqual(len(set(core.CLAUDE_TOKENS)), 61)
        self.assertEqual(set(core.CLAUDE_TOKENS), set(core.CLAUDE_DESCRIPTIONS))

    def test_codex_starter_edit_conversion_and_native_save(self):
        theme = core.starter_codex(False)
        self.assertEqual(len(theme["settings"]), 27)
        core.codex_rule(theme, 0)["settings"]["foreground"] = "#123456"
        converted = core.codex_to_claude(theme)
        self.assertEqual(converted["overrides"]["inactive"], "#123456")
        with tempfile.TemporaryDirectory() as directory, patch.object(core, "codex_themes_dir", return_value=Path(directory)):
            # install_theme owns its default destination, so validate the same bytes and explicit atomic helper separately.
            data = plistlib.dumps(theme, fmt=plistlib.FMT_XML)
            target = core.install_theme(data, directory)
            self.assertEqual(plistlib.loads(target.read_bytes())["name"], "Untitled Dark")

    def test_claude_starter_all_tokens_conversion_and_native_save(self):
        theme = core.starter_claude(False)
        self.assertEqual(set(theme["overrides"]), core.CLAUDE_ENABLED)
        theme["overrides"]["promptBorder"] = "#123456"
        converted = core.claude_to_codex(theme)
        self.assertEqual(converted["settings"][0]["settings"]["foreground"], "#F5F5F0")
        with tempfile.TemporaryDirectory() as directory:
            target = core.install_claude_theme(theme, directory)
            self.assertEqual(json.loads(target.read_text())["overrides"]["promptBorder"], "#123456")

    def test_all_six_claude_bases_have_distinct_visible_defaults(self):
        signatures = {
            base: tuple(core.claude_default(token, base) for token in ("claude", "text", "success", "error", "promptBorder"))
            for base in core.CLAUDE_BASES
        }
        self.assertEqual(len(set(signatures.values())), 6)
        self.assertEqual(core.starter_claude("dark-ansi")["base"], "dark-ansi")
        self.assertEqual(core.starter_claude("light-daltonized")["base"], "light-daltonized")

    def test_launch_preference_defaults_and_round_trips(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(tui, "CONFIG", Path(directory) / "config.json"):
            self.assertEqual(tui.load_launch_mode(), "window")
            for mode in tui.LAUNCH_MODES:
                tui.save_launch_mode(mode)
                self.assertEqual(tui.load_launch_mode(), mode)
            with self.assertRaises(ValueError):
                tui.save_launch_mode("same-agent-tty")

    def test_terminal_previews_cover_every_editable_target(self):
        studio = tui.Studio.__new__(tui.Studio)
        studio.codex = core.starter_codex(False)
        studio.claude = core.starter_claude(False)
        studio.product = "codex"
        codex = {segment.item for line in studio.codex_preview() for segment in line if segment.item is not None}
        studio.product = "claude"
        claude = {segment.item for line in studio.claude_preview() for segment in line if segment.item is not None}
        self.assertEqual(codex, set(range(27)))
        self.assertEqual(claude, set(range(61)))

    def test_randomize_selected_preserves_unselected_and_all_expands_claude(self):
        codex = core.starter_codex(False)
        before = [core.codex_rule(codex, index)["settings"]["foreground"] for index in range(len(core.CODEX_RULES))]
        core.randomize_codex(codex, (3,), rng=type("R", (), {"choice": staticmethod(lambda values: values[-1])})())
        after = [core.codex_rule(codex, index)["settings"]["foreground"] for index in range(len(core.CODEX_RULES))]
        self.assertEqual(before[:3], after[:3])
        self.assertEqual(before[4:], after[4:])
        claude = core.starter_claude(False)
        enabled = set(claude["overrides"])
        core.randomize_claude(claude, rng=type("R", (), {"choice": staticmethod(lambda values: values[0])})())
        self.assertEqual(set(claude["overrides"]), enabled)
        core.randomize_claude_all(claude)
        self.assertEqual(set(claude["overrides"]), set(core.CLAUDE_TOKENS))

    def test_claude_randomize_selected_changes_only_selected_token(self):
        studio = tui.Studio.__new__(tui.Studio)
        studio.product = "claude"
        studio.claude = core.starter_claude(False)
        studio.codex = core.starter_codex(False)
        studio.selected = core.CLAUDE_TOKENS.index("promptBorder")
        studio.status = ""
        before = dict(studio.claude["overrides"])
        with patch.object(core.random, "choice", return_value="#123456"):
            studio.randomize()
        changed = {key for key, value in studio.claude["overrides"].items() if value != before[key]}
        self.assertEqual(changed, {"promptBorder"})

    def test_overlay_enters_and_restores_alternate_screen_in_isolated_pty(self):
        result = subprocess.run(
            ["script", "-q", "/dev/null", sys.executable, str(Path(tui.__file__)), "--overlay-smoke-test"],
            input=b"", stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            env={**os.environ, "TERM": "xterm-256color"}, timeout=5,
        )
        self.assertEqual(result.returncode, 0)
        self.assertIn(b"\x1b[?1049h", result.stdout)
        self.assertIn(b"\x1b[?1049l", result.stdout)

    def test_arrows_and_mouse_select_visible_items(self):
        class Screen:
            def getmaxyx(self):
                return (24, 80)

        studio = tui.Studio.__new__(tui.Studio)
        studio.screen = Screen()
        studio.product = "codex"
        studio.selected = studio.scroll = 0
        studio.running = True
        studio.regions = [(6, 4, 18, 7, "edit")]
        called = []
        studio.action = called.append

        studio.key(curses.KEY_DOWN)
        self.assertEqual(studio.selected, 1)
        studio.key(curses.KEY_UP)
        self.assertEqual(studio.selected, 0)
        studio.view = "preview"
        studio.key(ord("V"))
        self.assertEqual(studio.view, "list")
        studio.key(27)
        self.assertTrue(studio.running, "an incomplete escape sequence must not quit the editor")
        with patch.object(curses, "getmouse", return_value=(0, 8, 6, 0, curses.BUTTON1_CLICKED)):
            studio.mouse()
        self.assertEqual(studio.selected, 7)
        self.assertEqual(called, ["edit"])


if __name__ == "__main__":
    unittest.main()
