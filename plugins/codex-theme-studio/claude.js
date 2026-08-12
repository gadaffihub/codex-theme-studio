"use strict";

const GROUPS = [
  ["Text and accents", [
    ["claude", "Assistant label and spinner"], ["text", "Default foreground"], ["inverseText", "Text on colour fills"],
    ["inactive", "Hints and timestamps"], ["subtle", "Faint borders and text"], ["suggestion", "Suggestions and picker selection"],
    ["permission", "Permission dialog borders"], ["remember", "Memory and CLAUDE.md"],
  ]],
  ["Status", [
    ["success", "Passing and success"], ["error", "Failures and errors"], ["warning", "Warnings and auto mode"], ["merged", "Merged pull requests"],
  ]],
  ["Input and modes", [
    ["promptBorder", "Default prompt border"], ["planMode", "Plan mode accent"], ["autoAccept", "Accept-edits mode"],
    ["bashBorder", "Shell prompt border"], ["ide", "IDE connection"], ["fastMode", "Fast mode"],
  ]],
  ["Diffs", [
    ["diffAdded", "Added-line background"], ["diffRemoved", "Removed-line background"], ["diffAddedDimmed", "Added context"],
    ["diffRemovedDimmed", "Removed context"], ["diffAddedWord", "Added word highlight"], ["diffRemovedWord", "Removed word highlight"],
  ]],
  ["Fullscreen", [
    ["userMessageBackground", "User message background"], ["userMessageBackgroundHover", "Hovered user message"],
    ["bashMessageBackgroundColor", "Shell message background"], ["memoryBackgroundColor", "Memory message background"], ["selectionBg", "Mouse selection"],
  ]],
  ["Usage and labels", [
    ["rate_limit_fill", "Used meter portion"], ["rate_limit_empty", "Empty meter portion"],
    ["briefLabelYou", "You speaker label"], ["briefLabelClaude", "Claude speaker label"],
  ]],
  ["Shimmer", [
    ["claudeShimmer", "Claude spinner gradient"], ["warningShimmer", "Warning gradient"], ["permissionShimmer", "Permission gradient"],
    ["promptBorderShimmer", "Prompt gradient"], ["inactiveShimmer", "Inactive gradient"], ["fastModeShimmer", "Fast-mode gradient"],
  ]],
  ["Subagents", ["red", "blue", "green", "yellow", "purple", "orange", "pink", "cyan"].map((color) => [`${color}_FOR_SUBAGENTS_ONLY`, `${color} subagent`])],
  ["Ultrathink rainbow", ["red", "orange", "yellow", "green", "blue", "indigo", "violet"].flatMap((color) => [
    [`rainbow_${color}`, `${color} rainbow`], [`rainbow_${color}_shimmer`, `${color} shimmer`],
  ])],
];

const SPECTRUM = ["#FF0000", "#FF8000", "#FFFF00", "#00FF00", "#00FFFF", "#0000FF", "#8000FF", "#FF00FF"];
const CORE_DARK = {
  claude: "#FF8000", text: "#F5F5F0", inverseText: "#181818", inactive: "#00FFFF", subtle: "#8000FF",
  suggestion: "#00FFFF", permission: "#FF00FF", remember: "#00FFFF", success: "#00FF00", error: "#FF0000",
  warning: "#FFFF00", merged: "#FF00FF", promptBorder: "#00FFFF", planMode: "#0000FF", autoAccept: "#00FF00",
  bashBorder: "#FF8000", ide: "#8000FF", fastMode: "#FF00FF", diffAdded: "#005F00", diffRemoved: "#5F0000",
  diffAddedDimmed: "#003700", diffRemovedDimmed: "#370000", diffAddedWord: "#008700", diffRemovedWord: "#870000",
  userMessageBackground: "#28184A", userMessageBackgroundHover: "#3C246F", bashMessageBackgroundColor: "#402000",
  memoryBackgroundColor: "#003F3F", selectionBg: "#005F5F", rate_limit_fill: "#00FFFF", rate_limit_empty: "#353535",
  briefLabelYou: "#00FFFF", briefLabelClaude: "#FF8000",
};
const CORE_LIGHT = {
  claude: "#0000FF", text: "#353535", inverseText: "#F5F5F0", inactive: "#999999", subtle: "#B0B0B0",
  suggestion: "#A69CFF", permission: "#E98BA7", remember: "#3478F6", success: "#52B96C", error: "#C74444",
  warning: "#A67C00", merged: "#8656A3", promptBorder: "#A8A8A8", planMode: "#686868", autoAccept: "#52B96C",
  bashBorder: "#777777", ide: "#3478F6", fastMode: "#8656A3", diffAdded: "#D9F8DF", diffRemoved: "#F9DADA",
  diffAddedDimmed: "#EEF9F0", diffRemovedDimmed: "#FBEFEF", diffAddedWord: "#BCECC5", diffRemovedWord: "#F0BBBB",
  userMessageBackground: "#3D3D3D", userMessageBackgroundHover: "#555555", bashMessageBackgroundColor: "#F1F1ED",
  memoryBackgroundColor: "#EEF6F6", selectionBg: "#CBE8E8", rate_limit_fill: "#B9B4FF", rate_limit_empty: "#D8D8D3",
  briefLabelYou: "#E98BA7", briefLabelClaude: "#0000FF",
};
const BASE_OVERRIDES = {
  "dark-daltonized": { claude:"#FF7814", claudeShimmer:"#FFA546", success:"#66FF66", error:"#FF6666", warning:"#FFEA32", suggestion:"#7AB4E8", promptBorder:"#3399FF", planMode:"#7AB4E8", diffAdded:"#225C2B", diffRemoved:"#7A2936" },
  "light-daltonized": { claude:"#FF6A00", claudeShimmer:"#FF9632", success:"#2F9D44", error:"#D1454B", warning:"#CA8A04", suggestion:"#2563EB", promptBorder:"#2563EB", planMode:"#2563EB", diffAdded:"#C7E1CB", diffRemoved:"#FDD2D8" },
  "dark-ansi": { claude:"#FF00FF", text:"#FFFFFF", inactive:"#808080", subtle:"#C0C0C0", suggestion:"#00FFFF", permission:"#FF00FF", success:"#00FF00", error:"#FF0000", warning:"#FFFF00", promptBorder:"#00FFFF", planMode:"#0000FF" },
  "light-ansi": { claude:"#800080", text:"#000000", inactive:"#808080", subtle:"#C0C0C0", suggestion:"#0000FF", permission:"#800080", success:"#008000", error:"#800000", warning:"#808000", promptBorder:"#008080", planMode:"#000080" },
};
const DEFAULT_ENABLED = ["claude", "text", "inactive", "suggestion", "permission", "remember", "success", "error", "warning", "promptBorder", "planMode", "autoAccept", "diffAdded", "diffRemoved", "userMessageBackground", "selectionBg", "rate_limit_fill", "rate_limit_empty", "briefLabelYou", "briefLabelClaude"];
const $ = (selector) => document.querySelector(selector);
const queryToken = new URLSearchParams(location.search).get("token") || "";
if (queryToken) {
  sessionStorage.setItem("theme-studio-token", queryToken);
  history.replaceState(null, "", location.pathname);
}
const requestHeaders = { "Content-Type": "application/json", "X-Theme-Studio-Token": queryToken || sessionStorage.getItem("theme-studio-token") || "" };
const allTokens = GROUPS.flatMap(([, tokens]) => tokens.map(([token]) => token));
const BASES = ["dark", "light", "dark-daltonized", "light-daltonized", "dark-ansi", "light-ansi"];
const state = { name: "Untitled Claude Dark", base: "dark", enabled: new Set(DEFAULT_ENABLED), values: {}, selectedToken: "", activeView: "preview" };

function inverse(hex) {
  return `#${[1, 3, 5].map((index) => (255 - parseInt(hex.slice(index, index + 2), 16)).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function tokenDefault(token, base = "dark") {
  if (typeof base === "boolean") base = base ? "light" : "dark";
  const light = base.startsWith("light");
  const baseValue = BASE_OVERRIDES[base]?.[token];
  let value = baseValue || (light ? CORE_LIGHT : CORE_DARK)[token];
  if (!value) value = SPECTRUM[Math.abs([...token].reduce((sum, character) => sum + character.charCodeAt(0), 0)) % SPECTRUM.length];
  return light && !baseValue && !CORE_LIGHT[token] ? inverse(value) : value;
}

function styleTokenRow(row, value) {
  row.style.setProperty("--token-color", value);
}

function tokenLabel(token) {
  const label = token
    .replace(/_FOR_SUBAGENTS_ONLY$/, " subagent")
    .replace(/^rainbow_/, "rainbow ")
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase();
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function tokenSample(token) {
  const background = /(?:Background|^diff|selectionBg|MessageBackground|AddedWord|RemovedWord)/i.test(token);
  const border = /(?:Border|permission|subtle)/i.test(token);
  const gradient = /(?:Shimmer|^rainbow_)/i.test(token);
  const meter = /^rate_limit_/.test(token);
  const kind = meter ? "meter" : gradient ? "gradient" : border ? "border" : background ? "fill" : "text";
  return `<span class="token-sample ${kind}" aria-label="Live ${kind} example"><b>${kind === "text" ? "Aa" : ""}</b></span>`;
}

function loadStarter(base) {
  if (typeof base === "boolean") base = base ? "light" : "dark";
  const light = base.startsWith("light");
  state.name = light ? "Untitled Claude Light" : "Untitled Claude Dark";
  state.base = base;
  state.enabled = new Set(DEFAULT_ENABLED);
  state.selectedToken = "";
  state.values = Object.fromEntries(allTokens.map((token) => [token, tokenDefault(token, base)]));
  renderAll();
}

function loadPayload(theme, message = "Theme opened") {
  if (!theme || typeof theme !== "object" || Array.isArray(theme)) throw new Error("The file is not a Claude Code theme object.");
  const overrides = theme.overrides && typeof theme.overrides === "object" ? theme.overrides : {};
  state.name = String(theme.name || "Untitled Claude Theme");
  state.base = BASES.includes(theme.base) ? theme.base : "dark";
  state.values = Object.fromEntries(allTokens.map((token) => [token, tokenDefault(token, state.base)]));
  state.enabled = new Set(Object.keys(overrides).filter((token) => allTokens.includes(token)));
  state.selectedToken = "";
  for (const token of state.enabled) state.values[token] = ThemeConvert.color(overrides[token], state.values[token]);
  renderAll();
  status(message, "success");
}

function payload() {
  return {
    name: state.name,
    base: state.base,
    overrides: Object.fromEntries([...state.enabled].map((token) => [token, state.values[token]])),
  };
}

function tokenControl(token, description) {
  const row = document.createElement("div");
  row.className = `token-row${state.enabled.has(token) ? " enabled" : ""}${state.selectedToken === token ? " selected" : ""}`;
  row.dataset.tokenRow = token;
  row.innerHTML = `<input type="checkbox" aria-label="Enable ${tokenLabel(token)}"><strong class="token-name">${tokenLabel(token)}</strong><small class="token-description">${description}</small>${tokenSample(token)}<span class="token-colour-control"><input type="color" aria-label="${tokenLabel(token)} colour"><input type="text" maxlength="7" aria-label="${tokenLabel(token)} hex" spellcheck="false"></span>`;
  const checkbox = row.querySelector('[type="checkbox"]');
  const picker = row.querySelector('[type="color"]');
  const text = row.querySelector('[type="text"]');
  checkbox.checked = state.enabled.has(token);
  picker.value = state.values[token];
  text.value = state.values[token];
  styleTokenRow(row, state.values[token]);
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) state.enabled.add(token); else state.enabled.delete(token);
    row.classList.toggle("enabled", checkbox.checked);
    renderPreview();
  });
  row.addEventListener("click", (event) => {
    if (event.target.matches("input,label,button")) return;
    state.selectedToken = token;
    renderGroups(); renderPreview();
    status(`${tokenLabel(token)} selected`, "success");
  });
  picker.addEventListener("input", () => updateToken(token, picker.value, picker, text));
  text.addEventListener("input", () => { if (/^#[0-9a-f]{6}$/i.test(text.value)) updateToken(token, text.value, picker, text); });
  text.addEventListener("blur", () => { if (!/^#[0-9a-f]{6}$/i.test(text.value)) text.value = state.values[token]; });
  return row;
}

function updateToken(token, value, picker, text) {
  state.values[token] = value.toUpperCase();
  picker.value = state.values[token];
  text.value = state.values[token];
  styleTokenRow(picker.closest(".token-row"), state.values[token]);
  renderPreview();
}

function positionColourPopover(editor, anchor) {
  const box = anchor.getBoundingClientRect();
  const width = Math.min(360, innerWidth - 24);
  const height = editor.getBoundingClientRect().height || 220;
  editor.style.left = `${box.right + width + 12 <= innerWidth ? box.right + 12 : Math.max(12, box.left - width - 12)}px`;
  editor.style.top = `${box.bottom + height + 12 <= innerHeight ? box.bottom + 12 : Math.max(12, box.top - height - 12)}px`;
}

function randomColour() {
  return SPECTRUM[Math.floor(Math.random() * SPECTRUM.length)];
}

function renderGroups() {
  $("#claude-token-groups").replaceChildren(...GROUPS.map(([name, tokens]) => {
    const group = document.createElement("section");
    group.className = "token-group";
    const heading = document.createElement("h2");
    heading.textContent = name;
    const grid = document.createElement("div");
    grid.className = "token-grid";
    grid.append(...tokens.map(([token, description]) => tokenControl(token, description)));
    group.append(heading, grid);
    return group;
  }));
}

function color(token) {
  return state.enabled.has(token) ? state.values[token] : tokenDefault(token, state.base);
}

function renderPreview() {
  const preview = $("#claude-preview");
  const light = state.base.startsWith("light");
  const variables = { "claude-bg": light ? "#F5F5F0" : "#181818", "claude-text": color("text"), ...Object.fromEntries(allTokens.map((token) => [`token-${token}`, color(token)])) };
  Object.entries(variables).forEach(([name, value]) => preview.style.setProperty(`--${name}`, value));
  preview.querySelectorAll("[data-token]").forEach((element) => {
    element.style.setProperty("--token-color", color(element.dataset.token));
    element.classList.toggle("token-hit", element.dataset.token === state.selectedToken);
  });
  $("#override-count").textContent = `${state.enabled.size} colours`;
}

function renderAll() {
  $("#claude-name").value = state.name;
  $("#claude-base").value = state.base;
  renderGroups();
  renderPreview();
}

function status(message, kind = "") {
  $("#status").textContent = message;
  $("#status").className = kind;
}

async function send(path) {
  status(path.endsWith("install") ? "Saving theme to /theme…" : "Building theme…");
  const response = await fetch(path, { method: "POST", headers: requestHeaders, body: JSON.stringify(payload()) });
  if (!response.ok) throw new Error((await response.json()).error || "Could not save Claude theme");
  return response;
}

async function install() {
  try {
    const response = await send("/api/claude/install");
    const result = await response.json();
    status("Saved to Claude themes · select it with /theme", "success");
  } catch (error) { status(error.message, "error"); }
}

$("#claude-name").addEventListener("input", (event) => { state.name = event.target.value; });
$("#claude-base").addEventListener("change", (event) => { loadStarter(event.target.value); status(`${event.target.selectedOptions[0].textContent} starting colours loaded`, "success"); });
$("#claude-preview").addEventListener("click", (event) => {
  const previewToken = event.target.closest("[data-token]");
  if (!previewToken) return;
  state.selectedToken = previewToken.dataset.token;
  state.enabled.add(state.selectedToken);
  document.querySelectorAll("[data-token-row]").forEach((row) => row.classList.toggle("selected", row.dataset.tokenRow === state.selectedToken));
  renderPreview();
  const picker = $("#claude-active-picker");
  const hex = $("#claude-active-hex");
  $("#claude-active-colour").hidden = false;
  positionColourPopover($("#claude-active-colour"), previewToken);
  $("#claude-active-name").textContent = tokenLabel(state.selectedToken);
  picker.value = state.values[state.selectedToken];
  hex.value = state.values[state.selectedToken];
  const commit = (value) => {
    if (!/^#[0-9a-f]{6}$/i.test(value)) return false;
    state.values[state.selectedToken] = value.toUpperCase(); picker.value = state.values[state.selectedToken]; hex.value = state.values[state.selectedToken];
    renderGroups(); renderPreview(); status(`${tokenLabel(state.selectedToken)} changed to ${state.values[state.selectedToken]}`, "success"); return true;
  };
  $("#claude-active-colour .spectrum").innerHTML = SPECTRUM.map((colour) => `<button type="button" style="--quick-colour:${colour}" data-quick-colour="${colour}" aria-label="Use ${colour}"></button>`).join("");
  document.querySelectorAll("#claude-active-colour [data-quick-colour]").forEach((button) => button.onclick = () => commit(button.dataset.quickColour));
  $("#claude-randomize-selected").disabled = false;
  $("#claude-randomize-selected").onclick = () => {
    const token = state.selectedToken;
    state.values[token] = randomColour();
    renderGroups(); renderPreview();
    picker.value = state.values[token]; hex.value = state.values[token];
    status(`${tokenLabel(token)} randomized`, "success");
  };
  picker.oninput = () => commit(picker.value);
  hex.oninput = () => commit(hex.value);
  hex.onblur = () => { if (!commit(hex.value)) hex.value = state.values[state.selectedToken]; };
});
document.querySelectorAll("[data-claude-view]").forEach((button) => button.addEventListener("click", () => {
  state.activeView = button.dataset.claudeView;
  state.selectedToken = "";
  $("#claude-active-colour").hidden = true;
  document.querySelectorAll("[data-claude-view]").forEach((tab) => {
    const active = tab === button;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll("[data-claude-page]").forEach((page) => page.classList.toggle("active", page.dataset.claudePage === state.activeView));
  renderPreview();
}));
$("#claude-active-close").addEventListener("click", () => { $("#claude-active-colour").hidden = true; });
$("#claude-new-theme").addEventListener("click", () => loadStarter(matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
$("#claude-randomize").addEventListener("click", () => {
  const offset = Math.floor(Math.random() * SPECTRUM.length);
  state.values = Object.fromEntries(allTokens.map((token, index) => [token, SPECTRUM[(index + offset) % SPECTRUM.length]]));
  state.enabled = new Set(allTokens);
  renderAll();
  status("All 61 colours enabled and randomized", "success");
});
$("#claude-open").addEventListener("click", () => $("#claude-file-input").click());
$("#claude-file-input").addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) return;
  try { loadPayload(JSON.parse(await file.text()), `${file.name} opened`); }
  catch (error) { status(error.message, "error"); }
  event.target.value = "";
});
$("#claude-install").addEventListener("click", install);
$("#convert-codex").addEventListener("click", () => {
  sessionStorage.setItem(ThemeConvert.CODEX_DRAFT, JSON.stringify(ThemeConvert.claudeToCodex(payload())));
  location.href = "index.html";
});

const draft = sessionStorage.getItem(ThemeConvert.CLAUDE_DRAFT);
if (draft) {
  sessionStorage.removeItem(ThemeConvert.CLAUDE_DRAFT);
  try { loadPayload(JSON.parse(draft), "Converted from Codex. Review it, then choose Save to Claude themes."); }
  catch (error) { loadStarter(false); status(error.message, "error"); }
} else loadStarter(true);
