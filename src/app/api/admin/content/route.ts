import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { db, transaction } from "@/lib/db";
import { sameOrigin, bad, noStore, errorResponse } from "@/lib/http";
import { getCms, cmsKeys, type CmsKey } from "@/lib/site-cms";
import { validateCms } from "@/lib/validate-cms";
export const runtime="nodejs";
export async function GET(){try{if((await currentUser())?.role!=="admin")return bad("FORBIDDEN",403);return NextResponse.json(await getCms(),{headers:noStore});}catch(e){return errorResponse(e)}}
export async function PATCH(req:NextRequest){
 try{
  if(!sameOrigin(req))return bad("CROSS_ORIGIN",403);
  const actor=await currentUser();if(actor?.role!=="admin")return bad("FORBIDDEN",403);
  const body:unknown=await req.json();if(!body||typeof body!=="object"||Array.isArray(body))return bad("INVALID_BODY");
  const {key,value}=body as {key:unknown;value:unknown};
  if(typeof key!=="string"||!cmsKeys.includes(key as CmsKey)||!validateCms(key as CmsKey,value))return bad("INVALID_CONTENT");
  await transaction(async client=>{
   await client.query(`INSERT INTO site_settings(key,value,updated_by) VALUES($1,$2::jsonb,$3)
      ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_by=EXCLUDED.updated_by,updated_at=now()`,[key,JSON.stringify(value),actor.id]);
   await client.query("INSERT INTO admin_audit_log(actor_id,action,target) VALUES($1,'content.update',$2)",[actor.id,key]);
  });
  return NextResponse.json({ok:true},{headers:noStore});
 }catch(e){if(e instanceof SyntaxError)return bad("INVALID_JSON");return errorResponse(e)}
}
