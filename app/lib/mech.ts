export const SIZE=24;
export const CORE={x:12.5,y:12.5};
export const MAP=Array.from({length:SIZE},(_,y)=>Array.from({length:SIZE},(_,x)=>{
 if(x===0||y===0||x===23||y===23)return 1;
 if((x>=4&&x<=7&&y>=4&&y<=5)||(x>=16&&x<=19&&y>=18&&y<=19))return 2;
 if((x>=17&&x<=19&&y>=5&&y<=7)||(x>=4&&x<=6&&y>=16&&y<=18))return 3;
 if((x===10&&y>=5&&y<=7)||(y===16&&x>=10&&x<=12)||(x===16&&y>=11&&y<=13)||(x===8&&y>=10&&y<=12))return 2;
 return 0;
}));
export const wall=(x:number,y:number)=>MAP[Math.floor(y)]?.[Math.floor(x)]??1;
export const clear=(x:number,y:number)=>!wall(x-.22,y-.22)&&!wall(x+.22,y-.22)&&!wall(x-.22,y+.22)&&!wall(x+.22,y+.22);
export const dist=(a:any,b:any)=>Math.hypot(a.x-b.x,a.y-b.y);
export function sight(a:any,b:any){const d=dist(a,b);for(let t=.15;t<d;t+=.15)if(wall(a.x+(b.x-a.x)*t/d,a.y+(b.y-a.y)*t/d))return false;return true;}
export type Pilot={id:string,token:string,name:string,x:number,y:number,a:number,hp:number,heat:number,kills:number,seen:number,moveAt:number,shotAt:number,deadAt:number};
export type Bot={id:number,x:number,y:number,hp:number,heavy:boolean,fire:number};
export type Game={kind:string,phase:string,host:string,players:Pilot[],bots:Bot[],wave:number,core:number,kills:number,tick:number,next:number,seed:number,shots:any[]};
export function pilot(token:string,name:string,now:number,index=0):Pilot{return {id:crypto.randomUUID(),token,name:name.trim().slice(0,18)||"Pilot",x:11.3+index%3*.7,y:14+Math.floor(index/3)*.7,a:-Math.PI/2,hp:100,heat:0,kills:0,seen:now,moveAt:now,shotAt:0,deadAt:0};}
export function createGame(token:string,name:string,now:number):Game{const p=pilot(token,name,now);return{kind:"scrapfall",phase:"lobby",host:p.id,players:[p],bots:[],wave:0,core:600,kills:0,tick:now,next:0,seed:0,shots:[]};}
export function spawn(s:Game,now:number){s.wave++;s.phase="battle";s.bots=[];const active=s.players.filter(p=>now-p.seen<15000).length;const count=5+s.wave*2+Math.max(0,active-1)*2;const points=[[2.5,2.5],[21.5,2.5],[21.5,21.5],[2.5,21.5],[12.5,2.5],[21.5,12.5],[2.5,12.5],[12.5,21.5]];for(let i=0;i<count;i++){const a=points[i%points.length];s.bots.push({id:++s.seed,x:a[0]+(Math.floor(i/8)%2)*.65,y:a[1],hp:s.wave===3&&i%3===0?140:70,heavy:s.wave===3&&i%3===0,fire:0});}}
function walk(p:any,dx:number,dy:number){if(clear(p.x+dx,p.y))p.x+=dx;if(clear(p.x,p.y+dy))p.y+=dy;}
// Shared distance fields let all walkers route around scrap without trapping a wave.
function waypoint(from:any,target:any,cache:Map<string,Int16Array>){
 const tx=Math.floor(target.x),ty=Math.floor(target.y),key=tx+","+ty;
 let field=cache.get(key);
 if(!field){
  field=new Int16Array(SIZE*SIZE).fill(-1);const queue=[ty*SIZE+tx];field[queue[0]]=0;
  for(let i=0;i<queue.length;i++){const cell=queue[i],x=cell%SIZE,y=Math.floor(cell/SIZE);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,n=ny*SIZE+nx;if(nx>=0&&nx<SIZE&&ny>=0&&ny<SIZE&&!MAP[ny][nx]&&field[n]===-1){field[n]=field[cell]+1;queue.push(n);}}}
  cache.set(key,field);
 }
 const x=Math.floor(from.x),y=Math.floor(from.y);let best=field[y*SIZE+x],goal={x:x+.5,y:y+.5};
 for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,n=ny*SIZE+nx;if(nx>=0&&nx<SIZE&&ny>=0&&ny<SIZE&&field[n]>=0&&(best<0||field[n]<best)){best=field[n];goal={x:nx+.5,y:ny+.5};}}
 return goal;
}
export function tick(s:Game,now:number){now=Math.max(now,s.tick);const dt=Math.min(.5,Math.max(0,(now-s.tick)/1000));s.tick=now;s.shots=s.shots.filter(x=>now-x.at<650);
 s.players=s.players.filter(p=>now-p.seen<90000);if(!s.players.some(p=>p.id===s.host))s.host=s.players[0]?.id||"";
 if(s.phase!=="battle"&&s.phase!=="intermission")return;
 for(const p of s.players){p.heat=Math.max(0,p.heat-dt*24);if(p.hp<=0&&now-p.deadAt>6000){p.hp=100;p.x=11.5;p.y=14.5;s.core=Math.max(0,s.core-25);}else if(p.hp>0&&dist(p,CORE)<2.6)p.hp=Math.min(100,p.hp+dt*12);}
 if(s.core<=0){s.phase="defeat";return;}
 if(s.phase==="intermission"){if(now>=s.next)spawn(s,now);return;}
 const routes=new Map<string,Int16Array>();
 for(const b of s.bots){const live=s.players.filter(p=>p.hp>0&&now-p.seen<15000);let target:any=CORE;let nearest=8;for(const p of live){const d=dist(b,p);if(d<nearest){target=p;nearest=d;}}
  const d=dist(b,target),dx=(target.x-b.x)/Math.max(.01,d),dy=(target.y-b.y)/Math.max(.01,d);const speed=b.heavy?.55:.85;
  if(d>1.2){
   const ox=b.x,oy=b.y;
   const moveToward=(goal:any)=>{const length=Math.hypot(goal.x-b.x,goal.y-b.y),step=Math.min(speed*dt,length);if(length>.001)walk(b,(goal.x-b.x)/length*step,(goal.y-b.y)/length*step);};
   if(sight(b,target))moveToward(target);else moveToward(waypoint(b,target,routes));
   if(Math.hypot(b.x-ox,b.y-oy)<speed*dt*.2)moveToward(waypoint(b,target,routes));
  }
  if(target===CORE&&d<2)s.core=Math.max(0,s.core-dt*(b.heavy?14:9));
  else if(target!==CORE&&d<8&&sight(b,target)){target.hp=Math.max(0,target.hp-dt*(b.heavy?8:4));b.fire=now;if(target.hp<=0)target.deadAt=now;}
 }
 if(s.core<=0)s.phase="defeat";
 else if(s.bots.length===0){if(s.wave>=3)s.phase="victory";else{s.phase="intermission";s.next=now+6000;s.players.forEach(p=>{if(p.hp>0)p.hp=Math.min(100,p.hp+30);});}}
}
export function apply(s:Game,token:string,input:any,now:number){
 now=Math.max(now,s.tick);
 let p=s.players.find(p=>p.token===token);
 if(input.action==="join"){
  if(p){p.seen=now;return p;}
  if(s.players.length>=8)throw Error("Squad full. This room has eight pilots.");
  p=pilot(token,String(input.name||"Pilot"),now,s.players.length);s.players.push(p);return p;
 }
 if(!p)throw Error("Your seat expired. Rejoin the room to continue.");p.seen=now;
 if(input.action==="start"){
  if(p.id!==s.host)throw Error("Only the squad leader can start the operation.");
  if(!["lobby","victory","defeat"].includes(s.phase))throw Error("An operation is already running.");
  s.wave=0;s.core=600;s.kills=0;s.players.forEach((q,i)=>Object.assign(q,{hp:100,heat:0,kills:0,x:11.3+i%3*.7,y:14+Math.floor(i/3)*.7,a:-Math.PI/2}));spawn(s,now);return p;
 }
 if(input.action!=="sync")throw Error("Unknown action.");
 if(Number.isFinite(input.a))p.a=input.a%(Math.PI*2);
 const elapsed=Math.min(.7,Math.max(.05,(now-p.moveAt)/1000));p.moveAt=now;
 if(p.hp>0&&["battle","intermission","lobby"].includes(s.phase)){
  if(Number.isFinite(input.x)&&Number.isFinite(input.y)){
   let dx=input.x-p.x,dy=input.y-p.y;const d=Math.hypot(dx,dy),limit=4.3*elapsed+.08;if(d>limit){dx*=limit/d;dy*=limit/d;}
   const n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/.12));for(let i=0;i<n;i++)walk(p,dx/n,dy/n);
  }
 }
 if(input.fire&&p.hp>0&&s.phase==="battle"&&now-p.shotAt>=320&&p.heat<=75){
  p.shotAt=now;p.heat+=25;s.shots.push({id:p.id,x:p.x,y:p.y,a:p.a,at:now});
  let hit:Bot|undefined;let best=25;for(const b of s.bots){const d=dist(p,b),angle=Math.atan2(b.y-p.y,b.x-p.x);let diff=angle-p.a;diff=Math.atan2(Math.sin(diff),Math.cos(diff));if(Math.abs(diff)<Math.atan2(.48,d)&&d<best&&sight(p,b)){hit=b;best=d;}}
  if(hit){hit.hp-=35;if(hit.hp<=0){s.bots=s.bots.filter(b=>b!==hit);p.kills++;s.kills++;}}
 }
 return p;
}
export function publicGame(s:Game){return {...s,players:s.players.map(({token,moveAt,...p})=>p)};}
