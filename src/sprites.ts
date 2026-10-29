import Phaser from 'phaser';
import {buildingFrames} from './building-frames.ts';
export const buildingKinds=['castle','mine','farm','melee','ranged','elite','wall','tower'];
export const troopKinds=['goblin','archer','elite','human','bowman','shield','knight','wizard','paladin'];
export function registerSprites(scene:Phaser.Scene){
 const bt=scene.textures.get('building-levels');
 for(let level=1;level<=5;level++)buildingKinds.forEach(kind=>{const [x,y,w,h]=buildingFrames[kind][level-1];bt.add(`${kind}-${level}`,0,x,y,w,h)});
 for(const [key,kinds] of [['lords',Array.from({length:5},(_,i)=>`lord${i}`)],['troops',troopKinds]] as const){
  const texture=scene.textures.get(key),im=texture.getSourceImage() as HTMLImageElement;
  const rowBounds=key==='lords'?[0,171,350,545,756,975]:[0,155,296,458,605,748,890,1040,1185,1330];
  kinds.forEach((kind,row)=>{for(let col=0;col<8;col++){const x=Math.round(col*im.width/8),y=rowBounds[row],bottom=rowBounds[row+1];texture.add(`${kind}-${col}`,0,x,y,Math.round((col+1)*im.width/8)-x,bottom-y)}
   for(const state of ['walk','attack'] as const)scene.anims.create({key:`${kind}-${state}`,frames:Array.from({length:4},(_,i)=>({key,frame:`${kind}-${state==='attack'?((kind==='archer'||kind==='bowman')&&i===0?5:i+4):i}`})),frameRate:state==='attack'?12:8,repeat:state==='walk'?-1:0});
  });
 }
}
