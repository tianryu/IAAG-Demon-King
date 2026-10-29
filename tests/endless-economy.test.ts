import test from 'node:test';
import assert from 'node:assert/strict';
import {initialSave,upgrade,sites,cost,capacity,choices,getOffer,parseSave,productionIncome,waveReward,killReward,goldAdReward} from '../src/model.ts';

test('all forty sites upgrade past five without erasing prior choices, while recruitment stays bounded',()=>{
 const s=initialSave();for(let i=0;i<5;i++)upgrade(s,'castle','health',true);
 for(const site of sites){const before=[...s.buildings[site.id].buffs];for(let i=0;i<20;i++)assert.ok(upgrade(s,site.id,'health',true));const b=s.buildings[site.id];assert.ok(b.level>5);assert.deepEqual(b.buffs.slice(0,before.length),before);assert.equal(b.buffs.length,b.level-1);assert.ok(Number.isFinite(cost(s,site.id)));if(site.kind==='melee'||site.kind==='ranged'){assert.equal(capacity(b,site.kind),12);assert.ok(choices(s,site.id).every(o=>o.buff!=='count'));}getOffer(s,site.id);}
 assert.deepEqual(parseSave(JSON.stringify(s)),s);
});

test('late-game prices remain finite and continue increasing',()=>{const s=initialSave();let previous=0;for(const level of [1,5,6,20,100,1000]){s.buildings['tower-3-0'].level=level;const price=cost(s,'tower-3-0');assert.ok(Number.isFinite(price)&&price>previous);previous=price;}s.lord=1000;assert.ok(Number.isFinite(cost(s,'lord')));});

test('early income leaves a construction choice instead of funding several upgrades each wave',()=>{const s=initialSave();for(const id of ['mine-0','tower-3-1','wall-3-0'])upgrade(s,id,'health');assert.equal(s.gold,70);const firstWin=waveReward(1)+8*killReward(false)+productionIncome(s,'mine-0');assert.equal(firstWin,54);s.gold+=firstWin;assert.ok(s.gold<cost(s,'melee-0'));assert.ok(s.gold>=cost(s,'lord'));assert.equal(goldAdReward(s),80);assert.ok(s.gold+goldAdReward(s)>=cost(s,'melee-0'));});

test('saturated armor is removed from offers without invalidating saves',()=>{const s=initialSave();for(let i=0;i<5;i++)upgrade(s,'castle','armor',true);const offer=getOffer(s,'castle');assert.ok(offer.buffs.length>=2);assert.ok(!offer.buffs.includes('armor'));assert.deepEqual(parseSave(JSON.stringify(s)),s);});
