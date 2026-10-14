import { PEOPLE } from './data.js';

const person=id=>PEOPLE.find(p=>p.id===id);
const choice=(label,text,extra={})=>({label,text,effects:{},rel:{},...extra});
export const NPC_ROUTES = [
  {cast:['rei','lin'],day:14,after:'group-backstage',
    confession:'谢幕的灯熄灭后，凛没有立即下线，而是问零点想不想一起去听一首没有舞步的歌。零点认真回应了这份邀请，也说自己想把相处继续下去。两个人知道新的喜欢可能连着其他亲密关系，不能把已有约定省略成一句“应该没关系”。',
    date:'凛想在演出之后见面，零点却需要赶上另一个时区的早晨。两个人把排好的邀请放到一起，发现喜欢没有让时间自动重叠。谁希望独处、谁已经答应了别的邀约，都需要被看见。',
    goodbye:'零点说：“我想结束这段砂糖关系。最近我能给出的相处安排，已经和自己想过的生活不同了。”凛听完后没有把告别当成对演出的否定。他们留下可以继续合作的部分，也各自决定是否还需要联系。'},
  {cast:['lin','yuki'],day:17,after:'group-costume',
    confession:'发光耳机做好之后，弥生问凛能不能再发一条不带修改清单的邀请。凛说她一直想邀请的就是弥生本人。两个人把喜欢讲清楚，也主动问起已有砂糖是否知情、未来的见面是不是每个人都能接受。',
    date:'凛想留出一晚不工作、不演出、不修改模型的时间。弥生答应了，却又收到了另一位砂糖的邀请。她没有把任何人藏起来，而是把几份安排摆在一起，请每个人说说真实的愿望。',
    goodbye:'凛说：“我想结束砂糖关系，重新整理自己想要的相处方式。你不用为了挽留我，把所有未完成的事情都放下。”弥生问清哪些合作还会继续，也保留了自己可以暂时不联系的选择。'},
  { cast:['mika','lin'],day:7,after:'group-photo',
    confession:'小满发来一张没有发布的照片。照片里，凛正低头替她调整相机背带。凛说自己想认真试着和小满成为砂糖，小满却先问：“我喜欢记录，你喜欢舞台，我们是不是也能认识对方不擅长的部分？”两个人想把喜欢与期待一起讲明白。',
    date:'凛的小型演出和小满的拍照约定撞在同一晚。小满说自己想要的是明确的见面时间，凛说自己也不想把舞台生活全部放下。两个人已经是砂糖，却仍然需要为各自喜欢的事情留位置。',
    goodbye:'小满说：“我发现自己想要的相处方式变了，不能继续许下原来的承诺。”凛沉默了一会儿，没有把所有旧照片删掉。她们决定结束砂糖关系，照片是否保留、以后要不要再见，都由两个人分别决定。' },
  { cast:['rei','yuki'],day:9,after:'group-build',
    confession:'共作的灯发布后，零点发给弥生的消息不再只有报错。弥生把纸鸟放在他的工程窗口旁边：“这次不是署名，我想知道我们是不是也能喜欢作品之外的彼此。”零点说他也想试试，但时区和已有的亲密约定必须先讲清楚。',
    date:'零点与弥生准备一起庆祝新作品，却发现一个人想在发布后休息，另一个人还想赶上最后的修改。零点说：“共同创作让我们靠近，但不能让关系变成永远不下线的工程。”弥生也想保留不是合作伙伴的那一部分生活。',
    goodbye:'零点说：“我最近的生活安排变了，想先结束砂糖关系。不是你的作品不够好，也不是我们合作过的东西失去了意义。”弥生问清了接下来的署名与沟通方式。灯仍然可以共同完成，关系却不需要为了工程继续。' },
  { cast:['raina','mika'],day:11,after:'group-message',
    confession:'雨音给小满发来一朵云，这次后面跟着一句完整的话：“我好像不只是想收到你的晚安。”小满没有马上截图，而是问雨音愿不愿意一起谈谈砂糖的期待。她们知道慢回复与想被记住可以并存，也想确认这份喜欢是不是两个人共同的愿望。',
    date:'小满想把相处日历写满，雨音却给周末留下一大片空白。小满担心空白代表疏远，雨音怕自己又需要用秒回证明喜欢。她们把日历放到一起，想找到不必让谁一直忍耐的节奏。',
    goodbye:'雨音说：“我现在想要的陪伴方式和以前不同了，我希望结束砂糖关系。”小满问是否还有没讲清楚的事，却没有把告别变成一次说服。两个人都承认喜欢曾经是真的，也允许现在的愿望发生变化。' },
];

NPC_ROUTES.sort((a,b)=>a.day-b.day);
export function npcScene(run,pending) {
  const a=person(pending.npc),b=person(pending.other),name=a.name,other=b?.name;

  const key=[a.id,b.id].sort().join(':'),bond=run.npcBonds[key];
  if(pending.id==='together')return {npc:a.id,other:b.id,title:`今晚一起相处 · ${name}与${other}`,subtitle:'共同相处 · 你的选择会影响三方关系',
    text:`你邀请${name}与${other}来到同一个世界。${name}讲起今晚想做的事，${other}也有自己的安排。${bond?.status==='sugar'?'他们已经是砂糖，这次相处也会影响两人已有的信任与压力。':'他们开始了解彼此，也在观察你会不会认真听见不同的愿望。'}`,
    choices:[choice('找一个共同兴趣，听两人说清愿望','你没有替谁安排角色，两个人找到一个都愿意尝试的小计划。你们的相处也多了一点信任。',{rel:{trust:3,affection:1},otherRel:{trust:3,affection:1},npcLinkDelta:6,pairEffects:bond?.status==='sugar'?{trust:5,tension:-4}:null,outcome:'together-connect'}),choice('留给他们自己聊，不急着撮合','两个人按自己的节奏交换了想法。你尊重他们是否靠近的选择，他们也记住了这份空间。',{rel:{trust:2},otherRel:{trust:2},npcLinkDelta:4,pairEffects:bond?.status==='sugar'?{trust:3,tension:-3}:null,outcome:'together-connect'}),choice(`帮${name}说服${other}接受安排`,`${name}一时觉得被支持，${other}却觉得自己的愿望被跳过。两个人之间的讨论，也变成了谁应该退让。`,{rel:{affection:2,tension:2},otherRel:{trust:-6,tension:8},npcLinkDelta:-6,pairEffects:bond?.status==='sugar'?{trust:-8,tension:12}:null,outcome:'together-pressure'}),choice(bond?.status==='sugar'?'要求他们每天一起上线':'起哄让他们现在就确认关系',bond?.status==='sugar'?'两个人不愿用每天出席证明喜欢。各自的安排被忽略，这次邀请也留下了新的压力。':'两个人没有因为起哄改变关系。他们收起还没讲完的话，也更难相信这次邀请只是想好好相处。',{rel:{trust:-4,tension:6},otherRel:{trust:-4,tension:6},npcLinkDelta:-4,pairEffects:bond?.status==='sugar'?{trust:-6,tension:14}:null,outcome:'together-pressure'})]};
  const route=NPC_ROUTES.find(x=>x.cast.includes(a.id)&&x.cast.includes(b?.id));
  if(!route)return null;
  const shared=route.cast.filter(id=>run.relationships[id].status==='sugar');
  const related=Object.entries(run.npcBonds).filter(([pair,x])=>pair!==key && x.status==='sugar' && pair.split(':').some(id=>route.cast.includes(id)));
  const cast=[...new Set([...route.cast,...related.flatMap(([pair])=>pair.split(':'))])];
  const third=cast.filter(id=>!route.cast.includes(id));
  const changes=effects=>related.map(([pair])=>({cast:pair.split(':'),effects}));
  const feelings=effects=>Object.fromEntries(third.map(id=>[id,effects]));
  if(pending.id==='npc-network')return {npc:a.id,other:b.id,title:'新的心意，也连着已有的约定',subtitle:`NPC 多段砂糖 · ${cast.map(id=>person(id).name).join(' × ')}`,
    text:`${name}与${other}没有直接确认新的砂糖关系。${related.map(([pair])=>pair.split(':').map(id=>person(id).name).join('与')).join('、')}已有的砂糖约定，也属于当事人自己的选择。${third.map(id=>person(id).name).join('、')}加入谈话，讨论知情、独处、见面安排与退出权。\n\n他们可以同时喜欢不止一个人，但没有人能替另一位砂糖同意。${shared.length?'你也是其中一段关系的当事人，与你相关的约定仍需要你明确回应。':'你是这次谈话的朋友，不负责替他们决定关系。'}`,
    choices:[choice('听每个人说清期待，鼓励逐一确认约定','他们分别说出了愿意与不愿意承担的事，没有把已有关系当作可以自动略过的一步。',{rel:{trust:2},otherRel:{trust:2},castRel:feelings({trust:2}),bondChanges:changes({trust:4,tension:-4}),outcome:'npc-bond-network'}),choice('让他们独立商量，再认真听共同的决定','你把时间留给当事人。他们在谈完后，把新的约定分别告诉与你有关的人。',{rel:{trust:1},otherRel:{trust:1},castRel:feelings({trust:1}),bondChanges:changes({trust:2,tension:-2}),outcome:'npc-bond-network'}),choice('建议先试试，不必告诉已有砂糖','他们没有照着隐瞒的建议确认关系；但这番话让已有砂糖担心，自己的约定是否会被轻易跳过。讨论需要再慢慢建立信任。',{rel:{trust:-4,tension:4},otherRel:{trust:-4,tension:4},castRel:feelings({trust:-5,tension:6}),bondChanges:changes({trust:-6,tension:10}),outcome:'npc-bond-network-delay'})]};
  if(pending.id==='npc-calendar')return {npc:a.id,other:b.id,title:'几份喜欢，共用一个夜晚',subtitle:`NPC 关系交织 · ${cast.map(id=>person(id).name).join(' × ')}`,
    text:`${name}与${other}确认新的砂糖后，已有的${third.map(id=>person(id).name).join('、')||'朋友'}并没有从日程里消失。几份邀请落到同一个晚上，他们开始讨论：哪些时间已经答应给别人，哪些晚上只想留给自己？\n\n多段砂糖需要持续相处；你的建议，也会影响他们彼此的信任。`,
    choices:[choice('帮助写清安排，保留每个人的独处','他们各自写下能做到的时间，也允许拒绝或改期。没有人被固定在“下次再说”的位置。',{rel:{trust:2},otherRel:{trust:2},castRel:feelings({trust:2}),pairEffects:{trust:4,tension:-6},bondChanges:changes({trust:4,tension:-6}),outcome:'npc-bond-calendar'}),choice('建议谁更亲密就应该优先排谁','有人觉得自己必须不断证明重要。排期结束后，几段关系之间却留下了新的压力。',{rel:{trust:-4,tension:5},otherRel:{trust:-4,tension:5},castRel:feelings({trust:-4,tension:5}),pairEffects:{trust:-8,tension:14},bondChanges:changes({trust:-8,tension:14}),outcome:'npc-bond-calendar'})]};
  if(pending.id==='npc-confession')return {npc:a.id,other:b.id,title:`${name}与${other}，不只是朋友`,subtitle:'朋友的砂糖故事 · 两个人也有自己的选择',
    text:route.confession+(shared.length?`\n\n${shared.map(id=>person(id).name).join('、')}与你也有砂糖关系。新的心意需要尊重已经说清的约定，不能替任何人同意。`:'')+'\n\n他们愿意让你听见这次谈话，但是否成为砂糖，由他们自己确认。',
    choices:[choice('认真听完，祝他们把期待讲清楚','你没有替两个人定义关系，听他们把喜欢、独处与既有约定说完。',{outcome:'npc-bond-confirm'}),choice('给他们独处时间，之后再听决定','你把这段谈话留给他们，之后收到两个人一起写来的消息。',{outcome:'npc-bond-confirm'}),choice('提醒他们给慢慢了解留一点时间','他们接受这个提醒，决定先多相处两晚，再谈关系的名字。',{outcome:'npc-bond-wait'})]};
  if(pending.id==='npc-boundaries')return {npc:a.id,other:b.id,title:'新的喜欢，需要怎样的约定',subtitle:`共同边界 · ${name} × ${other} × 你`,
    text:`${name}与${other}没有偷偷确认关系。与你已有砂糖约定的人，先来询问你是否愿意接受彼此知情的开放关系。他们愿意听到不同答案，也不会把“不愿意”说成不够大度。`,
    choices:[choice('愿意接受，明确知情、时间和退出权','你只为自己的关系表达同意。他们也分别确认自己的愿望。新的约定需要所有当事人愿意。',{outcome:'npc-bond-open'}),choice('不愿改变现有约定，坦诚说明','你没有同意开放关系。他们尊重这个答案，暂时保持朋友，没有绕过已有承诺确认砂糖。',{outcome:'npc-bond-decline'})]};
  if(pending.id==='npc-date')return {npc:a.id,other:b.id,title:`${name}与${other}的相处练习`,subtitle:'朋友的砂糖故事 · 确认关系之后',text:route.date,
    choices:[choice('听两人说出各自能做到的安排','两个人给各自的生活留出位置，并把做得到的邀约写清楚。你是听众，承诺由他们共同决定。',{pairEffects:{trust:8,tension:-6},outcome:'npc-bond-date'}),choice('留给他们自己商量，不替谁答应','他们花了一些时间才写好安排。有人想留下更多独处，这个愿望也被认真听见。',{pairEffects:{trust:5,tension:-3},outcome:'npc-bond-date'}),choice('建议既然是砂糖，就应该每天一起上线','这个建议让两个人发现彼此一直没敢讲清的压力。他们不愿靠强迫出席继续维持关系。',{pairEffects:{trust:-20,tension:32},outcome:'npc-bond-date'})]};

  return null;
}
