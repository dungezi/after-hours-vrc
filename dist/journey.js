import { LIFE_PLANS } from './life-stories.js';
import { THEMES } from './replay-stories.js';
import { PEOPLE, WORLD, PROJECTS } from './data.js';
import { DAILY, dailyReady } from './daily-stories.js';
import { CIRCLE_SCENES, circleReady } from './circle-stories.js';
import { romanceProgress, romanceKey } from './courtship-stories.js';
import { departureContactReason, departureSummary } from './separation-stories.js';

const person=id=>PEOPLE.find(p=>p.id===id);
export function captureStory(run,event,pending,choice,index,result,changes) {
  run.storybook.push({day:run.day,world:run.world,id:pending.id || `arc:${pending.npc}:${pending.index}`,cast:[event.npc,event.other].filter(Boolean),title:event.title,subtitle:event.subtitle || '',text:event.text,options:event.choices.map(c=>c.label),choice:index,result,changes:structuredClone(changes),partial:false});
}
export function upgradeReading(payload) {
  const r=payload.run,l=payload.legacy;
  l.books=[];l.showEffects=false;l.introductions=PEOPLE.filter(p=>r?.relationships?.[p.id]?.introduced).map(p=>p.id);
  if(r)r.storybook=(r.logs || []).filter(x=>x.kind==='story').reverse().map(x=>({day:x.day,world:null,id:'legacy',cast:[],title:x.title,subtitle:'旧版日记摘录',text:'',options:[],choice:null,result:x.text,changes:x.changes,partial:true}));
  if(r?.ended && r.settled && r.ending)l.books.push({name:r.name,ending:r.ending.name,day:r.day,stories:structuredClone(r.storybook),epilogue:epilogueFor(r)});
}
const finite=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const str=(s,n)=>typeof s==='string'&&s.length<=n;
export function validBook(book,day=28) {
  return Array.isArray(book)&&book.length<=600&&book.every((x,i)=>x&&finite(x.day,1,day)&&(!i||x.day>=book[i-1].day)&&(WORLD.some(w=>w.id===x.world)||(x.partial&&x.world===null))&&str(x.id,100)&&str(x.title,500)&&str(x.subtitle,500)&&str(x.text,8000)&&str(x.result,8000)&&Array.isArray(x.cast)&&x.cast.length<=6&&new Set(x.cast).size===x.cast.length&&x.cast.every(id=>person(id))&&Array.isArray(x.options)&&x.options.length<=6&&x.options.every(s=>str(s,500))&&typeof x.partial==='boolean'&&(x.partial?x.choice===null&&x.options.length===0:finite(x.choice,0,x.options.length-1))&&Array.isArray(x.changes)&&x.changes.length<=30&&x.changes.every(c=>c&&str(c.label,100)&&Number.isFinite(c.delta)&&Math.abs(c.delta)<=99999));
}
export function validReading(payload) {
  const l=payload.legacy;
  return typeof l.showEffects==='boolean'&&Array.isArray(l.introductions)&&l.introductions.length<=6&&new Set(l.introductions).size===l.introductions.length&&l.introductions.every(id=>person(id))&&Array.isArray(l.books)&&l.books.length<=3&&l.books.every(b=>b&&str(b.name,20)&&str(b.ending,80)&&finite(b.day,1,28)&&validBook(b.stories,b.day)&&Array.isArray(b.epilogue)&&b.epilogue.length<=30&&b.epilogue.every(e=>e&&str(e.title,500)&&str(e.text,8000)))&&(!payload.run||validBook(payload.run.storybook,payload.run.day));
}

export function storyHints(run,npc=null) {
  if(run.ended)return [];
  const hints=[],cast=PEOPLE.filter(p=>(!npc||p.id===npc)&&run.relationships[p.id].introduced&&!departureContactReason(run,p.id));
  for(const p of cast) {
    const r=run.relationships[p.id],departure=departureSummary(run,p.id);
    if(departure){hints.push({title:p.name+' · 关系待续',text:departure});continue;}
    if(r.stage===0)hints.push({title:p.name+' · 还没说完的近况',text:r.meetings<2?'再相处一次，听听日常问候之外的事情。':r.trust<25?'先多了解彼此，让对方愿意讲更私人的经历。':'对方有一件自己的事想讲，可以在上线时聊聊。'});
    else if(r.stage===1) {
      const earliest=Math.max(8,(run.storyFlags[`read:arc:${p.id}:0`]||1)+2);
      hints.push({title:p.name+' · 下一章',text:run.day<earliest?`把那次谈话留一点时间消化，第 ${earliest} 夜起再找对方。`:r.trust<45||r.affection<30?'继续共同相处，下一段经历需要更深一点的了解。':'新的个人故事已具备条件，等对方上线时聊聊。'});
    } else if(p.id!=='ash'&&r.status==='friend'&&!r.intent) {
      const n=romanceProgress(run,p.id),last=run.storyFlags[romanceKey(p.id,0)];
      hints.push({title:p.name+' · 慢慢靠近',text:n===2?'已经读完心意前的两段相处。如果想更进一步，可以表达心意。':n===1&&run.day<last+2?`上次的邀请还很近，第 ${last+2} 夜起再续这段相处。`:'还有尚未读完的心意前相处；继续聊天，别急着用告白跳过了解。'});
    }
  }
  const lines=[...new Set(CIRCLE_SCENES.filter(s=>run.storySeen.includes(s.id)).map(s=>s.line))];
  for(const line of lines) {
    if(npc&&!line.cast.includes(npc))continue;
    const s=CIRCLE_SCENES.find(s=>s.line===line&&!run.storySeen.includes(s.id));if(!s)continue;
    const last=run.storyFlags[`read:circle-${line.key}-${s.index-1}`]||1,earliest=Math.max(line.day+s.index*3,last+2);
    const blocked=line.cast.some(id=>departureContactReason(run,id));
    hints.unshift({title:line.name+' · 待续',text:blocked?'这段故事涉及暂不联系的朋友，先尊重现在的联系范围。':circleReady(run,s)?'新的消息已经可以接续；与其中一位朋友聊天，或去原来的世界探索。':run.day<earliest?`第 ${earliest} 夜起，再聊聊上次留下的事情。`:'当前关系发生了变化，先处理关系谈话；后续不会替换当事人。'});
  }
  const daily=DAILY.find(s=>!run.storySeen.includes(s.id)&&(npc?s.npc===npc:s.world===run.world));
  if(daily){const previous=daily.id.slice(0,-1)+(daily.index-1),earliest=Math.max(1+daily.index*3,(run.storyFlags['read:'+previous]||1)+2);hints.push({title:(daily.npc?person(daily.npc).name:WORLD.find(w=>w.id===daily.world).name)+' · 日常',text:run.storyFlags['defer:'+daily.id]===run.day?'今晚先搁下了这件事，下一夜可以重新接续。':dailyReady(run,daily)?'有一段新的日常可以了解。':daily.index&&run.storySeen.includes(previous)?`第 ${earliest} 夜起，留意前一次经历的后续。`:'从一次探索或聊天开始，后面的章节会按共同经历推进。'});}
  if(npc && run.lives?.[npc]){const life=run.lives[npc],plan=LIFE_PLANS[npc];hints.unshift({title:person(npc).name+'自己的计划',text:`${plan.goals[life.path]} · 已有 ${life.milestones.length} 段实际进展。`+(life.read<life.milestones.length?'可以在朋友近况中了解，后章仍需留出相处时间。':'对方会按自己的日程继续，不必用反复聊天推动。')});}
  if(!npc && run.encore?.route){const t=THEMES.find(t=>t.id===run.encore.route),n=run.encore.days.length;hints.unshift({title:'本轮主题 · '+t.name,text:n===3?'这一轮主题已走完，结算后会收录主题进度。':t.cast.some(id=>departureContactReason(run,id))?'这条主题涉及暂停联系的朋友，目前先缓一缓，不会强制安排见面。':t.cast.some(id=>!run.relationships[id].introduced)?'先认识'+t.cast.map(id=>person(id).name).join('、')+'，主题不会跳过初次相遇。':`已读 ${n} / 3 段；第 ${Math.max(4+n*7,(run.encore.days.at(-1)||1)+3)} 夜起留意朋友近况。`});}
  return hints.slice(0,npc?4:5);
}

const LATER={
  raina:['围巾旁的新目的地','雨音的收藏夹里多了一张没有雨声的地图。她仍然会犹豫，但终于能先说一句自己想去哪里。'],
  ash:['向导的休息栏','阿澈把一晚留给自己的解谜收藏夹。他仍欢迎新朋友，也开始认真接受只需要他来玩的邀请。'],
  mika:['留给现在的那一页','小满给相册加上可以改写的页签。她仍喜欢纪念，却开始分得清想念与催人回来。'],
  rei:['两个时钟继续走','零点保存了工作进度，也保存了一段能真正碰面的时间。错开的日常没有再被全部换成熬夜。'],
  lin:['歌单最后的停顿','凛给新歌单留了一段安静。没有演出的晚上，她也有自己想见的人和想玩的地方。'],
  yuki:['纸鸟的新转弯','弥生保留了最初失败的预览。新的纸鸟会转弯了，她仍然记得第一次有人愿意看完制作过程。'],
};
export function epilogueFor(run) {
  const out=[];
  for(const p of PEOPLE) {
    const r=run.relationships[p.id];if(!r.introduced)continue;
    const d=run.departures['player:'+p.id];
    if(r.status==='salt')out.push({title:p.name+' · 告别以后',text:d?.contact==='none'?'你们保留了暂不联系的决定。尾声没有替任何一方发出新邀请，过去的故事仍留在自己的记录里。':d?.contact==='friends'?'你们已经确认按朋友身份联系。旧的称呼放下了，再见面需要尊重现在的范围。':'你们还留着距离。没有突然复合，也没有要求谁把共同经历删掉。'});
    else if(d?.resolution==='active')out.push({title:p.name+' · 仍未说完',text:'关于是否继续的谈话还没有结束。旅程暂告一段落，尾声不会替你们确认继续或分开。'});
    else if(r.status==='sugar')out.push({title:p.name+' · 接下来的约定',text:r.tension>35?'喜欢仍在，见面安排和压力也需要继续处理。你们没有用一句永远在一起掩盖尚未解决的分歧。':`${p.name}保留了下一次邀请，也给各自的日常留出空间。你们确认的是现在愿意继续，之后的安排仍然由双方一起决定。`});
    else if(r.intent?.state==='waiting')out.push({title:p.name+' · 心意尚在等待',text:'对方还没有作出确认。已经说过的话仍被记得，旅程结束没有把等待改成默认答应。'});
    else if(r.stage>=2)out.push({title:LATER[p.id][0],text:LATER[p.id][1]});
  }
  for(const p of PROJECTS)if(run.projects[p.id]>=p.goal)out.push({title:'你留下的作品 · '+p.name,text:p.id==='event'?'那场聚会有了真正的结束时间。以后有人继续办活动，也会记得给旁听的人和提前离开的人留位置。':p.id==='world'?'世界已经可以被走进。以后的一次修补、一次重新点灯，都会从这一版真实完成的作品开始。':'你完成的配色和细节留在模型里。它可以继续修改，也已经足够代表这一阶段的自己。'});
  for(const [key,b] of Object.entries(run.npcBonds))if(['sugar','salt'].includes(b.status)){const names=key.split(':').map(id=>person(id).name).join('与'),d=run.departures['pair:'+key];out.push({title:names+' · 他们的后来',text:b.status==='sugar'?`两人的砂糖关系仍在继续。${b.tension>30?'已经存在的压力还需要他们自己处理。':'接下来的相处仍由他们自己安排。'}`:d?.contact==='none'?'两人保留了暂不联系的距离，共同朋友也没有替他们安排重逢。':'两人已经告别砂糖。后续按已经讨论的联系范围继续，没有被旁人的期待推回复合。'});}
  for(const line of new Set(CIRCLE_SCENES.filter(s=>s.index===2&&run.storySeen.includes(s.id)).map(s=>s.line))){const first=run.storyFlags[`choice:circle-${line.key}-0`];out.push({title:line.name+' · 留下的那一件事',text:`这一条故事从「${line.beats[0].branches[first??0][0]}」开始，后来走完了三个章节。最初的选择与之后真正读过的不同经历，已经一起收进故事册。`});}
  for(const p of PEOPLE){const life=run.lives?.[p.id];if(!run.relationships[p.id].introduced || departureContactReason(run,p.id) || !life?.milestones.length)continue;const latest=life.milestones.at(-1),plan=LIFE_PLANS[p.id];out.push({title:p.name+'自己的后来 · '+plan.paths[latest.path][life.milestones.length-1][0],text:life.milestones.length===3?'这个阶段的计划已经走完，不依赖你是否读过每条消息。'+plan.paths[latest.path][2][1].replaceAll('{friend}','一位朋友'):'对方的计划还在继续，已经发生的进展留在近况里；旅程结束不会把尚未完成的目标写成已经完成。'});}
  if(run.encore?.route){const t=THEMES.find(t=>t.id===run.encore.route);out.push({title:'本轮主题 · '+t.name,text:run.encore.days.length===3?t.branches[run.encore.choices[0]][1]+' 最后一段采用了「'+run.storybook.findLast(x=>x.id===`encore-${t.id}-2`)?.options?.[run.encore.choices[2]]+'」。':'主题尚未走完，尾声只保留实际读过的 '+run.encore.days.length+' 段，不补造剩余经历。'});}
  return out;
}
