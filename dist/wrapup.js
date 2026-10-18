import { PEOPLE, PROJECTS, WORLD } from './data.js';
import { fingerprint, messageCategory } from './reading.js';
const names=ids=>ids.map(id=>PEOPLE.find(p=>p.id===id).name).join('、');

export function endingReview(run){
  const known=PEOPLE.filter(p=>run.relationships[p.id].introduced),partners=known.filter(p=>run.relationships[p.id].status==='sugar');
  const unfinished=known.filter(p=>run.departures['player:'+p.id]?.resolution==='active');
  const waiting=known.filter(p=>run.relationships[p.id].intent?.state==='waiting');
  const steady=partners.filter(p=>run.relationships[p.id].trust>=60&&run.relationships[p.id].tension<=35);
  const openIssue=partners.length>1&&partners.some(p=>!run.relationships[p.id].agreement);
  const relationship=unfinished.length?`与${names(unfinished.map(p=>p.id))}的关系谈话仍未结束，结算没有替双方作决定。`:partners.length?`${names(partners.map(p=>p.id))}与你已确认砂糖。${steady.length===partners.length&&!openIssue?'目前信任与相处压力都支持继续相处。':'仍需要处理'+(openIssue?'多段关系的共同约定':'信任或相处压力')+'。'}`:'这轮没有确认砂糖；已经建立的友谊独立成立。';
  const balance=run.stats.balance,done=PROJECTS.filter(p=>run.projects[p.id]>=p.goal);
  return [
    {title:'关系 · '+(unfinished.length?'谈话待续':partners.length?(steady.length===partners.length&&!openIssue?'稳定相处':'仍有待处理的约定'):'朋友也很重要'),text:relationship+(waiting.length?` ${names(waiting.map(p=>p.id))}的心意回应仍在等待，没有默认答应。`:'')},
    {title:'现实生活 · '+(balance<30?'需要先休整':balance<60?'给作息多留一点余地':'目前有余地'),text:`现实平衡 ${balance}。`+(balance<30?'这项评价提醒你照顾睡眠与现实安排，并不抹去已经建立的关系。':balance<60?'这段生活仍能继续，也值得减少一点透支；它不会单独把一段稳定关系判成不稳定。':'耳机内外的安排目前有空间，之后仍可以继续调整。')},
    {title:'创作 · '+(done.length?`完成 ${done.length} 个项目`:'还在尝试'),text:done.length?'已经完成：'+done.map(p=>p.name).join('、')+'。未完成的项目按原进度保留，不补写成已经发布。':'本轮尚未完成正式项目。经历、草稿和朋友间的练习仍是这段旅程的一部分。'},
    {title:'探索 · '+run.visited.length+' / '+WORLD.length+' 个世界',text:'这一轮走过的世界与实际留下的故事一起保留。没有到过的地方，留给以后重新出发。'},
  ];
}

export function closingLetters(run,stories){
  return stories.map(({q,event})=>({key:fingerprint([q.id,q.npc,q.other,q.index,q.change,q.booking]),id:q.id,category:messageCategory(q),day:run.day,cast:[...new Set(event.cast||[event.npc,event.other].filter(Boolean))],title:event.title,subtitle:event.subtitle||'',text:event.text,options:event.choices.map(c=>c.label),read:false}));
}
export function validLetters(list,day=28){
  const str=(x,n)=>typeof x==='string'&&x.length<=n;
  return Array.isArray(list)&&list.length<=128&&new Set(list.map(x=>x?.key)).size===list.length&&list.every(x=>x&&str(x.key,50)&&/^[a-z0-9]+-[a-z0-9]+-[a-z0-9]+$/.test(x.key)&&str(x.id,100)&&['change','life','relationship','world','theme','finale'].includes(x.category)&&Number.isInteger(x.day)&&x.day>=1&&x.day<=day&&Array.isArray(x.cast)&&x.cast.length<=6&&new Set(x.cast).size===x.cast.length&&x.cast.every(id=>PEOPLE.some(p=>p.id===id))&&str(x.title,500)&&str(x.subtitle,500)&&str(x.text,8000)&&Array.isArray(x.options)&&x.options.length<=6&&x.options.every(s=>str(s,500))&&typeof x.read==='boolean');
}
export function markLetterRead(state,index,bookIndex=-1){
  const book=bookIndex<0?state.run:state.legacy.books[bookIndex],letter=book?.letters?.[index];
  if(!Number.isInteger(index)||!letter)throw new Error('这封信件不在当前故事册里。');
  letter.read=true;
  if(bookIndex<0&&state.run?.settled){const archived=state.legacy.books[0]?.letters?.find(x=>x.key===letter.key&&x.title===letter.title);if(archived)archived.read=true;}
  if(bookIndex===0&&state.run?.ended&&state.run.settled){const current=state.run.letters.find(x=>x.key===letter.key&&x.title===letter.title);if(current)current.read=true;}
  return letter;
}
