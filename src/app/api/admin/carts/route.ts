import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {currentUser} from "@/lib/session";
import {adminCan} from "@/lib/admin-access";
import {bad,errorResponse,noStore,sameOrigin} from "@/lib/http";
export const runtime="nodejs";
export async function GET(){try{const u=await currentUser();if(!await adminCan(u,"carts_read"))return bad("FORBIDDEN",403);const r=await db().query(`SELECT c.user_id,u.email,u.full_name,c.items,c.updated_at,c.reviewed_at FROM customer_cart_snapshots c JOIN users u ON u.id=c.user_id WHERE c.items <> '{}'::jsonb ORDER BY c.updated_at DESC LIMIT 100`);return NextResponse.json({carts:r.rows,canReview:await adminCan(u,"carts_review")},{headers:noStore})}catch(e){return errorResponse(e)}}
export async function PATCH(req:NextRequest){try{if(!sameOrigin(req))return bad("CROSS_ORIGIN",403);const u=await currentUser();if(!await adminCan(u,"carts_review"))return bad("FORBIDDEN",403);const v=await req.json();if(typeof v?.userId!=="string"||!/^[a-f0-9-]{36}$/i.test(v.userId))return bad("INVALID_ID");await db().query("UPDATE customer_cart_snapshots SET reviewed_at=now() WHERE user_id=$1",[v.userId]);return NextResponse.json({ok:true},{headers:noStore})}catch(e){return errorResponse(e)}}
