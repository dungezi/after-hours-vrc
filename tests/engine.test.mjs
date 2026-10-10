import test from 'node:test';
import assert from 'node:assert/strict';
import { romanceKey } from '../dist/courtship-stories.js';
import { WORLD, PEOPLE, MEMORIES, PROJECTS } from '../dist/data.js';
import { VERSION, freshLegacy, startRun, online, actionReason, perform, choose, finish, settle, currentEvent, unlockMemory, equipMemory, validateSave } from '../dist/engine.js';

function newRun(traits = ['listener','wanderer']) { const r=startRun({ traits, seed: 42 });resolve(r);return r; }
function resolve(r) { while(r.pending){const e=currentEvent(r);choose(r,e.choices.findIndex(c=>!c.effects.money||r.stats.money+c.effects.money>=0));} }
function jump(r,day) { resolve(r);while(r.day<day){perform(r,'next');resolve(r);} }
function validPayload(r=newRun()) { return {version:VERSION,run:r,legacy:freshLegacy()}; }

test('new runs have distinct traits, clean relationships and bounded statistics',()=>{
  const r=newRun();assert.equal(r.ap,3);assert.equal(r.day,1);assert.equal(r.stats.money,140);
  assert.equal(Object.values(r.relationships).filter(x=>x.met).length,2);
  assert.throws(()=>startRun({traits:['maker','maker']}),/不同/);
  assert.throws(()=>startRun({traits:['maker']}),/两个/);
});
test('exploration consumes one action, introduces online contacts and pauses for decisions',()=>{
  const r=newRun();perform(r,'explore','rain');assert.equal(r.ap,2);assert.equal(r.visited.length,1);assert.ok(r.achievements.includes('first'));
  assert.ok(r.pending);assert.throws(()=>perform(r,'work'),/回应/);assert.throws(()=>perform(r,'next'),/回应/);
  choose(r,0);assert.equal(r.pending,null);assert.ok(r.seen.includes('quiet'));assert.equal(r.ap,2);
  const e=validPayload(r);assert.doesNotThrow(()=>validateSave(e));
});
test('offline NPCs cannot be contacted and repeated chats have diminishing returns',()=>{
  const r=newRun();jump(r,2);assert.equal(online(r,'raina'),false);assert.match(actionReason(r,'talk','raina'),/离线/);
  jump(r,3);let trust=r.relationships.raina.trust;perform(r,'talk','raina');resolve(r);const first=r.relationships.raina.trust-trust;
  trust=r.relationships.raina.trust;perform(r,'talk','raina');const beforeStory=r.relationships.raina.trust-trust;resolve(r);
  assert.ok(beforeStory<first);
});
test('three actions are the daily limit; sleeping restores action points and energy',()=>{
  const r=newRun();for(let i=0;i<3;i++)perform(r,'work');assert.equal(r.ap,0);
  assert.throws(()=>perform(r,'rest'),/行动/);const energy=r.stats.energy;perform(r,'next');assert.equal(r.ap,3);assert.equal(r.day,2);assert.ok(r.stats.energy>energy);
});
test('insufficient energy and money block costs; rest never requires energy',()=>{
  const r=newRun();r.stats.energy=0;assert.throws(()=>perform(r,'explore','club'),/精力/);perform(r,'rest');assert.equal(r.stats.energy,28);
  r.stats.money=0;assert.throws(()=>perform(r,'project','avatar'),/资金/);assert.throws(()=>perform(r,'buy','tracker'),/资金/);
  perform(r,'work');assert.equal(r.stats.money,50);
});
test('purchases take funds once and never spend action points',()=>{
  const r=newRun();perform(r,'buy','camera');assert.equal(r.stats.money,80);assert.equal(r.ap,3);assert.throws(()=>perform(r,'buy','camera'),/已拥有/);
});
test('projects unlock by skill; rewards are applied exactly on completion',()=>{
  const r=newRun(['maker','steady']);assert.match(actionReason(r,'project','world'),/30/);
  for(let i=0;i<3;i++){perform(r,'project','avatar');resolve(r);if(i<2)perform(r,'next');}
  assert.equal(r.projects.avatar,3);assert.equal(r.stats.money,150);assert.ok(r.achievements.includes('maker'));
  assert.throws(()=>perform(r,'project','avatar'),/完成/);
  assert.equal(actionReason(r,'project','world'),null);
});
test('stories survive save roundtrips and advance an arc only once',()=>{
  const r=newRun();r.relationships.raina.trust=30;r.relationships.raina.meetings=2;
  perform(r,'talk','raina');assert.equal(r.pending.type,'arc');
  const copy=validateSave(validPayload(r)).run;assert.equal(currentEvent(copy).title,currentEvent(r).title);
  choose(copy,0);assert.equal(copy.relationships.raina.stage,1);assert.throws(()=>choose(copy,0),/选项/);
  const bad=validPayload(r);bad.run.pending.index=-1;assert.throws(()=>validateSave(bad),/无效/);
});
test('confession requires a story and an explicit reply; friendships remain available',()=>{
  const r=newRun();const rel=r.relationships.raina;Object.assign(rel,{affection:65,trust:60,meetings:4,stage:1,communicated:true});
  for(const id of ['raina','ash'])for(const i of [0,1])r.storyFlags[romanceKey(id,i)]=1;perform(r,'confess','raina');assert.equal(r.pending.id,'confession');assert.equal(rel.status,'friend');
  choose(r,0);assert.equal(r.pending.id,'reply');assert.equal(r.pending.answer,'accepted');assert.equal(rel.status,'friend');
  choose(r,0);assert.equal(rel.status,'sugar');assert.equal(r.notice.answer,'accepted');assert.ok(r.achievements.includes('sugar'));
  Object.assign(r.relationships.ash,{affection:90,trust:90,meetings:5,communicated:true});
  assert.equal(actionReason(r,'confess','ash'),null);
  perform(r,'confess','ash');choose(r,0);assert.equal(r.pending.answer,'rejected');choose(r,0);assert.equal(r.relationships.ash.status,'friend');
  perform(r,'breakup','raina');assert.equal(rel.status,'sugar');choose(r,0);assert.equal(rel.status,'salt');assert.ok(r.achievements.includes('salt'));
});
test('unattended sugar relationships accumulate tension and can end',()=>{
  const r=newRun();Object.assign(r.relationships.raina,{status:'sugar',trust:70,affection:80,tension:70,lastDay:1});
  jump(r,6);assert.equal(r.relationships.raina.status,'salt');assert.equal(r.relationships.raina.drifted,true);
});
test('stable sugar, creation and burnout resolve to different endings',()=>{
  const a=newRun();Object.assign(a.relationships.raina,{status:'sugar',trust:80,affection:80,tension:10,communicated:true});a.stats.balance=70;assert.equal(finish(a).id,'sugar');
  const b=newRun();b.projects.avatar=3;b.projects.world=5;assert.equal(finish(b).id,'creator');
  const c=newRun();c.stats.balance=10;assert.equal(finish(c).id,'burnout');
});
test('settlement is idempotent; three permanent memories apply only to new runs',()=>{
  const r=newRun();jump(r,28);perform(r,'next');assert.equal(r.ended,true);
  const l=freshLegacy();const reward=settle(r,l);assert.ok(reward>=5);assert.equal(settle(r,l),0);assert.equal(l.runs,1);assert.equal(l.points,reward);
  l.points=30;for(const id of ['anchor','blueprint','courage','space'])unlockMemory(l,id);
  for(const id of ['anchor','blueprint','courage'])equipMemory(l,id);
  assert.throws(()=>equipMemory(l,'space'),/最多/);
  const next=startRun({legacy:l,traits:['listener','wanderer']});assert.equal(next.memories.length,3);assert.equal(next.stats.money,180);assert.equal(next.stats.craft,22);assert.equal(r.memories.length,0);
  assert.doesNotThrow(()=>validateSave({version:VERSION,run:r,legacy:l}));
});
test('invalid or unsafe imports are rejected, including unknown IDs and unbounded data',()=>{
  const cases=[p=>p.run.ap=-1,p=>p.run.relationships.raina.stage=10,p=>p.run.world='unknown',p=>p.run.gear=['fake'],p=>p.legacy.equipped=['anchor'],p=>p.run.logs[0].changes=[{label:'x',delta:Infinity}],p=>p.run.pending={type:'event',id:'missing'},p=>p.run.photos=[{day:999,world:'rain',with:null}],p=>delete p.run.counters,p=>p.run.reward='<img src=x>',p=>p.run.settled=true];
  for(const change of cases){const p=validPayload();change(p);assert.throws(()=>validateSave(p),/无效/);}
  assert.doesNotThrow(()=>validateSave({version:VERSION,run:null,legacy:freshLegacy()}));
});
test('20 deterministic complete seasons stay valid with diversified available actions',()=>{
  for(let seed=0;seed<20;seed++){
    const r=startRun({traits:['maker','listener'],seed});
    while(!r.ended){
      resolve(r);
      if(r.ap===0){perform(r,'next');continue;}
      const options=[...WORLD.map(w=>['explore',w.id]),...PEOPLE.flatMap(p=>[['talk',p.id],['date',p.id],['boundary',p.id],['confess',p.id]]),...PEOPLE.flatMap((p,i)=>PEOPLE.slice(i+1).map(other=>['together',p.id+':'+other.id])),...PROJECTS.map(p=>['project',p.id]),['photo'],['rest'],['work']].filter(([a,b])=>!actionReason(r,a,b));
      const pick=options[(r.counters.actions*7+seed*3)%options.length];perform(r,...pick);
      assert.doesNotThrow(()=>validateSave(validPayload(r)));
    }
    assert.equal(r.day,28);assert.equal(r.counters.actions,84);assert.ok(r.ending.id);
  }
});
