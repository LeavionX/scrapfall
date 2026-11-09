import { env } from "cloudflare:workers";
export const dynamic = "force-dynamic";
const reply=(data:any,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
const view=(s:any)=>({board:s.board,names:s.names,turn:s.turn,winner:s.winner,line:s.line,round:s.round,ready:s.tokens[1]!==null,votes:s.votes});
export async function GET(req:Request){
 const code=new URL(req.url).searchParams.get("room")?.toUpperCase();
 const row:any=await env.DB!.prepare("SELECT * FROM rooms WHERE code = ?").bind(code||"").first();
 if(!row)return reply({error:"Room not found. Check the code or create a new room."},404);
 return reply(view(JSON.parse(row.state)));
}
export async function POST(req:Request){try{
 const b=await req.json() as any;
 if(!/^[a-zA-Z0-9-]{20,80}$/.test(b.token||""))return reply({error:"Invalid player identity."},400);
 const name=String(b.name||"Player").trim().slice(0,20)||"Player";
 if(b.action==="create"){
  const code=crypto.randomUUID().replaceAll("-","").slice(0,8).toUpperCase();
  const s={board:Array(42).fill(0),names:[name,"Waiting for friend"],tokens:[b.token,null],turn:1,winner:0,line:[],round:1,votes:[]};
  await env.DB!.prepare("INSERT INTO rooms (code,state,revision,updated) VALUES (?,?,0,?)").bind(code,JSON.stringify(s),Date.now()).run();
  return reply({room:code,player:1,...view(s)});
 }
 const code=String(b.room||"").toUpperCase();
 const row:any=await env.DB!.prepare("SELECT * FROM rooms WHERE code = ?").bind(code).first();
 if(!row)return reply({error:"Room not found."},404);
 const s=JSON.parse(row.state);let player=s.tokens.indexOf(b.token)+1;
 if(b.action==="join"){
  if(!player){if(s.tokens[1])return reply({error:"This room already has two players."},409);s.tokens[1]=b.token;s.names[1]=name;player=2;}
 }else{
  if(!player)return reply({error:"Join this room before playing."},403);
  if(b.action==="move"){
   if(!s.tokens[1]||s.winner||s.turn!==player)return reply({error:"Wait for your turn."},409);
   const c=b.column;if(!Number.isInteger(c)||c<0||c>6)return reply({error:"Invalid column."},400);
   let r=5;while(r>=0&&s.board[r*7+c])r--;if(r<0)return reply({error:"That column is full."},409);
   s.board[r*7+c]=player;
   for(const [dr,dc] of [[1,0],[0,1],[1,1],[1,-1]]){
    const cells=[r*7+c];for(const sign of [-1,1]){let rr=r+dr*sign,cc=c+dc*sign;while(rr>=0&&rr<6&&cc>=0&&cc<7&&s.board[rr*7+cc]===player){cells.push(rr*7+cc);rr+=dr*sign;cc+=dc*sign;}}
    if(cells.length>=4){s.winner=player;s.line=cells;break;}
   }
   if(!s.winner&&s.board.every(Boolean))s.winner=3;
   if(!s.winner)s.turn=3-player;
  }else if(b.action==="rematch"){
   if(!s.winner)return reply({error:"Finish this round first."},409);
   if(!s.votes.includes(player))s.votes.push(player);
   if(s.votes.length===2){s.board=Array(42).fill(0);s.round++;s.turn=s.round%2?1:2;s.winner=0;s.line=[];s.votes=[];}
  }else return reply({error:"Unknown action."},400);
 }
 const result=await env.DB!.prepare("UPDATE rooms SET state=?,revision=revision+1,updated=? WHERE code=? AND revision=?").bind(JSON.stringify(s),Date.now(),code,row.revision).run();
 if(!result.meta.changes)return reply({error:"The room changed. Please try again."},409);
 return reply({room:code,player,...view(s)});
}catch{return reply({error:"Could not reach the game server. Please retry."},500);}}
