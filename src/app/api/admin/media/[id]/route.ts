import {adminCan} from "@/lib/admin-access";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { bad, errorResponse, noStore, sameOrigin } from "@/lib/http";
export const runtime="nodejs";
export async function DELETE(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{if(!sameOrigin(req))return bad("CROSS_ORIGIN",403);
 const actor=await currentUser();if(actor?.role!=="admin"||!await adminCan(await currentUser(),"catalog"))return bad("FORBIDDEN",403);
 const {id}=await params;if(!/^[a-f0-9-]{36}$/i.test(id))return bad("INVALID_ID");
 await db().query("DELETE FROM admin_media WHERE id=$1",[id]);
 await db().query("INSERT INTO admin_audit_log(actor_id,action,target) VALUES($1,'media.delete',$2)",[actor.id,id]);
 return NextResponse.json({ok:true},{headers:noStore});
 }catch(e){return errorResponse(e)}
}
