import { PEOPLE } from './data.js';
import { departureContactReason } from './separation-stories.js';
import { freshPlan, advancePlan, validPlan } from './life-changes.js';

const p=id=>PEOPLE.find(x=>x.id===id);
const OFFSETS=[3,10,19];
export const LIFE_PLANS={
 raina:{friend:'rei',goals:['给陌生人的世界札记','只画给自己的路线图'],voice:'雨音把开头改了两次，最后留下一个小小的“其实”。',paths:[[
  ['第一篇不是约会攻略','雨音自己挑了一张陌生地图，决定写一篇给第一次来的人看的札记。{friend}帮她读了一遍开头，问为什么只写怎么进来、不写她最喜欢哪里。她想了很久，补上了一小段自己的偏心。'],
  ['札记收到一条不同意见','雨音的札记收到一条“不觉得这里安静”的反馈。她没立刻撤回，而是重新走了一次，发现不同入口确实有不同声音。{friend}说可以保留自己的感受，也把别人的路线写清楚。她正在认真改这一段。'],
  ['后来的人沿着她的字走过','雨音完成了这一阶段的札记。一位访客照说明找到入口，却喜欢上了她没推荐的角落。她先有点惊讶，随后把那条发现也补进了末尾。文字没有让每个人喜欢同一个地方，却真的帮人走了进来。'],
 ],[
  ['地图不需要先写给谁','雨音收藏了几条走到一半就想拐弯的路，准备画一本私人路线图。{friend}问能不能帮她校对，她说先不用，这次想先知道自己会把哪些地方画得最大。'],
  ['被她画得太大的长椅','路线图上，一张长椅比整片花圃还大。雨音起初想改成正确比例，后来承认她在那里想清过一件小事。{friend}说这张图不负责导航，她也终于没把那把椅子缩回去。'],
  ['路线图有了自己的封面','雨音给私人路线图画好了封面，仍然只愿意挑几页分享。她没有因为没公开整本就把它叫作没完成，反而开始想下一本要画怎样的天气。'],
 ]]},
 ash:{friend:'lin',goals:['自己的半程解谜攻略','轮流带路的小队'],voice:'阿澈发来一张认真得过头的表格，第二行就写着“允许走错”。',paths:[[
  ['向导给自己报了名','阿澈报名了一场解谜挑战，在“是否担任引导员”后面选了否。{friend}陪他确认规则，他第一次只为自己准备一张记录错误答案的纸，没有写欢迎词。'],
  ['第七种错误答案','阿澈卡在一道灯光机关前，列出了七种错误答案。{friend}只找到第八种，也没有顺手替他通关。他准备把这些失败整理成一份可选择查看的提示，不把答案直接塞给第一次来的人。'],
  ['没有通关标章的攻略','阿澈完成了一份半程攻略，最后一关仍然空着。他把能确认的路径与不知道的部分分开，留下一句以后可以接着试。它没有替他赢下整张地图，却是他为自己真正做完的一件事。'],
 ],[
  ['游客小队开始招人','阿澈约了一个不用准备攻略的小队，和{friend}商量轮流带路。第一次出发前，他忍不住想先试完所有机关，又在收藏夹前停住了：那样大家就只剩跟着他走。'],
  ['别人带路时他在做什么','轮到{friend}带路，阿澈三次想指出另一条路，最后把话改成了一个问题。小队走得比原来慢，也第一次有人记得问他自己想往哪里走。'],
  ['没有固定队长的一次集合','小队完成了三次短探索，阿澈把固定队长那一栏删掉。有一晚他没来，其他人照样找到了集合点。再回来时，他收到的是有人想给他看的发现。'],
 ]]},
 mika:{friend:'yuki',goals:['没有截图的声音手记','可以借阅的纪念卡'],voice:'小满先发来一个很大的感叹号，随后又补了三行具体说明。',paths:[[
  ['只有文字的相册第一页','小满想记录一次笑声，却发现自己根本没有拍照。{friend}建议别急着找一张图代替，她便先写下了当时讲错的那句话，第一次让纯文字占满一页。'],
  ['两个人记得的先后顺序','小满请当事人读手记，发现两个人记得的顺序不同。{friend}帮她把两个视角并排，谁都没有被要求提供能证明自己记忆正确的截图。她正在学着记录差异。'],
  ['笑声手记留住了停顿','小满整理完这一阶段的手记，最后一页没有凑满。她喜欢其中一处没能复述的停顿，也允许有些当事人只看自己的那一段。记录比她起初设想的短，却真的写完了。'],
 ],[
  ['想送出去又舍不得的卡片','小满做了几张小小的纪念卡，想让朋友借回去写一件自己的事。{friend}提醒她，借回来之后的笔迹可能不再整齐。她犹豫了一会儿，还是留出了能改写的空白。'],
  ['借回来的第一张卡','第一张卡回来了，边角有一处涂改，写的也不是小满原本想纪念的那晚。{friend}问她要不要另做整齐版。她说先不重画，想先听卡片为什么去了那个地方。'],
  ['不全属于她的纪念册','小满收回了几张卡，也接受有两张暂时还在别人手里。她把册子做成能拆开的页签，不再要求每张都按时回来才算完整。新的笔迹里也留下了她没在场的夜晚。'],
 ]]},
 rei:{friend:'yuki',goals:['低负担的日出观测台','可异步接续的工程样例'],voice:'零点把改动说明写得很短，最后总会留一行“回来再看”。',paths:[[
  ['他给日出留的那块空地','零点独自开始做一块小观测台，希望低配置设备也能看到天色变化。{friend}帮忙试了最基础的材质，他则先删掉几项看起来漂亮却不必要的效果。'],
  ['暗处比想象中更难看清','观测台能运行以后，零点发现日出之前几乎看不清台阶。他和{friend}试了几种不刺眼的标记，决定先把能安全走动的版本做完，再考虑更多装饰。'],
  ['日出前也能找到出口','零点完成了这一版小观测台。不同设备看到的细节仍不一样，但入口、出口与天色变化都能被辨认。他把尚未完成的装饰写进计划，没有继续占用原本留给早餐的时间。'],
 ],[
  ['错开上线也能继续的样例','零点想做一份别人离线时也能接手的工程样例。{friend}拿到第一版，发现说明里有三处“这个”和“那里”都指不清楚。他承认自己省略了太多只有本人知道的事。'],
  ['一封留言修掉的一处报错','样例按新说明交给另一位测试者，对方真的独自修好了一处报错。零点与{friend}发现，比起多写十行说明，清楚标出哪一步可以停下更有用。'],
  ['不用等他在线的那份文件','零点完成了样例和几条短说明。文件没有把别人变成随时待命的助手，也不再要求先认识作者才能理解。他保存好这一版，准备回去试一个还没决定是否分享的新想法。'],
 ]]},
 lin:{friend:'mika',goals:['一首没有热闹副歌的曲子','桌面也能加入的短舞'],voice:'凛先发了一句“这回有点怪”，下一条就是迫不及待的试听说明。',paths:[[
  ['副歌之前她先关掉鼓点','凛开始试一首很安静的曲子，把最容易让人跟着跳的鼓点关掉了。{friend}第一次听没找到高潮，她也承认这回更想知道自己到底喜欢哪一秒。'],
  ['听众先夸了她不在意的地方','试放之后，大家先夸过场笑话，很少提凛反复改过的停顿。{friend}没有替她把反应解释成成功或失败，而是陪她逐条听哪些意见真的指向了声音。'],
  ['她终于愿意留下这一版','凛完成了这一版曲子，不是每个人都喜欢。她把最在意的停顿留了下来，也记了下一次想改哪里。谢幕以后她没有马上放另一首更热闹的歌，今晚的实验到这里已经足够。'],
 ],[
  ['动作表上只剩三个按钮','凛想试一段桌面玩家也能加入的短舞，和{friend}把动作拆成转向、举手与蹲下。第一轮预览像几个人认真找出口，她却笑着说至少现在谁都能决定一个拍点。'],
  ['第三个拍点由别人决定','短舞测试时，凛自己的动作太复杂，反而跟不上大家。{friend}把一段节奏交给另一位参与者，她试着跟随，第一次觉得编舞也可以留一段自己不负责决定的地方。'],
  ['不整齐的那一段被留下','短舞完成了一轮小范围试演。有人有全追，有人只有桌面，动作并不整齐，却都真实参与了一个段落。凛把不同设备的入口都写进说明，没有按装备价格排列出场。'],
 ]]},
 yuki:{friend:'rei',goals:['一只真的能停稳的纸鸟','一段带笨帽子的番外'],voice:'弥生说“只改了一点”，后面却附了五处很想让人看见的细节。',paths:[[
  ['先让纸鸟落到地面','弥生给纸鸟画了很高的目的地，真正开始时却先做了低处的落点。{friend}替她试慢放，发现最初失败的原因不是翅膀不够漂亮，而是落地那一帧没留够时间。'],
  ['停得住就暂时飞不远','稳定版能落地了，却飞不到最初那盏高灯。弥生与{friend}各留一份实验，最后决定先完成一个确实能用的版本，远处的愿望没有因此被删掉。'],
  ['纸鸟落地时有一点笨','纸鸟终于能完成一段飞行和停落。弥生保留了一点不够优雅的摇晃，说这是她现在愿意留下的动作。她保存完成版，也给下一次尝试留了一份没有被覆盖的工程。'],
 ],[
  ['一顶并不符合设定的帽子','弥生给纸鸟试了顶很笨的帽子，和原来的故事完全不搭。{friend}觉得好笑，她本来想删掉，后来决定另开一个不必承担原作全部期待的小番外。'],
  ['帽子先于纸鸟飞走了','番外里帽子先飞出去，纸鸟反而落在原地。弥生想修正，{friend}却问她要不要试着把这次错误写进故事。她留了一版故障，也继续做自己的正式动作。'],
  ['番外有了真正的最后一帧','弥生给小番外做完了最后一帧：纸鸟没变完美，帽子也没有被修成严肃设定。她第一次按时完成了一件不负责证明自己技术多好的小作品。'],
 ]]},
};

export const REDUCED={
 raina:['札记最终只留下一个入口的试读页，其余路线暂未写完。雨音把覆盖范围标清，不再称它为整张世界的指南。','私人路线图只完成了那张长椅附近的一页。雨音把它单独装订，封面仍然留白，下一本也暂时不开始。'],
 ash:['阿澈只确认了前两个机关，把其余提示标成待验证。这份短攻略可以使用，也没有声称自己完成了原定的半程。','小队只凑成了一次短探索，未能完成三次集合。阿澈保留轮流带路的规则，也接受暂时没有下一场。'],
 mika:['手记只收进两段获得当事人许可的文字，整册的计划暂停。小满没有拿没得到回应的那段记忆来凑页数。','纪念卡先做成一张可拆的样卡，没有收回整套。小满把未完成的设计存好，不催还在别人手里的纸。'],
 rei:['零点只完成了入口与台阶的低负担测试，日出效果暂未发布。这一版是测试台，不能冒充已经做好的观测世界。','样例先公开了一段经过验证的安装说明，异步接手工程尚未完成。零点清楚标明可使用与还不能保证的范围。'],
 lin:['凛只保存了一段停顿的试听，完整曲子还没写完。她决定先关掉工程，而不是临时拼一个副歌来换取掌声。','短舞只试完一个桌面拍点，没有办成原定的整轮试演。凛与参与者确认可以保留这段，其他动作以后再说。'],
 yuki:['纸鸟只完成一次低处落地，还不能走完原定的飞行。弥生把它标成动作练习，未完成的高处目的地仍在草图上。','番外只做到帽子飞走的短循环，还没有最后一帧。弥生保存了这段预览，坦率说这次先停在这里。'],
};
export const LIFE_SCENES=PEOPLE.flatMap(p=>[0,1,2].map(index=>({id:`life-${p.id}-${index}`,npc:p.id,index})));
export function freshLives(day=1,seed=0) {
  return Object.fromEntries(PEOPLE.map((p,i)=>[p.id,{anchor:day,path:(seed+i)%2,milestones:[],read:0,readDay:0,heard:[],plan:freshPlan(day,seed,i)}]));
}
export function advanceLives(run) {
  const updates=[];
  for(const p of PEOPLE){const life=run.lives[p.id],index=life.milestones.length,update=advancePlan(run,p.id,life,LIFE_PLANS[p.id].friend);if(update&&run.relationships[p.id].introduced&&!departureContactReason(run,p.id))updates.push({npc:p.id,...update,title:update.title||LIFE_PLANS[p.id].paths[life.path][index][0]});}
  return updates;
}
export function lifeReady(run,s) {
  const life=s&&run.lives?.[s.npc];
  return !!life && run.relationships[s.npc]?.introduced && !departureContactReason(run,s.npc) && !run.storySeen.includes(s.id) && life.read===s.index && life.milestones.length>s.index && (!s.index || run.day>=life.readDay+2);
}
export function lifeMessages(run) {return LIFE_SCENES.filter(s=>lifeReady(run,s)).map(s=>({type:'scene',id:s.id,npc:s.npc,optional:true}));}
export function lifeScene(run,q) {
  const s=LIFE_SCENES.find(s=>s.id===q.id);if(!s)return null;
  const life=run.lives[s.npc],milestone=life.milestones[s.index];if(!milestone)return null;
  const plan=LIFE_PLANS[s.npc],other=run.relationships[plan.friend]?.introduced && !departureContactReason(run,plan.friend)?plan.friend:null;
  let [title,text]=plan.paths[milestone.path][s.index];const name=p(s.npc).name;
  if(milestone.outcome==='reduced'){title+=' · 缩小范围的这一版';text=REDUCED[s.npc][milestone.path];}
  const current=life.milestones.length===s.index+1 && s.index<2 && life.plan.state==='working';
  const previous=life.milestones[s.index-1],transition=previous&&previous.path!==milestone.path?`前一阶段的尝试被保留成阶段稿。后来${name}把接下来的时间转向了「${plan.goals[milestone.path]}」，这次讲的是改方向后的新进展。\n\n`:'';
  const scene={id:s.id,npc:s.npc,...(other?{other}:{}),title,subtitle:`${name}自己的计划 · ${s.index+1} / 3`,text:`第 ${milestone.day} 夜，${name}的计划走到了这里。这段进展没有等待你的行动。\n\n${plan.voice}\n\n${transition}${text.replaceAll('{friend}',other?p(other).name:'一位朋友')}${current?'\n\n对方接下来还有两种方向，愿意听你的建议；是否改变仍由对方自己决定。':'\n\n这部分已经发生，你的回应不会改写过去。'}`,choices:[
    {label:current?'建议把一个小目标做扎实，分享自己会的方法':'具体问问最难的一步是怎样做完的',text:current?`${name}听完建议，决定下一阶段先保留一个明确的小目标。你分享了方法，却没有代替对方做完整件事。`:`${name}讲了一个之前没提过的细节。完成的计划有了被认真听见的去处。`,effects:{craft:1,mood:-1},rel:{trust:2},outcome:'life-read',lifePath:current?0:null},
    {label:current?'建议另试一条合作路线，先问朋友是否有空':'问问合作的人各自留下了什么',text:current?`${name}决定试试另一条合作方向，先发出可以拒绝的询问。原来的尝试仍留着，并没有被说成失败。`:`${name}说起伙伴确实做过的一件事，也讲了自己的选择。你没有把一次合作自动解释成砂糖。`,effects:{social:1,balance:-1},rel:{trust:2},...(other?{otherRel:{trust:1},npcLinkDelta:2,pairEffects:{trust:1,tension:-1}}:{}),outcome:'life-read',lifePath:current?1:null},
    {label:'今晚只听近况，不替对方安排下一步',text:`你认真听完，${name}仍按自己的方向继续。参与一段生活不一定要负责修改它。`,effects:{mood:1},rel:{trust:1},outcome:'life-read',lifePath:null},
  ]};
  if(current)for(const c of scene.choices)if(c.lifePath!==null && c.lifePath!==life.path && run.relationships[s.npc].trust<({raina:25,ash:30,mika:25,rei:40,lin:35,yuki:30}[s.npc])){c.lifePath=null;c.text=`${name}认真听了，但现在更想继续「${plan.goals[life.path]}」。你的建议被记下，没有直接替对方改变计划。`;}
  return scene;
}
export function validLives(run) {
  if(!run.lives || Object.keys(run.lives).length!==PEOPLE.length)return false;
  return PEOPLE.every(p=>{const l=run.lives[p.id];return l&&validPlan(l,run.day)&&Number.isInteger(l.anchor)&&l.anchor>=1&&l.anchor<=run.day&&[0,1].includes(l.path)&&Array.isArray(l.milestones)&&l.milestones.length<=3&&l.milestones.every((m,i)=>m&&Number.isInteger(m.day)&&m.day>=l.anchor+OFFSETS[i]&&m.day<=run.day&&(!i||m.day>l.milestones[i-1].day)&&[0,1].includes(m.path)&&(m.outcome===undefined||i===2&&["completed","reduced"].includes(m.outcome)))&&Number.isInteger(l.read)&&l.read>=0&&l.read<=l.milestones.length&&Array.isArray(l.heard)&&l.heard.length===l.read&&l.heard.every((d,i)=>Number.isInteger(d)&&d>=l.milestones[i].day&&d<=run.day&&(!i||d>=l.heard[i-1]+2))&&Number.isInteger(l.readDay)&&l.readDay===(l.heard.at(-1)||0)&&[0,1,2].every(i=>run.storySeen.includes(`life-${p.id}-${i}`)===(l.read>i));});
}
