import {adminCan} from "@/lib/admin-access";
import { NextRequest,NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { db,transaction } from "@/lib/db";
import { bad,errorResponse,noStore,sameOrigin } from "@/lib/http";
export const runtime="nodejs";
export async function GET(){
 try { if(!await adminCan(await currentUser(),"team"))return bad("FORBIDDEN",403);
 const [users,events]=await Promise.all([
 db().query("SELECT u.id,u.email,u.full_name,u.role,u.created_at,COALESCE(ap.scope, CASE WHEN u.role='admin' THEN 'owner' ELSE 'manager' END) AS scope FROM users u LEFT JOIN admin_permissions ap ON ap.user_id=u.id ORDER BY u.created_at DESC LIMIT 500"),
 db().query("SELECT a.created_at,a.action,a.target,u.email AS actor FROM admin_audit_log a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT 60")]);
 return NextResponse.json({users:users.rows,events:events.rows},{headers:noStore});
 }catch(e){return errorResponse(e)}
}
export async function PATCH(req:NextRequest){
 try {
 if(!sameOrigin(req))return bad("CROSS_ORIGIN",403);
 const actor=await currentUser();if(actor?.role!=="admin"||!await adminCan(actor,"team"))return bad("FORBIDDEN",403);
 const body:unknown=await req.json();if(!body||typeof body!=="object"||Array.isArray(body))return bad("INVALID_BODY");
 const {email,role,scope} = body as {email:unknown;role:unknown;scope?:unknown};
 if(typeof email!=="string"||!/^\S+@\S+\.\S+$/.test(email)||email.length>254||!(["admin","customer"] as unknown[]).includes(role))return bad("INVALID_ROLE");
 const allowedScopes=["owner","manager","catalog","warehouse","orders","support"];
 if(role==="admin" && scope!==undefined && (typeof scope!=="string"||!allowedScopes.includes(scope)))return bad("INVALID_SCOPE");
 const normalized=email.trim().toLowerCase();
 // Lock the users table to serialize admin role changes and prevent removing the last admin.
 const result=await transaction(async client=>{
  await client.query("LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE");
  const target=await client.query<{id:string;role:string}>("SELECT id,role FROM users WHERE lower(email)=$1",[normalized]);
  if(target.rowCount!==1)return "NOT_FOUND";
  if(target.rows[0].id===actor.id&&(role!=="admin"||scope && scope!=="owner"))return "SELF_DEMOTION";
  const oldScope=await client.query<{scope:string}>("SELECT scope FROM admin_permissions WHERE user_id=$1",[target.rows[0].id]);
  const fromScope=oldScope.rows[0]?.scope??"owner";
  const toScope=role==="admin"?typeof scope==="string"?scope:target.rows[0].role==="admin"?fromScope:"manager":"customer";
  const losingOwner=target.rows[0].role==="admin"&&fromScope==="owner"&&toScope!=="owner";
  if(losingOwner){
    const owners=await client.query<{count:string}>(`SELECT count(*)::text AS count FROM users u LEFT JOIN admin_permissions ap ON ap.user_id=u.id WHERE u.role='admin' AND (ap.scope='owner' OR ap.scope IS NULL)`);
    if(Number(owners.rows[0].count)<=1)return "LAST_OWNER";
  }
  if(target.rows[0].role==="admin"&&role!=="admin"){
    const c=await client.query<{count:string}>("SELECT count(*)::text AS count FROM users WHERE role='admin'");
    if(Number(c.rows[0].count)<=1)return "LAST_ADMIN";
  }
  await client.query("UPDATE users SET role=$1 WHERE id=$2",[role,target.rows[0].id]);
  if(role==="admin")await client.query("INSERT INTO admin_permissions(user_id,scope,assigned_by) VALUES($1,$2,$3) ON CONFLICT(user_id) DO UPDATE SET scope=$2,assigned_by=$3,updated_at=now()",[target.rows[0].id,toScope,actor.id]);
  else await client.query("DELETE FROM admin_permissions WHERE user_id=$1",[target.rows[0].id]);
  await client.query("INSERT INTO admin_audit_log(actor_id,action,target) VALUES($1,$2,$3)",[actor.id,"user.role."+role+":"+toScope,normalized]);
  return "OK";
 });
 if(result!=="OK")return bad(result,result==="NOT_FOUND"?404:409);
 return NextResponse.json({ok:true},{headers:noStore});
 }catch(e){if(e instanceof SyntaxError)return bad("INVALID_JSON");return errorResponse(e)}
}
