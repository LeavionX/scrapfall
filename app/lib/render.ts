import {MAP,wall,CORE} from './mech';
const W=640,H=360,FOV=1.12;
const sprites=new Map<string,HTMLCanvasElement>();
function mech(color:string,heavy=false){
 const key=color+heavy;if(sprites.has(key))return sprites.get(key)!;
 const c=document.createElement('canvas');c.width=128;c.height=160;const g=c.getContext('2d')!;
 const box=(x:number,y:number,w:number,h:number,fill:string)=>{g.fillStyle=fill;g.fillRect(x,y,w,h);};
 g.fillStyle='#0007';g.beginPath();g.ellipse(64,149,43,8,0,0,Math.PI*2);g.fill();
 // Reverse-jointed legs and oversized armored feet.
 for(const x of [31,76]){box(x+6,87,15,28,'#20262a');box(x+2,92,23,20,'#59615b');box(x+5,112,17,25,'#2c3434');box(x,130,28,15,'#151d1f');box(x+2,129,24,6,color);box(x+4,102,18,4,'#101819');box(x+9,116,6,15,'#82918b');}
 box(30,49,68,48,'#151d20');box(34,48,60,43,color);box(40,51,48,28,'#2d393c');box(48,53,32,7,'#111c20');box(51,54,26,3,color==='#8bbfb4'?'#b5ffe2':'#ff4e24');
 box(43,64,42,14,'#1d292b');for(let x=46;x<85;x+=7)box(x,66,3,10,'#64736a');box(40,84,48,8,'#525e59');box(60,80,8,8,'#efbd61');
 // Broad shoulder pods, pistons and heavy weapon arms.
 for(const x of [10,91]){box(x,45,28,24,'#202a2c');box(x+2,43,24,20,color);box(x+5,47,18,3,'#b7baa0');box(x+8,68,12,17,'#7c8981');box(x+3,78,23,32,'#202a2c');box(x+6,80,17,21,'#4a5755');box(x+9,96,12,18,'#111b1d');box(x+11,102,8,7,'#ed8a35');}
 box(44,30,40,17,'#182428');box(47,28,34,15,color);box(51,33,26,5,'#11191d');box(54,34,20,2,'#ffcf75');box(82,12,2,27,'#6a7770');box(81,11,4,3,'#f79744');
 if(heavy){for(let x=13;x<35;x+=7){box(x,29,5,13,'#293331');box(x+1,29,3,3,'#ff6343');}box(10,41,29,5,'#697165');box(87,37,32,7,'#323d37');box(108,32,10,11,'#222d28');}
 for(const [x,y]of [[39,49],[86,49],[14,47],[110,47],[34,96],[89,96]])box(x,y,2,2,'#d1cfab');
 sprites.set(key,c);return c;
}
function coreSprite(){const key='core';if(sprites.has(key))return sprites.get(key)!;const c=document.createElement('canvas');c.width=128;c.height=160;const g=c.getContext('2d')!;g.fillStyle='#15262a';g.fillRect(23,100,82,43);g.fillStyle='#5b7773';g.fillRect(29,94,70,37);g.fillStyle='#172c30';g.fillRect(37,53,54,62);g.fillStyle='#78f4c0';g.fillRect(46,61,36,44);g.fillStyle='#d2ffe0';g.fillRect(58,62,9,42);g.fillStyle='#233a3c';g.fillRect(31,47,66,13);g.fillRect(45,30,38,18);g.fillStyle='#a8dfb8';g.fillRect(53,34,22,7);sprites.set(key,c);return c;}
function wreckSprite(){
 const key='wreck';if(sprites.has(key))return sprites.get(key)!;const c=document.createElement('canvas');c.width=128;c.height=160;const g=c.getContext('2d')!;
 const box=(x:number,y:number,w:number,h:number,fill:string)=>{g.fillStyle=fill;g.fillRect(x,y,w,h);};
 for(const y of [111,91,72]){box(14,y,101,15,'#483c2b');box(19,y-5,75,9,y===91?'#98754b':'#7f4f35');box(31,y-14,46,11,'#3a4e4c');box(35,y-12,18,7,'#192c2d');box(56,y-12,15,7,'#20302c');for(const x of [25,89]){box(x,y+5,13,13,'#131e1d');box(x+4,y+9,5,5,'#5c6754');}box(14,y+1,7,4,'#bbab70');box(108,y+1,7,3,'#85563d');}
 for(const [x,y] of [[8,128],[20,135],[89,138],[105,126]]){box(x,y,15,12,'#152320');box(x+4,y+3,7,6,'#474d38');}box(45,132,39,7,'#64725d');box(52,139,14,5,'#a87a48');
 sprites.set(key,c);return c;
}
export type Camera={x:number,y:number,a:number,walk:number,flash:number,damage:number};
export function render(canvas:HTMLCanvasElement,cam:Camera,s:any,you:string,time:number){
 const g=canvas.getContext('2d',{alpha:false})!;if(canvas.width!==W){canvas.width=W;canvas.height=H;}g.imageSmoothingEnabled=false;
 const horizon=153+Math.sin(cam.walk*7)*1.4;
 const sky=g.createLinearGradient(0,0,0,horizon);sky.addColorStop(0,'#30383a');sky.addColorStop(.75,'#b5966b');sky.addColorStop(1,'#e4b77c');g.fillStyle=sky;g.fillRect(0,0,W,H);
 // Dusty sun, industrial skyline, power cables and derelict cranes.
 const shift=cam.a*150;
 g.fillStyle='#e5c58a';g.beginPath();g.arc(((510-shift)%1000+1000)%1000-150,65,26,0,Math.PI*2);g.fill();
 for(let i=-3;i<20;i++){const x=((i*97-shift*.7)%1100+1100)%1100-180;g.fillStyle='#635e50';g.fillRect(x,113-(i%3)*12,64,45);g.fillRect(x+13,91-(i%4)*12,11,60);g.strokeStyle='#4b5149';g.lineWidth=3;g.beginPath();g.moveTo(x+70,151);g.lineTo(x+70,41);g.lineTo(x+130,54);g.lineTo(x+49,54);g.moveTo(x+116,54);g.lineTo(x+116,105);g.stroke();}
 const floor=g.createLinearGradient(0,horizon,0,H);floor.addColorStop(0,'#716449');floor.addColorStop(1,'#292c29');g.fillStyle=floor;g.fillRect(0,horizon,W,H-horizon);
 // Deterministic ground flecks form receding seams in the dirt.
 for(let y=Math.ceil(horizon)+3;y<H;y+=3){const d=180/(y-horizon);g.fillStyle=y%2?'#383c323d':'#a19a6d22';for(let j=0;j<25;j++){const world=(j*1.37+Math.floor(d*5)*.71+cam.x*.7+cam.y*.5);const x=((world*91+cam.a*90)%W+W)%W;g.fillRect(x,y,Math.max(1,(y-horizon)*.035),1);}}
 const z=new Float32Array(W);
 for(let x=0;x<W;x+=2){const angle=cam.a+Math.atan((2*x/W-1)*Math.tan(FOV/2));const dx=Math.cos(angle),dy=Math.sin(angle);let mx=Math.floor(cam.x),my=Math.floor(cam.y);const ddx=Math.abs(1/dx),ddy=Math.abs(1/dy);const sx=dx<0?-1:1,sy=dy<0?-1:1;let tx=(dx<0?cam.x-mx:mx+1-cam.x)*ddx,ty=(dy<0?cam.y-my:my+1-cam.y)*ddy;let side=0,type=0;
  for(let i=0;i<60;i++){if(tx<ty){tx+=ddx;mx+=sx;side=0;}else{ty+=ddy;my+=sy;side=1;}type=MAP[my]?.[mx]??1;if(type)break;}
  const raw=side?ty-ddy:tx-ddx,d=Math.max(.1,raw*Math.cos(angle-cam.a));z[x]=z[x+1]=d;const height=H*.95/d,top=horizon-height/2;
  const hit=(side?cam.x+raw*dx:cam.y+raw*dy);const u=hit-Math.floor(hit);const shade=Math.max(.18,1-d/30)*(side?.74:1);
  const base=type===1?[109,112,92]:type===2?[147,87,46]:[77,107,104];const stripe=Math.floor(u*12)%4===0?.62:1;g.fillStyle=`rgb(${base.map(v=>Math.floor(v*shade*stripe)).join(',')})`;g.fillRect(x,top,2,height);
  // Welded metal ribs, hazard bands and layers of crushed cars.
  if(type===2){for(let k=1;k<5;k++){g.fillStyle='#211d1955';g.fillRect(x,top+height*k/5,2,Math.max(1,height*.025));}if(u<.15||u>.87){g.fillStyle='#c3a45b66';g.fillRect(x,top+height*.18,2,height*.1);}}
  if(type===3){g.fillStyle='#182b2b88';g.fillRect(x,top+height*.16,2,height*.08);g.fillRect(x,top+height*.76,2,height*.045);}
  if(type===1){g.fillStyle='#252f2944';g.fillRect(x,top+height*.08,2,height*.12);}
  g.fillStyle='#e7b07533';g.fillRect(x,top,2,1);g.fillStyle='#0003';g.fillRect(x,top+height-3,2,3);
 }
 const entities:any[]=[...[[3,7.5],[20.5,8.5],[7,14.5],[16,18],[18,3],[3,20]].map(([x,y])=>({x,y,kind:'wreck',id:'wreck'})),{...CORE,kind:'core',id:'core'},...(s?.bots||[]).map((b:any)=>({...b,kind:'bot'})),...(s?.players||[]).filter((p:any)=>p.id!==you&&p.hp>0&&time-p.seen<15000).map((p:any)=>({...p,kind:'friend'}))];
 entities.sort((a,b)=>Math.hypot(b.x-cam.x,b.y-cam.y)-Math.hypot(a.x-cam.x,a.y-cam.y));
 for(const e of entities){const dx=e.x-cam.x,dy=e.y-cam.y;const depth=dx*Math.cos(cam.a)+dy*Math.sin(cam.a);if(depth<.25)continue;const lateral=-dx*Math.sin(cam.a)+dy*Math.cos(cam.a);const cx=W/2+lateral/depth*W/(2*Math.tan(FOV/2));const h=Math.min(1300,H*1.35/depth),w=h*.8;const left=cx-w/2,top=horizon-h*.64;if(left>W||left+w<0)continue;
  const sprite=e.kind==='wreck'?wreckSprite():e.kind==='core'?coreSprite():mech(e.kind==='friend'?'#8bbfb4':e.heavy?'#9e6951':'#a1a076',e.heavy);const stride=e.kind==='bot'?Math.sin(time*.006+e.id)*Math.min(3,h*.025):0;
  for(let xx=Math.max(0,Math.floor(left));xx<Math.min(W,left+w);xx++){if(depth<z[xx]+.1){const src=Math.min(127,Math.max(0,Math.floor((xx-left)/w*128)));g.drawImage(sprite,src,0,1,160,xx,top+stride,1,h);}}
  if(e.kind!=='wreck'&&depth<z[Math.min(W-1,Math.max(0,Math.floor(cx)))]+.2&&cx>0&&cx<W){g.font='bold 7px monospace';g.textAlign='center';g.fillStyle=e.kind==='friend'?'#a7ffe3':e.kind==='core'?'#a7ffe3':'#ffc277';g.fillText(e.kind==='friend'?e.name:e.kind==='core'?'SALVAGE CORE':e.heavy?'SIEGE WALKER':'SCRAP HOUND',cx,top-7);if(e.kind==='bot'){g.fillStyle='#151c1b';g.fillRect(cx-14,top-3,28,2);g.fillStyle='#ff8854';g.fillRect(cx-14,top-3,28*Math.max(0,e.hp)/(e.heavy?140:70),2);}
   if((e.kind==='bot'&&time-e.fire<180)||(e.kind==='friend'&&time-e.shotAt<180)){g.strokeStyle='#ff6537aa';g.lineWidth=1;g.beginPath();g.moveTo(cx+w*.3,top+h*.6);g.lineTo(W*.5,H*.83);g.stroke();}
  }
 }
 // Cockpit frame. Weapon housings bob with the mech's gait.
 const bob=Math.sin(cam.walk*7)*3,fire=time-cam.flash<110;
 for(const side of [-1,1]){g.save();if(side===1){g.translate(W,0);g.scale(-1,1);}g.fillStyle='#10191b';g.beginPath();g.moveTo(0,0);g.lineTo(30,0);g.lineTo(70,94);g.lineTo(44,98);g.closePath();g.fill();g.fillStyle='#56605a';g.fillRect(19,0,4,41);g.fillStyle='#192226';g.beginPath();g.moveTo(0,H);g.lineTo(0,310);g.lineTo(120,275+bob);g.lineTo(179,291+bob);g.lineTo(206,H);g.fill();g.fillStyle='#4d5753';g.fillRect(106,284+bob,50,11);g.fillStyle='#202d30';g.fillRect(121,250+bob,31,51);g.fillStyle='#65716a';g.fillRect(123,244+bob,26,10);g.fillStyle='#0c171a';g.fillRect(127,245+bob,18,6);g.fillStyle='#a89d60';g.fillRect(97,310+bob,64,8);g.fillStyle='#152024';g.fillRect(93,318+bob,76,42);g.fillStyle='#a4d3b6';for(let i=0;i<4;i++)g.fillRect(100+i*13,324+bob,7,2);if(fire){g.fillStyle='#fff0ab';g.beginPath();g.moveTo(123,244+bob);g.lineTo(110,220);g.lineTo(130,224);g.lineTo(136,202);g.lineTo(143,227);g.lineTo(159,216);g.lineTo(149,244+bob);g.fill();g.strokeStyle='#fff4a5';g.lineWidth=2;g.beginPath();g.moveTo(137,239);g.lineTo(W/2,154);g.stroke();}g.restore();}
 g.strokeStyle='#b9e9cb';g.lineWidth=1;g.beginPath();g.moveTo(310,horizon);g.lineTo(317,horizon);g.moveTo(323,horizon);g.lineTo(330,horizon);g.moveTo(320,horizon-10);g.lineTo(320,horizon-3);g.moveTo(320,horizon+3);g.lineTo(320,horizon+10);g.stroke();
 // Radar: same authoritative layout as the world.
 const rx=20,ry=H-95,scale=2.7;g.fillStyle='#081b1bd9';g.fillRect(rx-4,ry-4,73,73);for(let y=0;y<24;y++)for(let x=0;x<24;x++)if(MAP[y][x]){g.fillStyle='#385147';g.fillRect(rx+x*scale,ry+y*scale,scale,scale);}g.fillStyle='#a2f3c0';g.fillRect(rx+CORE.x*scale-2,ry+CORE.y*scale-2,4,4);for(const b of s?.bots||[]){g.fillStyle='#ed8b50';g.fillRect(rx+b.x*scale-1,ry+b.y*scale-1,2,2);}g.fillStyle='#e6ffdc';g.beginPath();g.arc(rx+cam.x*scale,ry+cam.y*scale,2,0,Math.PI*2);g.fill();g.strokeStyle='#d9f8d0';g.beginPath();g.moveTo(rx+cam.x*scale,ry+cam.y*scale);g.lineTo(rx+(cam.x+Math.cos(cam.a)*2)*scale,ry+(cam.y+Math.sin(cam.a)*2)*scale);g.stroke();
 if(time-cam.damage<250){g.fillStyle='#ff3d242c';g.fillRect(0,0,W,H);}
 const vignette=g.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,W*.65);vignette.addColorStop(0,'#0000');vignette.addColorStop(1,'#000b');g.fillStyle=vignette;g.fillRect(0,0,W,H);
}
