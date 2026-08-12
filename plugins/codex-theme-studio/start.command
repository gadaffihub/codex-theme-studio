#!/bin/zsh
set -eu
exec "${0:A:h}/scripts/theme-studio.sh" --overlay "$@"
