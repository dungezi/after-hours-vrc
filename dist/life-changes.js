import { PEOPLE } from './data.js';
import { departureContactReason } from './separation-stories.js';
const OFFSETS=[3,10,19];
const p=id=>PEOPLE.find(x=>x.id===id);
export const LIFE_CHANGE_ID='life-change';
const OBSTACLES={raina:['写不下去的那一页','雨音重新走过那条路，却发现自己写不出想留下的部分。她承认这次没能按原计划写完，暂时不想用一篇漂亮空话交差。'],ash:['小队的时间没有对上','阿澈与伙伴各有真正想玩的安排，集合时间没能重叠。他没有把自己重新填成永远待命的向导，这一次的挑战也因此晚了。'],mika:['记录没得到所有人的同意','小满想留下的一段记录，有当事人暂时不愿意被写进去。她收起了那一部分，原本准备好的整页也需要重新安排。'],rei:['两种设备给了相反结果','零点的测试在一台设备上通过，另一台上却又有问题。合作的朋友还要处理自己的工程，没有谁能立刻腾出整个晚上来救火。'],lin:['两场排练撞在同一晚','凛想参加的排练与伙伴的安排撞了时间。双方都没有故意失约，也都不愿总是让自己的计划排到最后。她决定先重新排这一段。'],yuki:['又飞回起点的一次测试','弥生的预览再次失败，原来的修法只解决了其中一半。她把这次失败保留下来，承认今晚还没有办法直接宣布做完。']};
export function freshPlan(anchor,seed=0,index=0,milestones=[],now=anchor){return {temper:(seed+index*3)%5,state:milestones.length===3?'finished':'working',due:milestones.length===3?0:Math.max(now+1,anchor+OFFSETS[milestones.length]),attempts:0,support:0,events:[]};}
function event(life,run,kind,title,text,related=null){const e={day:run.day,kind,title,text,related,seen:false};if(life.plan.events.length<8)life.plan.events.push(e);return e;}
export function advancePlan(run,id,life,friend){
  const plan=life.plan,index=life.milestones.length;if(index>=3||!plan.due||run.day<plan.due)return null;
  const report=(kind,title,text)=>{event(life,run,kind,title,text,friend);return {change:true,kind,title,related:friend};};
  if(index>0&&plan.attempts===0&&(plan.temper===4||(plan.temper+index+life.path)%3===0)){
    plan.attempts=1;plan.state='delayed';plan.due=run.day+2;return report('delay',...OBSTACLES[id]);
  }
  if(plan.state==='paused'&&plan.temper===4&&plan.support===0){plan.due=0;return report('stop','这次先承认没有完成',`${p(id).name}重新看过自己的余力，决定暂停这次尝试。目标没有被写成成功，也没有因为你没有帮忙就被归咎于你。以后是否重试，还需要重新作决定。`);}
  if(index>0&&plan.attempts===1){
    plan.attempts=2;
    if(plan.temper===4&&!plan.support){plan.state='paused';plan.due=run.day+3;return report('pause','这份计划需要真正停一停',`${p(id).name}试过一次补救，仍然没能完成这一段。对方决定先停下来，其他朋友也有各自的安排；暂停不是等你来点击一个成功按钮。`);}
    if(!plan.support&&plan.temper%2){plan.state='reduced';plan.due=run.day+2;if(index===1)life.path=1-life.path;return report('scope','把最初的范围重新画小',`${p(id).name}自己缩小了目标，也调整了接下来的优先级。原稿被保留，新的方向不会冒充原先的全部愿望都已经完成。`);}
    plan.state='retrying';plan.due=run.day+1;return report('retry','各自确认之后的再试一次',`${p(id).name}和伙伴各自说明了可用的时间，重新只接下一小段。没有人被要求放弃自己的整份计划，合作从能做到的部分继续。`);
  }
  const outcome=index===2?(plan.state==='reduced'?'reduced':'completed'):'ongoing';
  life.milestones.push({day:run.day,path:life.path,...(index===2?{outcome}:{})});
  plan.support=Math.max(0,plan.support-1);plan.attempts=0;plan.state=index===2?'finished':'working';plan.due=index===2?0:Math.max(run.day+4,life.anchor+OFFSETS[index+1]);return {milestone:true};
}
export function changeReady(run,q){const e=run.lives[q.npc]?.plan.events[q.change];return q.id===LIFE_CHANGE_ID&&!!e&&!e.seen&&run.relationships[q.npc]?.introduced&&!departureContactReason(run,q.npc);}
export function changeMessages(run){return PEOPLE.flatMap(p=>run.lives[p.id].plan.events.map((e,change)=>({type:'scene',id:LIFE_CHANGE_ID,npc:p.id,change,optional:true})).filter(q=>changeReady(run,q)));}
export function changeScene(run,q){
  const life=run.lives[q.npc],e=life?.plan.events[q.change];if(!e)return null;
  const latest=q.change===life.plan.events.length-1,canAssist=latest&&['paused','delayed','retrying','reduced'].includes(life.plan.state),name=p(q.npc).name;
  return {npc:q.npc,title:e.title,subtitle:`${name}的计划变化 · 第 ${e.day} 夜`,text:e.text+'\n\n'+(canAssist?'你可以回应眼前的变化，提出一个具体支持或留出休息时间。建议仍可能被拒绝，已经发生的失败不会因此消失。':'这一段变化已经发生，你的回应不会改写过去的经过。'),choices:[
    {label:canAssist?'询问是否需要一小段具体帮助':'问清这次变化里最难的那一点',text:canAssist?`${name}听见了你的询问。是否接受这份帮助，会按现在的信任与想继续的方向决定。`:`${name}讲了一件实际发生的事，没有把过程压缩成成功或失败的标签。`,effects:{energy:-2},rel:{trust:2},outcome:'life-change-read',assist:canAssist?'retry':null},
    {label:canAssist?'讨论缩小目标，接受完成的东西会不同':'认真听完取舍，承认有些部分确实没做到',text:canAssist?'你们讨论了更小的范围，并没有把降低期待解释成不够认真。':'没有完成的部分仍在记录里，已经做过的努力也没有被一笔勾销。',effects:{balance:1},rel:{trust:1},outcome:'life-change-read',assist:canAssist?'scope':null},
    {label:'这次只陪着听，不接管计划',text:`${name}仍然拥有自己的下一步。你没有因为听见困难，就替对方安排全部时间。`,effects:{mood:1},rel:{trust:1},outcome:'life-change-read',assist:null},
  ]};
}
export function resolveLifeChange(run,q,c){const life=run.lives[q.npc],e=life.plan.events[q.change];e.seen=true;if(!c.assist)return '';if(run.relationships[q.npc].trust<({rei:40,lin:35,ash:30,raina:25,mika:25,yuki:30}[q.npc]))return '对方感谢这份心意，但这次仍想按自己的方式处理。';if(q.change!==life.plan.events.length-1||life.plan.state==='finished')return '这部分已经发生，支持会留给未来，不改写原来的结果。';life.plan.support=Math.min(3,life.plan.support+1);life.plan.state=c.assist==='scope'?'reduced':'retrying';life.plan.due=run.day+2;life.plan.attempts=2;return '对方愿意试这个具体安排，之后仍需要实际时间推进。';}
export function validPlan(life,day){const x=life.plan;return !!x&&Number.isInteger(x.temper)&&x.temper>=0&&x.temper<=4&&['working','delayed','retrying','reduced','paused','finished'].includes(x.state)&&Number.isInteger(x.due)&&x.due>=0&&x.due<=60&&Number.isInteger(x.attempts)&&x.attempts>=0&&x.attempts<=2&&Number.isInteger(x.support)&&x.support>=0&&x.support<=3&&Array.isArray(x.events)&&x.events.length<=8&&x.events.every((e,i)=>e&&Number.isInteger(e.day)&&e.day>=life.anchor&&e.day<=day&&(!i||e.day>=x.events[i-1].day)&&['delay','pause','stop','retry','scope'].includes(e.kind)&&typeof e.title==='string'&&e.title.length<=100&&typeof e.text==='string'&&e.text.length<=2000&&(e.related===null||PEOPLE.some(p=>p.id===e.related))&&typeof e.seen==='boolean')&&(life.milestones.length===3?x.state==='finished'&&x.due===0:x.state!=='finished');}
