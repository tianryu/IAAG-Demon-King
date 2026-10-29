export type Kind='castle'|'mine'|'farm'|'melee'|'ranged'|'elite'|'wall'|'tower';
export type Buff='count'|'attack'|'health'|'haste'|'income'|'armor'|'range'|'splash'|'regen'|'slow';
export interface Site {id:string;kind:Kind;x:number;y:number;unlock:number;line?:number}
export interface Building {level:number;buffs:Buff[]}
export interface Save {version:1;gold:number;wave:number;wins:number;lord:number;lordBuffs:Buff[];buildings:Record<string,Building>;claims:string[];failures:number;sound:boolean;tutorial:boolean;guideStep?:number;offers:Record<string,{stamp:string;buffs:Buff[];rerolled:boolean}>;adBonuses?:Record<string,Buff[][]>}
export const names:Record<Kind,string>={castle:'魔王堡',mine:'金矿',farm:'蘑菇田',melee:'近战营',ranged:'弓兵营',elite:'精英营',wall:'城墙',tower:'箭塔'};
export const frames:Record<Kind,string>={castle:'castle',mine:'mine',farm:'farm',melee:'melee',ranged:'ranged',elite:'elite',wall:'wall',tower:'tower'};
export const sites:Site[]=[{id:'castle',kind:'castle',x:120,y:1370,unlock:1}];
const lineY=[340,550,760,970],lineUnlock=[5,4,2,1];
for(let line=0;line<4;line++){
  [75,165].forEach((x,i)=>sites.push({id:`wall-${line}-${i}`,kind:'wall',x,y:lineY[line],unlock:lineUnlock[line],line}));
  [30,78,162,210].forEach((x,i)=>sites.push({id:`tower-${line}-${i}`,kind:'tower',x,y:lineY[line]+(i===1||i===2?28:16),unlock:lineUnlock[line],line}));
}
for(let i=0;i<4;i++) for(const kind of ['mine','farm'] as Kind[]) sites.push({id:`${kind}-${i}`,kind,x:kind==='mine'?57:183,y:1100+i*70,unlock:i+1});
sites.push({id:'melee-0',kind:'melee',x:58,y:1030,unlock:1},{id:'ranged-0',kind:'ranged',x:182,y:1030,unlock:2},{id:'melee-1',kind:'melee',x:58,y:820,unlock:3},{id:'ranged-1',kind:'ranged',x:182,y:820,unlock:4});
sites.push({id:'elite-0',kind:'elite',x:182,y:890,unlock:2},{id:'elite-1',kind:'elite',x:58,y:620,unlock:3},{id:'elite-2',kind:'elite',x:182,y:410,unlock:5});
export const initialSave=():Save=>{
  const buildings=Object.fromEntries(sites.map(s=>[s.id,{level:0,buffs:[] as Buff[]}]));
  ['castle','melee-0'].forEach(id=>buildings[id].level=1);
  return {version:1,gold:240,wave:1,wins:0,lord:1,lordBuffs:[],buildings,claims:[],failures:0,sound:true,tutorial:false,guideStep:0,offers:{}};
};
export const buffCount=(b:Building|{buffs:Buff[]},k:Buff)=>b.buffs.filter(x=>x===k).length;
export function capacity(b:Building,kind:Kind){return !b.level?0:kind==='elite'?1:Math.min(12,3+b.level-1+buffCount(b,'count'));}
export const castleLevel=(s:Save)=>s.buildings.castle.level;
export const unlocked=(s:Save,site:Site)=>castleLevel(s)>=site.unlock;
export function cost(s:Save,id:string){
  if(id==='lord'){const n=s.lord-1;return Math.round(55*(1+.16*n+.012*n*n));}
  const site=sites.find(x=>x.id===id)!;const b=s.buildings[id];
  const base:Record<Kind,number>={castle:220,mine:65,farm:70,melee:85,ranged:90,elite:160,wall:45,tower:60};
  return Math.round(base[site.kind]*(1+.6*b.level+.15*b.level*b.level));
}
export interface Option {buff:Buff;label:string;value:string;icon:string;detail:string}
export const options:Record<Buff,Option>={
 count:{buff:'count',label:'增兵',value:'+1',icon:'♟',detail:'这座兵营额外增加 1 名士兵'},
 attack:{buff:'attack',label:'攻击',value:'+25%',icon:'⚔',detail:'攻击增加基础值的 25%'},
 health:{buff:'health',label:'生命',value:'+30%',icon:'♥',detail:'生命增加基础值的 30%'},
 haste:{buff:'haste',label:'急速',value:'+18%',icon:'»',detail:'攻击更快，兵营补员也更快'},
 income:{buff:'income',label:'丰收',value:'+25%',icon:'◆',detail:'这座建筑的金币产出增加 25%'},
 armor:{buff:'armor',label:'坚甲',value:'受到伤害降低 12%',icon:'⬟',detail:'受到伤害降低，最高减伤 60%'},
 range:{buff:'range',label:'射程',value:'+18',icon:'➶',detail:'攻击距离增加 18'},
 splash:{buff:'splash',label:'溅射',value:'35%',icon:'✹',detail:'攻击对附近另一目标造成溅射伤害'},
 regen:{buff:'regen',label:'恢复',value:'+2/s',icon:'✚',detail:'每秒恢复 2 点生命'},
 slow:{buff:'slow',label:'缓速',value:'25%',icon:'❄',detail:'命中使敌人短暂减速 25%'}
};
export function choices(s:Save,id:string,rng= Math.random,exclude:Buff[]=[]):Option[]{
  const kind=id==='lord'?'lord':sites.find(x=>x.id===id)!.kind;
  let pool:Buff[]=kind==='mine'||kind==='farm'?['income','health','armor']:kind==='wall'||kind==='castle'?['health','armor','regen']:['attack','health','haste', 'armor'];
  if(kind==='ranged'||kind==='tower'||kind==='lord') pool.push('range','splash','slow');
  const active=combined(s,id);pool=pool.filter(k=>k==='armor'?buffCount(active,'armor')<5:k==='splash'||k==='slow'?!buffCount(active,k):true);
  const remaining=pool.filter(k=>!exclude.includes(k));if(remaining.length>=(kind==='melee'||kind==='ranged'?2:3))pool=remaining;
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  if((kind==='melee'||kind==='ranged')&&capacity(s.buildings[id],kind)<11) return ['count' as Buff,...pool.slice(0,2)].map(k=>options[k]);
  return pool.slice(0,3).map(k=>options[k]);
}
export function getOffer(s:Save,id:string){const b=id==='lord'?{level:s.lord,buffs:s.lordBuffs}:s.buildings[id];const stamp=`${b.level}/${b.buffs.join(',')}`;if(s.offers[id]?.stamp!==stamp)s.offers[id]={stamp,buffs:choices(s,id).map(o=>o.buff),rerolled:false};return s.offers[id];}
export function canReroll(id:string){return id==='lord'||['melee','ranged','elite','tower'].includes(sites.find(t=>t.id===id)!.kind);}
export function rerollOffer(s:Save,id:string){const offer=getOffer(s,id);if(offer.rerolled||!canReroll(id))return false;offer.buffs=choices(s,id,Math.random,offer.buffs).map(o=>o.buff);offer.rerolled=true;return true;}
export function upgrade(s:Save,id:string,buff:Buff,free=false):boolean{
  if(id!=='lord'&&!sites.some(t=>t.id===id))return false;
  const price=free?0:cost(s,id);if(s.gold<price)return false;
  if(id==='lord'){if(!['attack','health','haste','armor','range','splash','slow'].includes(buff))return false;s.gold-=price;s.lord++;s.lordBuffs.push(buff);s.adBonuses?.[id]?.push([]);return true;}
  const site=sites.find(x=>x.id===id);if(!site||!unlocked(s,site))return false;
  const b=s.buildings[id];s.gold-=price;
  if(!b.level){b.level=1;return true;}
  b.level++;b.buffs.push(buff);s.adBonuses?.[id]?.push([]);return true;
}
export function upgradeAll(s:Save,id:string,stamp:string){
 const site=sites.find(t=>t.id===id);if(id!=='lord'&&(!site||!unlocked(s,site)||!s.buildings[id].level))return false;
 const offer=getOffer(s,id);if(offer.stamp!==stamp)return false;
 const buffs=[...offer.buffs];s.adBonuses??={};s.adBonuses[id]??=Array.from({length:id==='lord'?s.lordBuffs.length:s.buildings[id].buffs.length},()=>[]);
 if(!upgrade(s,id,buffs[0],true))return false;
 const groups=s.adBonuses[id];groups[groups.length-1]=buffs.slice(1);return true;
}
const combined=(s:Save,id:string)=>{const base=id==='lord'?{level:s.lord,buffs:s.lordBuffs}:s.buildings[id];return {...base,buffs:[...base.buffs,...(s.adBonuses?.[id]||[]).flat()]};};
export const goldAdReward=(s:Save)=>Math.ceil(Math.max(80,.6*(60+s.wave*9+production(s,false)+(production(s,true)-production(s,false))/3))/10)*10;
export function stats(s:Save,id:string){
 const lord=id==='lord',site=sites.find(x=>x.id===id);const b=combined(s,id);const kind=lord?'lord':site!.kind;
 const power=1+(s.lord-1)*.025;
 const hpBase=kind==='castle'?1300:kind==='wall'?450:kind==='tower'?260:kind==='lord'?180:kind==='elite'?210:kind==='melee'?70:kind==='ranged'?45:220;
 const attackBase=kind==='lord'?23:kind==='elite'?28:kind==='tower'?14:kind==='ranged'?9:11;
 const growth=1+(b.level-1)*(lord?.12:.22);
 const hp=Math.round(hpBase*growth*(1+.3*buffCount(b,'health'))*power),unit=lord||kind==='melee'||kind==='ranged'||kind==='elite';
 return {hp,attack:attackBase*growth*(1+.25*buffCount(b,'attack'))*power,interval:Math.max(.25,1/(1+.18*buffCount(b,'haste'))),armor:Math.min(.6,.12*buffCount(b,'armor')),range:(kind==='tower'?95:kind==='ranged'?75:kind==='lord'?30:18)+18*buffCount(b,'range'),regen:(unit?hp*.008:0)+2*buffCount(b,'regen'),splash:buffCount(b,'splash')>0,slow:buffCount(b,'slow')>0,respawn:Math.max(1,7/(1+.18*buffCount(b,'haste')))};
}
export function productionIncome(s:Save,id:string){
 const kind=sites.find(site=>site.id===id)?.kind;if(kind!=='mine'&&kind!=='farm')return 0;
 const b=combined(s,id);if(!b.level)return 0;return Math.round((kind==='mine'?8:28)*(1+.65*(b.level-1))*(1+.25*buffCount(b,'income'))*(1+(s.lord-1)*.005));
}
export function production(s:Save,harvest:boolean){return sites.reduce((gold,site)=>gold+(site.kind==='mine'||site.kind==='farm'&&harvest?productionIncome(s,site.id):0),0);}
export const waveReward=(wave:number)=>34+wave*4+(wave%10===0?50:0);
export const killReward=(boss:boolean)=>boss?10:1;
export function claim(s:Save,id:string,reward:number){if(s.claims.includes(id)||!Number.isFinite(reward)||reward<0)return false;s.claims.push(id);s.claims=s.claims.slice(-100);s.gold+=reward;return true;}
export function parseSave(text:string):Save{
 const x=JSON.parse(text) as Save;
 if(x?.version!==1)throw Error('存档版本无效');
 for(const k of ['gold','wave','wins','lord','failures'] as const)if(!Number.isSafeInteger(x[k])||x[k]<0)throw Error('存档数值无效');
 if(x.wave<1||x.lord<1)throw Error('存档进度无效');
 if(!Array.isArray(x.lordBuffs)||x.lordBuffs.length!==x.lord-1||!x.lordBuffs.every(k=>k in options)||!Array.isArray(x.claims)||!x.claims.every(k=>typeof k==='string'))throw Error('存档强化无效');
 for(const site of sites){const b=x.buildings?.[site.id];if(!b||!Number.isSafeInteger(b.level)||b.level<0||!Array.isArray(b.buffs)||b.buffs.length!==Math.max(0,b.level-1)||!b.buffs.every(k=>k in options))throw Error('建筑存档无效');}
 if(!x.buildings.castle.level)throw Error('城堡存档无效');
 if(x.adBonuses!==undefined){if(!x.adBonuses||typeof x.adBonuses!=='object'||Array.isArray(x.adBonuses))throw Error('奖励存档无效');for(const [id,groups] of Object.entries(x.adBonuses)){const base=id==='lord'?x.lordBuffs:x.buildings[id]?.buffs;if(!base||!Array.isArray(groups)||groups.length!==base.length||!groups.every(g=>Array.isArray(g)&&g.length<=2&&g.every(k=>k in options&&k!=='count')))throw Error('奖励强化无效');}}
  if(typeof x.sound!=='boolean'||typeof x.tutorial!=='boolean')throw Error('设置存档无效');
  if(x.guideStep!==undefined&&(!Number.isInteger(x.guideStep)||x.guideStep<0||x.guideStep>5))throw Error('引导存档无效');
  x.offers??={};if(typeof x.offers!=='object'||Array.isArray(x.offers))throw Error('选项存档无效');for(const [id,o] of Object.entries(x.offers)){if(id!=='lord'&&!sites.some(t=>t.id===id))throw Error('选项建筑无效');if(typeof o.stamp!=='string'||typeof o.rerolled!=='boolean'||!Array.isArray(o.buffs)||(o.buffs.length<2||o.buffs.length>3)||!o.buffs.every(k=>k in options))throw Error('选项存档无效');}return x;
}
export function queueStep(remaining:number,alive:number,max:number,dt:number,destroyed:boolean,seconds:number):{remaining:number;spawn:boolean}{
 if(destroyed||alive>=max)return {remaining:alive>=max?seconds:remaining,spawn:false};
 remaining-=dt;return remaining<=0?{remaining:seconds,spawn:true}:{remaining,spawn:false};
}
