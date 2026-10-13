#!/bin/bash
# Puts an image file on the macOS clipboard, ready for Cmd+V over a selected placeholder.
# Usage: clip-image.sh <image>      (png, jpg, gif, webp; anything else that sips can read)
set -euo pipefail
[ -f "${1:-}" ] || { echo "usage: clip-image.sh <image>" >&2; exit 1; }

src=$(cd "$(dirname "$1")" && pwd)/$(basename "$1")
png="$src"
case "$(echo "${src##*.}" | tr '[:upper:]' '[:lower:]')" in
  png) ;;
  *)
    png=$(mktemp -t clip-image).png
    trap 'rm -f "$png"' EXIT
    sips -s format png "$src" --out "$png" >/dev/null
    ;;
esac
osascript -e "set the clipboard to (read (POSIX file \"$png\") as «class PNGf»)" 2>/dev/null
echo "clipboard: image $1"
