import test from 'node:test';
import assert from 'node:assert/strict';
import { PEOPLE } from '../dist/data.js';
import { DAILY, dailyReady } from '../dist/daily-stories.js';
import { dailyLineKey, DAILY_ALTERNATIVES } from '../dist/daily-branches.js';
import { LIFE_SCENES, advanceLives, lifeReady, lifeScene } from '../dist/life-stories.js';
import { THEMES, ENCORE_SCENES, encoreReady } from '../dist/replay-stories.js';
import { VERSION, startRun, freshLegacy, choose, currentEvent, perform, finish, settle, availableMessages, readMessage, validateSave } from '../dist/engine.js';
import { epilogueFor } from '../dist/journey.js';
const payload=(run,legacy=freshLegacy())=>({version:VERSION,run,legacy});
function fresh(day=1,legacy=freshLegacy(),theme=null){const r=startRun({seed:64,legacy,theme});while(r.pending)choose(r,0);r.day=day;return r;}
function know(r){for(const p of PEOPLE)Object.assign(r.relationships[p.id],{met:true,introduced:true,meetings:10});}
function drain(r){let guard=0;while(r.pending&&guard++<30){if(r.notice)r.notice=null;choose(r,0);}assert.ok(guard<30);}
function next(r){drain(r);r.notice=null;perform(r,'next');drain(r);}
const lifePending=(npc,index)=>({type:'scene',id:`life-${npc}-${index}`,npc});
const themePending=(id,index)=>{const t=THEMES.find(t=>t.id===id);return {type:'scene',id:`encore-${id}-${index}`,npc:t.cast[0],other:t.cast[1]};};

test('all twelve old daily lines now fork into sixty distinct alternative chapters with real outcomes',()=>{
  assert.equal(Object.values(DAILY_ALTERNATIVES).flat().length,60);
  for(const first of DAILY.filter(s=>s.index===0)){
    const versions=[];
    for(const root of [0,1]){
      const r=fresh();know(r);const chapters=DAILY.filter(s=>dailyLineKey(s)===dailyLineKey(first));const snapshots=[];
      for(const s of chapters){r.day=1+s.index*3;assert.equal(dailyReady(r,s),true);r.pending={type:'scene',id:s.id,...(s.npc?{npc:s.npc}:{})};const e=currentEvent(r);snapshots.push(e);choose(r,s.index?0:root);}
      assert.equal(r.dailyPaths[dailyLineKey(first)],root);assert.doesNotThrow(()=>validateSave(payload(r)));versions.push(snapshots);
    }
    for(let i=1;i<6;i++){assert.notEqual(versions[0][i].title,versions[1][i].title);assert.notEqual(versions[0][i].text,versions[1][i].text);assert.notDeepEqual(versions[0][i].choices.slice(0,2).map(c=>c.label),versions[1][i].choices.slice(0,2).map(c=>c.label));}
  }
});

test('version nine preserves read daily continuity and starts independent lives only at the upgrade night',()=>{
  const r=fresh();r.pending={type:'scene',id:'daily-world-rain-0'};choose(r,1);r.day=15;
  const before=r.storybook.at(-1).text;const copy=validateSave({version:9,run:r,legacy:freshLegacy()}).run;
  assert.equal(copy.dailyPaths['daily-world-rain'],0);assert.equal(copy.storybook.at(-1).text,before);
  for(const l of Object.values(copy.lives)){assert.equal(l.anchor,15);assert.equal(l.milestones.length,0);}
  assert.equal(copy.encore.route,null);
});

test('NPC goals progress during nights with no conversation and never silently establish relationships',()=>{
  const r=fresh();while(r.day<22)next(r);
  assert.ok(Object.values(r.lives).some(l=>l.plan.state==='paused'));assert.ok(Object.values(r.lives).some(l=>l.milestones.length===3));
  for(const id of PEOPLE.map(p=>p.id)){assert.ok(r.lives[id].milestones.length>=1);assert.equal(r.relationships[id].meetings,0);assert.equal(r.relationships[id].status,'friend');assert.equal(r.lives[id].read,0);}
  assert.equal(Object.keys(r.npcBonds).length,0);assert.doesNotThrow(()=>validateSave(payload(r)));
});

test('unintroduced NPCs have private lives without leaking their identities into messages',()=>{
  const r=fresh(4);advanceLives(r);const messages=availableMessages(validateSave(payload(r)).run);
  assert.ok(messages.length>0);assert.ok(messages.every(m=>!m.title.includes('纸鸟')));
  assert.equal(lifeReady(r,LIFE_SCENES.find(s=>s.id==='life-yuki-0')),false);
  const rain=lifeScene(r,lifePending('raina',0));assert.equal(rain.other,undefined);assert.equal(rain.text.includes('零点'),false);
});

test('life milestones can be heard across nights but cannot be skipped or replayed for rewards',()=>{
  const r=fresh(4);r.lives.raina.plan.temper=0;advanceLives(r);r.pending=lifePending('raina',0);choose(r,2);const ap=r.ap;
  r.day=11;advanceLives(r);assert.equal(lifeReady(r,LIFE_SCENES.find(s=>s.id==='life-raina-1')),true);
  r.pending=lifePending('raina',2);assert.throws(()=>choose(r,0));r.pending=lifePending('raina',1);choose(r,2);
  assert.equal(r.ap,ap);r.pending=lifePending('raina',1);assert.throws(()=>choose(r,0));r.pending=null;
  assert.deepEqual(r.lives.raina.heard,[4,11]);assert.doesNotThrow(()=>validateSave(payload(r)));
});

test('support may change a future goal while preserving the exact earlier milestone',()=>{
  const r=fresh(4);r.lives.raina.path=0;r.lives.raina.plan.temper=0;r.relationships.raina.trust=60;advanceLives(r);
  r.pending=lifePending('raina',0);choose(r,1);assert.equal(r.lives.raina.path,1);assert.equal(r.lives.raina.milestones[0].path,0);
  r.day=11;advanceLives(r);r.pending=lifePending('raina',1);assert.match(currentEvent(r).text,/改方向后的新进展/);assert.match(currentEvent(r).title,/长椅/);choose(r,2);
  assert.equal(r.lives.raina.milestones[0].path,0);assert.doesNotThrow(()=>validateSave(payload(r)));
});

test('independent characters can decline advice, and old news cannot rewrite goals already completed',()=>{
  const r=fresh(4);know(r);r.lives.rei.path=0;r.lives.rei.plan.temper=0;r.relationships.rei.trust=10;advanceLives(r);
  r.pending=lifePending('rei',0);assert.match(currentEvent(r).choices[1].text,/没有直接替对方改变/);choose(r,1);assert.equal(r.lives.rei.path,0);
  r.day=11;advanceLives(r);r.day=20;advanceLives(r);r.relationships.rei.trust=99;
  r.pending=lifePending('rei',1);assert.equal(currentEvent(r).choices[1].lifePath,null);choose(r,1);assert.equal(r.lives.rei.path,0);
});

test('life news respects no-contact boundaries and never forces a reunion',()=>{
  const r=fresh(4);advanceLives(r);r.relationships.raina.status='salt';
  r.departures['player:raina']={resolution:'ended',contact:'none'};
  assert.equal(lifeReady(r,LIFE_SCENES.find(s=>s.id==='life-raina-0')),false);
  assert.equal(availableMessages(r).some(m=>m.title==='第一篇不是约会攻略'),false);
  r.day=11;assert.equal(advanceLives(r).some(x=>x.npc==='raina'),false);
  assert.equal(epilogueFor(r).some(x=>x.title.startsWith('雨音自己的后来')),false);
});

test('settling unlocks real new themes, and incomplete or repeated settlement cannot mint extra progress',()=>{
  const legacy=freshLegacy(),r=fresh(28);r.projects.world=5;r.projects.event=4;r.visited=['rain','cafe','orbit','club','garden','studio'];
  assert.throws(()=>settle(r,legacy));assert.deepEqual(legacy.themesUnlocked,[]);finish(r);settle(r,legacy);
  for(const id of ['quiet','workshop','gathering','paths'])assert.ok(legacy.themesUnlocked.includes(id));
  const before=structuredClone(legacy);settle(r,legacy);assert.deepEqual(legacy,before);
  assert.throws(()=>startRun({legacy:freshLegacy(),theme:'workshop'}));
  const replay=startRun({legacy,theme:'workshop'});assert.equal(replay.encore.route,'workshop');assert.ok(Object.values(replay.relationships).every(x=>x.status==='friend'));
});

test('all six themes contain three new ordered chapters and remember both earlier decisions',()=>{
  for(const t of THEMES){
    const legacy=freshLegacy();legacy.themesUnlocked=[t.id];const r=fresh(4,legacy,t.id);know(r);
    const first=ENCORE_SCENES.find(s=>s.id===`encore-${t.id}-0`),second=ENCORE_SCENES.find(s=>s.id===`encore-${t.id}-1`);
    assert.equal(encoreReady(r,first),true);assert.equal(encoreReady(r,second),false);
    r.pending=themePending(t.id,0);choose(r,1);r.day=11;r.pending=themePending(t.id,1);assert.ok(currentEvent(r).text.includes(t.branches[1][0]));
    const label=currentEvent(r).choices[2].label;choose(r,2);r.day=18;r.pending=themePending(t.id,2);assert.ok(currentEvent(r).text.includes(label));choose(r,0);
    assert.deepEqual(r.encore.choices,[1,2,0]);assert.doesNotThrow(()=>validateSave(payload(r,legacy)));
    r.day=28;finish(r);settle(r,legacy);assert.ok(legacy.themesCompleted.includes(t.id));
    assert.ok(legacy.books[0].epilogue.some(e=>e.title==='本轮主题 · '+t.name));
  }
});

test('a theme cannot bypass introductions or cross-night timing, nor mark an unfinished route completed',()=>{
  const l=freshLegacy();l.themesUnlocked=['workshop'];const r=fresh(4,l,'workshop');const s=ENCORE_SCENES.find(s=>s.id==='encore-workshop-0');
  assert.equal(encoreReady(r,s),false);know(r);assert.equal(encoreReady(r,s),true);r.pending=themePending('workshop',0);choose(r,0);
  r.day=5;r.pending=themePending('workshop',1);assert.throws(()=>choose(r,0));r.pending=null;r.day=28;finish(r);settle(r,l);assert.equal(l.themesCompleted.includes('workshop'),false);
  assert.match(epilogueFor(r).find(e=>e.title.includes('本轮主题')).text,/不补造剩余经历/);
});

test('legacy endings unlock suitable themes without inheriting their people or sugar relationships',()=>{
  const legacy=freshLegacy();legacy.runs=3;legacy.endings=['creator','sugar','goodbye'];
  const r=fresh(12);const copy=validateSave({version:9,run:r,legacy});
  for(const id of ['quiet','workshop','letters','renewal'])assert.ok(copy.legacy.themesUnlocked.includes(id));
  assert.equal(copy.run.encore.route,null);assert.ok(Object.values(copy.run.relationships).every(x=>x.status==='friend'));
});

test('malformed goal history, future heard dates, locked themes and forged daily routes are rejected',()=>{
  for(const mutate of [x=>x.run.lives.raina.anchor=29,x=>x.run.lives.raina.milestones=[{day:1,path:0}],x=>x.run.lives.raina.read=1,x=>x.run.lives.raina.heard=[1],x=>x.run.encore.route='workshop',x=>x.legacy.themesCompleted=['quiet'],x=>x.run.dailyPaths['daily-world-rain']=1]){
    const x=payload(fresh());mutate(x);assert.throws(()=>validateSave(x));
  }
});

test('optional life and theme messages survive reloads and cost no additional action to open',()=>{
  const legacy=freshLegacy();legacy.themesUnlocked=['quiet'];let r=fresh(4,legacy,'quiet');advanceLives(r);
  r=validateSave(payload(r,legacy)).run;const messages=availableMessages(r);assert.ok(messages.length>=3);
  const m=messages.find(m=>m.title==='空白日程的第一格');assert.ok(m);const ap=r.ap;readMessage(r,m.index);choose(r,0);assert.equal(r.ap,ap);
  assert.doesNotThrow(()=>validateSave(payload(r,legacy)));
});

test('a complete replay season preserves autonomy and archived branches through every saved reload',()=>{
  const legacy=freshLegacy();legacy.themesUnlocked=['quiet'];let r=fresh(1,legacy,'quiet');know(r);let steps=0;
  while(!r.ended&&steps++<160){
    if(r.notice)r.notice=null;
    if(r.pending)choose(r,0);
    else {const m=availableMessages(r).find(m=>currentTitleIsTheme(m.title)||m.title.includes('札记'));if(m)readMessage(r,m.index);else perform(r,'next');}
    r=validateSave(payload(r,legacy)).run;
  }
  assert.equal(r.ended,true);assert.equal(r.encore.days.length,3);assert.ok(r.lives.rei.milestones.length===3);settle(r,legacy);assert.ok(legacy.themesCompleted.includes('quiet'));
  function currentTitleIsTheme(title){return /空白日程|留下的时间|这一周不按/.test(title);}
});

test('witnessed NPC relationships can unlock new themes without making the player a partner',()=>{
  const r=fresh(28),legacy=freshLegacy();know(r);
  r.npcBonds['lin:mika']={status:'salt',stage:3,trust:45,tension:20,sinceDay:5,lastDay:20,initiator:'lin',open:false,outlook:'steady'};
  finish(r);settle(r,legacy);assert.ok(legacy.themesUnlocked.includes('letters'));assert.ok(legacy.themesUnlocked.includes('renewal'));
  assert.ok(Object.values(r.relationships).every(x=>x.status==='friend'));
});
