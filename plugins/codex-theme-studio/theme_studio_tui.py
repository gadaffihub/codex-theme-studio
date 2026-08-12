#!/usr/bin/env python3
"""Theme Studio terminal UI. Standard library only."""

from __future__ import annotations

import argparse
import curses
import json
import os
import random
import re
import sys
from dataclasses import dataclass
from pathlib import Path

import theme_core as core


CONFIG = Path(os.environ.get("XDG_CONFIG_HOME", Path.home() / ".config")) / "codex-theme-studio" / "config.json"
LAUNCH_MODES = ("window", "tab", "overlay")


def load_launch_mode() -> str:
    try:
        mode = json.loads(CONFIG.read_text()).get("launchMode", "window")
        return mode if mode in LAUNCH_MODES else "window"
    except (OSError, ValueError, AttributeError):
        return "window"


def save_launch_mode(mode: str) -> None:
    if mode not in LAUNCH_MODES:
        raise ValueError("Launch mode must be window, tab, or overlay")
    CONFIG.parent.mkdir(parents=True, exist_ok=True)
    CONFIG.write_text(json.dumps({"launchMode": mode}, indent=2) + "\n")


def hex_rgb(value: str) -> tuple[int, int, int]:
    colour = core.normalize_colour(value)
    return tuple(int(colour[index:index + 2], 16) for index in (1, 3, 5))


def label(token: str) -> str:
    value = token.removesuffix("_FOR_SUBAGENTS_ONLY").replace("rainbow_", "").replace("_", " ")
    words = []
    for character in value:
        if character.isupper() and words and words[-1] != " ":
            words.append(" ")
        words.append(character.lower())
    return "".join(words).strip().capitalize()


@dataclass
class Segment:
    text: str
    item: int | None = None
    foreground: str | None = None
    background: str | None = None
    bold: bool = False


class Studio:
    def __init__(self, screen, product="codex"):
        self.screen = screen
        self.product = product
        self.view = "preview"
        self.codex = core.starter_codex(False)
        self.claude = core.starter_claude(False)
        self.selected = 0
        self.scroll = 0
        self.regions: list[tuple[int, int, int, int, str]] = []
        self.status = "Arrow keys move | Enter edits | click any coloured item"
        self.launch_mode = load_launch_mode()
        self.colours: dict[str, int] = {}
        self.pairs: dict[tuple[str, str], int] = {}
        self.next_colour = 16
        self.next_pair = 1
        self.running = True
        self.configure_terminal()

    def configure_terminal(self):
        try:
            curses.curs_set(0)
        except curses.error:
            pass
        curses.noecho()
        curses.cbreak()
        self.screen.keypad(True)
        curses.mousemask(curses.ALL_MOUSE_EVENTS | curses.REPORT_MOUSE_POSITION)
        try:
            curses.mouseinterval(0)
            curses.use_default_colors()
        except curses.error:
            pass

    @property
    def items(self):
        if self.product == "codex":
            return [("Unmatched code text", "Code without a specific colour"), *[(row[0], row[5]) for row in core.CODEX_RULES]]
        return [(label(token), core.CLAUDE_DESCRIPTIONS[token]) for token in core.CLAUDE_TOKENS]

    def codex_value(self, index, key="foreground"):
        if index == 0:
            return core.normalize_colour(self.codex["settings"][0]["settings"].get("foreground"))
        rule = core.codex_rule(self.codex, index - 1)
        fallback = self.codex["settings"][0]["settings"].get("background" if key == "background" else "foreground", "#181818" if key == "background" else "#F5F5F0")
        return core.normalize_colour(rule["settings"].get(key), fallback)

    def claude_token(self, index):
        return core.CLAUDE_TOKENS[index]

    def claude_value(self, index):
        token = self.claude_token(index)
        return core.normalize_colour(self.claude.get("overrides", {}).get(token), core.claude_default(token, self.claude.get("base", "dark")))

    def value(self, index):
        return self.codex_value(index) if self.product == "codex" else self.claude_value(index)

    def background(self):
        if self.product == "codex":
            return core.normalize_colour(self.codex["settings"][0]["settings"].get("background"), "#181818")
        return "#F5F5F0" if self.claude.get("base", "dark").startswith("light") else "#181818"

    def foreground(self):
        return self.codex_value(0) if self.product == "codex" else self.claude_value(core.CLAUDE_TOKENS.index("text"))

    def enabled(self, index):
        return self.product == "codex" or self.claude_token(index) in self.claude.get("overrides", {})

    def set_value(self, index, value, key="foreground"):
        value = core.normalize_colour(value)
        if self.product == "codex":
            if index == 0:
                self.codex["settings"][0]["settings"]["foreground"] = value
            else:
                core.codex_rule(self.codex, index - 1)["settings"][key] = value
        else:
            self.claude.setdefault("overrides", {})[self.claude_token(index)] = value

    def colour_number(self, value):
        value = core.normalize_colour(value)
        if value in self.colours:
            return self.colours[value]
        if not curses.can_change_color() or self.next_colour >= curses.COLORS:
            red, green, blue = hex_rgb(value)
            palette = [(0, (0, 0, 0)), (1, (205, 0, 0)), (2, (0, 205, 0)), (3, (205, 205, 0)), (4, (0, 0, 238)), (5, (205, 0, 205)), (6, (0, 205, 205)), (7, (229, 229, 229))]
            if curses.COLORS >= 256:
                levels = (0, 95, 135, 175, 215, 255)
                palette.extend((16 + r * 36 + g * 6 + b, (levels[r], levels[g], levels[b])) for r in range(6) for g in range(6) for b in range(6))
                palette.extend((232 + index, (8 + index * 10,) * 3) for index in range(24))
            return min(palette, key=lambda entry: sum((a - b) ** 2 for a, b in zip((red, green, blue), entry[1])))[0]
        number = self.next_colour
        self.next_colour += 1
        red, green, blue = hex_rgb(value)
        curses.init_color(number, *(round(channel * 1000 / 255) for channel in (red, green, blue)))
        self.colours[value] = number
        return number

    def attr(self, foreground=None, background=None, bold=False, selected=False):
        foreground = core.normalize_colour(foreground or self.foreground())
        background = core.normalize_colour(background or self.background())
        key = (foreground, background)
        if key not in self.pairs:
            try:
                curses.init_pair(self.next_pair, self.colour_number(foreground), self.colour_number(background))
                self.pairs[key] = self.next_pair
                self.next_pair += 1
            except curses.error:
                return curses.A_BOLD if bold else curses.A_NORMAL
        value = curses.color_pair(self.pairs[key])
        if bold:
            value |= curses.A_BOLD
        if selected:
            value |= curses.A_REVERSE
        return value

    def add(self, y, x, text, item=None, foreground=None, background=None, bold=False, selected=False, action="edit"):
        height, width = self.screen.getmaxyx()
        if not (0 <= y < height and x < width - 1):
            return x
        visible = str(text)[:max(0, width - x - 1)]
        if not visible:
            return x
        selected = selected or item == self.selected
        try:
            self.screen.addstr(y, x, visible, self.attr(foreground, background, bold, selected))
        except curses.error:
            pass
        if item is not None:
            self.regions.append((y, x, x + len(visible), item, action))
        return x + len(visible)

    def line(self, y, segments):
        x = 2
        for segment in segments:
            x = self.add(y, x, segment.text, segment.item, segment.foreground, segment.background, segment.bold)
        fill = next((segment for segment in segments if segment.background), None)
        if fill:
            width = self.screen.getmaxyx()[1]
            self.add(y, x, " " * max(0, width - x - 1), fill.item, fill.foreground, fill.background)

    def codex_preview(self):
        colour = lambda item: self.codex_value(item)
        bg = self.background()
        diff_bg = lambda item: self.codex_value(item, "background")
        return [
            [Segment("• Explored", 8, colour(8), bold=True)],
            [Segment("  └ Read README.md, app.swift, tests.swift", 0, colour(0))],
            [],
            [Segment("• Ran git diff --check", 23, colour(23), bold=True)],
            [Segment("1  ", None, colour(0)), Segment("import", 6, colour(6), bold=True), Segment(" Foundation", 10, colour(10))],
            [Segment("2  ", None, colour(0)), Segment("struct", 7, colour(7)), Segment(" Result", 10, colour(10)), Segment(" {", 15, colour(15))],
            [Segment("3    ", None, colour(0)), Segment("let", 6, colour(6), bold=True), Segment(" count", 13, colour(13)), Segment(" = ", 14, colour(14)), Segment("32", 5, colour(5))],
            [Segment("4    ", None, colour(0)), Segment("func", 7, colour(7)), Segment(" write", 8, colour(8)), Segment("(", 15, colour(15)), Segment("to path", 11, colour(11)), Segment(": URL) ", 15, colour(15)), Segment("throws", 6, colour(6)), Segment(" {", 15, colour(15))],
            [Segment("5      ", None, colour(0)), Segment("// Keep the existing file intact on failure.", 1, colour(1))],
            [Segment("6      ", None, colour(0)), Segment("let", 6, colour(6), bold=True), Segment(" message", 12, colour(12)), Segment(" = ", 14, colour(14)), Segment('"Wrote ', 2, colour(2)), Segment(r"\(count)", 4, colour(4)), Segment(r"\n", 3, colour(3)), Segment('"', 2, colour(2))],
            [Segment("7      ", None, colour(0)), Segment("#if DEBUG", 9, colour(9), bold=True), Segment(" print", 8, colour(8)), Segment("(message)", 15, colour(15))],
            [Segment("8      ", None, colour(0)), Segment("<result", 16, colour(16)), Segment(" state", 17, colour(17)), Segment("=", 14, colour(14)), Segment('"ready"', 2, colour(2)), Segment(">", 16, colour(16))],
            [Segment("9      ", None, colour(0)), Segment("broken syntax", 26, colour(26))],
            [],
            [Segment("• Edited 2 files", 8, colour(8), bold=True)],
            [Segment("@@ Writer.write", 21, colour(21), bold=True)],
            [Segment("- const output = oldValue;", 19, colour(19), diff_bg(19))],
            [Segment("+ const output = validatedValue;", 18, colour(18), diff_bg(18))],
            [Segment("~ writeAtomically(output);", 20, colour(20), diff_bg(20))],
            [],
            [Segment("# Verification", 22, colour(22), bold=True)],
            [Segment("> All checks passed.", 25, colour(25))],
            [Segment("• Ran ", 25, colour(25)), Segment("swift test", 24, colour(24)), Segment(" · inspect the ", 0, colour(0)), Segment("build log", 23, colour(23)), Segment(".", 0, colour(0))],
            [],
            [Segment("› Add tests for the remaining edge cases", 0, colour(0))],
        ]

    def claude_preview(self):
        token_index = {token: index for index, token in enumerate(core.CLAUDE_TOKENS)}
        def seg(text, token, background=None, bold=False):
            index = token_index[token]
            return Segment(text, index, self.claude_value(index), self.claude_value(token_index[background]) if background else None, bold)
        def fill(text, token, foreground="text", bold=False):
            index = token_index[token]
            return Segment(text, index, self.claude_value(token_index[foreground]), self.claude_value(index), bold)
        lines = [
            [seg("✦", "claudeShimmer"), Segment(" "), seg("Claude", "claude", bold=True), Segment(" "), seg("I’ll inspect the project, make the change, and run its checks.", "text")],
            [seg("  └ Read ", "inactive"), seg("CLAUDE.md", "remember"), seg(" and 3 files ", "inactive"), seg("⋯", "inactiveShimmer")],
            [seg("Claude:", "briefLabelClaude"), seg(" I found the shared write path and will update it once.", "text")],
            [seg("›", "bashBorder", "bashMessageBackgroundColor"), fill(" npm test ", "bashMessageBackgroundColor"), seg("✓ 4 checks passed", "success", "bashMessageBackgroundColor")],
            [fill("Memory: ", "memoryBackgroundColor"), seg("preserve unrelated settings.", "remember", "memoryBackgroundColor")],
            [seg("Plan mode · review changes before editing", "planMode"), Segment("  "), seg("auto-accept on", "autoAccept")],
            [fill("  const oldTheme = load()", "diffRemovedDimmed")],
            [fill("- const ", "diffRemoved"), seg("oldTheme", "diffRemovedWord", "diffRemoved"), fill(" = true", "diffRemoved")],
            [fill("  const nextTheme = load()", "diffAddedDimmed")],
            [fill("+ const ", "diffAdded"), seg("customTheme", "diffAddedWord", "diffAdded"), fill(" = true", "diffAdded")],
            [seg("✓ passed", "success"), Segment("  "), seg("! warning", "warning"), Segment("  "), seg("⋯ checking", "warningShimmer"), Segment("  "), seg("× failed", "error"), Segment("  "), seg("◆ merged", "merged")],
            [seg("Allow Claude to edit this file?", "permission"), Segment("  "), seg("Yes / No", "permissionShimmer")],
            [seg("IDE connected", "ide"), Segment("  "), seg("Fast mode", "fastMode"), Segment("  "), seg("processing…", "fastModeShimmer")],
        ]
        lines.append([Segment("Agents: ")] + [seg(colour, f"{colour}_FOR_SUBAGENTS_ONLY") if offset == 0 else Segment("  ") for colour in ()])
        agent_line = [Segment("Agents: ")]
        for colour in ("red", "blue", "green", "yellow", "purple", "orange", "pink", "cyan"):
            agent_line.extend((seg(colour, f"{colour}_FOR_SUBAGENTS_ONLY"), Segment(" ")))
        lines[-1] = agent_line
        rainbow_line = [Segment("Ultrathink: ")]
        for colour, glyph in zip(("red", "orange", "yellow", "green", "blue", "indigo", "violet"), "RAINBOW"):
            rainbow_line.extend((seg(glyph, f"rainbow_{colour}"), seg("·", f"rainbow_{colour}_shimmer")))
        lines.extend((rainbow_line,
            [seg("You:", "briefLabelYou", "userMessageBackground"), fill(" Fix the failing save path. ", "userMessageBackground"), fill("hovered message", "userMessageBackgroundHover")],
            [fill("selected terminal text", "selectionBg")],
            [],
            [seg("›", "promptBorderShimmer"), seg(" PROMPT ", "promptBorder"), seg("Describe the next change", "suggestion")],
            [seg("Claude Code", "subtle"), Segment("  "), seg(" inverse ", "inverseText"), Segment("  "), seg("██████", "rate_limit_fill"), seg("████", "rate_limit_empty")],
        ))
        return lines

    def preview_lines(self):
        return self.codex_preview() if self.product == "codex" else self.claude_preview()

    def draw_header(self, width):
        product = self.product.upper()
        title = f" THEME STUDIO  /  {product} "
        self.add(0, 0, title.ljust(width - 1), foreground=self.background(), background=self.foreground(), bold=True)
        name = self.codex.get("name", "Untitled") if self.product == "codex" else self.claude.get("name", "Untitled")
        mode = f"PREVIEW" if self.view == "preview" else "ALL COLOURS"
        line = f" {name}   {mode}   NEXT LAUNCH: {self.launch_mode.upper()}"
        self.add(1, 0, line[:width - 1].ljust(width - 1), foreground=self.foreground(), background=self.background())

    def visible_height(self):
        return max(1, self.screen.getmaxyx()[0] - 6)

    def ensure_visible(self, total):
        height = self.visible_height()
        if self.selected < self.scroll:
            self.scroll = self.selected
        if self.selected >= self.scroll + height:
            self.scroll = self.selected - height + 1
        self.scroll = max(0, min(self.scroll, max(0, total - height)))

    def draw_preview(self):
        lines = self.preview_lines()
        item_rows = {segment.item: row for row, line in enumerate(lines) for segment in line if segment.item is not None}
        target_row = item_rows.get(self.selected, 0)
        height = self.visible_height()
        if target_row < self.scroll:
            self.scroll = target_row
        elif target_row >= self.scroll + height:
            self.scroll = target_row - height + 1
        self.scroll = max(0, min(self.scroll, max(0, len(lines) - height)))
        for screen_row, line in enumerate(lines[self.scroll:self.scroll + height], 2):
            self.line(screen_row, line)

    def draw_list(self):
        self.ensure_visible(len(self.items))
        width = self.screen.getmaxyx()[1]
        for screen_row, index in enumerate(range(self.scroll, min(len(self.items), self.scroll + self.visible_height())), 2):
            name, description = self.items[index]
            enabled = "ON " if self.enabled(index) else "OFF"
            value = self.value(index)
            sample = " Aa "
            self.add(screen_row, 1, enabled, index, value, self.background(), bold=True, action="toggle")
            self.add(screen_row, 6, f"{name.upper():<28}"[:28], index, value, self.background(), bold=True)
            if width >= 76:
                self.add(screen_row, 35, f"{description:<30}"[:30], index, self.foreground(), self.background())
                self.add(screen_row, 66, sample, index, value, self.background(), bold=True)
                self.add(screen_row, 72, value, index, self.foreground(), self.background())
            else:
                self.add(screen_row, max(36, width - 11), value, index, self.foreground(), self.background())

    def draw_footer(self, width, height):
        view_target = "ALL COLOURS" if self.view == "preview" else "PREVIEW"
        rows = (
            ((f"[V]{view_target}", "view"), ("[1]CODEX", "codex"), ("[2]CLAUDE", "claude"), ("[E]NAME", "name"), ("[N]NEW", "new"), ("[O]OPEN", "open")),
            (("[r]RANDOMIZE THIS", "random"), ("[R]RANDOMIZE ALL", "random-all"), ("[C]CONVERT", "convert"), ("[S]SAVE", "save"), ("[M]LAUNCH", "launch"), ("[Q]QUIT", "quit")),
        )
        for y, actions in zip((height - 4, height - 3), rows):
            x = self.add(y, 0, " ", foreground=self.background(), background=self.foreground(), bold=True)
            for text, action in actions:
                if x + len(text) + 2 >= width:
                    break
                x = self.add(y, x, text, -1, self.background(), self.foreground(), bold=True, action=action)
                x = self.add(y, x, "  ", foreground=self.background(), background=self.foreground(), bold=True)
            if x < width - 1:
                self.add(y, x, " " * (width - x - 1), foreground=self.background(), background=self.foreground(), bold=True)
        name, description = self.items[self.selected]
        controls = ["ENTER CHANGE COLOUR"]
        if self.product == "codex" and self.selected:
            controls.append("B BOLD")
            if self.selected in (18, 19, 20):
                controls.append("D LINE FILL")
        if self.product == "claude":
            controls.append("SPACE ON/OFF")
        selection = f" {name}: {description} | {self.value(self.selected)} | {' · '.join(controls)}"
        self.add(height - 2, 0, selection[:width - 1].ljust(width - 1), foreground=self.foreground(), background=self.background())
        self.add(height - 1, 0, (" " + self.status)[:width - 1].ljust(width - 1), foreground=self.foreground(), background=self.background())

    def draw(self):
        self.screen.erase()
        self.regions.clear()
        height, width = self.screen.getmaxyx()
        if height < 12 or width < 54:
            self.add(0, 0, "Theme Studio needs at least 54 columns × 12 rows. Resize the window.")
            self.screen.refresh()
            return
        self.draw_header(width)
        if self.view == "preview":
            self.draw_preview()
        else:
            self.draw_list()
        self.draw_footer(width, height)
        self.screen.refresh()

    def prompt(self, question, initial="", max_length=100):
        height, width = self.screen.getmaxyx()
        text = f" {question}: "
        self.add(height - 1, 0, text.ljust(width - 1), foreground=self.background(), background=self.foreground(), bold=True)
        curses.echo()
        try:
            curses.curs_set(1)
        except curses.error:
            pass
        try:
            self.screen.move(height - 1, min(len(text), width - 2))
            if initial:
                self.screen.addstr(initial[:max(0, width - len(text) - 1)])
            value = self.screen.getstr(height - 1, min(len(text) + len(initial), width - 2), max_length).decode(errors="replace")
            return initial + value
        finally:
            curses.noecho()
            try:
                curses.curs_set(0)
            except curses.error:
                pass

    def choose(self, title, options):
        if not options:
            self.status = "Nothing available to open"
            return None
        cursor, offset = 0, 0
        while True:
            self.screen.erase()
            height, width = self.screen.getmaxyx()
            self.add(0, 0, f" {title} · ENTER CHOOSES · ESC CANCELS ".ljust(width - 1), foreground=self.background(), background=self.foreground(), bold=True)
            visible = max(1, height - 2)
            if cursor < offset:
                offset = cursor
            if cursor >= offset + visible:
                offset = cursor - visible + 1
            for row, index in enumerate(range(offset, min(len(options), offset + visible)), 1):
                self.add(row, 2, options[index][0], foreground=self.foreground(), background=self.background(), bold=index == cursor, selected=index == cursor)
            self.screen.refresh()
            key = self.screen.getch()
            if key in (27, ord("q")):
                return None
            if key in (curses.KEY_UP, ord("k")):
                cursor = (cursor - 1) % len(options)
            elif key in (curses.KEY_DOWN, ord("j")):
                cursor = (cursor + 1) % len(options)
            elif key in (10, 13, curses.KEY_ENTER):
                return options[cursor][1]

    def edit_colour(self, background=False):
        current = self.codex_value(self.selected, "background") if background else self.value(self.selected)
        question = "1 RED  2 ORG  3 YEL  4 GRN  5 CYN  6 BLU  7 VIO  8 MAGENTA  /  #HEX"
        entered = self.prompt(question, "")
        palette = {str(index + 1): colour for index, colour in enumerate(core.SPECTRUM)}
        value = palette.get(entered.strip(), entered.strip())
        if not value:
            return
        if not value.startswith("#"):
            value = "#" + value
        if not re.fullmatch(r"#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?", value):
            self.status = "Use a palette number or hex such as #FF00FF"
            return
        self.set_value(self.selected, value, "background" if background else "foreground")
        self.status = f"{self.items[self.selected][0]} changed to {core.normalize_colour(value)}"

    def edit_name(self):
        value = self.prompt("Theme name · type replacement and press Enter")
        if value.strip():
            if self.product == "codex":
                self.codex["name"] = value.strip()
            else:
                self.claude["name"] = value.strip()
            self.status = f"Theme named {value.strip()}"

    def new_theme(self):
        choices = (("Dark", "dark"), ("Light", "light")) if self.product == "codex" else tuple((base.replace("-", " · ").title(), base) for base in core.CLAUDE_BASES)
        base = self.choose("NEW THEME", choices)
        if base is None:
            return
        if self.product == "codex":
            self.codex = core.starter_codex(base == "light")
        else:
            self.claude = core.starter_claude(base)
        self.selected = self.scroll = 0
        self.status = "New theme ready"

    def open_theme(self):
        catalog = core.codex_catalog() if self.product == "codex" else core.claude_catalog()
        path = self.choose("OPEN A THEME", catalog)
        if not path:
            return
        try:
            if self.product == "codex":
                self.codex = core.load_codex(path)
            else:
                self.claude = core.load_claude(path)
            self.selected = self.scroll = 0
            self.status = f"Opened {path.name}"
        except (OSError, ValueError) as error:
            self.status = str(error)

    def randomize(self, all_colours=False):
        if self.product == "codex":
            if all_colours:
                core.randomize_codex(self.codex)
            elif self.selected == 0:
                self.set_value(0, random.choice(core.SPECTRUM))
            else:
                core.randomize_codex(self.codex, (self.selected - 1,))
        else:
            if all_colours:
                core.randomize_claude_all(self.claude)
            else:
                core.randomize_claude(self.claude, (self.claude_token(self.selected),))
        self.status = "All colours randomized" if all_colours else "Selected colour randomized"

    def convert(self):
        if self.product == "codex":
            self.claude = core.codex_to_claude(self.codex)
            self.product = "claude"
        else:
            self.codex = core.claude_to_codex(self.claude)
            self.product = "codex"
        self.selected = self.scroll = 0
        self.status = f"Converted to {self.product.title()} | review, then save"

    def save(self):
        try:
            target = core.save_codex(self.codex) if self.product == "codex" else core.save_claude(self.claude)
            self.status = f"Saved {target} · run /theme to select it"
        except (OSError, ValueError) as error:
            self.status = f"Save failed: {error}"

    def cycle_launch_mode(self):
        index = (LAUNCH_MODES.index(self.launch_mode) + 1) % len(LAUNCH_MODES)
        self.launch_mode = LAUNCH_MODES[index]
        try:
            save_launch_mode(self.launch_mode)
            self.status = f"Next launch: {self.launch_mode} | saved as default"
        except OSError as error:
            self.status = f"Could not save launch preference: {error}"

    def toggle_bold(self):
        if self.product != "codex" or self.selected == 0:
            self.status = "Bold applies to Codex code colours"
            return
        settings = core.codex_rule(self.codex, self.selected - 1)["settings"]
        styles = set(str(settings.get("fontStyle", "")).split())
        styles.symmetric_difference_update({"bold"})
        if styles:
            settings["fontStyle"] = " ".join(sorted(styles))
        else:
            settings.pop("fontStyle", None)
        self.status = f"Bold {'on' if 'bold' in styles else 'off'} for {self.items[self.selected][0]}"

    def toggle_enabled(self):
        if self.product != "claude":
            return
        token = self.claude_token(self.selected)
        overrides = self.claude.setdefault("overrides", {})
        if token in overrides:
            del overrides[token]
            self.status = f"{label(token)} uses the {self.claude.get('base', 'dark')} starting colour"
        else:
            overrides[token] = core.claude_default(token, self.claude.get("base", "dark"))
            self.status = f"{label(token)} enabled"

    def mouse(self):
        try:
            _, x, y, _, state = curses.getmouse()
        except curses.error:
            return
        if not state & (curses.BUTTON1_CLICKED | curses.BUTTON1_PRESSED | curses.BUTTON1_DOUBLE_CLICKED):
            return
        match = next(((item, action) for row, start, end, item, action in reversed(self.regions) if row == y and start <= x < end), None)
        if match is not None:
            item, action = match
            if item >= 0:
                self.selected = item
            self.action(action)

    def action(self, action):
        actions = {
            "edit": self.edit_colour, "toggle": self.toggle_enabled, "view": lambda: setattr(self, "view", "list" if self.view == "preview" else "preview"),
            "codex": lambda: self.switch_product("codex"), "claude": lambda: self.switch_product("claude"), "name": self.edit_name,
            "new": self.new_theme, "open": self.open_theme, "random": self.randomize, "random-all": lambda: self.randomize(True), "convert": self.convert,
            "save": self.save, "launch": self.cycle_launch_mode, "quit": lambda: setattr(self, "running", False),
        }
        actions[action]()

    def switch_product(self, product):
        self.product = product
        self.selected = self.scroll = 0
        self.status = f"Editing {product.title()}"

    def key(self, key):
        count = len(self.items)
        if key == ord("R"):
            self.randomize(all_colours=True)
            return
        if 65 <= key <= 90:
            key += 32
        if key == ord("q"):
            self.running = False
        elif key in (curses.KEY_UP, ord("k")):
            self.selected = (self.selected - 1) % count
        elif key in (curses.KEY_DOWN, ord("j")):
            self.selected = (self.selected + 1) % count
        elif key in (curses.KEY_LEFT, curses.KEY_PPAGE):
            self.selected = max(0, self.selected - self.visible_height())
        elif key in (curses.KEY_RIGHT, curses.KEY_NPAGE):
            self.selected = min(count - 1, self.selected + self.visible_height())
        elif key in (10, 13, curses.KEY_ENTER):
            self.edit_colour()
        elif key == curses.KEY_MOUSE:
            self.mouse()
        elif key == ord("v"):
            self.view = "list" if self.view == "preview" else "preview"; self.scroll = 0
        elif key == ord("1"):
            self.switch_product("codex")
        elif key == ord("2"):
            self.switch_product("claude")
        elif key == ord("e"):
            self.edit_name()
        elif key == ord("n"):
            self.new_theme()
        elif key == ord("o"):
            self.open_theme()
        elif key == ord("r"):
            self.randomize()
        elif key == ord("c"):
            self.convert()
        elif key == ord("s"):
            self.save()
        elif key == ord("m"):
            self.cycle_launch_mode()
        elif key == ord("b"):
            self.toggle_bold()
        elif key == ord("d"):
            if self.product == "codex" and self.selected in (18, 19, 20):
                self.edit_colour(background=True)
            else:
                self.status = "Line fill applies to Added, Removed, or Changed lines"
        elif key == ord(" "):
            self.toggle_enabled()
        elif key == curses.KEY_RESIZE:
            self.status = "Window resized"

    def run(self):
        while self.running:
            self.draw()
            self.key(self.screen.getch())


def main(argv=None):
    parser = argparse.ArgumentParser(description="Design Codex and Claude Code themes inside the terminal")
    parser.add_argument("--product", choices=("codex", "claude"), default="codex")
    parser.add_argument("--print-default-mode", action="store_true")
    parser.add_argument("--set-default-mode", choices=LAUNCH_MODES)
    parser.add_argument("--overlay-smoke-test", action="store_true", help=argparse.SUPPRESS)
    args = parser.parse_args(argv)
    if args.print_default_mode:
        print(load_launch_mode())
        return
    if args.set_default_mode:
        save_launch_mode(args.set_default_mode)
        print(args.set_default_mode)
        return
    if not sys.stdin.isatty() or not sys.stdout.isatty():
        parser.error("the editor needs an interactive terminal; use scripts/theme-studio.sh --window")
    if args.overlay_smoke_test:
        def smoke(screen):
            screen.addstr(0, 0, "Theme Studio overlay")
            screen.refresh()
        curses.wrapper(smoke)
        return
    # curses.wrapper uses the terminal's smcup/rmcup pair and always calls endwin,
    # including after an exception. This mirrors Codex TUI's enter/leave-alt-screen
    # lifecycle without reaching into, signalling, or replacing the Codex process.
    curses.wrapper(lambda screen: Studio(screen, args.product).run())


if __name__ == "__main__":
    main()
