# New style checklist

## Steps
1. `cp -r styles/_template styles/<new-id>`, then set `name` in style.json to `<new-id>` and fill in `display` and `summary`.
2. Write `style.md` first (palette, type, both layout grids, motion rules, scene list, cover spec). If the style comes from a reference video, extract frames from it and describe what you see.
3. Implement `engine.js`, `scenes.js` and `cover.js`. The contract the shared scripts rely on:
   - [ ] `index.html` loads `engine.js`, `scenes.js` and `motifs.js` (in that order) and has `<canvas id="c">`. `cover.html` also has `<canvas id="cov">` and loads `cover.js`.
   - [ ] `window.ready` is a Promise. It fetches `timeline.json`, sizes the canvas from `T.orientation` (both `landscape` and `portrait` must work), and waits for fonts.
   - [ ] `window.draw(t)` renders the frame at t seconds, as a pure function of t: no `Math.random()` and no `Date.now()`. Use a seeded rng.
   - [ ] It draws every cue in `T.cues` according to its `style` (`band`, `big`, `center`, `none`), supports the `/` line break and `[gold]` emphasis, and draws the `T.hook` line.
   - [ ] It exposes `ZD.scene`, `ZD.motif`, `ZD.FX`, `ZD.T` and `ZD.L`, so project `motifs.js` files can extend it.
   - [ ] An unknown scene falls back to a safe default, and an unknown motif throws a clear error.
   - [ ] `window.drawCover(kind)` returns a PNG data URL for `3x4` (1080×1440), `4x3` (1440×1080) and `9x16` (1080×1920), using only `T.cover` fields.
   - [ ] No hard-coded branding. `forbidden_text` (style.json and project.json) lists strings that must never appear; QA enforces it.
   - [ ] Fonts are listed in `style.json → fonts` (system font paths; subset at build time). No web fonts and no network.
4. List `scenes`, `motifs`, `accents` and `timing` in style.json. `accents` maps a scene to the SFX hit on its cut.
5. Smoke test: `python3 scripts/zv.py stills examples/scene-gallery -o both`, after setting `"style": "<new-id>"` in a copy of the gallery. Then do a short `build` and check that `qa` passes.
6. Add a row to `styles/README.md`, and add a line to SKILL.md's style table.
