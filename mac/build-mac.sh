#!/bin/zsh
# Package the native transparent overlay. Requires macOS 14+ and Xcode command line tools.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p build/PressureFriends.app/Contents/{MacOS,Resources}
BIN="build/PressureFriends.app/Contents/MacOS/PressureFriends"
for ARCH in arm64 x86_64; do
  swiftc -target "$ARCH-apple-macosx14.0" -module-cache-path build/module-cache -O -framework AppKit -framework WebKit mac/main.swift -o "build/PressureFriends-$ARCH"
done
lipo -create build/PressureFriends-arm64 build/PressureFriends-x86_64 -output "$BIN"
cp LICENSE build/PressureFriends.app/Contents/Resources/LICENSE
# Embed assets so WebKit canvas reads share one origin under file://.
python3 build_standalone.py
python3 - <<'PYHTML'
from pathlib import Path
html = Path('PressureFriends-standalone.html').read_text().replace('<html lang="en">', '<html lang="en" class="native">')
Path('build/PressureFriends.app/Contents/Resources/index.html').write_text(html)
PYHTML
cat > build/PressureFriends.app/Contents/Info.plist <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList 1.0//EN">
<plist version="1.0"><dict>
 <key>CFBundleIdentifier</key><string>app.pressurefriends.pixel</string>
 <key>CFBundleName</key><string>Pressure Friends</string>
 <key>CFBundleDisplayName</key><string>Pressure Friends</string>
 <key>CFBundleExecutable</key><string>PressureFriends</string>
 <key>CFBundlePackageType</key><string>APPL</string>
 <key>CFBundleShortVersionString</key><string>0.2.0</string>
 <key>CFBundleVersion</key><string>2</string>
 <key>LSMinimumSystemVersion</key><string>14.0</string>
 <key>LSUIElement</key><true/>
 <key>NSHighResolutionCapable</key><true/>
</dict></plist>
PLIST
codesign --force --deep --sign - build/PressureFriends.app
printf '\nBuilt %s\n' "$(pwd)/build/PressureFriends.app"
