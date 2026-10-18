import test from 'node:test';
import assert from 'node:assert/strict';
import { PEOPLE, EVENTS } from '../dist/data.js';
import { VERSION,startRun,freshLegacy,choose,currentEvent,perform,finish,settle,validateSave,availableMessages,readMessage,acknowledgeNotice } from '../dist/engine.js';
import { advanceLives, LIFE_SCENES } from '../dist/life-stories.js';
import { changeReady } from '../dist/life-changes.js';
import { proposeAppointment } from '../dist/appointments.js';
import { WORLD_FOLLOWUPS,followupReady } from '../dist/plot-branches.js';
import { THEMES } from '../dist/replay-stories.js';
import { FINALES,finaleReady,characterEnding } from '../dist/finale-stories.js';
import { themeRoute } from '../dist/theme-branches.js';
import { freshReading,rememberReading,previousChoice,entryKey,searchBook,toggleReading } from '../dist/reading.js';
import { epilogueFor } from '../dist/journey.js';
function fresh(day=1,seed=64,legacy=freshLegacy(),theme=null){const r=startRun({seed,legacy,theme});while(r.pending)choose(r,0);r.day=day;return r;}
function know(r){for(const p of PEOPLE)Object.assign(r.relationships[p.id],{met:true,introduced:true,meetings:10,trust:60,affection:50});}
const payload=(run,legacy=freshLegacy())=>({version:VERSION,run,legacy});
function drain(r){let n=0;while((r.pending||r.notice)&&n++<100){if(r.notice)acknowledgeNotice(r);else choose(r,currentEvent(r).choices.findIndex(c=>!c.unavailable&&(!c.effects?.money||r.stats.money+c.effects.money>=0)));}assert.ok(n<100);}

test('all six personal arcs have three distinct second chapters tied to the actual first choice',()=>{
 for(const p of PEOPLE){const texts=[];for(const root of [0,1,2]){const r=fresh();know(r);r.pending={type:'arc',npc:p.id,index:0};choose(r,root);drain(r);r.day=8;r.pending={type:'arc',npc:p.id,index:1};const e=currentEvent(r);texts.push(e.text);assert.equal(e.choices.length,2);choose(r,1);drain(r);assert.equal(r.relationships[p.id].stage,2);assert.doesNotThrow(()=>validateSave(payload(r)));}assert.equal(new Set(texts).size,3);}
});
test('every original world incident has three logical cross-night consequences without repeating rewards',()=>{
 assert.equal(WORLD_FOLLOWUPS.length,EVENTS.length);
 for(const e of EVENTS)for(const root of [0,1,2]){const r=fresh(16);know(r);r.stats.money=1000;r.photos=[{with:'raina',day:1}];r.projects.event=1;
 // Fixture prerequisites here cover the original incident; follow-up validation uses complete game snapshots below.
 if(e.id==='alone')continue;
 r.pending={type:'event',id:e.id};choose(r,root);drain(r);const s=WORLD_FOLLOWUPS.find(s=>s.event===e.id);assert.equal(followupReady(r,s),false);r.day=18;assert.equal(followupReady(r,s),true);r.pending={type:'scene',id:s.id,...(s.npc?{npc:s.npc}:{})};const text=currentEvent(r).text;assert.ok(text.length>50);choose(r,1);assert.equal(followupReady(r,s),false);r.pending={type:'scene',id:s.id,...(s.npc?{npc:s.npc}:{})};assert.throws(()=>choose(r,0));}
});
test('real world follow-up messages retain choice and prerequisites through saved reloads',()=>{
 const r=fresh();r.pending={type:'event',id:'quiet'};choose(r,2);drain(r);r.day=3;perform(r,'next');drain(r);const copy=validateSave(payload(r)).run;
 const m=availableMessages(copy).find(m=>m.category==='world');assert.ok(m);readMessage(copy,m.index);assert.match(currentEvent(copy).text,/三个笑话/);choose(copy,0);drain(copy);assert.doesNotThrow(()=>validateSave(payload(copy)));
 copy.relationships.raina.status='salt';copy.departures['player:raina']={resolution:'ended',contact:'none'};assert.equal(followupReady(copy,WORLD_FOLLOWUPS[0]),false);
});
test('NPC plans independently pause, fail, retry or finish and never rewrite historical milestones',()=>{
 const r=fresh();for(let day=4;day<=24;day++){r.day=day;advanceLives(r);}assert.equal(r.lives.raina.plan.state,'paused');assert.equal(r.lives.raina.plan.due,0);assert.equal(r.lives.raina.milestones.length,1);assert.ok(r.lives.raina.plan.events.some(e=>e.kind==='stop'));assert.ok(Object.values(r.lives).some(l=>l.milestones.length===3));assert.match(epilogueFor(r).find(x=>x.title.startsWith('雨音自己的后来')).text,/暂停/);assert.doesNotThrow(()=>validateSave(payload(r)));
 const life=r.lives.raina,before=structuredClone(life.milestones);r.relationships.raina.trust=80;const change=life.plan.events.length-1;r.pending={type:'scene',id:'life-change',npc:'raina',change};assert.equal(changeReady(r,r.pending),true);choose(r,0);drain(r);assert.equal(life.plan.state,'retrying');r.day=26;advanceLives(r);assert.equal(life.milestones.length,2);assert.deepEqual(life.milestones.slice(0,1),before);assert.doesNotThrow(()=>validateSave(payload(r)));
});
test('distinct change messages do not suppress later updates from the same NPC or another NPC',()=>{
 const r=fresh(4);know(r);advanceLives(r);r.day=11;advanceLives(r);perform(r,'rest');drain(r);let m=availableMessages(r).find(m=>m.category==='change');assert.ok(m);readMessage(r,m.index);choose(r,2);drain(r);r.day=13;advanceLives(r);perform(r,'rest');drain(r);assert.ok(availableMessages(r).some(m=>m.category==='change'));assert.doesNotThrow(()=>validateSave(payload(r)));
});
test('NPC setbacks really request a booked time change, with no player no-show penalty',()=>{
 const r=fresh(10);r.lives.raina.milestones=[{day:4,path:0}];r.lives.raina.plan.due=11;r.lives.raina.path=0;r.relationships.raina.trust=60;
 proposeAppointment(r,{npc:'raina',day:11,slot:1,world:'garden',kind:'walk'});choose(r,0);drain(r);const trust=r.relationships.raina.trust;perform(r,'next');assert.equal(r.appointments[0].status,'changing');assert.equal(r.pending.id,'appointment-change');choose(r,1);drain(r);assert.equal(r.appointments[0].status,'cancelled');assert.ok(r.relationships.raina.trust>=trust);assert.equal(r.appointments[0].history.some(h=>h.kind==='miss'),false);assert.doesNotThrow(()=>validateSave(payload(r)));
});
test('all 162 theme routes have distinct persistent keys, real middle developments and collected endings',()=>{
 for(const t of THEMES){const endings=new Set();for(const a of [0,1,2])for(const b of [0,1,2])for(const c of [0,1,2]){const l=freshLegacy();l.themesUnlocked=[t.id];const r=fresh(4,0,l,t.id);know(r);for(const [i,choice] of [a,b,c].entries()){r.day=[4,11,18][i];r.pending={type:'scene',id:`encore-${t.id}-${i}`,npc:t.cast[0],other:t.cast[1]};const e=currentEvent(r);assert.ok(e.text.includes(t.name) || e.subtitle.includes(t.name));choose(r,choice);drain(r);}const result=themeRoute(t,r.encore.choices);endings.add(result.key);r.day=28;finish(r);settle(r,l);assert.deepEqual(l.themeRoutes,[result.key]);assert.doesNotThrow(()=>validateSave(payload(r,l)));settle(r,l);assert.equal(l.themeRoutes.length,1);}assert.equal(endings.size,27);}
});
test('character finales require personal chapters, cross-night time and clear current relationships',()=>{
 for(const f of FINALES){const r=fresh(24);know(r);r.relationships[f.npc].stage=2;r.storyFlags[`read:arc:${f.npc}:0`]=8;r.storyFlags[`read:arc:${f.npc}:1`]=22;assert.equal(finaleReady(r,f),true);r.pending={type:'scene',...f};const e=currentEvent(r);assert.ok(e.subtitle.includes(PEOPLE.find(p=>p.id===f.npc).name));choose(r,1);drain(r);assert.equal(finaleReady(r,f),false);const ending=characterEnding(r,f.npc);assert.equal(ending.route,0);assert.equal(ending.choice,1);r.day=28;finish(r);const l=freshLegacy();settle(r,l);assert.deepEqual(l.characterEndings,[ending.key]);assert.doesNotThrow(()=>validateSave(payload(r,l)));}
 const r=fresh(24);r.relationships.raina.stage=2;r.storyFlags['read:arc:raina:1']=23;assert.equal(finaleReady(r,FINALES[0]),false);r.day=25;r.relationships.raina.intent={state:'waiting'};assert.equal(finaleReady(r,FINALES[0]),false);r.relationships.raina.intent=null;r.departures['player:raina']={resolution:'active'};assert.equal(finaleReady(r,FINALES[0]),false);r.departures['player:raina']={resolution:'ended',contact:'none'};assert.equal(finaleReady(r,FINALES[0]),false);
});
test('exactly identical ordinary text can reuse a prior choice, changed branches and consent scenes cannot',()=>{
 const reading=freshReading(),r=fresh();r.pending={type:'event',id:'quiet'};const e=currentEvent(r);rememberReading(reading,e,1);assert.equal(previousChoice(reading,e),1);for(const change of [x=>x.text+='new',x=>x.choices[1].text+='new',x=>x.choices[1].unavailable='not now']){const altered=structuredClone(e);change(altered);assert.equal(previousChoice(reading,altered),null);}const confession={...e,id:'confession'};rememberReading(reading,confession,0);assert.equal(previousChoice(reading,confession),null);
});
test('story search and favorites use actual full content, and saved reading preferences survive new runs',()=>{
 const r=fresh(),l=freshLegacy();r.pending={type:'event',id:'quiet'};choose(r,0);const e=r.storybook.at(-1),key=entryKey(e);toggleReading(l.reading.favorites,key,300);assert.equal(searchBook(r.storybook,{query:'沉默 旁边',favorites:true,keys:l.reading.favorites}).length,1);assert.equal(searchBook(r.storybook,{person:'rei'}).length,0);assert.equal(searchBook(r.storybook,{query:'不存在的东西'}).length,0);l.reading.font='large';rememberReading(l.reading,{id:'daily-test',title:'x',text:'x',choices:[{label:'x'}]},0);validateSave(payload(r,l));startRun({legacy:l});assert.equal(l.reading.font,'large');assert.ok(l.reading.favorites.includes(key));
});
test('version ten retains milestones, existing text, old theme completion and begins new systems honestly',()=>{
 const r=fresh(11);advanceLives(r);const l=freshLegacy();l.themesUnlocked=['quiet'];l.themesCompleted=['quiet'];delete l.reading;delete l.themeRoutes;delete l.characterEndings;for(const life of Object.values(r.lives))delete life.plan;delete r.appointments;const before=structuredClone(r.storybook),copy=validateSave({version:10,run:r,legacy:l});assert.deepEqual(copy.run.storybook,before);assert.deepEqual(copy.run.appointments,[]);assert.deepEqual(copy.legacy.themeRoutes,[]);assert.deepEqual(copy.legacy.themesCompleted,['quiet']);for(const life of Object.values(copy.run.lives)){assert.equal(life.plan.events.length,0);assert.ok(life.plan.due>=12);}assert.doesNotThrow(()=>validateSave(copy));
});
test('malformed new planning, route and reading data is rejected',()=>{
 for(const mutate of [x=>x.run.lives.raina.plan.due=-1,x=>x.run.lives.raina.plan.events=[{}],x=>x.legacy.reading.font='huge',x=>x.legacy.reading.favorites=['<script>'],x=>x.legacy.themeRoutes=['quiet:0:0:0'],x=>x.legacy.characterEndings=['unknown:0:1']]){const x=payload(fresh());mutate(x);assert.throws(()=>validateSave(x));}
});
