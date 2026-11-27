import sys, glob, re
from PIL import Image
pre, out = sys.argv[1], sys.argv[2]
fs = sorted(glob.glob(pre + "*.jpg"), key=lambda s: int(re.findall(r"(\d+)\.jpg$", s)[0]))
ims = [Image.open(f).resize((300, 533)) for f in fs]
cols = 6; rows = (len(ims) + cols - 1) // cols
S = Image.new("RGB", (300 * cols, 533 * rows), "white")
for i, im in enumerate(ims): S.paste(im, ((i % cols) * 300, (i // cols) * 533))
S.save(out); print([re.findall(r"(\d+)\.jpg$", f)[0] for f in fs])
