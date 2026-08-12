const GLOBAL_GROUPS = [
  ["Default", [["foreground", "Unmatched code text", "color", "works"]]],
];

const DEFAULT_RULES = [
  ["Comments", "comment, punctuation.definition.comment", "#8000FF", null, null, "Notes written inside code"],
  ["Strings", "string, string.quoted, string.unquoted, constant.other.symbol", "#00FF00", null, null, "Quoted text"],
  ["Special characters", "constant.character.escape, string.regexp", "#FF00FF", null, null, "Special patterns inside text"],
  ["String values", "meta.interpolation, punctuation.section.interpolation", "#00FFFF", null, null, "Values inserted into text"],
  ["Numbers and fixed values", "constant.numeric, constant.language, constant.character, variable.other.constant", "#FF00FF", null, null, "Numbers, true, false, and fixed values"],
  ["Control words", "keyword.control, keyword.other, storage.modifier", "#FFFF00", null, "bold", "Words such as if, return, and let"],
  ["Declaration words", "storage.type, keyword.declaration", "#FF0000", null, null, "Words that create a function or type"],
  ["Function names", "entity.name.function, meta.function-call, support.function", "#00FFFF", null, null, "Named actions and commands"],
  ["Build instructions", "entity.name.function.preprocessor, meta.preprocessor, keyword.control.directive", "#FF00FF", null, "bold", "Compiler and build instructions"],
  ["Type and class names", "entity.name.type, entity.name.class, entity.name.namespace, support.type, support.class", "#0000FF", null, null, "Names of data types and classes"],
  ["Function inputs", "variable.parameter", "#FF8000", null, null, "Values accepted by a function"],
  ["Variables", "variable, variable.other, variable.language", "#F5F5F0", null, null, "Named values in code"],
  ["Properties", "variable.other.member, variable.other.property", "#00FFFF", null, null, "Named parts of an object"],
  ["Operators", "keyword.operator", "#FFFF00", null, null, "Symbols such as +, =, and →"],
  ["Punctuation", "punctuation", "#F5F5F0", null, null, "Brackets, commas, and separators"],
  ["Tags", "entity.name.tag, punctuation.definition.tag", "#FF0000", null, null, "Markup and HTML tag names"],
  ["Tag details", "entity.other.attribute-name", "#FF8000", null, null, "Attributes inside markup tags"],
  ["Added lines", "markup.inserted, markup.inserted.diff, diff.inserted", "#00FF00", "#153315", null, "Lines added to a file"],
  ["Removed lines", "markup.deleted, markup.deleted.diff, diff.deleted", "#FF0000", "#3A1515", null, "Lines removed from a file"],
  ["Changed lines", "markup.changed, markup.changed.diff, diff.changed", "#FFFF00", "#333315", null, "Lines changed in a file"],
  ["Change headings", "meta.diff, meta.diff.header", "#0000FF", null, "bold", "File-change section headings"],
  ["Headings", "markup.heading, entity.name.section", "#FFFF00", null, "bold", "Headings in formatted text"],
  ["Links", "markup.underline.link, string.other.link", "#00FFFF", null, null, "Links in formatted text"],
  ["Inline code", "markup.raw, markup.raw.inline", "#00FF00", null, null, "Code shown inside formatted text"],
  ["Quotes and lists", "markup.quote, punctuation.definition.list", "#8000FF", null, null, "Quotes and list markers"],
  ["Errors", "invalid, invalid.illegal", "#FF0000", null, null, "Invalid or broken code"],
];

const RULE_SAMPLES = [
  "// note", '"hello"', "\\n", "\\(name)", "42", "if", "func", "save()", "#if", "Theme", "path", "message", ".count", "=", "{ }", "<panel>", "state=", "+ added", "− removed", "~ changed", "@@ file", "Heading", "theme picker", "/theme", "› quote", "error",
];

const TERMINAL_PALETTES = {
  "spectrum-dark": {
    foreground: "#F5F5F0",
    background: "#181818",
    ansi: ["#FF8000", "#FF0000", "#00FF00", "#FFFF00", "#0000FF", "#FF00FF", "#00FFFF", "#8000FF", "#FF8000", "#FF0000", "#00FF00", "#FFFF00", "#0000FF", "#FF00FF", "#00FFFF", "#8000FF"],
  },
  "spectrum-light": {
    foreground: "#181818",
    background: "#F5F5F0",
    ansi: ["#007FFF", "#00FFFF", "#FF00FF", "#0000FF", "#FFFF00", "#00FF00", "#FF0000", "#7FFF00", "#007FFF", "#00FFFF", "#FF00FF", "#0000FF", "#FFFF00", "#00FF00", "#FF0000", "#7FFF00"],
  },
  "standard-dark": {
    foreground: "#D0D0D0",
    background: "#000000",
    ansi: ["#000000", "#800000", "#008000", "#808000", "#000080", "#800080", "#008080", "#C0C0C0", "#808080", "#FF0000", "#00FF00", "#FFFF00", "#0000FF", "#FF00FF", "#00FFFF", "#FFFFFF"],
  },
  "standard-light": {
    foreground: "#1F2328",
    background: "#FFFFFF",
    ansi: ["#000000", "#800000", "#008000", "#808000", "#000080", "#800080", "#008080", "#C0C0C0", "#808080", "#FF0000", "#00FF00", "#FFFF00", "#0000FF", "#FF00FF", "#00FFFF", "#FFFFFF"],
  },
};

const TERMINAL_ROLE_LABELS = {
  foreground: "Terminal text",
  background: "Terminal background",
  "ansi-0": "Extra dark colour",
  "ansi-1": "Deleted markers",
  "ansi-2": "Success and workspace",
  "ansi-3": "Usage and context",
  "ansi-4": "Mode and links",
  "ansi-5": "Activity and state",
  "ansi-6": "Paths",
  "ansi-7": "Branch text",
  "ansi-8": "Extra dark colour",
  "ansi-9": "Extra bright red",
  "ansi-10": "Tasks",
  "ansi-11": "Model",
  "ansi-12": "Extra bright blue",
  "ansi-13": "Goal",
  "ansi-14": "Extra bright cyan",
  "ansi-15": "Extra bright white",
};

const TERMINAL_TARGETS = ["foreground", "background", ...Array.from({ length: 16 }, (_, index) => `ansi-${index}`)];

const IMPACT_COPY = {
  works: "Codex uses this when no specific code colour matches.",
};

function activePalette() {
  return TERMINAL_PALETTES[state.terminalPalette];
}

function codexSurface(background) {
  const channels = [1, 3, 5].map((index) => Number.parseInt(background.slice(index, index + 2), 16));
  const light = channels[0] * 299 + channels[1] * 587 + channels[2] * 114 > 150000;
  const top = light ? 0 : 255;
  const alpha = light ? 0.04 : 0.12;
  return `#${channels.map((channel) => Math.round(top * alpha + channel * (1 - alpha)).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function quickColors() {
  return [...new Set(activePalette().ansi)];
}

const state = {
  theme: null,
  selectedRule: 0,
  source: "custom",
  activePreview: "preview",
  catalog: [],
  terminalPalette: "spectrum-light",
  selectedGlobal: "",
  selectionKind: "",
  pickingScope: false,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const queryToken = typeof location === "undefined" ? "" : new URLSearchParams(location.search).get("token") || "";
if (queryToken) {
  sessionStorage.setItem("theme-studio-token", queryToken);
  history.replaceState(null, "", location.pathname);
}
const requestHeaders = { "Content-Type": "application/json", "X-Theme-Studio-Token": queryToken || (typeof sessionStorage === "undefined" ? "" : sessionStorage.getItem("theme-studio-token") || "") };

function escapeHTML(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character]);
}

function parsePlist(xml) {
  const documentNode = new DOMParser().parseFromString(xml, "application/xml");
  const error = documentNode.querySelector("parsererror");
  if (error) throw new Error("The file is not valid XML.");
  const root = documentNode.querySelector("plist")?.firstElementChild;
  if (!root) throw new Error("The file is not a property list.");
  return parsePlistNode(root);
}

function parsePlistNode(node) {
  switch (node.tagName) {
    case "dict": {
      const result = {};
      const children = [...node.children];
      for (let index = 0; index < children.length; index += 2) {
        if (children[index].tagName === "key" && children[index + 1]) {
          result[children[index].textContent] = parsePlistNode(children[index + 1]);
        }
      }
      return result;
    }
    case "array": return [...node.children].map(parsePlistNode);
    case "true": return true;
    case "false": return false;
    case "integer": return Number.parseInt(node.textContent, 10);
    case "real": return Number.parseFloat(node.textContent);
    default: return node.textContent;
  }
}

function plistValue(value, depth = 1) {
  const indent = "\t".repeat(depth);
  if (Array.isArray(value)) {
    return `<array>\n${value.map((item) => `${indent}\t${plistValue(item, depth + 1)}`).join("\n")}\n${indent}</array>`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value).filter(([, item]) => item !== undefined && item !== null);
    return `<dict>\n${entries.map(([key, item]) => `${indent}\t<key>${escapeHTML(key)}</key>\n${indent}\t${plistValue(item, depth + 1)}`).join("\n")}\n${indent}</dict>`;
  }
  if (typeof value === "boolean") return value ? "<true/>" : "<false/>";
  if (typeof value === "number") return Number.isInteger(value) ? `<integer>${value}</integer>` : `<real>${value}</real>`;
  return `<string>${escapeHTML(value ?? "")}</string>`;
}

function serializeThemeObject(theme) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n\t${plistValue(theme)}\n</plist>\n`;
}

function serializeTheme() { return serializeThemeObject(state.theme); }

function starterTheme(light = false) {
  const inverse = (hex) => {
    const number = Number.parseInt(hex.slice(1), 16);
    return `#${(0xFFFFFF ^ number).toString(16).padStart(6, "0").toUpperCase()}`;
  };
  const rules = DEFAULT_RULES.map(([name, scope, foreground, background, fontStyle]) => ({
    name,
    scope,
    settings: {
      foreground: light && foreground !== "#F5F5F0" ? inverse(foreground) : foreground,
      ...(background ? { background: light ? inverse(background) : background } : {}),
      ...(fontStyle ? { fontStyle } : {}),
    },
  }));
  return {
    name: light ? "Untitled Light" : "Untitled Dark",
    author: "",
    settings: [{ settings: {
      foreground: light ? "#181818" : "#F5F5F0",
      background: light ? "#F5F5F0" : "#181818",
    }}, ...rules],
  };
}

function normalizeTheme(theme) {
  if (!theme || typeof theme !== "object" || !Array.isArray(theme.settings)) throw new Error("Missing TextMate settings array.");
  if (!theme.settings.length || !theme.settings[0]?.settings) theme.settings.unshift({ settings: {} });
  theme.name = String(theme.name || "Untitled Theme");
  theme.author = String(theme.author || "");
  theme.settings = theme.settings.filter((item, index) => index === 0 || (item && typeof item === "object"));
  for (const rule of theme.settings.slice(1)) {
    rule.name = String(rule.name || "Unnamed scope");
    rule.scope = String(rule.scope || "");
    rule.settings = rule.settings && typeof rule.settings === "object" ? rule.settings : {};
  }
  return theme;
}

function globals() { return state.theme.settings[0].settings; }
function rules() { return state.theme.settings.slice(1); }

function setStatus(message, type = "") {
  const status = $("#status");
  if (!status) return;
  status.textContent = message;
  status.className = type;
}

function markCustom() {
  state.source = "custom";
}

function ansiIndexColor(index, palette = activePalette()) {
  if (index < 16) return palette.ansi[index];
  if (index < 232) {
    const value = index - 16;
    const levels = [0, 95, 135, 175, 215, 255];
    const red = levels[Math.floor(value / 36)];
    const green = levels[Math.floor((value % 36) / 6)];
    const blue = levels[value % 6];
    return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
  }
  const level = 8 + (index - 232) * 10;
  return `#${level.toString(16).padStart(2, "0").repeat(3).toUpperCase()}`;
}

function resolveCodexColor(value, terminalDefault, palette = activePalette()) {
  const match = String(value || "").match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!match) return value || terminalDefault;
  const [, red, green, blue, alpha] = match;
  if (alpha.toUpperCase() === "00") return ansiIndexColor(Number.parseInt(red, 16), palette);
  if (alpha.toUpperCase() === "01") return terminalDefault;
  return `#${red}${green}${blue}`.toUpperCase();
}

function colorForPicker(value, terminalDefault = activePalette().foreground) {
  const resolved = resolveCodexColor(value, terminalDefault);
  const match = String(resolved || "").match(/^#([0-9a-f]{6})/i);
  return match ? `#${match[1]}` : "#ffffff";
}

function validColor(value) {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value);
}

function bindColorText(input, read, write) {
  const commit = () => {
    if (!validColor(input.value)) return false;
    write(input.value.toUpperCase());
    return true;
  };
  input.oninput = commit;
  input.onchange = commit;
  input.onkeydown = (event) => {
    if (event.key === "Enter") { event.preventDefault(); input.blur(); }
  };
  input.onblur = () => {
    if (!commit()) { input.value = read() || ""; setStatus("Use #RGB, #RRGGBB, or #RRGGBBAA", "error"); }
  };
}

function globalExampleKind(key) {
  if (/options|fontStyle/i.test(key)) return "decoration";
  if (/caret/i.test(key)) return "caret";
  if (/invisibles/i.test(key)) return "invisibles";
  if (/foreground|text$/i.test(key)) return "foreground";
  if (/background/i.test(key) || ["lineHighlight", "selection", "inactiveSelection", "findHighlight", "gutter", "popupCss", "phantomCss"].includes(key)) return "background";
  if (/border|highlight$|misspelling|guide|shadow/i.test(key)) return "border";
  return "foreground";
}

function globalExampleHTML(key, value, kind) {
  const palette = activePalette();
  const color = kind === "color"
    ? colorForPicker(value, globalExampleKind(key) === "background" ? palette.background : palette.foreground)
    : palette.ansi[6];
  const glyph = globalExampleKind(key) === "invisibles" ? "··" : "Aa";
  return `<div class="mini-example global-example ${globalExampleKind(key)}" style="--example-color:${color}" aria-label="${escapeHTML(key)} disabled and enabled comparison">
    <span class="example-chip"><small>OFF</small><b>${glyph}</b></span>
    <span class="example-chip example-on"><small>ON</small><b>${glyph}</b></span>
  </div>`;
}

function ruleAllowsBackground(rule) {
  return /(?:^|[.,\s])(markup\.(?:inserted|deleted|changed)|diff\.)/i.test(String(rule.scope || ""));
}

function presetRuleIndex(themeRules, name, scope) {
  const exactScope = themeRules.findIndex((rule) => rule.scope === scope);
  return exactScope >= 0 ? exactScope : themeRules.findIndex((rule) => rule.name === name);
}

function globalDefinition(key) {
  for (const [group, definitions] of GLOBAL_GROUPS) {
    const definition = definitions.find(([candidate]) => candidate === key);
    if (definition) return { group, key, label: definition[1], kind: definition[2], impact: definition[3] };
  }
  return null;
}

function defaultGlobalValue(kind) {
  return kind === "color" ? "#FFFFFF" : kind === "option" ? "underline" : "";
}

function renderRules() {
  const filter = $("#rule-search").value.trim().toLowerCase();
  const themeRules = rules();
  $("#rule-count").textContent = `${themeRules.length} RULES`;
  $("#rule-list").innerHTML = themeRules.map((rule, index) => ({ rule, index }))
    .filter(({ rule }) => !filter || `${rule.name} ${rule.scope}`.toLowerCase().includes(filter))
    .map(({ rule, index }) => {
      const swatch = rule.settings.foreground || rule.settings.background || globals().foreground || "#FFFFFF";
      const bold = String(rule.settings.fontStyle || "").split(/\s+/).includes("bold");
      const background = ruleAllowsBackground(rule) ? `<label>LINE FILL<input type="color" data-exact-background="${index}" value="${colorForPicker(rule.settings.background || activePalette().background)}"></label>` : "";
      return `<details class="exact-rule ${index === state.selectedRule ? "active" : ""}" data-rule-index="${index}">
        <summary><span class="swatch" style="background:${escapeHTML(colorForPicker(swatch))}"></span><span class="rule-copy"><strong>${escapeHTML(rule.name)}</strong><small>Open to edit technical selector</small></span><span>EDIT DETAILS</span></summary>
        <div class="exact-rule-controls">
          <label>NAME<input data-exact-name="${index}" value="${escapeHTML(rule.name)}"></label>
          <label>WHAT IT TARGETS<input data-exact-scope="${index}" value="${escapeHTML(rule.scope)}" spellcheck="false"></label>
          <label>COLOUR<input type="color" data-exact-colour="${index}" value="${colorForPicker(rule.settings.foreground || globals().foreground)}"></label>
          <label>HEX<input data-exact-hex="${index}" value="${escapeHTML(rule.settings.foreground || globals().foreground)}" spellcheck="false"></label>
          <button data-exact-bold="${index}" class="${bold ? "active" : ""}">BOLD ${bold ? "ON" : "OFF"}</button>${background}
          <button data-exact-duplicate="${index}">DUPLICATE</button><button data-exact-delete="${index}">DELETE</button>
        </div>
      </details>`;
    }).join("");
  $$('[data-exact-name]').forEach((input) => input.oninput = () => { rules()[Number(input.dataset.exactName)].name = input.value; markCustom(); });
  $$('[data-exact-scope]').forEach((input) => input.oninput = () => { rules()[Number(input.dataset.exactScope)].scope = input.value; markCustom(); renderPreview(); });
  $$('[data-exact-colour]').forEach((input) => input.oninput = () => { const rule = rules()[Number(input.dataset.exactColour)]; rule.settings.foreground = input.value.toUpperCase(); markCustom(); renderPreview(); });
  $$('[data-exact-hex]').forEach((input) => bindColorText(input, () => rules()[Number(input.dataset.exactHex)].settings.foreground, (value) => { rules()[Number(input.dataset.exactHex)].settings.foreground = value; markCustom(); renderPreview(); }));
  $$('[data-exact-background]').forEach((input) => input.oninput = () => { rules()[Number(input.dataset.exactBackground)].settings.background = input.value.toUpperCase(); markCustom(); renderPreview(); });
  $$('[data-exact-bold]').forEach((button) => button.onclick = () => { const index = Number(button.dataset.exactBold); const rule = rules()[index]; const active = new Set(String(rule.settings.fontStyle || "").split(/\s+/).filter(Boolean)); active.has("bold") ? active.delete("bold") : active.add("bold"); rule.settings.fontStyle = [...active].join(" "); state.selectedRule = index; markCustom(); renderRules(); renderPreview(); });
  $$('[data-exact-duplicate]').forEach((button) => button.onclick = () => { state.selectedRule = Number(button.dataset.exactDuplicate); duplicateRule(); });
  $$('[data-exact-delete]').forEach((button) => button.onclick = () => { state.selectedRule = Number(button.dataset.exactDelete); deleteRule(); });
}

function duplicateRule() {
  const copy = structuredClone(rules()[state.selectedRule]);
  copy.name = `${copy.name} copy`;
  state.theme.settings.splice(state.selectedRule + 2, 0, copy);
  state.selectedRule += 1;
  markCustom(); selectRule(state.selectedRule);
}

function deleteRule() {
  if (!rules()[state.selectedRule]) return;
  state.theme.settings.splice(state.selectedRule + 1, 1);
  state.selectedRule = Math.min(state.selectedRule, Math.max(0, rules().length - 1));
  markCustom();
  if (rules().length) selectRule(state.selectedRule);
  else { state.selectionKind = ""; renderRules(); renderPreview(); }
}

function selectorScore(selector, target) {
  const positive = selector.split(/\s+-\s+/)[0].trim().split(/\s+/).pop();
  if (!positive) return -1;
  if (target === positive) return 10_000 + positive.length;
  if (target.startsWith(`${positive}.`)) return 5_000 + positive.length;
  if (positive.startsWith(`${target}.`)) return target.length;
  return -1;
}

function ruleScore(rule, target) {
  return Math.max(-1, ...String(rule.scope || "").split(",").map((selector) => selectorScore(selector.trim(), target)));
}

function friendlyRule(rule) {
  const targets = String(rule.scope || "").split(",").map((target) => target.trim()).filter(Boolean);
  return DEFAULT_RULES.find(([, scope]) => targets.some((target) => ruleScore({ scope }, target) >= 0));
}

function matchingRuleIndex(target) {
  let bestIndex = -1;
  let score = -1;
  rules().forEach((rule, index) => {
    const candidate = ruleScore(rule, target);
    if (candidate >= score && candidate >= 0) { bestIndex = index; score = candidate; }
  });
  return bestIndex;
}

function styleFor(target) {
  return rules()[matchingRuleIndex(target)]?.settings || {};
}

function matchingRuleForTargets(targets) {
  for (const target of targets) {
    const index = matchingRuleIndex(target);
    if (index >= 0) return { index, target };
  }
  return { index: -1, target: targets[0] || "" };
}

function applyPreviewStyle(element, style, fallbackForeground, allowBackground = false) {
  const palette = activePalette();
  element.style.color = resolveCodexColor(style.foreground, fallbackForeground, palette) || "inherit";
  element.style.backgroundColor = allowBackground && style.background
    ? resolveCodexColor(style.background, palette.background, palette)
    : "transparent";
  const fontStyle = String(style.fontStyle || "");
  element.style.fontWeight = fontStyle.includes("bold") ? "800" : "inherit";
  element.style.fontStyle = "normal";
  element.style.textDecoration = "none";
}

function terminalRoleColor(role, palette = activePalette()) {
  if (role === "foreground" || role === "background") return palette[role];
  return palette.ansi[Number.parseInt(role.split("-")[1], 10)];
}

function renderThemeMap() {
  const map = $("#theme-map");
  if (!map) return;
  const globalItems = GLOBAL_GROUPS.map(([group, definitions]) => {
    const rows = definitions.map(([key, label, kind]) => {
      const value = globals()[key] ?? defaultGlobalValue(kind);
      const color = colorForPicker(value, activePalette().foreground);
      return `<div class="theme-map-item ${state.selectionKind === "global" && state.selectedGlobal === key ? "selected" : ""}" data-global-target="${key}">
        <strong>${escapeHTML(label)}</strong><small>Code without a more specific colour</small><span class="map-live-sample" style="color:${color}">plain text</span><label class="map-colour-control" title="Change ${escapeHTML(label)}"><input type="color" data-map-global-color="${key}" value="${color}"><input type="text" data-map-global-hex="${key}" value="${color}" maxlength="7" aria-label="${escapeHTML(label)} hex colour"></label>
      </div>`;
    }).join("");
    return rows ? `
    <section class="theme-map-group">
      <h3>${escapeHTML(group)}</h3>
      <div class="theme-map-grid">${rows}</div>
    </section>` : "";
  }).join("");
  const ruleItems = DEFAULT_RULES.map(([name, scope, foreground, background, fontStyle, help], presetIndex) => {
    const ruleIndex = presetRuleIndex(rules(), name, scope);
    const rule = ruleIndex >= 0 ? rules()[ruleIndex] : { name, scope, settings: { foreground, ...(background ? { background } : {}), ...(fontStyle ? { fontStyle } : {}) } };
    return { name, scope, help, presetIndex, ruleIndex, rule };
  }).map(({ name, help, presetIndex, ruleIndex, rule }) => {
    const color = colorForPicker(resolveCodexColor(rule.settings.foreground, globals().foreground || activePalette().foreground, activePalette()));
    const background = ruleAllowsBackground(rule) && rule.settings.background ? colorForPicker(resolveCodexColor(rule.settings.background, activePalette().background, activePalette())) : "transparent";
    const weight = String(rule.settings.fontStyle || "").includes("bold") ? "800" : "500";
    const bold = weight === "800";
    const fillControl = ruleAllowsBackground(rule) ? `<label class="map-fill-control" title="Change ${escapeHTML(name)} line fill">FILL<input type="color" data-map-rule-background="${presetIndex}" value="${colorForPicker(rule.settings.background || activePalette().background)}"></label>` : "";
    return `<div class="theme-map-item rule-map-item ${state.selectionKind === "rule" && ruleIndex >= 0 && state.selectedRule === ruleIndex ? "selected" : ""}" data-preset-target="${presetIndex}">
      <strong>${escapeHTML(name)}</strong><small>${escapeHTML(help)}</small><span class="map-live-sample" style="color:${color};background:${background};font-weight:${weight}">${escapeHTML(RULE_SAMPLES[presetIndex])}</span><span class="map-style-controls"><label class="map-colour-control" title="Change ${escapeHTML(name)}"><input type="color" data-map-rule-color="${presetIndex}" value="${color}"><input type="text" data-map-rule-hex="${presetIndex}" value="${color}" maxlength="7" aria-label="${escapeHTML(name)} hex colour"></label><button type="button" data-map-rule-bold="${presetIndex}" class="map-bold ${bold ? "active" : ""}" aria-pressed="${bold}">BOLD</button>${fillControl}</span>
    </div>`;
  }).join("");
  map.innerHTML = `${globalItems}
    ${ruleItems ? `<section class="theme-map-group"><h3>Code colours</h3><div class="theme-map-grid">${ruleItems}</div></section>` : ""}`;

  $$('[data-map-global-color]').forEach((input) => input.oninput = () => {
    globals()[input.dataset.mapGlobalColor] = input.value.toUpperCase();
    input.nextElementSibling.value = globals()[input.dataset.mapGlobalColor];
    input.closest(".theme-map-item").querySelector(".map-live-sample").style.color = globals()[input.dataset.mapGlobalColor];
    markCustom(); renderRules(); renderPreview();
  });
  $$('[data-global-target]').forEach((row) => row.onclick = (event) => {
    if (event.target.matches("input,button,label")) return;
    openGlobalColour(row.dataset.globalTarget, row);
  });
  $$('[data-map-global-hex]').forEach((input) => bindColorText(input,
    () => globals()[input.dataset.mapGlobalHex],
    (value) => { globals()[input.dataset.mapGlobalHex] = value; markCustom(); renderRules(); renderPreview(); },
  ));
  $$('[data-map-rule-color]').forEach((input) => input.oninput = () => {
    const presetIndex = Number(input.dataset.mapRuleColor);
    const [name, scope] = DEFAULT_RULES[presetIndex];
    let ruleIndex = presetRuleIndex(rules(), name, scope);
    if (ruleIndex < 0) {
      state.theme.settings.push({ name, scope, settings: {} });
      ruleIndex = rules().length - 1;
    }
    rules()[ruleIndex].settings.foreground = input.value.toUpperCase();
    input.nextElementSibling.value = rules()[ruleIndex].settings.foreground;
    input.closest(".theme-map-item").querySelector(".map-live-sample").style.color = rules()[ruleIndex].settings.foreground;
    markCustom(); renderRules(); renderPreview();
  });
  $$('[data-preset-target]').forEach((row) => row.onclick = (event) => {
    if (event.target.matches("input,button,label")) return;
    openPresetColour(Number(row.dataset.presetTarget), row);
  });
  $$('[data-map-rule-hex]').forEach((input) => bindColorText(input,
    () => {
      const [name, scope, foreground] = DEFAULT_RULES[Number(input.dataset.mapRuleHex)];
      const index = presetRuleIndex(rules(), name, scope);
      return index >= 0 ? rules()[index].settings.foreground : foreground;
    },
    (value) => {
      const [name, scope] = DEFAULT_RULES[Number(input.dataset.mapRuleHex)];
      let index = presetRuleIndex(rules(), name, scope);
      if (index < 0) { state.theme.settings.push({ name, scope, settings: {} }); index = rules().length - 1; }
      rules()[index].settings.foreground = value; markCustom(); renderRules(); renderPreview();
    },
  ));
  $$('[data-map-rule-bold]').forEach((button) => button.onclick = (event) => {
    event.stopPropagation();
    const presetIndex = Number(button.dataset.mapRuleBold);
    const [name, scope, foreground] = DEFAULT_RULES[presetIndex];
    let index = presetRuleIndex(rules(), name, scope);
    if (index < 0) { state.theme.settings.push({ name, scope, settings: { foreground } }); index = rules().length - 1; }
    const styles = new Set(String(rules()[index].settings.fontStyle || "").split(/\s+/).filter(Boolean));
    styles.has("bold") ? styles.delete("bold") : styles.add("bold");
    if (styles.size) rules()[index].settings.fontStyle = [...styles].join(" "); else delete rules()[index].settings.fontStyle;
    markCustom(); renderRules(); renderPreview();
  });
  $$('[data-map-rule-background]').forEach((input) => input.oninput = (event) => {
    event.stopPropagation();
    const presetIndex = Number(input.dataset.mapRuleBackground);
    const [name, scope, foreground] = DEFAULT_RULES[presetIndex];
    let index = presetRuleIndex(rules(), name, scope);
    if (index < 0) { state.theme.settings.push({ name, scope, settings: { foreground } }); index = rules().length - 1; }
    rules()[index].settings.background = input.value.toUpperCase();
    markCustom(); renderRules(); renderPreview();
  });
}

function selectRule(index) {
  if (!rules()[index]) return;
  state.selectionKind = "rule";
  state.selectedRule = index;
  state.selectedGlobal = "";
  state.pickingScope = false;
  renderRules(); renderPreview();
  setStatus(`${friendlyRule(rules()[index])?.[0] || rules()[index].name || "Code colour"} selected`, "success");
}

function openRuleColour(index, anchor, displayName) {
  selectRule(index);
  showActiveColour(displayName || friendlyRule(rules()[index])?.[0] || rules()[index].name, rules()[index].settings.foreground || globals().foreground, (value) => {
    rules()[index].settings.foreground = value; markCustom(); renderRules(); renderPreview();
  }, anchor);
}

function positionColourPopover(editor, anchor) {
  const box = anchor?.getBoundingClientRect() || { left: innerWidth / 2, right: innerWidth / 2, top: innerHeight / 2, bottom: innerHeight / 2 };
  const width = Math.min(360, innerWidth - 24);
  const height = editor.getBoundingClientRect().height || 220;
  const left = box.right + width + 12 <= innerWidth ? box.right + 12 : Math.max(12, box.left - width - 12);
  editor.style.left = `${left}px`;
  editor.style.top = `${box.bottom + height + 12 <= innerHeight ? box.bottom + 12 : Math.max(12, box.top - height - 12)}px`;
}

function showActiveColour(name, value, write, anchor) {
  const editor = $("#active-colour");
  const picker = $("#active-colour-picker");
  const hex = $("#active-colour-hex");
  editor.hidden = false;
  positionColourPopover(editor, anchor);
  $("#active-colour-name").textContent = name;
  picker.value = colorForPicker(value);
  hex.value = picker.value.toUpperCase();
  const commit = (next) => {
    if (!validColor(next)) return false;
    const colour = next.toUpperCase(); picker.value = colorForPicker(colour); hex.value = colour; write(colour);
    setStatus(`${name} changed to ${colour}`, "success");
    return true;
  };
  state.randomizeSelected = () => commit(quickColors()[Math.floor(Math.random() * quickColors().length)]);
  $("#randomize-selected").disabled = false;
  editor.querySelector(".spectrum").innerHTML = quickColors().map((colour) => `<button type="button" style="--quick-colour:${colour}" data-quick-colour="${colour}" aria-label="Use ${colour}"></button>`).join("");
  editor.querySelectorAll("[data-quick-colour]").forEach((button) => button.onclick = () => commit(button.dataset.quickColour));
  picker.oninput = () => commit(picker.value);
  hex.oninput = () => commit(hex.value);
  hex.onblur = () => { if (!commit(hex.value)) hex.value = picker.value.toUpperCase(); };
}

function selectPreset(presetIndex) {
  const [name, scope, foreground, background, fontStyle] = DEFAULT_RULES[presetIndex] || [];
  if (!name) return;
  let index = presetRuleIndex(rules(), name, scope);
  if (index < 0) {
    state.theme.settings.push({ name, scope, settings: { foreground, ...(background ? { background } : {}), ...(fontStyle ? { fontStyle } : {}) } });
    index = rules().length - 1;
    markCustom();
  }
  selectRule(index);
}

function openPresetColour(presetIndex, anchor) {
  selectPreset(presetIndex);
  openRuleColour(state.selectedRule, anchor);
}

function selectGlobal(key) {
  if (!globalDefinition(key)) return;
  state.selectionKind = "global";
  state.selectedGlobal = key;
  state.pickingScope = false;
  renderPreview();
  setStatus(`${globalDefinition(key).label} selected`, "success");
}

function openGlobalColour(key, anchor) {
  selectGlobal(key);
  showActiveColour(globalDefinition(key).label, globals()[key] || activePalette().foreground, (value) => {
    globals()[key] = value; markCustom(); renderRules(); renderPreview();
  }, anchor);
}

function selectTerminal(role) {
  if (!TERMINAL_TARGETS.includes(role)) return;
  state.selectionKind = "";
  renderPreview();
  setStatus(`${TERMINAL_ROLE_LABELS[role]} comes from the terminal and is not saved in a Codex theme.`);
}

function renderPreview() {
  const settings = globals();
  const palette = activePalette();
  const foreground = resolveCodexColor(settings.foreground, palette.foreground, palette);
  const background = palette.background;
  document.documentElement.style.setProperty("--preview-fg", foreground);
  document.documentElement.style.setProperty("--preview-bg", background);
  document.documentElement.style.setProperty("--terminal-fg", palette.foreground);
  document.documentElement.style.setProperty("--preview-selection", resolveCodexColor(settings.selection, palette.ansi[6], palette));
  document.documentElement.style.setProperty("--ansi-green", palette.ansi[2]);
  document.documentElement.style.setProperty("--ansi-red", palette.ansi[1]);
  document.documentElement.style.setProperty("--ansi-magenta", palette.ansi[5]);
  document.documentElement.style.setProperty("--ansi-blue", palette.ansi[4]);
  document.documentElement.style.setProperty("--terminal-panel", codexSurface(palette.background));
  document.documentElement.style.setProperty("--terminal-panel-fg", palette.foreground);
  renderThemeMap();
  const selected = state.selectionKind === "rule" ? rules()[state.selectedRule] : null;
  $$('[data-line-scope]').forEach((element) => {
    applyPreviewStyle(element, styleFor(element.dataset.lineScope), foreground, true);
    element.classList.toggle("scope-hit", ruleScore(selected || {}, element.dataset.lineScope) >= 0);
  });
  $$('[data-scope]').forEach((element) => {
    applyPreviewStyle(element, styleFor(element.dataset.scope), foreground);
    element.classList.toggle("scope-hit", ruleScore(selected || {}, element.dataset.scope) >= 0);
  });
  $$('[data-scope-list]').forEach((element) => {
    const targets = element.dataset.scopeList.split("|");
    const match = matchingRuleForTargets(targets);
    applyPreviewStyle(element, match.index >= 0 ? rules()[match.index].settings : {}, foreground);
    element.classList.toggle("scope-hit", targets.some((target) => ruleScore(selected || {}, target) >= 0));
  });
  $$('[data-terminal-role]').forEach((element) => {
    const role = element.dataset.terminalRole;
    const color = terminalRoleColor(role, palette);
    if (role === "background" || element.hasAttribute("data-terminal-fill")) element.style.backgroundColor = color;
    else element.style.color = color;
  });
  $("#preview").classList.toggle("picking-scope", state.pickingScope);
  $("#scope-hint").textContent = state.pickingScope
    ? "Pick a highlighted code token"
    : state.selectionKind === "derived"
      ? "Automatic Codex surface · based on terminal background"
    : state.selectionKind === "global"
        ? `${globalDefinition(state.selectedGlobal)?.label} selected`
        : state.selectionKind === "rule"
          ? `${rules()[state.selectedRule]?.name || "Code colour"} selected`
          : "Click the exact word or line you want to recolour";
}

function renderTheme() {
  $("#theme-name").value = state.theme.name;
  const catalog = $("#theme-catalog");
  if (state.source === "custom") {
    if (!catalog.querySelector('[value="custom"]')) catalog.prepend(new Option("New theme", "custom"));
    catalog.value = "custom";
  }
  state.selectedRule = Math.min(state.selectedRule, Math.max(0, rules().length - 1));
  state.pickingScope = false;
  state.selectionKind = "";
  state.selectedGlobal = "";
  renderRules(); renderPreview();
}

async function refreshCatalog(preferredFile = "") {
  const response = await fetch("/api/themes", { headers: requestHeaders });
  const payload = await response.json();
  state.catalog = payload.themes;
  const select = $("#theme-catalog");
  select.innerHTML = ["installed", "builtin"].map((source) => {
    const options = state.catalog.filter((item) => item.source === source).map((item) => `<option value="${source}|${encodeURIComponent(item.file)}">${escapeHTML(item.name)}</option>`).join("");
    return `<optgroup label="${source === "installed" ? "Installed themes" : "Codex built-ins (32)"}">${options}</optgroup>`;
  }).join("");
  const draft = sessionStorage.getItem(ThemeConvert.CODEX_DRAFT);
  if (draft) {
    sessionStorage.removeItem(ThemeConvert.CODEX_DRAFT);
    state.theme = normalizeTheme(JSON.parse(draft));
    state.source = "custom";
    state.selectedRule = 0;
    renderTheme();
    setStatus("Converted from Claude Code. Review it, then choose Save to Codex themes.", "success");
    return;
  }
  const preferred = state.catalog.find((item) => item.file === preferredFile && item.source === "installed")
    || state.catalog.find((item) => item.source === "builtin" && item.file === "Dracula.tmTheme")
    || state.catalog[0];
  if (preferred) {
    select.value = `${preferred.source}|${encodeURIComponent(preferred.file)}`;
    await loadCatalogTheme(preferred.source, preferred.file);
  }
}

async function loadCatalogTheme(source, file) {
  try {
    const response = await fetch(`/api/theme?source=${encodeURIComponent(source)}&file=${encodeURIComponent(file)}`, { headers: requestHeaders });
    if (!response.ok) throw new Error("Theme could not be loaded.");
    state.theme = normalizeTheme(parsePlist(await response.text()));
    state.source = source;
    state.selectedRule = 0;
    renderTheme();
    setStatus(`${state.theme.name} loaded`);
  } catch (error) { setStatus(error.message, "error"); }
}

function newTheme(light) {
  state.theme = starterTheme(light); state.source = "custom"; state.selectedRule = 0; renderTheme(); setStatus("New theme");
}

function hslToHex(hue, saturation, lightness) {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const segment = ((hue % 360) + 360) % 360 / 60;
  const x = chroma * (1 - Math.abs(segment % 2 - 1));
  const [red, green, blue] = segment < 1 ? [chroma, x, 0] : segment < 2 ? [x, chroma, 0] : segment < 3 ? [0, chroma, x] : segment < 4 ? [0, x, chroma] : segment < 5 ? [x, 0, chroma] : [chroma, 0, x];
  const match = l - chroma / 2;
  return `#${[red, green, blue].map((channel) => Math.round((channel + match) * 255).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function randomPalette(random = Math.random) {
  const currentBackground = colorForPicker(globals().background || activePalette().background, activePalette().background);
  const light = Number.parseInt(currentBackground.slice(1, 3), 16) + Number.parseInt(currentBackground.slice(3, 5), 16) + Number.parseInt(currentBackground.slice(5, 7), 16) > 382;
  const baseHue = Math.floor(random() * 360);
  const hues = [0, 42, 82, 142, 188, 224, 278, 326].map((offset) => (baseHue + offset) % 360);
  return { light, hues, palette: hues.map((hue) => hslToHex(hue, 92, light ? 42 : 62)) };
}

function randomizeTheme(random = Math.random) {
  const { light, hues, palette } = randomPalette(random);
  let index = 0;
  globals().foreground = light ? "#181818" : "#F5F5F0";
  globals().background = light ? "#F5F5F0" : "#181818";
  for (const [, definitions] of GLOBAL_GROUPS) {
    for (const [key, , kind] of definitions) {
      if (kind === "color" && Object.hasOwn(globals(), key) && key !== "foreground" && key !== "background") globals()[key] = palette[index++ % palette.length];
    }
  }
  rules().forEach((rule, ruleIndex) => {
    const hue = hues[ruleIndex % hues.length];
    rule.settings.foreground = palette[ruleIndex % palette.length];
    if (rule.settings.background !== undefined || ruleAllowsBackground(rule)) rule.settings.background = hslToHex(hue, 68, light ? 88 : 18);
  });
  markCustom();
  state.selectionKind = "";
  renderRules(); renderPreview();
  setStatus("New palette generated. Click anything to refine it.", "success");
}

function filenameForTheme() {
  const stem = state.theme.name.trim().replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^[-.]+|[-.]+$/g, "") || "custom-theme";
  return `${stem}.tmTheme`;
}

async function installTheme() {
  try {
    const response = await fetch("/api/install", {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify({ content: serializeTheme() }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Save failed");
    await refreshCatalog(filenameForTheme());
    setStatus("Saved to Codex themes · select it with /theme", "success");
  } catch (error) { setStatus(error.message, "error"); }
}

function openPreview(name) {
  state.activePreview = name;
  state.selectionKind = "";
  state.selectedGlobal = "";
  $("#active-colour").hidden = true;
  $$('.tab').forEach((button) => {
    const active = button.dataset.preview === name;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  $$('.preview-view').forEach((view) => view.classList.toggle("active", view.dataset.view === name));
}

function bindEvents() {
  $("#add-colour-category").innerHTML = DEFAULT_RULES.map(([name], index) => `<option value="${index}">${escapeHTML(name)}</option>`).join("");
  $("#new-theme").onclick = () => newTheme(!matchMedia("(prefers-color-scheme: dark)").matches);
  $("#randomize").onclick = () => randomizeTheme();
  $("#install").onclick = installTheme;
  $("#convert-claude").onclick = () => {
    sessionStorage.setItem(ThemeConvert.CLAUDE_DRAFT, JSON.stringify(ThemeConvert.codexToClaude(state.theme)));
    location.href = "claude.html";
  };
  $("#open-file").onclick = () => $("#file-input").click();
  $("#file-input").onchange = async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    try {
      state.theme = normalizeTheme(parsePlist(await file.text()));
      state.source = "custom"; state.selectedRule = 0; renderTheme(); setStatus(`${file.name} opened`);
    } catch (error) { setStatus(error.message, "error"); }
    event.target.value = "";
  };
  $("#theme-catalog").onchange = (event) => {
    if (event.target.value === "custom") return;
    const [source, encodedFile] = event.target.value.split("|");
    loadCatalogTheme(source, decodeURIComponent(encodedFile));
  };
  $("#theme-name").oninput = (event) => { state.theme.name = event.target.value; markCustom(); };
  $("#terminal-palette").value = state.terminalPalette;
  $("#terminal-palette").onchange = (event) => { state.terminalPalette = event.target.value; renderPreview(); setStatus("Terminal preview colours changed; they are not saved in the Codex theme."); };
  $("#rule-search").oninput = renderRules;
  $("#preview").onclick = (event) => {
    if (event.target.matches(".map-style-controls input, .map-style-controls button, .map-colour-control input")) return;
    const preset = event.target.closest("[data-preset-target]");
    if (preset) { openPresetColour(Number(preset.dataset.presetTarget), preset); return; }
    const exactRule = event.target.closest("[data-rule-target]");
    if (exactRule) { openRuleColour(Number(exactRule.dataset.ruleTarget), exactRule); return; }
    const globalTarget = event.target.closest("[data-global-target]");
    if (globalTarget) { openGlobalColour(globalTarget.dataset.globalTarget, globalTarget); return; }
    const terminalTarget = event.target.closest("[data-terminal-target]");
    if (terminalTarget) { selectTerminal(terminalTarget.dataset.terminalTarget); return; }
    const token = event.target.closest("[data-scope], [data-scope-list], [data-line-scope]");
    const terminal = event.target.closest("[data-terminal-role]");
    if (token) {
      const targets = token.dataset.scopeList?.split("|") || [token.dataset.scope || token.dataset.lineScope];
      const target = targets[0];
      if (state.pickingScope) {
        const rule = rules()[state.selectedRule];
        if (!rule) return;
        rule.scope = target;
        state.pickingScope = false;
        markCustom(); selectRule(state.selectedRule);
        setStatus(`Rule now targets ${target}`, "success");
        return;
      }
      const presetIndex = DEFAULT_RULES.findIndex(([, scope]) => targets.some((candidate) => ruleScore({ scope }, candidate) >= 0));
      const match = matchingRuleForTargets(targets);
      if (match.index < 0) {
        if (presetIndex >= 0) { openPresetColour(presetIndex, token); return; }
        setStatus("This item is fixed by Codex and cannot be changed by a theme.", "error"); return;
      }
      openRuleColour(match.index, token, presetIndex >= 0 ? DEFAULT_RULES[presetIndex][0] : undefined);
      return;
    }
    if (terminal) selectTerminal(terminal.dataset.terminalRole);
  };
  $("#active-colour-close").onclick = () => { $("#active-colour").hidden = true; };
  $("#randomize-selected").onclick = () => state.randomizeSelected?.();
  $("#add-rule").onclick = () => {
    const presetIndex = Number($("#add-colour-category").value);
    selectPreset(presetIndex);
    openPreview("map");
    document.querySelector(`[data-preset-target="${presetIndex}"]`)?.scrollIntoView({ block: "center" });
    setStatus(`${DEFAULT_RULES[presetIndex][0]} is ready to edit`, "success");
  };
  $$('[data-open-map]').forEach((button) => button.onclick = () => openPreview("map"));
  $$('.tab').forEach((tab) => tab.onclick = () => openPreview(tab.dataset.preview));
}

if (typeof document !== "undefined") {
  bindEvents();
  refreshCatalog().catch((error) => {
    state.theme = starterTheme(false); renderTheme(); setStatus(error.message, "error");
  });
}

if (typeof module !== "undefined") {
  module.exports = { DEFAULT_RULES, GLOBAL_GROUPS, TERMINAL_PALETTES, TERMINAL_TARGETS, ansiIndexColor, codexSurface, globalExampleKind, hslToHex, normalizeTheme, presetRuleIndex, randomizeTheme, resolveCodexColor, ruleAllowsBackground, ruleScore, selectorScore, serializeThemeObject, starterTheme, validColor };
}
