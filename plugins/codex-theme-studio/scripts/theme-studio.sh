#!/bin/zsh
set -eu

plugin_root="${0:A:h:h}"
python_bin="${PYTHON:-$(command -v python3 2>/dev/null || true)}"
[[ -n "${python_bin}" ]] || { print -u2 "Theme Studio needs Python 3. Run: brew install python"; exit 127; }
mode=""
product="codex"
agent_launch=0

while (( $# )); do
  case "$1" in
    --window|--tab|--overlay) mode="${1#--}" ;;
    --codex) product="codex" ;;
    --claude) product="claude" ;;
    --agent) agent_launch=1 ;;
    --set-default)
      shift
      [[ "${1:-}" == (window|tab|overlay) ]] || { print -u2 "Use: --set-default window|tab|overlay"; exit 2; }
      exec "${python_bin}" "${plugin_root}/theme_studio_tui.py" --set-default-mode "$1"
      ;;
    --help|-h)
      print "Theme Studio"
      print "  theme-studio [--window|--tab|--overlay] [--codex|--claude]"
      print "  theme-studio --set-default window|tab|overlay"
      print ""
      print "window is the default. Window and tab return immediately without touching the live agent."
      print "overlay temporarily uses this terminal and restores it when Theme Studio exits."
      exit 0
      ;;
    *) print -u2 "Unknown option: $1"; exit 2 ;;
  esac
  shift
done

if [[ -z "${mode}" ]]; then
  mode="$("${python_bin}" "${plugin_root}/theme_studio_tui.py" --print-default-mode)"
fi
if (( agent_launch )) && [[ "${mode}" == "overlay" ]]; then
  print -u2 "Codex plugins cannot insert an external widget into Codex's private Ctrl+T overlay. Opening a separate window instead. Run this script directly with --overlay to use the same alternate-screen enter/restore lifecycle."
  mode="window"
fi
command=("${python_bin}" "${plugin_root}/theme_studio_tui.py" --product "${product}")
if [[ "${TERM:-}" == "" || "${TERM:-}" == "dumb" ]]; then
  command=(/usr/bin/env TERM=xterm-256color "${command[@]}")
fi
quoted_command="${(j: :)${(q)command}}"

if [[ "${mode}" == "overlay" ]]; then
  [[ -t 0 && -t 1 ]] || { print -u2 "Overlay requires an interactive terminal. Use --window or --tab."; exit 2; }
  exec "${command[@]}"
fi

if [[ "$(uname -s)" != "Darwin" ]]; then
  print -u2 "New windows and tabs currently require macOS Terminal. Use --overlay here."
  exit 2
fi

launcher="${TMPDIR:-/tmp}/theme-studio-launch-${$}.command"
{
  print '#!/bin/zsh'
  print 'launcher="$0"'
  print "trap 'rm -f -- \"\$launcher\"' EXIT"
  print "${quoted_command}"
  print 'exit'
} >"${launcher}"
chmod 700 "${launcher}"

if [[ "${mode}" == "window" ]]; then
  /usr/bin/open -a Terminal "${launcher}"
else
  # Ask Terminal for a new tab, verify a distinct TTY, then target only that new tab.
  if ! tab_result="$(/usr/bin/osascript - "${launcher}" <<'APPLESCRIPT'
on run argv
  set launcherPath to item 1 of argv
  tell application "Terminal"
    activate
    set targetWindow to front window
    set previousTTY to tty of selected tab of targetWindow
    set previousCount to count tabs of targetWindow
    tell application "System Events" to keystroke "t" using command down
    delay 0.2
    set newTab to selected tab of front window
    if front window is not targetWindow or (count tabs of targetWindow) is not previousCount + 1 or tty of newTab is previousTTY then error "Terminal did not create a distinct tab in the target window"
    do script quoted form of launcherPath in newTab
    return tty of newTab
  end tell
end run
APPLESCRIPT
)"; then
    /usr/bin/open -a Terminal "${launcher}"
    mode="window (tab permission unavailable)"
  else
    [[ -n "${tab_result}" ]] || { print -u2 "Theme Studio could not verify the new tab"; exit 1; }
  fi
fi

# The launcher only creates a detached TUI. It never waits for, signals, or owns the live agent.
print "Theme Studio opened in a new Terminal ${mode}."
