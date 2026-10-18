import { PEOPLE } from './data.js';
export function firstNightGuide(run,enabled=true){
 if(!enabled||run.ended||run.day>7)return null;
 if(!run.visited.length)return {title:'先给这一晚选个地方',text:'当前世界可以继续探索；选其他世界会跃迁过去。两种都花一次行动，探索可能遇见朋友或开启一段故事。',route:'worlds',label:'看看今晚的世界'};
 if(!run.storyFlags['guide:talk'])return {title:'认识之后，可以先聊一句',text:'朋友页的「现在聊聊」是远程交流，不改变所在地图。「现在相处」立即使用当前世界的场景；日历预约则要到约定时段再赴约。',route:'people',label:'去朋友页看看'};
 if(!run.appointments.length)return {title:'把一个改天写成具体时间',text:'提预约不花行动。双方确认夜晚、时段和地点后，记得到日历按约赴约；赴约含前往世界，只花一次行动。还没准备好也可以先不约。',route:'calendar',label:'打开预约日历'};
 if(!run.photos.length&&run.day>=3)return {title:'想留照片，先看看谁真的在场',text:'合照需要朋友与自己在同一世界。可以先去对方所在的世界，也可以直接给当前风景拍照；每夜一张，是否入镜由这次故事确认。',route:'worlds',label:'看看现在的风景'};
 if(run.day>=4&&run.queue.some(q=>q.optional))return {title:'近况可以挑着读',text:'先看摘要，再决定要不要展开正文和回应。普通消息可以留到以后；旅程结束时已收到的正文会封存在故事册，不会因没清完未读就消失。',route:'worlds',label:'看看朋友的近况'};
 if(run.day>=4&&!Object.values(run.projects).some(Boolean))return {title:'也留一点自己的事',text:'创作消耗行动、精力和资金。先做一个小项目就够；工作恢复资金与现实平衡，休息恢复精力，不必把每晚三次行动都排满。',route:'studio',label:'看看创作工坊'};
 const friend=PEOPLE.find(p=>run.relationships[p.id].introduced);
 return {title:'这一晚可以自己安排了',text:`${friend?friend.name+'和其他朋友':'朋友们'}都有自己的节奏。选择喜欢的故事，也允许暂时搁下。简明引导会在第八夜收起，随时可以在设置中关闭。`,route:'worlds',label:'继续自己的安排'};
}
