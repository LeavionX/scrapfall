import {env} from "cloudflare:workers";
import {apply,createGame,publicGame,tick} from "../../lib/mech";
export const dynamic="force-dynamic";
const out=(data:any,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
export async function POST(req:Request){try{
 const b=await req.json() as any;
 if(!/^[a-f0-9]{48}$/.test(b.token||""))return out({error:"Invalid pilot identity. Refresh and try again."},400);
 const now=Date.now();
 if(b.action==="create"){
  const room=crypto.randomUUID().replaceAll("-","").slice(0,8).toUpperCase(),s=createGame(b.token,String(b.name||"Pilot"),now);
  await env.DB!.prepare("INSERT INTO rooms(code,state,revision,updated) VALUES(?,?,0,?)").bind(room,JSON.stringify(s),now).run();
  return out({room,you:s.players[0].id,state:publicGame(s)});
 }
 const room=String(b.room||"").trim().toUpperCase();
 for(let attempt=0;attempt<8;attempt++){
  const row:any=await env.DB!.prepare("SELECT * FROM rooms WHERE code=?").bind(room).first();
  if(!row)return out({error:"Room not found. Check the code."},404);
  const s=JSON.parse(row.state);if(s.kind!=="scrapfall")return out({error:"This is an old Neon Four room. Create a new squad."},400);
  tick(s,now);let p;try{p=apply(s,b.token,b,now);}catch(e:any){return out({error:e.message},409);}
  const res=await env.DB!.prepare("UPDATE rooms SET state=?,revision=revision+1,updated=? WHERE code=? AND revision=?").bind(JSON.stringify(s),s.tick,room,row.revision).run();
  if(res.meta.changes)return out({room,you:p.id,state:publicGame(s)});
 }
 return out({error:"Radio busy. Retrying…"},503);
}catch{return out({error:"Uplink unavailable. Retrying…"},500);}}
