"use strict";

const ThemeConvert = (() => {
  const CODEX_DRAFT = "theme-studio.codex-draft";
  const CLAUDE_DRAFT = "theme-studio.claude-draft";
  const ANSI = {
    black: "#000000", red: "#800000", green: "#008000", yellow: "#808000",
    blue: "#000080", magenta: "#800080", cyan: "#008080", white: "#C0C0C0",
    blackBright: "#808080", redBright: "#FF0000", greenBright: "#00FF00", yellowBright: "#FFFF00",
    blueBright: "#0000FF", magentaBright: "#FF00FF", cyanBright: "#00FFFF", whiteBright: "#FFFFFF",
  };
  const SPECTRUM = ["#FF8000", "#FF0000", "#00FF00", "#FFFF00", "#0000FF", "#FF00FF", "#00FFFF", "#8000FF", "#FF8000", "#FF0000", "#00FF00", "#FFFF00", "#0000FF", "#FF00FF", "#00FFFF", "#8000FF"];

  function ansi256(index) {
    if (index < 16) return Object.values(ANSI)[index];
    if (index < 232) {
      const value = index - 16;
      const levels = [0, 95, 135, 175, 215, 255];
      return `#${[levels[Math.floor(value / 36)], levels[Math.floor((value % 36) / 6)], levels[value % 6]].map((part) => part.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
    }
    const level = 8 + (index - 232) * 10;
    return `#${level.toString(16).padStart(2, "0").repeat(3)}`.toUpperCase();
  }

  function color(value, fallback = "#F5F5F0") {
    const text = String(value || "").trim();
    const short = text.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
    if (short) return `#${short.slice(1).map((part) => part.repeat(2)).join("")}`.toUpperCase();
    const hex = text.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
    if (hex) {
      if (!hex[2]) return `#${hex[1]}`.toUpperCase();
      if (hex[2].toUpperCase() === "00") return SPECTRUM[Number.parseInt(hex[1].slice(0, 2), 16)] || fallback;
      if (hex[2].toUpperCase() === "01") return fallback;
      return `#${hex[1]}`.toUpperCase();
    }
    const rgb = text.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (rgb && rgb.slice(1).every((part) => Number(part) <= 255)) return `#${rgb.slice(1).map((part) => Number(part).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
    const named = text.match(/^ansi:([a-z]+)$/i);
    if (named) return ANSI[Object.keys(ANSI).find((name) => name.toLowerCase() === named[1].toLowerCase())] || fallback;
    const indexed = text.match(/^ansi256\((\d+)\)$/i);
    if (indexed && Number(indexed[1]) < 256) return ansi256(Number(indexed[1]));
    return color(fallback, "#F5F5F0");
  }

  function light(hex) {
    const rgb = [1, 3, 5].map((start) => Number.parseInt(color(hex).slice(start, start + 2), 16));
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722 > 145;
  }

  function scopeRule(theme, target) {
    let best;
    let score = -1;
    for (const rule of (theme.settings || []).slice(1)) {
      for (const selector of String(rule.scope || "").split(",")) {
        const scope = selector.trim().split(/\s+/).pop();
        const next = scope === target ? 1000 + scope.length : target.startsWith(`${scope}.`) ? scope.length : -1;
        if (next >= 0 && next >= score) { best = rule; score = next; }
      }
    }
    return best?.settings || {};
  }

  function codexToClaude(theme) {
    const globals = theme.settings?.[0]?.settings || {};
    const background = color(globals.background, "#181818");
    const foreground = color(globals.foreground, light(background) ? "#181818" : "#F5F5F0");
    const rule = (scope, key = "foreground", fallback = foreground) => color(scopeRule(theme, scope)[key], fallback);
    return {
      name: `${theme.name || "Untitled"} · Claude`,
      base: light(background) ? "light" : "dark",
      overrides: {
        text: foreground,
        inverseText: background,
        claude: rule("entity.name.function", "foreground", rule("keyword.control")),
        inactive: rule("comment"),
        subtle: rule("punctuation"),
        suggestion: rule("string"),
        permission: rule("entity.name.type"),
        remember: rule("string.other.link", "foreground", rule("string")),
        success: rule("markup.inserted.diff"),
        error: rule("markup.deleted.diff"),
        warning: rule("constant.numeric"),
        promptBorder: rule("entity.name.function"),
        planMode: rule("keyword.control"),
        autoAccept: rule("markup.inserted.diff"),
        diffAdded: rule("markup.inserted.diff", "background", "#153315"),
        diffRemoved: rule("markup.deleted.diff", "background", "#3A1515"),
        selectionBg: color(globals.selection, rule("entity.name.function")),
        userMessageBackground: color(globals.lineHighlight, light(background) ? "#E8E8E0" : "#282828"),
        rate_limit_fill: rule("entity.name.function"),
        rate_limit_empty: rule("punctuation"),
        briefLabelYou: rule("keyword.control"),
        briefLabelClaude: rule("entity.name.function"),
      },
    };
  }

  function claudeToCodex(theme) {
    const values = theme.overrides || {};
    const isLight = String(theme.base || "dark").startsWith("light");
    const background = color(values.inverseText, isLight ? "#F5F5F0" : "#181818");
    const foreground = color(values.text, isLight ? "#181818" : "#F5F5F0");
    const get = (token, fallback) => color(values[token], fallback);
    const rules = [
      ["Comments", "comment, punctuation.definition.comment", get("inactive", foreground)],
      ["Strings", "string, string.quoted, string.unquoted, constant.other.symbol", get("suggestion", foreground)],
      ["Numbers and constants", "constant.numeric, constant.language, constant.character", get("warning", foreground)],
      ["Keywords", "keyword.control, keyword.other, storage.modifier", get("planMode", get("claude", foreground)), null, "bold"],
      ["Declarations", "storage.type, keyword.declaration", get("permission", foreground)],
      ["Functions and methods", "entity.name.function, meta.function-call, support.function", get("claude", foreground)],
      ["Types and classes", "entity.name.type, entity.name.class, support.type, support.class", get("ide", get("permission", foreground))],
      ["Variables", "variable, variable.other, variable.language", foreground],
      ["Operators and punctuation", "keyword.operator, punctuation", get("subtle", foreground)],
      ["Diff inserted", "markup.inserted, markup.inserted.diff, diff.inserted", get("success", foreground), get("diffAdded", background)],
      ["Diff deleted", "markup.deleted, markup.deleted.diff, diff.deleted", get("error", foreground), get("diffRemoved", background)],
      ["Markdown headings", "markup.heading, entity.name.section", get("claude", foreground), null, "bold"],
      ["Markdown links", "markup.underline.link, string.other.link", get("remember", foreground)],
      ["Invalid", "invalid, invalid.illegal", get("error", foreground)],
    ].map(([name, scope, fg, bg, fontStyle]) => ({ name, scope, settings: { foreground: fg, ...(bg ? { background: bg } : {}), ...(fontStyle ? { fontStyle } : {}) } }));
    return {
      name: `${theme.name || "Untitled"} · Codex`,
      author: "Converted by Theme Studio",
      settings: [{ settings: { foreground, background } }, ...rules],
    };
  }

  return { ANSI, CLAUDE_DRAFT, CODEX_DRAFT, ansi256, claudeToCodex, codexToClaude, color };
})();

if (typeof module !== "undefined") module.exports = ThemeConvert;
