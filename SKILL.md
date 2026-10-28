---
name: zhishi-video
description: 知识大赏视频生成器 — use when the user wants a 知识大赏-style explainer video made entirely in code from a topic, e.g. 「做个知识大赏视频」「做一期XX效应」「用知识大赏/黑金样式做视频」「用某样式做视频」「横屏/竖屏知识视频+封面」. They give 主题、故事角度、时长、背景音乐、横竖屏; you deliver mp4 + srt + covers.
---

# 知识大赏视频（zhishi-video）

The pipeline goes script → beat-snapped timeline → Canvas frames → audio mix → mp4 + SRT + covers → QA. It all runs locally through `scripts/zv.py`.
The look lives in a **style** folder (`styles/<id>/`). The repo ships `zhishi-dashang` (黑金, warm black and gold). A new look is a new folder and needs no pipeline changes.

`SKILL` means this folder. Run every command from `SKILL`. Check the setup first with `sh scripts/check_env.sh` (README → Requirements).

## 1. Inputs (ask only for what's missing)
| input | default if not given |
|---|---|
| 主题 topic | **Required.** Prefer a widely known concept (an effect, a law, a bias) that the viewer can 看完能用上 |
| 故事角度 story angle | **Required.** If none is given, propose 2–3 angles (§3) and recommend one |
| 视频时长 duration | A 60 s **target**, not a cap. Length follows the script; the timeline stretches pacing up to ×1.6, or warns when the script runs more than 15 % over |
| 背景音乐 BGM | Use the user's file, e.g. `<project>/audio/bgm.mp3`. If none is given, ask once. If they don't mind, use `"bgm": null` for an SFX-only track on a virtual 112 BPM grid. Only use music the user has rights to |
| 横屏/竖屏 orientation | `landscape` 1920×1080 by default; `portrait` 1080×1920; `both` builds two edits |
| 样式 style | `zhishi-dashang` |

## 2. Content rules
- **Facts come only from the brief or sources.** Map every factual line to a row in `SOURCES.md` (author, year, title, DOI/link). Mark paraphrased quotes 「大意」. Mark anything unchecked 「待核实」 and raise it at hand-off; never fill the gap yourself. On-screen numbers must come from SOURCES.
- **Shape:** "看完能用上". Start from a well-known concept, then make a counter-intuitive turn: what you thought → what's actually true → what to do with it. The main character is **你**: open on a moment in the viewer's life, not on a definition.
- **Project-level guards** (all optional, in `project.json`):
  - `forbidden_text`: strings that must never appear on screen, in covers or in the SRT (a brand or account name, a competitor…). Timeline building aborts on them, and QA scans every artefact.
  - `front_blocklist`: words to keep out of the title, hook, cover and first line. QA warns when they appear.
  Ask the user whether they have such rules and record them there. Don't hard-code them in a style.
- **Covers:** always 3:4 and 4:3, plus 9:16 for portrait builds. Layout: a big gold effect name, a question subtitle, the motif on a glowing horizon (`styles/zhishi-dashang/style.md → Cover spec`).

## 3. Steps
1. **Scaffold:**
   ```
   python3 scripts/zv.py new <proj> --topic 白熊效应 --angle "…" --duration 60 --bgm audio/bgm.mp3 --orientation landscape
   ```
   This writes `project.json`, `SOURCES.md` and `script.txt`, all with TODOs.
2. **Facts:** fill in `SOURCES.md` from what the user provided, and list any 待核实 items.
3. **Script (网感):** write the 逐字稿 into `script.txt`, one subtitle line per row.
   - Keep lines short and spoken, 8–16 字, one beat per line, one `[gold]` keyword per line.
   - Optional de-AI pass: set `ZV_LINTER` to an AI-tell linter such as `scripts/ai_tell_linter.py` from [taishang-laojun](https://github.com/liuhaisi2026212-maker/taishang-laojun), then run `python3 scripts/zv.py lint <proj>`. Allow-list lines go in `<proj>/lint_allow.txt`.
   - That linter flags the literal shells 「你以为X，其实Y」 and 「不是X而是Y」. Carry the twist through a `compare` shot instead (cards labelled 你以为 / 其实) and phrase the spoken lines differently.
4. **Storyboard:** turn the script into `project.json → scenes[]`. Each scene is one shot: `{"scene": <type>, ...params, "lines": [...]}`. A line is a string or `{text, style: band|big|center|none, hold, stamp}`.
   - Pick scene types from `styles/<id>/style.md`. A typical 60 s arc: `hook` (你 + big line) → `title` → evidence (`thought`/`repeat`/`stat`) → mechanism (`brain_eye`/`scan`/`focus`) → turn (`compare`/`big_text`) → use it (`steps`) → close (`dawn`).
   - Set `hook` (the persistent top question), `title` and `cover{badge,title,en,q1,q2,caption,motif}`.
   - Topic-specific art goes in `<proj>/motifs.js` via `ZD.motif(...)`. See `examples/white-bear-demo/motifs.js`.
   - Run `python3 scripts/zv.py timeline <proj> -o <orient>`. It prints per-line timing in 字/s, writes `build_<o>/STORYBOARD.md`, and warns on over-length. Keep the rate at or below ~4 字/s.
5. **Preview:** `python3 scripts/zv.py stills <proj> -o <orient>` writes one frame per shot to `build_<o>/stills_sheet.jpg`. Look at it and fix the layout before the full render.
6. **Build:**
   ```
   python3 scripts/zv.py build <proj> -o <orient|both> --workers N --out <deliver_dir>
   ```
   The stages:
   1. analyze_bgm: librosa beat grid and bar lines
   2. make_timeline: cuts on bars, lines on beats, SFX on cuts and turns
   3. make_fonts: font subsets
   4. render.mjs: Playwright, 30 fps frames
   5. mix.py: BGM plus synthesized SFX, ducking, −14 LUFS, −1.5 dBTP
   6. mux.sh: H.264 yuv420p + AAC 48 kHz
   7. make_srt
   8. covers.mjs
   9. qa.py

   Rendering runs at roughly 0.7 frames/s per worker, so 60 s (1800 frames) takes about 7 min with 6 workers. Run it in the background.
7. **QA** runs automatically; `zv.py qa <proj>` re-runs it.
   - Hard failures: wrong resolution, fps or pix_fmt; duration differs from the timeline; no audio stream; `forbidden_text` found; wrong cover sizes.
   - Warnings: loudness outside −14 ±1 LUFS, true peak above −1 dBTP, silent audio, `front_blocklist` hits, reading speed above 4.6 字/s, near-black frames, duration far from the target.
   - Then **look** at `qa_<o>/contact.jpg` and at every cover PNG. Check the style, that text stays inside the red safe guides, and that no stray text appears.
8. **Deliver:**
   - `<slug>_<o>.mp4` and `.srt`
   - `<slug>_<o>_cover_3x4|4x3[|9x16].png`
   - `STORYBOARD.md`, `SOURCES.md` and the 待核实 list
   - the duration, resolution and loudness from the QA line

## 4. Choosing a style
`python3 scripts/zv.py styles` lists the installed styles. Set `"style": "<id>"` in project.json.
| id | look | use for |
|---|---|---|
| `zhishi-dashang` | warm-black ground, gold line art, serif SC, gold keywords, bloom and grain, beat cuts | default for 知识大赏 / psychology-effect explainers |

If the user asks for a look that doesn't exist, offer to add it (§5) rather than forcing the default.

## 5. Adding a style
1. `cp -r styles/_template styles/<new-id>`. The template is a working minimal style that implements the render contract.
2. Follow `styles/_template/CHECKLIST.md`:
   - write `style.md`
   - implement `engine.js`, `scenes.js` and `cover.js` against the contract: `window.ready`, `window.draw(t)`, `window.drawCover(kind)`, `ZD.scene/motif/FX/T/L`, both orientations
   - fill in `style.json`: fonts, timing, accents
3. Test it: copy `examples/scene-gallery`, set its style, run `zv.py stills … -o both`, then run a short `build` until QA passes.
4. Register it in `styles/README.md` and in the table in §4.

The shared scripts never change for a new style. They read only `timeline.json` and `style.json`.

## 6. Files and environment
- `scripts/zv.py`: driver (`new`, `timeline`, `stills`, `build`, `covers`, `qa`, `lint`, `styles`). `scripts/check_env.sh` checks dependencies. The other scripts are pipeline steps that can each run alone.
- `styles/zhishi-dashang/`: the default style. `style.md` is its spec.
- `examples/white-bear-demo/`: a ~9 s example in both orientations, with a custom bear motif and verified SOURCES. Put your own BGM in `audio/bgm.mp3`; without it the demo uses an SFX-only track.
- `examples/scene-gallery/`: every scene type, one shot each, for previews.

Environment overrides:
- `ZV_PY`: Python that has `requirements.txt` installed. Default `./.venv/bin/python`, else the current interpreter.
- `ZV_PLAYWRIGHT_FROM`: a package.json whose node_modules contains playwright-core. Default: this repo.
- `ZV_CHROMIUM`: an existing Chrome/Chromium binary.
- `ZV_FONT_BOLD`, `ZV_FONT_REGULAR`, `ZV_FONT_DIR`: font locations (Noto Serif CJK/SC; fonts aren't bundled).
- `ZV_LINTER`: optional script linter.

Nothing in the pipeline uses the network or credentials.
