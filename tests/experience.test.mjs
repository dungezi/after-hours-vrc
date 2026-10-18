import test from 'node:test';
import assert from 'node:assert/strict';
import { PEOPLE } from '../dist/data.js';
import { VERSION,startRun,freshLegacy,choose,currentEvent,perform,finish,settle,validateSave,availableMessages,readMessage,acknowledgeNotice,apply,previewRelations } from '../dist/engine.js';
import { markLetterRead,endingReview } from '../dist/wrapup.js';
import { freshLedger } from '../dist/relationship-rhythm.js';
import { proposeAppointment } from '../dist/appointments.js';
import { appointmentChapter } from '../dist/appointment-chapters.js';
import { THEMES } from '../dist/replay-stories.js';
import { TURN_SCENES,turnReady } from '../dist/theme-turns.js';
import { firstNightGuide } from '../dist/first-nights.js';
import { SMALL_TALK,arcReply,lifeChangeVoice } from '../dist/character-voices.js';
function drain(r){let n=0;while((r.pending||r.notice)&&n++<100){if(r.notice)acknowledgeNotice(r);else choose(r,currentEvent(r).choices.findIndex(c=>!c.unavailable&&(!c.effects?.money||r.stats.money+c.effects.money>=0)));}assert.ok(n<100);}
function fresh(day=1,legacy=freshLegacy(),theme=null){const r=startRun({seed:64,legacy,theme});drain(r);r.day=day;return r;}
function known(r){for(const p of PEOPLE)Object.assign(r.relationships[p.id],{met:true,introduced:true,meetings:10,trust:60,affection:45});}
const payload=(run,legacy=freshLegacy())=>({version:VERSION,run,legacy});

test('ending an evening seals only currently available messages and permits read-only letters after settlement',()=>{
 const r=fresh(28),l=freshLegacy();Object.assign(r.relationships.raina,{stage:2,trust:70,affection:50,meetings:8});r.storyFlags['read:arc:raina:0']=8;r.storyFlags['read:arc:raina:1']=20;perform(r,'rest');drain(r);const ready=availableMessages(r);assert.ok(ready.some(m=>m.category==='finale'));perform(r,'next');drain(r);if(!r.ended)perform(r,'next');settle(r,l);assert.ok(r.letters.some(x=>x.id==='finale-raina'));const original=structuredClone({stats:r.stats,relationships:r.relationships,choices:r.storyFlags,ending:r.ending,reward:r.reward,count:r.storyCount,stories:r.storybook,points:l.points,routes:l.themeRoutes});
 const state=payload(r,l);const i=r.letters.findIndex(x=>x.id==='finale-raina');const letter=markLetterRead(state,i);assert.equal(letter.read,true);assert.ok(l.books[0].letters.find(x=>x.id==='finale-raina').read);assert.deepEqual({stats:r.stats,relationships:r.relationships,choices:r.storyFlags,ending:r.ending,reward:r.reward,count:r.storyCount,stories:r.storybook,points:l.points,routes:l.themeRoutes},original);assert.doesNotThrow(()=>validateSave(state));
 const future=fresh();finish(future);assert.equal(future.letters.length,0);
});
test('letter archives survive new runs without turning an unread response into a chosen result',()=>{
 const r=fresh(28),l=freshLegacy();r.queue.push({type:'scene',id:'after-quiet',npc:'raina',optional:true});r.seen.push('quiet');r.storyFlags['read:event:quiet']=20;r.storyFlags['choice:event:quiet']=0;finish(r);settle(r,l);assert.equal(r.letters.length,1);const state=payload(fresh(1,l),l);markLetterRead(state,0,0);assert.equal(l.books[0].letters[0].read,true);assert.equal(l.books[0].stories.some(x=>x.id==='after-quiet'),false);assert.doesNotThrow(()=>validateSave(state));
});
test('stable sugar is evaluated independently of a few points of life balance and all outcomes explain each axis',()=>{
 for(const balance of [30,51,55,80]){const r=fresh(28);r.stats.balance=balance;Object.assign(r.relationships.raina,{status:'sugar',trust:85,tension:0});r.projects.avatar=3;const e=finish(r);assert.equal(e.id,'sugar');assert.equal(e.review.length,4);assert.match(e.review[0].title,/稳定/);assert.match(e.review[1].text,new RegExp(String(balance)));assert.match(e.review[2].text,/Avatar/);}
 const r=fresh(28);r.stats.balance=10;Object.assign(r.relationships.raina,{status:'sugar',trust:85,tension:0});assert.equal(finish(r).id,'burnout');assert.match(r.ending.review[0].title,/稳定/);assert.match(r.ending.review[1].title,/休整/);
});
test('positive relationship growth has nightly budgets and free messages have their own small shared allowance',()=>{
 const r=fresh(),id='raina';r.relationLedger=freshLedger(r.day);r.relationships[id].trust=20;r.relationships[id].affection=20;
 const preview=previewRelations(r,id,{trust:6,affection:5},true);apply(r,{},id,{trust:6,affection:5},true);assert.equal(r.relationships[id].trust,20+preview.trust);assert.equal(r.relationships[id].affection,20+preview.affection);assert.equal(preview.trust,2);assert.equal(preview.affection,1);for(let i=0;i<10;i++)apply(r,{},id,{trust:9,affection:9},true);assert.equal(r.relationships[id].trust,22);assert.equal(r.relationships[id].affection,21);
 apply(r,{},id,{trust:20,affection:20});assert.equal(r.relationships[id].trust,34);assert.equal(r.relationships[id].affection,30);apply(r,{},id,{trust:10,affection:10});assert.equal(r.relationships[id].trust,34);apply(r,{},id,{trust:-3,tension:4});assert.equal(r.relationships[id].trust,31);assert.equal(r.relationships[id].tension,4);assert.doesNotThrow(()=>validateSave(payload(r)));r.day=2;apply(r,{},id,{trust:2});assert.equal(r.relationships[id].trust,33);
 const high=fresh();high.relationships.raina.trust=96;high.relationLedger=freshLedger();apply(high,{},'raina',{trust:1});assert.equal(high.relationships.raina.trust,96);
});
test('inbox choices really use the passive allowance rather than the action budget alone',()=>{
 const r=fresh(4);r.relationships.raina.trust=20;r.relationLedger=freshLedger(4);r.queue.push({type:'scene',id:'after-quiet',npc:'raina',optional:true});r.seen=['quiet'];r.storyFlags['read:event:quiet']=1;r.storyFlags['choice:event:quiet']=0;const before=r.relationships.raina.trust;readMessage(r,r.queue.findIndex(x=>x.id==='after-quiet'));choose(r,0);assert.equal(r.relationships.raina.trust-before,2);assert.equal(r.relationLedger.messages.raina.trust,2);assert.equal(r.ap,3);
});
test('each friend has three appointment chapters, actual keepsakes and callbacks rather than repeated greetings',()=>{
 for(const p of PEOPLE){const r=fresh();known(r);const titles=[];for(let i=0;i<3;i++){r.day=[1,3,7,8,10,14,15].find(day=>day>=(i? r.day+1:1)&&p.available.includes(day%7))||21;r.nightActions=0;r.ap=3;r.stats.energy=100;proposeAppointment(r,{npc:p.id,day:r.day,slot:1,world:'garden',kind:'walk'});choose(r,0);drain(r);const a=r.appointments.at(-1);perform(r,'attend',a.id);const e=currentEvent(r);titles.push(e.title);if(i)assert.ok(e.text.includes(r.appointments[i-1].memento.title));choose(r,i%2);drain(r);assert.ok(a.memento);assert.equal(a.memento.day,r.day);assert.equal(a.memento.text,r.storybook.findLast(x=>x.id==='appointment-meet').result.trim());}assert.equal(new Set(titles).size,3);assert.doesNotThrow(()=>validateSave(payload(r)));}
});
test('shortened appointments do not invent a keepsake or consume a full shared chapter',()=>{
 const r=fresh();known(r);proposeAppointment(r,{npc:'raina',day:1,slot:1,world:'rain',kind:'walk'});choose(r,0);perform(r,'attend','a1');choose(r,2);assert.equal(r.appointments[0].memento,undefined);assert.equal(appointmentChapter(r,{cast:['raina'],kind:'walk',world:'rain'}).index,0);
});
test('all eighteen mutually exclusive theme detours contain actual different incidents and remember their chosen resolution',()=>{
 assert.equal(TURN_SCENES.length,18);
 for(const t of THEMES){const titles=[];for(const variant of [0,1,2]){const l=freshLegacy();l.themesUnlocked=[t.id];const r=fresh(4,l,t.id);known(r);for(const [index,choice] of [0,variant].entries()){r.day=[4,11][index];r.pending={type:'scene',id:`encore-${t.id}-${index}`,npc:t.cast[0],other:t.cast[1]};choose(r,choice);drain(r);}r.day=13;const q={type:'scene',id:`turn-${t.id}-${variant}`,npc:t.cast[0],other:t.cast[1]};assert.equal(turnReady(r,q),true);assert.equal(turnReady(r,{...q,id:`turn-${t.id}-${(variant+1)%3}`}),false);r.pending=q;const e=currentEvent(r);titles.push(e.title);assert.equal(e.choices.length,2);choose(r,1);drain(r);assert.equal(r.encore.detour.choice,1);assert.equal(turnReady(r,q),false);r.day=18;r.pending={type:'scene',id:`encore-${t.id}-2`,npc:t.cast[0],other:t.cast[1]};assert.ok(currentEvent(r).text.includes(e.title));choose(r,0);drain(r);r.day=28;finish(r);settle(r,l);assert.deepEqual(l.detours,[`${t.id}:${variant}:1`]);assert.doesNotThrow(()=>validateSave(payload(r,l)));}assert.equal(new Set(titles).size,3);}
});

test('an unread theme detour with a known guest can be sealed without losing its actual cast',()=>{
 const l=freshLegacy();l.themesUnlocked=['quiet'];const r=fresh(4,l,'quiet');known(r);for(const [i,choice] of [0,0].entries()){r.day=[4,11][i];r.pending={type:'scene',id:`encore-quiet-${i}`,npc:'raina',other:'ash'};choose(r,choice);drain(r);}r.day=28;r.pending=null;perform(r,'rest');drain(r);finish(r);settle(r,l);const letter=r.letters.find(x=>x.id==='turn-quiet-0');assert.ok(letter);assert.ok(letter.cast.includes('mika'));assert.equal(r.encore.detour,null);assert.doesNotThrow(()=>validateSave(payload(r,l)));
});
test('voice and onboarding changes keep personal identity and do not leak unknown or no-contact guests',()=>{
 assert.equal(new Set(Object.values(SMALL_TALK).flat()).size,24);assert.equal(new Set(PEOPLE.map(p=>arcReply(p.id,0,0))).size,6);assert.equal(new Set(PEOPLE.map(p=>lifeChangeVoice(p.id,'pause'))).size,6);
 const r=fresh();assert.match(firstNightGuide(r).title,/地方/);r.visited=['rain'];assert.match(firstNightGuide(r).text,/远程/);r.storyFlags['guide:talk']=true;assert.equal(firstNightGuide(r).route,'calendar');assert.equal(firstNightGuide(r,false),null);r.day=8;assert.equal(firstNightGuide(r),null);
});
test('version eleven migration retains past choices and old ending while starting rhythm and new chapters without invented history',()=>{
 const l=freshLegacy(),r=fresh(28);finish(r);settle(r,l);const name=r.ending.name;delete r.letters;delete r.relationLedger;delete r.encore.detour;delete l.guide;delete l.detours;delete l.reading.mode;for(const b of l.books){delete b.letters;delete b.review;delete b.keepsakes;}const copy=validateSave({version:11,run:r,legacy:l});assert.equal(copy.run.ending.name,name);assert.equal(copy.run.ending.legacy,true);assert.equal(copy.run.encore.detour,null);assert.deepEqual(copy.legacy.detours,[]);assert.doesNotThrow(()=>validateSave(copy));
});
test('malformed new archives, keepsakes, detours and relation ledgers cannot be imported',()=>{
 for(const change of [x=>x.run.letters=[{}],x=>x.run.relationLedger.gains.raina={trust:99,affection:0},x=>x.run.encore.detour={variant:0,choice:1,day:1},x=>x.legacy.reading.mode='autoplay',x=>x.legacy.guide='yes',x=>x.legacy.detours=['quiet:9:0']]){const x=payload(fresh());change(x);assert.throws(()=>validateSave(x));}
});
