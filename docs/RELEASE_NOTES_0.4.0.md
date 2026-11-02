# HOT CPU v0.4.0

Your Mac gets hot. She gets playful.

HOT CPU is the renamed continuation of Pressure Friends. The adult character now moves through the six approved poses: relaxed, hair-fix, wink-and-wave, sideways sit, overhead stretch, and celebration.

- 24 transparent character frames with eased progression and a gradual recovery sequence.
- A separate stationary couch and consistent seated-body scale keep furniture still and raised-arm poses proportional.
- Pose thresholds at 20%, 40%, 60%, 80%, and 95%, with hysteresis to avoid flickering around boundaries.
- Preserved cast arrivals, friendly waves, palm rubbing, and group celebrations; joyful repeats prompt a playful wink.
- New HOT CPU icon, app name, ZIP filename, and public repository name.
- Existing size and position preferences remain compatible through the original bundle identifier.

**Upgrade:** Quit Pressure Friends before opening HOT CPU. Download HotCPU-macOS.zip, unzip it, and move HotCPU.app to Applications. macOS 14+ is required; the universal binary includes Apple Silicon and Intel builds.

**Validation:** 10,000 rapid pressure updates; six pose stages; sprite bounds; continuous progression, recovery, jitter and retargeting checks; native metrics and controls; transparent WebKit alpha; native animation capture across the full rise/fall sequence; universal binary and ad-hoc signature verification. GitHub CI checks the source build and package.

**Preview limitation:** No Apple Developer ID signing identity is configured on the build Mac. This release is ad-hoc signed, not Apple-notarized, and macOS may block downloaded builds. Build-from-source instructions are in the README. Physical Intel runtime testing is still outstanding. Do not disable Gatekeeper to run it.

Source code and cleared artwork are MIT licensed. No accounts, analytics, keyboard monitoring, remote image generation, or runtime API keys.
