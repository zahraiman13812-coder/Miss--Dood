import {adminCan} from "@/lib/admin-access";
import {NextResponse} from "next/server";
import {currentUser} from "@/lib/session";
import {db} from "@/lib/db";
import {bad,errorResponse} from "@/lib/http";
export const runtime="nodejs";
const csv=(v:unknown)=>'"'+String(v??"").replace(/^([=+@-])/,'\t$1').replace(/"/g,'""')+'"';
export async function GET(){try{if((await currentUser())?.role!=="admin"||!await adminCan(await currentUser(),"orders"))return bad("FORBIDDEN",403);
 const result=await db().query("SELECT id,status,created_at,total::float8,shipping_city FROM orders ORDER BY created_at DESC LIMIT 5000");
 const lines=[["id","status","date","total","city"],...result.rows.map(r=>[r.id,r.status,r.created_at,r.total,r.shipping_city])];
 const body="\uFEFF"+lines.map(row=>row.map(csv).join(",")).join("\r\n");
 return new NextResponse(body,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":'attachment; filename="missdood-orders.csv"',"Cache-Control":"no-store"}});
 }catch(e){return errorResponse(e)}}
