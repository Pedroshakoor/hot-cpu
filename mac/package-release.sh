#!/bin/zsh
set -euo pipefail
cd "$(dirname "$0")/.."
[[ -d build/HotCPU.app ]] || ./mac/build-mac.sh
mkdir -p dist
codesign --verify --deep --strict build/HotCPU.app
ditto -c -k --sequesterRsrc --keepParent build/HotCPU.app dist/HotCPU-macOS.zip
(cd dist && shasum -a 256 HotCPU-macOS.zip > SHA256SUMS.txt)
printf 'Release files are in %s/dist\n' "$PWD"
