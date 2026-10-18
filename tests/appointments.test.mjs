import test from 'node:test';
import assert from 'node:assert/strict';
import { PEOPLE } from '../dist/data.js';
import {proposeAppointment,changeAppointment,npcChangeAppointments,tickAppointments} from '../dist/appointments.js';
import {VERSION,startRun,choose,perform,currentEvent,freshLegacy,validateSave,actionReason,locationOf} from '../dist/engine.js';
const payload=r=>({version:VERSION,run:r,legacy:freshLegacy()});
function fresh(day=1){const r=startRun({seed:64});while(r.pending)choose(r,0);r.day=day;for(const p of PEOPLE)Object.assign(r.relationships[p.id],{met:true,introduced:true,trust:60,lastDay:day});return r;}
function book(r,npc='raina',day=r.day,slot=1,kind='walk'){const a=proposeAppointment(r,{npc,day,slot,world:'orbit',kind});choose(r,0);return a;}

test('a later appointment cannot relocate an earlier photo during save validation',()=>{
 const r=fresh();r.world=locationOf(r,'raina');perform(r,'photo','raina');choose(r,0);while(r.pending)choose(r,0);const before=structuredClone(r.photos[0]);const a=book(r,'raina',1,2);perform(r,'attend',a.id);choose(r,0);while(r.pending)choose(r,0);assert.deepEqual(r.photos[0],before);assert.equal(before.slot,1);assert.doesNotThrow(()=>validateSave(payload(r)));
});

test('same-night location follows the latest actual slot regardless of when bookings were proposed',()=>{
 const r=fresh();const late=book(r,'raina',1,2);const early=proposeAppointment(r,{npc:'raina',day:1,slot:1,world:'garden',kind:'walk'});choose(r,0);perform(r,'attend',early.id);choose(r,0);assert.equal(locationOf(r,'raina'),'garden');perform(r,'attend',late.id);choose(r,0);assert.equal(locationOf(r,'raina'),'orbit');assert.doesNotThrow(()=>validateSave(payload(r)));
});

test('no-contact cancels existing plans once and cannot be bypassed with rescheduling',()=>{
 const r=fresh(),a=book(r);r.relationships.raina.status='salt';r.departures['player:raina']={resolution:'ended',contact:'none'};assert.throws(()=>changeAppointment(r,a.id),/不联系/);const trust=r.relationships.raina.trust;tickAppointments(r);assert.equal(a.status,'cancelled');assert.equal(r.relationships.raina.trust,trust);tickAppointments(r);assert.equal(a.history.filter(h=>h.kind==='boundary-cancel').length,1);
});

test('a missed final-night booking is acknowledged before the player ends the journey',()=>{
 const r=fresh(28),a=book(r,'raina',28,3);perform(r,'next');assert.equal(r.ended,false);assert.equal(r.pending.id,'appointment-missed');assert.equal(a.history.filter(h=>h.kind==='miss').length,1);choose(r,2);perform(r,'next');assert.equal(r.ended,true);assert.doesNotThrow(()=>validateSave(payload(r)));
});
test('booking and attending use the agreed action slot, include travel and preserve a reloaded scene',()=>{
  let r=fresh();const a=book(r);assert.equal(r.ap,3);assert.equal(a.status,'confirmed');perform(r,'attend',a.id);assert.equal(r.ap,2);assert.equal(r.world,'orbit');assert.equal(locationOf(r,'raina'),'orbit');
  r=validateSave(payload(r)).run;assert.equal(r.pending.id,'appointment-meet');choose(r,0);assert.equal(r.appointments[0].status,'completed');assert.equal(r.ap,2);assert.doesNotThrow(()=>validateSave(payload(r)));assert.notEqual(actionReason(r,'attend',a.id),null);
});
test('using an agreed slot for another action produces one bounded consequence and a real repair story',()=>{
  const r=fresh(),a=book(r),trust=r.relationships.raina.trust;perform(r,'work');assert.equal(a.status,'missed');assert.equal(r.relationships.raina.trust,trust-3);assert.equal(r.pending.id,'appointment-missed');
  const copy=validateSave(payload(r)).run;assert.equal(copy.relationships.raina.trust,trust-3);choose(r,0);assert.equal(a.status,'confirmed');assert.equal(a.slot,2);perform(r,'attend',a.id);choose(r,1);
  assert.equal(a.status,'completed');assert.equal(a.history.filter(x=>x.kind==='miss').length,1);
});
test('advance-night records an unexplained missed appointment but early cancellation does not',()=>{
  const r=fresh(),a=book(r,'ash',1,3);perform(r,'next');assert.equal(a.status,'missed');assert.equal(r.pending.id,'appointment-missed');choose(r,2);assert.equal(r.relationships.ash.status,'friend');
  const r2=fresh(),b=book(r2,'ash',1,3);changeAppointment(r2,b.id,true);perform(r2,'next');assert.equal(b.status,'cancelled');assert.equal(b.history.some(x=>x.kind==='miss'),false);
});
test('two conflicting promises must move, decline or obtain consent to join',()=>{
  const r=fresh();const first=book(r,'ash');const next=proposeAppointment(r,{npc:'lin',day:1,slot:1,world:'rain',kind:'walk'});assert.match(currentEvent(r).title,/两份邀请/);choose(r,1);assert.equal(next.status,'cancelled');assert.deepEqual(first.cast,['ash','lin']);assert.doesNotThrow(()=>validateSave(payload(r)));
  const other=fresh();other.relationships.raina.trust=20;const x=book(other,'raina');proposeAppointment(other,{npc:'ash',day:1,slot:1,world:'rain'});const entry=choose(other,1);assert.match(entry.text,/没有合并/);assert.deepEqual(x.cast,['raina']);
});
test('NPC changes free the old slot, can be declined and never count as player absence',()=>{
  const r=fresh(),a=book(r,'raina',3,1);npcChangeAppointments(r,'raina');assert.equal(a.status,'changing');perform(r,'buy','camera');
  const q={type:'scene',id:'appointment-change',npc:'raina',booking:a.id};r.pending=q;assert.match(currentEvent(r).title,/主动提出改期/);choose(r,1);assert.equal(a.status,'cancelled');assert.equal(a.history.some(x=>x.kind==='miss'),false);assert.doesNotThrow(()=>validateSave(payload(r)));
});
test('photo appointments create only the photo agreed to and retain the ordinary nightly limit',()=>{
  const r=fresh(),a=book(r,'raina',1,1,'photo');perform(r,'attend',a.id);choose(r,0);assert.equal(r.photos.length,1);assert.equal(r.photos[0].world,'orbit');assert.equal(r.photos[0].with,'raina');assert.notEqual(actionReason(r,'photo'),null);assert.doesNotThrow(()=>validateSave(payload(r)));
  const r2=fresh(),b=book(r2,'raina',1,1,'photo');r2.photoDay=1;perform(r2,'attend',b.id);assert.throws(()=>choose(r2,0),/已拍过照/);choose(r2,1);assert.equal(r2.photos.length,0);assert.equal(b.status,'completed');
});
test('known no-contact boundaries, offline nights and passed slots cannot be bypassed by booking',()=>{
  const r=fresh();assert.throws(()=>proposeAppointment(r,{npc:'rei',day:1,slot:1,world:'rain'}),/离线/);perform(r,'work');assert.throws(()=>proposeAppointment(r,{npc:'ash',day:1,slot:1,world:'rain'}));
  const old=payload(fresh());old.version=10;delete old.run.appointments;assert.deepEqual(validateSave(old).run.appointments,[]);
});
