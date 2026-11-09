import assert from 'node:assert/strict';
import {createGame,apply,tick,publicGame,sight,MAP,clear,dist} from '../app/lib/mech.ts';
const tokens=Array.from({length:8},(_,i)=>(i+1).toString(16).repeat(48));
function path(from,to){
 const start=[Math.floor(from.x),Math.floor(from.y)],end=[Math.floor(to.x),Math.floor(to.y)],queue=[start],prev=new Map([[start.join(','),null]]);let found;
 for(let i=0;i<queue.length;i++){const [x,y]=queue[i];if(x===end[0]&&y===end[1]){found=[x,y];break;}for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const n=[x+dx,y+dy],k=n.join(',');if(!prev.has(k)&&clear(n[0]+.5,n[1]+.5)){prev.set(k,[x,y]);queue.push(n);}}}
 if(!found)return from;let n=found;while(prev.get(n.join(','))&&prev.get(n.join(',')).join(',')!==start.join(','))n=prev.get(n.join(','));return {x:n[0]+.5,y:n[1]+.5};
}
function input(s,p,i,now){
 const visible=s.bots.filter(b=>sight(p,b)).sort((a,b)=>dist(p,a)-dist(p,b));let target=visible[(i+Math.floor(now/2000))%Math.min(visible.length,3)];let dest=p;
 if(!target&&s.bots.length){target=[...s.bots].sort((a,b)=>dist(p,a)-dist(p,b))[0];dest=path(p,target);}
 else if(target&&dist(p,target)>12)dest=path(p,target);
 const d=dist(p,dest),step=Math.min(.85,d);return {action:'sync',x:p.x+(dest.x-p.x)/Math.max(d,.001)*step,y:p.y+(dest.y-p.y)/Math.max(d,.001)*step,a:target?Math.atan2(target.y-p.y,target.x-p.x):p.a,fire:!!target&&sight(p,target)};
}
function invariants(s){assert.equal(s.players.length,8);assert(s.core>=0&&s.core<=600);assert.equal(s.kills,s.players.reduce((n,p)=>n+p.kills,0));for(const p of s.players){for(const k of ['x','y','hp','heat','a'])assert(Number.isFinite(p[k]),`${k} NaN`);assert(p.hp>=0&&p.hp<=100);assert(p.heat>=0&&p.heat<=100);assert(clear(p.x,p.y),`pilot inside cover ${p.x},${p.y}`);}for(const b of s.bots){assert(b.hp>0);assert(clear(b.x,b.y));}assert(!JSON.stringify(publicGame(s)).includes('"token"'));}
const result=[];
for(let run=0;run<5;run++){
 let now=100000;const s=createGame(tokens[0],'Pilot 1',now);tokens.slice(1).forEach((t,i)=>apply(s,t,{action:'join',name:`Pilot ${i+2}`},now));apply(s,tokens[0],{action:'start'},now);
 const waves=[],seen=new Set(),peak={heat:0},hp=s.players.map(()=>100);let deaths=0,shots=0;
 for(let step=0;step<2400&&!['victory','defeat'].includes(s.phase);step++){
  now+=250;tick(s,now);if(!seen.has(s.wave)){seen.add(s.wave);waves.push({wave:s.wave,enemies:s.bots.length,seconds:(now-100000)/1000});}
  // Rotating request order approximates eight independent clients.
  for(let j=0;j<8;j++){const i=(j+step+run)%8,p=s.players[i],previous=p.shotAt;apply(s,tokens[i],input(s,p,i+run,now),now);if(p.shotAt!==previous)shots++;if(hp[i]>0&&p.hp<=0)deaths++;hp[i]=p.hp;peak.heat=Math.max(peak.heat,p.heat);}
  invariants(s);
 }
 assert.equal(s.phase,'victory',JSON.stringify({run,phase:s.phase,wave:s.wave,bots:s.bots,core:s.core}));assert.equal(s.kills,69);assert(s.players.every(p=>p.kills>0),'all eight should participate');
 result.push({run:run+1,phase:s.phase,seconds:(now-100000)/1000,waves,kills:s.kills,byPilot:s.players.map(p=>p.kills),core:Math.round(s.core),shots,deaths,peakHeat:peak.heat});
}
console.log(JSON.stringify({matches:result},null,2));
