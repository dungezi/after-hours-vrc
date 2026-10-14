import { PEOPLE, WORLD } from './data.js';
import { NPC_ROUTES } from './npc-stories.js';

const person=id=>PEOPLE.find(p=>p.id===id);
export const SEPARATION_IDS=['separation-prelude','separation-proposal','separation-review','separation-after'];
export const departureKey=(npc,other)=>other?'pair:'+ [npc,other].sort().join(':'):'player:'+npc;
const PHASES=['prelude0','prelude1','proposal','review','aftermath0','aftermath1','closed'];
const PLAYER_BEATS={
  raina:['那条没有撤回的消息','雨音发来一条没有撤回的消息，说最近的晚安有时像要完成的一项任务。她仍然记得听雨的那些晚上，却不想继续用沉默替双方作答。','长椅上的两个愿望','雨音想要一段能够安静独处的时间，也想知道你是否还期待同一种陪伴。她这次没有先说“都可以”，而是把自己的愿望留在了谈话里。','把旧围巾留在旧照片里','雨音提到以前的站台与围巾。那些照片记录过真实的喜欢，但她希望先讲清之后的联系范围，而不是让一张旧合照替现在作决定。','再遇到同一场雨','你后来又看见了站台的雨。雨音也记得那个地方，但这次相处需要重新问候，不再默认可以坐到以前的距离。'],
  ash:['承诺挤进了欢迎名单','阿澈发现每次聊天都在安排谁需要帮忙。你们过去认真答应过的相处，已经很久没有单独留出时间；他不想再用“等我忙完”遮住问题。','下班以后谁在等谁','阿澈把主持面板关掉，说不希望一段关系变成永远有人值班。你们分别写下现在能做到的联系，也承认有些旧承诺已经做不到。','杯子旁边的空位','阿澈没有撤掉你用过的杯垫，但也没有把空位写成谁必须回来的邀请。你们需要给共同回忆和之后的问候各留一份说明。','没有任务的重新问候','后来你们谈起咖啡厅的一件小事。这次没有交班，没有必须兑现的亲密称呼，只需要先确认彼此是否愿意继续这次问候。'],
  mika:['日历上没兑现的那一格','小满翻到几次被划掉的见面，发现自己一直在给下一次留位置，却没有问双方现在还有多少力气。她把日历合上，第一次不急着补一个日期。','下一页不能靠保证写满','小满想被认真记住，你也有无法一直上线的日子。她问你们还想不想承担原来的约定，不接受为了结束谈话而写下的新保证。','相册不用立刻删干净','小满把共同照片移到单独的页签。她既不想公开分开的原因，也不想被要求立即删除所有东西；每张照片的处置需要重新确认。','不再预留的下一页','新的相册页没有默认留出双人位置。小满说自己仍会想起过去，但今晚能否一起留念，要按现在的关系重新询问。'],
  rei:['两个时区又错开了','零点的现实作息有了变化，原来的交点连续几次没有出现。他不想把变化说成谁不够在乎，也不愿再保证可以一直迁就旧时间表。','旧日程表不能替今天答应','你们把两个时区的新安排放在一起。零点问的是现在可以承担什么，而不是谁愿意多熬一夜；共同创作与砂糖期待也需要分别谈清。','合作名单与关系名字','零点把未完成的文件整理出来。结束砂糖不自动删除合作署名，但继续合作、是否私聊和哪些事需要交接，也不能由一方替另一方安排。','另一份时间表上的问候','后来你们又谈到同一片星空。零点已经按自己的时间表生活，这次没有要求任何人补齐缺席的夜晚，只先确认现在怎样联系。'],
  lin:['散场后没接上的邀请','凛几次演出后都没能赶上原来的邀约。她不想把舞台当成推脱，也不想每次见面都先证明你比其他人重要。她提出先讲一次真正的近况。','把舞台和独处分别说清','凛想保留演出、朋友和独处，你也有自己的相处愿望。两个人发现以前说过的“以后再商量”，已经不能替现在的压力作答。','歌单里仍然有那首歌','凛没有把旧歌从收藏里删掉，也不想用一场公开演出解释分开。你们讨论共同回忆的公开范围，允许每个人按自己的速度整理。','路过舞池边缘的时候','你后来又听见熟悉的那首歌。凛可以选择上台，也可以只坐一会儿；这次是否一起听，需要一个新的邀请，不再沿用砂糖时期的默认安排。'],
  yuki:['报错以外的话没有讲完','弥生发现聊天记录里全是报错和修改意见。她喜欢共同创作，却开始分不清自己是在赴约还是接下一项任务，想把没讲完的感受重新拿出来。','工程可以继续，关系需要回答','弥生问共同的项目是否已经替你们挡住了真正的讨论。你们分别说出合作与亲密的愿望，允许两个答案不再完全相同。','保存工程，也保存各自的边界','弥生把工程另存，准备说明哪些合作还愿意继续。署名不会被用作挽留的条件，分开也不需要把谁的努力从制作名单里抹掉。','没有修改清单的一次相遇','后来出现了一次没有附带修改清单的问候。弥生说现在的距离需要重新确认，作品能否继续讨论，也不能被当成默认恢复亲密的入口。'],
};
const PAIR_BEATS={
  'lin:mika':['错过的演出与合照','小满等着拍照，凛的演出却比约好的时间长了很多。两个人没有当场宣布分开，而是第一次把失落和散场后的疲惫同时讲出来。','一张日历，两个节奏','小满希望约定能落在具体日期，凛希望演出和独处也有位置。双方承认以前的安排让其中一人一直等待，另一人一直赶场。','那张没删掉的散场照','两个人分别说明旧照片怎样保存，也讲清演出邀约不再自动等于双人约会。小满想留下纪念，凛希望不要把私下的原因写成公开标题。','下一次快门先问一声','后来又有拍照的机会。两个人都记得旧照片，却先按现在的关系询问是否入镜，没有用一次合照宣布复合。'],
  'rei:yuki':['上传之后没说出口的话','零点想在上传后收工，弥生却还在看最后一处材质。过去靠创作接上的夜晚，现在让两个人连一句普通的问候都得等工程结束。','署名之外还想怎样相处','两个人把合作任务和私人邀约分成两张清单。零点说明作息，弥生也讲出怕失去同行者的担心；还没有人替他们宣布最终答案。','制作名单不负责挽留','共同工程有了新的交接说明。两个人分别确认署名、消息范围和各自愿意承担的部分，合作没有被用来交换关系继续。','灯亮着，不代表约定没变','后来测试世界又亮起灯。两个人可以继续谈作品，也可以暂停合作；这次邀请以现在的关系为准，不会因为同处一个世界就自动恢复砂糖。'],
  'mika:raina':['慢回复后面的两个晚上','小满很久没有等到明确的晚安，雨音却一直在现实里的安排之间赶路。她们把两份经历放在一起，发现等待和忙碌都没被完整讲过。','空白日历也要有解释','雨音需要独处，小满需要能兑现的约定。她们分别说出哪些承诺已经让自己勉强，不再用一句“你应该懂”让对方继续猜。','给相册留一份新的说明','两个人为共同照片重新确认保存与公开范围。雨音不想被旧称呼拉回原来的距离，小满也需要时间才能把下一页还给自己。','纸月下重新问候','后来她们又提到纸月花园。是否同行、怎样称呼和什么时候回复都要重新确认，想念不会自动撤销已经说清的分开。'],
  'lin:rei':['谢幕与早餐之间的空档','凛谢幕以后才有时间，零点却已经要开始现实的一天。几次短暂错开以后，两个人承认原来的邀约已经开始挤掉睡眠与休息。','不是谁更应该等谁','凛讲舞台结束后的需要，零点讲另一份作息。双方试着寻找真实的交点，也承认不是每个愿望都能靠另一人继续等待来满足。','旧歌单和新时区','他们分别整理共享歌单与合作文件。保留哪些内容、之后如何发送邀请都重新讨论，没人因为不立刻删除回忆就被要求继续亲密。','听见同一首歌以后','后来同一首歌又出现了。凛和零点先确认各自的安排，一次共同听歌不等于取消原来的生活决定，也不替谁承诺新的砂糖。'],
  'lin:yuki':['配件做完以后仍在等','弥生做好配件后等待凛的回应，凛却在一场接一场的活动里忘了回复。她们发现私人邀请正在变得像一张需要等待验收的清单。','邀请里可以没有作品','凛想要不工作的一晚，弥生又担心不继续修改就无法回应喜欢。两个人分别讲清合作与陪伴的期待，让分歧有了真正的语言。','配件的使用与旧称呼','她们分别确认配件能否继续使用、署名怎样保留，以及哪些私密话不再适合公开。已经做过的东西不会成为必须保持砂糖的条件。','一次不附带更新的邀请','后来出现了不带更新清单的邀请。两个人重新询问是否方便、怎样相处，没有让一件共同作品替现在的关系说出同意。'],
};
const REPAIR_LINES={raina:'雨音说自己还不愿分开，但这次会把想要的距离说清楚，而不是只答应所有安排。',mika:'小满明确说还不想分开，希望把一个能做到的约定试完整；她也知道不愿意并不是替另一方决定。',rei:'零点仍珍惜这段关系，想确认有没有不牺牲作息的调整。他提出具体的交点，也愿意听见对方仍想离开的答案。',lin:'凛说自己还想继续，但不愿靠取消舞台或其他朋友来换一次挽留。她想试的是双方都能承担的安排。',yuki:'弥生有些着急，却认真说清自己还不愿分开。她提议把工作与相处分开，而不再保证能把所有问题都修好。',ash:'阿澈还珍惜这段约定，想确认是否能留下不用值班的相处。他没有用过去的帮助要求另一方继续。'};
const statsFor=(run,d)=>d.other?run.npcBonds[[d.npc,d.other].sort().join(':')]:run.relationships[d.npc];
export function beginDeparture(run,npc,other,initiator,reason='request',legacy=false) {
  const key=departureKey(npc,other),old=run.departures[key];
  if(old && (old.resolution==='ended' || old.phase!=='closed'))return old;
  const stats=statsFor(run,{npc,other});
  if(old && initiator!=='player' && (old.attempts>=2 || run.day<old.lastDay+4))return old;
  const d={npc,other:other || null,initiator,reason,startDay:old?.startDay || run.day,lastDay:run.day-1,endDay:0,phase:old?'proposal':'prelude0',resolution:'active',preludes:old?.preludes || [],aftermath:[],plan:false,attempts:old?.attempts || 0,repairAllowed:false,firm:reason==='life' || stats.tension>=(other?75:95),contact:'space',legacy};
  if(legacy) {d.phase='aftermath0';d.resolution='ended';d.endDay=run.day;d.lastDay=run.day;}
  run.departures[key]=d;return d;
}
export function departurePending(d) {
  const shape={prelude0:['separation-prelude',0],prelude1:['separation-prelude',1],proposal:['separation-proposal'],review:['separation-review'],aftermath0:['separation-after',0],aftermath1:['separation-after',1]}[d.phase];
  return shape?{type:'scene',id:shape[0],link:departureKey(d.npc,d.other),npc:d.npc,...(d.other?{other:d.other}:{}),...(shape[1]!==undefined?{index:shape[1]}:{})}:null;
}
export function separationMatches(run,p) {
  const d=run.departures?.[p.link],expected=d && departurePending(d);
  return !!expected && p.id===expected.id && p.npc===expected.npc && p.other===expected.other && p.index===expected.index;
}
export function separationReady(run,p) {
  if(!separationMatches(run,p))return false;
  const d=run.departures[p.link],stats=statsFor(run,d);
  if(![d.npc,d.other].filter(Boolean).every(id=>run.relationships[id]?.introduced && run.relationships[id]?.met))return false;
  if(stats?.status!==(d.resolution==='ended'?'salt':'sugar'))return false;
  return run.day>=d.lastDay+(d.phase.startsWith('aftermath')?2:1);
}
export function departureContactReason(run,id) {
  const d=run.departures?.[departureKey(id)];
  if(d?.resolution!=='ended')return null;
  if(d.contact==='none')return '对方目前不希望联系；后续故事会保留各自的空间';
  if(d.contact==='space')return '你们约好先拉开距离，等后续故事重新确认联系范围';
  return null;
}
function recipientWantsRepair(run,d) {
  const id=d.other?(d.initiator===d.npc?d.other:d.npc):d.npc,stats=statsFor(run,d);
  const threshold=['raina','mika','yuki'].includes(id)?35:50;
  return stats.trust>=threshold && stats.tension<75 && (d.other || stats.affection>=35);
}
const repairPossible=(run,d)=>!d.firm && d.attempts<2 && statsFor(run,d).trust>=35 && statsFor(run,d).tension<(d.other?65:90) && !(d.reason==='boundaries' && !d.other && !['rei','lin','yuki'].includes(d.npc) && PEOPLE.some(p=>p.id!==d.npc && run.relationships[p.id].status==='sugar'));
const choice=(label,text,outcome,extra={})=>({label,text,outcome,effects:{},rel:{},...extra});
export function separationScene(run,p) {
  const d=run.departures?.[p.link];if(!d)return null;
  const name=person(d.npc).name,other=d.other?person(d.other).name:'你',names=d.other?name+'与'+other:'你与'+name;
  const initiator=d.initiator==='player'?'你':person(d.initiator).name,receiver=d.other?person(d.initiator===d.npc?d.other:d.npc).name:name;
  const beats=d.other?PAIR_BEATS[[d.npc,d.other].sort().join(':')]:PLAYER_BEATS[d.npc];
  const scene=(title,text,choices)=>({npc:d.npc,...(d.other?{other:d.other}:{}),title,subtitle:`${d.resolution==='ended'?'分开后的故事':'关系变化与告别'} · ${names}`,text,choices});
  const relation=d.other?{}:{trust:2,tension:-3},pair=d.other?{pairEffects:{trust:2,tension:-3}}:{};
  const context=d.other?`这段谈话由当事人同意分享。${[d.npc,d.other].every(id=>person(id).available.includes(run.day%7))?'你听他们亲自说起。':PEOPLE.some(n=>![d.npc,d.other].includes(n.id) && run.relationships[n.id].introduced && n.available.includes(run.day%7))?'一位已认识、今晚在线的朋友转述了双方同意分享的近况；私密细节没有被传来传去。':'双方共同留下的消息说明了近况，这不是把离线的人突然拉来当面谈话。'}`:`${person(d.npc).available.includes(run.day%7)?'你们约了一段认真谈话的时间。':'对方留下了一条认真写过的消息，你按自己的时间读完。'}`;
  const origin={pressure:'最近的压力需要被讲清楚。',absence:'几次没能接上的相处，需要重新确认。',life:'现实生活安排变了，旧约定不能自动延续。',request:'你已经提出想重新考虑关系，结论会在前置谈话之后作出。',boundaries:'原来的排他与开放关系期待出现差异，需要先听见当事人的愿望。',legacy:'你们在此前的旅程里已经分开。'}[d.reason];
  if(p.id==='separation-prelude') {
    const i=p.index;
    return scene(beats[i*2],`${context}\n\n${beats[i*2+1]}\n\n${origin}这次先谈发生了什么，砂糖关系尚未结束。${i?'上一晚讲过的问题仍在，今晚分别说出各自还能承担什么。':'下一段谈话会留到另一个夜晚，不把第一次说出的问题立刻变成分开结果。'}`, [
      choice(i?'提出一个具体且可退出的调整':'先听完双方的感受，不急着下结论',i?'你们提出了一项可以尝试的调整，下一夜再确认双方是否仍愿意。提出计划还不是已经做到。':'问题第一次有了完整的说法。没有人因为读完这段谈话就被判定已经分开。','departure-prelude',{rel:relation,...pair,effects:d.other?{}:{balance:1},plan:i===1}),
      choice(i?'承认做不到的部分，让不同期待留在桌上':'分别记录错过与压力，不替谁解释',i?'无法做到的承诺被明确收回，谁也没有替另一方答应继续。最终愿望还需要下一次谈话来确认。':'你们把具体经历留下来，允许同一个夜晚有两种感受。关系暂时保持。','departure-prelude',{rel:d.other?{}:{trust:1},plan:false}),
      choice('催促立刻给一个结果','催促带来了新的压力，但没有跳过该讲清楚的事情；关系仍未改变。','departure-prelude',{rel:d.other?{}:{trust:-3,tension:5},...(d.other?{pairEffects:{trust:-3,tension:5}}:{}),plan:false}),
    ]);
  }
  if(p.id==='separation-proposal') {
    const wants=recipientWantsRepair(run,d) && d.attempts<2,allowed=repairPossible(run,d),echo=d.plan?'上一段谈话提出过调整，今晚需要确认双方现在是否还愿意尝试。':'两段前置谈话已经读完，不同期待没有再被藏成一句“以后再说”。';
    const proposal=`${echo}\n\n${initiator}正式提出结束砂糖关系。${d.attempts?'你们此前也试过重新安排，这次提议不是突然忘掉那次努力。':''}`;
    if(d.other) {
      const recipient=d.initiator===d.npc?d.other:d.npc;
      const response=wants?REPAIR_LINES[recipient]:`${receiver}听完以后，承认现在的约定已经很难继续，愿意认真讨论分开。`;
      const reconsider=wants && d.attempts<2;
      return scene(`${initiator}的提议，${receiver}的回答`,`${context}\n\n${proposal}\n\n${response}\n\n${reconsider?'另一方没有立即接受。两个人会再留一晚确认是否尝试调整；这不是由旁人投票决定关系。':'当事人已经说清各自的决定，接下来讨论怎样告别。'}`, [
        choice('听他们把各自的决定说完整',reconsider?'不愿分开的想法已经被听见，两个人会再谈一次，而不是直接改变关系状态。':'两个人把各自的意愿讲清楚，决定结束砂糖并为之后的联系留出空间。',reconsider?'departure-reconsider':'departure-end',{repairWilling:allowed,contact:'space'}),
        choice('把私下讨论的时间留给当事人',reconsider?'你没有替任何人挽留或宣布分开。他们会在另一晚确认是否仍有双方都愿意的安排。':'你尊重当事人的决定，没有把告别变成需要向朋友圈解释的一场表态。',reconsider?'departure-reconsider':'departure-end',{repairWilling:allowed,contact:'space'}),
      ]);
    }
    const text=d.initiator==='player'?`${proposal}\n\n${wants?REPAIR_LINES[d.npc]:`${name}说明自己也愿意结束原来的约定。`}`:`${proposal}\n\n${name}希望自己的愿望被听见。你也可以说出还不愿分开的感受，再确认双方是否有继续尝试的意愿。`;
    return scene(d.initiator==='player'?`${name}对分开提议的回答`:`${name}正式提出分开`,text,[
      choice(d.initiator==='player' && wants?'回应 TA 不愿分开，讨论一次具体调整':'接受这次告别，商量之后的距离',d.initiator==='player' && wants?'你愿意认真回应对方的挽留，再留一晚把可行的调整讲清楚；砂糖关系仍然保留。':'双方听见了各自的决定，结束砂糖约定，并先给彼此整理生活的空间。',d.initiator==='player' && wants && d.attempts<2?'departure-reconsider':'departure-end',{repairWilling:d.initiator==='player'?true:allowed,contact:'space'}),
      choice(d.initiator==='player'?'说明自己仍决定分开，不让挽留变成新的承诺':'说自己还不愿分开，提出一次具体调整',d.initiator==='player'?'你说清决定，也认真听完不舍。结束后的联系不会继续沿用砂糖时的默认安排。':'你明确表达不愿分开，也给对方拒绝调整的空间。关系暂时保留，下一夜再听完整的回应。',d.initiator==='player'?'departure-end':'departure-reconsider',{repairWilling:allowed,contact:'space'}),
      ...(d.initiator==='player' && d.attempts<2?[choice('承认自己还没决定，先重新讨论','你收回这次立即作决定的提议，愿意先认真商量，而不是让对方等一个含糊的承诺。','departure-reconsider',{repairWilling:wants})]:[]),
    ]);
  }
  if(p.id==='separation-review') {
    const allowed=d.repairAllowed && !d.firm && statsFor(run,d).trust>=30 && statsFor(run,d).tension<(d.other?70:95);
    const firmSpeaker=!d.other && d.initiator==='player'?name:initiator;
    const text=`上一夜有人明确说还不愿分开。${names}没有把这句话忽略，也没有把它当作对另一方的自动决定。\n\n${allowed?'双方愿意试一次具体调整，保留各自生活、拒绝邀约与退出的空间；没有人保证从此不会再遇到问题。':`${firmSpeaker}认真听过重新调整的提议以后，仍然表示不能继续原来的砂糖约定。另一方的不舍被留下，但不再用新的保证延长已经无法承担的关系。`}`;
    if(d.other)return scene('挽留之后，两个人的决定',`${context}\n\n${text}`,[
      choice('听双方确认自己的决定',allowed?'两个人共同同意继续砂糖，先落实一项可行的安排。你没有替他们答应。':'两个人把最后的愿望讲完整，确认结束砂糖，先各自保留整理生活的距离。',allowed?'departure-repair':'departure-end',{contact:'space'}),
      choice('不替任何人保证以后，尊重当事人的结论',allowed?'他们愿意继续，但没有承诺永远不改变。新的相处需要用实际安排兑现。':'你没有让一方的不舍变成另一方必须留下的条件。告别后的边界会在后续继续讨论。',allowed?'departure-repair':'departure-end',{contact:'space'}),
    ]);
    return scene(allowed?'把继续关系说成具体的安排':'不愿分开之后，仍然听见告别',text,allowed?[
      choice('我也愿意调整，双方确认先继续砂糖','你们共同确认暂时继续关系，写清能做到的安排，也保留之后重新讨论的权利。','departure-repair',{effects:{balance:2},rel:{trust:3,tension:-6}}),
      choice('认真想过以后，我仍然选择分开','你说明自己的决定，接受这份不舍，也不再许下做不到的关系承诺。','departure-end',{contact:'space',initiator:'player'}),
    ]:[
      choice('说出遗憾，接受对方最终的决定','你们结束砂糖关系。难过没有被取消，之后的联系范围仍然需要另行确认。','departure-end',{contact:'space'}),
      choice('先保留距离，各自整理生活','你听清决定，选择暂时不联系。共同经历仍在，不需要靠持续聊天把告别掩盖过去。','departure-end',{contact:'none'}),
    ]);
  }
  if(p.id==='separation-after') {
    const i=p.index,privateOnly=d.contact==='none',allowFriends=!d.firm || statsFor(run,d).trust>=40;
    const memory=!d.other && run.photos.find(s=>s.companion===d.npc && s.day<=d.endDay);
    const echo=memory?`\n\n第 ${memory.day} 夜在${WORLD.find(w=>w.id===memory.world).name}留下的「${memory.title}」仍在相册里，不会自动删除，也不会用来宣布重新成为砂糖。`:'';
    const actualMemories=!d.other && !memory && i===0?`${name}提起以前认真相处过的夜晚。你们没有在相册里留下共同照片，这次也不会补造一张不存在的合照；共同的谈话仍然留在日记里。之后怎样联系，需要按现在的关系重新确认。`:beats[5+i*2];
    const text=privateOnly?(d.other?'两个人此前确认暂不联系。你只听到双方各自愿意分享的近况，没有替他们传递私密消息，也没有安排一次突然的重逢。':'你们此前确认暂不联系。今晚是整理自己的回忆，不是向对方发送一条要求回应的消息。')+`\n\n${i?'旧地点依然可以经过，但不联系的约定仍然有效；你没有为了写一个圆满结尾安排复合。':'已经发生的谈话与经历保留在记录里。谁也不需要公开细节，或者立即删除回忆来证明已经走出来。'}`:`${context}\n\n${actualMemories}\n\n${i?'之后仍是已经告别砂糖的两个人。愿意问候或合作，也不会自动恢复关系。':'砂糖关系已经结束。这次只确认已有回忆、作品与之后怎样联系，不能倒推成重新答应亲密。'}`;
    const firstScope=privateOnly?'none':allowFriends?'friends':'space';
    return scene(privateOnly?(i?'让新的夜晚仍然属于自己':'不联系，也可以整理回忆'):!d.other && !memory && i===0?'把往事留在自己的位置':beats[4+i*2],text+echo,[
      choice(privateOnly?(d.other?'尊重两人不联系，听他们各自愿意分享的近况':'遵守不联系，给自己的回忆留下说明'):allowFriends?(d.other?'听双方确认按朋友身份联系，不替谁恢复亲密':'按现在的朋友身份联系，先询问是否方便'):'继续留出距离，不急着重新见面',privateOnly?'你没有向对方索取回应，也没有替两个人宣布新的关系。回忆留着，生活继续。':allowFriends?'当事人共同确认可以作为朋友问候，旧的亲密权限不会自动恢复。':'对方还需要距离，这个愿望得到尊重。共同回忆没有被删除，联系也没有被催促。','departure-after',{contact:firstScope,effects:{balance:2},rel:!d.other && !privateOnly && firstScope==='friends'?{trust:1}:{}}),
      choice(privateOnly?(d.other?'支持各自的生活，不替两个人作结论':'把注意力放回自己的生活，不替对方作结论'):(d.other?'听当事人说明仍不想联系的范围':'说明现在仍不想联系，保留更多空间'),privateOnly?'今晚不为对方安排答案，也不要求自己立即遗忘。未发送的消息被留在自己的记录里。':'当事人确认暂时不联系。你们没有让留念、合作或朋友的起哄绕过这个选择。','departure-after',{contact:'none',effects:{mood:1}}),
    ]);
  }
  return null;
}
export function advanceDeparture(run,p,c) {
  const d=run.departures[p.link],stats=statsFor(run,d),names=d.other?person(d.npc).name+'与'+person(d.other).name:'你与'+person(d.npc).name;
  let notice=null;
  if(c.outcome==='departure-prelude') {d.preludes.push(run.day);d.plan=c.plan;d.phase=p.index===0?'prelude1':'proposal';}
  if(c.outcome==='departure-reconsider') {
    d.phase='review';d.attempts=Math.min(2,d.attempts+1);d.repairAllowed=!!c.repairWilling;
    notice={title:`${names}尚未分开 · 会再讨论一次`,text:c.text,npc:d.npc,...(d.other?{other:d.other}:{}),answer:'reconsider',day:run.day};
  }
  if(c.outcome==='departure-repair') {
    d.phase='closed';d.resolution='repaired';d.contact='friends';
    notice={title:`${names}共同决定继续砂糖`,text:c.text,npc:d.npc,...(d.other?{other:d.other}:{}),answer:'repaired',day:run.day};
  }
  if(c.outcome==='departure-end') {
    if(c.initiator)d.initiator=c.initiator;
    stats.status='salt';d.resolution='ended';d.phase='aftermath0';d.endDay=run.day;d.contact=c.contact || 'space';
    if(d.other){stats.stage=3;stats.lastDay=run.day;stats.initiator=d.initiator;stats.open=false;}
    else{stats.intent=null;stats.agreement=false;stats.drifted=d.initiator!=='player';}
    notice={title:`${names}的砂糖关系已结束`,text:c.text+' 分开后的照片、联系与重新相处会在后续故事里继续。',npc:d.npc,...(d.other?{other:d.other}:{}),answer:d.other?'npc-ended':'ended',day:run.day};
  }
  if(c.outcome==='departure-after') {d.aftermath.push(run.day);d.contact=c.contact;d.phase=p.index===0?'aftermath1':'closed';}
  d.lastDay=run.day;
  if(d.resolution!=='ended')stats.lastDay=run.day;
  return notice;
}
export function validateDepartures(run) {
  if(!run.departures || typeof run.departures!=='object' || Array.isArray(run.departures) || Object.keys(run.departures).length>PEOPLE.length+NPC_ROUTES.length)return false;
  const day=(n,min=0)=>Number.isInteger(n) && n>=min && n<=run.day;
  for(const [key,d] of Object.entries(run.departures)) {
    if(!d || !person(d.npc) || (d.other!==null && !person(d.other)) || key!==departureKey(d.npc,d.other) || !PHASES.includes(d.phase) || !['active','repaired','ended'].includes(d.resolution))return false;
    if(d.other && !NPC_ROUTES.some(r=>r.cast[0]===d.npc && r.cast[1]===d.other))return false;
    if(d.other?![d.npc,d.other].includes(d.initiator):!['player',d.npc].includes(d.initiator))return false;
    if(!['request','pressure','absence','life','boundaries','legacy'].includes(d.reason) || !['space','friends','none'].includes(d.contact))return false;
    if(![d.npc,d.other].filter(Boolean).every(id=>run.relationships[id].met && run.relationships[id].introduced))return false;
    if(!day(d.startDay,1) || !day(d.lastDay) || !day(d.endDay) || d.lastDay<d.startDay-1 || !Number.isInteger(d.attempts) || d.attempts<0 || d.attempts>2 || !['plan','repairAllowed','firm','legacy'].every(k=>typeof d[k]==='boolean'))return false;
    if(!Array.isArray(d.preludes) || d.preludes.length>2 || d.preludes.some((n,i)=>!day(n,1) || n<d.startDay || n>d.lastDay || (i && n<d.preludes[i-1]+1)))return false;
    if(!Array.isArray(d.aftermath) || d.aftermath.length>2 || d.aftermath.some((n,i)=>!day(n,1) || n>d.lastDay || n<(i?d.aftermath[i-1]:d.endDay)+2))return false;
    const stats=statsFor(run,d);if(stats?.status!==(d.resolution==='ended'?'salt':'sugar'))return false;
    if(d.resolution==='active' && (!['prelude0','prelude1','proposal','review'].includes(d.phase) || d.endDay!==0 || d.aftermath.length))return false;
    if(!d.legacy && d.preludes.length!==({prelude0:0,prelude1:1}[d.phase] ?? 2))return false;
    if(d.resolution==='ended' && (!['aftermath0','aftermath1','closed'].includes(d.phase) || !day(d.endDay,1) || d.lastDay<d.endDay || d.aftermath.length!==({aftermath0:0,aftermath1:1,closed:2}[d.phase])))return false;
    if(d.resolution==='ended' && !d.legacy && d.endDay<d.preludes[1]+1)return false;
    if(d.legacy && (d.resolution!=='ended' || d.reason!=='legacy'))return false;
    if(d.resolution==='repaired' && (d.phase!=='closed' || d.endDay!==0 || d.aftermath.length || d.attempts<1))return false;
    if(d.phase==='review' && d.attempts<1)return false;
  }
  return true;
}
export function departureSummary(run,npc,other) {
  const d=run.departures?.[departureKey(npc,other)];if(!d)return '';
  if(d.resolution==='ended')return `砂糖已结束 · 后续 ${d.aftermath.length} / 2 · ${d.contact==='none'?'暂不联系':d.contact==='space'?'先留出距离':'可按朋友身份问候'}`;
  if(d.resolution==='repaired')return '双方决定继续砂糖 · 调整需要实际兑现';
  return `关系仍保留 · 前置 ${d.preludes.length} / 2 · ${{prelude0:'先讲变化',prelude1:'再谈各自愿望',proposal:'等待正式提议',review:'回应挽留，再确认决定'}[d.phase]}`;
}
