#!/bin/bash
# Install LaTeX packages for resume templates
# Usage: sudo ./setup_latex.sh

set -e

command -v tlmgr &>/dev/null || {
    echo "Error: tlmgr not found. Install TeX Live first:"
    echo "  macOS:   brew install --cask mactex-no-gui"
    echo "  Ubuntu:  sudo apt install texlive texlive-latex-extra"
    echo "  Windows: https://tug.org/texlive/windows.html"
    exit 1
}

tlmgr install \
    mathptmx geometry enumitem titlesec nopageno hyperref rsfs \
    latexsym fullpage marvosym xcolor fancyhdr babel tabularx
