# HOT CPU

<img src="branding/icon.png" width="96" alt="HOT CPU icon">

A tiny pixel sitcom powered by your Mac's workload. Characters arrive as CPU or RAM usage rises, wave hello, and rub their palms together with excitement. They celebrate when the load drops, then leave.

![HOT CPU animation](docs/hot-cpu-demo.gif)

Demo uses simulated metrics; the native app reads your Mac’s live CPU and RAM usage.

Native macOS app • transparent desktop companion • draggable • live menu-bar readings • no account or telemetry.

## Download

Download `HotCPU-macOS.zip` from this repository's **Releases** page, unzip it, and move `HotCPU.app` to Applications. Requires macOS 14 or later; the universal binary contains Apple Silicon and Intel builds.

Releases are locally ad-hoc signed, **not Apple Developer ID signed or notarized**. macOS may block the downloaded app. Building from source is available below; this project does not recommend disabling Gatekeeper or removing quarantine attributes.

## Use

- Click the **◉ percentage** in the macOS menu bar for settings.
- See real CPU and RAM usage, updated every second, including while the menu is open.
- Arrivals wave and rub their hands; occasional joyful repeats earn a playful wink from the woman. A drop from three or more characters to one or fewer triggers a short group cheer before departures.
- The adult woman moves through six pressure-driven stages: relaxed, hair-fix, wink and wave, sideways sit, stretch, and celebration. Pose thresholds are 20%, 40%, 60%, 80%, and 95%, with a small hysteresis margin to prevent jitter. A 24-frame atlas supplies the transitions; low-pressure recovery uses a gradual return sequence.
- At a displayed **75%**, a brief comic puff changes her into a fully covering blue swim top and sends the shirt onto the rightmost man’s head. It stays there through later poses. Below a displayed **65%**, he passes it back and another puff restores her shirt. The shirt-holder stays until the return is complete.
- Choose CPU only, RAM usage only, or the higher of the two.
- Choose five companion sizes, from 25% to 140%.
- Click, hold, and drag the companion window to any screen. Its position and size are remembered.
- Hide/show the companion or quit from its menu.

The percentage is CPU utilization or RAM usage according to your selected mode. RAM usage is **not** the same as Activity Monitor's memory-pressure graph. Character thresholds are 16%, 32%, 48%, 64%, and 80%; arrivals and departures are spaced 1.8 seconds apart, with a two-second celebration before a large load-drop departure. Movement uses sprite sway and footfall bounce, rather than a multi-frame skeletal walk cycle.

## Upgrading from Pressure Friends

HOT CPU is the renamed continuation of Pressure Friends. Quit the old app before opening HOT CPU. The bundle identifier stays unchanged so existing size and position preferences are preserved.

## Shirt handoff demo

[Watch the native 75% toss, persistent head-shirt, and return sequence](https://github.com/Pedroshakoor/hot-cpu/releases/download/v0.5.0/shirt-handoff-demo.mp4). The costume change uses a brief cartoon puff.

## Build from source

Install Xcode Command Line Tools (`xcode-select --install`) and Python 3, then run:

```sh
./mac/build-mac.sh
open build/HotCPU.app
```

The build needs no API keys, package installs, or network access. It compiles both CPU architectures, embeds the animation and assets, and ad-hoc signs the result. All eight runtime images ship inside the app; no browser extension or Chrome installation is needed. WebKit is the system rendering framework.

## Test and package

Node.js 20+ is needed only for the tests:

```sh
python3 test_preview.py
./mac/package-release.sh
```

Run the full suite in a logged-in macOS desktop session. It checks 10,000 rapid pressure changes, entry/exit and recovery, modes, invalid inputs, sizes, native controls, metrics, and transparent WebKit rendering. It also checks 30,000 costume-state jitter updates, exact 75% activation, consistent outfits, retained shirt ownership, and continuous handoff attachment points. The native test briefly opens a test window. CI builds and checks the universal bundle; visual, dragging, and rendering checks still require a desktop session. Intel runtime behavior has not yet been tested on physical Intel hardware.

The package script writes a ZIP and SHA-256 checksum to `dist/`. Current public builds are previews, not notarized App Store releases.

## Source map

- `mac/main.swift`: native window, dragging, menu, CPU and memory readings.
- `scene.js`: character choreography, pose drawing, smooth shirt trajectories, and 30 FPS scheduling.
- `shirt-gag.js`: the costume handoff state machine, thresholds, owner lease, and interruption handling.
- `assets/men-rub.png` and `assets/men-wave.png`: three-frame gesture atlases for every character.
- `assets/men-tall.png`: five complete full-body sprites in a shared sheet.
- `assets/girl-poses.png` and `assets/girl-swim-poses.png`: 24 matching frames per outfit; `assets/couch.png`: the stationary couch.
- `assets/shirt-props.png` and `assets/men-return.png`: shirt and return-reaction sprites.
- Legacy foreground layers, expressions, and original men remain as artwork references and are excluded from the runtime bundle.
- `build_standalone.py`: optional offline HTML preview (`python3 build_standalone.py`). Its pressure slider is simulated.

## Contributing and license

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [asset provenance](docs/ASSETS.md).

MIT licensed; see [LICENSE](LICENSE). This project has no runtime third-party package dependencies.
