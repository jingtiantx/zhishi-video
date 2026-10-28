"""Contact sheet: python3 sheet.py out.jpg cols img1 img2 ... (labels from filenames).
Red guides: landscape = 5 % title-safe frame; portrait = short-video app UI zones (bottom 20 %, right 15 %)."""
import sys, re, os
from PIL import Image, ImageDraw, ImageFont
out, cols, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
LAND = Image.open(files[0]).width > Image.open(files[0]).height
tw, th = (640, 360) if LAND else (360, 640)
rows = (len(files) + cols - 1) // cols
S = Image.new('RGB', (cols * (tw + 12) + 12, rows * (th + 52) + 12), (24, 24, 24)); d = ImageDraw.Draw(S)
try: F = ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc', 26)
except Exception: F = ImageFont.load_default()
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((tw, th), Image.LANCZOS); x = 12 + (i % cols) * (tw + 12); y = 12 + (i // cols) * (th + 52)
    S.paste(im, (x, y + 40))
    if LAND: d.rectangle([x + int(tw * .05), y + 40 + int(th * .05), x + int(tw * .95), y + 40 + int(th * .95)], outline=(200, 60, 60))
    else:
        d.rectangle([x + int(tw * .85), y + 40, x + tw - 1, y + 40 + th - 1], outline=(200, 60, 60)); d.line([x, y + 40 + int(th * .8), x + tw, y + 40 + int(th * .8)], fill=(200, 60, 60))
    d.text((x, y + 4), os.path.splitext(os.path.basename(f))[0], fill=(240, 220, 160), font=F)
S.save(out, quality=88); print(out, S.size)
