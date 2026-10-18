import { themeSecond, themeContinuation, themeRoute } from './theme-branches.js';
import { PEOPLE } from './data.js';
import { departureContactReason } from './separation-stories.js';

export const THEMES=[
 {id:'quiet',name:'慢一点的一周',condition:'完成任意一局',cast:['raina','ash'],plans:['一条不赶路的散步','一次只讲小事的茶会','一段各自探索后再见的时间'],steps:[
  ['空白日程的第一格','雨音和阿澈都收到一张没有排满的活动表。它没有要求每天见面，第一格只写一件大家现在想做的小事。你也可以把自己的期待放进去。'],
  ['留下的时间真正被用掉','空出来的晚上没有自动变得轻松。有的人还是想多安排一点，有的人第一次知道自己想早点结束。你们拿第一次实际采用的安排继续商量。'],
  ['这一周不按出勤收尾','几次短相处结束以后，你们发现最值得记住的是具体做过什么。日历上仍有空白，这个主题却已经可以写一个认真结束的段落。'],
 ],branches:[['你们先选了不赶路的散步，路上可以停，也可以改道。','最后留下的是几处真正停过的风景，没有把步数当作相处的成绩。'],['你们先选了只讲小事的茶会，节目只有每人愿意说的一件事。','最后留下的是几句普通话题，安静没有被当作活动失败。'],['你们先分头探索，再交换一件发现；共同时间没有占满整晚。','最后留下的是三件不同的见闻，独处也真的成为了后来能分享的生活。']]},
 {id:'workshop',name:'开门之前的小展览',condition:'完成世界项目或抵达创作者结局',cast:['rei','yuki'],plans:['一个低负担的体验角','一面记录试错的过程墙','一段由访客自己选择的路线'],steps:[
  ['展览只够认真做一件事','零点和弥生想做一次小展览，时间不够把所有功能都完成。你们都愿意留下各自的作品，也必须先决定这次主要让访客体验什么。'],
  ['试展时有人走错了方向','第一次小范围试展收到几个互相矛盾的反馈。你们选过的重点仍在，新的问题却要求决定哪些现在改、哪些先写清楚限制。'],
  ['开门后没有人按脚本走','小展览真的开门了。有人停在细节前，有人走得很快。零点和弥生想保留真实反应，你们也可以把下一次的想法留到收工之后再写。'],
 ],branches:[['你们先做了低负担的体验角，装饰与规模都主动缩小。','完成的体验角不大，不同设备的访客却都能实际走一遍。'],['你们先整理了过程墙，未完成的草图也在确认范围后被留下。','完成的过程墙让人看见试错，没有把一次展示包装成从不出错的成功。'],['你们先做了可自由选择的路线，不要求每位访客按同一顺序看完。','完成的路线留下几个入口，访客的不同走法也成了展览的一部分。']]},
 {id:'gathering',name:'轮到朋友选节目',condition:'抵达朋友结局或完成聚会项目',cast:['ash','lin'],plans:['一场猜词小局','一张轮流选曲的歌单','一条没人看过攻略的路线'],steps:[
  ['主持人今晚只负责参加','阿澈和凛都想来玩，也都不想整晚维持气氛。你们约定每个人只认领一小段，第一件事需要有人先挑一个自己也想参加的节目。'],
  ['轮值走到最不熟练的人','轮值真的轮到一个不擅长当前节目的人。大家可以简化规则，也可以把一部分留给愿意接手的人，原来的主持人没有被自动叫回台上。'],
  ['谢幕不是一个人的工作','最后一轮结束时，阿澈没有冲去收尾，凛也没有再放一首歌拖住大家。你们共同决定怎样结束这次活动，并说明下一次不是默认由同一个人继续负责。'],
 ],branches:[['猜词从最简单的题开始，有的人负责画，也有人只负责提出离谱答案。','猜词没排出最会表达的人，却让几个安静的朋友都留下了一个答案。'],['每个人只选一首歌，等待时也真的听别人喜欢什么。','最后的歌单风格很杂，能认出每一位选曲者留下的那一小段。'],['你们选了一条谁都没有备过课的路线，轮流承认不知道。','最后的路线图有错路也有发现，没有谁因为不熟练被取消带路资格。']]},
 {id:'letters',name:'把邀约写具体',condition:'一局中确认过自己或朋友的砂糖关系',cast:['raina','mika'],plans:['一次有明确结束时间的同行','一个双方都能改期的约定','一份不要求立即回信的近况'],steps:[
  ['邀请卡先写现在能做到的事','雨音和小满想交换几种邀请的写法。你也有自己的期待，但这次不需要一张卡承诺整个未来。先选一件现在确实愿意承担的安排。'],
  ['第一张卡遇到了现实改动','一张已经认真写过的邀请还是碰上临时变化。有人失落，也有人担心说清楚之后会显得不够喜欢。你们可以认真协商，不能替没有答应的人签名。'],
  ['约定留下的是一次回应','邀请有过被接受、被修改或没能成行的部分。你们按实际采用的写法整理这一阶段，没有把主题结束写成已经确认恋爱，也没有要求所有关系走到相同结果。'],
 ],branches:[['邀请先写清了能一起待多久，结束时间也属于约定的一部分。','有了能说清的结束点，同行没有靠谁一直舍不得离开维持。'],['邀请先写明可以改期，新的时间仍要重新得到双方确认。','一次改期没有被抹成什么都没发生，也没被判成不在意的证据。'],['邀请是一份近况，收信的人可以在方便时再读。','回信来得有早有晚，文字仍然记录了当时实际发生的小事。']]},
 {id:'paths',name:'六个世界之外的回信',condition:'一局中探索全部六个世界',cast:['rei','lin'],plans:['一张声音与节奏的路线卡','一份只写小路的旅行记录','一组留给不同设备的入口提示'],steps:[
  ['旅行卡不再排必去清单','零点和凛都喜欢探索，却不想给新人一份必须全部打卡的清单。你们决定只做一张有自己偏好的路线卡，别人可以沿着它走，也可以在中途拐弯。'],
  ['第一封回信偏偏不按路线','有人照路线卡找到了入口，随后去了另一条路。对方的回信有好奇，也有一处与你们感受不同的描述。你们需要决定怎样把它留进记录。'],
  ['路线卡终于不只属于作者','记录完成这一阶段时，多了别人愿意分享的发现。零点与凛都保留自己的偏好，你也不用在所有路线中排一个永远正确的第一名。'],
 ],branches:[['路线卡以声音和节奏串联，停多久交给走路的人决定。','回信里有人听见不同的节拍，原来的路线因此多了一种可选择的读法。'],['路线卡只收集不起眼的小路，没有声称它们比主路更懂旅行。','回信替小路添了一处具体发现，你们也保留了尚未去过的空白。'],['路线卡先写入口与设备差异，让愿意来的人知道怎样找到路。','回信让说明更清楚，也提醒你们仍有人用着自己没试过的方式探索。']]},
 {id:'renewal',name:'旧地方的新用途',condition:'一局中确认告别，或抵达告别结局',cast:['mika','yuki'],plans:['一个重新布置的小角落','一页按现在重新整理的记录','一件完全不同的新作品'],steps:[
  ['不拿旧地方考验任何人','小满和弥生想讨论一个熟悉角落的新用途。这个主题从本轮的新相遇开始，不继承前一局的感情，也不会把谁强行叫回来。你们先决定现在想做什么。'],
  ['留下与移开的具体分界','开始动手后，你们发现舍不得的东西与不想再沿用的安排可能挤在同一处。可以一件件确认，也可以先保存旧版，再做一次独立尝试。'],
  ['新的用途没有擦掉旧记录','这一阶段真的完成了一些改变。你们只记录实际做过的事，没有替旧关系宣布和解，也没有要求每个人用同一种方式继续生活。'],
 ],branches:[['你们先重新布置一个小角落，使用者和使用方式都按现在重新询问。','角落有了新的用途，旧记录仍能单独保存，没有谁必须回来证明这个地方成功了。'],['你们先整理一页现在愿意保留的记录，不自动公开任何人的过去。','记录写清了现在的范围，也留住已经存在的记忆，没有把整理等同于全部放下。'],['你们先做一件不同的新作品，暂时不把旧东西变成必须解决的问题。','新的作品拥有自己的开始，旧问题没有被假装消失，也没有挡住所有新的尝试。']]},
];

const theme=id=>THEMES.find(t=>t.id===id);
export const ENCORE_SCENES=THEMES.flatMap(t=>[0,1,2].map(index=>({id:`encore-${t.id}-${index}`,theme:t.id,npc:t.cast[0],other:t.cast[1],index})));
export const freshEncore=(route=null)=>({route,days:[],choices:[],detour:null});
export function unlockedFromEndings(endings=[]) {
  const out=[];if(endings.length)out.push('quiet');
  for(const [ending,id] of [['creator','workshop'],['friends','gathering'],['sugar','letters'],['weave','letters'],['traveler','paths'],['goodbye','renewal']])if(endings.includes(ending))out.push(id);
  return [...new Set(out)];
}
export function unlockThemes(run,legacy) {
  const earned=['quiet',...unlockedFromEndings(legacy.endings)];
  if(run.projects.world>=5)earned.push('workshop');if(run.projects.event>=4)earned.push('gathering');
  if(Object.values(run.relationships).some(r=>['sugar','salt'].includes(r.status)) || Object.values(run.npcBonds).some(b=>['sugar','salt'].includes(b.status)))earned.push('letters');
  if(run.visited.length===6)earned.push('paths');if(Object.values(run.relationships).some(r=>r.status==='salt') || Object.values(run.npcBonds).some(b=>b.status==='salt'))earned.push('renewal');
  legacy.themesUnlocked=[...new Set([...legacy.themesUnlocked,...earned])];
  if(run.encore.route&&run.encore.days.length===3){legacy.themesCompleted=[...new Set([...legacy.themesCompleted,run.encore.route])];legacy.themeRoutes=[...new Set([...(legacy.themeRoutes||[]),themeRoute(theme(run.encore.route),run.encore.choices).key])];}
}
export function encoreReady(run,s) {
  const e=run.encore,t=s&&theme(s.theme);
  return !!t && e.route===s.theme && e.days.length===s.index && run.day>=4+s.index*7 && (!s.index || run.day>=e.days.at(-1)+3) && t.cast.every(id=>run.relationships[id]?.introduced&&!departureContactReason(run,id)) && !run.storySeen.includes(s.id);
}
export function encoreMessages(run) {return ENCORE_SCENES.filter(s=>encoreReady(run,s)).map(s=>({type:'scene',id:s.id,npc:s.npc,other:s.other,optional:true}));}
export function encoreScene(run,q) {
  const s=ENCORE_SCENES.find(s=>s.id===q.id);if(!s)return null;if(s.index>run.encore.choices.length)return null;const t=theme(s.theme),root=run.encore.choices[0],plan=t.plans[root ?? 0];
  const [title,text]=t.steps[s.index],echo=s.index?`${t.branches[root][0]}\n\n`:'';
  const last=s.index===2?run.storybook.findLast(x=>x.id===`encore-${t.id}-1`):null;
  const progression=s.index===1?themeSecond(t,root):s.index===2?themeContinuation(t,run.encore.choices[1]):'';
  const detour=s.index===2&&run.encore.detour?run.storybook.findLast(x=>x.id.startsWith('turn-')):null;
  const detourText=detour?'你们后来还经历过「'+detour.title+'」。'+detour.result+'\n\n':'';
  const actual=last?`上一段实际选择的是「${last.options[last.choice]}」。\n\n`:'';
  const labels=s.index===0?t.plans:s.index===1?['先兑现原来最在意的部分，缩小这次范围','先和朋友调整做法，接受原定安排会改变','先各自完成一小段，再交换实际结果']:['把完成的部分留下，认真结束这一阶段','留一个明确的小续篇，重新询问谁愿意参加','分别收藏自己的版本，不要求统一纪念方式'];
  return {id:s.id,npc:s.npc,other:s.other,title:s.index?`${title} · ${plan}`:title,subtitle:`本轮主题 · ${t.name} · ${s.index+1} / 3`,text:'这条主题线属于本轮的新旅程；不会继承上局关系，也不会替角色确认心意。\n\n'+echo+actual+detourText+text+'\n\n'+progression+(s.index===2?'\n\n'+t.branches[root][1]:''),choices:labels.map((label,i)=>({label,text:s.index===2?themeRoute(t,[root,run.encore.choices[1],i]).text:s.index===0?`你们采用「${label}」作为这轮的起点，另外两种安排暂时不做。`:s.index===1?i===0?'你们先做完原来最想留下的一部分，其余内容清楚写到以后，没有把它们说成已经完成。':i===1?'调整得到各方确认，原来的期待也重新说了一遍。下一段会记住这次实际采用的做法。':'大家分头做完一小段，回来讲的都是真正发生的事，没有人替别人补出缺席的经历。':i===0?'这一阶段到这里认真结束。记录留下来，没有附带必须马上参加下一轮的义务。':i===1?'你们另写了一份小邀请，谁愿意接续需要重新回答，过去的参加不代替新的同意。':'你们保留了各自的纪念方式，没有把统一的合照或公开记录当作共同经历唯一的证据。',effects:i===0?{mood:2,energy:-3}:i===1?{social:1,balance:-2}:{balance:2,mood:-1},rel:{trust:2},otherRel:{trust:2},npcLinkDelta:1,pairEffects:{trust:1,tension:-1},outcome:'encore-read'}))};
}
export function validEncore(run,legacy) {
  const e=run.encore;if(!e||!(e.route===null||theme(e.route)&&legacy.themesUnlocked.includes(e.route))||!Array.isArray(e.days)||!Array.isArray(e.choices)||e.days.length>3||e.days.length!==e.choices.length||e.route===null&&e.days.length)return false;
  return e.days.every((d,i)=>Number.isInteger(d)&&d>=4+i*7&&d<=run.day&&(!i||d>=e.days[i-1]+3)&&[0,1,2].includes(e.choices[i]))&&ENCORE_SCENES.every(s=>run.storySeen.includes(s.id)===(s.theme===e.route&&e.days.length>s.index));
}
export function validThemeLegacy(legacy) {return ['themesUnlocked','themesCompleted'].every(k=>Array.isArray(legacy[k])&&legacy[k].length<=THEMES.length&&new Set(legacy[k]).size===legacy[k].length&&legacy[k].every(id=>theme(id)))&&legacy.themesCompleted.every(id=>legacy.themesUnlocked.includes(id));}
