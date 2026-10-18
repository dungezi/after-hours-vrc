import { applyAppointmentChapter, rememberAppointment, validMemento } from './appointment-chapters.js';
import { PEOPLE, WORLD } from './data.js';
import { departureContactReason } from './separation-stories.js';

export const APPOINTMENT_IDS=['appointment-plan','appointment-meet','appointment-missed','appointment-change'];
export const MEET_KINDS={walk:'一起散步',photo:'预约拍照',create:'一起做小练习'};
const person=id=>PEOPLE.find(p=>p.id===id),world=id=>WORLD.find(w=>w.id===id);
const active=a=>['confirmed','proposed','changing','attending'].includes(a.status);
const at=(a,day,slot)=>a.day===day&&a.slot===slot;
const add=(a,run,kind)=>a.history.push({day:run.day,kind,when:a.day,slot:a.slot});
export function slotAppointments(run){return run.appointments.filter(a=>a.status==='confirmed'&&at(a,run.day,run.nightActions+1));}
export function appointmentReason(run,id){const a=run.appointments.find(a=>a.id===id);if(!a||a.status!=='confirmed')return '这份预约尚未确认或已经结束';if(a.day!==run.day||a.slot!==run.nightActions+1)return `在第 ${a.day} 夜第 ${a.slot} 次行动赴约`;if(a.cast.some(id=>departureContactReason(run,id)))return '先尊重目前的联系范围，预约可以取消';return null;}
function validTime(run,cast,day,slot,ignore=null){return Number.isInteger(day)&&day>=run.day&&day<=28&&Number.isInteger(slot)&&slot>=1&&slot<=3&&(day>run.day||slot>run.nightActions)&&cast.every(id=>person(id)?.available.includes(day%7))&&!run.appointments.some(a=>a.id!==ignore&&active(a)&&at(a,day,slot));}
function nextTime(run,cast,ignore=null){const original=run.appointments.find(a=>a.id===ignore);for(let day=run.day;day<=28;day++)for(let slot=1;slot<=3;slot++)if((!original||!at(original,day,slot))&&validTime(run,cast,day,slot,ignore))return {day,slot};return null;}
export function proposeAppointment(run,{npc,day,slot,world:place,kind='walk'}){
  if(run.ended||run.pending||run.notice)throw new Error('先回应眼前的故事。');
  if(!run.relationships[npc]?.introduced||departureContactReason(run,npc))throw new Error('先认识对方，并尊重现在的联系范围。');
  if(!world(place)||!MEET_KINDS[kind]||!Number.isInteger(day)||day<run.day||day>28||!Number.isInteger(slot)||slot<1||slot>3||(day===run.day&&slot<=run.nightActions))throw new Error('请选择本轮尚未经过的夜晚和行动时段。');
  if(!person(npc).available.includes(day%7))throw new Error('对方这晚原本离线，换一个共同方便的夜晚。');
  if(run.appointments.length>=24)throw new Error('本轮累计最多记录 24 份预约，完成或取消的记录也会保留。仍可现在聊天与相处。');
  if(run.appointments.some(a=>active(a)&&a.cast.includes(npc)&&at(a,day,slot)))throw new Error('已经和对方约了这个时段，不必重复预约。');
  const a={id:'a'+(run.appointments.length+1),cast:[npc],day,slot,world:place,kind,status:'proposed',created:run.day,changes:0,resolved:false,history:[]};
  add(a,run,'propose');run.appointments.push(a);run.pending={type:'scene',id:'appointment-plan',npc,booking:a.id};return a;
}
export function changeAppointment(run,id,cancel=false){
  if(run.pending||run.notice||run.ended)throw new Error('先回应眼前的故事。');
  const a=run.appointments.find(a=>a.id===id);if(!a||!['confirmed','changing'].includes(a.status))throw new Error('这份预约目前不能修改。');
  if(!cancel&&a.cast.some(id=>departureContactReason(run,id)))throw new Error('目前先尊重不联系的范围，可以取消这份预约。');
  if(cancel){a.status='cancelled';a.resolved=true;add(a,run,'cancel');return `${a.cast.map(id=>person(id).name).join('、')}收到提前取消的说明。这次没有记为失约。`;}
  if(a.changes>=2)throw new Error('这份预约已改过两次；可以先取消，以后重新询问。');
  const next=nextTime(run,a.cast,a.id);if(!next)throw new Error('本轮没有双方都方便的空时段，可以先取消。');
  a.status='changing';a.suggested=next;a.resolved=false;run.pending={type:'scene',id:'appointment-change',npc:a.cast[0],booking:a.id};
}
export function tickAppointments(run,endNight=false){
  const messages=[];
  for(const a of run.appointments){
    if((['confirmed','changing','proposed'].includes(a.status)||a.status==='missed'&&!a.resolved)&&a.cast.some(id=>departureContactReason(run,id))){a.status='cancelled';a.resolved=true;add(a,run,'boundary-cancel');continue;}
    if(a.status==='confirmed'&&(a.day<run.day||(a.day===run.day&&(endNight||a.slot<=run.nightActions)))){
      a.status='missed';a.resolved=false;add(a,run,'miss');messages.push({booking:a.id,npc:a.cast[0],penalty:true});
    }
  }
  return messages;
}
export function npcChangeAppointments(run,npc){
  for(const a of run.appointments.filter(a=>a.status==='confirmed'&&a.cast.includes(npc)&&a.day>=run.day&&a.day<=run.day+2)){
    a.status='changing';a.suggested=a.day>=28||a.changes>=2?null:nextTime({...run,day:Math.max(run.day+1,a.day+1),nightActions:0},a.cast,a.id);a.npcChange=true;a.resolved=false;add(a,run,'npc-change');
  }
}
export function appointmentMessages(run){return run.appointments.flatMap(a=>a.resolved?[]:a.status==='missed'?[{type:'scene',id:'appointment-missed',npc:a.cast[0],booking:a.id}]:a.status==='changing'?[{type:'scene',id:'appointment-change',npc:a.cast[0],booking:a.id}]:[]);}
export function appointmentReady(run,q){const a=run.appointments.find(a=>a.id===q.booking);return !!a&&q.npc===a.cast[0]&&!q.other&&a.cast.every(id=>run.relationships[id].introduced)&&!a.resolved&&({'appointment-plan':'proposed','appointment-meet':'attending','appointment-missed':'missed','appointment-change':'changing'}[q.id]===a.status);}
const LINES={raina:'雨音把路线看了一遍：“这次不用猜什么时候见，我有一点期待。”',ash:'阿澈关掉了主持面板：“今天我也算游客，对吧？”',mika:'小满先确认了结束时间，又把相机拿到手边：“这回是具体的这一晚。”',rei:'零点比对两个时区：“时间确实重叠了，工程可以先关一会儿。”',lin:'凛摘下耳机：“这次不带节目，我有个自己想看的角落。”',yuki:'弥生把未完成清单收起来：“先赴这一次约，明天还有明天的修改。”'};
const FRAMES={rain:'雨水在站台玻璃上划出一道道细线。你们把相机放低，让车灯照亮轮廓，也先确认不拍进另一侧休息的人。',cafe:'窗边杯子的热气挡住了半张脸。你们挪开杯子，没有把隔壁桌的谈话录进去，画面留下两把被认真拉近的椅子。',orbit:'星环慢慢转到背景中间，观景台却比预想暗。你们先试过曝光，才决定靠哪一段扶栏站，没让相机替谁多留一轮日出。',club:'舞池的频闪让试拍连着模糊。你们退到走廊，等灯光平稳的一拍，让身后的人仍能自由经过。',garden:'纸月的光落在花瓣边，长椅留着一段舒服的距离。你们先问是否愿意靠近，再把纸花放到共同能看见的位置。',studio:'预览网格还没关，桌上有没修完的纸鸟。你们只框进这一版实际存在的细节，未发布的工程不会跟着照片公开。'};
export function appointmentScene(run,q){
  const a=run.appointments.find(a=>a.id===q.booking);if(!a)return null;const npc=a.cast[0],name=person(npc).name,names=a.cast.map(id=>person(id).name).join('、'),time=`第 ${a.day} 夜第 ${a.slot} 次行动`,place=world(a.world).name;
  const option=(label,text,answer,rel={},extra={})=>({label,text,effects:{},rel,outcome:'appointment-'+answer,...extra});
  if(q.id==='appointment-plan'){
    const conflict=run.appointments.find(b=>b!==a&&active(b)&&at(b,a.day,a.slot));
    const refuses=run.relationships[npc].trust<15||run.appointments.reduce((n,b)=>n+(b.cast.includes(npc)?b.history.filter(h=>h.kind==='miss').length:0),0)>=2&&run.relationships[npc].trust<35;
    return {npc,title:conflict?'同一个时段的两份邀请':'把下一次见面写进日历',subtitle:'预约 · '+MEET_KINDS[a.kind],text:`你邀请${name}在${time}去${place}。预约会占用那一次行动；赴约含前往世界，不必另花一次跃迁。\n\n${conflict?`你已经与${conflict.cast.map(id=>person(id).name).join('、')}约在同一时段。两份承诺不能同时照常兑现。`:refuses?`${name}希望先从普通相处重新积累可靠感，这次还不准备接受新的预约。`:`${LINES[npc]} 对方愿意确认这一个具体时段，仍保留提前改期的可能。`}`,choices:conflict?[
      option('为新邀请另找共同空闲的时段','你先保留原约，再询问一个双方都能到的新时段。','move'),
      option('询问两位朋友是否愿意一起参加','你没有替两人答应，是否合并需要每一位愿意。','merge'),
      option('保留原约，婉拒这份新邀请','新的邀请被认真回复，原来的约定没有被偷偷挤掉。','cancel'),
    ]:refuses?[option('接受这次暂缓，不继续追问',`${name}的回答被保留；这份邀请没有写成已经确认。`,'cancel',{trust:1})]:[
      option('确认这个时间与安排','双方把地点、时段和要做的事写进日历。之后能提前改期，不能把不出现当成默认取消。','confirm'),
      option('再商量一个没有冲突的时段','你们重新核对日程，不把方便当作对方必须腾空时间。','move'),
      option('这次先不确定，保留普通邀请','没有确认的期待先放下，这一份不占用日历。','cancel'),
    ]};
  }
  if(q.id==='appointment-change')return {npc,title:a.npcChange?`${name}主动提出改期`:'认真改动一次已经约好的时间',subtitle:'预约变更',text:`原约是${time}，在${place}${MEET_KINDS[a.kind]}。${a.npcChange?`${name}自己的计划遇到了变化，主动说明这次不能照常到场。你可以失落，对方也不能替你接受新的安排。`:'你提前说明了安排变化，原时段先空出来，再由双方确认新的约定。'}\n\n${a.suggested?`目前共同方便的是第 ${a.suggested.day} 夜第 ${a.suggested.slot} 次行动。`:'本轮已经找不到共同空闲时段，可以先认真取消。'}`,choices:[
    option('接受新的时间，重新确认具体安排','你们重新确认一次可以做到的约定。旧时间不会再被当作失约检查。','accept-change',{},a.suggested?{}:{unavailable:'本轮没有共同空闲时段'}),
    option('说明失落，但这次先取消，不急着补约','对方听见了你的失落，也尊重这次不继续约的决定。','cancel',{trust:1}),
    option('先取消，等现实安排稳定再重新询问','这次没有要求谁立刻偿还一个夜晚，记录里清楚留下了变更原因。','cancel'),
  ]};
  if(q.id==='appointment-missed')return {npc,title:'那次约定没有等到你',subtitle:'失约之后 · '+name,text:`${names}记得${time}在${place}的约定。你做了别的安排，或提前结束了那一夜，却没有先说明取消。\n\n${name}没有因此宣布关系结束，但希望知道这次约定为什么落空。原来的等待已经发生，不会被改期擦掉。`,choices:[
    option('承认没有提前说明，重新询问一个能做到的时间','你认真回应了这次等待。是否再约会参考对方现在是否愿意，以及本轮还有没有共同空闲。','repair',{trust:1,tension:-1}),
    option('坦白目前承担不了预约，暂时减少承诺','你没有拿更大的保证补偿这次失约，双方先把期待缩到能做的范围。','resolve',{tension:-2}),
    option('先听对方这次具体在意什么，不马上许下新约','你们把这次没有兑现的部分讲清楚。道歉没有自动生成另一个承诺。','resolve',{trust:1}),
  ]};
  const photo=a.kind==='photo',create=a.kind==='create';
  return applyAppointmentChapter(run,a,{npc,...(a.cast[1]?{other:a.cast[1]}:{}),title:`在约好的${place}见面`,subtitle:'赴约 · '+names,text:`你用了${time}这一段行动，含前往${place}，${names}也按约抵达。\n\n${LINES[npc]}\n\n${photo?FRAMES[a.world]+'\n\n这次原本约了拍照，可以确认入镜，也可以共同改为只散步。':create?'你们约的是一起做一个小练习，作品不必当晚发布，也不会跳过正式项目的要求。':'你们可以沿原来的路线走，也可以各留一小段让不同偏好都被看见。'}`,choices:[
    option(photo?'征得同意后留下这一次合照':create?'先帮对方完成最卡住的一小步':'先走对方最想去的那一段',photo?'拍摄方式与私人范围被再次确认，这张照片记录的是一次真的赴约。':create?'你们认真做完一小步，余下的练习仍留给各自继续。':'对方的期待真正排进了这段时间，你们也按约结束。','finish',{trust:3,affection:2},{...(a.cast[1]?{otherRel:{trust:2},npcLinkDelta:2,pairEffects:{trust:1,tension:-1}}:{}),meetMode:photo?'portrait':create?'support':'their',...(photo&&run.photoDay===run.day?{unavailable:'今晚已拍过照，可以共同改为散步'}:{})}),
    option(photo?'共同改为不拍照的散步':create?'各做一个版本，再交换具体发现':'也说出自己想看的地方，一起调整路线',photo?'双方重新确认这次只相处，不补造合照，也没有把改动当作背着对方改变承诺。':create?'两个版本都实际做过，你们听到了彼此的方法，没有把谁的作品替换成另一个人的。':'路线被共同改过，原先的期待也没有被假装已经全部完成。','finish',{trust:2,tension:-1},{meetMode:photo?'walk':create?'parallel':'shared'}),
    option('坦白状态不佳，商量缩短这次相处','你按约来了，也认真说明了现在能承担的范围。双方共同结束这一小段，没有靠勉强撑满证明在意。','finish',{trust:1},{meetMode:'short'}),
  ]});
}
export function resolveAppointment(run,q,c){
  const a=run.appointments.find(a=>a.id===q.booking),answer=c.outcome.slice(12);let extra='';
  const move=()=>{const next=nextTime(run,a.cast,a.id);if(next&&a.changes<2){a.day=next.day;a.slot=next.slot;a.status='confirmed';a.changes++;a.resolved=true;add(a,run,'reschedule');return true;}return false;};
  if(answer==='confirm'){a.status='confirmed';a.resolved=true;add(a,run,'confirm');}
  if(answer==='cancel'){a.status='cancelled';a.resolved=true;add(a,run,'cancel');}
  if(answer==='move'){if(move())extra=`新约定是第 ${a.day} 夜第 ${a.slot} 次行动。`;else {a.status='cancelled';a.resolved=true;extra='本轮没有可用的共同空时段，这次先取消。';}}
  if(answer==='merge'){
    const old=run.appointments.find(b=>b!==a&&active(b)&&at(b,a.day,a.slot));
    const willing=old&&old.kind==='walk'&&a.kind==='walk'&&old.cast.length===1&&[...old.cast,...a.cast].every(id=>!['raina','mika'].includes(id)||run.relationships[id].trust>=45);
    if(willing){old.cast.push(...a.cast);add(old,run,'merge');extra='两人都愿意把这一段改为朋友共同散步，仍只占一个时段。';}else extra='有人更想保留原来的单独安排，没有合并；原约仍在，新邀请这次先婉拒。';
    a.status='cancelled';a.resolved=true;add(a,run,'merge-request');
  }
  if(answer==='accept-change'){
    const next=a.suggested;if(next&&validTime(run,a.cast,next.day,next.slot,a.id)){a.day=next.day;a.slot=next.slot;a.status='confirmed';a.changes++;a.resolved=true;add(a,run,'reschedule');}else{a.status='cancelled';a.resolved=true;extra='新的时段已经不合适，本次先取消，没有自动覆盖别的承诺。';}delete a.suggested;
  }
  if(answer==='repair'){
    const misses=a.history.filter(h=>h.kind==='miss').length;
    if(misses<2||run.relationships[a.cast[0]].trust>=35){if(move())extra=`双方愿意再试一次：第 ${a.day} 夜第 ${a.slot} 次行动。`;else {a.resolved=true;extra='本轮没有共同空时段，先把这次说明留在记录里。';}}
    else{a.resolved=true;extra='对方暂时不想再确认新约，这次回答被尊重。';}
  }
  if(answer==='resolve')a.resolved=true;
  if(answer==='finish'){
    rememberAppointment(run,a,c);a.status='completed';a.resolved=true;a.result=c.meetMode;add(a,run,'complete');
    for(const id of a.cast){run.relationships[id].lastDay=run.day;const life=run.lives[id];if(a.kind==='create'&&c.meetMode==='support'&&life.plan){life.plan.support=Math.min(3,life.plan.support+1);if(life.plan.state==='paused'){life.plan.state='retrying';life.plan.due=run.day+3;}}}
    if(a.kind==='photo'&&c.meetMode==='portrait'){run.photoDay=run.day;run.photos.push({world:a.world,day:run.day,slot:run.nightActions,with:a.cast[0],companion:a.cast[0],title:'赴约留影 · '+world(a.world).name,caption:c.text,scope:'private',story:null,choice:null});}
  }
  return extra;
}
export function validAppointments(run){
  if(!Array.isArray(run.appointments)||run.appointments.length>24)return false;
  const valid=a=>a&&validMemento(a.memento)&&/^a\d+$/.test(a.id)&&Array.isArray(a.cast)&&a.cast.length>=1&&a.cast.length<=2&&new Set(a.cast).size===a.cast.length&&a.cast.every(id=>person(id)&&run.relationships[id].introduced)&&world(a.world)&&MEET_KINDS[a.kind]&&Number.isInteger(a.day)&&a.day>=1&&a.day<=28&&a.day>=a.created&&Number.isInteger(a.slot)&&a.slot>=1&&a.slot<=3&&Number.isInteger(a.created)&&a.created>=1&&a.created<=run.day&&['proposed','confirmed','changing','attending','missed','completed','cancelled'].includes(a.status)&&Number.isInteger(a.changes)&&a.changes>=0&&a.changes<=2&&typeof a.resolved==='boolean'&&Array.isArray(a.history)&&a.history.length<=14&&a.history.length>0&&a.history[0].kind==='propose'&&a.history.every((h,i)=>h&&Number.isInteger(h.day)&&h.day>=a.created&&h.day<=run.day&&(!i||h.day>=a.history[i-1].day)&&['propose','confirm','cancel','boundary-cancel','miss','npc-change','reschedule','merge','merge-request','complete'].includes(h.kind)&&Number.isInteger(h.when)&&h.when>=1&&h.when<=28&&[1,2,3].includes(h.slot))&&(!a.suggested||Number.isInteger(a.suggested.day)&&a.suggested.day>=run.day&&a.suggested.day<=28&&[1,2,3].includes(a.suggested.slot));
  if(!run.appointments.every(valid))return false;
  if(run.appointments.some(a=>a.status==='completed'&&(!a.resolved||!a.history.some(h=>h.kind==='complete'))||a.status==='missed'&&!a.history.some(h=>h.kind==='miss')||['confirmed','attending','completed'].includes(a.status)&&a.cast.some(id=>!person(id)?.available.includes(a.day%7))))return false;
  if(new Set(run.appointments.map(a=>a.id)).size!==run.appointments.length)return false;
  return run.appointments.every((a,i)=>a.status!=='confirmed'||!run.appointments.some((b,j)=>j!==i&&b.status==='confirmed'&&at(b,a.day,a.slot)));
}
