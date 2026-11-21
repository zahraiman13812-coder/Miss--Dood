import {adminCan} from "@/lib/admin-access";
import {NextRequest,NextResponse} from "next/server";
import {currentUser} from "@/lib/session";
import {db} from "@/lib/db";
import {bad,errorResponse,noStore} from "@/lib/http";
export const runtime="nodejs";
export async function GET(req:NextRequest){try{if((await currentUser())?.role!=="admin"||!await adminCan(await currentUser(),"reports"))return bad("FORBIDDEN",403);
 const days=Math.min(365,Math.max(7,Number(req.nextUrl.searchParams.get("days"))||30));
 const [summary,series,top]=await Promise.all([
 db().query(`SELECT count(*)::int AS orders,coalesce(sum(total) FILTER(WHERE status<>'cancelled'),0)::float8 AS value,count(*) FILTER(WHERE status='cancelled')::int AS cancelled,count(*) FILTER(WHERE status='delivered')::int AS delivered FROM orders WHERE created_at>=now()-($1::int*interval '1 day')`,[days]),
 db().query(`SELECT created_at::date AS day,count(*)::int AS orders,coalesce(sum(total) FILTER(WHERE status<>'cancelled'),0)::float8 AS value FROM orders WHERE created_at>=now()-($1::int*interval '1 day') GROUP BY created_at::date ORDER BY day`,[days]),
 db().query(`SELECT i.product_slug,max(i.product_name) AS name,sum(i.quantity)::int AS quantity FROM order_items i JOIN orders o ON o.id=i.order_id WHERE o.status<>'cancelled' AND o.created_at>=now()-($1::int*interval '1 day') GROUP BY i.product_slug ORDER BY quantity DESC LIMIT 12`,[days])
 ]);return NextResponse.json({summary:summary.rows[0],series:series.rows,top:top.rows},{headers:noStore})}catch(e){return errorResponse(e)}}
