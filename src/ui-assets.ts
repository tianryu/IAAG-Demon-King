import {uiFrames} from './ui-frames.ts';
/** Decode the generated atlas into independent browser images for nine-slice UI rendering. */
export async function prepareUIAssets(){
 for(const [group,frames] of Object.entries(uiFrames)){
  const image=new Image();image.src=`/assets/ui/${group==='skin'?'skin':'icons'}-v4.png`;await image.decode();
  for(const [name,rect] of Object.entries(frames)){
   const [x,y,w,h]=rect,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
   const context=canvas.getContext('2d')!;context.imageSmoothingEnabled=false;context.drawImage(image,x,y,w,h,0,0,w,h);
   document.documentElement.style.setProperty(`--${group}-${name}`,`url("${canvas.toDataURL()}")`);
  }
 }
}
