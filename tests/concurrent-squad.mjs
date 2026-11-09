import fs from 'node:fs';
import ts from 'typescript';
import {DatabaseSync} from 'node:sqlite';
import assert from 'node:assert/strict';
import {sight,dist} from '../app/lib/mech.ts';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE rooms(code TEXT PRIMARY KEY,state TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 0,updated INTEGER NOT NULL)');
let serial=0,conflicts=0;
globalThis.__scrapTestEnv={DB:{prepare(sql){return{bind(...args){return {async first(){await sleep((serial++%4)+1);return db.prepare(sql).get(...args);},async run(){await sleep((serial++%4)+1);const r=db.prepare(sql).run(...args);if(sql.startsWith('UPDATE')&&!r.changes)conflicts++;return {meta:{changes:Number(r.changes)}};}};}}}}};
let src=fs.readFileSync(new URL('../app/api/mech/route.ts',import.meta.url),'utf8').replace('import {env} from "cloudflare:workers";','const env=globalThis.__scrapTestEnv;').replace('"../../lib/mech"',JSON.stringify(new URL('../app/lib/mech.ts',import.meta.url).href));
const js=ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {POST}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
let now=100000;const realNow=Date.now;Date.now=()=>now;
const tokens=Array.from({length:8},(_,i)=>(i+1).toString(16).repeat(48));let requests=0,errors=[];
async function post(i,action,extra={}){requests++;const r=await POST(new Request('https://test.invalid/api/mech',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:tokens[i],action,...extra})}));const d=await r.json();if(r.status!==200)errors.push({status:r.status,error:d.error});return {status:r.status,...d};}
let d=await post(0,'create',{name:'Pilot 1'});const room=d.room;
assert.equal(d.status,200);
const joins=await Promise.all(tokens.slice(1).map((_,i)=>post(i+1,'join',{name:`Pilot ${i+2}`,room})));assert(joins.every(j=>j.status===200));
d=await post(0,'start',{room});assert.equal(d.state.players.length,8);
const ids=[d.you,...joins.map(j=>j.you)];let s=d.state;const waves=[];let seen=0;
for(let step=0;step<2000&&!['victory','defeat'].includes(s.phase);step++){
 now+=250;
 const jobs=ids.map((id,i)=>{const p=s.players.find(q=>q.id===id);const vis=s.bots.filter(b=>sight(p,b)).sort((a,b)=>dist(p,a)-dist(p,b));const t=vis[(i+Math.floor(now/2000))%Math.min(3,vis.length)];return post(i,'sync',{room,x:p.x,y:p.y,a:t?Math.atan2(t.y-p.y,t.x-p.x):p.a,fire:!!t});});
 const replies=await Promise.all(jobs);assert(replies.every(j=>j.status===200),JSON.stringify(replies.filter(j=>j.status!==200)));
 const row=db.prepare('SELECT * FROM rooms WHERE code=?').get(room);s=JSON.parse(row.state);
 if(s.wave!==seen){seen=s.wave;waves.push({wave:s.wave,enemies:s.bots.length,seconds:(now-100000)/1000});}
 assert.equal(s.players.length,8);assert.equal(new Set(s.players.map(p=>p.id)).size,8);assert.equal(s.kills,s.players.reduce((n,p)=>n+p.kills,0));
 assert(s.players.every(p=>Number.isFinite(p.hp)&&p.hp>=0&&p.hp<=100&&p.heat>=0&&p.heat<=100));
}
assert.equal(s.phase,'victory',JSON.stringify({phase:s.phase,wave:s.wave,left:s.bots,core:s.core}));
assert.equal(s.kills,69);
assert(s.players.every(p=>p.kills>0));
assert(conflicts>0,'test must exercise simultaneous-write retries');
console.log(JSON.stringify({phase:s.phase,seconds:(now-100000)/1000,waves,kills:s.kills,byPilot:s.players.map(p=>p.kills),core:Math.round(s.core),requests,writeConflictsRetried:conflicts,httpErrors:errors},null,2));
Date.now=realNow;
