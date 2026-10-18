import test from 'node:test';
import assert from 'node:assert/strict';
import { PEOPLE } from '../dist/data.js';
import { GROUPS, SCENE_IDS } from '../dist/stories.js';
import { CIRCLE_LINES, CIRCLE_SCENES, circleReady, circleFor, circleScene } from '../dist/circle-stories.js';
import { beginDeparture } from '../dist/separation-stories.js';
import { VERSION, startRun, freshLegacy, currentEvent, choose, perform, validateSave, online } from '../dist/engine.js';

const payload=run=>({version:VERSION,run,legacy:freshLegacy()});
const scene=id=>CIRCLE_SCENES.find(s=>s.id===id);
const pending=s=>({type:'scene',id:s.id,npc:s.npc,other:s.other});
function fresh(day=8) {
  const r=startRun({seed:964});while(r.pending)choose(r,0);r.day=day;
  for(const p of PEOPLE)Object.assign(r.relationships[p.id],{met:true,introduced:true});
  return r;
}

test('eight original circle lines contain 24 distinct three-choice chapters and all are registered',()=>{
  assert.equal(CIRCLE_LINES.length,8);assert.equal(CIRCLE_SCENES.length,24);
  assert.equal(new Set(CIRCLE_SCENES.map(s=>s.title)).size,24);
  assert.equal(new Set(CIRCLE_SCENES.flatMap(s=>s.branches.map(b=>b[1]))).size,72);
  assert.ok(CIRCLE_SCENES.every(s=>SCENE_IDS.includes(s.id)));
  for(const s of CIRCLE_SCENES)assert.equal(circleScene(fresh(28),pending(s)).choices.length,3);
});

test('all lines require introductions and two cross-night prerequisites, without replay rewards',()=>{
  for(const line of CIRCLE_LINES) {
    const r=fresh(line.day);if(line.sugar)r.relationships.raina.status='sugar';
    const chapters=CIRCLE_SCENES.filter(s=>s.line===line);
    assert.equal(circleReady(r,chapters[1]),false);
    r.relationships[line.cast[1]].introduced=false;assert.equal(circleReady(r,chapters[0]),false);
    r.relationships[line.cast[1]].introduced=true;
    for(const s of chapters) {
      if(s.index) {r.day++;assert.equal(circleReady(r,s),false);r.day+=2;}
      assert.equal(circleReady(r,s),true);r.pending=pending(s);const ap=r.ap;choose(r,s.index%3);
      assert.equal(r.ap,ap);assert.equal(circleReady(r,s),false);
      assert.doesNotThrow(()=>validateSave(payload(r)));
    }
    r.pending=pending(chapters[0]);assert.throws(()=>choose(r,0));
  }
});

test('later chapters recall the actual choice, including a disagreement that remains unresolved',()=>{
  const r=fresh(3),first=scene('circle-tracking-0'),second=scene('circle-tracking-1');
  r.pending=pending(first);choose(r,2);r.day=6;
  const e=circleScene(r,pending(second));assert.ok(e.text.includes(first.branches[2][0]));assert.match(e.text,/没能谈妥/);
  const copy=validateSave(payload(r)).run;assert.equal(copy.storyFlags['choice:'+first.id],2);
});

test('exploration discovers a local circle and chat can continue it from another world',()=>{
  const r=fresh(3);r.world='club';r.storySeen.push(...GROUPS.map(g=>g.id));r.seen=[];
  // 先排除需更高熟悉度的个人线，直接通过真实探索进入新故事。
  perform(r,'explore','club');assert.equal(r.pending?.id,'circle-tracking-0');choose(r,0);
  assert.equal(circleFor(r,'lin','talk'),null);
  r.day=6;r.world='rain';r.ap=3;r.stats.energy=90;r.relationships.lin.lastDay=6;
  assert.equal(online(r,'lin'),true);perform(r,'talk','lin');assert.equal(r.pending.id,'circle-tracking-1');
  assert.match(currentEvent(r).text,/好友消息和共享记录/);
});

test('one circle chapter per night preserves pacing, while continuations precede unopened lines',()=>{
  const r=fresh(4);r.world='studio';assert.equal(circleFor(r,null,'explore').id,'circle-fallback-0');
  r.pending=pending(scene('circle-fallback-0'));choose(r,0);
  assert.equal(circleFor(r,'yuki','talk'),null);r.day=7;
  assert.equal(circleFor(r,'yuki','talk').id,'circle-fallback-1');
});

test('sugar stories need a confirmed partner and keep that person through later relationship changes',()=>{
  const r=fresh(8),first=scene('circle-sugar-0'),second=scene('circle-sugar-1');
  assert.equal(circleReady(r,first),false);r.relationships.mika.status='sugar';r.pending=pending(first);
  assert.match(currentEvent(r).text,/你和小满/);choose(r,0);
  assert.equal(r.storyFlags['circle-partner:mika'],true);r.day=11;r.relationships.raina.status='sugar';
  assert.match(circleScene(r,pending(second)).text,/小满没有失约/);
  r.relationships.mika.status='salt';assert.equal(circleReady(r,second),false);
  assert.doesNotThrow(()=>validateSave(payload(r)));
});

test('separation and no-contact boundaries postpone relevant circle stories',()=>{
  const r=fresh(8);r.relationships.raina.status='sugar';
  beginDeparture(r,'raina',null,'player');assert.equal(circleReady(r,scene('circle-sugar-0')),false);
  const d=r.departures['player:raina'];d.resolution='ended';d.phase='closed';d.contact='none';r.relationships.raina.status='salt';
  assert.equal(circleFor(r,'raina','talk'),null);assert.equal(circleReady(r,scene('circle-return-0')),false);
});

test('circle choices change both player friendships, NPC familiarity and an existing NPC sugar bond',()=>{
  for(const choice of [0,2]) {
    const r=fresh(3);r.npcBonds['lin:mika']={status:'sugar',stage:2,trust:50,tension:20,sinceDay:1,lastDay:1,initiator:null,open:false,outlook:'steady'};
    r.npcLinks['lin:mika']=10;r.pending=pending(scene('circle-tracking-0'));choose(r,choice);
    assert.equal(r.npcLinks['lin:mika'],choice===2?8:12);
    assert.equal(r.npcBonds['lin:mika'].trust,choice===2?48:52);
    assert.equal(r.npcBonds['lin:mika'].tension,choice===2?23:18);
    for(const id of ['lin','mika'])assert.ok(choice===2?r.relationships[id].tension>0:r.relationships[id].trust>0);
    assert.equal(r.relationships.lin.status,'friend');assert.equal(r.relationships.mika.status,'friend');
  }
});

test('unfinished circle scenes survive a reload, retain casts and discard read queue entries',()=>{
  const r=fresh(3);r.pending=pending(scene('circle-tracking-0'));
  let copy=validateSave(payload(r)).run;assert.equal(currentEvent(copy).id,r.pending.id);choose(copy,1);
  copy.queue.push(pending(scene('circle-tracking-0')));copy=validateSave(payload(copy)).run;assert.equal(copy.queue.length,0);
  r.pending.other='ash';assert.throws(()=>validateSave(payload(r)));
});

test('circle save history rejects skipped chapters, inconsistent dates, missing choices and partner tampering',()=>{
  const r=fresh(3);r.pending=pending(scene('circle-tracking-0'));choose(r,0);r.day=6;
  r.pending=pending(scene('circle-tracking-1'));choose(r,1);
  const mutations=[
    x=>delete x.storyFlags['choice:circle-tracking-0'],
    x=>x.storyFlags['read:circle-tracking-1']=4,
    x=>x.storySeen.splice(x.storySeen.indexOf('circle-tracking-0'),1),
    x=>x.storyFlags['circle-partner:ash']=true,
    x=>x.storyFlags.lastCircleDay=99,
  ];
  for(const mutate of mutations){const x=structuredClone(r);mutate(x);assert.throws(()=>validateSave(payload(x)));}
});

test('existing version-eight saves need no reset or invented new stories',()=>{
  const r=fresh();r.stats.energy=17;r.photos=[];const copy=validateSave(payload(r)).run;
  assert.equal(copy.stats.energy,17);assert.equal(copy.storySeen.some(id=>id.startsWith('circle-')),false);
  assert.equal(Object.keys(copy.storyFlags).some(k=>k.startsWith('circle-partner:')),false);
});
