import {NextRequest,NextResponse} from "next/server";
import {currentUser} from "@/lib/session";
import {db} from "@/lib/db";
import {bad,errorResponse,noStore,sameOrigin} from "@/lib/http";
export const runtime="nodejs";
export async function GET(){try{const user=await currentUser();if(user?.role!=="admin")return bad("FORBIDDEN",403);
 const [events,open,stock]=await Promise.all([
 db().query(`SELECT n.id,n.kind,n.title,n.detail,n.href,n.created_at,(r.user_id IS NOT NULL) AS read FROM admin_notifications n LEFT JOIN admin_notification_reads r ON r.notification_id=n.id AND r.user_id=$1 ORDER BY n.created_at DESC LIMIT 40`,[user.id]),
 db().query("SELECT count(*)::int AS count FROM orders WHERE status IN ('received','processing')"),
 db().query("SELECT count(*)::int AS count FROM products WHERE active=true AND stock<=5")
 ]);
 return NextResponse.json({items:events.rows,summary:{openOrders:open.rows[0].count,lowStock:stock.rows[0].count}},{headers:noStore});
 }catch(e){return errorResponse(e)}}
export async function PATCH(req:NextRequest){try{if(!sameOrigin(req))return bad("CROSS_ORIGIN",403);
 const user=await currentUser();if(user?.role!=="admin")return bad("FORBIDDEN",403);
 const body=await req.json();const id=body?.id;
 if(!Number.isSafeInteger(id)||id<=0)return bad("INVALID_ID",400);
 await db().query(`INSERT INTO admin_notification_reads(user_id,notification_id) SELECT $1,id FROM admin_notifications WHERE id=$2 ON CONFLICT DO NOTHING`,[user.id,id]);
 return NextResponse.json({ok:true},{headers:noStore});
 }catch(e){return errorResponse(e)}}
