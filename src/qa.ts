import type {Kingdom} from './game.ts';
import {RewardAds} from './ads.ts';
import {initialSave,sites,stats,upgrade} from './model.ts';
/** Development-only controls. Loaded only on the isolated ?qa=1 route. Never included in a release. */
export function installQA(scene:Kingdom){
 const bar=document.createElement('aside');bar.id='qa-panel';bar.style.cssText='position:fixed;right:0;top:0;z-index:80;background:#102d28ed;padding:4px;font:11px monospace;max-width:145px;max-height:65vh;overflow:auto';
 const status=document.createElement('output');status.id='qa-status';status.style.display='block';bar.append(status);
 const add=(label:string,fn:()=>void)=>{const b=document.createElement('button');b.textContent=label;b.style.cssText='display:block;background:#435637;margin:3px;padding:6px;min-height:30px';b.onclick=fn;bar.append(b);};
 const campaign=document.createElement('output');campaign.id='qa-campaign';bar.append(campaign);let campaignTimer:ReturnType<typeof setInterval>|undefined;
 add('测试：无广告十波',()=>{
  if(campaignTimer)clearInterval(campaignTimer);scene.ui.close();scene.save=initialSave();scene.save.tutorial=true;scene.save.guideStep=5;scene.ui.save=scene.save;scene.ui.mode='playing';scene.ui.root.classList.remove('menu-active');for(const id of ['mine-0','tower-3-1','wall-3-0'])upgrade(scene.save,id,'health');scene.finishWave();scene.hero.x=95;scene.hero.y=990;scene.qaSpeed=8;
  const history:unknown[]=[];let wave=1,gold=scene.save.gold;scene.startWave();campaign.textContent='无广告测试运行中';
  const buys:Record<number,[string,Parameters<typeof upgrade>[2]][]>={2:[['lord','attack']],3:[['tower-3-2','health']],4:[['tower-3-0','health']],5:[['melee-0','attack']],6:[['wall-3-1','health']],7:[['lord','attack']],8:[['tower-3-3','health'],['tower-3-1','attack']],9:[['tower-3-2','attack']],10:[['tower-3-0','attack']]};
  campaignTimer=setInterval(()=>{if(!scene.settling)return;const won=scene.save.wave>wave;history.push({wave,won,goldBefore:gold,goldAfter:scene.save.gold,castle:Math.round(scene.views[0].hp/scene.views[0].max*100),broken:scene.views.filter(v=>scene.save.buildings[v.site.id].level&&v.hp<=0).length,seconds:+scene.elapsed.toFixed(1),lord:scene.save.lord,melee:scene.save.buildings['melee-0'].level});campaign.textContent=JSON.stringify(history);
   if(!won||wave>=10){clearInterval(campaignTimer);campaignTimer=undefined;scene.qaSpeed=1;return;}scene.ui.close();scene.finishWave();wave=scene.save.wave;for(const [id,buff] of buys[wave]||[])upgrade(scene.save,id,buff);scene.refresh();scene.hero.x=95;scene.hero.y=990;gold=scene.save.gold;scene.startWave();
  },300);
 });
 add('测试：新开局',()=>{scene.ui.close();scene.save=initialSave();scene.ui.save=scene.save;scene.hero.x=120;scene.hero.y=1070;scene.finishWave();scene.ui.mode='playing';scene.ui.root.classList.remove('menu-active');scene.ui.welcome()});
 add('测试：基础防线',()=>{scene.ui.close();scene.save=initialSave();scene.save.tutorial=true;scene.save.guideStep=5;scene.ui.save=scene.save;for(const id of ['mine-0','tower-3-1','wall-3-0'])upgrade(scene.save,id,'health');scene.hero.x=120;scene.hero.y=990;scene.finishWave()});
 add('测试：生产收益',()=>{scene.ui.close();scene.save=initialSave();scene.save.tutorial=true;scene.save.guideStep=5;scene.save.wins=1;scene.save.gold=10000;scene.ui.save=scene.save;for(const id of ['mine-0','farm-0'])upgrade(scene.save,id,'health');scene.hero.x=120;scene.hero.y=1100;scene.finishWave()});
 add('测试：金矿收益',()=>scene.ui.upgradeMenu('mine-0'));
 add('测试：蘑菇收益',()=>scene.ui.upgradeMenu('farm-0'));
 add('测试：第五波',()=>{scene.ui.close();scene.finishWave();scene.save.wave=5;scene.startWave()});
 add('测试：城堡升级',()=>{scene.ui.close();scene.finishWave();scene.ui.upgradeMenu('castle')});
 add('测试：满级领地',()=>{scene.ui.close();scene.finishWave();const s=initialSave();s.gold=100000;s.tutorial=true;s.lord=21;s.lordBuffs=Array.from({length:20},(_,i)=>i%3===0?'health':'attack');for(const site of sites){s.buildings[site.id]={level:5,buffs:Array(4).fill(site.kind==='melee'||site.kind==='ranged'?'count':site.kind==='mine'||site.kind==='farm'?'income':'attack')};}Object.assign(scene.save,s);scene.refresh();scene.hero.x=120;scene.hero.y=410;});
 add('测试：六级建筑',()=>{scene.ui.close();scene.finishWave();const s=initialSave();s.gold=10000;s.tutorial=true;s.guideStep=5;s.buildings['tower-3-1']={level:5,buffs:['attack','health','haste','range']};scene.save=s;scene.ui.save=s;scene.refresh();scene.hero.x=78;scene.hero.y=1000;scene.ui.upgradeMenu('tower-3-1')});
 add('测试：Boss 波',()=>{scene.ui.close();scene.finishWave();scene.save.wave=10;scene.hero.y=scene.frontY()-35;scene.startWave();});
 add('测试：失守',()=>{scene.ui.close();if(!scene.battle)scene.startWave();scene.views[0].hp=0;});
 add('测试：士兵阵亡',()=>{const u=scene.units.find(u=>u.home==='melee-0');if(u)u.hp=0;});
 add('测试：八倍速度',()=>{scene.qaSpeed=scene.qaSpeed===1?8:1;});
 add('测试：兵营升级',()=>{scene.ui.close();scene.finishWave();scene.save.gold=0;scene.ui.upgradeMenu('melee-0')});
 add('测试：模拟完播',()=>{scene.ui.ads=new RewardAds({available:()=>true,show:async()=>'completed'});scene.ui.toast('仅测试：模拟广告回调')});
 add('测试：主菜单',()=>scene.ui.mainMenu());
 add('测试：关闭面板',()=>bar.remove());
 add('测试：暂停时间',()=>{scene.paused=!scene.paused});
 const timer=setInterval(()=>{status.textContent=JSON.stringify({wave:scene.save.wave,guide:scene.save.guideStep,heroPosition:[Math.round(scene.hero.x),Math.round(scene.hero.y)],move:[scene.moveX,scene.moveY],heroFacing:scene.hero.sprite.flipX?'left':'right',batch:scene.batchIndex,lastSpawn:scene.lastSpawn,built:scene.views.filter(v=>scene.save.buildings[v.site.id].level).length,broken:scene.views.filter(v=>scene.save.buildings[v.site.id].level&&v.hp<=0).length,battle:scene.battle,paused:scene.paused,seconds:+scene.elapsed.toFixed(1),friends:scene.units.filter(u=>u.side==='friend'&&u.hp>0).length,enemy:scene.units.filter(u=>u.side==='enemy'&&u.hp>0).length,queue:+scene.views.find(v=>v.site.id==='melee-0')!.queue.toFixed(1),remaining:scene.spawnLeft,castle:+scene.views[0].hp.toFixed(0),castleMax:scene.views[0].max,hero:+scene.hero.hp.toFixed(0),boss:scene.units.some(u=>u.boss&&u.hp>0),fps:Math.round(scene.game.loop.actualFps),power:stats(scene.save,'lord').attack,gold:scene.save.gold,lord:scene.save.lord,meleeLevel:scene.save.buildings['melee-0'].level,audio:scene.music.status(),animation:scene.hero.sprite.anims.currentAnim?.key,frames:[...new Set(scene.units.map(u=>u.sprite.frame.name))].slice(0,12)});},300);
 document.body.append(bar);scene.events.once('shutdown',()=>{clearInterval(timer);if(campaignTimer)clearInterval(campaignTimer);bar.remove()});
}
