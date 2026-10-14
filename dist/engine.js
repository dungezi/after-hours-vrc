import { WORLD, PEOPLE, TRAITS, MEMORIES, GEAR, PROJECTS, EVENTS, ARCS, ACHIEVEMENTS } from './data.js';

import { sceneFor, GROUPS, SCENE_IDS, FLEXIBLE, groupCast, groupReady, conversationCast, conversationTitles } from './stories.js';
import { NPC_ROUTES } from './npc-stories.js';
import { romanceKey, preludeKey, romanceProgress, preludeProgress, narratorFor } from './courtship-stories.js';
import { DAILY, dailyReady } from './daily-stories.js';
import { INITIATIVE } from './initiative-stories.js';
import { PHOTO_STORIES, selectPhotoStory, validPhotoPending, photoFallback, photoModeFor } from './photo-stories.js';

export const VERSION = 7;
export const DAYS = 28;
export const STAT_NAMES = { energy: '精力', mood: '心情', craft: '制作', social: '社交', balance: '现实平衡', money: '资金' };
export const REL_NAMES = { affection: '亲密', trust: '信任', tension: '压力' };
const clamp = (n, max = 100) => Math.min(max, Math.max(0, n));
const byId = (arr, id) => arr.find(x => x.id === id);
export function freshLegacy() { return { runs: 0, points: 0, unlocked: [], equipped: [], achievements: [], endings: [], history: [] }; }
export function random(run) {
  run.seed = (Math.imul(1664525, run.seed) + 1013904223) >>> 0;
  return run.seed / 4294967296;
}
export function online(run, npc) { return byId(PEOPLE, npc)?.available.includes(run.day % 7) ?? false; }
export function locationOf(run, npc) {
  if (!online(run, npc)) return null;
  const index = PEOPLE.findIndex(p => p.id === npc);
  return WORLD[(run.day - 1 + index + Math.floor(run.day / 3)) % WORLD.length].id;
}
export function peopleAt(run, world) { return PEOPLE.filter(p => locationOf(run, p.id) === world); }
export function isIntroduced(run, npc) { return run.relationships[npc]?.met && run.relationships[npc]?.introduced === true; }
export function npcPartners(run, npc) {
  return Object.entries(run.npcBonds).filter(([key,b])=>b.status==='sugar' && key.split(':').includes(npc)).map(([key])=>key.split(':').find(id=>id!==npc));
}
export function previewEffects(run, effects = {}) {
  return Object.fromEntries(Object.entries(effects).map(([key, value]) => {
    const before = run.stats[key];
    let n = value;
    if (n > 0 && ['craft','social'].includes(key) && before > 40) n = Math.max(1, Math.round(n * (100 - before) / 60));
    if (n > 0 && key === 'mood' && before > 70) n = Math.max(1, Math.round(n * 0.35));
    return [key, clamp(before + n, key === 'money' ? 99999 : 100) - before];
  }));
}
export function explorationEffects(run, world) {
  const w = byId(WORLD, world), isNew = !run.visited.includes(world);
  return { ...previewEffects(run, { mood: w.mood + (has(run,'map')?1:0) + (isNew && has(run,'wanderer')?2:0), social: w.social + (world==='club' && has(run,'tracker')?2:0), craft: w.craft }), energy: -actionCost(run,'explore',world).energy, balance: -actionCost(run,'explore',world).balance };
}
export function previewRelations(run, npc, effects = {}) {
  if (!npc || !run.relationships[npc]) return {};
  const r=run.relationships[npc];
  return Object.fromEntries(Object.entries(effects || {}).map(([key,n])=>{
    const before=r[key];
    const gain=n>0 && key!=='tension' && before>60 ? Math.max(1,Math.round(n*(100-before)/40)) : n;
    return [key,clamp(before+gain)-before];
  }));
}
export function startRun({ name = '旅人', traits = ['listener', 'wanderer'], device = 'desktop', legacy = freshLegacy(), seed = Date.now() } = {}) {
  if (traits.length !== 2 || new Set(traits).size !== 2 || traits.some(id => !byId(TRAITS, id))) throw new Error('请选择两个不同的开局天赋。');
  if (!['desktop', 'vr'].includes(device)) throw new Error('请选择可用的设备模式。');
  const stats = { energy: 65, mood: 60, craft: 12, social: 12, balance: 70, money: device === 'desktop' ? 140 : 100 };
  for (const id of traits) for (const [key, n] of Object.entries(byId(TRAITS, id).bonus)) stats[key] = clamp(stats[key] + n, key === 'money' ? 99999 : 100);
  if (device === 'vr') stats.social += 5;
  const carried = legacy.equipped.filter(id => legacy.unlocked.includes(id)).slice(0, 3);
  if (carried.includes('blueprint')) { stats.craft += 10; stats.money += 40; }
  if (carried.includes('courage')) stats.social += 10;
  const run = {
    name: String(name).trim().slice(0, 20) || '旅人', traits: [...traits], device, memories: carried, seed: Number(seed) >>> 0,
    day: 1, ap: 3, stats, world: 'rain', visited: [], gear: [], projects: { avatar: 0, world: 0, event: 0 },
    relationships: Object.fromEntries(PEOPLE.map(p => [p.id, { met: ['raina', 'ash'].includes(p.id), introduced:false, affection: 5, trust: 10, tension: 0, stage: 0, status: 'friend', meetings: 0, lastDay: 0, confessionDay: 0, communicated: false, drifted: false, intent: null, disclosed: true, agreement: false }])),
    seen: [], achievements: [], photos: [], logs: [], pending: null, eventDay: 0, photoDay: 0, ended: false, ending: null,
    storySeen: [], storyFlags: {}, npcLinks: {}, npcBonds: {}, queue: [], notice: null, nightActions: 0, storyCount: 0, storyNight: 0,
    counters: { boundary: 0, actions: 0, gossip: false, friendship: false, dates: 0 }, dream: 'belong',
  };
  for (const key of Object.keys(stats)) stats[key] = clamp(stats[key], key === 'money' ? 99999 : 100);
  log(run, '来到这里', `你好，${run.name}。雨音为你留了一个座位，阿澈发来一条欢迎消息。接下来的 28 个夜晚，由你决定怎么度过。`, 'system');
  run.pending = { type: 'scene', id: 'introduction', npc: 'raina' };
  run.queue.push({ type: 'scene', id: 'introduction', npc: 'ash' });
  return run;
}
export function log(run, title, text, kind = 'action', changes = []) {
  run.logs.unshift({ day: run.day, title, text, kind, changes });
  run.logs = run.logs.slice(0, 180);
}
export function apply(run, effects = {}, npc, relEffects = {}) {
  const changes = [];
  for (const [key, n] of Object.entries(previewEffects(run, effects))) {
    if (!(key in run.stats)) continue;
    const before = run.stats[key];
    run.stats[key] = clamp(before + n, key === 'money' ? 99999 : 100);
    if (run.stats[key] !== before) changes.push({ label: STAT_NAMES[key], delta: run.stats[key] - before });
  }
  if (npc && run.relationships[npc]) {
    const r = run.relationships[npc];
    for (const [key, n] of Object.entries(relEffects)) {
      if (!(key in REL_NAMES)) continue;
      const before = r[key]; const gain = n > 0 && key !== 'tension' && before > 60 ? Math.max(1, Math.round(n * (100-before) / 40)) : n; r[key] = clamp(before + gain);
      if (r[key] !== before) changes.push({ label: `${byId(PEOPLE, npc).name}·${REL_NAMES[key]}`, delta: r[key] - before });
    }
  }
  return changes;
}
function has(run, id) { return run.traits.includes(id) || run.memories.includes(id) || run.gear.includes(id); }
export function actionReason(run, type, target) {
  if (!run || run.ended) return '这段旅程已经结束';
  if (run.pending) return '先回应眼前的故事';
  if (type === 'next') return null;
  if (type === 'buy') {
    const item = byId(GEAR, target);
    if (!item) return '设备不存在';
    if (run.gear.includes(target)) return '已拥有';
    return run.stats.money < item.price ? '资金不足' : null;
  }
  if (run.ap < 1) return '今晚的行动已用完，先结束这一晚';
  const cost = actionCost(run, type, target);
  if (run.stats.energy < cost.energy) return '精力不足，先休息或结束这一晚';
  if (run.stats.money < cost.money) return '资金不足，可以先处理现实工作';
  if(type==='together') {
    const ids=String(target || '').split(':');
    if(ids.length!==2 || ids[0]===ids[1] || !ids.every(id=>byId(PEOPLE,id)))return '请选择两位不同的朋友';
    if(!ids.every(id=>isIntroduced(run,id)))return '先读完两位朋友的初次相遇';
    if(!ids.every(id=>online(run,id)))return '需要两位朋友今晚都在线';
  }
  if (type === 'explore' && !byId(WORLD, target)) return '世界不存在';
  if (['talk', 'date', 'boundary', 'confess', 'breakup'].includes(type)) {
    const npc = byId(PEOPLE, target), r = run.relationships[target];
    if (!npc || !r?.met) return '先在世界中认识这位朋友';
    if (!online(run, target)) return 'TA 今晚离线，换一天再约';
    if (type === 'date' && r.trust < 20) return '先聊聊，建立至少 20 点信任';
    if (type === 'confess') {
      if (r.status === 'sugar') return '已经确认过心意，可以继续相处或沟通边界';
      if (r.intent?.state === 'waiting') return '心意已送达，继续相处与沟通，等待对方的回应';
      if (r.status === 'salt') return '先以朋友身份重新相处，这轮不再重复告白';
      if (r.intent?.state === 'rejected' && r.meetings < r.intent.meetGoal) return '先尊重这次回应，经过更多相处后再考虑表达';
      if (!isIntroduced(run,target))return '先读完初次相遇';
      if (romanceProgress(run,target)<2) return `先通过相处读完心意前的故事（${romanceProgress(run,target)} / 2）；两段故事需要不同夜晚慢慢推进`;
      if (r.affection < 30 || r.trust < 30 || r.meetings < 4) return '先积累亲密 30、信任 30，并相处 4 次，再认真表达心意';
    }
    if (type === 'breakup' && r.status !== 'sugar') return '只有砂糖关系可以进行关系告别';
  }
  if (type === 'photo') {
    if(run.photoDay === run.day)return '今晚已经拍过照片了';
    if(target) {
      if(!byId(PEOPLE,target))return '这位拍照同伴不存在';
      if(!isIntroduced(run,target))return '先读完这位朋友的初次相遇';
      if(!online(run,target))return 'TA 今晚离线，换一天再合照';
      if(locationOf(run,target)!==run.world)return 'TA 不在当前世界，请先跃迁到 TA 所在的世界';
    }
  }
  if (type === 'project') {
    const p = byId(PROJECTS, target);
    if (!p) return '项目不存在';
    if (run.projects[target] >= p.goal) return '项目已经完成';
    if (target === 'world' && run.stats.craft < p.requirement) return '制作能力达到 30 后开放';
    if (target === 'event' && (run.stats.social < 25 || Object.values(run.relationships).filter(r => r.met).length < 3)) return '需要社交 25，并认识 3 位朋友';
  }
  if (!['explore', 'talk', 'date', 'boundary', 'confess', 'breakup', 'together', 'photo', 'project', 'rest', 'work'].includes(type)) return '行动不存在';
  return null;
}
export function actionCost(run, type, target) {
  let energy = ({ talk: 10, date: 16, boundary: 8, confess: 10, breakup: 8, together:15, photo: 8, project: 18, work: 10 })[type] || 0;
  if (type === 'explore') energy = Math.max(2, (byId(WORLD, target)?.cost || 12) + 5 - (has(run, 'wanderer') ? 2 : 0) - (has(run, 'map') ? 1 : 0));
  return { energy, money: type === 'project' ? 10 : 0, balance: ({ explore: 5, talk: 4, date: 7, boundary: 2, confess: 4, breakup: 0, together:6, photo: 4, project: 6 })[type] || 0 };
}
export function currentEvent(run) {
  const p = run.pending;
  if (!p) return null;
  if (p.type === 'scene') {
    const event=sceneFor(run,p),bond=p.other && run.npcBonds[pairKey(p.npc,p.other)];
    if(event && GROUPS.some(g=>g.id===p.id) && bond?.status==='sugar')return {...event,choices:event.choices.map(c=>({...c,pairEffects:(c.rel?.tension>0 || c.otherRel?.tension>0 || c.otherRel?.trust<0)?{trust:-6,tension:10}:{trust:4,tension:-4}}))};
    return event;
  }
  if (p.type === 'arc') {
    const arc = ARCS[p.npc]?.[p.index];
    return arc ? { ...arc, id: `arc:${p.npc}:${p.index}`, npc: p.npc, subtitle: `${byId(PEOPLE, p.npc).name}的故事 · ${p.index === 0 ? '第一章' : '第二章'}` } : null;
  }
  return byId(EVENTS, p.id) || null;
}
const pairKey = (a,b) => [a,b].sort().join(':');
const photoReady=(run,q)=>validPhotoPending(run,q) && (!q.npc || (online(run,q.npc) && locationOf(run,q.npc)===run.world));
function storyReady(run, q) {
  if(q.type==='arc')return isIntroduced(run,q.npc) && run.relationships[q.npc].stage===q.index && (q.index===0 || run.day>=(run.storyFlags[`read:arc:${q.npc}:0`] || 1)+2);
  if(q.type==='event') {const e=byId(EVENTS,q.id);return !!e && (!e.npc || isIntroduced(run,e.npc)) && eventReady(run,e);}
  const group=q.type==='scene' && GROUPS.find(g=>g.id===q.id);
  const cast=group ? groupCast(group) : q.type==='scene' && (q.id==='courtship' || q.id==='together' || q.id.startsWith('npc-') || q.id.startsWith('multi-')) ? [q.npc,q.other].filter(Boolean) : [];
  if(q.type==='scene') {
    if(q.id.startsWith('photo-') && !photoReady(run,q))return false;
    if(q.id.startsWith('daily-')) {
      const s=DAILY.find(s=>s.id===q.id);
      if(!s || !dailyReady(run,s))return false;
    }
    if(['conversation','date'].includes(q.id) && (!conversationCast(q.npc,q.index).every(id=>isIntroduced(run,id)) || run.storyFlags[`read:conversation:${q.npc}:${q.index}`]))return false;
    if(['conversation','date'].includes(q.id) && q.index===1 && (!run.storyFlags[`read:conversation:${q.npc}:0`] || run.day<run.storyFlags[`read:conversation:${q.npc}:0`]+2))return false;
    if(q.id==='initiative' && !initiativeReady(run,q.npc,q.index))return false;
    if(q.narrator && !isIntroduced(run,q.narrator))return false;
    if(q.id==='courtship' && (romanceProgress(run,q.npc)!==q.index || (q.index===1 && run.day<run.storyFlags[romanceKey(q.npc,0)]+2)))return false;
    if(q.id==='npc-prelude' && (preludeProgress(run,q.npc,q.other)!==q.index || (q.index===1 && run.day<run.storyFlags[preludeKey(q.npc,q.other,0)]+2)))return false;
    if(q.id==='npc-confession' && (preludeProgress(run,q.npc,q.other)<2 || run.day<run.storyFlags[preludeKey(q.npc,q.other,1)]+2))return false;
    if(['confession','reply'].includes(q.id) && (q.id!=='reply' || q.answer==='accepted') && romanceProgress(run,q.npc)<2)return false;
  }
  return (!group || (groupReady(run,group) && !run.storySeen.includes(group.id))) && cast.every(id=>isIntroduced(run,id));
}
function enqueue(run, scene) {
  const same = q => q && q.type===scene.type && q.id===scene.id && q.npc===scene.npc && q.other===scene.other && q.index===scene.index;
  if (!run.queue.some(same) && !same(run.pending)) run.queue.push(scene);
}
function pump(run) {
  if (run.pending) return;
  // 所有初次相遇先读；延后群像时保留队列，不能把待认识误当作已认识。
  const intro=run.queue.findIndex(q=>q.type==='scene' && q.id==='introduction' && (q.dueDay || 0)<=run.day);
  if (intro>=0) { run.pending=run.queue.splice(intro,1)[0];return; }
  for (let i=0;i<run.queue.length;i++) {
    const q=run.queue[i];
    if ((q.dueDay || 0)>run.day) continue;
    if(q.id?.startsWith('group-') && run.storySeen.includes(q.id)) {run.queue.splice(i--,1);continue;}
    if((q.type==='arc' && run.relationships[q.npc].stage>q.index) || (q.type==='event' && run.seen.includes(q.id))) {run.queue.splice(i--,1);continue;}
    if(q.id==='initiative' && (!initiativeReady(run,q.npc,q.index))) {run.queue.splice(i--,1);continue;}
    if(q.type==='scene' && ((q.id.startsWith('daily-') && run.storySeen.includes(q.id)) || (['conversation','date'].includes(q.id) && run.storyFlags[`read:conversation:${q.npc}:${q.index}`]))) {run.queue.splice(i--,1);continue;}
    if(q.type==='scene' && ((q.id==='courtship' && romanceProgress(run,q.npc)>q.index) || (q.id==='npc-prelude' && preludeProgress(run,q.npc,q.other)>q.index))) {run.queue.splice(i--,1);continue;}
    if (!storyReady(run,q)) continue;
    run.queue.splice(i--,1);
    if (q.type==='scene' && q.id.startsWith('multi-') && (run.relationships[q.npc].status!=='sugar' || run.relationships[q.other].status!=='sugar')) continue;
    if (q.id==='reply' && !run.relationships[q.npc].intent) continue;
    if (q.id==='npc-departure' && run.relationships[q.npc].status!=='sugar') continue;
    if (['npc-date','npc-breakup','npc-calendar'].includes(q.id) && run.npcBonds[pairKey(q.npc,q.other)]?.status!=='sugar') continue;
    if (q.id==='npc-confession' && run.npcBonds[pairKey(q.npc,q.other)] && !(run.npcBonds[pairKey(q.npc,q.other)].status==='friend' && run.npcBonds[pairKey(q.npc,q.other)].stage===0)) continue;
    if (['npc-boundaries','npc-network'].includes(q.id) && run.npcBonds[pairKey(q.npc,q.other)]?.stage!==4) continue;
    run.pending=q; return;
  }
}
function scheduleReplies(run) {
  for (const p of PEOPLE) {
    const r=run.relationships[p.id], intent=r.intent;
    if (intent?.state !== 'waiting') continue;
    const progress = r.meetings>=intent.meetGoal && r.trust>=Math.max(32,intent.trustAtAsk+3) && r.affection>=40 && r.communicated;
    const time = run.day>=intent.dayGoal;
    if (!progress && !time) continue;
    let answer;
    if (p.id==='ash' || r.tension>=60 || (!FLEXIBLE.includes(p.id) && npcPartners(run,p.id).length) || (intent.disclosed && !FLEXIBLE.includes(p.id) && PEOPLE.some(x=>x.id!==p.id && run.relationships[x.id].status==='sugar'))) answer='rejected';
    else if (r.affection>=40 && r.trust>=32 && r.communicated && romanceProgress(run,p.id)===2 && (!npcPartners(run,p.id).length || r.agreement)) answer='accepted';
    else { intent.dayGoal=Math.min(DAYS+4,run.day+2); continue; }
    enqueue(run,{type:'scene',id:'reply',npc:p.id,answer});
  }
}
function scheduleCourtships(run,npc) {
  for(const p of PEOPLE.filter(p=>!npc || p.id===npc)) {
    const r=run.relationships[p.id],progress=romanceProgress(run,p.id);
    if(!isIntroduced(run,p.id) || !online(run,p.id) || r.status!=='friend' || progress>=2 || r.trust<25 || r.affection<20 || r.meetings<3)continue;
    const continuing=r.intent || run.queue.some(q=>q.id==='confession' && q.npc===p.id);
    if(r.stage<1 && !continuing)continue;
    if(progress===1 && (run.day<run.storyFlags[romanceKey(p.id,0)]+2 || r.trust<30 || r.meetings<4))continue;
    enqueue(run,{type:'scene',id:'courtship',npc:p.id,index:progress});
  }
}
function initiativeReady(run,id,index) {
  const p=INITIATIVE[id],r=run.relationships[id];if(!p || !r || ![0,1].includes(index))return false;
  const eager=!!p.late && run.day>=p.late;
  if(!isIntroduced(run,id) || !online(run,id) || r.status!=='friend' || r.intent || r.stage<1 || !r.communicated || r.meetings<5 || r.tension>25 || romanceProgress(run,id)<2)return false;
  if(run.day<p.day || run.day<run.storyFlags[romanceKey(id,1)]+(eager?1:2) || r.affection<p.affection-(eager?4:0) || r.trust<p.trust)return false;
  const partners=PEOPLE.filter(p=>p.id!==id && run.relationships[p.id].status==='sugar');
  const bonds=Object.entries(run.npcBonds).filter(([key,b])=>b.status==='sugar' && key.split(':').includes(id));
  if((partners.length || bonds.length) && (!FLEXIBLE.includes(id) || partners.some(p=>!FLEXIBLE.includes(p.id) || !run.relationships[p.id].agreement) || bonds.some(([,b])=>!b.open)))return false;
  if(run.storyFlags[`initiative-read:${id}:${index}`])return false;
  const state=run.storyFlags['initiative:'+id] || 0;
  if(index===0)return state===0;
  return [1,2].includes(state) && run.day>=run.storyFlags['initiative-day:'+id]+(eager?1:2) && r.meetings>run.storyFlags['initiative-meet:'+id];
}
function scheduleInitiatives(run) {
  for(const id of Object.keys(INITIATIVE)) {
    const index=run.storyFlags['initiative:'+id]?1:0;
    if(initiativeReady(run,id,index))enqueue(run,{type:'scene',id:'initiative',npc:id,index});
  }
}
function scheduleNpcStories(run,witness) {
  for(const p of PEOPLE) {
    const r=run.relationships[p.id], away=run.day-r.lastDay;
    if(r.status==='sugar' && isIntroduced(run,p.id) && (r.tension>=75 || (away>=6 && r.trust<30))) {
      const scene={type:'scene',id:'npc-departure',npc:p.id};
      enqueue(run,scene);
      const index=run.queue.findIndex(q=>q.id===scene.id && q.npc===p.id);
      if(index>0)run.queue.unshift(run.queue.splice(index,1)[0]);
    }
  }
  for(const route of NPC_ROUTES) {
    const [a,b]=route.cast,key=pairKey(a,b),bond=run.npcBonds[key];
    if(!route.cast.every(id=>isIntroduced(run,id)))continue;
    if((!bond || (bond.status==='friend' && bond.stage===0 && run.day>=bond.lastDay+2)) && run.day>=route.day && (run.storySeen.includes(route.after) || run.storyFlags['together:'+key]) && (run.npcLinks[key] || 0)>=4) {
      const progress=preludeProgress(run,a,b),last=run.storyFlags[preludeKey(a,b,progress-1)] || 0;
      if(progress && run.day<last+2)continue;
      if(progress<2) {
        const narrator=narratorFor(a,b),reported=!route.cast.includes(witness) && isIntroduced(run,narrator) && online(run,narrator);
        if(!reported && !route.cast.every(id=>online(run,id)))continue;
        enqueue(run,{type:'scene',id:'npc-prelude',npc:a,other:b,index:progress,...(reported?{narrator}:{})});
      } else if((run.npcLinks[key] || 0)>=8 && (run.storyFlags['npc-ask:'+key] || 0)<2)enqueue(run,{type:'scene',id:'npc-confession',npc:a,other:b});
    } else if(bond?.status==='sugar') {
      if(bond.tension>=35 || bond.trust<=30 || (bond.stage===2 && bond.outlook==='change' && run.day>=bond.sinceDay+7))enqueue(run,{type:'scene',id:'npc-breakup',npc:a,other:b});
      else if(bond.stage===1 && run.day>=bond.sinceDay+3)enqueue(run,{type:'scene',id:'npc-date',npc:a,other:b});
    }
  }
}
function resolveNpcBond(run,p) {
  const ids=[p.npc,p.other],bond=run.npcBonds[pairKey(...ids)];
  const names=ids.map(id=>byId(PEOPLE,id).name).join('与');
  const network=[...new Set(ids.flatMap(id=>npcPartners(run,id)).filter(id=>!ids.includes(id)))];
  const exclusive=ids.some(id=>!FLEXIBLE.includes(id) && (run.relationships[id].status==='sugar' || npcPartners(run,id).some(other=>!ids.includes(other)))) || network.some(id=>!FLEXIBLE.includes(id));
  if(exclusive) {
    bond.stage=3;
    return `${names}谈清了已有的排他约定，决定保持朋友。这份心意没有绕过现有关系。`;
  }
  if(network.length && !bond.open) {
    bond.stage=4;enqueue(run,{type:'scene',id:'npc-network',npc:p.npc,other:p.other});
    return `${names}先邀请${network.map(id=>byId(PEOPLE,id).name).join('、')}一起谈清已有约定，关系还没有自动成立。`;
  }
  if(ids.some(id=>run.relationships[id].status==='sugar' && !run.relationships[id].agreement)) {
    bond.stage=4;
    enqueue(run,{type:'scene',id:'npc-boundaries',npc:p.npc,other:p.other});
    return '两个人先保留朋友关系，等待与你认真讨论已有的砂糖约定。';
  }
  bond.status='sugar';bond.stage=1;bond.sinceDay=run.day;bond.lastDay=run.day;
  if(ids.some(id=>run.relationships[id].status==='sugar' && run.relationships[id].agreement))bond.open=true;
  if(network.length)enqueue(run,{type:'scene',id:'npc-calendar',npc:p.npc,other:p.other,dueDay:Math.min(DAYS+4,run.day+2)});
  const text=`${names}共同确认了砂糖关系，也约定各自保留现实生活、独处和结束关系的权利。`;
  run.notice={title:`${names}确认砂糖关系`,text,npc:p.npc,other:p.other,answer:'npc-sugar',day:run.day};
  return text;
}
function trigger(run, npc, mode='explore') {
  scheduleNpcStories(run,npc);scheduleCourtships(run,npc);scheduleReplies(run);scheduleInitiatives(run); pump(run);
  if (run.pending) return;
  if (npc) {
    const r=run.relationships[npc];
    if ((r.stage===0 && r.trust>=25 && r.meetings>=2) || (r.stage===1 && r.trust>=45 && r.affection>=30 && run.day>=8 && run.day>=(run.storyFlags[`read:arc:${npc}:0`] || 1)+2)) {
      run.pending={type:'arc',npc,index:r.stage}; run.eventDay=run.day; return;
    }
  }
  const group=GROUPS.find(g=>groupReady(run,g) && !run.storySeen.includes(g.id) && groupCast(g).every(id=>isIntroduced(run,id)) && g.cast.every(id=>online(run,id)));
  if (group && run.storyFlags.lastGroupDay!==run.day) { run.pending={type:'scene',id:group.id,npc:group.cast[0],other:group.cast[1]}; return; }
  if (['talk','date'].includes(mode) && npc) {
    const index=[0,1].find(i=>!run.storyFlags[`read:conversation:${npc}:${i}`] && conversationCast(npc,i).every(id=>isIntroduced(run,id)) && (i===0 || run.storyFlags[`read:conversation:${npc}:0`]) && (i===0 || run.day>=run.storyFlags[`read:conversation:${npc}:0`]+2));
    if(index!==undefined) {run.pending={type:'scene',id:mode==='date'?'date':'conversation',npc,index};return;}
    const daily=DAILY.find(s=>s.npc===npc && dailyReady(run,s));
    if(daily) {run.pending={type:'scene',id:daily.id,npc};return;}
  }
  const eligible=EVENTS.filter(e=>!run.seen.includes(e.id) && eventReady(run,e) && (!e.minDay || run.day>=e.minDay) && (!e.npc || (run.relationships[e.npc].met && online(run,e.npc) && (!e.world || locationOf(run,e.npc)===run.world))) && (!e.world || e.world===run.world));
  const local=eligible.filter(e=>e.world), list=local.length?local:eligible;
  if (list.length) { const e=list[Math.floor(random(run)*list.length)];run.pending={type:'event',id:e.id};run.eventDay=run.day; }
  else {
    const daily=DAILY.find(s=>s.world===run.world && dailyReady(run,s)) || DAILY.find(s=>s.npc===npc && dailyReady(run,s));
    if(daily)run.pending={type:'scene',id:daily.id,...(daily.npc?{npc:daily.npc}:{})};
    else if(!run.storySeen.includes('solo'))run.pending={type:'scene',id:'solo'};
  }
}
function eventReady(run,e) {
  if(e.id==='rumor')return run.photos.some(p=>p.with && run.relationships[p.with].introduced && run.relationships[p.with].status==='friend');
  if(e.id==='feedback')return run.photos.length>0;
  if(e.id==='party')return Object.values(run.relationships).filter(r=>r.introduced).length>=3;
  if(e.id==='alone')return PEOPLE.filter(p=>isIntroduced(run,p.id)).every(p=>!online(run,p.id));
  if(e.id==='hostlesson')return run.projects.event>0;
  return true;
}
function confirmPlayerBond(run,npc,disclosed=true) {
  const rel=run.relationships[npc],partners=PEOPLE.filter(x=>x.id!==npc && run.relationships[x.id].status==='sugar');
  rel.status='sugar';rel.drifted=false;rel.disclosed=disclosed;rel.intent=null;
  if(rel.agreement)for(const [key,b] of Object.entries(run.npcBonds))if(b.status==='sugar' && key.split(':').includes(npc))b.open=true;
  for(const other of partners)enqueue(run,{type:'scene',id:rel.disclosed?'multi-open':'multi-discovery',npc,other:other.id,dueDay:Math.min(DAYS,run.day+(rel.disclosed?1:2))});
}
function achievement(run, id) {
  if (!run.achievements.includes(id)) {
    run.achievements.push(id);
    const a = byId(ACHIEVEMENTS, id);
    log(run, `回忆解锁 · ${a.name}`, a.desc, 'achievement');
  }
}
export function checkAchievements(run) {
  if (run.visited.length) achievement(run, 'first');
  if (run.visited.length === WORLD.length) achievement(run, 'explorer');
  if (Object.values(run.relationships).every(r => r.met)) achievement(run, 'friends');
  if (Object.values(run.relationships).some(r => r.status === 'sugar')) achievement(run, 'sugar');
  if (run.counters.boundary >= 3) achievement(run, 'boundaries');
  if (PROJECTS.some(p => run.projects[p.id] >= p.goal)) achievement(run, 'maker');
  if (run.projects.event >= byId(PROJECTS, 'event').goal) achievement(run, 'host');
  if (run.photos.length >= 5) achievement(run, 'photos');
  if (Object.values(run.relationships).some(r => r.status === 'salt')) achievement(run, 'salt');
  if (Object.values(run.relationships).some(r => r.stage >= 2)) achievement(run, 'stories');
  if (run.storySeen.some(id=>id.startsWith('group-'))) achievement(run,'ensemble');
  if (Object.values(run.relationships).filter(r=>r.status==='sugar' && r.agreement).length>=2) achievement(run,'interwoven');
}
export function perform(run, type, target) {
  const reason = actionReason(run, type, target);
  if (reason) throw new Error(reason);
  run.notice = null;
  if (type === 'next') return nextDay(run);
  if (type === 'buy') {
    const g = byId(GEAR, target); run.gear.push(target);
    log(run, `设备入手 · ${g.name}`, g.desc, 'action', apply(run, { money: -g.price }));
    return;
  }
  const cost = actionCost(run, type, target);
  run.ap--; run.counters.actions++; run.nightActions++;
  let effects = { energy: -cost.energy, money: -cost.money, balance: -cost.balance }, rel = {}, title = '', text = '', npc, introduced, otherNpcChanges=[];
  if (type === 'explore') {
    const w = byId(WORLD, target), staying = run.world === target; run.world = target;
    const isNew = !run.visited.includes(target);
    if (isNew) run.visited.push(target);
    effects = { ...effects, mood: w.mood + (has(run, 'map') ? 1 : 0) + (isNew && has(run, 'wanderer') ? 2 : 0), social: w.social + (target === 'club' && has(run, 'tracker') ? 2 : 0), craft: w.craft };
    const candidates = peopleAt(run, target).map(p=>p.id);
    npc = candidates.find(id => !run.relationships[id].met) || candidates[Math.floor(random(run) * candidates.length)];
    title = `${staying ? '继续探索' : '跃迁'} · ${w.name}`;
    text = `${w.desc} ${candidates.length ? '' : '今晚这里没有熟悉的朋友；你把风景留给了自己。'}`;
    if (npc) {
      const r = run.relationships[npc], p = byId(PEOPLE, npc);
      if (!r.met) {
        r.met = true;
        introduced = npc;
        rel.trust = has(run, 'social') ? 10 : 5;
        rel.affection = has(run, 'courage') ? 9 : 4;
        text += `你认识了${p.name}，${p.avatar}。${p.line}`;
      } else { rel = { trust: 3, affection: 3 }; text += `你和${p.name}在这里偶遇，聊起了最近的生活。`; }
      r.meetings++; r.lastDay = run.day;
    }
  } else if(type==='together') {
    const [a,b]=target.split(':').sort();npc=a;
    for(const id of [a,b]) {run.relationships[id].meetings++;run.relationships[id].lastDay=run.day;}
    rel={trust:2,affection:1};effects.social=1;
    otherNpcChanges=apply(run,{},b,{trust:2,affection:1});
    title=`一起相处 · ${byId(PEOPLE,a).name} × ${byId(PEOPLE,b).name}`;
    text=`你邀请两位朋友来到${byId(WORLD,run.world).name}，先确认今晚想怎样相处。你的回应既会影响他们对你的感受，也会影响他们彼此的关系。`;
    run.pending={type:'scene',id:'together',npc:a,other:b};
  } else if (['talk', 'date', 'boundary', 'confess', 'breakup'].includes(type)) {
    npc = target;
    const p = byId(PEOPLE, npc), r = run.relationships[npc];
    const repeated = r.lastDay === run.day && r.meetings > 0;
    r.meetings++; r.lastDay = run.day;
    if (type === 'talk') {
      const bonus = (has(run, 'listener') ? 2 : 0) + (has(run, 'warmth') ? 1 : 0);
      rel = { trust: 6 + bonus, affection: 4, tension: -2 };
      effects.mood = 2; effects.social = 1;
      title = `聊天 · ${p.name}`;
      const lines = {
        raina: ['你们分享了收藏夹里的雨天世界。TA 把最喜欢的那个链接发给了你。', '你问起 TA 最近的生活，然后认真听完，没有急着给建议。'],
        ash: ['你们聊起今天遇见的新人。阿澈笑着说：“谢谢你也记得来问问我。”', '咖啡杯永远不会空，话题却不必永远热闹。你们聊了些耳机之外的小事。'],
        mika: ['小满给你看了一张新的截图。你记住了 TA 说喜欢的颜色。', '你们约好了下次一起去花园，而不只是说一句“有空再约”。'],
        rei: ['你们交换了各自窗外的天气。地球转着，聊天窗口成了短暂的交点。', '零点介绍了新做的脚本，你分享了一个还没实现的世界点子。'],
        lin: ['凛分享了一首没有公开播放过的歌。你问起 TA 最喜欢的那一小段。', '你们聊了除了舞蹈之外的事情。TA 今天不是主持人，只是一个朋友。'],
        yuki: ['你们聊起穿模与报错。弥生顺手画了一张小小的材质笔记。', '你具体说起作品里喜欢的细节。TA 开心地解释起那几层灯光。'],
      };
      text = lines[npc][Math.floor(random(run) * 2)];
      if (repeated) { rel.affection = 2; rel.trust = 3 + bonus; text += ' 今晚已经见过面，熟悉的聊天没有第一次那么多新鲜感。'; }
    }
    if (type === 'date') {
      const matched = p.prefer.includes(run.world);
      rel = { affection: (matched ? 5 : 3) + (has(run, 'tracker') ? 2 : 0), trust: matched ? 3 : 2, tension: repeated ? 4 : -1 };
      effects.mood = 3; run.counters.dates++;
      title = `相约 · ${p.name}`;
      text = matched ? `${byId(WORLD, run.world).name}刚好是${p.name}喜欢的地方。你们先确认今晚的安排，再慢慢把话题交给风景。` : `${p.name}接受了邀请，但这里并不是 TA 最喜欢的场景。你们仍然找到了一个共同的话题。`;
      if (repeated) text += ' 相处的时间很长，彼此也开始需要一点自己的空间。';
    }
    if (type === 'boundary') {
      rel = { trust: 3, affection: 1, tension: -7 - (has(run, 'space') ? 5 : 0) };
      effects.social = 1;
      r.communicated = true; run.counters.boundary++;
      title = `认真沟通 · ${p.name}`;
      text = `你们讨论了在线时间、独处需求、亲密接触与现实生活。${p.name}说：“可以把期待讲清楚，真的会轻松一些。”`;
    }
    if (type === 'confess') {
      r.confessionDay=run.day;
      title=`表达心意 · ${p.name}`;text='你邀请对方认真谈一次心意，关系会根据对话与回应推进。';
      run.pending={type:'scene',id:'confession',npc};
    }
    if (type === 'boundary') run.pending={type:'scene',id:'boundary',npc};
    if (type === 'breakup') {
      title=`关系谈话 · ${p.name}`;text='你们决定先把想改变的事情说完整，再确认是否结束关系。';
      run.pending={type:'scene',id:'breakup',npc};
    }
  } else if (type === 'photo') {
    run.photoDay = run.day;
    const w = byId(WORLD, run.world);
    npc = target || undefined;
    effects = { ...effects, craft: 2 + (run.traits.includes('camera') ? 2 : 0) + (run.gear.includes('camera') ? 2 : 0), mood: 2 + (run.gear.includes('camera') ? 1 : 0) };
    const story=selectPhotoStory(run,npc),fallback=photoFallback(run,npc);
    const shot={world:run.world,day:run.day,with:story?null:npc || null,companion:npc || null,title:story?story.beat[0]:fallback.title,caption:story?'等待你们确认拍摄方式。':fallback.caption,scope:'private',story:story?.id || null,choice:null};
    const photoIndex=run.photos.push(shot)-1;
    if(npc) {run.relationships[npc].meetings++;run.relationships[npc].lastDay=run.day;}
    if(story)run.pending={type:'scene',id:story.id,photoIndex,...(npc?{npc}:{})};
    title = `拍照 · ${w.name}${npc?' × '+byId(PEOPLE,npc).name:''}`;
    text=story?`你${npc?'邀请'+byId(PEOPLE,npc).name+'一起':'独自'}在${w.name}选好了位置，接下来决定怎样记录今晚。照片只保存在私人相册，人物是否入镜由接下来的对话确认。`:fallback.caption;
  } else if (type === 'project') {
    const p = byId(PROJECTS, target);
    const steps = run.stats.craft >= 55 ? 2 : 1;
    run.projects[target] = Math.min(p.goal, run.projects[target] + steps);
    effects.craft = 4 + (has(run, 'maker') ? 2 : 0); effects.mood = 1;
    title = `创作 · ${p.name}`;
    text = ['你修好了一个烦人的报错。', '你给场景添了一盏柔和的灯。', '你把灵感变成了一个可以点击的按钮。'][Math.floor(random(run) * 3)];
    text += ` 进度 ${run.projects[target]} / ${p.goal}。`;
    if (run.projects[target] === p.goal) {
      for (const [key, n] of Object.entries(p.reward)) effects[key] = (effects[key] || 0) + n;
      title = `上传成功 · ${p.name}`;
      text = target === 'event' ? '你为每个人留了座位，也留了随时休息的出口。这场聚会有人跳舞，有人只坐着，所有人都被欢迎。' : '朋友们走进了你的作品。它还不够完美，却已经承载了只有你能讲的故事。';
      if (target === 'event') for (const id of Object.keys(run.relationships)) if (run.relationships[id].met) apply(run, {}, id, { trust: 8 });
    }
  } else if (type === 'rest') {
    effects = { energy: 28, mood: 3, balance: 16 };
    title = '暂时摘下头显'; text = '喝水，伸展，给现实里的自己做一顿饭。你没有错过人生，只是把注意力换了个地方。';
  } else if (type === 'work') {
    effects = { ...effects, money: 50, balance: 13, mood: -3 };
    title = '处理现实里的待办'; text = '你完成了一项工作，把必要的事情往前推进。再上线时，不用把账单藏在开心后面。';
  }
  const changes = [...apply(run, effects, npc, rel),...otherNpcChanges];
  log(run, title, text, 'action', changes);
  checkAchievements(run);
  if (!['work','rest','boundary','breakup','confess','photo'].includes(type)) trigger(run,npc,type);
  else { scheduleNpcStories(run);scheduleCourtships(run,npc);scheduleReplies(run);scheduleInitiatives(run); pump(run); }
  if (introduced) {
    // 初次相遇先读；同次行动触发的其他剧情保留在队首。
    if (run.pending) run.queue.unshift(run.pending);
    run.pending = { type:'scene', id:'introduction', npc:introduced };
  }
}
export function choose(run, index) {
  if (!run || run.ended) throw new Error('旅程已经结束。');
  const event=currentEvent(run), c=event?.choices[index];
  if (!c || !Number.isInteger(index)) throw new Error('请选择有效的故事选项。');
  if (!storyReady(run,run.pending)) throw new Error('先读完相关角色的初次相遇与前置故事，并留出继续相处的夜晚。');
  if (c.effects?.money && run.stats.money+c.effects.money<0) throw new Error('这个选择需要更多资金。');
  const p=run.pending, rel=p.npc?run.relationships[p.npc]:null;
  const changes=apply(run,c.effects,event.npc,c.rel);
  if (c.otherRel && event.other) {
    changes.push(...apply(run,{},event.other,c.otherRel));
    const key=pairKey(event.npc,event.other);
    const before=run.npcLinks[key] || 0,delta=c.npcLinkDelta ?? (c.otherRel.trust<0 || c.otherRel.tension>0?-4:4);
    run.npcLinks[key]=clamp(before+delta);
    if(run.npcLinks[key]!==before)changes.push({label:`${byId(PEOPLE,event.npc).name}与${byId(PEOPLE,event.other).name}·熟悉度`,delta:run.npcLinks[key]-before});
  }
  for(const [id,effects] of Object.entries(c.castRel || {}))changes.push(...apply(run,{},id,effects));
  const affectBond=(a,b,effects)=>{
    const bond=run.npcBonds[pairKey(a,b)];if(!bond || bond.status!=='sugar')return;
    for(const [key,n] of Object.entries(effects || {})) {const before=bond[key];bond[key]=clamp(before+n);if(bond[key]!==before)changes.push({label:`${byId(PEOPLE,a).name}与${byId(PEOPLE,b).name}·${REL_NAMES[key]}`,delta:bond[key]-before});}
  };
  if(c.pairEffects && event.other)affectBond(event.npc,event.other,c.pairEffects);
  for(const update of c.bondChanges || [])affectBond(...update.cast,update.effects);
  for (const [key,n] of Object.entries(c.flags || {})) run.counters[key]=typeof n==='boolean'?n:(run.counters[key]||0)+n;
  if (c.flag) run.storyFlags[c.flag]=true;
  let resultText=c.text;
  run.pending=null;run.eventDay=run.day;run.storyCount++;run.storyNight++;
  if (p.type==='arc') {run.relationships[p.npc].stage=Math.max(run.relationships[p.npc].stage,p.index+1);run.storyFlags[`read:arc:${p.npc}:${p.index}`]=run.day;}
  else if (p.type==='event') run.seen.push(event.id);
  else {
    if (p.id==='introduction') rel.introduced=true;
    if (!run.storySeen.includes(p.id)) run.storySeen.push(p.id);
    if (p.id.startsWith('group-')) run.storyFlags.lastGroupDay=run.day;
    if(['conversation','date'].includes(p.id))run.storyFlags[`read:conversation:${p.npc}:${p.index}`]=run.day;
    if(p.id.startsWith('group-'))run.storyFlags['read:'+p.id]=run.day;
  }
  const outcome=c.outcome || '';
  if(outcome==='photo-read') {
    const shot=run.photos[p.photoIndex];
    shot.with=c.photoMode==='scenery'?null:p.npc || null;
    shot.caption=resultText;shot.choice=index;
    run.storyFlags['read:'+p.id]=run.day;run.storyFlags['choice:'+p.id]=index;
    resultText+=' 照片标题与这次选择已保存在「回忆档案 → 我们的相册」，仅保存在本机。';
  }
  if(outcome==='daily-read') {run.storyFlags['read:'+p.id]=run.day;run.storyFlags['choice:'+p.id]=index;}
  if(outcome.startsWith('initiative-')) {
    const name=byId(PEOPLE,p.npc).name;
    run.storyFlags[`initiative-read:${p.npc}:${p.index}`]=run.day;
    run.storyFlags['initiative-day:'+p.npc]=run.day;run.storyFlags['initiative-meet:'+p.npc]=rel.meetings;
    const answers={'initiative-interest':1,'initiative-wait':2,'initiative-decline':3,'initiative-accept':4};
    run.storyFlags['initiative:'+p.npc]=answers[outcome];
    let answer='invitation',title=outcome==='initiative-interest'?`${name}的期待已回应 · 继续了解彼此`:outcome==='initiative-wait'?`已告诉${name} · 你还需要时间`:`${name}已听清 · 保持朋友关系`;
    if(outcome==='initiative-accept') {
      if(npcPartners(run,p.npc).length)rel.agreement=true;
      confirmPlayerBond(run,p.npc);answer='accepted';title=`双方心意已确认 · ${name}成为砂糖搭档`;
    }
    run.notice={title,text:resultText,npc:p.npc,answer,day:run.day};
  }
  if(outcome==='courtship-read')run.storyFlags[romanceKey(p.npc,p.index)]=run.day;
  if(outcome==='npc-prelude-read')run.storyFlags[preludeKey(p.npc,p.other,p.index)]=run.day;
  if (outcome.startsWith('confess-') && outcome!=='confess-cancel') {
    const disclosed=outcome==='confess-honest', extra=PEOPLE.filter(x=>x.id!==p.npc && run.relationships[x.id].status==='sugar');
    rel.intent={state:'waiting',askedDay:run.day,meetGoal:rel.meetings+(p.npc==='raina'?2:1),dayGoal:Math.min(DAYS+4,run.day+({raina:3,mika:1,rei:2,lin:1,yuki:2,ash:1}[p.npc])+Math.floor(random(run)*2)),trustAtAsk:rel.trust,disclosed,style:disclosed?'honest':'secret'};
    const ready=rel.affection>=45 && rel.trust>=35 && rel.communicated && rel.stage>=1 && rel.tension<=35 && romanceProgress(run,p.npc)===2 && (!npcPartners(run,p.npc).length || rel.agreement);
    const answer=p.npc==='ash' || (!FLEXIBLE.includes(p.npc) && npcPartners(run,p.npc).length) || (disclosed && extra.length && !FLEXIBLE.includes(p.npc))?'rejected':ready?'accepted':'waiting';
    run.pending={type:'scene',id:'reply',npc:p.npc,answer};
    resultText+=' '+(answer==='waiting'?'对方想通过之后的相处继续了解你，等待不会固定为三晚。':'对方准备给出自己的回答。');
  }
  if (outcome.startsWith('reply-')) {
    const answer=outcome.slice(6), intent=rel.intent;
    if (answer==='accepted') {
      confirmPlayerBond(run,p.npc,intent?.disclosed!==false);
    } else if (answer==='rejected') rel.intent={...intent,state:'rejected',meetGoal:rel.meetings+2};
    else if (answer==='withdraw') rel.intent=null;
    const titles={accepted:`心意已确认 · ${byId(PEOPLE,p.npc).name}成为砂糖搭档`,rejected:`心意已回应 · ${byId(PEOPLE,p.npc).name}选择朋友关系`,waiting:`心意已送达 · ${byId(PEOPLE,p.npc).name}想继续了解`,withdraw:'关系请求已暂缓'};
    run.notice={title:titles[answer],text:resultText,npc:p.npc,answer,day:run.day};
  }
  if (outcome==='discuss-open') rel.agreement=FLEXIBLE.includes(p.npc);
  if (outcome==='breakup-confirm') { rel.status='salt';rel.intent=null; }
  if (outcome==='npc-departure') {
    rel.status='salt';rel.intent=null;rel.agreement=false;rel.drifted=true;
    run.notice={title:`${byId(PEOPLE,p.npc).name}提出的告别已确认`,text:resultText,npc:p.npc,answer:'ended',day:run.day};
  }
  if(outcome==='together-connect')run.storyFlags['together:'+pairKey(p.npc,p.other)]=true;
  if (outcome.startsWith('npc-bond-')) {
    const key=pairKey(p.npc,p.other),names=[p.npc,p.other].map(id=>byId(PEOPLE,id).name).join('与');
    if(p.id==='npc-confession')run.storyFlags['npc-ask:'+key]=(run.storyFlags['npc-ask:'+key] || 0)+1;
    const bond=run.npcBonds[key] ||= {status:'friend',stage:0,trust:50,tension:8,sinceDay:0,lastDay:run.day,initiator:null,open:false,outlook:random(run)<0.35?'change':'steady'};
    if(outcome==='npc-bond-wait') { bond.stage=0;bond.lastDay=run.day;if(run.storyFlags['npc-ask:'+key]<2)enqueue(run,{...p,dueDay:Math.min(DAYS+4,run.day+2)});else resultText+=' 两人决定先把关系留在朋友的位置，不再反复请求确认。'; }
    else if(outcome==='npc-bond-confirm') resultText+=' '+resolveNpcBond(run,p);
    else if(outcome==='npc-bond-network') {
      bond.open=true;
      for(const [key,b] of Object.entries(run.npcBonds))if(b.status==='sugar' && key.split(':').some(id=>[p.npc,p.other].includes(id)))b.open=true;
      resultText+=' '+resolveNpcBond(run,p);
    } else if(outcome==='npc-bond-network-delay') {
      bond.stage=0;bond.lastDay=run.day;
      if((run.storyFlags['npc-ask:'+key] || 0)<2)enqueue(run,{type:'scene',id:'npc-confession',npc:p.npc,other:p.other,dueDay:Math.min(DAYS+4,run.day+2)});
    }
    else if(outcome==='npc-bond-open') {
      for(const id of [p.npc,p.other])if(run.relationships[id].status==='sugar')run.relationships[id].agreement=true;
      resultText+=' '+resolveNpcBond(run,p);
    } else if(outcome==='npc-bond-decline') {bond.stage=3;bond.lastDay=run.day;}
    else if(outcome==='npc-bond-date') {
      bond.stage=2;bond.lastDay=run.day;
    } else if(outcome==='npc-bond-end') {
      bond.status='salt';bond.stage=3;bond.lastDay=run.day;bond.initiator=p.npc;
      run.notice={title:`${names}的砂糖关系已结束`,text:`${byId(PEOPLE,p.npc).name}主动提出告别。${resultText}`,npc:p.npc,other:p.other,answer:'npc-ended',day:run.day};
    }
  }
  if (outcome.startsWith('multi-')) {
    const other=run.relationships[p.other], key=pairKey(p.npc,p.other);
    if (outcome==='multi-consent') {
      for (const id of [p.npc,p.other]) { const r=run.relationships[id];r.disclosed=true;r.agreement=FLEXIBLE.includes(id);if(!r.agreement)r.status='friend'; }
      run.storyFlags['consent:'+key]=true;
    } else if (outcome==='multi-withdraw') { rel.status='salt';rel.intent=null; }
    else { changes.push(...apply(run,{},p.other,{trust:-4,tension:6}));run.storyFlags['consent:'+key]=false; }
    if (p.id==='multi-discovery') changes.push(...apply(run,{},p.other,{trust:-8,tension:8}));
    if (rel.status==='sugar' && other.status==='sugar' && ['multi-open','multi-discovery'].includes(p.id)) enqueue(run,{type:'scene',id:'multi-time',npc:p.npc,other:p.other,dueDay:Math.min(DAYS,run.day+3)});
    if (rel.status==='sugar' && other.status==='sugar' && p.id==='multi-time') enqueue(run,{type:'scene',id:'multi-photo',npc:p.npc,other:p.other,dueDay:Math.min(DAYS,run.day+3)});
  }
  log(run,event.title,`${c.label}。${resultText}`,'story',changes);
  const entry=run.logs[0];
  checkAchievements(run);
  // 心意回应先由玩家确认结果，再在后续行动推进关系交织剧情。
  if (!run.notice) { scheduleNpcStories(run,p.npc);scheduleCourtships(run,p.npc);scheduleReplies(run);scheduleInitiatives(run);pump(run); }
  return entry;
}
export function acknowledgeNotice(run) {
  if(!run?.notice)return;
  run.notice=null;
  if(!run.ended) {scheduleNpcStories(run);scheduleCourtships(run);scheduleReplies(run);scheduleInitiatives(run);pump(run);}
}
function nextDay(run) {
  if (run.day >= DAYS) { scheduleNpcStories(run);scheduleCourtships(run);scheduleReplies(run);scheduleInitiatives(run);pump(run);if(!run.pending)finish(run);return; }
  for (const [id, r] of Object.entries(run.relationships)) {
    if (!r.met) continue;
    const away = run.day - r.lastDay;
    if (r.status === 'sugar' && away >= 3) {
      apply(run, {}, id, { affection: -3, tension: 4 });
      if (away === 3) log(run, `${byId(PEOPLE, id).name}的未读消息`, '“最近都没见到你，想知道我们能不能约个时间？”亲密关系需要回应，也允许提前说明忙碌。', 'relationship');
    }
  }
  run.day++; run.ap = 3;
  const recovery = nightRecovery(run);
  const changes = apply(run, { energy: recovery, mood: -4, balance: (run.nightActions<3?3:0) + (has(run,'steady')?2:0) });
  run.nightActions=0;run.storyNight=0;
  log(run, `第 ${run.day} 夜 · 欢迎回来`, '世界加载完成。新的晚上，新的选择。', 'system', changes);
  if (run.stats.balance<=30) log(run,'现实的提醒','现实平衡正在偏低。安排一次工作或休息，可以恢复生活节奏。','relationship');
  scheduleNpcStories(run);scheduleCourtships(run);scheduleReplies(run);scheduleInitiatives(run);pump(run);
}
export function nightRecovery(run) {
  return (run.nightActions>=3?18:run.nightActions===2?24:30) + (has(run,'comfort')?3:0) + (has(run,'anchor')?3:0);
}
export function finish(run) {
  if (run.ended) return run.ending;
  if (run.pending) throw new Error('先回应眼前的故事。');
  const partners = PEOPLE.filter(p => run.relationships[p.id].status === 'sugar');
  const stable = partners.find(p => run.relationships[p.id].trust >= 60 && run.relationships[p.id].tension <= 35);
  const completed = PROJECTS.filter(p => run.projects[p.id] >= p.goal);
  const close = PEOPLE.filter(p => run.relationships[p.id].met && run.relationships[p.id].trust >= 50);
  let ending;
  if (run.stats.balance < 30) ending = { id: 'burnout', name: '先回到自己身边', subtitle: '有些灯，要先为自己点亮。', text: '你收获了不少夜晚，却也让现实的睡眠与生活落在身后。这不是失败，只是一段旅程提醒你：下次回来时，把自己也放进安排里。' };
  else if (partners.length>=2 && partners.every(p=>run.relationships[p.id].agreement && run.relationships[p.id].trust>=50 && run.relationships[p.id].tension<=35) && run.stats.balance>=45) ending={id:'weave',name:'几条轨道，一起发光',subtitle:partners.map(p=>p.name).join('、')+'与你，共同确认各自的位置。',text:'你们没有让任何人替别人同意。公开范围、见面安排和退出权都被认真讨论，关系交织成为一份不断修订的约定。多段亲密没有复制时间，却让你们更清楚怎样共同承担承诺。'};
  else if (partners.length>=2) ending={id:'fragile',name:'仍在练习的拥抱',subtitle:'几份喜欢之间，还有没有说完的约定。',text:'你建立了不止一段亲密关系，但知情、共同接受、信任或时间安排仍留着缺口。下一段故事需要让每个人说清自己的愿望，也让自己认真承担能做到的承诺。'};
  else if (stable && run.stats.balance >= 55) ending = { id: 'sugar', name: '两个人，各自发光', subtitle: `和${stable.name}一起，也把自己照顾好。`, text: `你和${stable.name}没有用全部时间证明亲密。聊清楚期待，给离线留余地，也为再次见面安排了一个可靠的时间。砂糖的甜，来自两个人都可以自由呼吸。` };
  else if (partners.length) ending = { id: 'fragile', name: '仍在练习的拥抱', subtitle: '喜欢是真的，相处仍然需要练习。', text: '你们为关系取了名字，也发现一个名字不能解决所有问题。下一段旅程，可以少一点猜测，多一点回应；少一点过大的承诺，多一点做得到的约定。' };
  else if (completed.length >= 2) ending = { id: 'creator', name: '世界里，有你的一盏灯', subtitle: '你把想说的话，做成了可以回来的地方。', text: '一个 Avatar、一张地图、一场聚会。作品让陌生人有了新的相遇方式，朋友们也开始在你的世界里留下自己的故事。你找到了创作者的归属。' };
  else if (close.length >= 3 || run.counters.friendship) ending = { id: 'friends', name: '不止一种重要', subtitle: '没有官宣的夜晚，也能有稳稳的归属。', text: '你的好友列表不只是名字。你知道谁喜欢安静，谁需要舞台，谁不必及时回复。友谊不是等待恋爱的过渡，而是一种值得认真经营的关系。' };
  else if (Object.values(run.relationships).some(r => r.status === 'salt')) ending = { id: 'goodbye', name: '海盐留在风里', subtitle: '好好结束，也是一种真心。', text: '你们曾经相互靠近，也最终选择不同的方向。没有围观者的审判，没有把过去涂黑。那一段甜与咸都留在日记里，而你继续往前走。' };
  else if (run.visited.length === WORLD.length) ending = { id: 'traveler', name: '下一扇传送门', subtitle: '没有固定的目的地，也能有自己的轨道。', text: '你见过舞池与星空，也独自走过雨里的站台。归属有时不是停在某个人旁边，而是知道自己仍然愿意好奇，愿意走向下一片风景。' };
  else ending = { id: 'quiet', name: '一个普通的好晚上', subtitle: '没有传奇，也有值得记住的瞬间。', text: '你来过，聊过，留下几张截图。不是每段经历都要变成宏大的故事。熟悉的加载画面后，还有一个普通而温柔的晚上等着你。' };
  achievement(run, 'season');
  if (run.stats.balance >= 75) achievement(run, 'balance');
  run.ending = ending; run.ended = true; return ending;
}
export function settle(run, legacy) {
  if (!run.ended) throw new Error('旅程还没有结束。');
  if (run.settled) return 0;
  const fresh = run.achievements.filter(id => !legacy.achievements.includes(id));
  const reward = 3 + fresh.length + (!legacy.endings.includes(run.ending.id) ? 2 : 0);
  legacy.points += reward; legacy.runs++;
  legacy.achievements = [...new Set([...legacy.achievements, ...run.achievements])];
  legacy.endings = [...new Set([...legacy.endings, run.ending.id])];
  legacy.history.unshift({ name: run.name, ending: run.ending.name, day: run.day, reward });
  legacy.history = legacy.history.slice(0, 30); run.settled = true; run.reward = reward;
  return reward;
}
export function unlockMemory(legacy, id) {
  const m = byId(MEMORIES, id);
  if (!m) throw new Error('回忆不存在。');
  if (legacy.unlocked.includes(id)) return;
  if (legacy.points < m.cost) throw new Error('回忆碎片不足，完成一段旅程后再来。');
  legacy.points -= m.cost; legacy.unlocked.push(id);
}
export function equipMemory(legacy, id) {
  if (!legacy.unlocked.includes(id)) throw new Error('先解锁这份回忆。');
  if (legacy.equipped.includes(id)) legacy.equipped = legacy.equipped.filter(x => x !== id);
  else { if (legacy.equipped.length >= 3) throw new Error('每次最多携带 3 份回忆。'); legacy.equipped.push(id); }
}

// 导入只接受本游戏的完整、有限范围状态。内容会在 UI 中转义。
export function validateSave(payload) {
  const error = () => { throw new Error('存档格式不完整或数据无效，请选择夜航导出的存档。'); };
  const finite = (n, min, max) => Number.isFinite(n) && n >= min && n <= max;
  const strings = (v, max = 200) => Array.isArray(v) && v.length <= max && v.every(x => typeof x === 'string' && x.length <= 300);
  const ids = (v, allowed, max = 100) => strings(v, max) && new Set(v).size === v.length && v.every(x => allowed.includes(x));
  if (!payload || ![1,2,3,4,5,6,VERSION].includes(payload.version) || !payload.legacy) error();
  payload=JSON.parse(JSON.stringify(payload));
  if (payload.version===1) {
    const old=payload.run;
    if(old) {
      Object.assign(old,{storySeen:[],storyFlags:{},npcLinks:{},queue:[],notice:null,nightActions:3-old.ap,storyCount:old.logs?.filter(l=>l.kind==='story').length || 0,storyNight:0});
      for(const rel of Object.values(old.relationships || {})) Object.assign(rel,{intent:null,disclosed:true,agreement:false});
      if(old.stats)for(const key of ['craft','social'])if(old.stats[key]>40)old.stats[key]=40+Math.round((old.stats[key]-40)/2);
    }
    payload.version=2;
  }
  if(payload.version===2) {
    const old=payload.run;
    if(old) {
      const unread=new Set([old.pending,...(Array.isArray(old.queue)?old.queue:[])].filter(q=>q?.type==='scene' && q.id==='introduction').map(q=>q.npc));
      const hasIntroductions=unread.size>0 || (Array.isArray(old.storySeen) && old.storySeen.includes('introduction'));
      old.npcBonds={};
      for(const [id,rel] of Object.entries(old.relationships || {})) {
        if(!byId(PEOPLE,id) || !byId(WORLD,old.world))error();
        const historyFull=Array.isArray(old.logs) && old.logs.length>=180;
        const read=!hasIntroductions || (Array.isArray(old.logs) && old.logs.some(l=>l.kind==='story' && l.title===sceneFor(old,{type:'scene',id:'introduction',npc:id}).title)) || (historyFull && !old.logs.some(l=>l.kind==='action' && l.text?.includes('你认识了'+byId(PEOPLE,id).name)));
        rel.introduced=!!rel.met && read && !unread.has(id);
      }
    }
    payload.version=3;
  }
  if(payload.version===3) {
    for(const bond of Object.values(payload.run?.npcBonds || {}))bond.open=false;
    payload.version=4;
  }
  if(payload.version===4) {
    const old=payload.run;
    if(old?.storyFlags) {
      // 已成立或已进入协商的旧关系保持原进度；未确认关系补读新的前置故事。
      for(const [id,r] of Object.entries(old.relationships || {}))if(['sugar','salt'].includes(r.status))for(const i of [0,1])old.storyFlags[romanceKey(id,i)] ||= 1;
      for(const [key,b] of Object.entries(old.npcBonds || {}))if(['sugar','salt'].includes(b.status) || b.stage===4)for(const i of [0,1])old.storyFlags[preludeKey(...key.split(':'),i)] ||= 1;
    }
    payload.version=5;
  }
  if(payload.version===5) {
    const old=payload.run;
    if(old)for(const q of [old.pending,...(old.queue || [])])if(q && ['conversation','date'].includes(q.id) && q.index===undefined)q.index=0;
    if(old?.storyFlags)for(const p of PEOPLE)for(const i of [0,1]) {
      const titles=conversationTitles(p.id,i);
      const read=old.logs?.find(l=>l.kind==='story' && titles.includes(l.title));
      if(read) {
        old.storyFlags[`read:conversation:${p.id}:${i}`]=read.day;
        if(i===1)old.storyFlags[`read:conversation:${p.id}:0`] ||= 1;
      }
    }
    payload.version=6;
  }
  if(payload.version===6) {
    for(const shot of payload.run?.photos || []) {
      shot.companion=shot.with;shot.title=byId(WORLD,shot.world)?.name || '';shot.caption='这张照片来自此前的旅程，原有世界、夜晚与同行者记录已保留。';shot.scope='private';shot.story=null;shot.choice=null;
    }
    payload.version=VERSION;
  }
  const l = payload.legacy;
  if (!finite(l.points, 0, 999999) || !Number.isInteger(l.points) || !finite(l.runs, 0, 999999) || !Number.isInteger(l.runs)) error();
  if (!ids(l.unlocked, MEMORIES.map(x => x.id)) || !ids(l.equipped, l.unlocked, 3) || !ids(l.achievements, ACHIEVEMENTS.map(x => x.id)) || !ids(l.endings, ['burnout','sugar','fragile','creator','friends','goodbye','traveler','quiet','weave'])) error();
  if (!Array.isArray(l.history) || l.history.length > 30 || l.history.some(h => !h || typeof h.name !== 'string' || h.name.length > 20 || typeof h.ending !== 'string' || h.ending.length > 80 || !finite(h.day, 1, DAYS) || !finite(h.reward, 0, 30))) error();
  const r = payload.run;
  if (r) {
    if (typeof r.name !== 'string' || r.name.length > 20 || !Number.isInteger(r.day) || !finite(r.day, 1, DAYS) || !Number.isInteger(r.ap) || !finite(r.ap, 0, 3) || !finite(r.seed, 0, 4294967295) || !Number.isInteger(r.seed)) error();
    if (!ids(r.traits, TRAITS.map(x => x.id), 2) || r.traits.length !== 2 || !ids(r.memories, MEMORIES.map(x => x.id), 3) || !['desktop','vr'].includes(r.device)) error();
    for (const key of Object.keys(STAT_NAMES)) if (!finite(r.stats?.[key], 0, key === 'money' ? 99999 : 100)) error();
    if (!byId(WORLD, r.world) || !ids(r.visited, WORLD.map(x => x.id)) || !ids(r.gear, GEAR.map(x => x.id)) || !ids(r.achievements, ACHIEVEMENTS.map(x => x.id)) || !ids(r.seen, EVENTS.map(x => x.id))) error();
    for (const p of PROJECTS) if (!Number.isInteger(r.projects?.[p.id]) || !finite(r.projects[p.id], 0, p.goal)) error();
    if (!r.relationships || Object.keys(r.relationships).length !== PEOPLE.length) error();
    for (const p of PEOPLE) {
      const v = r.relationships[p.id];
      if (!v || typeof v.met !== 'boolean' || !['friend','sugar','salt'].includes(v.status) || !Number.isInteger(v.stage) || !finite(v.stage, 0, 2)) error();
      for (const key of ['affection','trust','tension']) if (!finite(v[key], 0, 100)) error();
      for (const key of ['meetings','lastDay','confessionDay']) if (!Number.isInteger(v[key]) || !finite(v[key], 0, key === 'meetings' ? 1000 : DAYS)) error();
      if (typeof v.communicated !== 'boolean' || typeof v.drifted !== 'boolean' || typeof v.introduced!=='boolean' || (v.introduced && !v.met)) error();
    }
    if (!ids(r.storySeen,SCENE_IDS,256) || !Number.isInteger(r.nightActions) || !finite(r.nightActions,0,3) || !Number.isInteger(r.storyCount) || !finite(r.storyCount,0,1000) || !Number.isInteger(r.storyNight) || !finite(r.storyNight,0,100)) error();
    if (!r.storyFlags || typeof r.storyFlags!=='object' || Array.isArray(r.storyFlags) || Object.keys(r.storyFlags).length>512 || Object.entries(r.storyFlags).some(([k,v])=>k.length>100 || !['boolean','number'].includes(typeof v) || (typeof v==='number' && !finite(v,0,1000)))) error();
    for(const [key,value] of Object.entries(r.storyFlags)) {
      if(key.startsWith('read:')) {
        const id=key.slice(5),parts=id.split(':');
        if(!Number.isInteger(value) || !finite(value,1,r.day))error();
        if(['arc','conversation'].includes(parts[0])) {if(parts.length!==3 || !byId(PEOPLE,parts[1]) || !['0','1'].includes(parts[2]))error();}
        else if(!DAILY.some(s=>s.id===id) && !GROUPS.some(g=>g.id===id) && !PHOTO_STORIES.some(s=>s.id===id))error();
      }
      if(key.startsWith('choice:') && (![...DAILY,...PHOTO_STORIES].some(s=>s.id===key.slice(7)) || !Number.isInteger(value) || !finite(value,0,2)))error();
      if(key.startsWith('initiative')) {
        const parts=key.split(':');
        if(!INITIATIVE[parts[1]] || !Number.isInteger(value))error();
        if(parts[0]==='initiative-read') {if(parts.length!==3 || !['0','1'].includes(parts[2]) || !finite(value,1,r.day))error();}
        else if(parts.length!==2 || !['initiative','initiative-day','initiative-meet'].includes(parts[0]) || !finite(value,parts[0]==='initiative'?1:0,parts[0]==='initiative'?4:parts[0]==='initiative-day'?r.day:1000))error();
      }
    }
    for(const [key,value] of Object.entries(r.storyFlags))if(key.startsWith('romance:') || key.startsWith('npc-prelude:')) {
      const parts=key.split(':'),isPair=parts[0]==='npc-prelude';
      if(parts.length!==(isPair?4:3) || !['0','1'].includes(parts.at(-1)) || !Number.isInteger(value) || !finite(value,1,r.day))error();
      if(isPair?!NPC_ROUTES.some(route=>pairKey(...route.cast)===parts.slice(1,3).join(':')):!byId(PEOPLE,parts[1]))error();
      if(parts.at(-1)==='1' && !r.storyFlags[key.slice(0,-1)+'0'])error();
    }
    if (!r.npcLinks || typeof r.npcLinks!=='object' || Array.isArray(r.npcLinks) || Object.keys(r.npcLinks).length>20 || Object.entries(r.npcLinks).some(([key,n])=>key.split(':').length!==2 || key.split(':').some(id=>!byId(PEOPLE,id)) || key.split(':')[0]===key.split(':')[1] || !finite(n,0,100))) error();
    if(!r.npcBonds || typeof r.npcBonds!=='object' || Array.isArray(r.npcBonds) || Object.keys(r.npcBonds).length>NPC_ROUTES.length)error();
    for(const [key,b] of Object.entries(r.npcBonds)) {
      const route=NPC_ROUTES.find(x=>pairKey(...x.cast)===key);
      if(!route || !route.cast.every(id=>isIntroduced(r,id)) || !b || !['friend','sugar','salt'].includes(b.status) || !['change','steady'].includes(b.outlook) || typeof b.open!=='boolean')error();
      if(!Number.isInteger(b.stage) || !finite(b.stage,0,4) || !finite(b.trust,0,100) || !finite(b.tension,0,100))error();
      if(!['sinceDay','lastDay'].every(k=>Number.isInteger(b[k]) && finite(b[k],0,r.day)))error();
      if(b.initiator!==null && !route.cast.includes(b.initiator))error();
      if((b.status==='sugar' && (![1,2].includes(b.stage) || b.sinceDay<1 || b.initiator!==null)) || (b.status==='salt' && (b.stage!==3 || !b.initiator || b.sinceDay<1)) || (b.status==='friend' && ![0,3,4].includes(b.stage)))error();
    }
    const validScene=q=>q && q.type==='scene' && SCENE_IDS.includes(q.id) && (!q.npc || !!byId(PEOPLE,q.npc)) && (!q.other || (!!byId(PEOPLE,q.other) && q.npc!==q.other)) && (!q.id.startsWith('multi-') || (q.npc && q.other)) && (q.id==='solo' || DAILY.some(s=>s.id===q.id && !s.npc) || PHOTO_STORIES.some(s=>s.id===q.id && !s.npc) || !!q.npc) && (q.index===undefined || (Number.isInteger(q.index) && finite(q.index,0,1))) && (q.dueDay===undefined || (Number.isInteger(q.dueDay) && finite(q.dueDay,1,DAYS+4))) && (q.id!=='reply' || (['accepted','waiting','rejected'].includes(q.answer) && !!r.relationships[q.npc]?.intent));
    const validCast=q=>q.id.startsWith('photo-') ? photoReady(r,q) : q.id==='initiative' ? !!INITIATIVE[q.npc] && [0,1].includes(q.index) : ['conversation','date'].includes(q.id) ? [0,1].includes(q.index) : q.id.startsWith('daily-') ? DAILY.some(s=>s.id===q.id && s.npc===q.npc && !q.other) : q.id==='introduction' ? !!r.relationships[q.npc]?.met : q.id==='together' ? !!q.other : q.id.startsWith('npc-') && q.id!=='npc-departure' ? NPC_ROUTES.some(x=>x.cast[0]===q.npc && x.cast[1]===q.other) && (['npc-confession','npc-prelude'].includes(q.id) || !!r.npcBonds[pairKey(q.npc,q.other)]) : true;
    const validStory=q=>q && (q.dueDay===undefined || (Number.isInteger(q.dueDay) && finite(q.dueDay,1,DAYS+4))) && (q.type==='scene' ? validScene(q) && validCast(q) : q.type==='arc' ? !!byId(PEOPLE,q.npc) && Number.isInteger(q.index) && finite(q.index,0,1) && !!ARCS[q.npc]?.[q.index] : q.type==='event' && !!byId(EVENTS,q.id));
    const validPrelude=q=>!['courtship','npc-prelude'].includes(q?.id) || (q.type==='scene' && [0,1].includes(q.index) && (!q.narrator || (q.id==='npc-prelude' && q.narrator===narratorFor(q.npc,q.other) && isIntroduced(r,q.narrator))));
    if (!Array.isArray(r.queue) || r.queue.length>30 || !r.queue.every(q=>validStory(q) && validPrelude(q))) error();
    if (r.notice!==null && (!r.notice || typeof r.notice!=='object' || !byId(PEOPLE,r.notice.npc) || !['accepted','waiting','rejected','withdraw','ended','npc-sugar','npc-ended','invitation'].includes(r.notice.answer) || !['title','text'].every(k=>typeof r.notice[k]==='string' && r.notice[k].length<=3000) || !Number.isInteger(r.notice.day) || !finite(r.notice.day,1,r.day))) error();
    if(r.notice && ['npc-sugar','npc-ended'].includes(r.notice.answer) && !NPC_ROUTES.some(x=>x.cast[0]===r.notice.npc && x.cast[1]===r.notice.other))error();
    for(const rel of Object.values(r.relationships)) {
      if(typeof rel.disclosed!=='boolean' || typeof rel.agreement!=='boolean') error();
      const i=rel.intent;
      if(i!==null && (!i || typeof i!=='object' || !['waiting','rejected'].includes(i.state) || !['honest','secret'].includes(i.style) || typeof i.disclosed!=='boolean' || !Number.isInteger(i.askedDay) || !finite(i.askedDay,1,r.day) || !Number.isInteger(i.meetGoal) || !finite(i.meetGoal,0,1000) || !Number.isInteger(i.dayGoal) || !finite(i.dayGoal,1,DAYS+4) || !finite(i.trustAtAsk,0,100))) error();
    }
    if(r.pending?.type==='scene' && (!validScene(r.pending) || !validCast(r.pending) || !validPrelude(r.pending)))error();
    if(r.pending?.type==='scene') {
      const p=r.pending,b=r.npcBonds[pairKey(p.npc,p.other)];
      if((p.id==='npc-departure' && r.relationships[p.npc].status!=='sugar') || (['npc-date','npc-breakup','npc-calendar'].includes(p.id) && b?.status!=='sugar') || (['npc-boundaries','npc-network'].includes(p.id) && b?.stage!==4) || (p.id==='npc-confession' && b && (b.status!=='friend' || b.stage!==0)))error();
    }
    if (!r.counters || !['boundary','actions','dates'].every(k => Number.isInteger(r.counters[k]) && finite(r.counters[k], 0, 1000)) || !['gossip','friendship'].every(k => typeof r.counters[k] === 'boolean')) error();
    if (!Array.isArray(r.photos) || r.photos.length > DAYS || r.photos.some(p => {
      const s=PHOTO_STORIES.find(s=>s.id===p?.story);
      return !p || !byId(WORLD,p.world) || !Number.isInteger(p.day) || !finite(p.day,1,r.day) || (p.with!==null && !byId(PEOPLE,p.with)) || (p.companion!==null && !byId(PEOPLE,p.companion)) || (p.with && p.with!==p.companion) || p.scope!=='private' || typeof p.title!=='string' || p.title.length>160 || typeof p.caption!=='string' || p.caption.length>3000 || (p.choice!==null && (!Number.isInteger(p.choice) || !finite(p.choice,0,2))) || (p.story!==null && (!s || (s.world && s.world!==p.world) || (s.npc || null)!==p.companion)) || (p.story===null && p.choice!==null);
    })) error();
    for(const [i,p] of r.photos.entries())if(p.story) {
      if(p.companion && locationOf({day:p.day},p.companion)!==p.world)error();
      if(p.choice===null && ![r.pending,...r.queue].some(q=>q?.type==='scene' && q.photoIndex===i && q.id===p.story))error();
      if(p.choice===null && p.with!==null)error();
      if(p.choice!==null && (!r.storySeen.includes(p.story) || r.storyFlags['read:'+p.story]!==p.day || r.storyFlags['choice:'+p.story]!==p.choice || p.with!==(photoModeFor(p.story,p.choice)==='scenery'?null:p.companion)))error();
    }
    if (!Array.isArray(r.logs) || r.logs.length > 180 || r.logs.some(x => !x || !finite(x.day, 1, DAYS) || !['action','system','story','achievement','relationship'].includes(x.kind) || typeof x.title !== 'string' || x.title.length > 500 || typeof x.text !== 'string' || x.text.length > 3000 || !Array.isArray(x.changes) || x.changes.length > 30 || x.changes.some(c => !c || typeof c.label !== 'string' || c.label.length > 100 || !finite(c.delta, -99999, 99999)))) error();
    for (const key of ['photoDay','eventDay']) if (!Number.isInteger(r[key]) || !finite(r[key], 0, r.day)) error();
    if (typeof r.ended !== 'boolean' || (r.ended && (!r.ending || !['burnout','sugar','fragile','creator','friends','goodbye','traveler','quiet','weave'].includes(r.ending.id) || !['name','subtitle','text'].every(k => typeof r.ending[k] === 'string' && r.ending[k].length <= 2000)))) error();
    if (r.pending && (!['arc','event','scene'].includes(r.pending.type) || !currentEvent(r) || (r.pending.type === 'arc' && (!Number.isInteger(r.pending.index) || r.pending.index < 0 || r.pending.index > 1)))) error();
    if (r.ended && r.pending) error();
    if (r.settled !== undefined && typeof r.settled !== 'boolean') error();
    if (r.reward !== undefined && (!Number.isInteger(r.reward) || !finite(r.reward, 0, 30))) error();
    if (r.settled && (!r.ended || r.reward === undefined)) error();
    if(!r.ended) {
      // 修复旧版存档中抢先出现的群像，并补齐尚未读完的初次相遇。
      if(r.pending && !storyReady(r,r.pending)) {const pending=r.pending;r.pending=null;enqueue(r,pending);}
      const unread=PEOPLE.filter(p=>r.relationships[p.id].met && !isIntroduced(r,p.id));
      if(unread.length && r.pending?.id!=='introduction') {const pending=r.pending;r.pending=null;if(pending)enqueue(r,pending);}
      for(const p of unread)enqueue(r,{type:'scene',id:'introduction',npc:p.id});
      if(!r.notice) {scheduleNpcStories(r);scheduleCourtships(r);scheduleInitiatives(r);pump(r);}
    }
  }
  return JSON.parse(JSON.stringify(payload));
}
