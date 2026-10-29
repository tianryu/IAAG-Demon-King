from pathlib import Path
from PIL import Image
import numpy as np,json
# Read alpha to select sprite frames. The generated source bitmaps remain unchanged.
specs=[('skin','public/assets/ui/skin-v4.png',4,3,['panel','gold','wood','purple','green','red','square','hud','stick','knob','ribbon','royal']),('icons','public/assets/ui/icons-v4.png',5,4,['coin','crown','sword','heart','shield','play','pause','close','plus','bow','haste','burst','snow','goblin','sound','home','hammer','flag','tower','help'])]
result={}
for name,path,cols,rows,keys in specs:
 im=Image.open(path).convert('RGBA');w,h=im.size;a=np.asarray(im)[:,:,3];frames={}
 boxes=[[20,80,355,405],[375,170,710,330],[735,170,1075,330],[1095,170,1440,330],[20,480,370,650],[430,445,660,670],[765,460,960,665],[1020,460,1430,665],[20,700,360,1040],[430,780,650,980],[700,805,1055,970],[1070,805,1445,970]]
 for i,key in enumerate(keys):
  if name=='skin':x0,y0,x1,y1=boxes[i]
  else:
   bands=[0,325,595,838,1122];x0=round(i%cols*w/cols);x1=round((i%cols+1)*w/cols);y0=bands[i//cols];y1=bands[i//cols+1]
  yy,xx=np.where(a[y0:y1,x0:x1]>128)
  bx=x0+int(xx.min());by=y0+int(yy.min());ex=x0+int(xx.max())+1;ey=y0+int(yy.max())+1
  frames[key]=[bx,by,ex-bx,ey-by]
 result[name]=frames
 print(name,im.size,frames)
Path('src/ui-frames.ts').write_text('export const uiFrames='+json.dumps(result,separators=(',',':'))+' as const;\n',encoding='utf-8')
