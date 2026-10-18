import { PEOPLE } from './data.js';
export const freshLedger=(day=1)=>({day,gains:{},messages:{}});
export function relationChange(run,npc,effects={},passive=false){
  const r=run.relationships[npc],ledger=run.relationLedger?.day===run.day?run.relationLedger:freshLedger(run.day);
  if(!r)return {};
  return Object.fromEntries(Object.entries(effects).map(([key,n])=>{
    if(!['trust','affection','tension'].includes(key))return [key,0];
    let delta=n;
    if(n>0&&key!=='tension'){
      if(r[key]>60)delta=Math.floor(n*(100-r[key])/40);
      const cap=key==='trust'?14:10,used=ledger.gains[npc]?.[key]||0;
      delta=Math.min(delta,Math.max(0,cap-used));
      if(passive)delta=Math.min(delta,Math.max(0,(key==='trust'?2:1)-(ledger.messages[npc]?.[key]||0)));
    }
    return [key,Math.max(0,Math.min(100,r[key]+delta))-r[key]];
  }));
}
export function recordRelationGain(run,npc,effects,passive=false){
  if(!run.relationLedger||run.relationLedger.day!==run.day)run.relationLedger=freshLedger(run.day);
  for(const [key,n] of Object.entries(effects))if(n>0&&['trust','affection'].includes(key)){
    const entry=run.relationLedger.gains[npc]||={trust:0,affection:0};entry[key]+=n;
    if(passive){const message=run.relationLedger.messages[npc]||={trust:0,affection:0};message[key]+=n;}
  }
}
export function validLedger(run){const x=run.relationLedger;if(!x||!Number.isInteger(x.day)||x.day<1||x.day>run.day)return false;return ['gains','messages'].every(key=>x[key]&&typeof x[key]==='object'&&!Array.isArray(x[key])&&Object.keys(x[key]).length<=6&&Object.entries(x[key]).every(([id,v])=>PEOPLE.some(p=>p.id===id)&&v&&['trust','affection'].every(k=>Number.isInteger(v[k])&&v[k]>=0&&v[k]<=(key==='gains'?(k==='trust'?14:10):(k==='trust'?2:1)))));}
