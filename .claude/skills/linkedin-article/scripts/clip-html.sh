#!/bin/bash
# Puts an HTML file on the macOS clipboard as rich text, ready for Cmd+V in LinkedIn's editor.
# Usage: clip-html.sh <file.html>
set -euo pipefail
[ -f "${1:-}" ] || { echo "usage: clip-html.sh <file.html>" >&2; exit 1; }

script=$(mktemp -t clip-html)
trap 'rm -f "$script"' EXIT
# The data goes into a script file, not an argument, so long articles don't hit the argument size limit.
{
  printf 'set the clipboard to {«class HTML»:«data HTML'
  hexdump -ve '1/1 "%.2x"' "$1"
  printf '», string:"(rich text for LinkedIn)"}\n'
} > "$script"
osascript "$script"
echo "clipboard: HTML from $1 ($(wc -c < "$1" | tr -d ' ') bytes)"
