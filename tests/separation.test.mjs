import test from 'node:test';
import assert from 'node:assert/strict';
import { PEOPLE } from '../dist/data.js';
import { NPC_ROUTES } from '../dist/npc-stories.js';
import { romanceKey } from '../dist/courtship-stories.js';
import { departureKey } from '../dist/separation-stories.js';
import { VERSION, startRun, freshLegacy, perform, choose, currentEvent, acknowledgeNotice, actionReason, validateSave } from '../dist/engine.js';
const payload=r=>({version:VERSION,run:r,legacy:freshLegacy()});
function fresh(){const r=startRun({seed:64});while(r.pending)choose(r,0);return r;}
function sugar(id='raina',tension=10){
  const r=fresh();Object.assign(r.relationships[id],{met:true,introduced:true,status:'sugar',trust:65,affection:70,stage:2,meetings:6,lastDay:1,communicated:true,tension});
  for(const i of [0,1])r.storyFlags[romanceKey(id,i)]=1;
  return r;
}
function pair(route=NPC_ROUTES.find(s=>s.cast.includes('rei') && s.cast.includes('yuki')),tension=40,day=route.day){
  const r=fresh();r.day=day;
  for(const id of route.cast)Object.assign(r.relationships[id],{met:true,introduced:true});
  r.npcBonds[[...route.cast].sort().join(':')]={status:'sugar',stage:2,trust:60,tension,sinceDay:1,lastDay:1,initiator:null,open:false,outlook:'steady'};
  return r;
}
function tomorrow(r){acknowledgeNotice(r);assert.equal(r.pending,null);perform(r,'next');}
function preludes(r,option=1){
  assert.equal(r.pending.id,'separation-prelude');assert.equal(r.pending.index,0);choose(r,option);
  assert.equal(r.pending,null);tomorrow(r);assert.equal(r.pending.id,'separation-prelude');assert.equal(r.pending.index,1);choose(r,option);
  assert.equal(r.pending,null);tomorrow(r);assert.equal(r.pending.id,'separation-proposal');
}
function forward(r,days){for(let i=0;i<days;i++)tomorrow(r);}

test('player-requested separation starts two cross-night preludes and cannot jump straight to a result',()=>{
  const r=sugar();perform(r,'breakup','raina');assert.equal(r.ap,2);assert.equal(r.relationships.raina.status,'sugar');
  const key=departureKey('raina');assert.equal(r.departures[key].preludes.length,0);
  const bad=payload(structuredClone(r));bad.run.pending={type:'scene',id:'separation-proposal',npc:'raina',link:key};
  assert.throws(()=>validateSave(bad));const forced=structuredClone(r);forced.pending=bad.run.pending;assert.throws(()=>choose(forced,0),/前置/);
  preludes(r);assert.deepEqual(r.departures[key].preludes,[1,2]);assert.equal(r.day,3);assert.equal(r.ap,3);
  assert.equal(r.relationships.raina.status,'sugar');assert.doesNotThrow(()=>validateSave(payload(r)));
});

test('a slow partner can refuse the player proposal and both can decide to continue after another night',()=>{
  const r=sugar();perform(r,'breakup','raina');preludes(r);assert.match(currentEvent(r).text,/还不愿分开/);
  choose(r,0);assert.equal(r.notice.answer,'reconsider');assert.equal(r.relationships.raina.status,'sugar');
  const copy=validateSave(payload(r)).run;assert.equal(copy.notice.answer,'reconsider');tomorrow(copy);
  assert.equal(copy.pending.id,'separation-review');choose(copy,0);
  assert.equal(copy.relationships.raina.status,'sugar');assert.equal(copy.notice.answer,'repaired');assert.equal(copy.departures['player:raina'].resolution,'repaired');
  assert.doesNotThrow(()=>validateSave(payload(copy)));
});

test('the player may still end the relationship after hearing reluctance, followed by two real aftermath chapters',()=>{
  const r=sugar();perform(r,'breakup','raina');preludes(r);choose(r,1);
  const d=r.departures['player:raina'];assert.equal(r.notice.answer,'ended');assert.equal(r.relationships.raina.status,'salt');assert.equal(d.initiator,'player');
  assert.match(actionReason(r,'talk','raina'),/距离/);forward(r,1);assert.equal(r.pending,null);forward(r,1);
  assert.equal(r.pending.id,'separation-after');assert.equal(r.pending.index,0);assert.match(currentEvent(r).text,/没有在相册里留下共同照片/);choose(r,0);assert.equal(d.contact,'friends');
  forward(r,1);assert.equal(r.pending,null);forward(r,1);assert.equal(r.pending.index,1);choose(r,0);
  assert.deepEqual(d.aftermath,[5,7]);assert.equal(d.phase,'closed');assert.equal(r.relationships.raina.status,'salt');
  assert.doesNotThrow(()=>validateSave(payload(r)));
});

test('rejecting an NPC breakup can lead to a mutually chosen adjustment rather than an automatic end',()=>{
  const r=sugar('raina',80);perform(r,'work');preludes(r);assert.equal(r.departures['player:raina'].initiator,'raina');
  choose(r,1);assert.equal(r.relationships.raina.status,'sugar');assert.equal(r.notice.answer,'reconsider');tomorrow(r);
  assert.equal(r.pending.id,'separation-review');choose(r,0);
  assert.equal(r.notice.answer,'repaired');assert.equal(r.relationships.raina.status,'sugar');assert.equal(r.departures['player:raina'].attempts,1);
});

test('a firm NPC can decline the requested adjustment; no-contact aftermath does not force a reunion',()=>{
  const r=sugar('raina',100);perform(r,'photo','raina');choose(r,2);const photo=structuredClone(r.photos[0]);
  preludes(r);choose(r,1);assert.equal(r.departures['player:raina'].repairAllowed,false);tomorrow(r);
  assert.match(currentEvent(r).text,/仍然表示不能继续/);choose(r,1);
  assert.equal(r.relationships.raina.status,'salt');assert.equal(r.relationships.raina.drifted,true);assert.equal(r.departures['player:raina'].contact,'none');
  assert.match(actionReason(r,'talk','raina'),/不希望联系/);assert.match(actionReason(r,'photo','raina'),/不希望联系/);
  forward(r,2);assert.match(currentEvent(r).text,/不是向对方发送/);const trust=r.relationships.raina.trust;choose(r,0);assert.equal(r.relationships.raina.trust,trust);
  forward(r,2);assert.match(currentEvent(r).text,/不联系的约定仍然有效/);choose(r,0);
  assert.equal(r.departures['player:raina'].contact,'none');assert.deepEqual(r.photos[0],photo);assert.doesNotThrow(()=>validateSave(payload(r)));
});

test('all five NPC pairs receive their own preludes and aftermath, without ending unrelated player relationships',()=>{
  for(const route of NPC_ROUTES){
    const r=pair(route,90,route.day),key=departureKey(...route.cast),bond=r.npcBonds[[...route.cast].sort().join(':')];
    const before=structuredClone(r.relationships);perform(r,'work');preludes(r);assert.equal(bond.status,'sugar');choose(r,0);
    assert.equal(bond.status,'salt');assert.ok(route.cast.includes(bond.initiator));assert.equal(r.notice.answer,'npc-ended');assert.deepEqual(r.relationships,before);
    forward(r,2);assert.equal(r.pending.id,'separation-after');assert.equal(r.pending.other,route.cast[1]);choose(r,1);
    forward(r,2);assert.match(currentEvent(r).text,/没有替他们传递/);choose(r,0);
    assert.equal(r.departures[key].phase,'closed');assert.equal(bond.status,'salt');assert.doesNotThrow(()=>validateSave(payload(r)));
  }
});

test('either member of an NPC pair can initiate the separation',()=>{
  const route=NPC_ROUTES.find(s=>s.cast.includes('rei') && s.cast.includes('yuki')),initiators=new Set();
  for(const day of [9,10]){const r=pair(route,90,day);perform(r,'work');initiators.add(r.departures[departureKey(...route.cast)].initiator);}
  assert.deepEqual(initiators,new Set(route.cast));
});

test('NPC reluctance and later decisions depend on their own pressure and trust, including the player advice',()=>{
  for(const advice of [0,2]){
    const r=pair(undefined,64),key=Object.keys(r.npcBonds)[0],bond=r.npcBonds[key];perform(r,'work');preludes(r,advice);
    assert.match(currentEvent(r).text,/还不愿分开|还想继续|仍珍惜|还珍惜/);choose(r,0);assert.equal(r.notice.answer,'reconsider');tomorrow(r);choose(r,0);
    assert.equal(bond.status,advice===0?'sugar':'salt');assert.equal(r.notice.answer,advice===0?'repaired':'npc-ended');assert.doesNotThrow(()=>validateSave(payload(r)));
  }
});

test('an NPC pair can share its prelude through known friends without teleporting offline actors into a scene',()=>{
  const r=pair(undefined,90,13);perform(r,'work');assert.match(currentEvent(r).text,/转述|共同留下的消息/);
  assert.equal(r.relationships.mika.met,false);assert.doesNotThrow(()=>validateSave(payload(r)));
});

test('declining an incompatible open arrangement still requires the separation preludes and never grants false consent',()=>{
  const r=sugar();Object.assign(r.relationships.lin,{met:true,introduced:true,status:'sugar',trust:65,affection:70,stage:2,meetings:6,lastDay:1});
  for(const i of [0,1])r.storyFlags[romanceKey('lin',i)]=1;
  r.pending={type:'scene',id:'multi-open',npc:'lin',other:'raina'};choose(r,0);
  assert.equal(r.relationships.raina.status,'sugar');assert.equal(r.relationships.raina.agreement,false);preludes(r);choose(r,1);
  assert.equal(r.departures['player:raina'].repairAllowed,false);tomorrow(r);choose(r,0);
  assert.equal(r.relationships.raina.status,'salt');assert.equal(r.relationships.lin.status,'sugar');assert.equal(r.relationships.raina.agreement,false);
});

test('withdrawing a new relation from a multi-partner scene cannot silently skip the breakup story',()=>{
  const r=sugar();Object.assign(r.relationships.lin,{met:true,introduced:true,status:'sugar'});
  r.pending={type:'scene',id:'multi-open',npc:'raina',other:'lin'};choose(r,2);
  assert.equal(r.relationships.raina.status,'sugar');assert.equal(r.pending.id,'separation-prelude');assert.equal(r.departures['player:raina'].initiator,'player');
});

test('multiple departure lines progress independently and preserve their queued scenes through a refresh',()=>{
  const r=pair(undefined,90);Object.assign(r.relationships.raina,{met:true,introduced:true,status:'sugar',trust:65,affection:70,tension:99,lastDay:1});
  perform(r,'work');const first=r.pending.link;assert.equal(Object.keys(r.departures).length,2);
  const copy=validateSave(payload(r)).run;choose(copy,1);assert.equal(copy.pending.id,'separation-prelude');assert.notEqual(copy.pending.link,first);
  choose(copy,1);assert.equal(Object.values(copy.departures).every(d=>d.phase==='prelude1'),true);assert.doesNotThrow(()=>validateSave(payload(copy)));
});

test('version 7 pending farewells are upgraded to real preludes without changing an existing sugar bond',()=>{
  for(const id of ['breakup','npc-departure']){
    const r=sugar();delete r.departures;r.pending={type:'scene',id,npc:'raina'};
    const old={version:7,run:r,legacy:freshLegacy()},copy=validateSave(old).run;
    assert.equal(copy.pending.id,'separation-prelude');assert.equal(copy.pending.index,0);assert.equal(copy.relationships.raina.status,'sugar');assert.equal(copy.departures['player:raina'].preludes.length,0);
    assert.equal(old.run.pending.id,id);
  }
  const r=pair(undefined,90);delete r.departures;r.pending={type:'scene',id:'npc-breakup',npc:'rei',other:'yuki'};
  const copy=validateSave({version:7,run:r,legacy:freshLegacy()}).run;assert.equal(copy.pending.id,'separation-prelude');assert.equal(copy.npcBonds['rei:yuki'].status,'sugar');
});

test('version 7 ended bonds keep their history and can receive aftermath without inventing old preludes',()=>{
  const r=sugar();r.relationships.raina.status='salt';delete r.departures;
  const copy=validateSave({version:7,run:r,legacy:freshLegacy()}).run;const d=copy.departures['player:raina'];
  assert.equal(d.resolution,'ended');assert.equal(d.legacy,true);assert.deepEqual(d.preludes,[]);assert.equal(copy.relationships.raina.status,'salt');
  forward(copy,2);assert.equal(copy.pending.id,'separation-after');choose(copy,0);assert.doesNotThrow(()=>validateSave(payload(copy)));
});

test('invalid separation casts, skipped phases, future dates and inconsistent resolution are rejected on import',()=>{
  const r=sugar();perform(r,'breakup','raina');
  for(const change of [p=>p.run.pending.link='player:mika',p=>p.run.departures['player:raina'].phase='proposal',p=>p.run.departures['player:raina'].preludes=[1,1],p=>p.run.departures['player:raina'].initiator='rei',p=>p.run.departures['player:raina'].resolution='ended',p=>p.run.departures['player:raina'].lastDay=99,p=>p.run.departures['player:raina'].attempts=3,p=>p.run.departures['player:raina'].contact='public',p=>p.run.relationships.raina.status='salt']){
    const bad=payload(structuredClone(r));change(bad);assert.throws(()=>validateSave(bad));
  }
  const p=pair(undefined,90);perform(p,'work');const bad=payload(structuredClone(p));bad.run.departures[Object.keys(p.departures)[0]].initiator='player';assert.throws(()=>validateSave(bad));
});

test('continuing after a refusal does not restart the same preludes and renewed discussion cannot loop forever',()=>{
  const r=sugar();perform(r,'breakup','raina');preludes(r);choose(r,0);tomorrow(r);choose(r,0);
  const old=structuredClone(r.departures['player:raina'].preludes);acknowledgeNotice(r);r.day=7;r.ap=3;r.nightActions=0;
  perform(r,'breakup','raina');assert.equal(r.pending.id,'separation-proposal');assert.deepEqual(r.departures['player:raina'].preludes,old);
  choose(r,0);tomorrow(r);choose(r,0);acknowledgeNotice(r);r.day=10;r.ap=3;r.nightActions=0;
  // 同一局已认真讨论两次，再次明确提出时不会重放前置或无限弹出挽留。
  r.day=11;perform(r,'breakup','raina');assert.equal(r.pending.id,'separation-proposal');choose(r,0);
  assert.equal(r.relationships.raina.status,'salt');assert.equal(r.departures['player:raina'].attempts,2);
});
