"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { claudeToCodex, codexToClaude, color } = require("./theme-convert.js");

const codex = {
  name: "Spectrum",
  settings: [
    { settings: { foreground: "#F5F5F0", background: "#181818", selection: "#00FFFF" } },
    { name: "Keywords", scope: "keyword.control", settings: { foreground: "#FFFF00" } },
    { name: "Functions", scope: "entity.name.function", settings: { foreground: "#00FFFF" } },
    { name: "Inserted", scope: "markup.inserted.diff", settings: { foreground: "#00FF00", background: "#153315" } },
    { name: "Deleted", scope: "markup.deleted.diff", settings: { foreground: "#FF0000", background: "#3A1515" } },
  ],
};
const claude = codexToClaude(codex);
assert.equal(claude.base, "dark");
assert.equal(claude.overrides.claude, "#00FFFF");
assert.equal(claude.overrides.planMode, "#FFFF00");
assert.equal(claude.overrides.diffAdded, "#153315");
assert.equal(claude.overrides.selectionBg, "#00FFFF");

const roundTrip = claudeToCodex(claude);
assert.equal(roundTrip.settings[0].settings.foreground, "#F5F5F0");
assert.equal(roundTrip.settings[0].settings.background, "#181818");
assert.ok(roundTrip.settings.some((rule) => rule.scope?.includes("markup.inserted.diff") && rule.settings.background === "#153315"));
assert.ok(roundTrip.settings.some((rule) => rule.scope?.includes("entity.name.function") && rule.settings.foreground === "#00FFFF"));

assert.equal(color("#abc"), "#AABBCC");
assert.equal(color("rgb(1, 2, 255)"), "#0102FF");
assert.equal(color("ansi:cyanBright"), "#00FFFF");
assert.equal(color("ansi256(23)"), "#005F5F");

for (const [file, required] of [["index.html", "Edit as Claude"], ["claude.html", "Edit as Codex"]]) {
  const html = fs.readFileSync(path.join(__dirname, file), "utf8");
  assert.ok(html.includes("Theme Studio"));
  assert.ok(html.includes(required));
  assert.ok(html.includes('href="ui.css"'));
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${file} contains duplicate ids`);
  assert.ok(!html.match(/id="(?:claude-)?new-(?:dark|light)"/), `${file} has no appearance-specific starter buttons`);
  assert.ok(!html.includes("Export file"), `${file} saves themes directly to /theme instead of Downloads`);
}
assert.ok(fs.readFileSync(path.join(__dirname, "index.html"), "utf8").includes('id="new-theme"'));
assert.ok(fs.readFileSync(path.join(__dirname, "claude.html"), "utf8").includes('id="claude-new-theme"'));
assert.ok(fs.readFileSync(path.join(__dirname, "claude.html"), "utf8").includes('id="claude-randomize"'));
assert.ok(fs.readFileSync(path.join(__dirname, "claude.html"), "utf8").includes('id="claude-randomize-selected"'));
assert.match(fs.readFileSync(path.join(__dirname, "ui.css"), "utf8"), /prefers-color-scheme:\s*dark/);
assert.ok(fs.readFileSync(path.join(__dirname, "claude.html"), "utf8").includes('data-token="promptBorder"'));
const claudeHTML = fs.readFileSync(path.join(__dirname, "claude.html"), "utf8");
assert.equal(new Set([...claudeHTML.matchAll(/data-token="([^"]+)"/g)].map((match) => match[1])).size, 61, "every Claude colour needs a clickable terminal target");
assert.equal((claudeHTML.match(/data-claude-page="preview"/g) || []).length, 1, "Claude uses one terminal preview");
assert.equal((claudeHTML.match(/data-claude-page="list"/g) || []).length, 1, "Claude uses one direct-edit list");

console.log("verified: Codex ↔ Claude conversion mappings and colour normalization");
