#!/usr/bin/env python3
"""Bundles Pressure Friends into one offline HTML preview (no external assets)."""
from pathlib import Path
import base64
import json

ROOT = Path(__file__).resolve().parent
html = (ROOT / 'index.html').read_text()
js = (ROOT / 'scene.js').read_text()
assert "image.src='assets/'+path" in js
js = js.replace("image.src='assets/'+path", "image.src=window.__IMG__[path]")
images = {p.relative_to(ROOT / 'assets').as_posix(): 'data:image/png;base64,' + base64.b64encode(p.read_bytes()).decode('ascii')
          for p in sorted((ROOT / 'assets').rglob('*.png')) if not p.name.startswith('man-')}
assert len(images) == 31
inline = '<script>window.__IMG__=' + json.dumps(images, separators=(',', ':')) + ';</script>'
inline += '\n<script>\n' + js + '\n</script>'
assert '<script src="scene.js"></script>' in html
html = html.replace('<script src="scene.js"></script>', inline)
out = ROOT / 'PressureFriends-standalone.html'
out.write_text(html)
print(f'Created {out} ({out.stat().st_size/1e6:.2f} MB)')
