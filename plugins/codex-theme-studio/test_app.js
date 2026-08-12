const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  DEFAULT_RULES,
  GLOBAL_GROUPS,
  TERMINAL_PALETTES,
  TERMINAL_TARGETS,
  ansiIndexColor,
  codexSurface,
  globalExampleKind,
  hslToHex,
  normalizeTheme,
  presetRuleIndex,
  resolveCodexColor,
  ruleAllowsBackground,
  ruleScore,
  selectorScore,
  serializeThemeObject,
  starterTheme,
  validColor,
} = require("./app.js");

const dark = normalizeTheme(starterTheme(false));
const light = normalizeTheme(starterTheme(true));

assert.equal(dark.settings[0].settings.background, "#181818");
assert.equal(light.settings[0].settings.background, "#F5F5F0");
assert.ok(dark.settings.length > 20, "starter includes complete scope coverage");
assert.equal(DEFAULT_RULES.length, 26);
assert.ok(DEFAULT_RULES.every(([, , , , style]) => !style || style === "bold"), "Codex only renders bold TextMate emphasis");
const globalFields = GLOBAL_GROUPS.flatMap(([, fields]) => fields);
assert.equal(globalFields.length, 1);
assert.equal(globalFields[0][0], "foreground");
assert.deepEqual(TERMINAL_TARGETS, ["foreground", "background", ...Array.from({ length: 16 }, (_, index) => `ansi-${index}`)]);
assert.equal(hslToHex(0, 100, 50), "#FF0000");
assert.equal(hslToHex(120, 100, 50), "#00FF00");
assert.equal(hslToHex(240, 100, 50), "#0000FF");
assert.equal(codexSurface("#000000"), "#1F1F1F");
assert.equal(codexSurface("#FFFFFF"), "#F5F5F5");
assert.ok(dark.settings.slice(1).every((rule) => Object.keys(rule.settings).every((key) => ["foreground", "background", "fontStyle"].includes(key))));
assert.ok(dark.settings.some((rule) => rule.scope?.includes("markup.inserted.diff")));
assert.ok(dark.settings.some((rule) => rule.scope?.includes("invalid.illegal")));
assert.ok(selectorScore("comment", "comment.line.double-slash") > 0);
assert.ok(selectorScore("string, comment", "keyword.control") < 0);
assert.ok(validColor("#74F7E7"));
assert.ok(validColor("#74F7E7CC"));
assert.ok(!validColor("grey"));
assert.equal(globalExampleKind("selectionBorder"), "border");
assert.equal(globalExampleKind("selection"), "background");
assert.equal(globalExampleKind("selectionForeground"), "foreground");
assert.equal(globalExampleKind("lineHighlight"), "background");
assert.equal(globalExampleKind("caret"), "caret");
assert.equal(ruleAllowsBackground({ scope: "markup.inserted.diff" }), true);
assert.equal(ruleAllowsBackground({ scope: "string.quoted" }), false);
assert.equal(presetRuleIndex([{ name: "One", scope: "one" }, { name: "Keywords", scope: "custom" }], "Keywords", "keyword.control"), 1);
assert.equal(presetRuleIndex([{ name: "One", scope: "one" }], "Keywords", "keyword.control"), -1);
assert.ok(ruleScore({ scope: "string, comment" }, "string.quoted.double") > 0);
assert.equal(ruleScore({ scope: "comment" }, "string.quoted.double"), -1);
assert.equal(resolveCodexColor("#02000000", "#ABCDEF", TERMINAL_PALETTES["spectrum-dark"]), "#00FF00");
assert.equal(resolveCodexColor("#00000001", "#ABCDEF", TERMINAL_PALETTES["spectrum-dark"]), "#ABCDEF");
assert.equal(resolveCodexColor("#11223380", "#ABCDEF", TERMINAL_PALETTES["spectrum-dark"]), "#112233");
assert.equal(ansiIndexColor(16, TERMINAL_PALETTES["spectrum-dark"]), "#000000");
assert.equal(ansiIndexColor(23, TERMINAL_PALETTES["spectrum-dark"]), "#005F5F");
assert.equal(ansiIndexColor(255, TERMINAL_PALETTES["spectrum-dark"]), "#EEEEEE");
for (let index = 0; index < 256; index += 1) assert.match(ansiIndexColor(index, TERMINAL_PALETTES["spectrum-dark"]), /^#[0-9A-F]{6}$/);
for (const filename of ["Ansi.tmTheme", "Base16.tmTheme", "Base16-256.tmTheme"]) {
  const source = fs.readFileSync(path.join(__dirname, "builtin_themes", filename), "utf8");
  const encoded = source.match(/#[0-9A-Fa-f]{8}/g) || [];
  assert.ok(encoded.length > 10, `${filename} should contain encoded palette colours`);
  for (const color of encoded) {
    assert.match(resolveCodexColor(color, "#F5F5F0", TERMINAL_PALETTES["spectrum-dark"]), /^#[0-9A-F]{6}$/);
  }
}

const xml = serializeThemeObject(dark);
const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
for (const required of ['id="install"', 'id="randomize-selected"', 'id="randomize"', 'id="convert-claude"', 'id="theme-map"', 'id="active-colour"', 'id="active-colour-picker"', 'id="active-colour-hex"', 'data-status-part="workspace"', 'data-status-part="goal"', 'data-view="preview"', 'class="codex-composer"', 'data-view="map"']) {
  assert.ok(html.includes(required), `missing UI surface: ${required}`);
}
assert.ok(html.includes('id="terminal-palette"'), "ANSI and Base16 previews expose terminal palette selection");
assert.ok(!html.includes('id="selection-pane"') && !html.includes('id="rule-editor"'), "Codex has no detached third editor surface");
const claudeHtml = fs.readFileSync(path.join(__dirname, "claude.html"), "utf8");
assert.ok(claudeHtml.includes('id="claude-active-colour"') && claudeHtml.includes('id="claude-active-hex"'), "Claude preview has an inline visible colour editor");
assert.ok(!claudeHtml.includes('id="claude-editor"'), "Claude has no detached third editor surface");
assert.ok(!html.includes('id="terminal-colour-editor"'), "terminal-only colours are not exposed as Codex theme controls");
assert.ok(!html.includes('class="statusbar"'), "no detached editor footer competes with the terminal preview");
assert.ok(!html.includes('data-derived-role="background"') && !html.includes('class="user-message"'), "terminal-owned prompt backgrounds are absent from Codex theme controls");
assert.equal((html.match(/class="tab(?: active)?"/g) || []).length, 2, "Codex has one preview and one colour list");
assert.equal((html.match(/data-view="preview"/g) || []).length, 1, "Codex uses one terminal preview");
assert.ok(!html.includes('data-part="Code"') && !html.includes('data-part="File changes"'), "Codex has no detached fake preview sections");
const targets = [...html.matchAll(/data-(?:scope|line-scope)="([^"]+)"|data-scope-list="([^"]+)"/g)].flatMap((match) => (match[1] || match[2]).split("|"));
for (const [name, scope] of DEFAULT_RULES) assert.ok(targets.some((target) => ruleScore({ scope }, target) >= 0), `${name} needs a clickable terminal target`);
assert.deepEqual([...html.matchAll(/data-preset-target="(\d+)"/g)].map((match) => Number(match[1])).filter((value, index, all) => all.indexOf(value) === index).sort((a, b) => a - b), [...DEFAULT_RULES.keys()], "each Codex category has an explicit clickable preview example");
const claudeTokens = [...claudeHtml.matchAll(/data-token="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(claudeTokens).size, 61, "all 61 Claude tokens have clickable preview examples");
assert.ok(claudeHtml.includes('class="claude-state-grid"'), "rare Claude states are visible without a disclosure");
assert.ok(claudeHtml.includes('id="claude-randomize-selected"'), "Claude supports selected-only randomization");
for (const base of ["dark", "light", "dark-daltonized", "light-daltonized", "dark-ansi", "light-ansi"]) assert.ok(claudeHtml.includes(`value="${base}"`), `${base} is selectable`);
const claudeCss = fs.readFileSync(path.join(__dirname, "claude.css"), "utf8");
assert.ok(claudeCss.includes('.claude-user[data-token=userMessageBackgroundHover]'), "hovered message token owns its fill");
assert.ok(claudeCss.includes('border-left-color:var(--token-bashBorder)'), "bashBorder owns the shell border");
assert.ok(!claudeCss.match(/\.claude-command[^}]*!important/), "inverseText is not masked on command bars");
assert.ok(claudeCss.includes('[data-token$="Shimmer"]'), "shimmer tokens render as gradients");
const uiCss = fs.readFileSync(path.join(__dirname, "ui.css"), "utf8");
assert.ok(!uiCss.includes('.activity-line [data-terminal-role]'), "Codex ANSI activity colours are not flattened");
assert.ok(!claudeHtml.includes('class="statusbar"'), "Claude has no detached editor footer");
assert.ok(html.includes('id="new-theme"'), "device-aware theme starter is available");
assert.ok(!html.match(/id="new-(?:dark|light)"/), "appearance-specific starter buttons were removed");
assert.ok(!html.includes("/" + "Users" + "/"), "the editor should not contain a local home path");
const directory = fs.mkdtempSync(path.join(os.tmpdir(), "codex-theme-studio-"));
const file = path.join(directory, "test.tmTheme");
try {
  fs.writeFileSync(file, xml);
  execFileSync("plutil", ["-lint", file]);
} finally {
  fs.rmSync(directory, { recursive: true });
}

console.log("verified: starter themes, scopes, colours, selector matching, and XML serialization");
