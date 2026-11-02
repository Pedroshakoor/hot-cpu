First public preview of Pressure Friends: a transparent, draggable macOS pixel companion that reacts to real CPU and RAM usage.

Includes complete tall, slender character sprites; corrected foreground masking without sliced hands; live menu-bar readings and source selection; five saved size presets; saved window position; offline assets; and an MIT-licensed source tree.

**Install:** Download PressureFriends-macOS.zip, unzip it, and move the app to Applications. macOS 14+ is required. The universal binary includes Apple Silicon and Intel code.

**Important:** This preview is ad-hoc signed, not Apple Developer ID signed or notarized. macOS may block downloaded builds. Build-from-source instructions are in the README. Do not disable Gatekeeper to run it. Intel code compiles successfully, but physical Intel runtime testing is still needed.

**Validation:** 10,000 rapid pressure updates, threshold entry and reverse recovery, actual sprite bounds, native CPU/RAM readings, source modes, all size presets, hide/show, saved settings, transparent WebKit alpha, universal architectures, and code-signature verification passed locally. Rendering tests ran on an Apple Silicon Mac.

**Privacy:** No accounts, analytics, keyboard monitoring, or network service. Measurements and preferences stay local. RAM percentage means usage, not Activity Monitor's memory-pressure score.

Future ideas such as clip export, captions, and character packs are not included in this release.
