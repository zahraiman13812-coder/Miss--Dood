import { NextRequest,NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { db,transaction } from "@/lib/db";
import { bad,errorResponse,noStore,sameOrigin } from "@/lib/http";
export const runtime="nodejs";
export async function GET(){
 try { if((await currentUser())?.role!=="admin")return bad("FORBIDDEN",403);
 const [users,events]=await Promise.all([
 db().query("SELECT id,email,full_name,role,created_at FROM users ORDER BY created_at DESC LIMIT 500"),
 db().query("SELECT a.created_at,a.action,a.target,u.email AS actor FROM admin_audit_log a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT 60")]);
 return NextResponse.json({users:users.rows,events:events.rows},{headers:noStore});
 }catch(e){return errorResponse(e)}
}
export async function PATCH(req:NextRequest){
 try {
 if(!sameOrigin(req))return bad("CROSS_ORIGIN",403);
 const actor=await currentUser();if(actor?.role!=="admin")return bad("FORBIDDEN",403);
 const body:unknown=await req.json();if(!body||typeof body!=="object"||Array.isArray(body))return bad("INVALID_BODY");
 const {email,role} = body as {email:unknown;role:unknown};
 if(typeof email!=="string"||!/^\S+@\S+\.\S+$/.test(email)||email.length>254||!(["admin","customer"] as unknown[]).includes(role))return bad("INVALID_ROLE");
 const normalized=email.trim().toLowerCase();
 // Lock the users table to serialize admin role changes and prevent removing the last admin.
 const result=await transaction(async client=>{
  await client.query("LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE");
  const target=await client.query<{id:string;role:string}>("SELECT id,role FROM users WHERE lower(email)=$1",[normalized]);
  if(target.rowCount!==1)return "NOT_FOUND";
  if(target.rows[0].id===actor.id&&role!=="admin")return "SELF_DEMOTION";
  if(target.rows[0].role==="admin"&&role!=="admin"){
    const c=await client.query<{count:string}>("SELECT count(*)::text AS count FROM users WHERE role='admin'");
    if(Number(c.rows[0].count)<=1)return "LAST_ADMIN";
  }
  await client.query("UPDATE users SET role=$1 WHERE id=$2",[role,target.rows[0].id]);
  await client.query("INSERT INTO admin_audit_log(actor_id,action,target) VALUES($1,$2,$3)",[actor.id,"user.role."+role,normalized]);
  return "OK";
 });
 if(result!=="OK")return bad(result,result==="NOT_FOUND"?404:409);
 return NextResponse.json({ok:true},{headers:noStore});
 }catch(e){if(e instanceof SyntaxError)return bad("INVALID_JSON");return errorResponse(e)}
}
