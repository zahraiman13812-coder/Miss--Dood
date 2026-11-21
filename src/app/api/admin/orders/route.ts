import {NextRequest,NextResponse} from "next/server";
import {currentUser} from "@/lib/session";
import {adminCan} from "@/lib/admin-access";
import {db} from "@/lib/db";
import {bad,errorResponse,noStore} from "@/lib/http";
export const runtime="nodejs";
export async function GET(req:NextRequest){try{
 const user=await currentUser();if(user?.role!=="admin"||!await adminCan(user,"orders"))return bad("FORBIDDEN",403);
 const page=Math.min(1000,Math.max(1,Number(req.nextUrl.searchParams.get("page"))||1));
 const status=req.nextUrl.searchParams.get("status")??"";
 if(status&&!['received','processing','shipped','delivered','cancelled'].includes(status))return bad("INVALID_STATUS");
 const q=req.nextUrl.searchParams.get("q")?.trim()??"";
 if(q.length>120)return bad("INVALID_SEARCH");
 const result=await db().query(`SELECT id,status,created_at,recipient_name,shipping_city,total::float8 AS total FROM orders WHERE ($1::text='' OR status=$1) AND ($2::text='' OR recipient_name ILIKE '%'||$2||'%' OR id::text ILIKE '%'||$2||'%') ORDER BY created_at DESC LIMIT 50 OFFSET $3`,[status,q,(page-1)*50]);
 return NextResponse.json({orders:result.rows,page},{headers:noStore});
 }catch(e){return errorResponse(e)}}
