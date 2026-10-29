from pathlib import Path
import numpy as np,json
from PIL import Image
im=Image.open('public/assets/art/buildings-v3.png').convert('RGBA')
a=np.asarray(im)[:,:,3];w,h=im.size
rows=[0,198,390,567,756,974]
kinds=['castle','mine','farm','melee','ranged','elite','wall','tower']
frames={}
for col,kind in enumerate(kinds):
 frames[kind]=[]
 for r in range(5):
  x0=round(col*w/8);x1=round((col+1)*w/8);y0=rows[r];y1=rows[r+1]
  yy,xx=np.where(a[y0:y1,x0:x1]>128)
  bx=x0+max(0,int(xx.min())-1);by=y0+max(0,int(yy.min())-1)
  right=min(x1,x0+int(xx.max())+2);bottom=min(y1,y0+int(yy.max())+2)
  frames[kind].append([bx,by,right-bx,bottom-by])
Path('src/building-frames.ts').write_text('// Alpha bounds used only for sprite-sheet frame selection; source bitmap unchanged.\nexport const buildingFrames:Record<string,number[][]>='+json.dumps(frames,separators=(',',':'))+';\n',encoding='utf-8')
print('Measured 40 nonempty frame rectangles')
