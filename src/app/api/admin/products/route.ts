import {NextRequest,NextResponse} from "next/server";
import {currentUser} from "@/lib/session";
import {adminCan} from "@/lib/admin-access";
import {db} from "@/lib/db";
import {bad,errorResponse,noStore} from "@/lib/http";
export const runtime="nodejs";
export async function GET(req:NextRequest){try{
 const user=await currentUser();if(user?.role!=="admin"||!await adminCan(user,"catalog"))return bad("FORBIDDEN",403);
 const q=req.nextUrl.searchParams.get("q")?.trim()??"";
 if(q.length>100)return bad("INVALID_SEARCH");
 const result=await db().query(`SELECT slug,name,category,brand,description,image,price_toman::float8 AS "priceToman",stock,active FROM products WHERE ($1::text='' OR name ILIKE '%'||$1||'%' OR slug ILIKE '%'||$1||'%') ORDER BY updated_at DESC LIMIT 300`,[q]);
 return NextResponse.json({products:result.rows},{headers:noStore});
 }catch(e){return errorResponse(e)}}
