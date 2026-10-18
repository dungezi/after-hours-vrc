import test from 'node:test';
import assert from 'node:assert/strict';
import { PEOPLE } from '../dist/data.js';
import { DAILY } from '../dist/daily-stories.js';
import { CIRCLE_SCENES } from '../dist/circle-stories.js';
import { epilogueFor, storyHints } from '../dist/journey.js';
import { VERSION, startRun, freshLegacy, choose, perform, currentEvent, log, finish, settle, validateSave, availableMessages, readMessage } from '../dist/engine.js';
const payload=(run,legacy=freshLegacy())=>({version:VERSION,run,legacy});
function fresh(day=1){const r=startRun({seed:72});while(r.pending)choose(r,0);r.day=day;return r;}
function known(day=6){const r=fresh(day);for(const p of PEOPLE)Object.assign(r.relationships[p.id],{met:true,introduced:true,lastDay:day});return r;}
const pending=id=>{const s=CIRCLE_SCENES.find(s=>s.id===id);return {type:'scene',id:s.id,npc:s.npc,other:s.other};};

test('storybooks preserve original scene text, choices and actual results even after the world changes',()=>{
  const r=fresh(3);for(const id of ['lin','mika'])Object.assign(r.relationships[id],{met:true,introduced:true});
  r.pending=pending('circle-tracking-0');const e=currentEvent(r);choose(r,1);
  const page=r.storybook.at(-1);assert.equal(page.text,e.text);assert.deepEqual(page.options,e.choices.map(c=>c.label));assert.equal(page.choice,1);assert.equal(page.result,e.choices[1].text);
  r.world='orbit';r.relationships.lin.trust=99;assert.equal(page.world,'rain');assert.equal(page.text,e.text);
  assert.doesNotThrow(()=>validateSave(payload(r)));
});

test('ordinary logs may rotate without erasing any archived story',()=>{
  const r=fresh(),original=structuredClone(r.storybook);
  for(let i=0;i<220;i++)log(r,'普通记录 '+i,'一次普通行动');
  assert.equal(r.logs.length,180);assert.deepEqual(r.storybook,original);
  assert.deepEqual(validateSave(payload(r)).run.storybook,original);
});

test('version eight migrates only surviving legacy excerpts and never fabricates original dialogue or locations',()=>{
  const r=fresh();delete r.storybook;const old={version:8,run:r,legacy:freshLegacy()};
  delete old.legacy.books;delete old.legacy.introductions;delete old.legacy.showEffects;
  const copy=validateSave(old);assert.equal(copy.version,VERSION);assert.equal(copy.run.storybook.length,2);
  for(const x of copy.run.storybook){assert.equal(x.partial,true);assert.equal(x.text,'');assert.equal(x.world,null);assert.deepEqual(x.options,[]);}
  assert.equal(copy.legacy.showEffects,false);assert.ok(copy.legacy.introductions.includes('raina'));
});

test('settling retains the last three completed storybooks once and new runs cannot mutate them',()=>{
  const legacy=freshLegacy();for(let i=0;i<4;i++){const r=fresh(28);r.name='航程'+i;finish(r);settle(r,legacy);const n=legacy.books.length;settle(r,legacy);assert.equal(legacy.books.length,n);}
  assert.equal(legacy.books.length,3);assert.equal(legacy.books[0].name,'航程3');assert.equal(legacy.books[2].name,'航程1');
  const next=startRun({legacy});choose(next,0);assert.equal(legacy.books[0].stories.length,2);
  assert.doesNotThrow(()=>validateSave(payload(next,legacy)));
});

test('all eight first-choice forks produce distinct actual later scenes and retain the chosen second-chapter plan',()=>{
  for(const key of ['voice','tracking','fallback','puzzle','return','costume','sugar','handover']){
    const versions=[];
    for(const choice of [0,1]){
      const r=known(14);if(key==='sugar')r.relationships.mika.status='sugar';
      r.pending=pending(`circle-${key}-0`);choose(r,choice);r.day=17;
      r.pending=pending(`circle-${key}-1`);const e=currentEvent(r);versions.push(e);const selected=e.choices[choice].label;choose(r,choice);r.day=20;
      r.pending=pending(`circle-${key}-2`);assert.ok(currentEvent(r).text.includes(selected));choose(r,0);
      assert.equal(r.storybook.at(-2).title,e.title);assert.doesNotThrow(()=>validateSave(payload(r)));
    }
    assert.notEqual(versions[0].title,versions[1].title);assert.notDeepEqual(versions[0].choices.map(c=>c.label),versions[1].choices.map(c=>c.label));
  }
});

test('focused conversation keeps unrelated group messages for later without spending another action to read',()=>{
  const r=known(6);perform(r,'talk','lin');assert.ok(['lin','mika'].includes(r.pending.npc));assert.notEqual(r.pending.id,'group-welcome');
  const messages=availableMessages(r);assert.ok(messages.length);assert.throws(()=>readMessage(r,messages[0].index));
  while(r.pending)choose(r,0);const ap=r.ap,energy=r.stats.energy;
  const copy=validateSave(payload(r)).run;const m=availableMessages(copy)[0];assert.ok(m);readMessage(copy,m.index);assert.equal(copy.pending.id,'group-welcome');
  choose(copy,0);assert.equal(copy.ap,ap);assert.equal(copy.stats.energy,energy);assert.equal(availableMessages(copy).some(x=>x.title===m.title),false);
});

test('optional messages still require their original cast and cannot grant unknown acquaintances',()=>{
  const r=fresh(6);r.queue.push({type:'scene',id:'group-welcome',npc:'ash',other:'raina',optional:true});r.relationships.raina.introduced=false;
  assert.equal(availableMessages(r).length,0);assert.throws(()=>readMessage(r,0));
  const bad=payload(known());bad.run.queue.push({type:'scene',id:'confession',npc:'raina',optional:true});assert.throws(()=>validateSave(bad));
});

test('hints give exact cross-night dates but do not disclose unread plot or bypass contact boundaries',()=>{
  const r=known(3);r.pending=pending('circle-tracking-0');choose(r,0);r.day=4;
  const clue=storyHints(r,'lin').find(x=>x.title.includes('脚底下'));assert.match(clue.text,/第 6 夜/);assert.equal(clue.text.includes('天花板'),false);
  r.day=6;assert.match(storyHints(r,'lin').find(x=>x.title.includes('脚底下')).text,/新的消息/);
  assert.deepEqual(storyHints({...r,ended:true}),[]);
});

test('a deferred daily chapter is archived as the actual decision and remains available tomorrow',()=>{
  const r=fresh(),id='daily-world-rain-0';r.pending={type:'scene',id};choose(r,2);
  assert.equal(r.storySeen.includes(id),false);assert.equal(r.storybook.at(-1).choice,2);assert.match(storyHints(r).at(-1).text,/下一夜/);
  r.day=2;r.pending={type:'scene',id};choose(r,1);assert.equal(r.storySeen.includes(id),true);assert.equal(r.storybook.filter(x=>x.id===id).length,2);
});

test('epilogues reflect real friends, completed projects, pending feelings and contact restrictions together',()=>{
  const r=known(28);r.relationships.raina.status='salt';r.departures['player:raina']={contact:'none'};r.relationships.ash.stage=2;r.projects.world=5;
  r.relationships.mika.intent={state:'waiting'};const text=epilogueFor(r).map(e=>e.title+' '+e.text).join('\n');
  assert.match(text,/暂不联系/);assert.match(text,/向导的休息栏/);assert.match(text,/你留下的作品/);assert.match(text,/没有把等待改成默认答应/);assert.equal(text.includes('突然复合了'),false);
});

test('archive import rejects oversized, future, malformed and invalid-choice records',()=>{
  for(const mutate of [x=>x.run.storybook[0].day=29,x=>x.run.storybook[0].choice=9,x=>x.run.storybook[0].cast=['unknown'],x=>x.run.storybook[0].text='a'.repeat(8001),x=>x.legacy.showEffects='yes',x=>x.legacy.books=Array(4).fill({})]){
    const x=payload(fresh());mutate(x);assert.throws(()=>validateSave(x));
  }
});

test('an already-settled old journey retains its surviving storybook when starting the next run',()=>{
  const r=fresh(28),legacy=freshLegacy();finish(r);settle(r,legacy);delete r.storybook;
  delete legacy.books;delete legacy.introductions;delete legacy.showEffects;
  const copy=validateSave({version:8,run:r,legacy});assert.equal(copy.legacy.books.length,1);
  assert.ok(copy.legacy.books[0].stories.every(x=>x.partial));
  const next=startRun({legacy:copy.legacy});choose(next,0);assert.equal(copy.legacy.books.length,1);
});
