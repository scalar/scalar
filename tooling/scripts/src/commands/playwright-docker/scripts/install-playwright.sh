#!/bin/sh
set -eu

browser_path=${PLAYWRIGHT_BROWSERS_PATH:?}
playwright install --with-deps chromium

# amd64 uses chrome-headless-shell and arm64 uses headless_shell.
set -- $(find "$browser_path"/chromium_headless_shell-* -type f \
  \( -name chrome-headless-shell -o -name headless_shell \))
if [ "$#" -ne 1 ]; then
  echo "Expected one Chromium headless shell under $browser_path, found $#: $*" >&2
  exit 1
fi

# Wrap the executable in the install layer to avoid storing another copy.
mv "$1" "$1.real"
install -m 755 "$(dirname "$0")/chromium-headless-wrapper.sh" "$1"
