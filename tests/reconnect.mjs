import assert from 'node:assert/strict';
import {createGame,apply,tick} from '../app/lib/mech.ts';
const tokens=Array.from({length:8},(_,i)=>(i+1).toString(16).repeat(48));
let now=100000;const s=createGame(tokens[0],'Leader',now);tokens.slice(1).forEach((t,i)=>apply(s,t,{action:'join',name:`Pilot ${i+2}`},now));
const original=s.players[0].id;now+=10000;apply(s,tokens[0],{action:'join'},now);assert.equal(s.players.length,8);assert.equal(s.players[0].id,original,'short disconnect restores the existing seat');
for(let i=0;i<92;i++){now+=1000;for(const t of tokens.slice(1))apply(s,t,{action:'sync'},now);tick(s,now);}
assert.equal(s.players.length,7);assert.equal(s.host,s.players[0].id);assert.notEqual(s.host,original,'inactive leader passes control to an active pilot');
const rejoined=apply(s,tokens[0],{action:'join',name:'Returning leader'},now);assert.equal(s.players.length,8);assert.notEqual(rejoined.id,original);assert.equal(new Set(s.players.map(p=>p.id)).size,8);
const lose=createGame(tokens[0],'Leader',100000);tokens.slice(1).forEach(t=>apply(lose,t,{action:'join'},100000));apply(lose,tokens[0],{action:'start'},100000);
let deaths=0,respawns=0,previous=lose.players.map(p=>p.hp),time=100000;
for(let step=0;step<2400&&lose.phase!=='defeat';step++){
 time+=250;tick(lose,time);
 lose.players.forEach((p,i)=>{if(previous[i]>0&&p.hp<=0)deaths++;if(previous[i]<=0&&p.hp>0)respawns++;previous[i]=p.hp;apply(lose,tokens[i],{action:'sync'},time);});
}
assert.equal(lose.phase,'defeat');assert.equal(lose.core,0);assert(deaths>0);assert(respawns>0);
console.log(JSON.stringify({reconnect:'passed',expiredSeatRecovery:'passed',leaderTransfer:'passed',naturalDefeat:{seconds:(time-100000)/1000,deaths,respawns,core:lose.core}},null,2));
