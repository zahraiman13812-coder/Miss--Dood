import {NextRequest,NextResponse} from "next/server";
import {currentUser} from "@/lib/session";
import {getAdminScope} from "@/lib/admin-access";
import {db} from "@/lib/db";
import {bad,errorResponse,noStore} from "@/lib/http";
export const runtime="nodejs";
export async function GET(req:NextRequest){try{
 const scope=await getAdminScope(await currentUser());if(!scope)return bad("FORBIDDEN",403);
 const q=(req.nextUrl.searchParams.get("q")??"").trim().slice(0,70);if(q.length<2)return NextResponse.json({products:[],orders:[],customers:[]},{headers:noStore});
 const like=`%${q.replace(/[%_\\]/g,"")}%`;
 const allowed=(...s:string[])=>scope==="owner"||scope==="manager"||s.includes(scope);
 const products=allowed("catalog","warehouse")?await db().query(`SELECT slug,name,stock FROM products WHERE name ILIKE $1 OR slug ILIKE $1 ORDER BY updated_at DESC LIMIT 7`,[like]):null;
 // Never search recipient contact fields; order lookup is by order id only.
 const orders=allowed("orders")&&/^[a-f0-9-]{2,36}$/i.test(q)?await db().query(`SELECT id,status,total::float8 AS total FROM orders WHERE id::text ILIKE $1 ORDER BY created_at DESC LIMIT 7`,[like]):null;
 const customers=scope==="owner"||scope==="manager"?await db().query(`SELECT id,full_name FROM users WHERE full_name ILIKE $1 ORDER BY created_at DESC LIMIT 7`,[like]):null;
 return NextResponse.json({products:products?.rows??[],orders:orders?.rows??[],customers:customers?.rows??[]},{headers:noStore});
 }catch(e){return errorResponse(e)}}
