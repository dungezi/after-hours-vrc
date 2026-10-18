import { PEOPLE, WORLD } from './data.js';
import { npcScene } from './npc-stories.js';
import { courtshipScene } from './courtship-stories.js';
import { DAILY, dailyScene } from './daily-stories.js';
import { CIRCLE_SCENES, circleScene } from './circle-stories.js';
import { initiativeScene } from './initiative-stories.js';
import { PHOTO_STORIES, photoScene } from './photo-stories.js';
import { SEPARATION_IDS, separationScene } from './separation-stories.js';

const person = id => PEOPLE.find(p => p.id === id);
const c = (label, text, effects = {}, rel = {}, extra = {}) => ({ label, text, effects, rel, flags: {}, ...extra });
export const FLEXIBLE = ['rei', 'lin', 'yuki'];

// 群像故事按时间推进，角色可以在任何世界相遇。
export const GROUPS = [
  { id:'group-backstage',day:12,cast:['rei','lin'],title:'留给舞台之外的一盏灯',text:'零点为凛的演出做了新的灯光，凛却希望谢幕之后有人记得把灯调暗。两个人站在空舞台上，聊到各自不想一直扮演的角色：一个不只负责解决报错，一个也不只负责让别人开心。',choices:[c('问两人各自想怎样度过谢幕之后','凛选了一首安静的歌，零点关掉工程面板。两个人第一次把相处的时间留给作品之外的自己。',{social:2},{trust:3},{otherRel:{trust:4}}),c('把演出结束的时间也写进安排','灯光准时变暗，谁都不需要继续证明自己的价值。你们约好了下一次一起闲逛。',{balance:3},{trust:3},{otherRel:{trust:3}}),c('请他们继续准备下一场，休息以后再说','工作排到了相处之前，两个人都没能讲完刚才想说的话。',{}, {tension:5},{otherRel:{trust:-3,tension:5}})] },
  { id:'group-costume',day:14,cast:['lin','yuki'],title:'模型之外，也想被看见',text:'弥生为凛做了一副发光耳机，凛却在试穿后问她要不要一起吃顿虚拟晚饭。弥生以为还要继续修改，凛笑着说：“我想邀请的是你，不是你的工程文件。”两个人都很擅长让作品发光，却还在学着直接邀请喜欢的人。',choices:[c('留出不谈修改的相处时间','工程暂时收起来。凛聊起最近的生活，弥生讲了一件没有做成作品的小事。',{mood:2},{trust:4},{otherRel:{trust:4}}),c('问他们想把下一次邀请写在哪里','邀请被写进两个人共同的留言板，没有附带必须完成的任务。',{social:2},{affection:2},{otherRel:{trust:3}}),c('建议先把耳机改到完美再聚会','修改清单又长了一页。原本的邀请被藏进“等做完以后”，两个人都有一点失落。',{}, {trust:-2,tension:4},{otherRel:{trust:-3,tension:5}})] },
  { id: 'group-welcome', day: 2, cast: ['ash', 'raina'], title: '向导与安静的座位', text: '阿澈想为新人办一个热闹的欢迎会，雨音却把音量调低了。“有没有一种欢迎，不用每个人都自我介绍？”阿澈停了一下，问你们要不要试着一起安排。雨音第一次没有站在活动的边缘。', choices: [c('让阿澈带路，雨音准备安静区域', '阿澈负责迎接，雨音留下一张不用开麦也能坐的长椅。两个人发现，自己的方式可以互相补足。', { social: 2 }, { trust: 3 }, { otherRel: { trust: 4 }, flag: 'quiet-room' }), c('先问新人想怎么加入', '新人选择先旁观。阿澈收起开场稿，雨音递来一张世界照片。欢迎从听取愿望开始。', { mood: 2 }, { trust: 3 }, { otherRel: { trust: 3 } }), c('让雨音也上台说几句', '阿澈注意到雨音握紧了围巾，替 TA 留下“以后再说”的余地。台词继续，气氛却有一点紧。', {}, { tension: 4 }, { otherRel: { trust: -2, tension: 5 } })] },
  { id: 'group-photo', day: 4, cast: ['mika', 'lin'], title: '拍照的人与镜头里的人', text: '小满举起相机，凛却一直躲到画面外。“我今晚没换演出模型。”小满放下相机：“可是我想记住的是你来了。”两个人看着预览图，发现一个在保存夜晚，一个在担心自己不够好看。', choices: [c('先问凛是否愿意入镜', '凛选了一个舒服的距离。小满把照片设为仅你们三人可见，镜头里终于不需要表演。', { craft: 2 }, { trust: 3 }, { otherRel: { trust: 4 } }), c('拍一张没有人物的现场照', '小满在标题写下三个人的名字。凛笑着说，自己还从没被一把空椅子认真记住过。', { mood: 2 }, { affection: 2 }, { otherRel: { trust: 3 } }), c('说凛不要扫兴，大家都在等', '凛站进画面，却在拍完后立即离开。小满删除了准备发布的照片。', {}, { trust: -2 }, { otherRel: { tension: 6 } })] },
  { id: 'group-build', day: 6, cast: ['rei', 'yuki'], title: '两个制作名单，一盏灯', text: '零点想先发布能使用的版本，弥生还在调整每一根羽毛。讨论越来越像互相否定。阿澈在群里问上线时间，两个人却都没有回。你看到他们各自的工程文件里，已经为对方留了一行署名。', choices: [c('把必须修复和以后改进分开', '弥生保留审美，零点负责可用性。灯终于亮了，制作名单没有少任何一个名字。', { craft: 3 }, { trust: 4 }, { otherRel: { trust: 4 }, flag: 'shared-build' }), c('今晚先停下，各自写下需求', '两份清单第二天并排出现。原来他们争执的不是同一个问题。', { balance: 3 }, { trust: 3 }, { otherRel: { tension: -4 } }), c('替他们决定谁的方案更好', '问题暂时结束，落选的人把自己的改动另存成了一份文件。合作还需要一次真正的讨论。', {}, { tension: 4 }, { otherRel: { trust: -3 } })] },
  { id: 'group-message', day: 8, cast: ['raina', 'mika'], title: '晚回的消息与写满的日历', text: '小满担心雨音不回消息是生气了；雨音担心自己的晚回复让大家失望，索性更不敢打开窗口。她们第一次把这件事讲到彼此面前。你坐在旁边，发现两个人都在努力，只是使用了不同的语言。', choices: [c('让两人直接说出各自需要什么', '小满希望约好的事有时间，雨音希望闲聊不必秒回。她们约定：安排单独标记，闲聊可以慢慢读。', { social: 2 }, { trust: 4 }, { otherRel: { trust: 4 }, flag: 'clear-calendar' }), c('一起设置一个不用催回复的留言板', '留言板上第一条是雨音写的晚安，第二条是小满画的小月亮。等待终于有了舒服的形状。', { craft: 2 }, { affection: 2 }, { otherRel: { affection: 2 } }), c('说关系好就应该随时回复', '小满没有因此安心，雨音也重新把窗口关小了。一个标准装不下两个人的生活。', { balance: -3 }, { tension: 5 }, { otherRel: { tension: 5 } })] },
  { id: 'group-return', day: 11, cast: ['ash', 'lin'], title: '没有人负责永远开心', text: '阿澈没准备欢迎词，凛也没有打开音乐。两个人在门口面面相觑，最后同时笑了：“原来你也会累。”他们想办一场不需要主持人的聚会，又有一点担心大家觉得无聊。', choices: [c('留出安静区，让大家自己选择活动', '有人聊天，有人发呆。雨音把第一晚留下的长椅搬了过来，阿澈终于完整喝完一杯可可。', { balance: 3 }, { trust: 4 }, { otherRel: { trust: 4 } }), c('今晚由我开场，但允许随时结束', '你只讲了今天的一件小事，凛接了一句，阿澈也接了一句。没有评分的晚上，意外变得热闹。', { social: 3 }, { affection: 2 }, { otherRel: { affection: 2 } }), c('请他们再撑一晚，大家需要气氛', '欢迎词和音乐回来了，但两个人都很快把状态改成了请勿打扰。', {}, { tension: 5 }, { otherRel: { tension: 5 } })] },
  { id: 'group-credit', day: 14, cast: ['mika', 'yuki'], title: '谁的名字留在照片下面', text: '小满想发布聚会照片，弥生却发现里面有尚未公开的模型。小满已经写好一段很温柔的文字，弥生也不想让她难堪。她们请你帮忙看看，怎样能把感谢与隐私都留下。', choices: [c('询问每位当事人，重新选择照片', '弥生提供一张可以公开的版本，小满把每位参与者的署名确认了一遍。发布稍晚，谁都没有被省略。', { craft: 2 }, { trust: 4 }, { otherRel: { trust: 4 } }), c('保留成私人相册，另写一封感谢', '你们把原图留在三人的收藏夹里。感谢不需要被所有人看到，依然能够到达。', { mood: 3 }, { affection: 2 }, { otherRel: { affection: 2 } }), c('照片好看就发布，之后再解释', '通知弹出时，弥生先看到了转发数量。小满撤下照片，开始逐一解释。', {}, { tension: 6 }, { otherRel: { trust: -5 } })] },
  { id: 'group-timezone', day: 18, cast: ['rei', 'ash'], title: '日出时的接力欢迎', text: '零点上线时，阿澈已经准备下线。新朋友偏偏在这时找不到入口。阿澈又坐回椅子，零点却说：“把欢迎名单给我吧，你今天可以先睡。”你看到他们第一次学着把责任交给别人。', choices: [c('写一份交接便签，让阿澈安心下线', '零点接过向导工作，阿澈留下明晚想去的世界。门没有关，只是换了一个人点灯。', { balance: 4 }, { trust: 4 }, { otherRel: { trust: 4 } }), c('三人一起带路，再约定结束时间', '你们在时间到时真的散场。新人收到下一次邀请，没有人需要靠熬夜证明欢迎。', { social: 2 }, { affection: 2 }, { otherRel: { trust: 3 } }), c('说阿澈最熟悉，还是让 TA 留下', '零点把打好的欢迎词删掉了。阿澈勉强点头，翌日的状态却一直是灰色。', { balance: -4 }, { trust: -3 }, { otherRel: { tension: 5 } })] },
  { id: 'group-finale', day: 22, cast: ['raina', 'yuki'], title: '给散场的人留一道门', text: '旅程快结束了，弥生在出口挂上一盏小灯。雨音担心大家以后各去各的世界，弥生说：“回来不一定要回同一张地图。”雨音想了想，在灯旁边留下一个可以改写目的地的留言框。', choices: [c('留下下一次相遇的邀请，允许改期', '你们没有约定永远在场，只写下想继续一起做的事。目的地会变化，邀请仍然有效。', { balance: 4 }, { trust: 5 }, { otherRel: { trust: 5 } }), c('把每个人做过的事写进留言框', '雨音的椅子，弥生的灯，还有你们一起走错的路。地图不必承载全部记忆，名字已经足够。', { mood: 3 }, { affection: 3 }, { otherRel: { affection: 3 } }), c('承诺以后大家每天都来这里', '留言框里出现一个很大的约定。两个人都没有立刻签名，只希望你先把明天过好。', { balance: -5 }, { tension: 5 }, { otherRel: { tension: 5 } })] },
];

GROUPS.sort((a,b)=>a.day-b.day);
const GROUP_AFTER = {
  'group-return':['group-welcome'], 'group-backstage':['group-build','group-return'],
  'group-credit':['group-photo','group-build'], 'group-costume':['group-return'],
  'group-timezone':['group-build','group-return'], 'group-finale':['group-message','group-build'],
};
for(const g of GROUPS)g.after=GROUP_AFTER[g.id] || [];
export function groupReady(run,g) { return run.day>=g.day && g.after.every(id=>run.storySeen.includes(id)); }
export function groupCast(group) {
  const text=JSON.stringify(group);
  return [...new Set([...group.cast,...PEOPLE.filter(p=>text.includes(p.name)).map(p=>p.id)])];
}
const CONVERSATIONS = {
  raina: [ ['雨停之后还有什么', '雨音忽然问，假如这个世界没有雨声，你还会来吗？她说自己常常把喜欢的地图当成借口，真正想确认的是有没有人愿意陪她去一个陌生地方。', '告诉她，下次可以一起选一个没有雨的世界', '雨音在收藏夹里删掉一个重复的链接，添上一颗小小的星。', '问她自己最想去哪里', '她选了舞池，又有点不好意思：“只是想看看，别人怎么开心。”'], ['没发送的半句话', '雨音把一段没发出去的消息给你看。只有“今天有点……”四个字。她在每一个句号前都担心自己会给别人添麻烦。', '说一半也可以，我会认真听', '消息终于有了下一行。她没有被要求立即讲清整个难过。', '约定一个只代表“想有人在”的表情', '你们选了一朵云。以后不用写完长信，也能有人知道今晚需要陪伴。'] ],
  ash: [ ['向导的收藏夹', '阿澈的收藏夹全是适合新人的地图。他翻到最后一页，才发现自己喜欢的解谜世界已经很久没打开。“我是不是把想去的地方，都排到以后了？”', '今晚去你喜欢的地方，换我跟着你', '阿澈没有准备攻略。走错一个房间时，他第一次笑得像普通游客。', '问他想把哪件事留给别人负责', '迎新名单里多了几位轮值向导。他把自己也排进休息的那一栏。'], ['被记住的不是欢迎词', '一个新人把阿澈说过的话记错了，却记得他当时等自己调好麦克风的五分钟。阿澈听完有些惊讶：“原来不需要每句话都说得完美。”', '告诉他，等待也是欢迎的一部分', '他把那张很长的欢迎稿关掉，留下一个可以随意接话的问候。', '陪他录一段可以随时修改的小提示', '第一版有口误，你们没有重录。那个不那么完美的声音很像他自己。'] ],
  mika: [ ['照片之外的那一分钟', '小满翻到一张合照，说自己几乎记不得拍照前聊了什么。她有点害怕：如果不截图，快乐是不是就没有证据？', '一起说说照片没有拍到的细节', '你们想起一杯没喝完的可可，还有阿澈模仿的夸张招手。夜晚比照片大得多。', '约一个今晚不拍照的十分钟', '小满把相机收进背包。她后来记住了你讲的一件小事，没有需要证明给谁。'], ['日历里留一个空格', '小满把下周排得很满，却给自己留了一晚空白。“以前我觉得没人约，就是被忘记了。现在好像也可以是我想自己待一会儿。”', '祝她把那一晚过成自己的样子', '她在空白里画了一只兔子，不再用问号填满无人邀请的时间。', '问下次能不能交换各自的独处故事', '约定不占据那个空格，只在之后互相讲讲新发现。她点头得很轻松。'] ],
  rei: [ ['凌晨发送的工程文件', '零点发来一个工程，备注是“你上线时再看”。你想到自己的凌晨正好是他的下午。他问，这种错开的合作会不会让你觉得孤单。', '告诉他，留下的改动也是一种回应', '你在灯光文件旁写了一句说明。下一次打开工程，就能看见彼此做过的事。', '商量一个双方都舒服的短暂交集', '日程只重叠二十分钟，却不再需要任何一方熬过整夜。'], ['没有补完的聊天记录', '零点出差归来，担心自己缺席时错过了太多群聊。他问要不要把几百条消息全部补完。阿澈在旁边说，回来的人不用先参加一场考试。', '讲一件最想分享的小事，其他慢慢来', '他听完那件事，开始讲自己的路途。重逢没有变成追赶进度。', '一起看看群里留下的新作品', '弥生的灯和小满的照片成了入口。消息没有读完，关系已经接上了。'] ],
  lin: [ ['演出结束后的声线', '凛关闭音乐后，声音比舞台上低很多。“如果我不那么热闹，你还会想来吗？”电子猫的耳机挂在脖子上，像刚放下的一副盔甲。', '说我也想认识现在这个你', '她没有重新打开音乐。你们讨论晚饭和天气，普通的话题意外很舒服。', '请她选一首只想自己听的歌', '那是一首没有节拍的曲子。她笑着说，原来也可以不负责让所有人跳舞。'], ['名单之外的朋友', '凛收到一个大活动的邀请，却更想和几个老朋友随便逛逛。“机会很难得，但今晚一定要去吗？”她不确定拒绝会不会让别人觉得自己变了。', '陪她把真正想做的事说出来', '她礼貌回绝了活动。你们跳到一张小地图，没有任何人需要准备节目。', '帮她写一句可以改期的回复', '邀请没有变成负担，朋友也没有被拿来和舞台比较。她给你比了一个赞。'] ],
  yuki: [ ['那个没有修好的接缝', '弥生发现模型上又有一处接缝。她准备推迟聚会，却被小满发来的“已经帮你留座位”打断。她问你，作品和朋友是不是只能先选一个。', '先把问题记下，今晚去赴约', '接缝留到明天。小满认真看了她的新配色，没有人先问模型是不是完美。', '给修改设一个能结束的时间', '最后一个计时器响起时，她真的保存并关闭工程。你们赶上了聚会的第一张合照。'], ['不署名也会被看见吗', '弥生想匿名发布一只纸鸟，看看没有熟悉的名字时还有没有人喜欢。零点问她，是想获得反馈，还是想把自己从作品里藏起来。', '告诉她，两种愿望都可以慢慢说', '她把名字留在了工程里，没有急着公开，也没有删掉。那是她今晚能接受的距离。', '邀请她讲讲纸鸟最开始的灵感', '一段关于放学路上路灯的故事，终于比面数和材质更早被听见。'] ],
};
export function conversationCast(npc,index) {
  const text=JSON.stringify(CONVERSATIONS[npc]?.[index] || []);
  return [...new Set([npc,...PEOPLE.filter(p=>text.includes(p.name)).map(p=>p.id)])];
}
export function conversationTitles(npc,index) { const title=CONVERSATIONS[npc][index][0];return [title,'一起赴约 · '+title]; }
const CONFESS = {
  raina: '雨音把围巾的一端放在空椅子上，像是替你留了位置，又怕这个动作被误读。“如果你想说的是喜欢，可以慢慢说。我会认真听，但我可能需要先确定自己能承诺什么。”',
  ash: '阿澈没有用玩笑岔开话题。他关掉迎新提示，坐下来：“我想认真听你说，也希望你知道，我对亲密和恋爱的理解可能和你不一样。”',
  mika: '小满把相册的标题栏留空。“这一次，我不想让别人替我们写关系的名字。你是想把这一晚留下，还是想一起继续后面的故事？”她等你把话说完整。',
  rei: '零点看了一眼两个时区的时钟。“喜欢可以跨过距离，生活却不能一直迁就同一张日程表。”他没有关闭聊天，反而把今晚剩余的时间认真留给你。',
  lin: '凛摘下耳机，确认没有人把这段对话当成演出。“我也许会喜欢你，但我还会喜欢跳舞、朋友和独处。你想靠近的是完整的我，还是一个只围着你转的人？”',
  yuki: '弥生保存了工程，第一次没有用“还有一个报错”拖延谈话。“如果你说的是喜欢，我希望你看见的不只有这副模型，也有不知道该怎么回应的我。”',
};

export const SCENE_IDS = ['initiative','courtship','npc-prelude','introduction','conversation','date','solo','confession','reply','boundary','breakup','together','npc-confession','npc-boundaries','npc-network','npc-calendar','npc-date','npc-breakup','npc-departure','multi-open','multi-discovery','multi-time','multi-photo', ...GROUPS.map(g => g.id), ...DAILY.map(s=>s.id), ...CIRCLE_SCENES.map(s=>s.id), ...PHOTO_STORIES.map(s=>s.id), ...SEPARATION_IDS];
export function sceneFor(run, pending) {
  if(pending.id.startsWith('circle-'))return circleScene(run,pending);
  if(SEPARATION_IDS.includes(pending.id))return separationScene(run,pending);
  if(pending.id.startsWith('photo-'))return photoScene(run,pending);
  if(pending.id==='initiative')return initiativeScene(run,pending);
  if(pending.id.startsWith('daily-'))return dailyScene(run,pending);
  if(['courtship','npc-prelude'].includes(pending.id))return courtshipScene(run,pending);
  if(pending.id.startsWith('npc-') || pending.id==='together')return npcScene(run,pending);
  const p = person(pending.npc), name = p?.name || '', world = WORLD.find(w => w.id === run.world).name;
  const other = person(pending.other), partner = other?.name || '';
  if (pending.id === 'introduction') {
    const arrivals = {
      raina: ['雨声里留给你的座位', '初次登录时，你还在摸索怎么开麦。雨音把围巾挪到一边，为你留出一个座位：“不用急着说话，先听一会儿雨也可以。”你看到好友请求亮起来，第一次觉得这个世界有了可以回来的地方。', '坐下来，向雨音介绍自己', '雨音认真记住了你的名字。你们约好，以后也可以一起去别的世界。'],
      ash: ['第一条欢迎消息', '一条好友消息弹出来：“我是阿澈，欢迎来夜航。如果入口不好找，我可以陪你走一遍。”他没有催你跟上热闹的人群，而是先问你今晚想怎样开始。雨音在旁边说：“也给新朋友留点慢慢认识的时间吧。”', '向阿澈打招呼，问问他的收藏夹', '阿澈分享了几张适合慢慢逛的地图。“随时可以找我，也不用每晚报到。”两位新朋友的名字留在了你的列表里。'],
      mika: ['镜头放下之后的名字', `你在${world}遇见一个拿着相机的兔耳女孩。小满先把镜头放下：“我想拍这里的光，也想认识你。可以先聊聊吗？”她把相册翻到一页空白，没有急着替你安排站位。`, '先介绍自己，再问她最喜欢哪张照片', '小满讲起照片背后的一个小故事。你们交换了好友请求，相识从对话开始。'],
      rei: ['来自另一个时区的问候', `在${world}，零点正在调试一盏灯。他注意到你停在旁边，把操作面板收起来：“第一次来？我叫零点，可能和你在不同的时区。”你们先交换名字，再比较窗外的天色。`, '告诉他自己的名字和今晚的天气', '两边的天气不一样，但好友列表里多了同一个亮着的名字。零点说，有消息可以等上线再回。'],
      lin: ['音乐之外的自我介绍', `凛在${world}摘下耳机，见你犹豫便招了招手：“我叫凛。想跳舞也好，坐一会儿也好。”她没有用主持人的声线继续说话，只问你喜欢什么样的音乐。`, '介绍自己，分享一首喜欢的歌', '凛把歌名记进收藏夹。你们成为朋友，下一次相遇不必等到演出开始。'],
      yuki: ['纸鸟落下的地方', `在${world}，一只还没调好动作的纸鸟落到你面前。弥生赶来捡起它，有点不好意思：“这是我的新作品，我叫弥生。”你看到她藏起工程窗口，又忍不住想讲讲纸鸟最初的灵感。`, '介绍自己，请她讲讲这只纸鸟', '弥生慢慢放松下来。交换好友请求时，她说以后可以给你看看纸鸟学会飞的样子。'],
    };
    const beat = arrivals[p.id];
    return { npc:p.id, title:beat[0], subtitle:`初次相遇 · ${name}`, text:beat[1], choices:[c(beat[2],beat[3]),c('用表情打个招呼，先慢慢熟悉', `${name}回应了你的招手，也记住了你的名字。你们成为朋友，可以在以后继续认识彼此。`)] };
  }
  const group = GROUPS.find(g => g.id === pending.id);
  if (group) {
    const echoes = {
      'group-return': run.storyFlags['quiet-room'] ? '\n\n你们之前为新人留下的安静区域，这次成了主持人也能休息的地方。阿澈说：“原来当时那个决定，也会照顾到今天的我。”' : '',
      'group-credit': run.storyFlags['shared-build'] ? '\n\n照片里恰好出现零点和弥生共同发布的第一盏灯。小满认出了制作名单，想把背后的合作故事一并写进去。' : '',
      'group-timezone': run.storyFlags['clear-calendar'] ? '\n\n雨音和小满之前约定的“安排单独标记、闲聊慢慢回复”，已经成了朋友群的习惯。这次交接也能沿用那份约定。' : '',
      'group-finale': run.storyFlags['shared-build'] ? '\n\n弥生说起你们曾经为合作划出的修改清单。她如今愿意留下未完成的部分，等下一段故事继续。' : '',
    };
    return { ...group, text:group.text+(echoes[group.id]||''), npc: group.cast[0], other: group.cast[1], subtitle: `群像故事 · ${group.cast.map(id => person(id).name).join(' × ')} · ${world}` };
  }
  if (pending.id === 'conversation' || pending.id === 'date') {
    const beat = CONVERSATIONS[p.id][pending.index || 0], dating = pending.id === 'date';
    return { npc: p.id, title: beat[0], subtitle: `${dating?'两个人的相处':'今晚的对话'} · ${name} · ${world}`, text: `${dating?`你们在${world}找了一处可以好好说话的地方。\n\n`:''}${beat[1]}`, choices: [c(beat[2], beat[3], { mood: 2 }, { trust: 4, affection: dating?4:2, tension: -2 }), c(beat[4], beat[5], { social: 1 }, { trust: 3, affection: dating?3:1 }), c('坦诚说今天有点累，约定下次继续', `${name}把没讲完的话留到下一次。“谢谢你没有勉强自己一直回应。”你们认真说了晚安。`, { balance: 4, energy: 4 }, { trust: 2, tension: -2 })] };
  }
  if (pending.id === 'solo') return { title: '没有任务标记的路', subtitle: `世界片段 · ${world}`, text: `你在${world}绕过平时会停留的地方。远处有一盏没有指向任何任务的灯，也有人在留言板写下“今天想被温柔对待”。没有新的好友请求，但这个世界依然留下了一点别人的生活。你想怎样度过剩下的时间？`, choices: [c('沿着灯光慢慢走一段', '你看到了从未注意过的角落。没有完成提示，风景本身已经足够。', { mood: 2 }), c('留下一个不要求回复的问候', '“希望你今天好一点。”明天谁会读到，不必现在知道。', { social: 1, balance: 2 }), c('把想法记下，给现实留一点时间', '你写下一个新的创作点子，再把窗口关小。今晚的故事还有耳机外的部分。', { craft: 1, balance: 4 })] };
  if (pending.id === 'confession') {
    const partners = PEOPLE.filter(x => x.id !== p.id && run.relationships[x.id].status === 'sugar');
    const npcPartners=Object.entries(run.npcBonds).filter(([key,b])=>b.status==='sugar' && key.split(':').includes(p.id)).map(([key])=>person(key.split(':').find(id=>id!==p.id)).name);
    return { npc: p.id, title: `想把心意说给${name}`, subtitle: '表达心意 · 关系尚未自动成立', text: `${CONFESS[p.id]}${npcPartners.length?`\n\n${name}也与${npcPartners.join('、')}有砂糖关系。${FLEXIBLE.includes(p.id)?'如果希望进一步靠近，需要先聊清彼此知情的开放关系约定。':'TA 希望保持已有的排他约定，不会因为新的告白绕过那段关系。'}`:''}${partners.length?`\n\n你已经与${partners.map(x=>x.name).join('、')}建立砂糖关系。这次告白还涉及别人是否知情、是否愿意接受新的相处安排。`:''}`, choices: [c(partners.length?'说出喜欢，也如实说明已有关系':'说出喜欢，认真讨论彼此能承诺的范围', '你的心意被完整地听见，接下来由对方决定怎样回应。', {}, { trust: 2 }, { outcome: 'confess-honest' }), c(partners.length?'只说喜欢，暂时隐瞒已有关系':'请求立即答应，承诺以后一直陪伴', '对话里留下了一个没有被说清的问题。答案不会只由承诺的大小决定。', { balance: -3 }, { tension: 6 }, { outcome: 'confess-secret' }), c('先把喜欢留在这里，暂不提出关系请求', '你没有撤回心意，也没有把它变成必须现在回答的问题。你们约好继续了解彼此。', { mood: 1 }, { trust: 2 }, { outcome: 'confess-cancel' })] };
  }
  if (pending.id === 'reply') {
    const r = run.relationships[p.id], accepted = pending.answer === 'accepted';
    const lines = { raina: '雨音主动发来一朵云：“那天的话，我没有忘。我想给你一个认真留下的位置，也保留我们各自安静的时间。”', mika: '小满把相册的空标题填好：“我愿意继续这个故事。约定可以慢慢写，但这一次我的答案是清楚的。”', rei: '零点发来更新过的日程：“不用谁搬走自己的生活。我愿意把能相遇的部分，认真与你一起过。”', lin: '凛没有播放音乐：“我愿意靠近你，也希望我们都保留舞台之外的朋友。这个愿望，你还记得吗？”', yuki: '弥生发来的不是模型截图，而是一句直接的话：“我愿意。你不用等我变得完美，才来认识我。”', ash: '阿澈认真把话说完：“我在乎你，也愿意继续一起走，但我希望我们的名字是朋友。这个答案不是请你再努力一点。”' };
    return { npc: p.id, title: accepted?`${name}愿意回应你的心意`:pending.answer==='rejected'?`${name}选择了朋友关系`:`${name}还想再了解一些`, subtitle: '心意的回应 · 请认真读完', text: `${accepted?lines[p.id]:pending.answer==='rejected'?(p.id==='ash'?lines.ash:`${name}坦诚地说，自己暂时不想建立这段关系。“你可以难过，也可以选择保持一点距离。请不要把我的答案当成一道需要攻克的题。”`):`${name}记得你的告白，但仍想确认相处期待与生活安排。TA 没有给一个固定的等待天数，而是希望通过之后的谈话、共同经历和边界沟通慢慢作答。`}${accepted&&!r.intent?.disclosed?'\n\n已有关系尚未被告知。这个缺口会在之后的共同经历中出现。':''}`, choices: [c(accepted?'我也愿意，确认我们现在的关系':pending.answer==='rejected'?'尊重答案，允许彼此保持合适的距离':'接受等待，继续了解彼此', accepted?'你们共同确认砂糖关系。名字是新的，生活与边界仍然需要一起照顾。':'心意有了明确的回应，不必靠刷新好友列表猜测。', accepted?{ mood: 4 }:{ balance: 2 }, accepted?{ trust: 4, affection: 5, tension: -3 }:{ trust: 2, tension: -2 }, { outcome: `reply-${pending.answer}` }), c(accepted?'坦诚说还需要考虑，先保持朋友':'先退一步，把今晚留给自己', '你没有勉强自己，也没有替对方决定。关系暂停在双方都能接受的位置。', { balance: 4 }, { tension: -3 }, { outcome: 'reply-withdraw' })] };
  }
  if (pending.id === 'boundary') return { npc:p.id, title:'把期待放在桌面上', subtitle:`关系对话 · ${name}`, text:`${name}问起上线时间、独处需求和关系是否需要排他。“知道你喜欢我很重要，知道你能承诺什么也很重要。”你们决定把模糊的期待讲得具体一些。`, choices:[c('说清现实安排，也询问对方的独处需要','你们写下能做到的相处方式，允许忙碌时提前留言。',{balance:3},{trust:4,tension:-8},{flag:'clear-boundaries'}),c('讨论是否接受彼此有其他亲密关系',FLEXIBLE.includes(p.id)?`${name}愿意讨论知情的开放关系，但不接受隐瞒和单方面安排。`:`${name}希望自己的砂糖关系是排他的。你听见了这个愿望，没有把不同期待说成对错。`,{}, {trust:3,tension:-4},{outcome:'discuss-open'}),c('先答应所有要求，以后再说','你们暂时结束讨论，却留下了兑现承诺的压力。',{balance:-4},{affection:2,tension:7})] };
  if (pending.id.startsWith('multi-')) {
    const bothFlexible = FLEXIBLE.includes(p.id) && FLEXIBLE.includes(other?.id);
    const discovery = pending.id === 'multi-discovery', scheduling = pending.id === 'multi-time', photo = pending.id === 'multi-photo';
    const text = discovery?`小满分享的一张照片让${partner}发现，你与${name}也称作砂糖。${name}第一次听到已有关系的完整情况。两个人都没有立即问你“选谁”，双方先问：“为什么我们不是从你口中知道的？”`:scheduling?`${name}和${partner}同时发来邀请。先前说清的开放关系，并没有让时间变成两份。你看到两个人开始互相猜测，自己是不是总被安排到“改天”。`:photo?`拍合照时，${partner}问要不要写关系的名字，${name}却希望先保持私密。双方看向彼此，发现接受多段关系，也不等于对公开范围有同一个答案。`:`${name}和${partner}第一次坐下来聊到你。两个人不只是在等你的安排，双方也有自己的愿望。${bothFlexible?'双方愿意讨论彼此知情的开放关系，但希望拥有明确的知情权、独处时间和退出权。':`${FLEXIBLE.includes(p.id)?partner:name}坦诚表示自己期待排他的砂糖关系；这不是一句“大家都别介意”就能解决的差异。`}`;
    return { npc:p.id,other:other.id,title:discovery?'没有说出的另一段关系':scheduling?'一个晚上，几份邀请':photo?'合照的标题由谁决定':'不止两个人的约定',subtitle:`关系交织 · ${name} × ${partner}`,text,choices:[c(scheduling?'把时间讲清楚，不用空泛的“改天”':photo?'分别确认公开范围，允许不出镜':'让每个人说清期待，接受各自的选择',bothFlexible?'你们分别确认知情、非排他与退出权。没有人被要求证明大度，约定从现在开始需要兑现。':`${FLEXIBLE.includes(p.id)?partner:name}希望重新考虑砂糖约定。你听见这个愿望，后续会先展开关系谈话，不在这一个选项里直接宣布分开。`,{balance:3},{trust:4,tension:-8},{otherRel:{trust:4,tension:-8},outcome:'multi-consent'}),c('回避讨论，说喜欢就不必计较','谁都没有得到自己想知道的安排。双方开始直接互相联系，信任留下新的裂口。',{balance:-5},{trust:-6,tension:14},{otherRel:{trust:-6,tension:14},outcome:'multi-dodge'}),c(`先讨论与${name}的新关系是否继续`,'你承认现在无法承担这些承诺，提出重新考虑新关系；先经历关系变化的前置谈话，再听当事人的完整回应。',{balance:3},{trust:1,tension:-8},{otherRel:{trust:3,tension:-5},outcome:'multi-withdraw'})] };
  }
  return null;
}
