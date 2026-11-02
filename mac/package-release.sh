#!/bin/zsh
set -euo pipefail
cd "$(dirname "$0")/.."
[[ -d build/PressureFriends.app ]] || ./mac/build-mac.sh
mkdir -p dist
codesign --verify --deep --strict build/PressureFriends.app
ditto -c -k --sequesterRsrc --keepParent build/PressureFriends.app dist/PressureFriends-macOS.zip
(cd dist && shasum -a 256 PressureFriends-macOS.zip > SHA256SUMS.txt)
printf 'Release files are in %s/dist\n' "$PWD"
