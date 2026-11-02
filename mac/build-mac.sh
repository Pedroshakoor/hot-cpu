#!/bin/zsh
# Package the native transparent overlay. Requires macOS 14+ and Xcode command line tools.
set -euo pipefail
cd "$(dirname "$0")/.."
# Remove only generated resources so an incremental build cannot ship stale scripts/assets.
python3 - <<'CLEAN'
from pathlib import Path
import shutil
resources = Path('build/HotCPU.app/Contents/Resources')
if resources.exists():
    shutil.rmtree(resources)
CLEAN
mkdir -p build/HotCPU.app/Contents/{MacOS,Resources}
BIN="build/HotCPU.app/Contents/MacOS/HotCPU"
for ARCH in arm64 x86_64; do
  swiftc -target "$ARCH-apple-macosx14.0" -module-cache-path build/module-cache -O -framework AppKit -framework WebKit mac/main.swift -o "build/HotCPU-$ARCH"
done
lipo -create build/HotCPU-arm64 build/HotCPU-x86_64 -output "$BIN"
cp LICENSE build/HotCPU.app/Contents/Resources/LICENSE
cp branding/HotCPU.icns build/HotCPU.app/Contents/Resources/HotCPU.icns
# Embed assets so WebKit canvas reads share one origin under file://.
python3 build_standalone.py
python3 - <<'PYHTML'
from pathlib import Path
html = Path('HotCPU-standalone.html').read_text().replace('<html lang="en">', '<html lang="en" class="native">')
Path('build/HotCPU.app/Contents/Resources/index.html').write_text(html)
PYHTML
cat > build/HotCPU.app/Contents/Info.plist <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList 1.0//EN">
<plist version="1.0"><dict>
 <key>CFBundleIdentifier</key><string>app.pressurefriends.pixel</string>
 <key>CFBundleName</key><string>HOT CPU</string>
 <key>CFBundleDisplayName</key><string>HOT CPU</string>
 <key>CFBundleExecutable</key><string>HotCPU</string>
 <key>CFBundleIconFile</key><string>HotCPU</string>
 <key>CFBundlePackageType</key><string>APPL</string>
 <key>CFBundleShortVersionString</key><string>0.4.0</string>
 <key>CFBundleVersion</key><string>4</string>
 <key>LSMinimumSystemVersion</key><string>14.0</string>
 <key>LSUIElement</key><true/>
 <key>NSHighResolutionCapable</key><true/>
</dict></plist>
PLIST
codesign --force --deep --sign - build/HotCPU.app
printf '\nBuilt %s\n' "$(pwd)/build/HotCPU.app"
