export type EnemyKind='human'|'bowman'|'shield'|'knight'|'wizard'|'paladin';
export function wavePlan(wave:number){
 const count=wave<=3?[8,11,14][wave-1]:wave<=10?16+(wave-4)*2:Math.min(88,28+(wave-10)*3+Math.floor((wave-10)/5)*2);
 const groups=wave<=2?2:Math.min(6,3+Math.floor((wave-1)/8));
 const batches=Array.from({length:groups},(_,i)=>Math.floor(count/groups)+(i>=groups-count%groups?1:0));
 return {batches,gap:wave<=3?15:Math.max(8,13-wave*.13),power:wave<=3?[.72,.83,.95][wave-1]:1.06+(wave-4)*.1+Math.pow(Math.max(0,wave-25),1.3)*.026};
}
export function enemyKind(wave:number,index:number,boss=false):EnemyKind{
 if(boss)return (['knight','wizard','paladin'] as const)[Math.floor(wave/10-1)%3];
 return wave>=3&&index%5===0?'shield':wave>=2&&index%3===1?'bowman':'human';
}
export function formation(count:number,cameraTop:number,northBoundary:number){
 // Entire squad (including its lowest row) starts at least 96 world pixels above the camera.
 const bottom=Math.min(cameraTop-96,northBoundary-72);
 return Array.from({length:count},(_,i)=>({x:87+(i%4)*22,y:bottom-Math.floor(i/4)*22}));
}

export function nearestPoint<T extends {x:number;y:number}>(x:number,y:number,targets:T[]):T|undefined{let found:T|undefined,best=Infinity;for(const t of targets){const d=(t.x-x)**2+(t.y-y)**2;if(d<best){best=d;found=t}}return found;}
