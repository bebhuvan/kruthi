#!/usr/bin/env bash
set -euo pipefail

echo "Removing Kruthi package (if installed)..."
if dpkg -l | awk '{print $2}' | grep -qx "kruthi"; then
  sudo apt remove -y kruthi || true
fi

echo "Cleaning AppImage and desktop shortcuts..."
find "$HOME" -type f -iname '*kruthi*.appimage' -delete 2>/dev/null || true
rm -f "$HOME/Desktop/kruthi.desktop" "$HOME/.local/share/applications/kruthi.desktop"

echo "Done."
