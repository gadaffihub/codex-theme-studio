import plistlib
import json
import os
import tempfile
import threading
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import server


class ThemeServerTests(unittest.TestCase):
    def test_install_valid_theme_atomically(self):
        theme = {
            "name": "Spectrum Test",
            "settings": [
                {"settings": {"foreground": "#FFFFFF", "background": "#000000"}},
                {"name": "Comments", "scope": "comment", "settings": {"foreground": "#00FFFF", "fontStyle": "italic"}},
            ],
        }
        data = plistlib.dumps(theme, fmt=plistlib.FMT_XML)
        with tempfile.TemporaryDirectory() as directory:
            target = server.install_theme(data, directory)
            self.assertEqual(target.name, "Spectrum-Test.tmTheme")
            self.assertEqual(plistlib.loads(target.read_bytes()), theme)

    def test_rejects_non_theme_plist(self):
        with self.assertRaisesRegex(ValueError, "settings array"):
            server.parse_theme(plistlib.dumps({"name": "No settings"}))

    def test_http_install_reaches_isolated_codex_store(self):
        theme = {
            "name": "HTTP Install",
            "settings": [{"settings": {"foreground": "#FFFFFF"}}],
        }
        with tempfile.TemporaryDirectory() as directory, patch.dict(os.environ, {"CODEX_HOME": directory}):
            httpd = server.ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
            httpd.auth_token = "test-token"
            thread = threading.Thread(target=httpd.serve_forever, daemon=True)
            thread.start()
            base = f"http://127.0.0.1:{httpd.server_port}"
            headers = {"X-Theme-Studio-Token": "test-token"}
            try:
                with self.assertRaises(HTTPError) as blocked_catalog:
                    urlopen(f"{base}/api/themes")
                self.assertEqual(blocked_catalog.exception.code, 403)
                catalog = json.load(urlopen(Request(f"{base}/api/themes", headers=headers)))
                self.assertEqual(len([item for item in catalog["themes"] if item["source"] == "builtin"]), 32)
                body = json.dumps({"content": plistlib.dumps(theme, fmt=plistlib.FMT_XML).decode()}).encode()
                with self.assertRaises(HTTPError) as blocked:
                    urlopen(Request(f"{base}/api/install", body, {"Content-Type": "application/json"}))
                self.assertEqual(blocked.exception.code, 403)
                with self.assertRaises(HTTPError) as malformed:
                    urlopen(Request(f"{base}/api/install", b"[]", {"Content-Type": "application/json", "X-Theme-Studio-Token": "test-token"}))
                self.assertEqual(malformed.exception.code, 400)
                response = json.load(urlopen(Request(f"{base}/api/install", body, {"Content-Type": "application/json", "X-Theme-Studio-Token": "test-token"})))
                target = Path(response["path"])
                self.assertEqual(target, Path(directory) / "themes" / "HTTP-Install.tmTheme")
                self.assertEqual(plistlib.loads(target.read_bytes()), theme)
                catalog = json.load(urlopen(Request(f"{base}/api/themes", headers=headers)))
                self.assertTrue(any(item["file"] == target.name and item["source"] == "installed" for item in catalog["themes"]))
            finally:
                httpd.shutdown()
                httpd.server_close()
                thread.join()

    def test_builds_and_installs_claude_theme(self):
        payload = {
            "name": "Spectrum Claude",
            "base": "dark",
            "overrides": {"claude": "#FF00FF", "success": "ansi:greenBright", "diffAdded": "rgb(0,64,0)"},
        }
        self.assertEqual(json.loads(server.claude_theme_bytes(payload)), payload)
        with tempfile.TemporaryDirectory() as directory:
            target = server.install_claude_theme(payload, directory)
            self.assertEqual(target.name, "spectrum-claude.json")
            self.assertEqual(json.loads(target.read_text()), payload)
        self.assertFalse(server.valid_claude_color("rgb(999,0,0)"))
        self.assertFalse(server.valid_claude_color("ansi256(999)"))


if __name__ == "__main__":
    unittest.main()
