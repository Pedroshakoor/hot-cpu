# Artwork provenance

The initial couch, girl, original five character sprites, and facial-expression frames were supplied by the project owner. The owner confirmed redistribution rights and approved the project's MIT release on 2026-11-02. The original `man-1.png` through `man-5.png` files remain as reference artwork and are excluded from the runtime bundle.

`assets/men-tall.png` was generated with OpenAI ImageGen on 2026-11-02 using those five user-supplied character references. It contains complete full-body figures, including hands and shoes, with transparent padding. Sprite source rectangles are defined in `scene.js`; no runtime image-generation service or API key is used.

The project distributes these contributions under its repository MIT license. AI-generated artwork may not carry exclusive copyright protection; the project makes no promise of exclusivity. Contributors must document the provenance and redistribution rights of replacement artwork.

`assets/men-rub.png` and `assets/men-wave.png` were generated with OpenAI ImageGen on 2026-11-02 using `men-tall.png` as the character reference. Each atlas has five columns (identities) and three rows (motion phases). Frame bounds and foot anchors are recorded in `scene.js` to keep bodies grounded while switching poses. Both are distributed under the repository MIT license.

For HOT CPU v0.4.0, `assets/girl-poses.png` and `assets/couch.png` were generated with OpenAI ImageGen on 2026-11-02 using the owner-approved six-pose adult-woman concept. The character atlas has four columns and six rows; the couch is a separate stationary asset. These assets are covered by the repository MIT license. Source rectangles are registered to the seated baseline and normalized to the character's body height so raised arms do not shrink the body. Legacy scene layers and facial atlases are reference material, not runtime assets in this version.

The HOT CPU app icon is an original code-drawn graphic; its source is `mac/make-icon.swift`, with generated PNG and ICNS assets in `branding/`.
