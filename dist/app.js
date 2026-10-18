import { endingReview, markLetterRead } from './wrapup.js';
import { firstNightGuide } from './first-nights.js';
import { MESSAGE_CATEGORIES, entryKey, rememberReading, previousChoice, toggleReading, searchBook } from './reading.js';
import { themeRoute } from './theme-branches.js';
import { FINALES } from './finale-stories.js';
import { proposeAppointment, changeAppointment, slotAppointments, MEET_KINDS } from './appointments.js';
import { LIFE_PLANS } from './life-stories.js';
import { THEMES } from './replay-stories.js';
import { storyHints, epilogueFor } from './journey.js';
import { CIRCLE_SCENES } from './circle-stories.js';
import { WORLD, PEOPLE, TRAITS, MEMORIES, GEAR, PROJECTS, ACHIEVEMENTS, SOURCES } from './data.js';
import { VERSION, DAYS, STAT_NAMES, REL_NAMES, freshLegacy, startRun, online, locationOf, peopleAt, explorationEffects, previewEffects, previewRelations, actionReason, actionCost, nightRecovery, perform, currentEvent, choose, acknowledgeNotice, settle, unlockMemory, equipMemory, validateSave, readMessage, availableMessages } from './engine.js';
import { scene, icon } from './art.js';
import { romanceProgress, preludeProgress } from './courtship-stories.js';
import { NPC_ROUTES } from './npc-stories.js';
import { GROUPS, sceneFor } from './stories.js';
import { DAILY } from './daily-stories.js';
import { PHOTO_STORIES } from './photo-stories.js';
import { departureSummary, departureContactReason } from './separation-stories.js';

const KEY = 'after-hours-v1';
const $ = s => document.querySelector(s);
const h = v => String(v ?? '').replace(/[&<>"']/g, x => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[x]);
const get = (list, id) => list.find(x => x.id === id);
let state = { version: VERSION, run: null, legacy: freshLegacy() }, loadError = false;
try { const raw=localStorage.getItem(KEY);if(raw){const parsed=JSON.parse(raw);state=validateSave(parsed);if(parsed.version<VERSION){const backup=KEY+(parsed.version===1?'-before-story-update':'-before-v'+VERSION);if(!localStorage.getItem(backup))localStorage.setItem(backup,raw);localStorage.setItem(KEY,JSON.stringify(state));}} } catch { loadError=true; }
let archiveBookIndex=-1, storyPerson='all',storyQuery='',favoritesOnly=false,inboxCategory='all',inboxExpanded=false,recentReply=null;
let route = 'worlds', archiveTab = 'memories', selectedNpc = 'raina', dialog = null, saved = true, toastTimer, nightTimer;
const draft = { name: '旅人', device: 'desktop', traits: ['listener', 'wanderer'], theme:null };
const preview = startRun({ seed: 123 });
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); saved = true; } catch { if (saved) toast('浏览器暂时无法保存，请用“导出存档”备份进度。'); saved = false; }
}
function toast(message, centered=false) {
  const el=$(centered?'#night-notice':'#toast');el.textContent=message;el.classList.add('visible');
  if(centered){clearTimeout(nightTimer);nightTimer=setTimeout(()=>el.classList.remove('visible'),3000);}
  else {clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),4500);}
}
function btn(label, ui, value = '', cls = '', more = '') { return `<button class="${cls}" data-ui="${ui}" data-value="${h(value)}" ${more}>${label}</button>`; }
function action(label, type, target = '', cls = '', desc = '', more = '') {
  const reason = state.run ? actionReason(state.run, type, target) : '开始旅程后开放';
  return `<button class="${cls}" data-action="${type}" data-target="${h(target)}" ${more} ${reason ? `disabled title="${h(reason)}"` : ''}>${label}${desc ? `<small>${h(reason || desc)}</small>` : ''}</button>`;
}
function avatar(p, size = '', status = false) { return `<span class="avatar ${size}" style="--person:${p.color}"><span>${p.letter}</span>${status ? `<i class="online-dot ${online(state.run || preview, p.id) ? 'on' : ''}"></i>` : ''}</span>`; }
function pills(effects = {}, rel = {}) {
  return Object.entries({ ...effects, ...rel }).filter(([, n]) => n).map(([k, n]) => `<span class="effect ${n > 0 && k !== 'tension' || n < 0 && k === 'tension' ? 'positive' : 'negative'}">${h(STAT_NAMES[k] || REL_NAMES[k] || k)} ${n > 0 ? '+' : ''}${n}</span>`).join('');
}
function changes(items = []) { return items.map(c => `<span class="effect ${c.delta > 0 && !c.label.endsWith('压力') || c.delta < 0 && c.label.endsWith('压力') ? 'positive' : 'negative'}">${h(c.label)} ${c.delta > 0 ? '+' : ''}${c.delta}</span>`).join(''); }
function meter(name, value, color, glyph, max = 100) {
  return `<div class="stat"><div>${icon(glyph)}<span>${name}</span><b>${value}<small> / ${max}</small></b></div><div class="meter"><i style="width:${value/max*100}%;background:${color}"></i></div></div>`;
}
const titles = { calendar:['PLANS & PROMISES','把约定写具体','确认时间，也给变化留下能认真回应的位置。'], worlds: ['WORLD HOPPING', '今晚，想在哪里相遇？', '世界很大。选一个目的地，把今晚过成自己的故事。'], people: ['PEOPLE & CONNECTIONS', '关系，慢慢有了回声', '喜欢、信任与空间，都值得被认真对待。'], studio: ['CREATE SOMETHING', '把灵感，做成一个世界', '从一个小小的改模，到一盏为朋友留下的灯。'], archive: ['MEMORY ARCHIVE', '那些夜晚，没有消失', '带着学会的事重新出发，最多携带三份回忆。'] };
function render() {
  document.documentElement.dataset.readSize=state.legacy.reading.font;
  const r = state.run || preview, s = r.stats;
  const t = titles[route], chapter = ['初次见面', '靠近与试探', '关系的重量', '把灯留给明天'][Math.floor((r.day-1)/7)];
  $('#app').innerHTML = `
    <aside class="sidebar">
      ${btn(`<span class="brand-mark">${icon('moon')}</span><span class="brand-name">夜航<small>AFTER HOURS</small></span>`, 'route', 'worlds', 'brand')}
      <div class="side-label">你的第二人生 <span>VRC SIM</span></div>
      <nav aria-label="主要页面">
        ${[['worlds','compass','世界探索'],['people','people','朋友与砂糖'],['studio','cube','创作工坊'],['calendar','moon','预约日历'],['archive','book','回忆档案']].map(([id,glyph,label]) => btn(`${icon(glyph)}<span>${label}</span>${id === 'people' ? `<span class="nav-count">${Object.values(r.relationships).filter(x => x.met).length}</span>` : ''}`, 'route', id, `nav-item ${route===id?'active':''}`)).join('')}
      </nav>
      <div class="player-card"><span class="player-avatar">${icon('spark')}</span><div><b>${h(r.name)}</b><small>${r.device==='desktop'?'DESKTOP EXPLORER':'VR EXPLORER'}</small></div><span class="tiny-star">✦</span></div>
      <div class="side-label status-label">你的状态 <span>LIVE</span></div>
      <div class="stats">
        ${meter('精力',s.energy,'#90c8b8','battery')}
        ${meter('心情',s.mood,'#e9aac3','heart')}
        ${meter('制作',s.craft,'#aaa0dd','cube')}
        ${meter('社交',s.social,'#e1be87','people')}
      </div>
      <div class="balance-card"><div>${icon('sun')}<span>现实平衡</span><b class="${s.balance<30?'warning':''}">${s.balance}%</b></div><div class="meter"><i style="width:${s.balance}%;background:${s.balance<30?'#ed9e90':'#e1bf83'}"></i></div><p>${s.balance<30?'给现实留一些时间，也给自己。':s.balance<60?'留一点时间，照顾耳机之外的自己。':'两个世界，都有你的位置。'}</p></div>
      <div class="sidebar-bottom">${btn(`${icon('settings')} 玩法与存档`, 'settings', '', 'settings-link')}<span class="save-status ${saved?'':'warning'}"><i></i>${saved?'进度保存在这台浏览器':'请导出存档备份'}</span><small>原创同人模拟器 · 非 VRChat 官方产品</small></div>
    </aside>
    <div class="shell">
      <header class="topbar"><div class="session-label"><i></i> PRIVATE SESSION <span>/</span> 每个夜晚，都有可能</div><div class="top-tools">${btn(`${icon('book')} 玩法说明`, 'help', '', 'text-button')}${btn(icon('settings'), 'settings', '', 'text-button mobile-settings', 'aria-label="玩法与存档" title="玩法与存档"')}<span class="wallet">${icon('coin')}<b>${s.money}</b><small>生活资金</small></span></div></header>
      <div class="workspace"><main id="main-content">
        <div class="mobile-dashboard"><div class="mobile-stats">${[['energy','battery'],['mood','heart'],['craft','cube'],['social','people'],['balance','sun']].map(([key,glyph])=>`<span>${icon(glyph)}<small>${STAT_NAMES[key]}</small><b class="${key==='balance'&&s[key]<30?'warning':''}">${s[key]}</b></span>`).join('')}</div><div class="mobile-night"><span>第 ${r.day} / 28 夜 <i>·</i> 剩余 <b>${r.ap}</b> 次行动</span>${r.ended?btn('开启下一局 '+icon('arrow'),'next-run','','mobile-next'):action(r.day===DAYS?'结束旅程 '+icon('arrow'):'结束这一晚 '+icon('arrow'),'next','','mobile-next')}</div></div>
        <div class="page-title"><div class="eyebrow">${t[0]}</div><div class="title-row"><h1>${t[1]}</h1><span class="chapter-badge">W${Math.floor((r.day-1)/7)+1} · ${chapter}</span></div><p>${t[2]}</p></div>
        ${r.ended ? `<div class="finished-banner">${icon('moon')}<span>这段旅程已完成：<b>${h(r.ending.name)}</b></span><div class="finished-actions">${btn('查看人生总结','ending','','outline')}${btn('开启下一局 '+icon('arrow'),'next-run','','primary next-run-button')}</div></div>` : ''}
        ${renderGuide(r)}${renderReply()}${r.appointments.some(a=>a.status==='confirmed'&&a.day===r.day)?`<div class="slot-reminder">今晚有已确认的约定 · 下一段是第 ${r.nightActions+1} 次行动 ${btn('查看预约日历','route','calendar','text-button')}</div>`:''}${route === 'calendar' ? renderCalendar(r) : route === 'worlds' ? renderWorlds(r) : route === 'people' ? renderPeople(r) : route === 'studio' ? renderStudio(r) : renderArchive(r)}
      </main><aside class="rightbar">
        <section class="night-card"><div class="night-top"><span>你的第 <strong>${String(r.day).padStart(2,'0')}</strong> 个夜晚</span>${icon('moon')}</div><div class="season-progress"><i style="width:${r.day/DAYS*100}%"></i></div><div class="night-meta"><span>${chapter}</span><span>${r.day} / ${DAYS}</span></div><div class="action-counter"><span>今晚可用行动</span><div aria-label="剩余 ${r.ap} 次行动">${Array.from({length:3},(_,i)=>`<i class="${i<r.ap?'available':''}">${icon('spark')}</i>`).join('')}</div></div><p>每次行动让故事向前一小步。<br>也记得，为自己留一点空间。</p>${r.ended?btn('开启下一局 '+icon('arrow'),'next-run','','primary full next-run-button'):action(`${r.day===DAYS?'结束旅程':'结束这一晚'} ${icon('arrow')}`,'next','','primary full')}${r.ap===0&&!r.ended?'<small class="next-hint">今晚的行动已用完 · 休息后精力恢复</small>':''}</section>
        <section class="quick-actions"><div class="section-heading"><h2>今晚的安排</h2><span>1 次行动 / 项</span></div>
          ${action(`${icon('camera')}<span>留一张照片<small>精力 −8 · 平衡 −4 · 制作 +2 起</small></span>${icon('chevron')}`,'photo','','quick-action')}
          ${action(`${icon('sun')}<span>暂时摘下头显<small>精力 +28 · 平衡 +16</small></span>${icon('chevron')}`,'rest','','quick-action')}
          ${action(`${icon('bag')}<span>处理现实待办<small>资金 +50 · 精力 −10 · 平衡 +13</small></span>${icon('chevron')}`,'work','','quick-action')}
        </section>
        <section class="friends-online"><div class="section-heading"><h2>好友此刻</h2><span>${PEOPLE.filter(p=>r.relationships[p.id].met&&online(r,p.id)).length} 在线</span></div>${PEOPLE.filter(p=>r.relationships[p.id].met).map(p=>btn(`${avatar(p,'small',true)}<span class="friend-text"><b>${p.name}${r.relationships[p.id].status==='sugar'?'<em>砂糖</em>':''}</b><small>${online(r,p.id)?h('正在 '+get(WORLD,locationOf(r,p.id)).name):'今晚离线 · 各自也有生活'}</small></span>${icon('chevron')}`,'person',p.id,'friend-mini')).join('')}</section>
        <div class="quote-card"><span>✦</span><p>“重要的不只是遇见谁，<br>还有相遇时，你是谁。”</p><small>记得现实，也珍惜此刻。</small></div>
      </aside></div>
      <footer class="footer"><span>AFTER HOURS <i>·</i> 一场关于陪伴、创作与自己的实验</span>${btn('文化与故事来源 ↗','sources','','text-button')}</footer>
    </div>`;
  renderDialog();
}
function renderWorlds(r) {
  const w = get(WORLD, r.world);
  return `${renderStoryAgenda(r)}${renderStoryHints(r)}${renderMessages(r)}<section class="hero-scene" style="--scene-accent:${w.color}"><div class="scene-art">${scene(w.id,'hero')}</div><div class="scene-vignette"></div><div class="scene-top"><span class="scene-location"><i></i> 当前所在 <span>FRIENDS+</span></span><span class="scene-tag">${icon(w.icon)} ${w.tag}</span></div><div class="scene-copy"><div class="eyebrow">${w.en}</div><h2>${w.name}</h2><p>${w.desc}</p><div class="scene-bottom"><span>${icon('people')} ${peopleAt(r,w.id).filter(p=>r.relationships[p.id].met).length} 位熟悉的朋友在这里</span>${btn(`世界详情 ${icon('arrow')}`,'world',w.id,'scene-button')}</div></div><span class="scene-coordinates">INSTANCE / 0${WORLD.findIndex(x=>x.id===w.id)+1} <i>✦</i> LOCAL UNIVERSE</span></section>
    <section class="world-section"><div class="section-heading"><h2>选择探索的世界</h2><span>${icon('compass')} 已探索 ${r.visited.length} / 6</span></div><div class="world-grid">${WORLD.map((x,i)=>`<article class="world-card ${r.world===x.id?'current':''}" style="--scene-accent:${x.color}">${btn(`<div class="world-art">${scene(x.id,`card-${i}`)}<span class="world-marker">${r.visited.includes(x.id)?icon('check'):'0'+(i+1)}</span>${r.world===x.id?'<span class="here-tag">你在这里</span>':''}</div><div class="world-copy"><small>${x.en}</small><h3>${x.name}</h3><p>${x.tag}</p><small class="world-presence">今晚：${peopleAt(r,x.id).map(p=>r.relationships[p.id].met?p.name:'新面孔').join('、')||'安静的角落'}</small></div>`,'world',x.id,'world-preview',`aria-label="查看${x.name}"`)}<div class="world-card-bottom"><span>${icon('battery')} −${actionCost(r,'explore',x.id).energy} 精力</span>${action(`${r.world===x.id?'继续探索':'跃迁'} ${icon('arrow')}`,'explore',x.id,'world-enter')}</div></article>`).join('')}</div></section>
    ${renderRecent(r)}`;
}
function renderStoryAgenda(r) {
  const waiting=PEOPLE.filter(p=>r.relationships[p.id].intent?.state==='waiting'),future=r.queue.filter(q=>q.type==='scene' && q.id.startsWith('multi-'));
  return `<details class="story-agenda"><summary>这轮已留下 ${r.storyCount} 段故事 · 展开进度统计</summary><div><span class="eyebrow">STORIES IN MOTION</span><h2>今晚，故事会继续</h2><p>已读 ${r.storyCount} 段 · 群像 ${r.storySeen.filter(id=>id.startsWith('group-')).length} / ${GROUPS.length} · 日常 ${r.storySeen.filter(id=>id.startsWith('daily-')).length} / ${DAILY.length} · 角色近况 ${r.storySeen.filter(id=>id.startsWith('life-')).length} / 18 · 人物阶段小结 ${r.storySeen.filter(id=>id.startsWith('finale-')).length} / 6 · 社群支线 ${r.storySeen.filter(id=>id.startsWith('circle-')).length} / ${CIRCLE_SCENES.length} · 拍照 ${r.storySeen.filter(id=>id.startsWith('photo-')).length} / ${PHOTO_STORIES.length} · 朋友间砂糖 ${Object.values(r.npcBonds).filter(b=>b.status==='sugar').length} 段 · 选择会改变关系和后续相处。</p>${waiting.length?`<small>心意已送达：${waiting.map(p=>p.name).join('、')} · 相处和沟通会推动回应</small>`:''}${future.length?`<small>关系待续：${[...new Set(future.map(q=>get(PEOPLE,q.npc).name+' × '+get(PEOPLE,q.other).name))].join('、')}</small>`:''}</div>${btn('回看故事 '+icon('arrow'),'storybook','','text-button')}</details>`;
}
function renderRecent(r) {
  return `<section class="recent-section"><div class="section-heading"><h2>刚刚发生的故事</h2>${btn('全部日记 '+icon('arrow'),'journal','','text-button')}</div><div class="recent-grid">${r.logs.slice(0,2).map(l=>`<article class="recent-card"><div class="log-meta"><span>NIGHT ${String(l.day).padStart(2,'0')}</span>${icon(l.kind==='achievement'?'spark':l.kind==='story'?'book':'moon')}</div><h3>${h(l.title)}</h3><p>${h(l.text)}</p><div class="effects">${changes(l.changes)}</div></article>`).join('')}</div></section>`;
}
function renderStoryHints(r,npc=null) {
  const hints=storyHints(r,npc);if(!hints.length)return '';
  return `<details class="story-hints"><summary>${icon('compass')} 接下来可以做什么 <small>线索不消耗行动</small></summary><div class="hint-grid">${hints.map(x=>`<article><b>${h(x.title)}</b><p>${h(x.text)}</p></article>`).join('')}</div></details>`;
}
function renderMessages(r) {
  const all=availableMessages(r);if(r.ended)return renderLetters(r.letters,-1);if(!all.length)return '';
  const pins=state.legacy.reading.pins,messages=all.filter(m=>inboxCategory==='all'||m.category===inboxCategory).sort((a,b)=>Number(pins.includes(b.key))-Number(pins.includes(a.key))||Number(b.category==='finale')-Number(a.category==='finale')||a.index-b.index);
  const visible=inboxExpanded?messages:messages.slice(0,3),calm=state.legacy.reading.mode==='calm';
  return `<section class="story-inbox"><div class="section-heading"><h2>朋友发来的近况 · ${all.length}</h2><span>挑着读也可以 · 不消耗行动</span></div><div class="inbox-filters">${Object.entries(MESSAGE_CATEGORIES).filter(([id])=>id==='all'||all.some(m=>m.category===id)).map(([id,label])=>btn(label,'inbox-category',id,inboxCategory===id?'selected':'')).join('')}</div><div class="inbox-list">${visible.map(m=>{const event=sceneFor(r,r.queue[m.index]),summary=event?.text.replace(/\n+/g,' ').slice(0,115)||'';return `<article><div><small>${MESSAGE_CATEGORIES[m.category]}${pins.includes(m.key)?' · 已置顶':''}</small><b>${h(m.title)}</b>${calm?`<p class="inbox-summary">${h(summary)}${event?.text.length>115?'…':''}</p>`:''}</div><div>${btn(pins.includes(m.key)?'取消置顶':'置顶','pin-message',m.key,'text-button')}${btn((calm&&!['relationship','finale'].includes(m.category)?'先看摘要':'读这段故事')+' '+icon('arrow'),calm&&!['relationship','finale'].includes(m.category)?'message-preview':'read-message',m.index,'outline')}</div></article>`;}).join('')||'<p>这一类目前没有可读消息。</p>'}</div>${messages.length>3?btn(inboxExpanded?'收起近况列表':`展开其余 ${messages.length-3} 段近况`,'expand-inbox','','text-button'):''}<p class="dialog-muted">可以留到以后。结束旅程时已收到的正文会封存，补读不补选、不改变结局。</p></section>`;
}
function renderLetters(letters=[],bookIndex=-1){return letters.length?`<section class="sealed-letters"><div class="section-heading"><h2>旅程结束时留下的信件</h2><span>${letters.filter(x=>!x.read).length} 封待补读</span></div><p>这是当时已经收到、尚未展开的正文。补读不消耗行动，也不会改写结局、选择或路线收录。</p>${letters.map((x,i)=>`<article><div><small>${MESSAGE_CATEGORIES[x.category]} · ${x.read?'已补读':'待补读'}</small><b>${h(x.title)}</b></div>${btn(x.read?'再读这封':'补读正文','read-letter',bookIndex+':'+i,'outline')}</article>`).join('')}</section>`:'';}
function renderReview(items=[]){return items.length?`<section class="ending-review">${items.map(x=>`<article><h3>${h(x.title)}</h3><p>${h(x.text)}</p></article>`).join('')}</section>`:'';}
function renderGuide(r){const guide=firstNightGuide(r,state.legacy.guide);return guide&&(route==='worlds'||guide.route===route)?`<section class="first-nights"><div><small>前七夜 · 一次学一点</small><h2>${h(guide.title)}</h2><p>${h(guide.text)}</p></div><div>${btn(guide.label,'route',guide.route,'outline')}${btn('我想自己探索','guide-toggle','','text-button')}</div></section>`:'';}
function renderReply(){return recentReply?`<section class="recent-reply"><small>刚才的回应 · 已收进故事册</small><h3>${h(recentReply.title)}</h3><p class="story-text">${h(recentReply.text)}</p>${state.legacy.showEffects?`<div class="effects">${changes(recentReply.changes)}</div>`:''}${btn('收好这段回应','dismiss-reply','','text-button')}</section>`:'';}
function renderKeepsakes(r){const selected=state.legacy.books[archiveBookIndex],items=selected?.keepsakes||r.appointments.filter(a=>a.memento).map(a=>a.memento);return `<div class="book-select">${btn('本轮旅程','story-book',-1,archiveBookIndex<0?'selected':'')}${state.legacy.books.map((b,i)=>btn(`往期 ${i+1} · ${h(b.ending)}`,'story-book',i,archiveBookIndex===i?'selected':'')).join('')}</div><p class="section-description">赴约时真正留下的小卡、草图和共同发现。缩短相处或没有完成的经历，不会补造纪念物。</p><div class="keepsake-grid">${items.map((x,i)=>`<article><div class="keepsake-art">${scene(x.world,'keepsake-'+i)}</div><small>第 ${x.day} 夜 · ${x.cast.map(id=>get(PEOPLE,id).name).join('、')} · ${get(WORLD,x.world).name}</small><h3>${h(x.title)}</h3><p>${h(x.text)}</p></article>`).join('')||'<p>还没有共同收藏。一次认真赴过的约，也许会留下很小但具体的东西。</p>'}</div>`;}
function renderCalendar(r){
  const labels={proposed:'等待确认',confirmed:'已确认',changing:'正在改期',attending:'正在相处',missed:'曾失约',completed:'已赴约',cancelled:'已取消'};
  return `<div class="section-heading"><h2>本轮的具体约定</h2>${btn('提出一次预约','calendar-book','','primary',r.ended?'disabled':'')}</div><p class="section-description">每夜三次行动也代表三个时段。赴约包含前往世界，不必另花跃迁；预约不会自动代替你行动。提前说明的变更不记为失约。</p><div class="calendar-list">${[...r.appointments].sort((a,b)=>a.day-b.day||a.slot-b.slot).map(a=>`<article class="person-life"><small>第 ${a.day} 夜 · 第 ${a.slot} 次行动</small><h3>${a.cast.map(id=>get(PEOPLE,id).name).join('、')} · ${h(MEET_KINDS[a.kind])}</h3><p>${get(WORLD,a.world).name} · ${labels[a.status]}</p><div class="dialog-actions">${a.status==='confirmed'?action('按约赴约','attend',a.id,'primary')+btn('商量改期','booking-change',a.id,'outline')+btn('提前取消','booking-cancel',a.id,'outline'):''}</div><details><summary>这份约定的记录</summary><p>${a.history.map(x=>`第 ${x.day} 夜 · ${{propose:'提出时间',confirm:'确认预约',cancel:'提前取消','boundary-cancel':'按联系边界取消',miss:'没有按约出现','npc-change':'NPC 主动说明变化',reschedule:'双方改期',merge:'双方同意一起参加','merge-request':'询问共同参加',complete:'实际赴约'}[x.kind]}（原定第 ${x.when} 夜第 ${x.slot} 次行动）`).join('<br>')}</p></details></article>`).join('')||'<div class="empty-state"><p>还没有确认的预约。可以先认识朋友，再提出双方都方便的具体时间。</p></div>'}</div>`;
}
function renderLife(r,id) {
  const life=r.lives[id];if(!r.relationships[id].introduced)return '';
  if(departureContactReason(r,id))return '<section class="person-life"><h3>各自继续生活</h3><p>目前尊重暂不联系的范围，不再展示未获分享的新近况；已经读过的故事仍留在故事册。</p></section>';
  const plan=LIFE_PLANS[id];
  return `<section class="person-life"><div class="section-heading"><h2>${get(PEOPLE,id).name}自己的计划</h2><span>独立进展 ${life.milestones.length} / 3</span></div><b>${h(plan.goals[life.path])}</b><p>目前：${{working:'按计划尝试',delayed:'遇到阻碍，重新安排',retrying:'正在重试',reduced:'缩小了原定范围',paused:'已经暂停',finished:'这一阶段告一段落'}[life.plan.state]}。你可以了解、提出具体帮助或只听近况；建议可能被拒绝，暂停也可能延续到本轮结束。</p>${life.milestones.length?`<ol>${life.milestones.map((m,i)=>`<li><small>第 ${m.day} 夜</small> ${h(plan.paths[m.path][i][0])}${life.read>i?' · 已听过':' · 还未聊到'}</li>`).join('')}</ol>`:'<p>这段计划从本轮开始，尚未出现第一个实际进展。</p>'}</section>`;
}
function renderThemeChoices() {
  return `<details class="theme-choices" ${draft.theme?'open':''}><summary>本轮旅程主题 · ${draft.theme?h(get(THEMES,draft.theme).name):'经典旅程'}</summary><p>主题是跨局解锁的额外故事，每局最多选一条；角色与关系从新相遇开始。</p><div>${btn('经典旅程 · 不附加主题','theme','',draft.theme===null?'selected':'')}${THEMES.map(t=>{const unlocked=state.legacy.themesUnlocked.includes(t.id);return btn(`<b>${h(t.name)}</b><small>${unlocked?(state.legacy.themesCompleted.includes(t.id)?'已完成过 · 可以尝试另一种选择':'已解锁 · 3 章新故事'):h(t.condition)}</small>`,'theme',t.id,draft.theme===t.id?'selected':'',unlocked?'':'disabled');}).join('')}</div></details>`;
}
function renderThemeRewards() {
  const unlocked=THEMES.filter(t=>state.legacy.themesUnlocked.includes(t.id));
  return unlocked.length?`<section class="person-life"><h3>下一局，还有新的故事</h3><p>已解锁：${unlocked.map(t=>h(t.name)).join('、')}。下一局开局时最多选择一条，共有 ${state.legacy.themesCompleted.length} 条主题已经完整走过，已收录 ${state.legacy.themeRoutes.length} 种实际路线结尾与 ${state.legacy.detours.length} 种途中插曲回应。</p></section>`:'';
}
function renderThemeLibrary() {
  return `<section class="theme-library"><div class="section-heading"><h2>下一局可以遇见的新故事</h2><span>已解锁 ${state.legacy.themesUnlocked.length} / ${THEMES.length}</span></div><div class="hint-grid">${THEMES.map(t=>`<article><b>${h(t.name)}</b><p>${state.legacy.themesUnlocked.includes(t.id)?state.legacy.themesCompleted.includes(t.id)?'已走完三章 · 可以在下一局尝试另一种安排':'已解锁三章新故事 · 在下一局开局时选择':h(t.condition)}</p></article>`).join('')}</div><div class="route-collection"><h3>已走过的主题结尾 · ${state.legacy.themeRoutes.length}</h3>${state.legacy.themeRoutes.map(key=>{const [id,...choices]=key.split(':');const ending=themeRoute(get(THEMES,id),choices.map(Number));return `<details><summary>${h(get(THEMES,id).name+' · '+ending.title)}</summary><p>${h(ending.text)}</p></details>`;}).join('')||'<p>完成主题的三章并结算后，才会记录本轮真正走过的结尾。</p>'}<h3>已读人物阶段小结 · ${state.legacy.characterEndings.length} 种</h3>${state.legacy.characterEndings.map(key=>{const [npc,kind,choice]=key.split(':');return `<p>${get(PEOPLE,npc).name} · ${{0:'朋友',1:'砂糖',2:'告别后的朋友'}[kind]} · ${choice==='0'?'把这一刻留下':'给以后留一段空白'}</p>`;}).join('')||'<p>第 24 夜起，读完个人故事并留出两夜，朋友可能发来一段阶段小结；最终关系仍以结算回看为准。关系谈话与心意等待会优先完成。</p>'}</div></section>`;
}
function renderEpilogue(items) {
  return items.length?`<section class="epilogue"><h3>你们的后来</h3>${items.map(e=>`<article><h4>${h(e.title)}</h4><p>${h(e.text)}</p></article>`).join('')}</section>`:'';
}
function renderStorybook(r) {
  const selected=state.legacy.books[archiveBookIndex],book=selected?.stories || r.storybook;
  const letters=selected?.letters||r.letters;
  const filtered=searchBook(book,{person:storyPerson,query:storyQuery,favorites:favoritesOnly,keys:state.legacy.reading.favorites});
  return `<div class="book-select">${btn('本轮旅程','story-book',-1,archiveBookIndex<0?'selected':'')}${state.legacy.books.map((b,i)=>btn(`往期 ${i+1} · ${h(b.ending)}`,'story-book',i,archiveBookIndex===i?'selected':'')).join('')}</div><div class="journal-heading"><p>${selected?h(selected.name)+'的已完成旅程':'本轮完整故事'} · ${filtered.length} 段 · 按发生顺序回看</p>${btn(icon('download')+' 导出故事册','export-storybook','','outline')}</div><div class="book-select">${[['all','全部人物'],...PEOPLE.map(p=>[p.id,p.name])].map(([id,label])=>btn(label,'story-person',id,storyPerson===id?'selected':'')).join('')}</div><form class="book-search" id="book-search-form"><input id="story-query" type="search" maxlength="100" value="${h(storyQuery)}" placeholder="搜索标题、正文、选项和结果" aria-label="搜索故事"><button type="submit" class="outline">搜索</button>${btn(favoritesOnly?'显示全部':'只看收藏','favorite-filter','','outline')}${storyQuery?btn('清空搜索','clear-search','','text-button'):''}</form><p class="section-description">保存你实际读过的正文、全部选项和选择结果。旧版摘录仅保留当时仍在日记中的内容。</p>${renderLetters(letters,archiveBookIndex)}${selected?renderReview(selected.review):r.ended?renderReview(r.ending.review||endingReview(r)):""}<div class="storybook">${filtered.map(x=>`<details class="book-entry"><summary><small>第 ${x.day} 夜 ${x.partial?'· 旧版摘录':''}</small><b>${h(x.title)}</b></summary>${btn(state.legacy.reading.favorites.includes(entryKey(x))?'★ 已收藏':'☆ 收藏这段','favorite-story',entryKey(x),'text-button')}<p class="dialog-muted">${h(x.subtitle)}</p>${x.text?`<p class="story-text">${h(x.text)}</p>`:''}${x.options.length?`<ol>${x.options.map((label,i)=>`<li class="${i===x.choice?'chosen':''}">${h(label)}${i===x.choice?' · 当时的选择':''}</li>`).join('')}</ol>`:''}<p class="story-text">${h(x.result)}</p><div class="effects">${changes(x.changes)}</div></details>`).join('')||'<p class="section-description">这里还没有对应的故事。接下来的相遇会逐段收进来。</p>'}</div>${renderEpilogue(selected?.epilogue || (r.ended?epilogueFor(r):[]))}`;
}
function bookText(book) {
  return `# ${book.name}的完整故事册\n\n`+book.stories.map(x=>`第 ${x.day} 夜 · ${x.title}${x.partial?'（旧版摘录）':''}\n${x.text}\n${x.options.map((s,i)=>`${i===x.choice?'[已选择]':'[选项]'} ${s}`).join('\n')}\n结果：${x.result}\n`).join('\n')+'\n'+'\n'+(book.letters||[]).map(x=>`[结束时封存 · 未作选择] ${x.title}\n${x.text}\n${x.options.map(s=>'[当时可选] '+s).join('\n')}`).join('\n\n')+'\n'+(book.keepsakes||[]).map(x=>'[共同收藏] '+x.title+'\n'+x.text).join('\n\n')+'\n'+(book.review||[]).map(x=>x.title+'\n'+x.text).join('\n\n')+'\n'+(book.epilogue || []).map(e=>`${e.title}\n${e.text}\n`).join('\n');
}
function renderPeople(r) {
  const p = get(PEOPLE, selectedNpc), rel = r.relationships[selectedNpc];
  const status=rel.status==='sugar'?'砂糖搭档':rel.status==='salt'?'关系已告别':rel.intent?.state==='waiting'?'等待心意回应':rel.intent?.state==='rejected'?'已回应 · 朋友':[1,2].includes(r.storyFlags['initiative:'+p.id])?'已收到 TA 的心意':'朋友';
  const bonds=Object.entries(r.npcBonds).filter(([key])=>key.split(':').includes(p.id)).map(([key,b])=>get(PEOPLE,key.split(':').find(id=>id!==p.id)).name+' · '+(b.status==='sugar'?'砂糖':b.status==='salt'?'已告别':'朋友')).join(' / ');
  const links=Object.entries(r.npcLinks).filter(([key])=>key.split(':').includes(p.id)).map(([key,n])=>get(PEOPLE,key.split(':').find(id=>id!==p.id)).name+' · 熟悉度 '+n).join(' / ');
  return `<div class="people-strip">${PEOPLE.map(n=>btn(`${avatar(n,'',true)}<b>${r.relationships[n.id].met?n.name:'未遇见'}</b><small>${r.relationships[n.id].met?(online(r,n.id)?get(WORLD,locationOf(r,n.id)).name:'今晚离线'):'探索新世界'}</small>`,'select-person',n.id,`person-selector ${selectedNpc===n.id?'selected':''}`)).join('')}</div>
    <section class="person-detail" style="--person:${p.color}"><div class="person-header">${avatar(p,'large')}<div><div class="eyebrow">${p.handle}</div><h2>${p.name}<span class="relationship-tag">${rel.met?status:'等待初次相遇'}</span></h2><p>${p.avatar}</p></div><span class="presence ${online(r,p.id)?'on':''}"><i></i>${online(r,p.id)?'今晚在线':'今晚离线'}</span></div><p class="person-bio">${p.bio}</p><blockquote>${p.line}</blockquote>
    ${rel.met ? `<div class="relationship-meters">${meter('亲密',rel.affection,p.color,'heart')}${meter('信任',rel.trust,'#8ec9b8','flower')}${meter('关系压力',rel.tension,rel.tension>35?'#ec9e90':'#999eb1','cloud')}</div><div class="relationship-insight">${icon('book')}<div><b>相处线索</b><p>${p.hint}</p><small>喜欢的世界：${p.prefer.map(id=>get(WORLD,id).name).join(' / ')}<br>今晚所在：${online(r,p.id)?get(WORLD,locationOf(r,p.id)).name:'离线'} · 会随夜晚变动<br>${bonds?'TA 与其他朋友的关系：'+h(bonds)+'<br>':''}${departureSummary(r,p.id)?'关系后续：'+h(departureSummary(r,p.id))+'<br>':''}${links?'角色间经历：'+h(links)+'<br>':''}已相处 ${rel.meetings} 次 · 个人故事 ${rel.stage} / 2 章<br>心意前的相处 ${romanceProgress(r,p.id)} / 2 段 · 跨夜逐步靠近 ${rel.communicated?'· 已聊过边界':''}</small></div></div>${renderRelationActions(r,p,rel)}<details class="relation-rules"><summary>查看相处与故事的详细规则</summary><p class="relation-note">${p.id==='ash'?'阿澈珍惜朋友关系，坦诚告白也不会改变 TA 的选择。':'先通过个人经历和两段心意前的相处故事慢慢靠近，再通过告白对话和角色回应推进。可以立即确认、继续了解或明确拒绝；等待随性格、后续相处和边界沟通变化，不固定三晚。角色也会按性格主动靠近：有人直接说喜欢，有人先试探；害羞的人在旅程后期可能鼓起勇气更快说清心意。可以有多段砂糖关系，但是否知情与是否接受，会引出后续剧情。'}<br>个人故事：先相处两次、信任达到 25；第 8 夜起，信任 45、亲密 30 且距第一章至少两夜，可读第二章。已读日常不会反复弹出；没有新分支时，相处结果仍会记入日记。角色也会与其他朋友互动。TA 可以与其他朋友成为砂糖，也可能提出告别。分开前先读两段跨夜故事，再进入正式提议；不愿分开的一方可以表达挽留，双方愿意调整时可以继续，否则仍可能分开。分开后还有联系边界与重新相处的两段后续。</p></details>` : `<div class="empty-state">${icon('compass')}<h3>有些名字，要在世界里遇见</h3><p>${online(r,p.id)?'TA 今晚在'+get(WORLD,locationOf(r,p.id)).name+'，可以去探索相遇。':'TA 今晚离线；各自也有生活。'}地点随夜晚变化，偏好只影响约会体验。</p>${btn('去探索世界 '+icon('arrow'),'route','worlds','primary')}</div>`}</section>${renderLife(r,p.id)}${renderStoryHints(r,p.id)}${renderMessages(r)}${renderNpcBonds(r)}${renderRecent(r)}`;
}
function renderRelationActions(r,p,rel){
 const extra=action(icon('heart')+' 现在相处','date',p.id,'outline','立即使用当前世界的场景 · 1 次行动 · 精力 −16 · 平衡 −7')+action(icon('camera')+' 在当前世界一起拍照','photo',p.id,'outline','精力 −8 · 平衡 −4 · 需要双方在场')+btn(icon('people')+' 邀请朋友一起相处','together-menu',p.id,'outline')+action('聊清相处边界','boundary',p.id,'outline','精力 −8 · 平衡 −2')+(rel.status==='sugar'?action('谈谈关系是否继续','breakup',p.id,'outline danger','精力 −8 · 跨夜前置与回应'):action(rel.intent?.state==='waiting'?'等待心意回应':'表达心意','confess',p.id,'primary','精力 −10 · 需要前置相处与明确回应'));
 const simple=state.legacy.guide&&r.day<4&&rel.stage===0&&rel.status==='friend';
 const last=r.appointments.findLast(a=>a.status==='completed'&&a.cast.includes(p.id)&&a.memento);
 return `<div class="relation-actions">${action(icon('coffee')+' 现在聊聊（远程）','talk',p.id,'outline','不会移动世界 · 1 次行动 · 精力 −10 · 平衡 −4')}${btn(icon('moon')+' 预约具体时间','calendar-book',p.id,'primary')}</div>${simple?`<details class="more-actions"><summary>更多相处方式 · 想了解时再展开</summary><div class="relation-actions">${extra}</div></details>`:`<div class="relation-actions">${extra}</div>`}${last?`<p class="shared-memory">上次真正留下的共同收藏：${h(last.memento.title)}${btn('去收藏里看看','keepsakes','','text-button')}</p>`:''}<p class="relationship-rhythm">关系增长会随熟悉程度与当晚的相处量放缓。近况不必清空；重要的是实际做过什么，以及是否听见这次不同的愿望。</p>`;
}
function choiceEffects(r,event,c) {
  if(!state.legacy.showEffects)return pills(Object.fromEntries(Object.entries(c.effects||{}).filter(([key,n])=>['energy','money'].includes(key)&&n<0)));
  let out=pills(previewEffects(r,c.effects));
  const relation=(id,rel)=>{const effects=pills({},previewRelations(r,id,rel,r.pending?.fromInbox===true));return effects?`<span class="choice-other">${get(PEOPLE,id).name}与你 ${effects}</span>`:'';};
  if(event.npc && c.rel)out+=relation(event.npc,c.rel);
  if(event.other && c.otherRel)out+=relation(event.other,c.otherRel);
  for(const [id,rel] of Object.entries(c.castRel || {}))out+=relation(id,rel);
  const bondEffects=(cast,effects)=>{const bond=r.npcBonds[[...cast].sort().join(':')];if(!bond || bond.status!=='sugar')return '';const actual=Object.fromEntries(Object.entries(effects).map(([key,n])=>[key,Math.max(0,Math.min(100,bond[key]+n))-bond[key]]));return `<span class="choice-other">${cast.map(id=>get(PEOPLE,id).name).join('与')}之间 ${pills({},actual)}</span>`;};
  if(c.pairEffects && event.other)out+=bondEffects([event.npc,event.other],c.pairEffects);
  for(const update of c.bondChanges || [])out+=bondEffects(update.cast,update.effects);
  if(event.other && c.otherRel) {const before=r.npcLinks[[event.npc,event.other].sort().join(':')] || 0,delta=c.npcLinkDelta ?? (c.otherRel.trust<0 || c.otherRel.tension>0?-4:4);const actual=Math.max(0,Math.min(100,before+delta))-before;if(actual)out+=`<span class="choice-other">两人熟悉度 <span class="effect ${actual>0?'positive':'negative'}">${actual>0?'+':''}${actual}</span></span>`;}
  return out;
}
function renderNpcBonds(r) {
  const bonds=Object.entries(r.npcBonds);
  for(const route of NPC_ROUTES){const key=[...route.cast].sort().join(':');if(!r.npcBonds[key] && preludeProgress(r,...route.cast))bonds.push([key,{status:'friend',stage:0}]);}
  return `<section class="npc-relationships"><div class="section-heading"><h2>朋友们的关系故事</h2><span>${icon('heart')} 他们也有自己的生活</span></div>${bonds.length?`<div class="npc-bond-grid">${bonds.map(([key,b])=>{const cast=key.split(':').map(id=>get(PEOPLE,id));const status=b.status==='sugar'?(b.open?'砂糖关系 · 已协商多段':'砂糖关系'):b.status==='salt'?'已结束砂糖':b.stage===4?'等待边界沟通':b.stage===0?`慢慢了解 · 前置故事 ${preludeProgress(r,...key.split(':'))} / 2`:'保持朋友';return `<article class="npc-bond-card ${b.status}"><div class="npc-bond-people">${cast.map(p=>avatar(p,'small')).join('')}<h3>${cast.map(p=>p.name).join(' × ')}</h3></div><b>${status}</b><p>${b.status==='sugar'?`从第 ${b.sinceDay} 夜开始 · ${b.stage===2?'已聊过相处安排':'新的关系故事'}`:b.status==='salt'?`${get(PEOPLE,b.initiator).name}主动提出告别 · 第 ${b.lastDay} 夜`:b.stage===4?'新的喜欢需要尊重已有关系的约定。':'先有共同经历，再跨夜了解与磨合；故事可以亲历，也可以听朋友转述。'}</p>${departureSummary(r,...key.split(':'))?`<small>${h(departureSummary(r,...key.split(':')))}</small>`:''}${b.status==='sugar'?`<small>彼此信任 ${b.trust} · 相处压力 ${b.tension}</small>`:''}</article>`;}).join('')}</div>`:'<p class="section-description">读完初次相遇后，朋友间的互动可能发展成砂糖。他们会确认心意、商量相处，也可以主动告别。</p>'}</section>`;
}
function renderStudio(r) {
  return `<section class="studio-banner"><div><div class="eyebrow">MAKE A LITTLE MAGIC</div><h2>上传的不只是模型，<br>也是一点点自己的光。</h2><p>每次制作消耗 1 次行动、18 精力、10 资金、6 现实平衡。<br>制作达到 55 后，每次推进 2 格。</p></div><div class="studio-illustration">${scene('studio','studio-banner')}</div></section><div class="section-heading"><h2>正在进行的项目</h2><span>3 个创作目标</span></div><div class="project-grid">${PROJECTS.map(p=>{const v=r.projects[p.id],done=v>=p.goal;return `<article class="project-card ${done?'completed':''}"><span class="project-icon">${icon(p.icon)}</span><span class="project-status">${done?'已完成':'ONGOING'}</span><h3>${p.name}</h3><p>${p.desc}</p><div class="project-progress">${Array.from({length:p.goal},(_,i)=>`<i class="${i<v?'filled':''}"></i>`).join('')}<span>${v}/${p.goal}</span></div>${action(done?icon('check')+' 已发布':`继续制作 ${icon('arrow')}`,'project',p.id,'outline full',done?'':'制作 +4 起 · 高属性增长放缓')}</article>`;}).join('')}</div><section class="gear-section"><div class="section-heading"><h2>让体验舒服一点</h2><span>${icon('coin')} 资金 ${r.stats.money}</span></div><p class="section-description">设备提供玩法加成；桌面模式也能完成所有故事与结局。购买不消耗行动。</p><div class="gear-grid">${GEAR.map(g=>`<article class="gear-card"><span>${icon(g.icon)}</span><div><h3>${g.name}</h3><p>${g.desc}</p></div>${action(r.gear.includes(g.id)?icon('check')+' 已拥有':`${g.price} 资金`,'buy',g.id,'outline')}</article>`).join('')}</div></section>`;
}
function renderArchive(r) {
  return `<div class="archive-tabs">${[['memories','spark','跨局回忆'],['stories','book','完整故事册'],['journal','book','夜航日记'],['keepsakes','flower','共同收藏'],['photos','camera','我们的相册'],['achievements','flower','成就与结局']].map(([id,glyph,label])=>btn(`${icon(glyph)} ${label}`,'archive-tab',id,archiveTab===id?'selected':'')).join('')}</div>${archiveTab==='keepsakes'?renderKeepsakes(r):archiveTab==='stories'?renderStorybook(r):archiveTab==='journal'?renderJournal(r):archiveTab==='photos'?renderPhotos(r):archiveTab==='achievements'?renderAchievements(r):renderMemories()}`;
}
function renderMemories() {
  const l=state.legacy;
  return `${renderThemeLibrary()}<section class="memory-intro"><span class="memory-spark">${icon('spark')}</span><div><h2>把经验带走，把人生重开</h2><p>完成 28 夜获得回忆碎片。解锁永久回忆，下一次开局最多携带 3 份；已开始的旅程保持原有配置。</p></div><div class="memory-currency"><b>${l.points}</b><span>可用回忆碎片</span></div></section><div class="section-heading"><h2>你的回忆行李</h2><span>已选择 ${l.equipped.length} / 3</span></div><div class="memory-grid">${MEMORIES.map(m=>{const owned=l.unlocked.includes(m.id),equipped=l.equipped.includes(m.id);return `<article class="memory-card ${equipped?'equipped':''} ${owned?'':'locked'}"><span class="memory-icon">${icon(m.icon)}</span>${equipped?'<span class="equipped-label">下局携带</span>':''}<h3>${m.name}</h3><p>${m.desc}</p>${owned?btn(equipped?icon('check')+' 已选择':'放进行李 '+icon('arrow'),'equip',m.id,'outline full'):btn(`解锁 · ${m.cost} 碎片`,'unlock',m.id,'outline full',l.points<m.cost?'disabled title="完成旅程后获得碎片"':'')}</article>`;}).join('')}</div><p class="section-description">第一轮完成后即可解锁多份回忆。每次重开获得 3 碎片，每个首次成就 +1，首次结局 +2。</p><div class="section-heading"><h2>过去的航程</h2><span>已完成 ${l.runs} 次</span></div>${l.history.length?`<div class="history-list">${l.history.map((x,i)=>`<div><span class="history-number">${String(l.runs-i).padStart(2,'0')}</span><div><b>${h(x.ending)}</b><small>${h(x.name)}的 ${x.day} 个夜晚</small></div><span>+${x.reward} 碎片</span></div>`).join('')}</div>`:`<div class="empty-state compact">${icon('moon')}<p>第一段旅程还在继续。先把这个晚上过好。</p></div>`}`;
}
function renderJournal(r) {
  return `<div class="journal-heading"><p> ${r.logs.length} 条已记录的故事 · 最近的夜晚在最上方</p>${btn(icon('download')+' 导出日记','export-journal','','outline')}</div><div class="journal">${r.logs.map(l=>`<article class="journal-entry"><span class="journal-day">${String(l.day).padStart(2,'0')}<small>NIGHT</small></span><div><div class="log-meta"><span>${{system:'夜晚开始',story:'分支故事',relationship:'关系消息',achievement:'成就回忆',action:'你的行动'}[l.kind]}</span></div><h3>${h(l.title)}</h3><p>${h(l.text)}</p><div class="effects">${changes(l.changes)}</div></div></article>`).join('')}</div>`;
}
function renderPhotos(r) {
  return r.photos.length?`<div class="photo-grid">${[...r.photos].reverse().map((p,i)=>`<article class="photo-card"><div>${scene(p.world,`photo-${i}`)}</div><h3>${h(p.title || get(WORLD,p.world).name)}</h3><p>第 ${p.day} 夜 · ${get(WORLD,p.world).name}<br>${p.with?'与 '+get(PEOPLE,p.with).name+'合照':p.companion?'与 '+get(PEOPLE,p.companion).name+'同行 · 只拍风景':'一个人的风景'}</p>${p.caption?`<p class="photo-caption">${h(p.caption)}</p>`:''}<span>私人相册 · WE WERE HERE ✦</span></article>`).join('')}</div>`:`<div class="empty-state">${icon('camera')}<h3>相册里，还空着一个好晚上</h3><p>每晚可以拍一张照片。点右侧的“留一张照片”，选择拍当前世界的风景，或与已认识且在场的朋友一起拍。</p>${btn('去找一处风景 '+icon('arrow'),'route','worlds','primary')}</div>`;
}
const ENDINGS = [['weave','几条轨道，一起发光'],['sugar','两个人，各自发光'],['fragile','仍在练习的拥抱'],['creator','世界里，有你的一盏灯'],['friends','不止一种重要'],['goodbye','海盐留在风里'],['traveler','下一扇传送门'],['quiet','一个普通的好晚上'],['burnout','先回到自己身边']];
function renderAchievements(r) {
  const owned=[...new Set([...state.legacy.achievements,...r.achievements])];
  return `<div class="section-heading"><h2>每个小小的第一次</h2><span>${owned.length} / ${ACHIEVEMENTS.length}</span></div><div class="achievement-grid">${ACHIEVEMENTS.map(a=>`<article class="achievement-card ${owned.includes(a.id)?'earned':''}">${icon(a.icon)}<div><h3>${a.name}</h3><p>${a.desc}</p></div>${owned.includes(a.id)?icon('check'):''}</article>`).join('')}</div><div class="section-heading ending-heading"><h2>人生可能的结尾</h2><span>${state.legacy.endings.length} / ${ENDINGS.length}</span></div><div class="ending-grid">${ENDINGS.map(([id,name])=>`<div class="ending-tile ${state.legacy.endings.includes(id)?'discovered':''}">${icon(id==='sugar'?'heart':id==='creator'?'cube':'moon')}<b>${state.legacy.endings.includes(id)?name:'尚未抵达'}</b><small>${state.legacy.endings.includes(id)?'已收录':'每个方向，都有一段故事'}</small></div>`).join('')}</div>`;
}

function openDialog(type, data = {}) { dialog={type,...data}; renderDialog(); }
function closeDialog() { if(dialog?.type==='response'){acknowledgeNotice(state.run);save();dialog=null;render();return;}dialog=null;renderDialog(); }
function renderDialog() {
  if (state.run?.pending && !['result','response'].includes(dialog?.type)) dialog={type:'story'};
  const root=$('#modal-root');
  const old=$('#game-dialog'); if (old) { old.close(); old.remove(); }
  if (!dialog) return;
  const r=state.run || preview;
  let body='', cls='', canClose=true;
  if(dialog.type==='calendar-book'){const friends=PEOPLE.filter(p=>r.relationships[p.id].introduced&&!departureContactReason(r,p.id));body=`<div class="eyebrow">A TIME WE BOTH CONFIRM</div><h2 id="dialog-title">提出一次具体预约</h2><p class="story-text">提出与改期不消耗行动。确认后的赴约占用指定那一次行动，包含前往世界；对方离线的夜晚不能预约。</p><div class="calendar-form"><label>朋友<select id="book-person">${friends.map(p=>`<option value="${p.id}" ${p.id===dialog.npc?'selected':''}>${p.name}</option>`).join('')}</select></label><label>夜晚<select id="book-day">${Array.from({length:29-r.day},(_,i)=>`<option value="${r.day+i}">第 ${r.day+i} 夜</option>`).join('')}</select></label><label>时段<select id="book-slot">${[1,2,3].map(n=>`<option value="${n}" ${n===r.nightActions+1?'selected':''}>第 ${n} 次行动</option>`).join('')}</select></label><label>地点<select id="book-world">${WORLD.map(w=>`<option value="${w.id}" ${w.id===r.world?'selected':''}>${w.name}</option>`).join('')}</select></label><label>安排<select id="book-kind">${Object.entries(MEET_KINDS).map(([id,label])=>`<option value="${id}">${label}</option>`).join('')}</select></label></div>${btn('向对方提出时间','book-confirm','','primary full',friends.length?'':'disabled')}`;}
  if(dialog.type==='slot-warning'){body=`<h2 id="dialog-title">这次行动会占用已预约的时段</h2><p class="story-text">${slotAppointments(r).map(a=>a.cast.map(id=>get(PEOPLE,id).name).join('、')).join('；')}正在等这一段约好的时间。继续其他行动会产生失约；也可以返回日历先改期或取消。</p><div class="dialog-actions">${btn('返回安排','close','','outline')}${btn('仍做这次行动','slot-proceed','','primary')}</div>`;}
  if (dialog.type==='setup') {
    canClose=!!state.run; cls='setup-dialog';
    body=`<div class="setup-art"><div>${scene('orbit','setup')}</div><span class="eyebrow">A SECOND LIFE. YOUR OWN WAY.</span><h2 id="dialog-title">夜航<small>AFTER HOURS</small></h2><p>把今晚，过成自己的故事。</p><div class="setup-features"><span>${icon('moon')} 28 个夜晚</span><span>${icon('people')} 6 位原创朋友</span><span>${icon('spark')} 多份回忆继承</span></div><small>世界探索 × 砂糖关系 × 创作生活<br>原创虚构故事 · 全部角色设定为成年人</small></div><div class="setup-form"><div class="eyebrow">YOUR JOURNEY BEGINS</div><h3>${state.run?'准备下一次夜航':'欢迎来到第二人生'}</h3><p>不必成为别人。先选一个舒服的自己。</p><label for="player-name">你的名字</label><input id="player-name" maxlength="20" value="${h(draft.name)}" placeholder="朋友们会这样称呼你" autocomplete="off"><label>从什么设备开始？</label><div class="device-choice">${btn(icon('compass')+' 桌面模式<small>资金 140 · 不必拥有 VR</small>','device','desktop',draft.device==='desktop'?'selected':'')}${btn(icon('headset')+' VR 模式<small>资金 100 · 社交额外 +5</small>','device','vr',draft.device==='vr'?'selected':'')}</div><label>选择 2 个天赋 <span>${draft.traits.length}/2</span></label><div class="trait-grid">${TRAITS.map(t=>btn(`${icon(t.icon)}<span><b>${t.name}</b><small>${t.desc}</small></span>${draft.traits.includes(t.id)?icon('check'):''}`,'trait',t.id,draft.traits.includes(t.id)?'selected':'',`aria-pressed="${draft.traits.includes(t.id)}"`)).join('')}</div>${renderThemeChoices()}${state.legacy.equipped.length?`<p class="carry-note">本次携带：${state.legacy.equipped.map(id=>get(MEMORIES,id).name).join('、')}</p>`:''}${btn('进入第一个夜晚 '+icon('arrow'),'begin','','primary full',draft.traits.length!==2?'disabled':'')}<small class="setup-note">每轮自动保存 · 无需账号 · 无需联网</small></div>`;
  }
  if (dialog.type==='story') {
    canClose=false; const e=currentEvent(r), p=e.npc?get(PEOPLE,e.npc):null,previous=previousChoice(state.legacy.reading,e);
    body=`<div class="story-label">${icon('book')} 一段故事正在发生 <span>选择不额外消耗行动</span></div><div class="reading-tools">${btn('字号：'+({small:'小',normal:'标准',large:'大'}[state.legacy.reading.font]),'font-size',({small:'normal',normal:'large',large:'small'}[state.legacy.reading.font]),'text-button')}${btn(state.legacy.showEffects?'隐藏选项数值':'显示选项数值','toggle-effects','','text-button')}${r.pending.id==='introduction'&&state.legacy.introductions.includes(r.pending.npc)?btn('略过已读相遇','skip-intro','','text-button'):''}</div>${previous!==null?`<p class="read-again">这段正文、选项与结果条件都与读过的版本一致。${btn('沿用已读选择：'+h(e.choices[previous].label),'repeat-choice',previous,'text-button')}</p>`:''}<div class="eyebrow">${h(e.subtitle)}</div><h2 id="dialog-title">${h(e.title)}</h2>${p?`<div class="story-person">${avatar(p,'small')}<span>${p.name} <small>${p.handle}</small>${e.other?' × '+get(PEOPLE,e.other).name:''}</span></div>`:''}<p class="story-text">${h(e.text)}</p><div class="story-choices">${e.choices.map((c,i)=>btn(`<span class="choice-num">0${i+1}</span><div><b>${h(c.label)}</b><span class="effects">${choiceEffects(r,e,c)}</span></div>${icon('arrow')}`,'choice',i,'story-choice',c.unavailable?`disabled title="${h(c.unavailable)}"`:c.effects.money&&r.stats.money+c.effects.money<0?'disabled title="资金不足"':'')).join('')}</div>`;
  }
  if (dialog.type==='response') {
    canClose=false;const n=r.notice,confirmed=['accepted','npc-sugar','repaired'].includes(n.answer);
    const labels={accepted:'双方已经确认关系',waiting:'正在等待 · 后续相处会推动回应',rejected:'答案已明确 · 不必继续猜测',ended:'砂糖关系已结束 · 分开后的故事仍会继续',reconsider:'尚未分开 · 挽留已听见，另一晚再作决定',repaired:'双方确认继续砂糖 · 新的安排需要兑现','npc-sugar':'两位朋友已共同确认砂糖关系','npc-ended':'两位朋友已确认告别 · 共同经历仍然保留',invitation:'你的回答已送达 · 关系按双方的意愿推进',withdraw:'可以按自己的节奏继续'};
    body=`<div class="response-heading ${confirmed?'accepted':''}"><span>${icon(confirmed?'heart':n.answer==='rejected'?'flower':'moon')}</span><div class="eyebrow">A CLEAR MOMENT IN YOUR STORY</div><h2 id="dialog-title">${h(n.title)}</h2><p>${labels[n.answer]}</p></div><p class="story-text">${h(n.text)}</p><p class="dialog-muted">这段关系进展已保存在夜航日记中。窗口会保留，直到你确认。</p>${btn('我已读完这份回应 '+icon('arrow'),'close','','primary full')}`;
  }
  if(dialog.type==='photo') {
    const w=get(WORLD,r.world),friends=peopleAt(r,r.world).filter(p=>r.relationships[p.id].introduced),elsewhere=PEOPLE.filter(p=>r.relationships[p.id].introduced && !friends.includes(p));
    body=`<div class="dialog-scene">${scene(w.id,'photo-picker')}</div><div class="eyebrow">A PHOTO, A SHARED MOMENT</div><h2 id="dialog-title">在${w.name}，想怎样留念？</h2><p class="story-text">先选拍摄对象；选择完成后消耗 1 次行动、8 精力和 4 现实平衡。故事会随当前世界、同行者和共同经历变化，不额外消耗行动。合照不会自动确认砂糖，所有照片都只保存在本机的私人相册。</p><div class="settings-actions">${action(icon('camera')+' 一个人拍这里的风景','photo','','outline','当前世界的独处拍照故事','data-photo-confirm')}${friends.map(p=>action(`${icon('people')} 与${p.name}一起拍`,'photo',p.id,'outline','先商量站位，决定是否入镜')).join('')}</div>${friends.length?'':'<p class="dialog-muted">此刻没有已读完初次相遇的朋友在这个世界。可以先拍风景，或去朋友所在的世界探索相遇。</p>'}${elsewhere.length?`<p class="dialog-muted">其他朋友：${elsewhere.map(p=>p.name+' · '+(online(r,p.id)?get(WORLD,locationOf(r,p.id)).name:'今晚离线')).join(' / ')}。合照需要双方同在当前世界。</p>`:''}`;
  }
  if(dialog.type==='together') {
    const p=get(PEOPLE,dialog.npc),friends=PEOPLE.filter(n=>n.id!==p.id && r.relationships[n.id].introduced);
    body=`<div class="eyebrow">ONE INVITATION, THREE STORIES</div><h2 id="dialog-title">和${p.name}一起，邀请谁？</h2><p class="story-text">邀请两位已认识且今晚在线的朋友，消耗 1 次行动、15 精力和 6 现实平衡。之后的选择会影响两人对你的感受、彼此熟悉度，以及已有砂糖的信任和压力。</p><div class="settings-actions">${friends.map(n=>action(`${n.name} ${online(r,n.id)?'· 今晚在线':'· 今晚离线'}`,'together',`${p.id}:${n.id}`,'outline')).join('')}</div>${friends.length?'':'<p class="dialog-muted">先在世界中认识其他朋友，再邀请他们一起相处。</p>'}`;
  }
  if (dialog.type==='result') {
    const l=dialog.log;
    body=`<div class="eyebrow">${dialog.exploration?'EXPLORATION COMPLETE':'A MOMENT TO REMEMBER'}</div><h2 id="dialog-title">${h(l.title)}</h2>${dialog.exploration?`<p class="dialog-muted">本次探索未触发新的分支剧情，游览与偶遇的结果已记录。<br>已消耗 1 次行动 · 今晚剩余 ${r.ap} 次行动</p>`:''}<p class="story-text">${h(l.text)}</p><div class="effects result-effects">${changes(l.changes)}</div>${r.pending?'<p class="dialog-muted">还有一段故事等待你，确认后会依次展开。</p>':''}${btn((r.pending?'继续下一段故事':dialog.exploration?'继续今晚的安排':'把这一刻记下来')+' '+icon('arrow'),'close','','primary full')}`;
  }
  if (dialog.type==='world') {
    const w=get(WORLD,dialog.id);
    body=`<div class="dialog-scene">${scene(w.id,'detail')}</div><div class="eyebrow">${w.en}</div><h2 id="dialog-title">${w.name}</h2><p class="story-text">${w.details}</p><div class="effects">${pills(explorationEffects(r,w.id))}</div><p class="dialog-muted">今晚在这里：${peopleAt(r,w.id).map(p=>r.relationships[p.id].met?p.name:'尚未认识的旅人').join(' / ')||'暂时没有朋友停留'}<br>角色会移动，世界偏好只影响相处体验<br>每次消耗 1 次行动及上方标注的精力，用于游览与偶遇；当前世界也可以继续探索。<br>偶遇根据每晚的在线安排发生，每次最多相遇一位朋友；每次活动都会推进故事，个人经历与群像交织。</p>${action((r.world===w.id?'继续探索':'跃迁')+' '+icon('arrow'),'explore',w.id,'primary full')}`;
  }
  if (dialog.type==='advance') {
    body=`<div class="eyebrow">GOOD NIGHT, GOOD LIFE</div><h2 id="dialog-title">${r.day===DAYS?'为这段旅程写一个结尾？':'把故事，留给明天？'}</h2><p class="story-text">今晚还剩 ${r.ap} 次行动。${renderGuide(r)}${renderReply()}${r.appointments.some(a=>a.status==='confirmed'&&a.day===r.day)?'今晚还有未赴的预约；直接结束会记为失约，可以先到日历提前取消或改期。':''}${r.day===DAYS?'结束后会生成结局，收获回忆碎片。'+(availableMessages(r).length?'仍有 '+availableMessages(r).length+' 段已收到的近况，其中包括：'+h(availableMessages(r).slice(0,4).map(m=>m.title).join('、'))+'。可以返回先回应；也可以结束后在故事册补读正文，但不能再补选或推进后续。':''):`提前结束也没关系；剩余行动不会带到下一晚。睡一觉，按今晚安排恢复 ${nightRecovery(r)} 精力、心情 −4。三次行动用满恢复 18、用两次恢复 24、用零或一次恢复 30；舒适头带和恢复回忆各额外 +3。提前结束会恢复 3 现实平衡。`}</p><div class="dialog-actions">${btn('再待一会儿','close','','outline')}${btn(r.day===DAYS?'结束旅程':'说晚安，去休息','advance-confirm','','primary')}</div>`;
  }
  if (dialog.type==='ending') {
    const e=r.ending; cls='ending-dialog';
    body=`<div class="ending-art">${scene(e.id==='sugar'?'garden':e.id==='creator'?'studio':'orbit','ending')}</div><div class="eyebrow">YOUR STORY · ${DAYS} NIGHTS</div><h2 id="dialog-title">${h(e.name)}</h2><p class="ending-subtitle">${h(e.subtitle)}</p><p class="story-text">${h(e.text)}</p>${renderReview(r.ending.review||endingReview(r))}${r.ending.legacy?'<p class="dialog-muted">原结局按旧版本规则保留；以上分别回看这一轮的实际关系、生活与创作。</p>':''}${r.letters.length?`<p class="letters-notice">还有 ${r.letters.filter(x=>!x.read).length} 封已收到的信件可以补读。${btn('去故事册读信','storybook','','outline')}</p>`:''}${renderEpilogue(epilogueFor(r))}${renderThemeRewards()}<div class="ending-stats"><div><b>${r.visited.length}</b><span>世界足迹</span></div><div><b>${Object.values(r.relationships).filter(x=>x.met).length}</b><span>相遇的朋友</span></div><div><b>${r.achievements.length}</b><span>本轮成就</span></div><div><b>+${r.reward||0}</b><span>回忆碎片</span></div></div><p class="dialog-muted">去回忆档案解锁并选择最多 3 份回忆，再开始下一段旅程。已解锁的旅程主题也可以在下一局开局时选择。完整故事册可导出留念；最近三次完成的旅程会保留故事册与尾声，新开局会替换本轮日记和相册。</p><div class="dialog-actions">${btn('开启下一局 '+icon('arrow'),'next-run','','primary next-run-button')}${btn(icon('download')+' 下载旅程备份','export','','outline')}${btn('整理跨局回忆','ending-archive','','outline')}</div>`;
  }
  if(dialog.type==='letter'){const letter=dialog.letter;body=`<div class="eyebrow">旅程结束时封存的正文</div><h2 id="dialog-title">${h(letter.title)}</h2><p class="dialog-muted">${h(letter.subtitle)}</p><p class="story-text">${h(letter.text)}</p><p class="dialog-muted">当时可选的回应（未作选择）：</p><ul>${letter.options.map(x=>`<li>${h(x)}</li>`).join('')}</ul><p class="dialog-muted">这次只补读已收到的正文，不补写选择结果，不解锁后续，也不改动已结算的关系和奖励。</p>${btn('收好这封信','close','','primary full')}`;}
  if(dialog.type==='message-preview'){const q=r.queue[dialog.index],event=q&&sceneFor(r,q);body=`<div class="eyebrow">朋友近况 · 先看一小段</div><h2 id="dialog-title">${h(event?.title||'这段消息已变化')}</h2><p class="story-text">${h(event?.text.replace(/\n+/g,' ').slice(0,220)||'返回近况列表查看当前消息。')}${event?.text.length>220?'…':''}</p><p class="dialog-muted">摘要不替你作选择，也不会增加关系数值。可以现在展开全文回应，或留到以后。</p><div class="dialog-actions">${btn('以后再读','close','','outline')}${btn('展开正文并回应','read-message',dialog.index,'primary',event?'':'disabled')}</div>`;}
  if (dialog.type==='settings') {
    body=`<div class="eyebrow">YOUR LITTLE UNIVERSE</div><h2 id="dialog-title">玩法与存档</h2><p class="story-text">游戏会自动保存当前进度。下载完整存档可以备份、换浏览器继续，或保留重开前的关系、日记、相册与故事分支；导入能恢复这些内容，也会替换当前进度。</p><div class="settings-actions">${btn(icon('book')+' 了解玩法','help','','outline')}${btn(icon('download')+' 导出完整存档','export','','outline')}${btn(icon('upload')+' 导入存档','import','','outline')}${btn(icon('book')+' 查看完整故事册','storybook','','outline')}${btn(icon('book')+' 导出本轮日记','export-journal','','outline')}${['small','normal','large'].map(size=>btn('阅读字号：'+({small:'小',normal:'标准',large:'大'}[size]),'font-size',size,state.legacy.reading.font===size?'selected outline':'outline')).join('')}${btn(state.legacy.reading.mode==='calm'?'阅读节奏：近况优先看摘要':'阅读节奏：直接打开全文','reading-mode','','outline')}${btn(state.legacy.guide?'简明引导：开':'简明引导：关','guide-toggle','','outline')}${btn(state.legacy.showEffects?'选项数值：显示':'选项数值：隐藏','toggle-effects','','outline')}${btn(icon('spark')+' '+(r.ended?'开始下一段旅程':'重新开始本轮'),'restart','','outline')}${btn(icon('moon')+' 文化与故事来源','sources','','outline')}</div><p class="dialog-muted">无需注册，也不会上传任何存档。浏览器清理站点数据会清除本地进度。文件备份可以恢复旅程与永久回忆。</p>`;
  }
  if (dialog.type==='restart') {
    body=`<div class="eyebrow">ANOTHER FIRST NIGHT</div><h2 id="dialog-title">准备好重新开始了吗？</h2><p class="story-text">新开局会替换本轮日记、相册、关系和属性。${r.ended?'已结算的':'之前完成旅程获得的'}永久回忆、成就和碎片会保留。未完成的旅程不会获得结算奖励。</p><div class="dialog-actions">${btn('先导出存档','export','','outline')}${btn('返回','close','','outline')}${btn('选择新开局','restart-confirm','','primary')}</div>`;
  }
  if (dialog.type==='import-confirm') {
    body=`<div class="eyebrow">CONTINUE A SAVED STORY</div><h2 id="dialog-title">继续这份存档？</h2><p class="story-text">存档：${h(dialog.payload.run?.name||'尚未开局')} · ${dialog.payload.run?'第 '+dialog.payload.run.day+' 夜':'回忆行李'}<br>已完成 ${dialog.payload.legacy.runs} 段旅程，${dialog.payload.legacy.points} 个回忆碎片。<br>导入后会替换当前的旅程与回忆档案。</p><div class="dialog-actions">${btn('取消','close','','outline')}${btn('导入并继续','import-confirm','','primary')}</div>`;
  }
  if (dialog.type==='help') {
    body=`<div class="eyebrow">A LITTLE GUIDE TO YOUR SECOND LIFE</div><h2 id="dialog-title">这个晚上，怎么过都可以</h2><div class="help-grid"><div><span>01</span><h3>每天 3 次行动</h3><p>预约日历把三次行动作为三个时段。先确认具体夜晚、时段、地点与安排；赴约包含前往世界，只花一次行动。撞期可以另约或先问双方是否接受共同参加，提前改期与取消不记失约。做其他行动占用预约时段、或提前结束当晚，会产生有后续回应的失约记录。NPC 也会因自己的计划变化主动提出改期。</p><p>探索、聊天、约会、创作、拍照、休息或工作都消耗一次行动。购买设备不消耗行动。睡觉会恢复精力，提前结束也可以。</p></div><div><span>02</span><h3>先相遇，再了解</h3><p>探索不同世界，在朋友在线时相遇。当前世界可继续探索，消耗行动与精力用于游览，不是再次传送。重复聊天收益会减少；在对方喜欢的世界约会更有效。读完相关角色的初次相遇后，才能进入群像。每人有 2 章个人故事、相处对话，另有 ${DAILY.length} 段世界与角色日常、${GROUPS.length} 段群像。日常首章的另一种选择会开启不同后续路线，后章按共同经历跨夜推进；已完成章节每局只读一次。每位角色还会独立尝试三阶段个人计划，可能延期、失败、缩小范围或暂停，即使不找对方聊天也会有变化，消息可稍后读；你的建议能影响之后的方向，对方也可以保留自己的决定。聊天与约会共用对话的已读记录。角色会在不同世界活动。另有 ${CIRCLE_SCENES.length} 段社群支线，可在对应世界探索或与相关朋友聊天、约会开启；每夜最多一段，后章跨夜接续并记住选择。故事通过消息与共享记录继续，不要求同一地图。拍照另有 ${PHOTO_STORIES.length} 段专属故事：先选择当前世界的风景或在场好友，后续记得以前的取景与关系。相册保存标题、同行者与选择结果；不出镜的决定会被保留。</p></div><div><span>03</span><h3>砂糖需要双方确认</h3><p>先读个人故事与两段心意前的相处剧情；两段之间至少隔两夜。亲密 30、信任 30、相处 4 次后可进入告白对话。回应会立即出现或随之后的共同经历、边界沟通推进。NPC 也会按性格主动试探或确认心意。雨音、弥生在旅程后期可能更快鼓起勇气；此前的相处和边界仍是前提。你可以回应、缓一缓或明确保持朋友，拒绝后不会反复追问。阿澈选择朋友关系。</p></div><div><span>04</span><h3>关系也会彼此交织</h3><p>可以有多段砂糖关系；坦诚或隐瞒，会引出协商、被发现、时间分配与合照公开的剧情。不同角色可以拒绝开放关系。同一天重复约会会积累压力。砂糖连续 3 晚没见会逐渐疏远；压力达到 75，或长时间缺少相处且信任较低时，对方可能开始关系变化的前置故事，不会只因达到数值立刻分开。两段前置与正式提议各隔至少一夜；有人不愿分开时，会再讨论一夜。继续和分开都有显著提示，分开后另有两段后续，各隔至少两夜。聊清期待能降低压力。朋友之间会先经历共同相处、逐渐靠近与磨合的两段前置剧情，再确认心意；每段之间至少隔两夜。你可以亲历，也可以听其他已认识的朋友转述。之后可能发展多段砂糖，并有共同协商、排期和告别的后续故事。在朋友页面邀请两人一起相处，支持、站队或起哄会影响他们对你的信任，以及他们彼此的关系；相处压力或生活期待变化也可能让 NPC 主动向另一位 NPC 告别。</p></div><div><span>05</span><h3>生活会影响故事</h3><p>线上活动消耗精力和现实平衡，连续满勤不会每天回满精力。休息恢复 28 精力，提前下线也有更多夜间恢复；工作消耗 10 精力并恢复现实平衡。心情每夜自然回落；制作、社交高于 40 后增长放缓。创作、友谊和关系交织都有不同结局。现实平衡低于 30 会优先进入休整结局。</p></div><div><span>06</span><h3>下一局带走经验</h3><p>第 28 夜结束后获得碎片：基础 3、首次成就每个 +1、首次结局 +2。永久解锁回忆，最多选 3 份带入新开局。完成旅程还能解锁不同主题：共 6 条、18 章额外故事，在下一局开局时任选一条；主题不继承上局关系，也不跳过新相遇。</p></div></div>${btn('知道了，继续我的夜晚 '+icon('arrow'),'close','','primary full')}`;
  }
  if (dialog.type==='sources') {
    body=`<div class="eyebrow">CULTURE & ORIGINAL STORIES</div><h2 id="dialog-title">关于世界，也关于故事</h2><p class="story-text">“砂糖”是部分 VRChat 社群对亲密搭档或恋人关系的称呼，“盐”常用来形容关系结束。相处期待因人而异。本作把陪伴、跨时区、边界、创作与告别写成了原创分支。</p><p class="dialog-muted">所有角色、世界、对白与剧情均为原创虚构，角色设定为成年人。没有使用真实用户的身份、Avatar 素材或个人故事原文。游戏是浏览器里的文字策略模拟器，不连接 VRChat，也不需要头显。</p><div class="source-list">${SOURCES.map(s=>`<a href="${h(s.url)}" target="_blank" rel="noopener noreferrer"><b>${h(s.title)} ↗</b><span>${h(s.note)}</span></a>`).join('')}</div><p class="dialog-muted">资料查阅：2026 年 10 月。研究资料说明文化背景；行动消耗、数值与结局规则均为游戏原创设计。</p>`;
  }
  root.innerHTML=`<dialog id="game-dialog" class="game-dialog ${cls}" aria-labelledby="dialog-title">${canClose?btn(icon('close'),'close','','dialog-close','aria-label="关闭窗口"'):''}${body}</dialog>`;
  const el=$('#game-dialog'); el.showModal();
  el.addEventListener('cancel', e=>{if(!canClose)e.preventDefault();else dialog=null;});
  if(dialog.type==='setup') $('#player-name').addEventListener('input',e=>draft.name=e.target.value);
  if(dialog.type==='calendar-book'){
    const update=()=>{const npc=get(PEOPLE,$('#book-person').value);if(!npc)return;const day=$('#book-day'),slot=$('#book-slot');for(const option of day.options){const n=Number(option.value);option.disabled=!npc.available.includes(n%7)||n===r.day&&r.nightActions===3;option.textContent=`第 ${n} 夜${!npc.available.includes(n%7)?' · 对方离线':''}`;}if(day.selectedOptions[0]?.disabled)day.value=[...day.options].find(o=>!o.disabled)?.value||'';for(const option of slot.options)option.disabled=Number(day.value)===r.day&&Number(option.value)<=r.nightActions;if(slot.selectedOptions[0]?.disabled)slot.value=[...slot.options].find(o=>!o.disabled)?.value||'';$('#game-dialog [data-ui="book-confirm"]').disabled=!day.value||!slot.value;};
    $('#book-person').addEventListener('change',update);$('#book-day').addEventListener('change',update);update();
  }
}
function afterAction(type) {
  recentReply=null;
  if(state.run.ended){settle(state.run,state.legacy);dialog={type:'ending'};}
  else if(state.run.notice)dialog={type:'response'};
  else if(type==='photo' && !state.run.pending?.id?.startsWith('photo-'))dialog={type:'result',log:state.run.logs.find(l=>l.kind==='action')};
  else if(!state.run.pending)dialog=type==='explore'?{type:'result',log:state.run.logs.find(l=>l.kind==='action'),exploration:true}:null;
  save();render();
  if(type==='next'&&!state.run.ended)toast(`第 ${state.run.day} / 28 夜\n新的夜晚 · 3 次行动 · 精力已恢复`,true);
  else if(!state.run.pending&&!state.run.ended&&type!=='explore'){const entry=state.run.logs.find(l=>l.kind!=='achievement');toast(`${entry?.title||'已记录'} · 今晚剩余 ${state.run.ap} 次行动`);}
}
function download(content,name,type='application/json') {
  const url=URL.createObjectURL(new Blob([content],{type}));
  const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
document.addEventListener('click',e=>{
  const a=e.target.closest('[data-action]'), u=e.target.closest('[data-ui]');
  if(a&&!a.disabled){
    try {
      const type=a.dataset.action;
      if(type==='photo' && !a.dataset.target && !a.hasAttribute('data-photo-confirm'))return openDialog('photo');
      if(!['attend','buy','next'].includes(type)&&slotAppointments(state.run).length)return openDialog('slot-warning',{action:type,target:a.dataset.target});
      if(type==='next'&&(state.run.ap>0||state.run.day===DAYS&&availableMessages(state.run).length||state.run.appointments.some(x=>x.status==='confirmed'&&x.day===state.run.day))) return openDialog('advance');
      perform(state.run,type,a.dataset.target);afterAction(type);
    } catch(err){toast(err.message);} return;
  }
  if(!u||u.disabled)return;
  const v=u.dataset.value;
  try {
    switch(u.dataset.ui){
      case 'route': recentReply=null;route=v;closeDialog();render();window.scrollTo({top:0,behavior:'smooth'});break;
      case 'person': recentReply=null;route='people';selectedNpc=v;closeDialog();render();window.scrollTo({top:0,behavior:'smooth'});break;
      case 'select-person': selectedNpc=v;render();break;
      case 'world': openDialog('world',{id:v});break;
      case 'together-menu': openDialog('together',{npc:v});break;
      case 'calendar-book': openDialog('calendar-book',{npc:v||selectedNpc});break;
      case 'book-confirm': proposeAppointment(state.run,{npc:$('#book-person').value,day:Number($('#book-day').value),slot:Number($('#book-slot').value),world:$('#book-world').value,kind:$('#book-kind').value});dialog=null;save();render();break;
      case 'booking-change': changeAppointment(state.run,v);dialog=null;save();render();break;
      case 'booking-cancel': {const text=changeAppointment(state.run,v,true);save();render();toast(text);break;}
      case 'slot-proceed': {const d=dialog;dialog=null;perform(state.run,d.action,d.target);afterAction(d.action);break;}
      case 'settings': case 'help': case 'sources': case 'restart': case 'ending': openDialog(u.dataset.ui);break;
      case 'close': closeDialog();break;
      case 'keepsakes': route='archive';archiveTab='keepsakes';archiveBookIndex=-1;dialog=null;render();break;
      case 'storybook': route='archive';archiveTab='stories';archiveBookIndex=-1;dialog=null;render();break;
      case 'story-person': storyPerson=v;render();break;
      case 'story-book': archiveBookIndex=Number(v);storyPerson='all';render();break;
      case 'inbox-category': inboxCategory=v;render();break;
      case 'pin-message': toggleReading(state.legacy.reading.pins,v);save();render();break;
      case 'favorite-story': toggleReading(state.legacy.reading.favorites,v,300);save();render();break;
      case 'favorite-filter': favoritesOnly=!favoritesOnly;render();break;
      case 'clear-search': storyQuery='';render();break;
      case 'font-size': if(['small','normal','large'].includes(v)){state.legacy.reading.font=v;save();render();}break;
      case 'repeat-choice': {const e=currentEvent(state.run),previous=previousChoice(state.legacy.reading,e);if(previous!==Number(v))throw new Error('这段内容或可选条件已经变化，请重新阅读。');document.querySelector(`[data-ui="choice"][data-value="${previous}"]`)?.click();break;}
      case 'expand-inbox': inboxExpanded=!inboxExpanded;render();break;
      case 'message-preview': openDialog('message-preview',{index:Number(v)});break;
      case 'read-letter': {const [book,index]=v.split(':').map(Number),letter=markLetterRead(state,index,book);save();openDialog('letter',{letter});break;}
      case 'guide-toggle': state.legacy.guide=!state.legacy.guide;save();render();break;
      case 'reading-mode': state.legacy.reading.mode=state.legacy.reading.mode==='calm'?'full':'calm';save();render();break;
      case 'dismiss-reply': recentReply=null;render();break;
      case 'read-message': readMessage(state.run,Number(v));dialog=null;save();render();break;
      case 'toggle-effects': state.legacy.showEffects=!state.legacy.showEffects;save();render();break;
      case 'skip-intro': {if(state.run.pending?.id!=='introduction'||!state.legacy.introductions.includes(state.run.pending.npc))break;choose(state.run,0);dialog=null;save();render();break;}
      case 'export-storybook': {const b=archiveBookIndex<0?{name:state.run.name,stories:state.run.storybook,letters:state.run.letters,review:state.run.ending?.review||[],keepsakes:state.run.appointments.filter(a=>a.memento).map(a=>a.memento),epilogue:state.run.ended?epilogueFor(state.run):[]}:state.legacy.books[archiveBookIndex];download(bookText(b),'夜航-完整故事册.txt','text/plain;charset=utf-8');break;}
      case 'journal': route='archive';archiveTab='journal';render();window.scrollTo({top:0,behavior:'smooth'});break;
      case 'archive-tab': archiveTab=v;render();break;
      case 'advance-confirm': perform(state.run,'next');afterAction('next');break;
      case 'trait':
        if(draft.traits.includes(v))draft.traits=draft.traits.filter(x=>x!==v);
        else if(draft.traits.length<2)draft.traits.push(v);
        else {toast('最多选择两个天赋；先取消一个，再选择新的。');break;}
        renderDialog();break;
      case 'device': draft.device=v;renderDialog();break;
      case 'theme': if(v&&!state.legacy.themesUnlocked.includes(v))break;draft.theme=v||null;renderDialog();break;
      case 'begin': state.run=startRun({...draft,legacy:state.legacy});selectedNpc='raina';route='worlds';dialog=null;save();render();toast('第 1 / 28 夜\n欢迎来到第一段故事 · 3 次行动',true);break;
      case 'choice': {
        const intro=state.run.pending?.id==='introduction'?state.run.pending.npc:null;
        const fromInbox=state.run.pending?.fromInbox===true;const event=currentEvent(state.run);const entry=choose(state.run,Number(v));rememberReading(state.legacy.reading,event,Number(v));if(intro&&!state.legacy.introductions.includes(intro))state.legacy.introductions.push(intro);
        if(fromInbox&&state.legacy.reading.mode==='calm'&&!state.run.pending&&!state.run.notice){recentReply=entry;dialog=null;}else dialog=state.run.notice?{type:'response'}:{type:'result',log:entry};save();render();break;
      }
      case 'unlock': unlockMemory(state.legacy,v);save();render();toast('回忆已永久解锁。点击“放进行李”带入下一局。');break;
      case 'equip': equipMemory(state.legacy,v);save();render();break;
      case 'ending-archive': route='archive';archiveTab='memories';dialog=null;render();break;
      case 'next-run':
        if (!state.run?.ended) break;
        settle(state.run,state.legacy);save();
        Object.assign(draft,{name:state.run.name,device:state.run.device,traits:[...state.run.traits],theme:null});
        openDialog('setup');break;
      case 'restart-confirm': openDialog('setup');break;
      case 'export': download(JSON.stringify(state,null,2),`夜航-第${state.run?.day||0}夜-存档.json`);toast('存档已导出，包含本轮进度和永久回忆。');break;
      case 'export-journal':
        if(!state.run)throw new Error('开始旅程后才能导出日记。');
        download(`# ${state.run.name}的夜航日记\n\n`+[...state.run.logs].reverse().map(l=>`第 ${l.day} 夜 · ${l.title}\n${l.text}\n${l.changes.map(c=>`${c.label} ${c.delta>0?'+':''}${c.delta}`).join(' / ')}\n`).join('\n'),`夜航-日记.txt`,'text/plain;charset=utf-8');break;
      case 'import': $('#import-file').click();break;
      case 'import-confirm': state=dialog.payload;if(state.run?.ended)settle(state.run,state.legacy);dialog=state.run?.notice?{type:'response'}:state.run?.pending?{type:'story'}:state.run?null:{type:'setup'};save();render();toast('存档已恢复。欢迎回来。');break;
    }
  }catch(err){toast(err.message);}
});
$('#import-file').addEventListener('change',async e=>{
  const file=e.target.files[0];e.target.value='';if(!file)return;
  try{if(file.size>5000000)throw new Error('存档文件超过 5MB，请选择夜航导出的 JSON 存档。');const payload=validateSave(JSON.parse(await file.text()));openDialog('import-confirm',{payload});}
  catch(err){toast(err instanceof SyntaxError?'这不是有效的 JSON 存档。':err.message);}
});
if(!state.run)dialog={type:'setup'};
else if(state.run.ended){settle(state.run,state.legacy);save();dialog={type:'ending'};}
else if(state.run.notice)dialog={type:'response'};
render();
if(loadError)setTimeout(()=>toast('原有存档无法读取。可以从导出的备份恢复，或开始新旅程。'),400);

// 专用浏览器窗口保持一个持续连接；关闭窗口后服务自动退出。
// 连接不依赖后台计时器，最小化或长时间不操作不会让服务误停。
if (['127.0.0.1','localhost','[::1]'].includes(location.hostname) && new URLSearchParams(location.search).get('desktop') === '1') {
  let session;
  const connect = () => { if (!session || session.readyState === EventSource.CLOSED) session = new EventSource('/__session/live'); };
  connect();
  window.addEventListener('pagehide', () => session?.close());
  window.addEventListener('pageshow', connect);
}

 document.addEventListener('submit',e=>{if(e.target.id==='book-search-form'){e.preventDefault();storyQuery=$('#story-query').value.slice(0,100);render();}});
