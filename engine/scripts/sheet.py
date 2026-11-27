import sys
from PIL import Image
pre, fs, out = sys.argv[1], sys.argv[2].split(","), sys.argv[3]
ims=[Image.open(f'{pre}{f}.jpg').resize((300,533)) for f in fs]
n=len(ims); cols=5; rows=(n+cols-1)//cols
W=Image.new('RGB',(300*cols,533*rows))
for i,im in enumerate(ims): W.paste(im,((i%cols)*300,(i//cols)*533))
W.save(out,quality=85)
