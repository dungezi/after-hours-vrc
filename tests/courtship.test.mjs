import test from 'node:test';
import assert from 'node:assert/strict';
import { PEOPLE } from '../dist/data.js';
import { NPC_ROUTES } from '../dist/npc-stories.js';
import { romanceKey, preludeKey, romanceProgress, preludeProgress, narratorFor } from '../dist/courtship-stories.js';
import { VERSION, startRun, freshLegacy, perform, choose, actionReason, currentEvent, validateSave, nightRecovery, actionCost } from '../dist/engine.js';
const payload=r=>({version:VERSION,run:r,legacy:freshLegacy()});
function fresh(){const r=startRun({seed:999});while(r.pending)choose(r,0);return r;}
function know(r,...ids){for(const id of ids)Object.assign(r.relationships[id],{met:true,introduced:true});}
function foundation(route=NPC_ROUTES[1],reported=true){
  const r=fresh();r.day=route.day;know(r,...route.cast);
  const narrator=narratorFor(...route.cast);if(reported)know(r,narrator);else r.relationships[narrator].introduced=r.relationships[narrator].met=false;
  r.storySeen.push(route.after);r.npcLinks[[...route.cast].sort().join(':')]=4;return r;
}
function advance(r,day){while(r.day<day){assert.equal(r.pending,null);perform(r,'next');}}

test('high affection alone cannot skip the player relationship prelude',()=>{
  const r=fresh();Object.assign(r.relationships.raina,{affection:90,trust:90,meetings:10,stage:2,communicated:true});
  assert.match(actionReason(r,'confess','raina'),/0 \/ 2/);perform(r,'talk','raina');
  assert.equal(r.pending.id,'courtship');assert.equal(r.pending.index,0);choose(r,0);
  assert.equal(romanceProgress(r,'raina'),1);assert.equal(r.relationships.raina.status,'friend');assert.match(actionReason(r,'confess','raina'),/1 \/ 2/);
  advance(r,2);assert.equal(r.pending,null);perform(r,'next');assert.equal(r.day,3);assert.equal(r.pending.id,'courtship');assert.equal(r.pending.index,1);
  choose(r,0);assert.equal(romanceProgress(r,'raina'),2);assert.equal(actionReason(r,'confess','raina'),null);
  perform(r,'confess','raina');choose(r,0);assert.equal(r.pending.answer,'accepted');choose(r,0);assert.equal(r.relationships.raina.status,'sugar');
});

test('player preludes follow their personal story and do not consume extra actions',()=>{
  const r=fresh();Object.assign(r.relationships.raina,{affection:24,trust:30,meetings:2});perform(r,'talk','raina');
  assert.equal(r.pending.type,'arc');const ap=r.ap;choose(r,0);assert.equal(r.pending.id,'courtship');choose(r,0);assert.equal(r.ap,ap);
  assert.equal(romanceProgress(r,'raina'),1);assert.doesNotThrow(()=>validateSave(payload(r)));
});

test('the player cannot read a later intimate scene before the first one or rush it in the same night',()=>{
  const r=fresh();r.pending={type:'scene',id:'courtship',npc:'raina',index:1};assert.throws(()=>choose(r,0));
  r.storyFlags[romanceKey('raina',0)]=1;assert.throws(()=>choose(r,0));assert.equal(romanceProgress(r,'raina'),1);
});

test('personal intimate encounters wait until the character is online again',()=>{
  const r=fresh();r.day=2;Object.assign(r.relationships.raina,{affection:50,trust:50,meetings:5,stage:1});
  perform(r,'work');assert.equal(r.pending,null);perform(r,'next');assert.equal(r.pending.id,'courtship');assert.equal(r.pending.npc,'raina');
});

test('NPC relationships have two distinct cross-night preludes before a confession, on every route',()=>{
  for(const route of NPC_ROUTES){
    const r=foundation(route);perform(r,'work');while(!r.pending && r.day<route.day+4)perform(r,'next');
    assert.equal(r.pending.id,'npc-prelude');assert.equal(r.pending.index,0);const firstDay=r.day;
    choose(r,0);assert.equal(preludeProgress(r,...route.cast),1);assert.deepEqual(r.npcBonds,{});assert.equal(r.pending,null);
    advance(r,firstDay+1);assert.equal(r.pending,null);
    // Availability can delay a witnessed story; a known narrator can relate an earlier encounter.
    let guard=0;while(!r.pending && r.day<firstDay+5){assert.ok(++guard<6);perform(r,'next');}
    assert.equal(r.pending.id,'npc-prelude');assert.equal(r.pending.index,1);const secondDay=r.day;choose(r,0);
    assert.deepEqual(r.npcBonds,{});advance(r,secondDay+1);assert.equal(r.pending,null);perform(r,'next');
    assert.equal(r.pending.id,'npc-confession');assert.equal(preludeProgress(r,...route.cast),2);choose(r,0);
    assert.equal(r.npcBonds[[...route.cast].sort().join(':')].status,'sugar');assert.doesNotThrow(()=>validateSave(payload(r)));
  }
});

test('known NPCs can report consensually shared preludes and receive the trust gain',()=>{
  const r=foundation();perform(r,'work');assert.equal(r.pending.narrator,'ash');assert.match(currentEvent(r).subtitle,/阿澈转述/);assert.match(currentEvent(r).text,/你没有在那次见面现场/);
  const before=r.relationships.ash.trust,main=r.relationships.rei.trust;choose(r,0);
  assert.equal(r.relationships.ash.trust,before+2);assert.equal(r.relationships.rei.trust,main);assert.equal(r.npcLinks['rei:yuki'],8);
});

test('a shared invitation can lead to a witnessed prelude and does not become instant romance',()=>{
  const r=foundation(NPC_ROUTES[1],false);perform(r,'together','rei:yuki');choose(r,0);
  assert.equal(r.pending.id,'npc-prelude');assert.equal(r.pending.narrator,undefined);assert.match(currentEvent(r).subtitle,/你亲自经历/);
  choose(r,0);assert.equal(r.pending,null);assert.deepEqual(r.npcBonds,{});assert.equal(preludeProgress(r,'rei','yuki'),1);
});

test('unintroduced narrators cannot appear, and negative gossip cannot force an NPC romance',()=>{
  const r=foundation(NPC_ROUTES[1],false);perform(r,'work');assert.equal(r.pending.narrator,undefined);choose(r,2);
  assert.equal(r.npcLinks['rei:yuki'],0);assert.equal(r.npcBonds['rei:yuki'],undefined);advance(r,13);assert.equal(r.pending,null);
});

test('old premature NPC confessions are saved for after their new preludes',()=>{
  const r=foundation();r.pending={type:'scene',id:'npc-confession',npc:'rei',other:'yuki'};
  const copy=validateSave({version:4,run:r,legacy:freshLegacy()}).run;
  assert.equal(copy.pending.id,'npc-prelude');assert.ok(copy.queue.some(q=>q.id==='npc-confession'));
  choose(copy,0);advance(copy,11);assert.equal(copy.pending.id,'npc-prelude');choose(copy,0);advance(copy,13);
  assert.equal(copy.pending.id,'npc-confession');assert.doesNotThrow(()=>validateSave(payload(copy)));
});

test('old established player and NPC sugar relationships keep their commitments and energy on upgrade',()=>{
  const r=foundation();r.relationships.rei.status='sugar';r.stats.energy=92;
  r.npcBonds['rei:yuki']={status:'sugar',stage:2,trust:60,tension:12,sinceDay:8,lastDay:8,open:true,outlook:'steady',initiator:null};
  const copy=validateSave({version:4,run:r,legacy:freshLegacy()});
  assert.equal(copy.version,VERSION);assert.equal(copy.run.relationships.rei.status,'sugar');assert.equal(copy.run.npcBonds['rei:yuki'].status,'sugar');
  assert.equal(copy.run.stats.energy,92);assert.equal(romanceProgress(copy.run,'rei'),2);assert.equal(preludeProgress(copy.run,'rei','yuki'),2);assert.deepEqual(r.storyFlags,{});
});

test('prelude index, narrator and recorded chronology are validated, and a read scene is not replayed',()=>{
  const r=foundation();perform(r,'work');const saved=structuredClone(payload(r));
  for(const mutate of [p=>p.run.pending.narrator='lin',p=>p.run.pending.index=3,p=>p.run.storyFlags[preludeKey('rei','yuki',1)]=9,p=>p.run.storyFlags[preludeKey('rei','yuki',0)]=10,p=>p.run.pending.other='ash']){
    const p=structuredClone(saved);mutate(p);assert.throws(()=>validateSave(p),/无效/);
  }
  choose(r,0);r.queue.push(saved.run.pending);perform(r,'work');assert.equal(r.pending,null);assert.equal(r.queue.length,0);
});

test('night recovery reflects actual time spent, with limited bonuses and no full-energy reset',()=>{
  for(const [actions,gain] of [[0,30],[1,30],[2,24],[3,18]]){
    const r=fresh();r.nightActions=actions;r.ap=3-actions;r.stats.energy=10;assert.equal(nightRecovery(r),gain);
    perform(r,'next');assert.equal(r.stats.energy,10+gain);
  }
  const r=fresh();r.gear.push('comfort');r.memories.push('anchor');r.nightActions=3;r.stats.energy=10;
  assert.equal(nightRecovery(r),24);perform(r,'next');assert.equal(r.stats.energy,34);
});

test('rest remains possible at zero energy and restores enough for a substantial action',()=>{
  const r=fresh();r.stats.energy=0;assert.match(actionReason(r,'together','raina:ash'),/精力/);perform(r,'rest');assert.equal(r.stats.energy,28);
  assert.equal(actionCost(r,'project','avatar').energy,18);assert.equal(actionReason(r,'project','avatar'),null);
  perform(r,'project','avatar');assert.equal(r.stats.energy,10);
});
