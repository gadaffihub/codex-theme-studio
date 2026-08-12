#!/usr/bin/env python3
import argparse
import json
import os
import plistlib
import re
import secrets
import tempfile
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse


ROOT = Path(__file__).resolve().parent
BUILTINS = ROOT / "builtin_themes"
MAX_THEME_BYTES = 2_000_000
CLAUDE_BASES = {"dark", "light", "dark-daltonized", "light-daltonized", "dark-ansi", "light-ansi"}
CLAUDE_TOKENS = {
    "claude", "text", "inverseText", "inactive", "subtle", "suggestion", "permission", "remember",
    "success", "error", "warning", "merged", "promptBorder", "planMode", "autoAccept", "bashBorder",
    "ide", "fastMode", "diffAdded", "diffRemoved", "diffAddedDimmed", "diffRemovedDimmed",
    "diffAddedWord", "diffRemovedWord", "userMessageBackground", "userMessageBackgroundHover",
    "bashMessageBackgroundColor", "memoryBackgroundColor", "selectionBg", "rate_limit_fill", "rate_limit_empty",
    "briefLabelYou", "briefLabelClaude", "claudeShimmer", "warningShimmer", "permissionShimmer",
    "promptBorderShimmer", "inactiveShimmer", "fastModeShimmer",
    *(f"{color}_FOR_SUBAGENTS_ONLY" for color in ("red", "blue", "green", "yellow", "purple", "orange", "pink", "cyan")),
    *(f"rainbow_{color}{suffix}" for color in ("red", "orange", "yellow", "green", "blue", "indigo", "violet") for suffix in ("", "_shimmer")),
}


def codex_themes_dir(env=None, home=None):
    env = os.environ if env is None else env
    home = Path.home() if home is None else Path(home)
    codex_home = Path(env.get("CODEX_HOME", home / ".codex")).expanduser()
    return codex_home / "themes"


def parse_theme(data):
    if len(data) > MAX_THEME_BYTES:
        raise ValueError("Theme exceeds 2 MB")
    theme = plistlib.loads(data)
    if not isinstance(theme, dict) or not isinstance(theme.get("settings"), list):
        raise ValueError("Expected a TextMate theme with a settings array")
    if not theme["settings"] or not isinstance(theme["settings"][0], dict):
        raise ValueError("Theme is missing global settings")
    return theme


def safe_filename(name):
    stem = re.sub(r"[^A-Za-z0-9._-]+", "-", name.strip()).strip("-.")
    return f"{stem or 'custom-theme'}.tmTheme"


def safe_claude_filename(name):
    stem = re.sub(r"[^A-Za-z0-9._-]+", "-", name.strip()).strip("-.").lower()
    return f"{stem or 'custom-theme'}.json"


def claude_themes_dir(env=None, home=None):
    env = os.environ if env is None else env
    home = Path.home() if home is None else Path(home)
    return Path(env.get("CLAUDE_CONFIG_DIR", home / ".claude")).expanduser() / "themes"


def valid_claude_color(value):
    if not isinstance(value, str):
        return False
    if re.fullmatch(r"#[0-9A-Fa-f]{3}(?:[0-9A-Fa-f]{3})?", value):
        return True
    rgb = re.fullmatch(r"rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)", value)
    if rgb:
        return all(int(channel) <= 255 for channel in rgb.groups())
    ansi256 = re.fullmatch(r"ansi256\((\d{1,3})\)", value)
    if ansi256:
        return int(ansi256.group(1)) <= 255
    names = {name + suffix for name in ("black", "red", "green", "yellow", "blue", "magenta", "cyan", "white") for suffix in ("", "Bright")}
    return value.removeprefix("ansi:") in names if value.startswith("ansi:") else False


def claude_theme_bytes(payload):
    if not isinstance(payload, dict):
        raise ValueError("Expected Claude theme settings")
    name = str(payload.get("name") or "Custom Theme")[:100]
    base = payload.get("base", "dark")
    overrides = payload.get("overrides", {})
    if base not in CLAUDE_BASES or not isinstance(overrides, dict):
        raise ValueError("Invalid Claude theme base or overrides")
    invalid = set(overrides) - CLAUDE_TOKENS
    if invalid:
        raise ValueError(f"Unknown Claude theme token: {sorted(invalid)[0]}")
    for value in overrides.values():
        if not valid_claude_color(value):
            raise ValueError(f"Invalid Claude theme colour: {value}")
    return (json.dumps({"name": name, "base": base, "overrides": overrides}, indent=2) + "\n").encode()


def install_claude_theme(payload, destination=None):
    data = claude_theme_bytes(payload)
    destination = claude_themes_dir() if destination is None else Path(destination)
    destination.mkdir(parents=True, exist_ok=True)
    target = destination / safe_claude_filename(str(payload.get("name") or "Custom Theme"))
    with tempfile.NamedTemporaryFile(dir=destination, delete=False) as handle:
        handle.write(data)
        temporary = Path(handle.name)
    os.replace(temporary, target)
    return target


def install_theme(data, destination=None):
    theme = parse_theme(data)
    destination = codex_themes_dir() if destination is None else Path(destination)
    destination.mkdir(parents=True, exist_ok=True)
    target = destination / safe_filename(str(theme.get("name") or "custom-theme"))
    with tempfile.NamedTemporaryFile(dir=destination, delete=False) as handle:
        handle.write(data)
        temporary = Path(handle.name)
    os.replace(temporary, target)
    return target


def theme_entry(path, source):
    try:
        theme = parse_theme(path.read_bytes())
        name = path.stem if source == "builtin" else str(theme.get("name") or path.stem)
        return {"name": name, "file": path.name, "source": source}
    except (OSError, ValueError, plistlib.InvalidFileException):
        return None


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, format, *args):
        if self.path.startswith("/api/"):
            super().log_message(format, *args)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_json(self, value, status=200):
        data = json.dumps(value).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def authorized(self):
        return secrets.compare_digest(self.headers.get("X-Theme-Studio-Token", ""), self.server.auth_token)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/") and not self.authorized():
            self.send_json({"error": "Invalid editor token"}, 403)
            return
        if parsed.path == "/api/themes":
            entries = []
            for source, directory in (("builtin", BUILTINS), ("installed", codex_themes_dir())):
                if directory.is_dir():
                    entries.extend(
                        entry
                        for path in sorted(directory.glob("*.tmTheme"), key=lambda p: p.name.lower())
                        if (entry := theme_entry(path, source))
                    )
            self.send_json({"themes": entries, "store": str(codex_themes_dir())})
            return
        if parsed.path == "/api/theme":
            query = parse_qs(parsed.query)
            source = query.get("source", [""])[0]
            filename = Path(query.get("file", [""])[0]).name
            directory = BUILTINS if source == "builtin" else codex_themes_dir()
            path = directory / filename
            if source not in {"builtin", "installed"} or not filename.endswith(".tmTheme") or not path.is_file():
                self.send_json({"error": "Theme not found"}, 404)
                return
            data = path.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "application/xml; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        if path not in {"/api/install", "/api/claude/install"}:
            self.send_json({"error": "Not found"}, 404)
            return
        if not self.authorized():
            self.send_json({"error": "Invalid editor token"}, 403)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > MAX_THEME_BYTES * 2:
                raise ValueError("Invalid request size")
            payload = json.loads(self.rfile.read(length))
            if not isinstance(payload, dict):
                raise ValueError("Request body must be an object")
            if path.startswith("/api/claude/"):
                target = install_claude_theme(payload)
                self.send_json({"ok": True, "path": str(target)})
                return
            content = payload.get("content", "")
            if not isinstance(content, str):
                raise ValueError("Theme content must be text")
            target = install_theme(content.encode())
            self.send_json({"ok": True, "path": str(target)})
        except (ValueError, json.JSONDecodeError, plistlib.InvalidFileException) as error:
            self.send_json({"error": str(error)}, 400)


def main():
    parser = argparse.ArgumentParser(description="Local Codex .tmTheme editor")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--no-browser", action="store_true")
    parser.add_argument("--token", default="")
    args = parser.parse_args()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    server.auth_token = args.token or secrets.token_urlsafe(24)
    url = f"http://127.0.0.1:{server.server_port}/?token={server.auth_token}"
    print(f"Codex Theme Studio: {url}")
    print(f"Theme store: {codex_themes_dir()}")
    if not args.no_browser:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
