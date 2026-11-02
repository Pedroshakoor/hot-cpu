"""Run portable scene stress tests and the native WebKit smoke test on macOS."""
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parent

def run(*args):
    subprocess.run(args, cwd=root, check=True)

run('node', 'test_scene.cjs')
run('./mac/build-mac.sh')
run('swiftc', '-module-cache-path', 'build/module-cache', '-framework', 'AppKit',
    '-framework', 'WebKit', 'mac/test-webview.swift', '-o', 'build/test-webview')
run('./build/test-webview', str(root / 'build/PressureFriends.app/Contents/Resources'))

# Compile against the actual controller; expose private members only in this test copy.
source = (root / 'mac/main.swift').read_text().split('let app = NSApplication.shared')[0]
source = source.replace('private ', '') + (root / 'mac/test-controls.swift').read_text()
(root / 'build/test-controls-source.swift').write_text(source)
run('swiftc', '-module-cache-path', 'build/module-cache', '-framework', 'AppKit',
    '-framework', 'WebKit', 'build/test-controls-source.swift', '-o', 'build/test-controls')
run('./build/test-controls')
