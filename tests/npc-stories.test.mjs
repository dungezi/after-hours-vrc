import test from 'node:test';
import assert from 'node:assert/strict';
import { PEOPLE } from '../dist/data.js';
import { GROUPS, groupCast } from '../dist/stories.js';
import { romanceKey, preludeKey } from '../dist/courtship-stories.js';
import { NPC_ROUTES } from '../dist/npc-stories.js';
import { VERSION, startRun, freshLegacy, choose, perform, currentEvent, validateSave, isIntroduced, npcPartners, actionReason } from '../dist/engine.js';

function fresh(seed=999) {const r=startRun({seed});while(r.pending)choose(r,0);return r;}
function know(r,...ids) {for(const id of ids)Object.assign(r.relationships[id],{met:true,introduced:true});}
function ready(r,id) {know(r,id);for(const i of [0,1])r.storyFlags[romanceKey(id,i)]=1;Object.assign(r.relationships[id],{trust:70,affection:70,stage:2,meetings:5,communicated:true,lastDay:r.day});}
const payload=r=>({version:VERSION,run:r,legacy:freshLegacy()});
function pairReady(route=NPC_ROUTES[1],seed=999) {
  const r=fresh(seed);r.day=route.day;know(r,...route.cast);r.storySeen.push(route.after);r.npcLinks[[...route.cast].sort().join(':')]=8;for(const i of [0,1])r.storyFlags[preludeKey(...route.cast,i)]=Math.max(1,route.day-4+i*2);
  return r;
}
function beginPair(r) {perform(r,'work');assert.equal(r.pending.id,'npc-confession');choose(r,0);return r.npcBonds[[r.notice.npc,r.notice.other].sort().join(':')];}
function advance(r,day) {while(r.day<day){assert.equal(r.pending,null);perform(r,'next');}}

test('being met does not count as reading an introduction, including supporting group characters',()=>{
  const r=startRun({seed:42});assert.equal(r.relationships.raina.met,true);assert.equal(isIntroduced(r,'raina'),false);
  choose(r,0);assert.equal(isIntroduced(r,'raina'),true);assert.equal(isIntroduced(r,'ash'),false);
  choose(r,0);assert.equal(isIntroduced(r,'ash'),true);
  assert.ok(groupCast(GROUPS.find(g=>g.id==='group-build')).includes('ash'));
  assert.ok(groupCast(GROUPS.find(g=>g.id==='group-return')).includes('raina'));
});

test('unread introductions suppress related group selection despite met contacts',()=>{
  const r=fresh();r.day=6;r.storySeen.push('group-welcome');know(r,'yuki');r.relationships.rei.met=true;
  perform(r,'explore','rain');assert.notEqual(r.pending.id,'group-build');
  r.pending={type:'scene',id:'group-build',npc:'rei',other:'yuki'};
  assert.throws(()=>choose(r,0),/初次相遇/);assert.equal(r.storySeen.includes('group-build'),false);
});

test('old premature groups resume only after their queued introductions are read',()=>{
  const r=fresh();r.day=6;know(r,'rei','yuki');r.pending={type:'scene',id:'introduction',npc:'yuki'};choose(r,0);r.pending={type:'scene',id:'group-build',npc:'rei',other:'yuki'};
  r.queue=[{type:'scene',id:'introduction',npc:'rei'}];
  for(const rel of Object.values(r.relationships))delete rel.introduced;delete r.npcBonds;
  const copy=validateSave({version:2,run:r,legacy:freshLegacy()}).run;
  assert.equal(copy.pending.id,'introduction');assert.equal(copy.pending.npc,'rei');assert.ok(copy.queue.some(q=>q.id==='group-build'));
  assert.equal(isIntroduced(copy,'rei'),false);choose(copy,0);assert.equal(copy.pending.id,'group-build');choose(copy,0);
  assert.equal(copy.storySeen.includes('group-build'),true);assert.doesNotThrow(()=>validateSave(payload(copy)));
});

test('groups involving unmet characters remain deferred rather than granting invisible acquaintance',()=>{
  const r=fresh();r.day=4;r.pending={type:'scene',id:'group-photo',npc:'mika',other:'lin'};
  const copy=validateSave(payload(r)).run;assert.equal(copy.pending,null);assert.equal(copy.queue[0].id,'group-photo');
  perform(copy,'work');assert.equal(copy.pending,null);assert.equal(copy.relationships.mika.met,false);assert.equal(copy.queue.length,1);
  know(copy,'mika','lin');perform(copy,'work');assert.equal(copy.pending.id,'group-photo');
});

test('all five NPC routes can confirm independent sugar relationships without changing player relations',()=>{
  for(const route of NPC_ROUTES) {
    const r=pairReady(route),before=structuredClone(r.relationships),ap=r.ap;const bond=beginPair(r);
    assert.equal(bond.status,'sugar');assert.equal(bond.sinceDay,route.day);assert.equal(r.notice.answer,'npc-sugar');assert.equal(r.ap,ap-1);
    assert.deepEqual(r.relationships,before);assert.equal(npcPartners(r,route.cast[0])[0],route.cast[1]);
    assert.doesNotThrow(()=>validateSave(payload(r)));
  }
});

test('NPC romance waits for both introductions and its shared narrative foundation',()=>{
  const r=pairReady();r.relationships.yuki.introduced=false;perform(r,'work');assert.equal(r.pending,null);assert.deepEqual(r.npcBonds,{});
  r.relationships.yuki.introduced=true;r.storySeen=[];perform(r,'work');assert.equal(r.pending,null);
  r.storySeen.push('group-build');perform(r,'work');assert.equal(r.pending.id,'npc-confession');
});

test('stable NPC pairs have a follow-up conversation and continue their relationship',()=>{
  const r=pairReady(),bond=beginPair(r);assert.equal(bond.outlook,'steady');advance(r,12);assert.equal(r.pending.id,'npc-date');
  const trust=bond.trust;choose(r,0);assert.equal(bond.trust,trust+8);assert.equal(bond.stage,2);
  advance(r,20);assert.equal(bond.status,'sugar');assert.equal(r.pending,null);assert.doesNotThrow(()=>validateSave(payload(r)));
});

test('NPCs can initiate a separation after pressure and every offered response respects it',()=>{
  for(const response of [0,1]) {
    const r=pairReady(),bond=beginPair(r);advance(r,12);choose(r,2);assert.equal(r.pending.id,'separation-prelude');
    assert.equal(bond.status,'sugar');choose(r,1);advance(r,13);assert.equal(r.pending.index,1);choose(r,1);
    advance(r,14);assert.equal(r.pending.id,'separation-proposal');assert.equal(bond.status,'sugar');choose(r,response);
    assert.equal(bond.status,'salt');assert.equal(bond.initiator,'rei');assert.equal(r.notice.answer,'npc-ended');
    assert.equal(r.relationships.rei.status,'friend');assert.doesNotThrow(()=>validateSave(payload(r)));
  }
});

test('NPC life changes can lead to their own farewell even after a considerate conversation',()=>{
  const r=pairReady(NPC_ROUTES[1],42),bond=beginPair(r);assert.equal(bond.outlook,'change');
  advance(r,12);choose(r,0);assert.ok(bond.tension<35);assert.ok(bond.trust>30);
  advance(r,16);assert.equal(r.pending.id,'separation-prelude');assert.match(currentEvent(r).text,/生活安排变了/);choose(r,1);
  advance(r,17);choose(r,1);advance(r,18);choose(r,0);assert.equal(bond.status,'sugar');assert.equal(r.notice.answer,'reconsider');
  advance(r,19);assert.equal(r.pending.id,'separation-review');choose(r,0);assert.equal(bond.status,'salt');
});

test('NPC romance respects an existing exclusive relationship with the player',()=>{
  const r=pairReady(NPC_ROUTES[2]);ready(r,'raina');r.relationships.raina.status='sugar';
  perform(r,'work');choose(r,0);assert.equal(r.npcBonds['mika:raina'].status,'friend');assert.equal(r.npcBonds['mika:raina'].stage,3);
  assert.equal(r.relationships.raina.status,'sugar');assert.match(r.logs[0].text,/排他约定/);
});

test('NPCs discuss shared open-relationship boundaries before committing and respect a refusal',()=>{
  for(const accept of [true,false]) {
    const r=pairReady();ready(r,'rei');r.relationships.rei.status='sugar';
    perform(r,'work');choose(r,0);assert.equal(r.pending.id,'npc-boundaries');assert.equal(r.npcBonds['rei:yuki'].status,'friend');
    choose(r,accept?0:1);assert.equal(r.npcBonds['rei:yuki'].status,accept?'sugar':'friend');assert.equal(r.relationships.rei.agreement,accept);
    assert.equal(r.relationships.rei.status,'sugar');assert.doesNotThrow(()=>validateSave(payload(r)));
  }
});

test('an NPC in an exclusive NPC pair can explicitly refuse a new player confession',()=>{
  const r=pairReady(NPC_ROUTES[0]);beginPair(r);r.day=9;ready(r,'mika');
  perform(r,'confess','mika');assert.match(currentEvent(r).text,/已有的排他约定/);choose(r,0);assert.equal(r.pending.answer,'rejected');choose(r,0);
  assert.equal(r.relationships.mika.status,'friend');assert.equal(r.npcBonds['lin:mika'].status,'sugar');
});

test('a player joining an NPC open relationship must explicitly discuss the existing bond',()=>{
  const r=pairReady();beginPair(r);r.day=11;ready(r,'rei');
  perform(r,'confess','rei');choose(r,0);assert.equal(r.pending.answer,'waiting');choose(r,0);
  perform(r,'boundary','rei');choose(r,1);assert.equal(r.relationships.rei.agreement,true);assert.equal(r.pending.id,'reply');assert.equal(r.pending.answer,'accepted');choose(r,0);
  assert.equal(r.relationships.rei.status,'sugar');assert.equal(r.npcBonds['rei:yuki'].status,'sugar');assert.doesNotThrow(()=>validateSave(payload(r)));
});

test('player sugar ends through an NPC conversation and a persistent notice, never a silent stat change',()=>{
  for(const response of [0,1,2]) {
    const r=fresh();r.day=5;ready(r,'raina');Object.assign(r.relationships.raina,{status:'sugar',tension:80});
    perform(r,'next');assert.equal(r.pending.id,'separation-prelude');assert.equal(r.relationships.raina.status,'sugar');
    const restored=validateSave(payload(r)).run;choose(restored,response);assert.equal(restored.relationships.raina.status,'sugar');
    advance(restored,7);choose(restored,1);advance(restored,8);assert.equal(restored.pending.id,'separation-proposal');choose(restored,0);
    assert.equal(restored.relationships.raina.status,'salt');assert.equal(restored.relationships.raina.drifted,true);
    assert.equal(restored.notice.answer,'ended');assert.equal(validateSave(payload(restored)).run.notice.answer,'ended');
  }
});

test('an unfinished farewell on the final night is not forced past its cross-night preludes',()=>{
  const r=fresh();r.day=28;ready(r,'raina');Object.assign(r.relationships.raina,{status:'sugar',tension:80});
  perform(r,'next');assert.equal(r.ended,false);assert.equal(r.pending.id,'separation-prelude');choose(r,0);
  perform(r,'next');assert.equal(r.ended,true);assert.equal(r.ending.id,'fragile');assert.equal(r.relationships.raina.status,'sugar');
});

test('version two saves preserve known contacts and high stats without reapplying old balance migration',()=>{
  const r=fresh();r.stats.craft=90;r.relationships.rei.met=true;r.storySeen=[];r.logs=r.logs.filter(l=>l.kind!=='story');
  for(const rel of Object.values(r.relationships))delete rel.introduced;delete r.npcBonds;
  const restored=validateSave({version:2,run:r,legacy:freshLegacy()});assert.equal(restored.version,VERSION);assert.equal(restored.run.stats.craft,90);
  assert.equal(isIntroduced(restored.run,'rei'),true);assert.equal(restored.run.pending,null);assert.deepEqual(restored.run.npcBonds,{});
});

test('version two restores a lost introduction even when its popup was replaced and its queue is empty',()=>{
  const r=fresh();r.day=6;r.relationships.rei.met=true;r.pending={type:'scene',id:'group-build',npc:'rei',other:'yuki'};
  r.relationships.yuki.met=true;r.pending={type:'scene',id:'introduction',npc:'yuki'};choose(r,0);r.pending={type:'scene',id:'group-build',npc:'rei',other:'yuki'};
  for(const rel of Object.values(r.relationships))delete rel.introduced;delete r.npcBonds;
  const copy=validateSave({version:2,run:r,legacy:freshLegacy()}).run;
  assert.equal(copy.pending.id,'introduction');assert.equal(copy.pending.npc,'rei');assert.equal(isIntroduced(copy,'yuki'),true);
  choose(copy,0);assert.equal(copy.pending.id,'group-build');
});

test('a capped legacy journal does not cause all earlier acquaintances to be introduced again',()=>{
  const r=fresh();r.day=25;know(r,...PEOPLE.map(p=>p.id));r.logs=Array.from({length:180},()=>({day:24,title:'一次普通相处',text:'记录仍在。',kind:'action',changes:[]}));
  for(const rel of Object.values(r.relationships))delete rel.introduced;delete r.npcBonds;
  const copy=validateSave({version:2,run:r,legacy:freshLegacy()}).run;assert.equal(copy.pending,null);assert.ok(PEOPLE.every(p=>isIntroduced(copy,p.id)));
});

test('NPC bonds and queued scenes roundtrip; malformed or unknown relationships are rejected',()=>{
  const r=pairReady();beginPair(r);const saved=payload(r);assert.deepEqual(validateSave(saved).run.npcBonds,r.npcBonds);
  for(const change of [p=>p.run.npcBonds['rei:yuki'].trust=101,p=>p.run.npcBonds['rei:yuki'].sinceDay=28,p=>p.run.npcBonds['rei:yuki'].stage=4,p=>p.run.npcBonds['rei:yuki'].initiator='ash',p=>p.run.npcBonds['ash:raina']=p.run.npcBonds['rei:yuki'],p=>p.run.relationships.yuki.introduced=false,p=>p.run.notice.other='ash',p=>p.run.queue=[{type:'scene',id:'npc-confession',npc:'rei'}]]) {
    const bad=structuredClone(saved);change(bad);assert.throws(()=>validateSave(bad),/无效/);
  }
});

test('an NPC date without an existing bond cannot become an unrenderable imported popup',()=>{
  const r=pairReady();r.pending={type:'scene',id:'npc-date',npc:'rei',other:'yuki'};
  assert.throws(()=>validateSave(payload(r)),/无效/);
});

function networkReady() {
  const r=pairReady();beginPair(r);r.notice=null;r.day=14;know(r,'lin');
  Object.assign(r.npcBonds['rei:yuki'],{stage:2,outlook:'steady'});
  r.storySeen.push('group-backstage');r.npcLinks['lin:rei']=8;r.storyFlags[preludeKey('lin','rei',0)]=10;r.storyFlags[preludeKey('lin','rei',1)]=12;
  perform(r,'work');assert.equal(r.pending.id,'npc-confession');assert.equal(r.pending.other,'lin');
  choose(r,0);assert.equal(r.pending.id,'npc-network');return r;
}

test('NPC multiple sugars require existing partners to discuss boundaries and affect the player and old pair',()=>{
  const r=networkReady(),old=r.npcBonds['rei:yuki'],trust=old.trust,playerTrust=r.relationships.yuki.trust;
  assert.match(currentEvent(r).text,/弥生/);assert.equal(r.npcBonds['lin:rei'].status,'friend');
  choose(r,0);assert.equal(r.npcBonds['lin:rei'].status,'sugar');assert.equal(old.open,true);assert.equal(old.trust,trust+4);
  assert.equal(r.relationships.yuki.trust,playerTrust+2);assert.deepEqual(npcPartners(r,'rei').sort(),['lin','yuki']);
  assert.equal(r.notice.answer,'npc-sugar');assert.doesNotThrow(()=>validateSave(payload(r)));
});

test('advice to hide a new NPC relationship delays commitment and harms trust on every affected side',()=>{
  const r=networkReady(),old=r.npcBonds['rei:yuki'],trust=old.trust,playerTrust=r.relationships.yuki.trust;
  choose(r,2);assert.equal(r.npcBonds['lin:rei'].status,'friend');assert.equal(old.trust,trust-6);assert.equal(old.tension,18);
  assert.equal(r.relationships.yuki.trust,playerTrust-5);assert.equal(r.relationships.lin.trust,6);
  assert.ok(r.queue.some(q=>q.id==='npc-confession' && q.dueDay===16));assert.doesNotThrow(()=>validateSave(payload(r)));
});

test('NPC and player consent are separate steps when a new bond overlaps both networks',()=>{
  const r=networkReady();ready(r,'lin');r.relationships.lin.status='sugar';choose(r,0);
  assert.equal(r.pending.id,'npc-boundaries');assert.equal(r.npcBonds['lin:rei'].status,'friend');
  choose(r,0);assert.equal(r.relationships.lin.agreement,true);assert.equal(r.npcBonds['lin:rei'].status,'sugar');
  assert.equal(r.relationships.lin.status,'sugar');assert.equal(r.npcBonds['lin:rei'].open,true);assert.doesNotThrow(()=>validateSave(payload(r)));
});

test('multiple NPC sugars receive scheduling stories and pressure can lead to an NPC farewell',()=>{
  const r=networkReady();choose(r,0);r.notice=null;advance(r,16);assert.equal(r.pending.id,'npc-calendar');
  const a=r.npcBonds['rei:yuki'],b=r.npcBonds['lin:rei'];a.tension=24;b.tension=24;
  choose(r,1);assert.equal(a.tension,38);assert.equal(b.tension,38);assert.equal(r.pending.id,'separation-prelude');
  choose(r,0);assert.equal(a.status,'sugar');assert.equal(b.status,'sugar');
  assert.equal(r.pending.id,'separation-prelude');assert.equal(Object.keys(r.departures).length,2);assert.equal(Object.values(r.departures).filter(d=>d.preludes.length===1).length,1);assert.doesNotThrow(()=>validateSave(payload(r)));
});

test('together requires two introduced online friends and costs one action with energy and balance',()=>{
  const r=fresh();r.day=14;know(r,'rei','lin');r.relationships.lin.introduced=false;
  assert.match(actionReason(r,'together','rei:lin'),/初次相遇/);r.relationships.lin.introduced=true;
  assert.equal(actionReason(r,'together','rei:rei'),'请选择两位不同的朋友');
  const energy=r.stats.energy,balance=r.stats.balance,ap=r.ap,trust=r.relationships.lin.trust;
  perform(r,'together','rei:lin');assert.equal(r.ap,ap-1);assert.equal(r.stats.energy,energy-15);assert.equal(r.stats.balance,balance-6);
  assert.equal(r.relationships.lin.trust,trust+2);assert.equal(r.pending.id,'together');
  choose(r,0);assert.equal(r.npcLinks['lin:rei'],6);assert.equal(r.relationships.lin.trust,trust+5);
  assert.equal(r.storyFlags['together:lin:rei'],true);assert.equal(r.pending.id,'npc-prelude');
});

test('taking sides in together changes both player relationships and the actual NPC sugar bond',()=>{
  const r=pairReady();beginPair(r);r.notice=null;r.npcBonds['rei:yuki'].outlook='steady';
  const bond=r.npcBonds['rei:yuki'],trust=bond.trust;perform(r,'together','rei:yuki');
  const first=r.relationships.rei.affection,second=r.relationships.yuki.trust;choose(r,2);
  assert.equal(r.relationships.rei.affection,first+2);assert.equal(r.relationships.yuki.trust,second-6);
  assert.equal(bond.trust,trust-8);assert.equal(bond.tension,20);assert.equal(r.npcLinks['rei:yuki'],2);
  assert.ok(r.logs[0].changes.some(c=>c.label==='零点与弥生·信任' && c.delta===-8));
});

test('ordinary group choices change existing NPC bonds as well as player trust and NPC familiarity',()=>{
  const r=pairReady();r.storySeen=r.storySeen.filter(id=>id!=='group-build');r.storyFlags['together:rei:yuki']=true;
  const bond=beginPair(r);r.notice=null;const trust=bond.trust,pc=r.relationships.rei.trust;
  r.pending={type:'scene',id:'group-build',npc:'rei',other:'yuki'};choose(r,0);
  assert.equal(bond.trust,trust+4);assert.equal(bond.tension,4);assert.equal(r.relationships.rei.trust,pc+4);
  assert.equal(r.npcLinks['rei:yuki'],12);
});

test('version three saves upgrade NPC bonds and preserve pending follow-up stories',()=>{
  const r=pairReady();beginPair(r);r.notice=null;advance(r,12);delete r.npcBonds['rei:yuki'].open;
  const copy=validateSave({version:3,run:r,legacy:freshLegacy()});assert.equal(copy.version,VERSION);
  assert.equal(copy.run.npcBonds['rei:yuki'].open,false);assert.equal(copy.run.pending.id,'npc-date');
});
