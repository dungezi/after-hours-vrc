import test from 'node:test';
import assert from 'node:assert/strict';
import { DAILY, dailyReady, dailyScene } from '../dist/daily-stories.js';
import { initiativeDirect } from '../dist/initiative-stories.js';
import { GROUPS, groupReady } from '../dist/stories.js';
import { romanceKey } from '../dist/courtship-stories.js';
import { VERSION, startRun, freshLegacy, perform, choose, currentEvent, validateSave, online, actionReason, acknowledgeNotice } from '../dist/engine.js';
const payload=run=>({version:VERSION,run,legacy:freshLegacy()});
function fresh(){const r=startRun({seed:987});while(r.pending)choose(r,0);return r;}
function ready(id='raina',day=15){
  const r=fresh();r.day=day;
  Object.assign(r.relationships[id],{met:true,introduced:true,affection:65,trust:65,stage:2,meetings:8,communicated:true});
  for(const i of [0,1])r.storyFlags[romanceKey(id,i)]=day-5+i*2;
  return r;
}
function next(r,day){while(r.day<day){r.notice=null;assert.equal(r.pending,null);perform(r,'next');if(r.pending)break;}}

test('72 daily scenes have distinct titles, branches and outcomes, and six-step prerequisites',()=>{
  assert.equal(DAILY.length,72);assert.equal(new Set(DAILY.map(s=>s.id)).size,72);
  const r=fresh();r.day=28;const titles=new Set(),outcomes=new Set();
  for(const s of DAILY){
    const e=dailyScene(r,{id:s.id,npc:s.npc});titles.add(e.title);
    for(const c of e.choices.slice(0,2))outcomes.add(c.text);
    if(s.index)assert.equal(dailyReady(r,s),false);
  }
  assert.equal(titles.size,72);assert.equal(outcomes.size,144);
});

test('deferred daily stories resume on a later night and never unlock an unread sequel',()=>{
  const r=fresh();r.pending={type:'scene',id:'daily-world-rain-0'};choose(r,2);
  assert.equal(r.storyFlags['defer:daily-world-rain-0'],1);
  const first=DAILY.find(s=>s.id==='daily-world-rain-0'),second=DAILY.find(s=>s.id==='daily-world-rain-1');
  assert.equal(r.storySeen.includes(first.id),false);assert.equal(dailyReady(r,first),false);assert.equal(dailyReady(r,second),false);
  r.day=4;assert.equal(dailyReady(r,first),true);assert.equal(dailyReady(r,second),false);
  r.pending={type:'scene',id:first.id};choose(r,0);r.day=5;assert.equal(dailyReady(r,second),false);
  r.day=6;assert.equal(dailyReady(r,second),true);r.pending={type:'scene',id:second.id};choose(r,0);
  assert.equal(dailyReady(r,second),false);assert.doesNotThrow(()=>validateSave(payload(r)));
});

test('ordinary chat and dates share read state, and second conversation waits for the first',()=>{
  const r=fresh();r.pending={type:'scene',id:'conversation',npc:'raina',index:0};const title=currentEvent(r).title;choose(r,0);
  assert.equal(r.storyFlags['read:conversation:raina:0'],1);
  r.pending={type:'scene',id:'date',npc:'raina',index:0};assert.throws(()=>choose(r,0));r.pending=null;
  perform(r,'talk','raina');assert.notEqual(currentEvent(r)?.title,title);
  while(r.pending)choose(r,0);
  assert.doesNotThrow(()=>validateSave(payload(r)));
});

test('late group scenes wait for the specific shared experiences they refer to',()=>{
  const r=fresh();r.day=24;const g=GROUPS.find(g=>g.id==='group-credit');
  assert.equal(groupReady(r,g),false);r.storySeen.push('group-photo');assert.equal(groupReady(r,g),false);
  r.storySeen.push('group-build');assert.equal(groupReady(r,g),true);
});

test('an already-read group is discarded on reload and cannot be replayed for relationship gains',()=>{
  const r=fresh();r.day=4;r.pending={type:'scene',id:'group-welcome',npc:'ash',other:'raina'};choose(r,0);
  r.pending={type:'scene',id:'group-welcome',npc:'ash',other:'raina'};assert.throws(()=>choose(r,0));
  const copy=validateSave(payload(r)).run;assert.equal(copy.pending,null);assert.equal(copy.queue.length,0);
});

test('a timid invitation invites closeness without automatically establishing a sugar relationship',()=>{
  const r=ready();perform(r,'work');assert.equal(r.pending.id,'initiative');
  assert.equal(initiativeDirect(r,r.pending),false);assert.match(currentEvent(r).title,/目的地/);
  choose(r,0);assert.equal(r.relationships.raina.status,'friend');assert.equal(r.storyFlags['initiative:raina'],1);
  assert.equal(r.notice.answer,'invitation');assert.doesNotThrow(()=>validateSave(payload(r)));
  r.notice=null;perform(r,'work');assert.equal(r.pending,null);
});

test('a timid character confirms the invitation only after more time and further shared experience',()=>{
  const r=ready();perform(r,'work');choose(r,0);r.notice=null;
  next(r,17);assert.equal(r.pending,null); // Time alone does not count as a reciprocal experience.
  perform(r,'talk','raina');assert.equal(r.pending.id,'initiative');assert.equal(r.pending.index,1);
  assert.equal(initiativeDirect(r,r.pending),true);choose(r,0);
  assert.equal(r.relationships.raina.status,'sugar');assert.equal(r.notice.answer,'accepted');
  assert.doesNotThrow(()=>validateSave(payload(r)));
});

test('the same timid character may state feelings directly later, but not without the preludes',()=>{
  const r=ready('raina',22);perform(r,'work');assert.equal(r.pending.id,'initiative');
  assert.equal(initiativeDirect(r,r.pending),true);assert.match(currentEvent(r).text,/剩下的夜晚/);
  const early=ready('raina',22);delete early.storyFlags[romanceKey('raina',1)];perform(early,'work');
  assert.notEqual(early.pending?.id,'initiative');assert.equal(early.pending.id,'courtship');
});

test('late timid characters need less delay and do not require inflated affection',()=>{
  const r=ready('raina',22);r.storyFlags[romanceKey('raina',1)]=21;r.relationships.raina.affection=43;
  perform(r,'work');assert.equal(r.pending.id,'initiative');
  const early=ready('raina',15);early.storyFlags[romanceKey('raina',1)]=14;early.relationships.raina.affection=43;
  perform(early,'work');assert.equal(early.pending,null);
});

test('direct characters can take initiative and the player can decline without losing friendship',()=>{
  const r=ready('lin',15);perform(r,'work');assert.equal(r.pending.npc,'lin');assert.equal(initiativeDirect(r,r.pending),true);
  const trust=r.relationships.lin.trust;choose(r,2);assert.equal(r.relationships.lin.status,'friend');assert.equal(r.relationships.lin.trust,trust);
  r.notice=null;next(r,21);assert.equal(r.pending,null);perform(r,'work');assert.equal(r.pending,null);
  assert.doesNotThrow(()=>validateSave(payload(r)));
});

test('waiting is offered one distinct follow-up and never cycles into repeated invitations',()=>{
  const r=ready('lin',15);perform(r,'work');choose(r,1);r.notice=null;next(r,17);
  perform(r,'talk','lin');assert.equal(r.pending.index,1);choose(r,1);r.notice=null;
  next(r,19);perform(r,'talk','lin');while(r.pending)choose(r,0);
  assert.equal(r.relationships.lin.status,'friend');assert.equal(r.logs.filter(l=>l.kind==='story' && ['不是演出的一句喜欢','想听你的真实节拍'].includes(l.title)).length,2);
});

test('initiative waits for availability, communication and existing exclusive promises',()=>{
  for(const mutate of [r=>r.day=16,r=>r.relationships.raina.communicated=false,r=>r.relationships.raina.tension=30,r=>r.relationships.lin.status='sugar']){
    const r=ready();mutate(r);perform(r,'work');assert.notEqual(r.pending?.id,'initiative');
  }
  const r=ready('lin',15);Object.assign(r.relationships.rei,{met:true,introduced:true,status:'sugar',agreement:false,lastDay:15,trust:60});perform(r,'work');assert.equal(r.pending,null);
  r.relationships.rei.agreement=true;perform(r,'work');assert.equal(r.pending.id,'initiative');assert.match(currentEvent(r).text,/已有砂糖约定/);
});

test('a proactive request does not interrupt a confession already sent by the player',()=>{
  const r=ready('lin',15);r.relationships.lin.intent={state:'waiting',askedDay:15,meetGoal:20,dayGoal:20,trustAtAsk:65,disclosed:true,style:'honest'};
  perform(r,'work');assert.equal(r.pending,null);
});

test('acknowledging one response preserves and opens another queued initiative without spending an action',()=>{
  const r=ready();Object.assign(r.relationships.lin,{met:true,introduced:true,affection:65,trust:65,stage:2,meetings:8,communicated:true});
  for(const i of [0,1])r.storyFlags[romanceKey('lin',i)]=10+i*2;
  perform(r,'work');assert.equal(r.pending.npc,'raina');const ap=r.ap;choose(r,0);
  const copy=validateSave(payload(r)).run;assert.equal(copy.notice.answer,'invitation');assert.equal(copy.pending,null);
  acknowledgeNotice(copy);assert.equal(copy.pending.id,'initiative');assert.equal(copy.pending.npc,'lin');assert.equal(copy.ap,ap);
});

test('new daily and initiative scenes survive saved reloads and reject malformed casts or flags',()=>{
  const r=ready();perform(r,'work');const p=payload(r),copy=validateSave(p).run;assert.deepEqual(copy.pending,r.pending);
  for(const mutate of [p=>p.run.pending.npc='ash',p=>delete p.run.pending.index,p=>p.run.storyFlags['initiative-read:raina:2']=15,p=>p.run.storyFlags['read:daily-world-rain-0']=29]){
    const bad=structuredClone(p);mutate(bad);assert.throws(()=>validateSave(bad));
  }
  const daily=fresh();daily.pending={type:'scene',id:'daily-world-rain-0'};assert.equal(validateSave(payload(daily)).run.pending.id,daily.pending.id);
  daily.pending.npc='raina';assert.throws(()=>validateSave(payload(daily)));
});

test('version 5 upgrades retain old dialogue read state without changing relationship progress',()=>{
  const r=fresh();r.pending={type:'scene',id:'conversation',npc:'raina',index:0};choose(r,0);delete r.storyFlags['read:conversation:raina:0'];
  const copy=validateSave({version:5,run:r,legacy:freshLegacy()});assert.equal(copy.version,VERSION);assert.equal(copy.run.storyFlags['read:conversation:raina:0'],1);
  assert.deepEqual(copy.run.relationships,r.relationships);
});

test('six complete narrative runs keep saves valid, remove stale queues and avoid reading daily chapters twice',()=>{
  for(let seed=1;seed<=6;seed++){
    let r=startRun({seed,traits:['listener','steady']});const seen=new Set();let steps=0;
    while(!r.ended && steps++<500){
      if(r.pending){
        const q=r.pending;if(q.id?.startsWith('daily-')){assert.equal(seen.has(q.id),false);seen.add(q.id);}
        choose(r,0);
      }else{
        r.notice=null;
        const target=Object.keys(r.relationships).find(id=>r.relationships[id].introduced && online(r,id) && !actionReason(r,'talk',id));
        if(r.ap===0)perform(r,'next');
        else if(r.stats.energy<25 || r.stats.balance<40)perform(r,'rest');
        else if((steps+seed)%3===0 && target)perform(r,'talk',target);
        else perform(r,'explore',['rain','cafe','orbit','club','garden','studio'][(steps+seed)%6]);
      }
      r=validateSave(payload(r)).run;
    }
    assert.equal(r.ended,true);assert.ok(seen.size>=8);
  }
});
