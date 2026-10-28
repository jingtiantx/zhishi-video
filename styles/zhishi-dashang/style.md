# 知识大赏 · 黑金（zhishi-dashang）

A warm-black and gold explainer look ("知识大赏"), in landscape and portrait.
Everything on screen is drawn in code on one Canvas 2D page: `engine.js` (ground, text, global layers), `scenes.js` (scene + motif library), `cover.js` (covers).
No branding is hard-coded. Strings you never want on screen go in `forbidden_text` (style.json or project.json); timeline building aborts and QA fails if one shows up.

## Palette
| token | value | use |
|---|---|---|
| ground | `#060504` warm black + amber nebula (#3a2810 → #120c06) + star dust | every frame |
| INK | `#efe8d8` ivory | subtitles, body text |
| GOLD | `#dcb86c` | line art, `[keywords]`, rules |
| GOLD_HI | `#fff1c6` | highlights, inner strokes, sparkles |
| GOLD_DK | `#8a6a32` | shadows of the bevel, dim strokes |
No other hues. Light comes from glow, bloom and the warm sun (dawn), not from extra colours.

## Type
Noto Serif CJK SC, Bold for display and subtitles, Regular for English lines. Each build subsets it to the characters used, as `fonts/serif-sc-*.otf` and font-family `SerifSC`.
Mark-up inside any text:
- `/` forces a line break.
- `[词]` sets that span in gold. Use 1–2 gold spans per line, on the word that carries the turn.

## Layout grids (engine.js `LAYOUTS`)
| | landscape 1920×1080 | portrait 1080×1920 |
|---|---|---|
| safe area | 5 % title-safe (96 px / 54 px) | short-video app UI column x 72–900, y 170–1480 (right 15 % and bottom 20 % are covered by UI) |
| hook line (persistent top question) | y 84, size 46, max 1200 | y 296, size 54, max 790 |
| art centre `AX, AY` | 960, 470 | 490, 820 |
| subtitle band | y 950, size 58, max 1500 | y 1380, size 56, max 790 |
| big text (`style:"big"`) | right-hand block at (1340, 470), size 104 | under the art at (480, 1110), size 84 |
| center text (`big_text`, `dawn`) | size 130, max 1500 | size 100, max 800 |
| art scale `K` | 1 | 0.8 |

## Motion rules
- **Cuts:** every shot starts on a bar line of the BGM (beat lines in `snap:"beat"`), and lines inside a shot land on beats.
- **Shot change:** 0.35 s crossfade with a 1.05→1 scale-in, a diagonal light-leak sweep, `whoosh_in` peaking on the cut, and a flash on impacts and stamps.
- **Subtitles:** revealed one character at a time (eased), reading speed ≤ ~4 字/s (QA warns > 4.6). The gold spans get a slow sheen.
- **Art:** gold line-art drawn with banded-gradient strokes and a glow, plus a slow drift (Ken Burns). Paths can "draw on" through `o.p`.
- **Post:** bloom at quarter resolution, vignette, film grain (0.13), and a fade-out over min(2.2 s, 20 % of the duration).
- **Determinism:** each frame is a pure function of `t` (seeded rng only), so any frame can be re-rendered on its own.

## Scene types (`scenes.js`; params go straight on the scene object in project.json)
| scene | what it shows | params |
|---|---|---|
| `hook` | 你/motif in a pulsing halo with ripple rings; first line defaults to `big` | `motif`, `size` |
| `fragments` | memory/info cards drifting, the centre one sharpens | — |
| `pressure` | "push it away" words press on the figure, copies rebound | `words[]`, `pushes`, `copies` |
| `title` | wipe-in giant gold effect name + rule + English + tagline (hook line hidden) | `title`, `en`, `tagline`, `motif` |
| `thought` | person + thought bubble holding a motif; optional strike / timer | `motif`, `bubble_text`, `glyph`, `strike`, `timer` |
| `repeat` | the same thing pops up again and again (bell rings) | `times`, `bell`, `motif` |
| `brain_eye` | brain outline with a watching eye ("monitor process") | `reveal` |
| `scan` | scan reticle sweeps a brain/motif | `motif` |
| `focus` | lens/halo zooms onto a glowing motif | `motif` |
| `burst` | rays + labelled cards fanning out ("it explains a lot of life") | `labels[]`, `motif` |
| `big_text` | centred big lines stacked one per cue | — (lines default `center`) |
| `compare` | 你以为 → 其实 cards: left dims and gets struck through on cue 2 | `left{label,text}`, `right{label,text}` |
| `steps` | numbered practical takeaways, one per cue | `items[]` |
| `stat` | a single number counts up inside a ring | `value`, `unit`, `label` |
| `release` | motif dissolves into rising light | `motif` |
| `dawn` | horizon sunrise, closing lines centred, last line all-gold | `motif` (walks along the horizon) |
Every scene also accepts `lines` (cues), `accent` (`impact`/`chime`/`stamp`/`none`), `min` (s) and `hide_hook`.
Cue styles: `band` (default subtitle), `big`, `center`, `none` (spoken only, goes to the SRT, not drawn). `stamp:true` adds a stamp hit.

## Motifs (gold line-art, centred, ~360 px wide at size 1)
`silhouette` (你, default), `figure`, `brain`, `eye`, `bell`, `card`, `frag`, `astrolabe`, `mirror`, `clock`, `bulb`, `phone`, `glyph` (`glyph:"？"` or any 1–2 chars), `none`.
Topic-specific art (a white bear, a dog for Pavlov, and so on) goes in the project's `motifs.js` with `ZD.motif(name, fn, {h})`; see `examples/white-bear-demo/motifs.js`.
`ZD.scene(name, fn)` in the same file adds or overrides a scene for that project only.

## Cover spec (`cover.js`)
Top to bottom:
1. Pill badge: 4–8 字 counter-intuitive tag, gold outline.
2. **Giant gold effect name**: 12-step bevel extrusion, vertical gold gradient, a sheen, a sparkle. It shrinks to fit.
3. Spaced English name · year.
4. Question title: `q1` ivory line plus `q2` gold line (`[ ]` for emphasis). Or a single `q`.
5. The motif standing on a glowing horizon, cards fanned in an arc, rays, a floor reflection.
6. Small caption: the source, e.g. "Wegner 等 1987 · …".
7. Vignette and grain.

Sizes:
- `3x4` is 1080×1440 and `4x3` is 1440×1080. Both are always delivered.
- `9x16` is 1080×1920. It is delivered for portrait builds.

Fields come from `project.json → cover`: `badge, title, en, q1, q2 | q, caption, motif, glyph, motif_opts, motif_scale, cards`.
Only `cover` fields are drawn.
