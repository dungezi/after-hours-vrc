import test from 'node:test';
import assert from 'node:assert/strict';
import { PEOPLE } from '../dist/data.js';
import { romanceKey } from '../dist/courtship-stories.js';
import { GROUPS } from '../dist/stories.js';
import { VERSION, startRun, freshLegacy, perform, choose, currentEvent, locationOf, online, actionReason, previewEffects, previewRelations, apply, validateSave, finish } from '../dist/engine.js';

const run = () => { const r=startRun({ seed:42 });read(r);return r; };
function read(r) { let guard=0; while(r.pending) { assert.ok(++guard<20);choose(r,0); } }
function ready(r,id) { for(const i of [0,1])r.storyFlags[romanceKey(id,i)]=1;Object.assign(r.relationships[id],{met:true,introduced:true,affection:70,trust:70,stage:2,meetings:5,communicated:true,tension:0}); }

test('each new run presents both welcome encounters in order without spending actions',()=>{
  const first=startRun({seed:42});
  assert.equal(first.pending.id,'introduction');assert.equal(first.pending.npc,'raina');
  assert.match(currentEvent(first).subtitle,/初次相遇/);
  const restored=validateSave({version:VERSION,run:first,legacy:freshLegacy()}).run;
  choose(restored,0);assert.equal(restored.pending.npc,'ash');
  choose(restored,0);assert.equal(restored.pending,null);assert.equal(restored.ap,3);assert.equal(restored.counters.actions,0);
  assert.ok(restored.logs.some(l=>l.kind==='story'&&l.title==='雨声里留给你的座位'));
  assert.ok(restored.logs.some(l=>l.kind==='story'&&l.title==='第一条欢迎消息'));
  const second=startRun({seed:99});assert.equal(second.pending.npc,'raina');assert.equal(second.queue[0].npc,'ash');
});

test('new contacts appear before same-action group stories, with both surviving a saved reload',()=>{
  const r=run();r.day=4;
  perform(r,'explore',locationOf(r,'rei'));
  assert.equal(r.pending.id,'introduction');assert.equal(r.pending.npc,'rei');
  const followup={...r.queue[0]};assert.equal(followup.id,'group-welcome');
  const restored=validateSave({version:VERSION,run:r,legacy:freshLegacy()}).run;
  choose(restored,0);assert.deepEqual(restored.pending,followup);assert.equal(restored.ap,2);
  choose(restored,0);assert.equal(restored.pending,null);
  assert.equal(restored.logs.filter(l=>l.kind==='story'&&l.title==='来自另一个时区的问候').length,1);
});

test('a first encounter preserves an eligible personal arc rather than replacing it',()=>{
  const r=run();r.day=4;Object.assign(r.relationships.rei,{trust:25,meetings:1});
  perform(r,'explore',locationOf(r,'rei'));
  assert.equal(r.pending.id,'introduction');assert.equal(r.queue[0].type,'arc');
  const copy=validateSave({version:VERSION,run:r,legacy:freshLegacy()}).run;
  choose(copy,0);assert.equal(copy.pending.type,'arc');assert.equal(copy.pending.npc,'rei');
  choose(copy,0);assert.equal(copy.relationships.rei.stage,1);assert.equal(copy.ap,2);
});

test('encounters preserve ordinary events and reject unknown queued stories on import',()=>{
  const r=run();r.relationships.raina.met=false;const contact=PEOPLE.find(p=>p.id==='raina');
  perform(r,'explore',locationOf(r,contact.id));
  assert.equal(r.pending.id,'introduction');assert.equal(r.queue[0].type,'event');
  const copy=validateSave({version:VERSION,run:r,legacy:freshLegacy()}).run;
  const eventId=copy.queue[0].id;choose(copy,0);assert.equal(copy.pending.id,eventId);choose(copy,0);assert.ok(copy.seen.includes(eventId));
  r.queue=[{type:'event',id:'missing'}];assert.throws(()=>validateSave({version:VERSION,run:r,legacy:freshLegacy()}),/无效/);
});

test('characters roam beyond their preferred worlds without changing online schedules',()=>{
  const r=run();const places=new Set();
  for(let day=1;day<=28;day++){r.day=day;const world=locationOf(r,'raina');assert.equal(world!==null,online(r,'raina'));if(world)places.add(world);}
  assert.ok(places.size>=4);
});
test('sustained online activity drains energy and rest makes a balanced week playable',()=>{
  const r=run();let rests=0,minimum=100;
  for(let day=1;day<=7;day++){
    while(r.ap>0){
      if(r.stats.energy<30){perform(r,'rest');rests++;}
      else {const balance=r.stats.balance;perform(r,'explore','cafe');assert.equal(r.stats.balance,balance-5);}
      minimum=Math.min(minimum,r.stats.energy);read(r);
    }
    if(day<7){perform(r,'next');read(r);}
  }
  assert.ok(rests>=2 && rests<=7);assert.ok(minimum<30);assert.ok(r.stats.energy<80);
});

test('high skills and mood have diminishing gains, not invisible overflows',()=>{
  const r=run();r.stats.craft=90;r.stats.social=90;r.stats.mood=90;
  assert.deepEqual(previewEffects(r,{craft:8,social:8,mood:8}),{craft:1,social:1,mood:3});
  r.stats.craft=100;assert.equal(previewEffects(r,{craft:8}).craft,0);
});
test('story previews match actual clamped and diminishing changes for all participants',()=>{
  const r=run();Object.assign(r.relationships.raina,{trust:90,affection:100,tension:0});
  const effects={craft:12,mood:9},rel={trust:12,affection:8,tension:-8};
  const stats=previewEffects(r,effects),relations=previewRelations(r,'raina',rel);
  assert.deepEqual(relations,{trust:3,affection:0,tension:0});
  const before=r.stats.craft;apply(r,effects,'raina',rel);assert.equal(r.stats.craft-before,stats.craft);assert.equal(r.relationships.raina.trust,93);
});
test('one night can contain multiple stories and actions remain capped at three',()=>{
  const r=run();perform(r,'explore','rain');read(r);perform(r,'talk','raina');read(r);
  assert.ok(r.storyCount>=2);assert.equal(r.ap,1);
  perform(r,'talk','raina');read(r);assert.equal(r.ap,0);assert.match(actionReason(r,'explore','rain'),/行动/);
});
test('group decisions affect both characters, their bond and later narrative echoes',()=>{
  const r=run();r.day=4;r.relationships.raina.stage=2;r.pending={type:'scene',id:'group-welcome',npc:'ash',other:'raina'};
  const a=r.relationships.ash.trust,b=r.relationships.raina.trust;
  choose(r,0);assert.ok(r.relationships.ash.trust>a);assert.ok(r.relationships.raina.trust>b);assert.ok(r.npcLinks['ash:raina']>0);
  assert.equal(r.storyFlags['quiet-room'],true);
  r.pending={type:'scene',id:'group-return',npc:'ash',other:'lin'};assert.match(currentEvent(r).text,/当时那个决定/);
  assert.equal(GROUPS.length,10);
});
test('a waiting confession can advance through same-night conversation instead of a fixed cooldown',()=>{
  const r=run();Object.assign(r.relationships.raina,{affection:40,trust:33,meetings:4,communicated:true});for(const i of [0,1])r.storyFlags[romanceKey('raina',i)]=1;
  perform(r,'confess','raina');choose(r,0);assert.equal(r.pending.answer,'waiting');choose(r,0);assert.equal(r.notice.answer,'waiting');
  assert.match(actionReason(r,'confess','raina'),/送达/);
  perform(r,'talk','raina');read(r);perform(r,'talk','raina');
  assert.equal(r.pending.id,'reply');assert.equal(r.pending.answer,'accepted');choose(r,0);
  assert.equal(r.relationships.raina.status,'sugar');assert.equal(r.day,1);assert.equal(r.notice.answer,'accepted');
});
test('declining an accepted reply leaves friendship instead of silently committing',()=>{
  const r=run();ready(r,'raina');perform(r,'confess','raina');choose(r,0);assert.equal(r.pending.answer,'accepted');choose(r,1);
  assert.equal(r.relationships.raina.status,'friend');assert.equal(r.notice.answer,'withdraw');
});
test('multiple informed relationships lead to negotiation, follow-up scenes and a distinct ending',()=>{
  const r=run();r.day=5;ready(r,'rei');ready(r,'lin');r.relationships.rei.status='sugar';
  perform(r,'confess','lin');choose(r,0);assert.equal(r.pending.answer,'accepted');choose(r,0);
  assert.equal(Object.values(r.relationships).filter(x=>x.status==='sugar').length,2);
  assert.ok(r.queue.some(q=>q.id==='multi-open'));
  perform(r,'next');assert.equal(r.pending.id,'multi-open');choose(r,0);
  assert.ok(r.relationships.rei.agreement && r.relationships.lin.agreement);assert.ok(r.queue.some(q=>q.id==='multi-time'));
  assert.equal(finish(r).id,'weave');assert.doesNotThrow(()=>validateSave({version:VERSION,run:r,legacy:freshLegacy()}));
});
test('hidden relationships are discovered later and have trust consequences',()=>{
  const r=run();r.day=5;ready(r,'rei');ready(r,'lin');r.relationships.rei.status='sugar';
  perform(r,'confess','lin');choose(r,1);choose(r,0);assert.equal(r.relationships.lin.disclosed,false);
  perform(r,'next');read(r);perform(r,'next');assert.equal(r.pending.id,'multi-discovery');
  const before=r.relationships.rei.trust;choose(r,0);assert.ok(r.relationships.rei.trust<before);assert.ok(r.relationships.lin.disclosed);
});
test('a character can decline nonexclusive arrangements without being forced into consent',()=>{
  const r=run();ready(r,'raina');ready(r,'lin');r.relationships.raina.status='sugar';r.relationships.lin.status='sugar';
  r.pending={type:'scene',id:'multi-open',npc:'lin',other:'raina'};choose(r,0);
  assert.equal(r.relationships.raina.status,'sugar');assert.equal(r.relationships.raina.agreement,false);assert.equal(r.relationships.lin.status,'sugar');
  assert.equal(r.pending.id,'separation-prelude');assert.equal(r.departures['player:raina'].reason,'boundaries');
});
test('unnegotiated multiple relationships cannot receive the stable single-partner ending',()=>{
  const r=run();ready(r,'rei');ready(r,'lin');r.relationships.rei.status='sugar';r.relationships.lin.status='sugar';
  assert.equal(finish(r).id,'fragile');
});
test('old saves upgrade without losing relations, journal, legacy or unfinished old stories',()=>{
  const r=run();perform(r,'explore','rain');r.stats.craft=100;
  const old={version:1,run:r,legacy:freshLegacy()};old.legacy.points=12;
  for(const key of ['storySeen','storyFlags','npcLinks','queue','notice','nightActions','storyCount','storyNight'])delete r[key];
  for(const rel of Object.values(r.relationships))for(const key of ['intent','disclosed','agreement'])delete rel[key];
  const copy=validateSave(old);assert.equal(copy.version,VERSION);assert.equal(copy.run.stats.craft,70);assert.equal(copy.legacy.points,12);
  assert.equal(copy.run.logs.length,r.logs.length);assert.equal(currentEvent(copy.run).title,currentEvent(r).title);assert.equal(old.version,1);
  choose(copy.run,0);assert.doesNotThrow(()=>validateSave(copy));
});
test('new story and response state roundtrip, malformed scene queues and intents are rejected',()=>{
  const r=run();ready(r,'raina');perform(r,'confess','raina');choose(r,0);
  const payload={version:VERSION,run:r,legacy:freshLegacy()};const copy=validateSave(payload);assert.equal(currentEvent(copy.run).title,currentEvent(r).title);
  for(const bad of [p=>p.run.queue=[{type:'scene',id:'made-up'}],p=>p.run.relationships.raina.intent.dayGoal=100,p=>p.run.pending.other='unknown',p=>p.run.storyFlags.bad={code:'x'}]){
    const broken=JSON.parse(JSON.stringify(payload));bad(broken);assert.throws(()=>validateSave(broken),/无效/);
  }
});
