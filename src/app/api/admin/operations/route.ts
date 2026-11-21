import {NextRequest,NextResponse} from "next/server";
import {currentUser} from "@/lib/session";
import {adminCan} from "@/lib/admin-access";
import {db} from "@/lib/db";
import {bad,errorResponse,noStore} from "@/lib/http";
export const runtime="nodejs";
export async function GET(_req:NextRequest){
 try{const user=await currentUser();if(!await adminCan(user,"reports"))return bad("FORBIDDEN",403);
 const results=await Promise.allSettled([
 db().query("SELECT 1 AS ok"),
 db().query("SELECT count(*)::int AS count FROM app_error_events WHERE created_at>now()-interval '24 hours'"),
 db().query("SELECT scope,message,created_at FROM app_error_events ORDER BY created_at DESC LIMIT 20"),
 db().query(`SELECT metric,device,count(*)::int AS samples,round((percentile_cont(0.75) WITHIN GROUP(ORDER BY value))::numeric,2)::float8 AS p75 FROM web_vitals WHERE created_at>now()-interval '7 days' GROUP BY metric,device ORDER BY metric,device`),
 db().query("SELECT count(*)::int AS count FROM orders WHERE status IN ('received','processing')"),
 db().query("SELECT count(*)::int AS count FROM products WHERE active=true AND stock<=5")
 ]);
 const ok=(i:number)=>results[i].status==="fulfilled";
 const rows=(i:number):Record<string,unknown>[]=>{const result=results[i];return result.status==="fulfilled"?result.value.rows:[]};
 return NextResponse.json({database:ok(0)?"ok":"degraded",errors24h:rows(1)[0]?.count??null,recentErrors:rows(2),vitals:rows(3),openOrders:rows(4)[0]?.count??null,lowStock:rows(5)[0]?.count??null,generatedAt:new Date().toISOString()},{headers:noStore});
 }catch(e){return errorResponse(e)}
}
