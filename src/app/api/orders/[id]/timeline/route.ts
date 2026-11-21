import {NextResponse} from "next/server";
import {currentUser} from "@/lib/session";
import {db} from "@/lib/db";
import {bad,errorResponse,noStore} from "@/lib/http";
export const runtime="nodejs";
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
 try{const user=await currentUser();if(!user)return bad("AUTH_REQUIRED",401);const {id}=await params;if(!/^[0-9a-f-]{36}$/i.test(id))return bad("INVALID_ID");
 const valid=await db().query("SELECT id,status,created_at FROM orders WHERE id=$1 AND (user_id=$2 OR $3='admin')",[id,user.id,user.role]);if(!valid.rowCount)return bad("NOT_FOUND",404);
 const result=await db().query("SELECT to_status,created_at FROM order_events WHERE order_id=$1 ORDER BY created_at,id",[id]);return NextResponse.json({status:valid.rows[0].status,events:result.rows.length?result.rows:[{to_status:valid.rows[0].status,created_at:valid.rows[0].created_at}]},{headers:noStore});
 }catch(e){return errorResponse(e)}
}
