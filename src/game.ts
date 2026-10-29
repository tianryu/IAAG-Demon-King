import Phaser from 'phaser';
import {sites,names,unlocked,capacity,stats,upgrade,production,productionIncome,waveReward,killReward,queueStep,claim,initialSave,upgradeAll,type Site,type Save} from './model.ts';
import {load,persist} from './storage.ts';
import {UI} from './ui.ts';
import {GameAudio} from './audio.ts';
import {registerSprites} from './sprites.ts';
import {wavePlan,enemyKind,formation,nearestPoint} from './waves.ts';
import {compact} from './icons.ts';
type Sprite=Phaser.GameObjects.Sprite;
type Unit={id:number;x:number;y:number;hp:number;max:number;attack:number;range:number;interval:number;cool:number;armor:number;regen:number;splash:boolean;slow:boolean;slowed:number;side:'friend'|'enemy';kind:string;home?:string;sprite:Sprite;speed:number;boss?:boolean;anim:string;lastX:number;lastY:number;attackUntil:number};
type BuildingView={site:Site;sprite:Sprite;label:Phaser.GameObjects.Text;status:Phaser.GameObjects.Text;flag:Sprite;hp:number;max:number;cool:number;queue:number};
const W=240,WORLD=1520;
const visibleUnitHeight:Record<string,number>={lord0:.68,lord1:.8,lord2:.8,lord3:.88,lord4:.94,goblin:.68,archer:.78,elite:.82,human:.82,bowman:.82,shield:.84,knight:.88,wizard:.84,paladin:.86};
const buildingRects:Record<string,number[]>={castle:[0,0,345,363],tower:[350,0,272,363],melee:[630,45,310,321],ranged:[945,45,320,321],mine:[0,408,338,309],farm:[340,424,301,294],elite:[640,366,304,352],wall:[940,490,328,193],tree:[0,720,327,300],pine:[360,748,250,272],bush:[660,805,260,210],rocks:[950,770,310,250],chest:[45,1040,250,205],sign:[360,1020,250,225],torch:[714,1010,150,235],crown:[1010,1060,195,145]};
export class Kingdom extends Phaser.Scene{
 save!:Save;ui!:UI;views:BuildingView[]=[];units:Unit[]=[];hero!:Unit;hp!:Phaser.GameObjects.Graphics;ground!:Phaser.GameObjects.Graphics;highlight!:Phaser.GameObjects.Graphics;
 paused=false;hidden=false;battle=false;settling=false;continued=false;spawnLeft=0;spawnTimer=0;elapsed=0;incomeTimer=0;nextId=1;heroRevive=0;moveX=0;moveY=0;batchIndex=0;spawned=0;lastSpawn:{cameraTop:number;positions:{x:number;y:number}[]}={cameraTop:0,positions:[]};target?:Site;keys!:Record<string,Phaser.Input.Keyboard.Key>;clock=0;music=new GameAudio();saveWarning=false;oldY=0;waveSeed=0;qaSpeed=1;qaMode=import.meta.env.DEV&&new URLSearchParams(location.search).has('qa');
 constructor(){super('Kingdom');}
 preload(){this.load.image('level-flag','assets/ui/level-flag-v4.png');this.load.image('buildings','assets/art/buildings.png');this.load.image('building-levels','assets/art/buildings-v3.png');this.load.image('lords','assets/art/lords-v3.png');this.load.image('troops','assets/art/troops-v3.png');this.load.spritesheet('hit','assets/fx/10_weaponhit_spritesheet.png',{frameWidth:100,frameHeight:100});this.load.spritesheet('cast','assets/fx/4_casting_spritesheet.png',{frameWidth:100,frameHeight:100});this.load.spritesheet('magic','assets/fx/5_magickahit_spritesheet.png',{frameWidth:100,frameHeight:100});this.load.spritesheet('shieldfx','assets/fx/8_protectioncircle_spritesheet.png',{frameWidth:100,frameHeight:100});this.load.on('loaderror',()=>{document.querySelector('#loading small')!.textContent='素材加载失败，请刷新重试';});}
 create(){
  const data=load();this.save=data.save;if(this.qaMode){this.save=JSON.parse(JSON.stringify(this.save));this.save.tutorial=true;}
  const bt=this.textures.get('buildings');Object.entries(buildingRects).forEach(([name,r])=>bt.add(name,0,r[0],r[1],r[2],r[3]));
  registerSprites(this);this.textures.get('level-flag').add('trim',0,190,150,654,1205);
  ['hit','cast','magic','shieldfx'].forEach(key=>this.anims.create({key,frames:this.anims.generateFrameNumbers(key),frameRate:key==='hit'?70:90,repeat:0,hideOnComplete:true}));
  this.cameras.main.setBounds(0,0,W,WORLD);this.cameras.main.roundPixels=true;
  this.paintGround();
  this.views=sites.map(site=>{const sprite=this.add.sprite(site.x,site.y,'buildings',site.kind).setOrigin(.5,.9);this.fitBuilding(sprite,site.kind);sprite.setInteractive();sprite.on('pointerup',()=>{if(this.paused||this.battle||!unlocked(this.save,site))return;if(Phaser.Math.Distance.Between(this.hero.x,this.hero.y,site.x,site.y)<80)this.ui.upgradeMenu(site.id);else this.target=site;});const flag=this.add.sprite(site.x,site.y,'level-flag','trim').setDisplaySize(16,29).setOrigin(.5,1);const label=this.add.text(site.x,site.y,'',{fontFamily:'Ark Pixel',fontSize:'12px',color:'#fff6ce',stroke:'#412457',strokeThickness:1}).setOrigin(.5,.5);const status=this.add.text(site.x,site.y+6,'',{fontFamily:'Ark Pixel',fontSize:'10px',color:'#fff0bb',stroke:'#203c30',strokeThickness:2}).setOrigin(.5,0);return {site,sprite,label,status,flag,hp:1,max:1,cool:0,queue:7};});
  this.highlight=this.add.graphics();this.hp=this.add.graphics().setDepth(4000);
  this.hero=this.makeUnit('friend','lord',120,1070);this.hero.home='lord';this.refresh();
  this.ui=new UI(this.save,{start:()=>this.startWave(),upgrade:(id,buff)=>{if(this.battle){this.ui.toast('战后再建设');return false;}if(!upgrade(this.save,id,buff))return false;this.refresh();this.store();this.fx('shieldfx',id==='lord'?this.hero.x:this.views.find(v=>v.site.id===id)!.site.x,id==='lord'?this.hero.y:this.views.find(v=>v.site.id===id)!.site.y,60);this.music.play('upgrade');return true;},pause:v=>{this.paused=v;this.target=undefined;this.moveX=this.moveY=0;},finish:()=>this.finishWave(),upgradeAll:(id,stamp)=>{if(this.battle||!upgradeAll(this.save,id,stamp))return false;this.refresh();this.store();this.music.play('upgrade');return true;},goldAd:(amount,wave)=>{if(this.save.wave!==wave||!claim(this.save,`supply-ad-${wave}`,amount))return false;this.store();this.music.play('coin');return true;},victory:()=>this.adVictory(),click:()=>{this.music.unlock();this.music.play('click');},sound:()=>{this.save.sound=!this.save.sound;this.music.configure(this.save.sound,this.battle,this.paused);this.store()},save:()=>this.store(),move:(x,y)=>{this.moveX=x;this.moveY=y;this.target=undefined;},focus:(id)=>{if(!this.battle)this.target=sites.find(s=>s.id===id);},newGame:()=>{const sound=this.save.sound;this.save=initialSave();this.save.sound=sound;this.ui.save=this.save;this.hero.x=120;this.hero.y=1070;this.finishWave();}});
  document.addEventListener('pointerdown',()=>this.music.unlock());document.addEventListener('keydown',()=>this.music.unlock());
  this.keys=this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,ESC') as Record<string,Phaser.Input.Keyboard.Key>;
  this.keys.SPACE.on('down',()=>{if(!this.ui.modal)this.startWave()});this.keys.ESC.on('down',()=>{if(this.ui.mode!=='playing'){this.ui.mainMenu();return;}if(this.ui.modal&&!this.settling)this.ui.close();else if(!this.ui.modal)this.ui.pauseMenu()});
  document.addEventListener('visibilitychange',()=>{this.hidden=document.hidden;this.moveX=this.moveY=0;this.store();if(!document.hidden&&!this.ui.modal)this.ui.pauseMenu();});window.addEventListener('blur',()=>{this.moveX=this.moveY=0;if(!this.ui.modal)this.ui.pauseMenu();});window.addEventListener('pagehide',()=>this.store());
  this.cameras.main.scrollY=Phaser.Math.Clamp(this.hero.y-this.scale.height*.48,0,WORLD-this.scale.height);document.querySelector('#loading')!.remove();if(!this.qaMode)this.ui.mainMenu();if(data.warning)this.ui.toast(data.warning);
  this.game.events.emit('ready');
  if(import.meta.env.DEV&&this.qaMode)void import('./qa.ts').then(m=>m.installQA(this));
 }
 fitBuilding(sprite:Sprite,kind:string){const r=buildingRects[kind];const width=kind==='castle'?110:kind==='wall'?90:kind==='tower'?38:kind==='elite'?58:kind==='mine'||kind==='farm'?61:57;sprite.setDisplaySize(width,width*r[3]/r[2]);}
 paintGround(){
  const g=this.add.graphics().setDepth(-200);g.fillStyle(0x8cbb43);g.fillRect(0,0,W,WORLD);
  for(let y=0;y<WORLD;y+=6){const edge=6*Math.round(Math.sin(y*.027)+Math.cos(y*.065)*.5);g.fillStyle(0xe8c56a);g.fillRect(105+edge,y,30,6);g.fillStyle(0xeecf78);g.fillRect(111+edge,y,19,6);}
  const rng=new Phaser.Math.RandomDataGenerator(['goblin-forest']);
  for(let i=0;i<90;i++){const x=rng.between(18,222),y=rng.between(30,WORLD);if(x>95&&x<145)continue;g.fillStyle(i%3===0?0xbcd45b:0x69a34a);g.fillRect(x,y,2,5);g.fillRect(x-2,y+2,6,2);}
  for(let y=0;y<WORLD+60;y+=37){for(const x of [-2,242]){const frame=y%3?'tree':'pine';const sp=this.add.sprite(x+rng.between(-7,4),y,'buildings',frame);sp.setDisplaySize(50,52).setDepth(y+1);}}
  for(const y of [260,470,680,890]){g.fillStyle(0x72a34c,.55);g.fillRect(24,y,192,2);}
  this.ground=g;
 }
 makeUnit(side:'friend'|'enemy',kind:string,x:number,y:number,home?:string):Unit{
  const lord=kind==='lord',friendly=side==='friend';let frame=lord?`lord${Math.min(4,Math.floor((this.save.lord-1)/5))}`:kind;
  const sp=this.add.sprite(x,y,lord?'lords':'troops',`${frame}-0`).setOrigin(.5,1);const size=lord?48+Math.min(4,Math.floor((this.save.lord-1)/5))*1.5:kind==='knight'||kind==='wizard'||kind==='paladin'?44:kind==='elite'?34:28;sp.setDisplaySize(size,size*sp.frame.realHeight/sp.frame.realWidth);const s=friendly?stats(this.save,home||'lord'):undefined;
  const power=wavePlan(this.save.wave).power*.85;const boss=['knight','wizard','paladin'].includes(kind);
  const unit:Unit={id:this.nextId++,x,y,hp:s?.hp??(boss?950:kind==='shield'?145:kind==='bowman'?56:76)*power,max:1,attack:s?.attack??(boss?38:kind==='bowman'?11:15)*power,range:s?.range??(kind==='bowman'||kind==='wizard'?72:18),interval:s?.interval??(boss?1.15:1.25),cool:Math.random()*.4,armor:s?.armor??(kind==='shield'?.1:0),regen:s?.regen??0,splash:s?.splash??false,slow:s?.slow??false,slowed:0,side,kind,home,sprite:sp,speed:lord?75:friendly?38:boss?22:kind==='shield'?26:32,boss,anim:frame,lastX:x,lastY:y,attackUntil:0};unit.max=unit.hp;this.units.push(unit);return unit;
 }
 refresh(){
  const castleSite=sites[0];castleSite.y=1200+Math.min(3,this.save.buildings.castle.level-1)*70;this.cameras.main.setBounds(0,0,W,castleSite.y+90);
  this.views[0].sprite.setPosition(castleSite.x,castleSite.y);this.views[0].label.setPosition(castleSite.x,castleSite.y+2);
  for(const v of this.views){const b=this.save.buildings[v.site.id];const open=unlocked(this.save,v.site);v.sprite.setVisible(open);v.label.setVisible(open&&b.level>0);v.flag.setVisible(open&&b.level>0);v.status.setVisible(open&&b.level>0).setText(v.site.kind==='mine'||v.site.kind==='farm'?`${v.site.kind==='mine'?'每胜':'3胜'} +${compact(productionIncome(this.save,v.site.id))}`:'');v.sprite.setTexture(b.level?'building-levels':'buildings',b.level?`${v.site.kind}-${Math.min(5,b.level)}`:'sign');if(b.level)this.fitLevelBuilding(v.sprite,v.site.kind);else v.sprite.setDisplaySize(23,23);v.sprite.setAlpha(b.level?1:.9);v.sprite.setInteractive(new Phaser.Geom.Rectangle(0,0,v.sprite.width,v.sprite.height),Phaser.Geom.Rectangle.Contains);v.label.setText(b.level?compact(b.level):'');v.flag.setDisplaySize(Math.max(16,v.label.width+4),29);v.sprite.setDepth(v.site.y);const offset=v.site.kind==='castle'?53:v.site.kind==='wall'?41:v.site.kind==='tower'?19:31,flagX=Phaser.Math.Clamp(v.site.x+(v.site.x>190?-offset:offset),12,228),flagY=v.site.y+7;v.flag.setPosition(flagX,flagY).setDepth(v.site.y+105);v.label.setPosition(flagX+2,flagY-14).setDepth(v.site.y+106);v.status.setPosition(v.site.x,v.site.y+8).setDepth(v.site.y+107);const st=stats(this.save,v.site.id);v.max=st.hp*(['melee','ranged','elite'].includes(v.site.kind)?4:1);v.hp=v.max;v.queue=st.respawn;}
  for(const v of this.views)if(v.site.kind==='mine'||v.site.kind==='farm')v.status.setFontSize(12).setColor('#ffdf79').setStroke('#203c30',1);
  this.units.filter(u=>u!==this.hero).forEach(u=>u.sprite.destroy());this.units=[this.hero];const st=stats(this.save,'lord');Object.assign(this.hero,{hp:st.hp,max:st.hp,attack:st.attack,range:st.range,interval:st.interval,armor:st.armor,regen:st.regen,splash:st.splash,slow:st.slow});this.hero.anim=`lord${Math.min(4,Math.floor((this.save.lord-1)/5))}`;this.hero.sprite.stop().setTexture('lords',`${this.hero.anim}-0`).setAlpha(1);const heroSize=48+Math.min(4,Math.floor((this.save.lord-1)/5))*1.5;this.hero.sprite.setDisplaySize(heroSize,heroSize*this.hero.sprite.frame.realHeight/this.hero.sprite.frame.realWidth);this.heroRevive=0;
  for(const v of this.views){if(!['melee','ranged','elite'].includes(v.site.kind)||!this.save.buildings[v.site.id].level)continue;for(let i=0;i<capacity(this.save.buildings[v.site.id],v.site.kind);i++)this.recruit(v,i);}
 }
 recruit(v:BuildingView,i=0){const k=v.site.kind==='melee'?'goblin':v.site.kind==='ranged'?'archer':'elite';const u=this.makeUnit('friend',k,v.site.x+(i%3-1)*9,v.site.y+16+Math.floor(i/3)*10,v.site.id);if(this.battle)this.fx('cast',u.x,u.y,25);}
 store(){if(this.qaMode)return;if(!persist(this.save)&&!this.saveWarning){this.saveWarning=true;this.ui?.toast('无法保存，请检查浏览器存储');}}
 minY(){return Math.min(...sites.filter(s=>unlocked(this.save,s)&&s.kind==='wall').map(s=>s.y))-180;}
 startWave(){
  if(this.battle||this.settling||this.ui.modal)return;
  this.continued=false;this.battle=true;this.elapsed=0;this.spawnTimer=2.4;this.batchIndex=0;this.spawned=0;this.spawnLeft=wavePlan(this.save.wave).batches.reduce((a,b)=>a+b,0);this.waveSeed=this.save.wave;this.incomeTimer=0;this.target=undefined;
  this.ui.toast('北方敌军正在集结');this.music.play('start');this.store();
 }
 spawnSquad(){
  const plan=wavePlan(this.save.wave),count=plan.batches[this.batchIndex];if(!count)return;
  const cameraTop=this.cameras.main.scrollY,positions=formation(count,cameraTop,this.minY());this.lastSpawn={cameraTop,positions};
  for(let i=0;i<count;i++){
   const boss=this.save.wave%10===0&&this.batchIndex===plan.batches.length-1&&i===count-1;
   const kind=enemyKind(this.save.wave,this.spawned,boss),p=positions[i];
   this.makeUnit('enemy',kind,p.x,p.y).cool=.7;this.spawned++;this.spawnLeft--;
  }
  this.batchIndex++;
 }

 update(_time:number,delta:number){
  if(!this.ui)return;const dt=Math.min(delta/1000,.05)*this.qaSpeed;const castle=this.views[0];const boss=this.units.find(u=>u.side==='enemy'&&u.boss&&u.hp>0);
  this.ui.update(castle.hp,castle.max,this.battle,boss?{hp:boss.hp,max:boss.max,name:boss.kind==='wizard'?'红袍法师':boss.kind==='paladin'?'圣盾统领':'骑士长'}:undefined);
  this.music.configure(this.save.sound&&this.ui.mode!=='exited'&&!this.ui.modal?.classList.contains('ad-pending'),this.battle,this.paused);if(this.paused||this.hidden){this.anims.pauseAll();this.drawBars();return;}this.anims.resumeAll();
  this.clock+=dt;const beforeX=this.hero.x,beforeY=this.hero.y;this.moveHero(dt);this.ui.updateGuide(Math.hypot(this.hero.x-beforeX,this.hero.y-beforeY)>.05,dt,this.battle);
  const targetScroll=Phaser.Math.Clamp(this.hero.y-this.scale.height*.5,0,sites[0].y+90-this.scale.height);this.cameras.main.scrollY=Phaser.Math.Linear(this.cameras.main.scrollY,targetScroll,Math.min(1,dt*8));
  let near:BuildingView|undefined;let distance=66;
  if(!this.battle)for(const v of this.views){const d=Phaser.Math.Distance.Between(this.hero.x,this.hero.y,v.site.x,v.site.y);if(unlocked(this.save,v.site)&&d<distance){distance=d;near=v;}}
  this.ui.near(near?.site.id);this.highlight.clear();if(near){this.highlight.lineStyle(1,0xf4db7c,.9);this.highlight.strokeEllipse(near.site.x,near.site.y,near.site.kind==='castle'?100:55,16).setDepth(near.site.y-2);}
  if(this.battle){
   this.elapsed+=dt;this.spawnTimer-=dt;if(this.spawnLeft>0&&this.spawnTimer<=0){this.spawnSquad();this.spawnTimer=wavePlan(this.save.wave).gap;}
   for(const v of this.views){const b=this.save.buildings[v.site.id];if(!b.level)continue;const st=stats(this.save,v.site.id);if(v.hp>0)v.hp=Math.min(v.max,v.hp+st.regen*dt);v.sprite.setAlpha(v.hp<=0?.2:1);v.cool-=dt;
    if(['melee','ranged','elite'].includes(v.site.kind)){const alive=this.units.filter(u=>u.home===v.site.id&&u.hp>0).length;const q=queueStep(v.queue,alive,capacity(b,v.site.kind),dt,v.hp<=0,st.respawn);v.queue=q.remaining;if(q.spawn)this.recruit(v,alive);v.status.setText(v.hp<=0?'破损':alive<capacity(b,v.site.kind)?`补员 ${Math.ceil(q.remaining)}s`:'');}
    if(v.site.kind==='tower'&&v.hp>0&&v.cool<=0){const enemy=this.nearestEnemy(v.site.x,v.site.y,st.range);if(enemy){this.arrow(v.site.x,v.site.y-20,enemy.x,enemy.y-9);this.damage(enemy,st.attack);if(st.slow)enemy.slowed=2;if(st.splash)this.splash(enemy,st.attack*.35);v.cool=st.interval;}}
   }
   for(const unit of [...this.units]){if(unit.hp<=0)continue;unit.cool-=dt;unit.slowed=Math.max(0,unit.slowed-dt);unit.hp=Math.min(unit.max,unit.hp+unit.regen*dt);if(unit.side==='friend')this.friendAI(unit,dt);else this.enemyAI(unit,dt);}
   if(this.hero.hp<=0){this.heroRevive-=dt;if(this.heroRevive<=0){this.hero.hp=this.hero.max;this.hero.x=120;this.hero.y=sites[0].y-35;this.hero.sprite.setAlpha(1);this.fx('cast',this.hero.x,this.hero.y,40);this.ui.toast('魔王归来');}}
   this.units=this.units.filter(u=>{if(u.hp<=0&&u!==this.hero){u.sprite.destroy();return false;}return true;});
   for(let i=0;i<this.units.length;i++)for(let j=i+1;j<this.units.length;j++){const a=this.units[i],b=this.units[j];if(a.side!==b.side||a===this.hero||b===this.hero)continue;let dx=a.x-b.x,dy=a.y-b.y;const d=Math.hypot(dx,dy);if(d<10&&d>.01){const push=Math.min(.4,(10-d)*dt*3);dx=dx/d*push;dy=dy/d*push;a.x+=dx;a.y+=dy;b.x-=dx;b.y-=dy;}}
   if(castle.hp<=0)this.endWave(false);else if(!this.spawnLeft&&!this.units.some(u=>u.side==='enemy'&&u.hp>0))this.endWave(true);
  }else{for(const u of this.units)if(u.hp>0)u.hp=Math.min(u.max,u.hp+u.regen*dt);this.units.filter(u=>u!==this.hero).forEach((u,i)=>{const site=sites.find(s=>s.id===u.home)!;this.walk(u,site.x+(i%3-1)*10,site.y+19+Math.floor(i%7/3)*9,dt,4);});}
  for(const u of this.units){u.sprite.setPosition(Math.round(u.x),Math.round(u.y)).setDepth(u.y+10);this.animateUnit(u);}
  this.drawBars();
 }
 moveHero(dt:number){
  if(this.hero.hp<=0)return;let x=this.moveX,y=this.moveY;const k=this.keys;
  if(k.A.isDown||k.LEFT.isDown)x=-1;if(k.D.isDown||k.RIGHT.isDown)x=1;if(k.W.isDown||k.UP.isDown)y=-1;if(k.S.isDown||k.DOWN.isDown)y=1;
  if(this.target){const dx=this.target.x-this.hero.x,dy=this.target.y-this.hero.y;const d=Math.hypot(dx,dy);if(d<65){const id=this.target.id;this.target=undefined;this.ui.upgradeMenu(id);return;}x=dx/d;y=dy/d;}
  const norm=Math.max(1,Math.hypot(x,y));this.hero.x=Phaser.Math.Clamp(this.hero.x+x/norm*this.hero.speed*dt,20,220);this.hero.y=Phaser.Math.Clamp(this.hero.y+y/norm*this.hero.speed*dt,this.minY()+25,sites[0].y+45);
  if(Math.abs(x)>.01)this.hero.sprite.setFlipX(x<0);
 }
 frontY(){const alive=this.views.filter(v=>v.site.kind==='wall'&&v.hp>0&&this.save.buildings[v.site.id].level);return alive.length?Math.min(...alive.map(v=>v.site.y)):Math.min(...this.views.filter(v=>['melee','ranged','elite'].includes(v.site.kind)&&this.save.buildings[v.site.id].level&&v.hp>0).map(v=>v.site.y-50),sites[0].y-100);}
 friendAI(u:Unit,dt:number){
  const enemy=this.nearestEnemy(u.x,u.y,u.kind==='lord'?u.range:120);
  if(enemy){const d=Math.hypot(enemy.x-u.x,enemy.y-u.y);if(d<=u.range){if(u.cool<=0){this.attack(u,enemy);u.cool=u.interval;}}else if(u!==this.hero)this.walk(u,enemy.x,enemy.y,dt,u.range-1);}
  else if(u!==this.hero){const ranged=u.kind==='archer';this.walk(u,70+(u.id%7)*16,this.frontY()+(ranged?40:19),dt,6);}
 }
 enemyAI(u:Unit,dt:number){
  const target=nearestPoint(u.x,u.y,this.views.filter(v=>this.save.buildings[v.site.id].level&&v.hp>0).map(view=>({x:view.site.x,y:view.site.y,view})))?.view;
  if(!target)return;
  const d=Math.hypot(target.site.x-u.x,target.site.y-u.y),reach=target.site.kind==='wall'?u.range+10:u.range+16;
  if(d<=reach){if(u.cool<=0){target.hp-=u.attack*(1-stats(this.save,target.site.id).armor);this.fx('hit',target.site.x,target.site.y-10,22);this.unitAttack(u);u.cool=u.interval;}return;}
  // Defend against a unit already in contact, but never pursue units away from the nearest building.
  const blocker=this.units.find(f=>f.side==='friend'&&f.hp>0&&Math.hypot(f.x-u.x,f.y-u.y)<=Math.min(22,u.range));
  if(blocker){if(u.cool<=0){this.attack(u,blocker);u.cool=u.interval;}return;}
  this.walk(u,target.site.x,target.site.y,dt,reach-2);
 }

 walk(u:Unit,x:number,y:number,dt:number,stop:number){const dx=x-u.x,dy=y-u.y,d=Math.hypot(dx,dy);if(d>stop){const speed=u.speed*(u.slowed?.75:1);u.x+=dx/d*Math.min(speed*dt,d-stop);u.y+=dy/d*Math.min(speed*dt,d-stop);u.sprite.setFlipX(dx<0);}}
 nearestEnemy(x:number,y:number,range:number){let found:Unit|undefined;let best=range;for(const u of this.units){if(u.side!=='enemy'||u.hp<=0)continue;const d=Math.hypot(u.x-x,u.y-y);if(d<best){best=d;found=u;}}return found;}
 attack(u:Unit,target:Unit){this.unitAttack(u);if(u.range>50)this.arrow(u.x,u.y-10,target.x,target.y-10,u.side==='friend'?0xe8cc87:0xc7e4ee);else this.fx(u.kind==='lord'?'magic':'hit',target.x,target.y-9,u.kind==='lord'?32:20);this.damage(target,u.attack);if(u.slow)target.slowed=2;if(u.splash)this.splash(target,u.attack*.35);}
 splash(target:Unit,damage:number){const other=this.units.find(u=>u.side===target.side&&u!==target&&u.hp>0&&Math.hypot(u.x-target.x,u.y-target.y)<28);if(other)this.damage(other,damage);}
 damage(u:Unit,damage:number){u.hp-=damage*(1-u.armor);u.sprite.setTintFill(0xffe9b1);this.time.delayedCall(70,()=>{if(u.sprite.active)u.sprite.clearTint();});if(u.hp<=0){if(u===this.hero){u.sprite.setAlpha(.3);this.heroRevive=9;this.ui.toast('魔王将在城堡复活');}else if(u.side==='enemy'){const reward=killReward(!!u.boss);this.save.gold+=reward;this.floatText(u.x,u.y,`+${reward}`);}}}
 arrow(x:number,y:number,tx:number,ty:number,color=0xf2df9d){const arrow=this.add.rectangle(x,y,6,1,color).setDepth(3900).setRotation(Math.atan2(ty-y,tx-x));this.tweens.add({targets:arrow,x:tx,y:ty,duration:150,onComplete:()=>arrow.destroy()});}
 fx(key:string,x:number,y:number,size:number){const sp=this.add.sprite(x,y,key).setDisplaySize(size,size).setDepth(3901);sp.play(key);sp.once(Phaser.Animations.Events.ANIMATION_COMPLETE,()=>sp.destroy());}
 floatText(x:number,y:number,text:string){const t=this.add.text(x,y-15,text,{fontFamily:'Ark Pixel',fontSize:'12px',color:'#ffe397',stroke:'#385a35',strokeThickness:2}).setDepth(4100);this.tweens.add({targets:t,y:y-33,alpha:0,duration:800,onComplete:()=>t.destroy()});}
 drawBars(){const g=this.hp;g.clear();for(const v of this.views){if(!this.save.buildings[v.site.id].level||!unlocked(this.save,v.site))continue;const w=v.site.kind==='castle'?56:24,x=v.site.x-w/2,y=v.site.y-v.sprite.displayHeight*.9-5;g.fillStyle(0x14251e);g.fillRect(x-1,y-1,w+2,4);g.fillStyle(v.hp>v.max*.3?0x6ee447:0xe68b53);g.fillRect(x,y,w*Math.max(0,v.hp/v.max),2);}
  for(const u of this.units){if(u.hp<=0)continue;if(!this.battle&&u!==this.hero)continue;const x=u.x-8,y=u.y-u.sprite.displayHeight*(visibleUnitHeight[u.anim]||.85)-4;g.fillStyle(0x132c22);g.fillRect(x-1,y-1,18,4);g.fillStyle(u.side==='friend'?0x69e447:0xe18b6e);g.fillRect(x,y,16*Math.max(0,u.hp/u.max),2);}
  if(this.hero.hp<=0){g.fillStyle(0x243b2b,.8);g.fillRect(this.hero.x-15,this.hero.y-25,30,8);}
 }
 endWave(win:boolean){if(this.settling)return;this.battle=false;this.settling=true;const reward=win?waveReward(this.save.wave):0;let prod=0;const transaction=`wave-${this.save.wave}-${this.save.wins}-${Date.now()}`;
  if(win){this.save.wins++;prod=production(this.save,this.save.wins%3===0);this.save.gold+=reward+prod;this.save.wave++;this.save.failures=0;this.music.play('win');}else {this.save.failures++;this.music.play('lose');}
  this.store();this.ui.result(win,reward,prod,()=>{claim(this.save,transaction,reward);this.store()});
 }
 finishWave(){this.settling=false;this.battle=false;this.paused=false;this.refresh();this.store();this.ui.toast('建筑与军队已恢复');}
 continueWave(){if(!this.settling||this.continued)return;this.settling=false;this.continued=true;this.battle=true;this.paused=false;this.views.forEach(v=>{if(v.site.kind==='castle')v.hp=v.max*.5;});this.hero.hp=this.hero.max;this.hero.sprite.setAlpha(1);for(const v of this.views.filter(v=>['melee','ranged','elite'].includes(v.site.kind)&&this.save.buildings[v.site.id].level)){v.hp=Math.max(v.hp,v.max*.5);const alive=this.units.filter(u=>u.home===v.site.id&&u.hp>0).length;for(let i=alive;i<capacity(this.save.buildings[v.site.id],v.site.kind);i++)this.recruit(v,i);}this.store();}
 fitLevelBuilding(sprite:Sprite,kind:string){const width=kind==='castle'?98:kind==='wall'?90:kind==='tower'?38:kind==='elite'?60:61;sprite.setDisplaySize(width,width*sprite.frame.realHeight/sprite.frame.realWidth);}
 unitAttack(u:Unit){u.attackUntil=this.clock+.34;u.sprite.play(`${u.anim}-attack`,true);this.music.play(u.range>50?'shoot':'hit');}
 animateUnit(u:Unit){if(u.hp<=0){u.sprite.stop();return;}const moving=Math.hypot(u.x-u.lastX,u.y-u.lastY)>.02;u.lastX=u.x;u.lastY=u.y;if(this.clock<u.attackUntil)return;if(moving)u.sprite.play(`${u.anim}-walk`,true);else {u.sprite.stop();u.sprite.setFrame(`${u.anim}-0`);}}
 adVictory(){if(!this.settling)return;this.settling=false;this.ui.close();this.endWave(true);}
}
