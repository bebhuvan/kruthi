#!/usr/bin/env bash
set -euo pipefail

REPO="${REPO:-bebhuvan/kruthi}"
ARCH="$(uname -m)"

case "$ARCH" in
  x86_64|amd64) PATTERN='_amd64\.deb$' ;;
  aarch64|arm64) PATTERN='_arm64\.deb$|_aarch64\.deb$' ;;
  *)
    echo "Unsupported architecture: $ARCH"
    exit 1
    ;;
esac

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required."
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required. Install with: sudo apt install -y jq"
  exit 1
fi

if ! command -v sudo >/dev/null 2>&1; then
  echo "sudo is required for package installation."
  exit 1
fi

api="https://api.github.com/repos/${REPO}/releases/latest"
asset_url="$(curl -fsSL "$api" | jq -r --arg re "$PATTERN" '.assets[].browser_download_url | select(test($re))' | head -n1)"

if [[ -z "$asset_url" ]]; then
  echo "Could not find a matching .deb asset in latest release for arch: $ARCH"
  exit 1
fi

tmp_deb="/tmp/kruthi_latest.deb"
echo "Downloading: $asset_url"
curl -fL -o "$tmp_deb" "$asset_url"

echo "Installing Kruthi..."
sudo apt install -y "$tmp_deb"
echo "Installed successfully."
