# Third-party notices and credits

This repository contains no vendored third-party source code. All code here was written for this project and is released under the MIT license (see `LICENSE`).

## Runtime dependencies (installed by you, not bundled)
| dependency | license | how it's used |
|---|---|---|
| [playwright-core](https://github.com/microsoft/playwright) | Apache-2.0 | headless Chromium that screenshots each Canvas frame |
| Chromium / Chrome | BSD-style / vendor terms | browser engine |
| [FFmpeg](https://ffmpeg.org) | LGPL/GPL (depends on your build) | encoding (libx264), loudness measurement; called as an external program |
| numpy, scipy | BSD-3-Clause | audio DSP |
| [librosa](https://github.com/librosa/librosa) | ISC | tempo / beat grid analysis |
| [pyloudnorm](https://github.com/csteinmetz1/pyloudnorm) | MIT | integrated loudness (−14 LUFS) |
| soundfile | BSD-3-Clause | WAV writing |
| Pillow | MIT-CMU (HPND) | contact sheets, cover size checks |
| fontTools | MIT | font subsetting (`pyftsubset`) |

## Fonts (not bundled)
The default style uses **Noto Serif CJK SC** (Google / Adobe), licensed under the **SIL Open Font License 1.1** (https://github.com/notofonts/noto-cjk). No font files are committed. `scripts/make_fonts.py` locates a locally installed copy and writes a subset into each build folder. If you redistribute rendered builds that include the subset fonts, the OFL applies to those font files.

## Credits / inspiration
- **lemo-opuscar** by LemoLab (MIT), https://github.com/lemomo-ai/lemo-opuscar. Its idea of making films entirely in code (a Canvas page where each frame is a pure function of `t`, captured frame by frame with Playwright, then muxed with ffmpeg) inspired this pipeline. No code from it is included.
- **xilo-opus-video** by 周行 (Kianzzz) (MIT), https://github.com/Kianzzz/xilo-opus-video. A related code-to-video skill, used as reference only. No code from it is included.
- **taishang-laojun** (https://github.com/liuhaisi2026212-maker/taishang-laojun): its Chinese AI-tell linter can optionally be plugged in through `ZV_LINTER` (`zv.py lint`). It is not bundled. Its reference texts are licensed CC BY-NC 4.0; see that repository for terms.
- `examples/white-bear-demo/motifs.js` (the gold line-art polar bear) comes from the author's own 白熊效应 film.
