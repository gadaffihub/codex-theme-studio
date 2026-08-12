#!/bin/zsh
set -eu
exec "${0:A:h}/plugins/codex-theme-studio/scripts/theme-studio.sh" --overlay "$@"
