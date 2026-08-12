"""Shared theme data, conversion, loading, and native-store saving."""

from __future__ import annotations

import json
import plistlib
import random
import re
from pathlib import Path

from server import BUILTINS, claude_themes_dir, codex_themes_dir, install_claude_theme, install_theme, parse_theme


SPECTRUM = ("#FF0000", "#FF8000", "#FFFF00", "#00FF00", "#00FFFF", "#0000FF", "#8000FF", "#FF00FF")
CODEX_RULES = (
    ("Comments", "comment, punctuation.definition.comment", "#8000FF", None, False, "Notes inside code", "// note"),
    ("Strings", "string, string.quoted, string.unquoted, constant.other.symbol", "#00FF00", None, False, "Quoted text", '"hello"'),
    ("Special characters", "constant.character.escape, string.regexp", "#FF00FF", None, False, "Escapes and patterns", r"\n"),
    ("String values", "meta.interpolation, punctuation.section.interpolation", "#00FFFF", None, False, "Values inserted into text", r"\(name)"),
    ("Numbers and fixed values", "constant.numeric, constant.language, constant.character, variable.other.constant", "#FF00FF", None, False, "Numbers, true, and false", "42"),
    ("Control words", "keyword.control, keyword.other, storage.modifier", "#FFFF00", None, True, "if, return, and let", "if"),
    ("Declaration words", "storage.type, keyword.declaration", "#FF0000", None, False, "func, class, and struct", "struct"),
    ("Function names", "entity.name.function, meta.function-call, support.function", "#00FFFF", None, False, "Named actions", "save()"),
    ("Build instructions", "entity.name.function.preprocessor, meta.preprocessor, keyword.control.directive", "#FF00FF", None, True, "Compiler instructions", "#if"),
    ("Type and class names", "entity.name.type, entity.name.class, entity.name.namespace, support.type, support.class", "#0000FF", None, False, "Types and classes", "Theme"),
    ("Function inputs", "variable.parameter", "#FF8000", None, False, "Function inputs", "path"),
    ("Variables", "variable, variable.other, variable.language", "#F5F5F0", None, False, "Named values", "message"),
    ("Properties", "variable.other.member, variable.other.property", "#00FFFF", None, False, "Object properties", ".count"),
    ("Operators", "keyword.operator", "#FFFF00", None, False, "Operators", "="),
    ("Punctuation", "punctuation", "#F5F5F0", None, False, "Brackets and separators", "{ }"),
    ("Tags", "entity.name.tag, punctuation.definition.tag", "#FF0000", None, False, "Markup tags", "<panel>"),
    ("Tag details", "entity.other.attribute-name", "#FF8000", None, False, "Markup attributes", "state="),
    ("Added lines", "markup.inserted, markup.inserted.diff, diff.inserted", "#00FF00", "#153315", False, "Lines added to a file", "+ added"),
    ("Removed lines", "markup.deleted, markup.deleted.diff, diff.deleted", "#FF0000", "#3A1515", False, "Lines removed from a file", "- removed"),
    ("Changed lines", "markup.changed, markup.changed.diff, diff.changed", "#FFFF00", "#333315", False, "Lines changed in a file", "~ changed"),
    ("Change headings", "meta.diff, meta.diff.header", "#0000FF", None, True, "File-change headings", "@@ file"),
    ("Headings", "markup.heading, entity.name.section", "#FFFF00", None, True, "Formatted headings", "Heading"),
    ("Links", "markup.underline.link, string.other.link", "#00FFFF", None, False, "Formatted links", "theme picker"),
    ("Inline code", "markup.raw, markup.raw.inline", "#00FF00", None, False, "Inline code", "/theme"),
    ("Quotes and lists", "markup.quote, punctuation.definition.list", "#8000FF", None, False, "Quotes and list markers", "> quote"),
    ("Errors", "invalid, invalid.illegal", "#FF0000", None, False, "Invalid code", "error"),
)

CLAUDE_GROUPS = (
    ("Text and accents", (("claude", "Assistant label and spinner"), ("text", "Default foreground"), ("inverseText", "Text on colour fills"), ("inactive", "Hints and timestamps"), ("subtle", "Faint borders and text"), ("suggestion", "Suggestions and picker selection"), ("permission", "Permission dialog borders"), ("remember", "Memory and CLAUDE.md"))),
    ("Status", (("success", "Passing and success"), ("error", "Failures and errors"), ("warning", "Warnings and auto mode"), ("merged", "Merged pull requests"))),
    ("Input and modes", (("promptBorder", "Default prompt border"), ("planMode", "Plan mode accent"), ("autoAccept", "Accept-edits mode"), ("bashBorder", "Shell prompt border"), ("ide", "IDE connection"), ("fastMode", "Fast mode"))),
    ("Diffs", (("diffAdded", "Added-line background"), ("diffRemoved", "Removed-line background"), ("diffAddedDimmed", "Added context"), ("diffRemovedDimmed", "Removed context"), ("diffAddedWord", "Added word highlight"), ("diffRemovedWord", "Removed word highlight"))),
    ("Fullscreen", (("userMessageBackground", "User message background"), ("userMessageBackgroundHover", "Hovered user message"), ("bashMessageBackgroundColor", "Shell message background"), ("memoryBackgroundColor", "Memory message background"), ("selectionBg", "Mouse selection"))),
    ("Usage and labels", (("rate_limit_fill", "Used meter portion"), ("rate_limit_empty", "Empty meter portion"), ("briefLabelYou", "You speaker label"), ("briefLabelClaude", "Claude speaker label"))),
    ("Shimmer", (("claudeShimmer", "Claude spinner gradient"), ("warningShimmer", "Warning gradient"), ("permissionShimmer", "Permission gradient"), ("promptBorderShimmer", "Prompt gradient"), ("inactiveShimmer", "Inactive gradient"), ("fastModeShimmer", "Fast-mode gradient"))),
    ("Subagents", tuple((f"{colour}_FOR_SUBAGENTS_ONLY", f"{colour.title()} subagent") for colour in ("red", "blue", "green", "yellow", "purple", "orange", "pink", "cyan"))),
    ("Ultrathink rainbow", tuple((f"rainbow_{colour}{suffix}", f"{colour.title()} {'shimmer' if suffix else 'rainbow'}") for colour in ("red", "orange", "yellow", "green", "blue", "indigo", "violet") for suffix in ("", "_shimmer"))),
)
CLAUDE_TOKENS = tuple(token for _, group in CLAUDE_GROUPS for token, _ in group)
CLAUDE_DESCRIPTIONS = {token: description for _, group in CLAUDE_GROUPS for token, description in group}
CLAUDE_ENABLED = {
    "claude", "text", "inactive", "suggestion", "permission", "remember", "success", "error", "warning",
    "promptBorder", "planMode", "autoAccept", "diffAdded", "diffRemoved", "userMessageBackground", "selectionBg",
    "rate_limit_fill", "rate_limit_empty", "briefLabelYou", "briefLabelClaude",
}
CLAUDE_DARK = {
    "claude": "#FF8000", "text": "#F5F5F0", "inverseText": "#181818", "inactive": "#00FFFF", "subtle": "#8000FF",
    "suggestion": "#00FFFF", "permission": "#FF00FF", "remember": "#00FFFF", "success": "#00FF00", "error": "#FF0000",
    "warning": "#FFFF00", "merged": "#FF00FF", "promptBorder": "#00FFFF", "planMode": "#0000FF", "autoAccept": "#00FF00",
    "bashBorder": "#FF8000", "ide": "#8000FF", "fastMode": "#FF00FF", "diffAdded": "#005F00", "diffRemoved": "#5F0000",
    "diffAddedDimmed": "#003700", "diffRemovedDimmed": "#370000", "diffAddedWord": "#008700", "diffRemovedWord": "#870000",
    "userMessageBackground": "#28184A", "userMessageBackgroundHover": "#3C246F", "bashMessageBackgroundColor": "#402000",
    "memoryBackgroundColor": "#003F3F", "selectionBg": "#005F5F", "rate_limit_fill": "#00FFFF", "rate_limit_empty": "#353535",
    "briefLabelYou": "#00FFFF", "briefLabelClaude": "#FF8000",
}
CLAUDE_BASE_OVERRIDES = {
    "dark-daltonized": {"claude": "#FF7814", "claudeShimmer": "#FFA546", "success": "#66FF66", "error": "#FF6666", "warning": "#FFEA32", "suggestion": "#7AB4E8", "promptBorder": "#3399FF", "planMode": "#7AB4E8", "diffAdded": "#225C2B", "diffRemoved": "#7A2936"},
    "light-daltonized": {"claude": "#FF6A00", "claudeShimmer": "#FF9632", "success": "#2F9D44", "error": "#D1454B", "warning": "#CA8A04", "suggestion": "#2563EB", "promptBorder": "#2563EB", "planMode": "#2563EB", "diffAdded": "#C7E1CB", "diffRemoved": "#FDD2D8"},
    "dark-ansi": {"claude": "#FF00FF", "text": "#FFFFFF", "inactive": "#808080", "subtle": "#C0C0C0", "suggestion": "#00FFFF", "permission": "#FF00FF", "success": "#00FF00", "error": "#FF0000", "warning": "#FFFF00", "promptBorder": "#00FFFF", "planMode": "#0000FF"},
    "light-ansi": {"claude": "#800080", "text": "#000000", "inactive": "#808080", "subtle": "#C0C0C0", "suggestion": "#0000FF", "permission": "#800080", "success": "#008000", "error": "#800000", "warning": "#808000", "promptBorder": "#008080", "planMode": "#000080"},
}


def inverse(hex_colour: str) -> str:
    value = int(normalize_colour(hex_colour)[1:], 16)
    return f"#{0xFFFFFF ^ value:06X}"


def normalize_colour(value, fallback="#F5F5F0") -> str:
    text = str(value or "").strip()
    short = re.fullmatch(r"#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])", text)
    if short:
        return "#" + "".join(part * 2 for part in short.groups()).upper()
    full = re.fullmatch(r"#([0-9a-fA-F]{6})(?:[0-9a-fA-F]{2})?", text)
    return f"#{full.group(1).upper()}" if full else fallback


def claude_default(token: str, base="dark") -> str:
    if isinstance(base, bool):
        base = "light" if base else "dark"
    light = str(base).startswith("light")
    base_colour = CLAUDE_BASE_OVERRIDES.get(str(base), {}).get(token)
    colour = base_colour or CLAUDE_DARK.get(token)
    if colour is None:
        colour = SPECTRUM[sum(map(ord, token)) % len(SPECTRUM)]
    return inverse(colour) if light and base_colour is None else colour


def starter_codex(light=False) -> dict:
    rules = []
    for name, scope, foreground, background, bold, _, _ in CODEX_RULES:
        settings = {"foreground": inverse(foreground) if light and foreground != "#F5F5F0" else foreground}
        if background:
            settings["background"] = inverse(background) if light else background
        if bold:
            settings["fontStyle"] = "bold"
        rules.append({"name": name, "scope": scope, "settings": settings})
    return {
        "name": "Untitled Light" if light else "Untitled Dark", "author": "",
        "settings": [{"settings": {"foreground": "#181818" if light else "#F5F5F0", "background": "#F5F5F0" if light else "#181818"}}, *rules],
    }


CLAUDE_BASES = ("dark", "light", "dark-daltonized", "light-daltonized", "dark-ansi", "light-ansi")


def starter_claude(base="dark") -> dict:
    if isinstance(base, bool):
        base = "light" if base else "dark"
    if base not in CLAUDE_BASES:
        raise ValueError("Unknown Claude theme base")
    light = base.startswith("light")
    return {
        "name": f"Untitled Claude {base.replace('-', ' ').title()}", "base": base,
        "overrides": {token: claude_default(token, base) for token in CLAUDE_ENABLED},
    }


def codex_rule(theme: dict, index: int) -> dict:
    name, scope, foreground, background, bold, *_ = CODEX_RULES[index]
    rules = theme.setdefault("settings", [{"settings": {}}])[1:]
    found = next((rule for rule in rules if rule.get("name") == name or rule.get("scope") == scope), None)
    if found is None:
        found = {"name": name, "scope": scope, "settings": {"foreground": foreground}}
        if background:
            found["settings"]["background"] = background
        if bold:
            found["settings"]["fontStyle"] = "bold"
        theme["settings"].append(found)
    return found


def scope_colour(theme: dict, target: str, key="foreground", fallback="#F5F5F0") -> str:
    best, score = None, -1
    for rule in theme.get("settings", [])[1:]:
        for selector in str(rule.get("scope", "")).split(","):
            positive = selector.split(" - ", 1)[0].strip().split()
            scope = positive[-1] if positive else ""
            next_score = 1000 + len(scope) if scope == target else len(scope) if scope and target.startswith(scope + ".") else -1
            if next_score >= score:
                best, score = rule, next_score
    return normalize_colour((best or {}).get("settings", {}).get(key), fallback)


def is_light(hex_colour: str) -> bool:
    value = normalize_colour(hex_colour)
    red, green, blue = (int(value[index:index + 2], 16) for index in (1, 3, 5))
    return red * .2126 + green * .7152 + blue * .0722 > 145


def codex_to_claude(theme: dict) -> dict:
    globals_ = theme.get("settings", [{}])[0].get("settings", {})
    background = normalize_colour(globals_.get("background"), "#181818")
    foreground = normalize_colour(globals_.get("foreground"), "#181818" if is_light(background) else "#F5F5F0")
    rule = lambda scope, fallback=foreground, key="foreground": scope_colour(theme, scope, key, fallback)
    return {"name": f"{theme.get('name', 'Untitled')} - Claude", "base": "light" if is_light(background) else "dark", "overrides": {
        "text": foreground, "inverseText": background, "claude": rule("entity.name.function", rule("keyword.control")),
        "inactive": rule("comment"), "subtle": rule("punctuation"), "suggestion": rule("string"), "permission": rule("entity.name.type"),
        "remember": rule("string.other.link", rule("string")), "success": rule("markup.inserted.diff"), "error": rule("markup.deleted.diff"),
        "warning": rule("constant.numeric"), "promptBorder": rule("entity.name.function"), "planMode": rule("keyword.control"),
        "autoAccept": rule("markup.inserted.diff"), "diffAdded": rule("markup.inserted.diff", "#153315", "background"),
        "diffRemoved": rule("markup.deleted.diff", "#3A1515", "background"), "selectionBg": normalize_colour(globals_.get("selection"), rule("entity.name.function")),
        "userMessageBackground": normalize_colour(globals_.get("lineHighlight"), "#E8E8E0" if is_light(background) else "#282828"),
        "rate_limit_fill": rule("entity.name.function"), "rate_limit_empty": rule("punctuation"), "briefLabelYou": rule("keyword.control"), "briefLabelClaude": rule("entity.name.function"),
    }}


def claude_to_codex(theme: dict) -> dict:
    values = theme.get("overrides", {})
    light = str(theme.get("base", "dark")).startswith("light")
    get = lambda token, fallback: normalize_colour(values.get(token), fallback)
    background = get("inverseText", "#F5F5F0" if light else "#181818")
    foreground = get("text", "#181818" if light else "#F5F5F0")
    result = starter_codex(light)
    result["name"] = f"{theme.get('name', 'Untitled')} - Codex"
    result["author"] = "Converted by Theme Studio"
    result["settings"][0]["settings"].update({"foreground": foreground, "background": background})
    mapping = {0: "inactive", 1: "suggestion", 4: "warning", 5: "planMode", 6: "permission", 7: "claude", 9: "ide", 17: "success", 18: "error", 21: "claude", 22: "remember", 25: "error"}
    for index, token in mapping.items():
        codex_rule(result, index)["settings"]["foreground"] = get(token, foreground)
    codex_rule(result, 17)["settings"]["background"] = get("diffAdded", background)
    codex_rule(result, 18)["settings"]["background"] = get("diffRemoved", background)
    return result


def randomize_codex(theme: dict, indices=None, rng=random) -> None:
    for index in range(len(CODEX_RULES)) if indices is None else indices:
        rule = codex_rule(theme, index)
        rule["settings"]["foreground"] = rng.choice(SPECTRUM)
        if CODEX_RULES[index][3]:
            rule["settings"]["background"] = rng.choice(("#153315", "#3A1515", "#333315", "#152A3A", "#30153A"))


def randomize_claude(theme: dict, tokens=None, rng=random) -> None:
    overrides = theme.setdefault("overrides", {})
    selected = tuple(overrides) if tokens is None else tokens
    for token in selected:
        overrides[token] = rng.choice(SPECTRUM)


def randomize_claude_all(theme: dict, rng=random) -> None:
    theme["overrides"] = {token: rng.choice(SPECTRUM) for token in CLAUDE_TOKENS}


def codex_catalog() -> list[tuple[str, Path]]:
    paths = list(BUILTINS.glob("*.tmTheme")) + list(codex_themes_dir().glob("*.tmTheme"))
    return sorted(((path.stem, path) for path in paths), key=lambda item: item[0].lower())


def claude_catalog() -> list[tuple[str, Path]]:
    return sorted(((path.stem, path) for path in claude_themes_dir().glob("*.json")), key=lambda item: item[0].lower())


def load_codex(path: Path) -> dict:
    return parse_theme(path.read_bytes())


def load_claude(path: Path) -> dict:
    value = json.loads(path.read_text())
    if not isinstance(value, dict) or not isinstance(value.get("overrides", {}), dict):
        raise ValueError("Expected a Claude Code theme")
    return value


def save_codex(theme: dict) -> Path:
    return install_theme(plistlib.dumps(theme, fmt=plistlib.FMT_XML, sort_keys=False))


def save_claude(theme: dict) -> Path:
    return install_claude_theme(theme)
