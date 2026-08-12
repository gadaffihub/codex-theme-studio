import json
import plistlib
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import theme_studio_mcp as mcp


class ThemeStudioMcpTests(unittest.TestCase):
    def test_protocol_and_tools(self):
        initialized = mcp.handle({"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2025-06-18"}})
        self.assertEqual(initialized["result"]["protocolVersion"], "2025-06-18")
        listed = mcp.handle({"jsonrpc": "2.0", "id": 2, "method": "tools/list"})
        self.assertEqual({tool["name"] for tool in listed["result"]["tools"]}, {"list_themes", "create_theme", "convert_theme"})

    def test_unknown_protocol_falls_back_to_latest_supported(self):
        response = mcp.handle({"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "9999-12-31"}})
        self.assertEqual(response["result"]["protocolVersion"], "2025-06-18")

    def test_malformed_requests_return_protocol_errors(self):
        self.assertEqual(mcp.handle([])["error"]["code"], -32600)
        self.assertEqual(mcp.handle({"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": []})["error"]["code"], -32602)

    def test_create_and_convert_use_isolated_native_stores(self):
        with tempfile.TemporaryDirectory() as codex, tempfile.TemporaryDirectory() as claude, patch.dict("os.environ", {"CODEX_HOME": codex, "CLAUDE_CONFIG_DIR": claude}):
            created = mcp.call_tool("create_theme", {"product": "codex", "name": "MCP Test", "base": "dark"})
            source = Path(json.loads(created["content"][0]["text"])["saved"])
            self.assertEqual(plistlib.loads(source.read_bytes())["name"], "MCP Test")
            converted = mcp.call_tool("convert_theme", {"source": str(source), "target": "claude"})
            target = Path(json.loads(converted["content"][0]["text"])["saved"])
            self.assertTrue(target.is_file())
            self.assertEqual(json.loads(target.read_text())["base"], "dark")

    def test_invalid_source_is_tool_error(self):
        response = mcp.handle({"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "convert_theme", "arguments": {"source": "/missing", "target": "codex"}}})
        self.assertTrue(response["result"]["isError"])


if __name__ == "__main__":
    unittest.main()
