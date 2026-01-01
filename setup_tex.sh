#!/bin/bash
# Install Tectonic (LaTeX engine used by this project)
set -e

command -v tectonic &>/dev/null && { echo "✓ Tectonic installed"; exit 0; }

case "$(uname -s)" in
    Darwin)  brew install tectonic ;;
    Linux)   curl --proto '=https' --tlsv1.2 -fsSL https://drop-sh.fullyjustified.net | sh && sudo mv tectonic /usr/local/bin/ ;;
    *)       echo "Download from: https://github.com/tectonic-typesetting/tectonic/releases"; exit 1 ;;
esac

echo "✓ Tectonic installed"
