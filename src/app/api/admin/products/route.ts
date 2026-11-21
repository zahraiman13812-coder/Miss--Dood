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
 const pageValue=Number(req.nextUrl.searchParams.get("page")??1),sizeValue=Number(req.nextUrl.searchParams.get("pageSize")??30);
 const page=Number.isSafeInteger(pageValue)?Math.min(10000,Math.max(1,pageValue)):1;
 const pageSize=Number.isSafeInteger(sizeValue)?Math.min(100,Math.max(1,sizeValue)):30;
 const offset=(page-1)*pageSize;
 const [result,count]=await Promise.all([
  db().query(`SELECT slug,name,category,brand,description,image,price_toman::float8 AS "priceToman",stock,active FROM products WHERE deleted_at IS NULL AND ($1::text='' OR name ILIKE '%'||$1||'%' OR slug ILIKE '%'||$1||'%') ORDER BY updated_at DESC,slug LIMIT $2 OFFSET $3`,[q,pageSize,offset]),
  db().query<{total:number}>(`SELECT count(*)::int AS total FROM products WHERE deleted_at IS NULL AND ($1::text='' OR name ILIKE '%'||$1||'%' OR slug ILIKE '%'||$1||'%')`,[q])
 ]);
 return NextResponse.json({products:result.rows,pagination:{page,pageSize,total:count.rows[0]?.total??0}},{headers:noStore});
 }catch(e){return errorResponse(e)}}
