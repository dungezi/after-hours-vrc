import { PEOPLE } from './data.js';

export const INITIATIVE = {
  raina:{soft:true,day:13,affection:46,trust:46,late:22,
    first:['留给你的目的地','雨音发来一张新地图，邀请栏只填了你的名字。“不是怕迷路，”她停了很久才补上一句，“是有些地方，我想第一个和你去。”她没有急着给这种心意命名，只想知道你是否愿意靠近。'],
    urgent:['这次不想再撤回','雨音把打了又删的消息发给你：“这段旅程剩下的夜晚越来越少。我有点害怕，一直等到恰当的时候，就又什么都没说。”她吸了一口气，认真问你是否愿意和她成为砂糖搭档。'],
    follow:['名字之后的那句话','雨音记得你愿意继续了解彼此。几晚的相处以后，她这次没有把问题藏进地图链接：“我喜欢的是和你一起去。你愿意和我确认砂糖关系吗？”'],
  },
  mika:{soft:false,day:10,affection:52,trust:45,
    first:['相册标题由我先写','小满给你看一页没有公开的相册，标题写着“想继续和你”。她说，这次不想等照片替自己传话：“我喜欢你，想和你成为砂糖搭档。你的想法呢？”'],
    follow:['给空白标题的第二次邀请','小满没有每天追问相册的答案。又一次认真相处后，她问你：“你有新的想法了吗？可以说愿意，也可以说只是朋友，我都想听清楚。”'],
  },
  rei:{soft:true,day:12,affection:48,trust:48,
    first:['时钟旁的一段固定时间','零点在两个时钟之间留出一段只邀请你的时间。“这次不是联机测试。我想让你知道，等你上线已经是我会期待的事。”他想先听你是否有同样的期待，再讨论关系的名字。'],
    follow:['把喜欢写进日程之前','零点先确认你们这几晚的相处有没有成为负担，然后才说：“我想和你成为砂糖搭档。时间表可以调整，但这句话我不想一直用工程备注代替。”'],
  },
  lin:{soft:false,day:9,affection:48,trust:43,
    first:['不是演出的一句喜欢','凛关闭音乐，问你今晚能不能听一句普通声线的话：“我喜欢你，也想和你成为砂糖搭档。这个邀请没有观众，你可以按自己的感觉回答。”'],
    follow:['想听你的真实节拍','凛没有把上次的等待变成每天的追问。再次相处时，她摘下耳机：“如果你已经想清楚了，我想听听。不同的答案都比勉强配合我的节拍好。”'],
  },
  yuki:{soft:true,day:14,affection:47,trust:48,late:23,
    first:['工程文件外的一次邀请','弥生发来一张空白邀请卡，特意写上“不用帮忙测试”。“我有时候拿作品当借口找你。”她有点脸红，“这次只是想和你一起待着。你也会期待吗？”'],
    urgent:['还没做完也想说的话','弥生把未完成的模型保存下来：“以前我总想等它做完，再认真邀请你。但夜晚不会等我把每一根羽毛都调好。”她这次明确说出喜欢，问你愿不愿意成为砂糖搭档。'],
    follow:['不再附在文件后的心意','弥生没有带工程来。她记得你愿意继续相处，也想把这几晚的期待讲明白：“我喜欢你，想和你确认砂糖关系。你不用因为以前帮过我，就答应。”'],
  },
};
export function initiativeDirect(run,q) {
  const p=INITIATIVE[q.npc];return q.index===1 || !p.soft || (!!p.late && run.day>=p.late);
}
export function initiativeScene(run,q) {
  const personality=INITIATIVE[q.npc];if(!personality)return null;
  const direct=initiativeDirect(run,q),[title,text]=q.index===1?personality.follow:direct && personality.soft?personality.urgent:personality.first;
  const others=PEOPLE.filter(p=>p.id!==q.npc && run.relationships[p.id].status==='sugar').map(p=>p.name);
  const npcPartners=Object.entries(run.npcBonds).filter(([key,b])=>b.status==='sugar' && key.split(':').includes(q.npc)).map(([key])=>PEOPLE.find(p=>p.id===key.split(':').find(id=>id!==q.npc)).name);
  const disclosure=others.length || npcPartners.length?`\n\n你们也把已有关系讲清楚：${others.length?'你与'+others.join('、')+'已有砂糖约定。':''}${npcPartners.length?PEOPLE.find(p=>p.id===q.npc).name+'与'+npcPartners.join('、')+'已有砂糖约定。':''}大家已有开放相处的共识；仍需要你明确同意新的关系。`:'';
  return {id:'initiative',npc:q.npc,title,subtitle:`${PEOPLE.find(p=>p.id===q.npc).name}主动靠近 · ${direct?'认真确认心意':'先试着表达期待'}`,text:text+disclosure,choices:[
    {label:direct?'我也喜欢你，确认彼此的砂糖约定':'我也期待和你相处，愿意继续靠近',text:direct?'你认真回应了心意，也确认了相处时间、现实生活和已有关系的边界。双方的砂糖关系在这一刻成立。':'你回应了这份期待。你们先继续了解彼此，没有把试探自动算作砂糖关系。',effects:{mood:3},rel:{trust:3,affection:3},outcome:direct?'initiative-accept':'initiative-interest'},
    {label:'我还需要时间想想',text:'对方听清了你的犹豫，没有把等待当作已经答应。你可以继续相处，也可以之后明确自己的答案。',effects:{},rel:{},outcome:'initiative-wait'},
    {label:'我希望保持朋友关系',text:'对方认真听完，尊重了这个答案。朋友关系被留下，之后不会再反复追问这次邀请。',effects:{},rel:{tension:-3},outcome:'initiative-decline'},
  ]};
}
