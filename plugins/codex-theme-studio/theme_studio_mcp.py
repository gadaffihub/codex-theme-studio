#!/usr/bin/env python3
"""Small stdio MCP bridge for deterministic theme operations."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import theme_core as core


TOOLS = [
    {
        "name": "list_themes",
        "description": "List installed and bundled Codex themes or installed Claude Code themes.",
        "inputSchema": {
            "type": "object",
            "properties": {"product": {"type": "string", "enum": ["codex", "claude"]}},
            "required": ["product"],
            "additionalProperties": False,
        },
    },
    {
        "name": "create_theme",
        "description": "Create and save a validated starter theme in the product's native theme directory.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "product": {"type": "string", "enum": ["codex", "claude"]},
                "name": {"type": "string", "minLength": 1},
                "base": {"type": "string", "enum": ["dark", "light", *core.CLAUDE_BASES[2:]]},
            },
            "required": ["product", "name"],
            "additionalProperties": False,
        },
    },
    {
        "name": "convert_theme",
        "description": "Convert a Codex .tmTheme or Claude Code JSON theme and save the validated result to the other product.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "source": {"type": "string", "minLength": 1},
                "target": {"type": "string", "enum": ["codex", "claude"]},
            },
            "required": ["source", "target"],
            "additionalProperties": False,
        },
    },
]


def text_result(value, *, error=False):
    result = {"content": [{"type": "text", "text": json.dumps(value, indent=2)}]}
    if error:
        result["isError"] = True
    return result


def call_tool(name: str, arguments: dict):
    if not isinstance(arguments, dict):
        raise ValueError("arguments must be an object")
    if name == "list_themes":
        catalog = core.codex_catalog() if arguments.get("product") == "codex" else core.claude_catalog()
        return text_result({"themes": [{"name": title, "path": str(path)} for title, path in catalog]})
    if name == "create_theme":
        product, title = arguments.get("product"), str(arguments.get("name", "")).strip()
        if not title:
            raise ValueError("name is required")
        base = arguments.get("base", "dark")
        if product == "codex":
            if base not in ("dark", "light"):
                raise ValueError("Codex base must be dark or light")
            theme = core.starter_codex(base == "light")
        elif product == "claude":
            theme = core.starter_claude(base)
        else:
            raise ValueError("product must be codex or claude")
        theme["name"] = title
        target = core.save_codex(theme) if product == "codex" else core.save_claude(theme)
        return text_result({"saved": str(target), "selectWith": "/theme"})
    if name == "convert_theme":
        source, target = Path(str(arguments.get("source", ""))).expanduser(), arguments.get("target")
        if not source.is_file():
            raise ValueError("source must be an existing theme file")
        if target == "claude":
            theme = core.codex_to_claude(core.load_codex(source))
            saved = core.save_claude(theme)
        elif target == "codex":
            theme = core.claude_to_codex(core.load_claude(source))
            saved = core.save_codex(theme)
        else:
            raise ValueError("target must be codex or claude")
        return text_result({"saved": str(saved), "selectWith": "/theme", "note": "Review converted colours before selecting."})
    raise ValueError(f"Unknown tool: {name}")


def handle(request: dict):
    if not isinstance(request, dict):
        return {"jsonrpc": "2.0", "id": None, "error": {"code": -32600, "message": "Request must be an object"}}
    request_id, method = request.get("id"), request.get("method")
    if method == "initialize":
        params = request.get("params")
        if params is None:
            params = {}
        if not isinstance(params, dict):
            return {"jsonrpc": "2.0", "id": request_id, "error": {"code": -32602, "message": "params must be an object"}}
        requested = params.get("protocolVersion")
        version = requested if requested in {"2024-11-05", "2025-03-26", "2025-06-18"} else "2025-06-18"
        result = {"protocolVersion": version, "capabilities": {"tools": {}}, "serverInfo": {"name": "codex-theme-studio", "version": "0.2.0"}}
    elif method == "ping":
        result = {}
    elif method == "tools/list":
        result = {"tools": TOOLS}
    elif method == "tools/call":
        params = request.get("params")
        if params is None:
            params = {}
        if not isinstance(params, dict):
            return {"jsonrpc": "2.0", "id": request_id, "error": {"code": -32602, "message": "params must be an object"}}
        try:
            arguments = params.get("arguments") or {}
            result = call_tool(str(params.get("name", "")), arguments)
        except (OSError, ValueError, TypeError, json.JSONDecodeError) as error:
            result = text_result({"error": str(error)}, error=True)
    elif method and method.startswith("notifications/"):
        return None
    else:
        return {"jsonrpc": "2.0", "id": request_id, "error": {"code": -32601, "message": "Method not found"}}
    return {"jsonrpc": "2.0", "id": request_id, "result": result}


def main():
    for line in sys.stdin:
        try:
            response = handle(json.loads(line))
        except (json.JSONDecodeError, TypeError, AttributeError) as error:
            response = {"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": str(error)}}
        if response is not None:
            print(json.dumps(response, separators=(",", ":")), flush=True)


if __name__ == "__main__":
    main()
