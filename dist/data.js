export const WORLD = [
  { id: 'rain', name: '雨落候车室', en: 'RAINY PLATFORM', tag: '安静 / 陪伴', icon: 'rain', color: '#8fa9f5', desc: '末班车还没来。有人在雨声里，为你留了一个座位。', cost: 8, mood: 3, social: 1, craft: 1, npcs: ['raina'], details: '适合慢慢说话的 Friends+ 世界。雨声、镜子、没有目的的等待。' },
  { id: 'cafe', name: '凌晨两点的咖啡', en: '2AM COFFEE CLUB', tag: '社交 / 初次相遇', icon: 'coffee', color: '#e9b78d', desc: '不用先想好开场白。一杯虚拟热可可，也能让气氛暖起来。', cost: 9, mood: 3, social: 2, craft: 0, npcs: ['ash', 'mika'], details: '公开咖啡厅。新朋友最多，也最容易遇见热心向导。' },
  { id: 'orbit', name: '低轨道天文台', en: 'LOW ORBIT', tag: '探索 / 摄影', icon: 'orbit', color: '#80d8c1', desc: '星星没有碰撞体，但一起仰头的那一刻很真实。', cost: 10, mood: 4, social: 1, craft: 2, npcs: ['rei'], details: '漂浮在星球上方的观景平台。拍照能为改模和世界制作积累灵感。' },
  { id: 'club', name: '霓虹地下室', en: 'NEON BASEMENT', tag: '舞蹈 / 音乐', icon: 'music', color: '#d992ef', desc: '即使只有桌面模式，也能在人群里找到自己的节拍。', cost: 13, mood: 4, social: 2, craft: 1, npcs: ['lin'], details: '舞池、DJ 台与深夜演出。全身追踪设备会带来额外社交收益。' },
  { id: 'garden', name: '纸月花园', en: 'PAPER MOON', tag: '砂糖 / 约会', icon: 'flower', color: '#edafc6', desc: '关系不用立刻有名字。先问一句：我可以坐近一点吗？', cost: 8, mood: 3, social: 1, craft: 1, npcs: ['raina', 'mika'], details: '安静的私人花园。提前约定的独处，可以成为一段关系的起点。' },
  { id: 'studio', name: '多边形工作室', en: 'POLYGON STUDIO', tag: '改模 / 创作', icon: 'cube', color: '#b8b0f9', desc: '报错、穿模、重新上传。总有一个人愿意陪你等进度条。', cost: 11, mood: 2, social: 1, craft: 3, npcs: ['yuki', 'rei'], details: '创作者的小据点。在这里认识朋友，或为下一次作品发布积累技术。' },
];

export const PEOPLE = [
  { id: 'raina', name: '雨音', handle: 'raina.wav', letter: '雨', color: '#8fa9f5', avatar: '一只围着长围巾的白狐', bio: '慢热的世界收藏家。比起热闹，更喜欢有人一起听雨。', prefer: ['rain', 'garden'], available: [0,1,3,4,6], style: '陪伴型', hint: '喜欢安静的陪伴；不喜欢被催着定义关系。', line: '「今天也想找一个，不用说话的地方。」' },
  { id: 'ash', name: '阿澈', handle: 'ash.exe', letter: '澈', color: '#e9b78d', avatar: '总拿着热可可的机器人', bio: '咖啡厅的常驻向导。记得每个新人的名字，却常常忘记自己也需要休息。', prefer: ['cafe', 'rain'], available: [0,1,2,4,5,6], style: '朋友型', hint: '珍惜坦诚和朋友群体；不会把所有亲密都叫作恋爱。', line: '「欢迎回来。今天过得怎么样？」' },
  { id: 'mika', name: '小满', handle: 'mika.moon', letter: '满', color: '#edafc6', avatar: '发梢发着光的月兔', bio: '随身带着一本截图日记。害怕故事没有结尾，又努力学会不抢着翻到最后。', prefer: ['garden', 'cafe'], available: [0,2,3,5,6], style: '浪漫型', hint: '喜欢清楚的约定、留念与被认真记住。', line: '「下次，不要只说“改天”好不好？」' },
  { id: 'rei', name: '零点', handle: 'rei.null', letter: '零', color: '#80d8c1', avatar: '衣袖上有星图的机械人偶', bio: '隔着时区制作世界的人。你睡着的时候，TA 的太阳才刚刚升起。', prefer: ['orbit', 'studio'], available: [0,2,4,5], style: '独立型', hint: '尊重离线时间，合作创作比长时间黏在一起更有意义。', line: '「不用等我上线。星星会替我留着灯。」' },
  { id: 'lin', name: '凛', handle: 'lin.fm', letter: '凛', color: '#d992ef', avatar: '带着反光耳机的电子猫', bio: '看起来永远在人群中心的舞者。摘下耳机后，声音比想象中轻。', prefer: ['club', 'orbit'], available: [0,1,3,5,6], style: '自由型', hint: '支持 TA 的兴趣，也让彼此保留自己的朋友。', line: '「想来跳一支，没人评分的舞吗？」' },
  { id: 'yuki', name: '弥生', handle: 'yuki.mesh', letter: '弥', color: '#b8b0f9', avatar: '有一对不太对称翅膀的精灵', bio: '改模师与完美主义者。总觉得作品还不够好，直到有人看见那些不起眼的细节。', prefer: ['studio', 'garden'], available: [0,1,2,3,4], style: '创作型', hint: '喜欢一起完成作品；比起夸外表，更在意努力被看见。', line: '「这个发光材质……会不会太亮了？」' },
];

export const TRAITS = [
  { id: 'listener', name: '温柔接收器', icon: 'heart', desc: '聊天额外获得 2 点信任。', bonus: { social: 5 } },
  { id: 'maker', name: '多边形诗人', icon: 'cube', desc: '制作起点 +15，推进项目额外获得制作能力。', bonus: { craft: 15 } },
  { id: 'wanderer', name: '传送门旅人', icon: 'orbit', desc: '探索消耗精力减少 2 点，发现新世界更开心。', bonus: { mood: 5 } },
  { id: 'steady', name: '现实锚点', icon: 'sun', desc: '现实平衡起点 +15，每晚额外恢复 2 点。', bonus: { balance: 15 } },
  { id: 'camera', name: '记忆摄影师', icon: 'camera', desc: '拍照额外获得 2 点制作能力与 2 点亲密。', bonus: { craft: 5 } },
  { id: 'social', name: '小小引力场', icon: 'spark', desc: '社交起点 +15，初次见面额外获得 5 点信任。', bonus: { social: 15 } },
];

export const MEMORIES = [
  { id: 'anchor', name: '把晚安留给自己', icon: 'moon', desc: '每晚精力额外恢复 3 点。', cost: 2 },
  { id: 'warmth', name: '有人记得你的名字', icon: 'heart', desc: '所有聊天额外获得 1 点信任。', cost: 2 },
  { id: 'blueprint', name: '没保存的第一稿', icon: 'cube', desc: '开局制作能力 +10，资金 +40。', cost: 2 },
  { id: 'map', name: '口袋里的星图', icon: 'orbit', desc: '探索额外获得 1 点心情，精力消耗减少 1 点。', cost: 3 },
  { id: 'courage', name: '终于说出口的话', icon: 'spark', desc: '开局社交能力 +10，首次见面亲密 +5。', cost: 3 },
  { id: 'space', name: '恰好的距离', icon: 'flower', desc: '沟通边界额外消除 5 点关系压力。', cost: 3 },
];

export const GEAR = [
  { id: 'camera', name: '便携镜头', icon: 'camera', price: 60, desc: '拍照额外获得制作 +2、心情 +1。' },
  { id: 'comfort', name: '舒适头带', icon: 'headset', price: 90, desc: '每晚精力额外恢复 3 点。' },
  { id: 'tracker', name: '全身追踪套件', icon: 'spark', price: 180, desc: '舞池探索社交 +2；约会亲密 +2。' },
];

export const PROJECTS = [
  { id: 'avatar', name: '属于你的 Avatar', icon: 'cube', goal: 3, requirement: 0, desc: '一套不必模仿任何人的改模。完成：社交 +8、心情 +12、资金 +40。', reward: { social: 8, mood: 12, money: 40 } },
  { id: 'world', name: '为朋友留一盏灯', icon: 'orbit', goal: 5, requirement: 30, desc: '做一个可以回来的小世界。需制作 30。完成：制作 +10、心情 +15、资金 +80。', reward: { craft: 10, mood: 15, money: 80 } },
  { id: 'event', name: '没有门槛的聚会', icon: 'coffee', goal: 4, requirement: 25, desc: '为桌面玩家与新人也留位置。需社交 25、认识 3 人。完成：已认识朋友信任 +8、资金 +60。', reward: { social: 12, mood: 10, money: 60 } },
];

export const ACHIEVEMENTS = [
  { id: 'first', name: 'Hello, world', desc: '第一次推开传送门。', icon: 'orbit' },
  { id: 'explorer', name: '世界不止一面镜子', desc: '探索全部 6 个世界。', icon: 'compass' },
  { id: 'friends', name: '好友列表里有故事', desc: '认识全部 6 位朋友。', icon: 'people' },
  { id: 'sugar', name: '心意有了回声', desc: '建立一段双方确认的砂糖关系。', icon: 'heart' },
  { id: 'boundaries', name: '亲近，也有空间', desc: '完成 3 次边界沟通。', icon: 'flower' },
  { id: 'maker', name: '上传成功', desc: '完成第一个创作项目。', icon: 'cube' },
  { id: 'host', name: '欢迎所有的你', desc: '成功举办一场聚会。', icon: 'coffee' },
  { id: 'photos', name: '我们来过这里', desc: '拍摄 5 张照片。', icon: 'camera' },
  { id: 'salt', name: '好好说再见', desc: '主动、平和地结束砂糖关系。', icon: 'moon' },
  { id: 'balance', name: '明天也能见', desc: '结束时现实平衡达到 75。', icon: 'sun' },
  { id: 'stories', name: '未读消息的另一边', desc: '完成任意角色的两章个人故事。', icon: 'book' },
  { id: 'ensemble', name: '不只是两个人的故事', desc: '读完第一段角色间的群像剧情。', icon: 'people' },
  { id: 'interwoven', name: '把每个人的愿望听清楚', desc: '共同确认至少两段知情的开放砂糖关系。', icon: 'flower' },
  { id: 'season', name: '二十八次晚安', desc: '走完一个完整的 28 夜旅程。', icon: 'spark' },
];

// 全部人物、对话和事件为原创；研究资料只提供文化背景与情感主题。
const choice = (label, text, effects, rel = {}, flags = {}) => ({ label, text, effects, rel, flags });
export const EVENTS = [
  { id: 'quiet', world: 'rain', title: '沉默不是掉线', subtitle: '雨落候车室 · 一次不必填满的沉默', text: '雨音坐在站台另一端，镜子里两个人的耳朵偶尔动一下。你准备找话题时，TA 轻声说：“今天可以不聊天吗？只是有人在就很好。”', npc: 'raina', choices: [choice('坐在旁边，听一会儿雨', '你把麦克风关小了一点。十分钟后，TA 给你发来一张并肩的截图。', { mood: 5 }, { trust: 8, affection: 4 }), choice('问问 TA 是否需要独处', '“不用走。”TA 往旁边挪了一点，“谢谢你先问我。”', { social: 2 }, { trust: 9, tension: -4 }), choice('用笑话把气氛活跃起来', '你讲了三个笑话。TA 笑了，但没再提起今天有些累的原因。', { social: 4 }, { affection: 2, tension: 5 })] },
  { id: 'newbie', world: 'cafe', title: '桌面模式也有座位', subtitle: '凌晨咖啡 · 一个新人的晚上', text: '一个灰色机器人站在门口：“我没有 VR，是不是不适合来这里？”阿澈已经把一把椅子推了过去。你可以接着做些什么。', npc: 'ash', choices: [choice('一起带新人逛一个世界', '你们把所有需要手势的机关都换了个玩法。新人的好友列表多了两个人。', { energy: -6, social: 6, mood: 5 }, { trust: 8 }), choice('教 TA 调整安全与音量设置', '“原来我可以自己决定看到什么。”新人终于不再缩在门边。', { craft: 3, social: 3 }, { trust: 6 }), choice('先把今天留给自己', '你打了招呼，再找了个安静座位。阿澈点点头：“有精力时再来帮忙就好。”', { energy: 5, balance: 3 }, { trust: 1 })] },
  { id: 'stars', world: 'orbit', title: '一张跨时区的合照', subtitle: '低轨道 · 共享时间', text: '零点的当地时间已经接近清晨。TA 把相机摆好：“再晚一点，现实里的窗户就会亮。要不要最后拍一张？”', npc: 'rei', choices: [choice('拍完合照，各自去休息', '你们为照片起名《两个时区的一分钟》。下次见面的时间也被认真写进备忘录。', { craft: 4, balance: 6 }, { trust: 8, affection: 5 }), choice('请 TA 再多留一会儿', 'TA 陪你看了第二次日出，但回话慢了下来。被陪伴很甜，也有重量。', { mood: 8, balance: -5 }, { affection: 7, tension: 9 }), choice('约定异步留言，不必同时在线', '你们在观景台上各留了一句文字。时间错开，故事仍然接得上。', { social: 3, balance: 4 }, { trust: 10, tension: -3 })] },
  { id: 'dance', world: 'club', title: '没有评分的舞', subtitle: '霓虹地下室 · 第一首歌', text: '凛邀你到舞池边。你担心动作笨拙，TA 指了指正在用键盘摇摆的机器人：“这里又没有排行榜。”', npc: 'lin', choices: [choice('放下比较，跟着节拍动一动', '动作没变得专业，但你的笑声开始盖过脚步声。凛比了个很夸张的赞。', { energy: -5, social: 6, mood: 9 }, { affection: 6, trust: 4 }), choice('替 TA 拍一段演出留念', '你没站到舞池中央，却替别人保存了发光的时刻。', { craft: 5, mood: 3 }, { trust: 7 }), choice('坦诚说今晚不想进人群', '“那去外面透气。”TA 没有追问。走廊的低音反而刚刚好。', { energy: 5, balance: 4 }, { trust: 6, tension: -3 })] },
  { id: 'distance', world: 'garden', title: '坐近一点之前', subtitle: '纸月花园 · 相处的距离', text: '小满把一朵纸花放到长椅上。你想坐得近一些，却发现 TA 的 Avatar 稍微往后移了移。', npc: 'mika', choices: [choice('问：“这个距离舒服吗？”', '“现在这样就好。”过了一会儿，TA 自己把纸花放到了你手边。', { social: 3 }, { trust: 9, affection: 3, tension: -4 }), choice('把今晚的照片送给 TA', '你在照片下面写了日期，而没有擅自写下关系的名字。', { craft: 3, mood: 4 }, { affection: 7, trust: 3 }), choice('开玩笑说：“别这么见外嘛”', 'TA 也笑了一下，但把纸花收回了口袋。有些玩笑，会让人不知该怎么拒绝。', { social: 2 }, { trust: -5, tension: 10 })] },
  { id: 'mesh', world: 'studio', title: '最后一个报错', subtitle: '多边形工作室 · 上传前夜', text: '弥生盯着上传界面：“还差一点点，但我已经改了六个小时。”那一对翅膀有轻微穿模，灯光下却很好看。', npc: 'yuki', choices: [choice('陪 TA 检查，设定一个停止时间', '你们修好最明显的问题，把剩下的写进下一版清单。进度条终于走到了 100%。', { energy: -8, craft: 7, balance: 2 }, { trust: 9 }), choice('指出自己最喜欢的一个细节', '“你真的注意到了？”那是 TA 花了一整晚调出的发梢渐变。', { mood: 4, social: 2 }, { affection: 6, trust: 7 }), choice('建议直接重做，更完美一点', 'TA 又开了一个空白工程。你们今晚没能等到上传成功。', { craft: 4, balance: -5 }, { tension: 8, trust: -3 })] },
  { id: 'orange', minDay: 5, title: '橙色状态不等于拒绝', subtitle: '好友列表 · 未被读出的信号', text: '一位朋友的状态变成了橙色。你习惯了随时加入，今晚却只能发送 Request Invite。那一秒，你忽然觉得自己被留在门外。', choices: [choice('发一条邀请请求，然后去做自己的事', '你没有重复发送。稍晚，朋友解释今晚在处理私事；你也有自己的新故事可以分享。', { balance: 7, mood: 3, craft: 2 }, {}, { boundary: 1 }), choice('礼貌问一句方便时再见', '消息很短：“有空再一起逛，今晚先祝你顺利。”不用马上回复，也是一种体贴。', { social: 4, balance: 3 }, {}, { boundary: 1 }), choice('不断刷新好友列表', '你看了很久状态，却没有更接近对方的心情。这个晚上需要一点别的重心。', { energy: -10, mood: -7, balance: -9 })] },
  { id: 'voice', minDay: 3, title: '声音与外形之间', subtitle: '公开实例 · 第一次开麦', text: '你喜欢现在的 Avatar，却迟迟不敢开麦。旁边一位朋友说：“我记得的是你怎么和我相处，不是这副外形应该配什么声音。”', choices: [choice('用舒服的声音说一句晚上好', '没有想象中的审判。有人回应：“晚上好，欢迎回来。”', { social: 8, mood: 6 }), choice('今晚先用文字，按自己的节奏来', '你打出一句谢谢。开麦不是参与的门票，也不需要给谁一个期限。', { balance: 5, mood: 4 }), choice('为了融入，勉强维持很累的声线', '你得到了一些夸奖，也发现一直绷着嗓子并不轻松。', { social: 5, energy: -10, balance: -4 })] },
  { id: 'rumor', minDay: 9, title: '合照被起了另一个名字', subtitle: '朋友群 · 关系的命名权', text: '一张并肩的截图被群里打趣成了“砂糖官宣”。你还没有和对方讨论过这个词。聊天窗口越热闹，你越想把话说清楚。', choices: [choice('先问当事人，再一起说明', '你们约好：一张合照可以只是一个快乐的晚上。关系的名字，由当事人决定。', { social: 5, balance: 4 }, {}, { boundary: 1 }), choice('在群里温和说明还没有官宣', '玩笑停了下来，大家换了个话题。澄清不必让任何人难堪。', { social: 4, mood: 2 }), choice('顺着玩笑默认下来', '围观者很开心，但对方私下发来一句：“我们是不是应该先聊聊？”', { mood: 4, balance: -6 }, {}, { gossip: true })] },
  { id: 'budget', minDay: 4, title: '购物车里的另一种自己', subtitle: '改模之夜 · 不必买完的愿望', text: '你看中了一件 Avatar 衣服，还有一套追踪设备。购物车底部的数字，比你想象的长。今晚的自己真的需要它们吗？', choices: [choice('先用已有素材完成一套搭配', '你换了配色，调整了材质。原来“像自己”也可以从现有的东西开始。', { craft: 6, mood: 4 }), choice('买一件最喜欢的，留出预算', '你划掉了其他条目。花钱带来的快乐，因为没有透支而更踏实。', { money: -25, mood: 12, balance: 2 }), choice('全部拿下，明天再想办法', '新造型很闪耀，余额也很安静。下一次登录前，你得先处理现实里的账单。', { money: -65, mood: 16, balance: -12 })] },
  { id: 'morning', minDay: 7, title: '耳机之外，天已经亮了', subtitle: '下线之前 · 另一个世界的早晨', text: '世界的天空永远停在午夜，窗帘外却漏进了晨光。你明天还有事，但身旁的聊天刚刚变得有趣。', choices: [choice('认真说晚安，把故事留到明天', '你们约好续集，而不是把整个夜晚用完。摘下头显时，房间安静得恰到好处。', { energy: 12, balance: 10 }), choice('留下半小时，提前设定闹钟', '闹钟响起时，你真的离开了。“谢谢你没突然消失。”朋友说。', { mood: 7, balance: 3, energy: -4 }), choice('再陪一会儿，直到忘记时间', '这一夜很开心。明天的疲惫，也没有因为虚拟世界的日出而消失。', { mood: 14, energy: -15, balance: -14 })] },
  { id: 'party', minDay: 6, title: '两份邀请，同一个晚上', subtitle: '周末 · 时间不会复制', text: '朋友们约了游戏夜，另一个人却想单独与你听雨。你不想让任何一边失望，但今晚只有一个你。', choices: [choice('解释安排，给另一次相处一个时间', '你没有把“改天”当作万能答案，而是认真敲定了下一次。', { social: 5, balance: 4 }), choice('邀请双方一起玩，允许对方拒绝', '有人加入，也有人更想安静。不同的愿望被放在桌面上，而没有被评分。', { social: 6, mood: 5 }), choice('两边都答应，再来回跳实例', '你一直在场，却很少真正听完一句话。两边都注意到了你的心不在焉。', { energy: -10, mood: -5, balance: -8 })] },
  { id: 'feedback', minDay: 11, title: '作品的第一条评论', subtitle: '创作笔记 · 从别人的眼睛看', text: '你发出的截图收到一条“光太亮了”。你看着自己调了很久的灯，手指停在删除按钮上。', choices: [choice('请对方具体描述哪里不舒服', '你得到一条有用的建议，也保留了自己喜欢的风格。', { craft: 8, social: 2 }), choice('暂时收起反馈，明天再看', '没有立刻改动，也没有立刻反击。你给情绪留了一段冷却时间。', { energy: 6, balance: 5 }), choice('删掉作品，假装没发生过', '删除很快。遗憾却会留得久一点，好在下一份作品仍然可以重新开始。', { mood: -7, craft: 2 })] },
  { id: 'alone', minDay: 13, title: '好友列表全是灰色', subtitle: '一个人的实例 · 自己也能成为目的地', text: '今晚大家都没上线。你坐在熟悉的镜子前，第一次发现这个世界还有一条通向山顶的小路。', choices: [choice('沿着小路走走，拍一张给明天', '山顶的景色是新的。你把照片写成了一封不用马上回的信。', { mood: 10, craft: 5 }), choice('给自己做一份新的配色方案', '你把注意力放回手里可以完成的东西。没有观众的创作，也是真的。', { craft: 8, balance: 3 }), choice('下线，去见现实中的朋友', '两个世界之间没有输赢。今天的陪伴，从另一扇门走了进来。', { balance: 12, energy: 8, mood: 4 })] },
  { id: 'hostlesson', minDay: 16, title: '一个不那么完美的聚会', subtitle: '活动室 · 谁没有被听见', text: '语音重叠，背景音乐太响，有人一直站在边缘。你忽然明白，人数多不等于每个人都被接住。', choices: [choice('调低音乐，邀请大家轮流分享', '角落里的朋友第一次讲完了自己的故事。活动变安静了一点，却更像聚会了。', { social: 8, mood: 4 }), choice('留出安静区域与自由离开的出口', '有人去休息，有人回来。被欢迎也意味着不用一直表现得开心。', { social: 5, balance: 5 }, {}, { boundary: 1 }), choice('把音量调高，继续炒热气氛', '舞池更热闹了。你也发现，刚才那个安静的人已经离开。', { mood: 8, social: 2, energy: -7 })] },
];

export const ARCS = {
  raina: [
    { title: '“我不是不想回复你。”', text: '雨音第一次主动讲起离线的日子。“我有时看见消息，还是不知道怎么回。不是你做错了什么。我只是需要慢一点。”', choices: [choice('约定不用及时回复的留言', '你们把“必须回复”换成“可以慢慢读”。那盏灯没有灭，只是不再催促。', { balance: 5 }, { trust: 12, tension: -8 }), choice('问 TA 希望怎样被陪伴', '“一起在场，偶尔说话。”一个具体的愿望，终于替代了猜测。', { social: 4 }, { affection: 8, trust: 10 }), choice('要求至少每天报个平安', '你说出了自己的不安，也让 TA 感到必须交作业。这个约定还需要重新商量。', { mood: 3 }, { tension: 12, trust: -3 })] },
    { title: '为你留的末班车', text: '雨音带你到候车室的隐藏站台。指示牌上写着你们第一次见面的日期。“我不太会说喜欢，但这里想一直留一个你的位置。”', choices: [choice('说出心意，也确认彼此的期待', '你们讨论了陪伴、独处与不必秒回的夜晚。位置被留下，距离仍然可以调整。', { mood: 12 }, { affection: 14, trust: 10 }), choice('珍惜这个位置，先保持朋友关系', '你没有把礼物变成一道必须回答的题。雨音说：“那也很好。”', { balance: 6 }, { trust: 14, affection: 5 }), choice('承诺以后每晚都在这里', '承诺很美，你们却都知道，现实不会每晚放人。', { mood: 10, balance: -8 }, { affection: 10, tension: 10 })] },
  ],
  ash: [
    { title: '向导也会迷路', text: '咖啡厅第一次没有阿澈的欢迎声。你在角落找到 TA：“每天照顾别人的体验，有时我也不知道自己想去哪里。”', choices: [choice('今晚由我来带路', '你们选了一个没去过的世界。阿澈第一次不需要准备开场白。', { energy: -6, social: 5 }, { trust: 12, affection: 5 }), choice('问 TA 想不想休息', '你们把迎新告示改成了“明晚见”。门关上了，关系没有。', { balance: 5 }, { trust: 10, tension: -6 }), choice('夸 TA 是大家不可缺少的人', '这句话很好听，也让 TA 更难说出“今天不行”。', { social: 2 }, { affection: 3, tension: 8 })] },
    { title: '朋友也可以很重要', text: '阿澈把你拉进一个小小的周年聚会：“我知道你很重要，但对我来说，那不一定要叫恋爱。这样的回答，会让你失望吗？”', choices: [choice('坦诚说期待，也尊重 TA 的答案', '你们没有回避失落，也没有让朋友关系变成安慰奖。', { mood: 6, balance: 6 }, { trust: 16, tension: -10 }, { friendship: true }), choice('为这份友谊举杯', '关系有了一个很稳的名字。你们约好明年还一起给新人指路。', { social: 6, mood: 10 }, { trust: 14 }, { friendship: true }), choice('试着证明恋爱会更好', '你说了很多理由。阿澈只是重复：“但那不是我想要的。”', { mood: -6 }, { trust: -8, tension: 16 })] },
  ],
  mika: [
    { title: '“改天”是哪一天？', text: '小满翻着截图日记：“我以前等过很多个改天。你不必一直陪我，但我想知道，答应的事情什么时候会发生。”', choices: [choice('给出能做到的约定', '你把下一次见面写进日历，留出余地，也认真兑现。', { balance: 4 }, { trust: 12, affection: 7 }), choice('说清楚不确定的安排', '不确定没有消失，但不用靠猜测来填满了。', { social: 5 }, { trust: 11, tension: -5 }), choice('保证以后每天都上线', '日记空白处写进了一个过大的承诺。', { mood: 8, balance: -7 }, { affection: 9, tension: 10 })] },
    { title: '这次想把名字写清楚', text: '小满递来一张双人照，标题栏还是空的。“我想和你认真讨论砂糖。是只在这里，还是也想了解现实？你希望是什么样？”', choices: [choice('先确认共同期待，再慢慢向前', '你们写下现在能接受的范围，也允许以后继续讨论。亲密终于不必靠猜。', { mood: 12 }, { affection: 15, trust: 12, tension: -5 }), choice('坦诚说还没准备好', '“谢谢你没有为了让我开心而答应。”照片仍然被保留。', { balance: 6 }, { trust: 12, affection: -2 }), choice('为了不让 TA 失落，全部答应', '名字被写得很漂亮，你却还没想清楚那些字意味着什么。', { mood: 8, balance: -8 }, { affection: 8, tension: 15 })] },
  ],
  rei: [
    { title: '两个时区的日程表', text: '零点发来一张有很多空格的日程表：“我不想让你熬夜等我。我们是不是可以偶尔在周末见，其余时间各自生活？”', choices: [choice('约定交集，把留言留给其他日子', '日程表没有被填满，却多了两个可靠的交点。', { balance: 8 }, { trust: 13, tension: -6 }), choice('邀请 TA 一起异步制作世界', '你改灯光，TA 写脚本。每天上线，都能看见对方留下的一小步。', { craft: 8 }, { affection: 8, trust: 10 }), choice('把自己的作息全部迁过去', '你们终于每晚同时在线。现实里的清晨却越来越难醒来。', { mood: 10, balance: -15, energy: -8 }, { affection: 8, tension: 5 })] },
    { title: '离线也不等于离开', text: '零点要出差一周。TA 把尚未完成的星空世界发给你：“不用替我守着，可以做你喜欢的事。我回来时想听听你的新故事。”', choices: [choice('祝顺利，把自己的生活也继续下去', '你们学会在缺席里保持联系。回来后的见面，多了七天的新鲜事。', { balance: 10, mood: 6 }, { trust: 15, tension: -8 }), choice('完成一处小灯光，留个惊喜', 'TA 回来时，看到一盏会随日出变化的灯。“你记得我说过的。”', { craft: 10, energy: -8 }, { affection: 12, trust: 9 }), choice('把每个晚上都留空等 TA', '等待很认真，也让一个人的生活停在了加载画面。', { balance: -12, mood: -4 }, { affection: 4, tension: 8 })] },
  ],
  lin: [
    { title: '热闹的人，也会怕冷场', text: '凛关掉了音乐：“大家好像喜欢我永远开心。可我今天不想跳舞。”屏幕里的电子猫把耳朵垂了下来。', choices: [choice('告诉 TA 不表演也值得被喜欢', '你们在走廊坐了一会儿。没有音乐，谈话却没有停。', { mood: 5 }, { trust: 14, affection: 6 }), choice('一起去安静的观星台', '你选了一个没有舞池的世界，把今晚交还给 TA。', { energy: -4, balance: 3 }, { trust: 12, affection: 5 }), choice('鼓励 TA 打起精神继续演出', '凛重新打开音乐。你不知道那副笑脸还花了多少力气。', { social: 3 }, { trust: -5, tension: 10 })] },
    { title: '你不必是我唯一的观众', text: '演出后，凛收到好多邀请。“喜欢你，也喜欢跳舞和朋友。这些不是在争抢同一个位置。”TA 看着你，等一个回应。', choices: [choice('支持 TA 的舞台，也保留自己的生活', '你们没有缩小世界，而是在各自的世界里为彼此留了门。', { balance: 8, social: 5 }, { trust: 15, affection: 10, tension: -8 }), choice('商量固定的两人时间', '人群与独处都有了位置。承诺变得具体，也更容易做到。', { mood: 8 }, { trust: 12, affection: 12 }), choice('要求以后只为自己跳舞', '舞池很大，这句话却让它突然变窄了。', { mood: 3 }, { trust: -12, tension: 20 })] },
  ],
  yuki: [
    { title: '关掉镜子之后', text: '弥生换回默认模型：“有时我觉得，如果不是这个好看的 Avatar，你们可能就不会想和我说话。”你想起了 TA 帮你查报错的每一个晚上。', choices: [choice('具体说起 TA 曾经帮助你的事', '“原来那些你都记得。”TA 的声音没有变，房间却暖了一些。', { social: 5 }, { trust: 14, affection: 5 }), choice('邀请 TA 一起做个不必漂亮的作品', '你们给一只歪歪扭扭的纸鸟装上碰撞体。它飞不远，笑声却很长。', { craft: 8, mood: 5 }, { trust: 10, affection: 7 }), choice('继续夸 TA 的模型特别好看', '夸奖没有错，只是没有回答今晚那个问题。', { mood: 3 }, { affection: 3, tension: 5 })] },
    { title: '把你的名字写进制作名单', text: '弥生邀请你共同发布一个小世界。加载画面里，你们的名字排在同一行。“如果不是你，我大概还停在第一版。”', choices: [choice('一起发布，让不完美也被看见', '朋友们来了。没有人先问面数，他们先问：“这里为什么这么温暖？”', { craft: 12, mood: 10 }, { trust: 13, affection: 12 }), choice('感谢合作，约好下一次创作', '你们保存了工程，也保存了一种可靠的相处方式。', { balance: 5, craft: 8 }, { trust: 15 }), choice('再改一夜，直到无可挑剔', '作品更精致了，你们却错过了约好的聚会时间。', { craft: 14, energy: -12, balance: -10 }, { tension: 9 })] },
  ],
};

export const SOURCES = [
  { title: '中文玩家分享 · 入坑、设备与新朋友', url: 'https://blog.xuemeng.work/index.php/2026/05/25/vrc%E5%A4%AA%E5%A5%BD%E7%8E%A9%E5%95%A6%EF%BC%81%E5%BE%88%E5%B9%B8%E8%BF%90%E9%81%87%E5%88%B0%E4%BD%A0%E4%BB%AC%EF%BC%81/', note: '借鉴新人融入、设备差异与共同创作的生活主题；人物、对白和事件经过均另行原创。' },
  { title: '中文玩家分享 · 深夜陪伴的感受', url: 'https://www.233leyuan.com/post-detail/2057725832293969920', note: '用于理解深夜陪伴与下线时的心情；没有改写原帖中的具体经历。' },
  { title: 'バーチャルライフマガジン · 砂糖文化介绍', url: 'https://vr-lifemagazine.com/osatou/', note: '关系期待因人而异；互相讨论边界与是否涉及现实。' },
  { title: '4Gamer · 作者的 VRChat 亲密关系经历', url: 'https://www.4gamer.net/games/794/G079439/20251224061/', note: '反复见面、空间距离与被陪伴的感受。仅借鉴主题，未改编具体人物或情节。' },
  { title: '虚拟学会 · 作为交流行为的「お砂糖」', url: 'https://www.jstage.jst.go.jp/article/vconf/2022/0/2022_147/_pdf/-char/ja', note: '亲密关系也可以从交流方式和关系协商的角度理解。' },
  { title: 'VRChat 官方 Wiki · 状态与邀请系统', url: 'https://wiki.vrchat.com/wiki/Social', note: '在线状态作为世界与剧情的文化背景；游戏规则为原创设计。' },
];
