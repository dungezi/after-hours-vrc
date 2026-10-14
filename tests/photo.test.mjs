import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLD, PEOPLE } from '../dist/data.js';
import { PHOTO_STORIES, photoStoryReady } from '../dist/photo-stories.js';
import { DAILY, dailyReady } from '../dist/daily-stories.js';
import { romanceKey } from '../dist/courtship-stories.js';
import { VERSION, startRun, freshLegacy, online, locationOf, perform, choose, currentEvent, actionReason, validateSave } from '../dist/engine.js';
const payload=run=>({version:VERSION,run,legacy:freshLegacy()});
function fresh(){const r=startRun({seed:73,traits:['camera','steady']});while(r.pending)choose(r,0);return r;}
function onSite(r,id,day){
  r.day=day;r.ap=3;r.nightActions=0;r.stats.energy=100;r.stats.balance=80;
  Object.assign(r.relationships[id],{met:true,introduced:true});r.world=locationOf(r,id);
  assert.ok(r.world);assert.equal(actionReason(r,'photo',id),null);
}
function drain(r){let limit=0;while(r.pending && limit++<100){r.notice=null;choose(r,0);}r.notice=null;assert.ok(limit<100);}

test('photo stories cover every world, all six friends, solo visits and relationship followups',()=>{
  assert.equal(PHOTO_STORIES.length,60);assert.equal(new Set(PHOTO_STORIES.map(s=>s.id)).size,60);
  assert.equal(new Set(PHOTO_STORIES.map(s=>s.beat[0])).size,60);
  for(const w of WORLD){
    assert.equal(PHOTO_STORIES.filter(s=>s.world===w.id && s.kind==='solo').length,2);
    for(const p of PEOPLE)assert.ok(PHOTO_STORIES.some(s=>s.world===w.id && s.npc===p.id));
  }
  for(const s of PHOTO_STORIES){assert.equal(s.beat.length,6);assert.notEqual(s.beat[4],s.beat[5]);}
});

test('photography stays in the actual world, uses the selected friend and charges one action',()=>{
  for(const p of PEOPLE)for(const w of WORLD){
    const day=Array.from({length:28},(_,i)=>i+1).find(day=>locationOf({day},p.id)===w.id);
    if(!day)continue; // 有些组合在当前 28 夜日历里不会同时在场。
    const r=fresh();onSite(r,p.id,day);const trust=r.relationships[p.id].trust;
    perform(r,'photo',p.id);
    assert.equal(r.ap,2);assert.equal(r.stats.energy,92);assert.equal(r.stats.balance,76);
    assert.equal(r.relationships[p.id].trust,trust); // 入镜方式尚未同意，先不发关系奖励。
    assert.equal(r.pending.id,`photo-${w.id}-${p.id}`);assert.equal(r.photos[0].with,null);
    assert.match(currentEvent(r).subtitle,new RegExp(w.name));assert.match(currentEvent(r).subtitle,new RegExp(p.name));
    const saved=validateSave(payload(r)).run;choose(saved,2);
    assert.equal(saved.ap,2);assert.equal(saved.photos[0].with,null);assert.equal(saved.photos[0].companion,p.id);
    assert.equal(saved.photos[0].choice,2);assert.match(saved.photos[0].caption,new RegExp(w.name));
    assert.equal(saved.relationships[p.id].status,'friend');assert.doesNotThrow(()=>validateSave(payload(saved)));
  }
});

test('offline, remote, unknown and not-yet-introduced friends cannot be photographed',()=>{
  const r=fresh();r.stats.energy=100;r.world='rain';
  assert.match(actionReason(r,'photo','missing'),/不存在/);
  r.relationships.raina.introduced=false;assert.match(actionReason(r,'photo','raina'),/初次相遇/);
  r.relationships.raina.introduced=true;r.day=2;assert.match(actionReason(r,'photo','raina'),/离线/);
  r.day=1;r.world='studio';assert.match(actionReason(r,'photo','raina'),/不在当前世界/);
  assert.throws(()=>perform(r,'photo','raina'),/不在当前世界/);assert.equal(r.ap,3);assert.equal(r.photos.length,0);
});

test('a solo photograph never silently pulls a nearby friend into the frame',()=>{
  const r=fresh();r.world=locationOf(r,'raina');perform(r,'photo');
  assert.equal(r.pending.id,`photo-${r.world}-solo-0`);assert.equal(currentEvent(r).npc,undefined);
  choose(r,0);assert.equal(r.photos[0].with,null);assert.equal(r.photos[0].companion,null);
  assert.doesNotThrow(()=>validateSave(payload(r)));assert.match(actionReason(r,'photo'),/已经拍过/);
});

test('a props-only photograph keeps the companion but does not falsely record their avatar in the frame',()=>{
  const day=Array.from({length:28},(_,i)=>i+1).find(day=>locationOf({day},'rei')==='cafe');
  const r=fresh();onSite(r,'rei',day);perform(r,'photo','rei');
  assert.equal(r.pending.id,'photo-cafe-rei');assert.match(currentEvent(r).choices[1].label,/杯子/);choose(r,1);
  assert.equal(r.photos[0].companion,'rei');assert.equal(r.photos[0].with,null);assert.doesNotThrow(()=>validateSave(payload(r)));
  const bad=payload(structuredClone(r));bad.run.photos[0].with='rei';assert.throws(()=>validateSave(bad));
});

test('photo choice previews match the applied relationship changes including the camera talent',()=>{
  const r=fresh();onSite(r,'raina',1);perform(r,'photo','raina');
  const event=currentEvent(r),before=r.relationships.raina.affection;
  const result=choose(r,0);assert.equal(r.relationships.raina.affection-before,event.choices[0].rel.affection);
  assert.equal(r.photos[0].with,'raina');assert.equal(r.photos[0].title,event.title);
  assert.equal(r.photos[0].caption,event.choices[0].text);assert.match(result.text,/相册/);
});

test('the second solo photo chapter needs the first chapter and another two nights',()=>{
  const r=fresh();r.world='rain';const second=PHOTO_STORIES.find(s=>s.id==='photo-rain-solo-1');
  assert.equal(photoStoryReady(r,second),false);perform(r,'photo');choose(r,2);
  assert.equal(photoStoryReady(r,second),false);r.day=2;assert.equal(photoStoryReady(r,second),false);
  r.day=3;r.ap=3;r.nightActions=0;perform(r,'photo');assert.equal(r.pending.id,second.id);choose(r,0);
  assert.equal(photoStoryReady(r,second),false);assert.doesNotThrow(()=>validateSave(payload(r)));
});

test('friend photo memories follow actual photos across worlds and remember declining a portrait',()=>{
  const r=fresh();onSite(r,'raina',1);Object.assign(r.relationships.raina,{stage:1,meetings:2});
  perform(r,'photo','raina');const firstTitle=currentEvent(r).title;choose(r,2);drain(r);
  const memory=PHOTO_STORIES.find(s=>s.id==='photo-memory-raina-0');
  assert.equal(photoStoryReady(r,memory,'raina'),false);
  const day=Array.from({length:25},(_,i)=>i+4).find(day=>online({day},'raina'));
  onSite(r,'raina',day);r.relationships.raina.trust=30;
  perform(r,'photo','raina');assert.equal(r.pending.id,memory.id);
  assert.match(currentEvent(r).text,new RegExp(firstTitle));assert.match(currentEvent(r).text,/尊重了不出镜/);
  choose(r,0);drain(r);assert.doesNotThrow(()=>validateSave(payload(r)));
});

test('the intimate photo chapter waits for the previous memory and confirmed sugar; Ash stays a friend',()=>{
  for(const id of ['raina','ash']){
    const r=fresh();onSite(r,id,1);Object.assign(r.relationships[id],{stage:1,trust:35,meetings:2});
    perform(r,'photo',id);choose(r,0);drain(r);
    const days=Array.from({length:27},(_,i)=>i+2).filter(day=>online({day},id));
    const secondDay=days.find(day=>day>=3);onSite(r,id,secondDay);perform(r,'photo',id);
    assert.equal(r.pending.id,`photo-memory-${id}-0`);choose(r,0);drain(r);
    const final=PHOTO_STORIES.find(s=>s.id===`photo-memory-${id}-1`);
    assert.equal(photoStoryReady(r,final,id),false);
    const thirdDay=days.find(day=>day>=secondDay+2);onSite(r,id,thirdDay);
    assert.equal(photoStoryReady(r,final,id),false);
    if(id==='ash')r.relationships[id].stage=2;
    else {r.relationships[id].status='sugar';for(const i of [0,1])r.storyFlags[romanceKey(id,i)]=1;}
    perform(r,'photo',id);assert.equal(r.pending.id,final.id);
    assert.match(currentEvent(r).text,id==='ash'?/朋友/:/已经确认砂糖/);choose(r,2);
    assert.equal(r.relationships[id].status,id==='ash'?'friend':'sugar');assert.doesNotThrow(()=>validateSave(payload(r)));
  }
});

test('photography cannot be replaced by another queued story and survives a refresh',()=>{
  const r=fresh();onSite(r,'raina',1);r.queue.push({type:'scene',id:'conversation',npc:'raina',index:0});
  perform(r,'photo','raina');assert.ok(r.pending.id.startsWith('photo-'));assert.equal(r.queue[0].id,'conversation');
  const saved=validateSave(payload(r)).run;assert.equal(currentEvent(saved).title,currentEvent(r).title);
  choose(saved,0);assert.equal(saved.pending.id,'conversation');assert.equal(saved.photos.length,1);assert.equal(saved.ap,2);
});

test('exhausted photo chapters still give a world and friend-specific result without repeating stories or relation rewards',()=>{
  const r=fresh();onSite(r,'raina',1);perform(r,'photo','raina');choose(r,0);drain(r);
  const first=r.photos[0];r.day=Array.from({length:27},(_,i)=>i+2).find(day=>locationOf({day},'raina')===first.world);
  r.ap=3;r.nightActions=0;r.stats.energy=100;const trust=r.relationships.raina.trust,count=r.storyCount;
  perform(r,'photo','raina');assert.equal(r.pending,null);assert.equal(r.storyCount,count);
  assert.equal(r.relationships.raina.trust,trust);assert.equal(r.photos[1].story,null);
  assert.match(r.logs.find(l=>l.kind==='action').text,/雨音/);assert.match(r.photos[1].caption,/没有重演/);
  assert.doesNotThrow(()=>validateSave(payload(r)));
});

test('malformed photo scene links, impossible album subjects and tampered choice history are rejected',()=>{
  const r=fresh();onSite(r,'raina',1);perform(r,'photo','raina');
  for(const mutate of [p=>p.run.pending.photoIndex=20,p=>p.run.pending.npc='lin',p=>p.run.photos[0].world='club',p=>p.run.photos[0].companion='lin',p=>p.run.photos[0].choice=99,p=>p.run.photos[0].scope='public',p=>p.run.photos[0].title='x'.repeat(161),p=>p.run.photos[0].story='photo-unknown']){
    const p=payload(structuredClone(r));mutate(p);assert.throws(()=>validateSave(p));
  }
  choose(r,2);const p=payload(structuredClone(r));p.run.photos[0].with='raina';assert.throws(()=>validateSave(p));
  const choice=payload(structuredClone(r));choice.run.storyFlags['choice:'+r.photos[0].story]=0;assert.throws(()=>validateSave(choice));
});

test('version 6 keeps legacy photo dates and companions without inventing a read photography story',()=>{
  const r=fresh();r.photos=[{world:'rain',day:1,with:'raina'},{world:'cafe',day:1,with:null}];r.photoDay=1;
  const old={version:6,run:r,legacy:freshLegacy()},copy=validateSave(old);
  assert.equal(copy.version,VERSION);assert.deepEqual(copy.run.relationships,r.relationships);
  assert.equal(copy.run.photos[0].with,'raina');assert.equal(copy.run.photos[0].companion,'raina');assert.equal(copy.run.photos[0].story,null);
  assert.equal(copy.run.photos[1].world,'cafe');assert.equal(copy.run.photos[1].with,null);assert.equal(old.run.photos[0].caption,undefined);
});

test('new daily fifth and sixth chapters cannot skip earlier chapters or their cross-night delay',()=>{
  for(const first of DAILY.filter(s=>s.index===4)){
    const r=fresh();r.day=25;if(first.npc)Object.assign(r.relationships[first.npc],{met:true,introduced:true,meetings:10});
    assert.equal(dailyReady(r,first),false);
    for(let i=0;i<4;i++){const id=first.id.slice(0,-1)+i;r.storySeen.push(id);r.storyFlags['read:'+id]=i*3+1;}
    assert.equal(dailyReady(r,first),true);r.pending={type:'scene',id:first.id,...(first.npc?{npc:first.npc}:{})};choose(r,2);drain(r);
    const last=DAILY.find(s=>s.id===first.id.slice(0,-1)+'5');assert.equal(dailyReady(r,last),false);
    r.day=27;assert.equal(dailyReady(r,last),true);r.pending={type:'scene',id:last.id,...(last.npc?{npc:last.npc}:{})};
    assert.match(currentEvent(r).text,/上次你选择暂时搁下/);choose(r,0);drain(r);assert.equal(dailyReady(r,last),false);
    assert.doesNotThrow(()=>validateSave(payload(r)));
  }
});
