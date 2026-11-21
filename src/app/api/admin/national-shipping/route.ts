import {NextRequest,NextResponse} from "next/server";
import {currentUser} from "@/lib/session";
import {adminCan} from "@/lib/admin-access";
import {db} from "@/lib/db";
import {bad,errorResponse,noStore,sameOrigin} from "@/lib/http";
export const runtime="nodejs";
export async function GET(){try{const user=await currentUser();if(!await adminCan(user,"orders"))return bad("FORBIDDEN",403);const x=await db().query("SELECT fee::float8 AS fee,days,active FROM national_shipping_policy WHERE id=1");return NextResponse.json({policy:x.rows[0]??{fee:0,days:'',active:false}},{headers:noStore})}catch(e){return errorResponse(e)}}
export async function PATCH(req:NextRequest){try{if(!sameOrigin(req))return bad("CROSS_ORIGIN",403);const user=await currentUser();if(!await adminCan(user,"orders"))return bad("FORBIDDEN",403);const v=await req.json();if(!v||typeof v!=='object'||!Number.isSafeInteger(v.fee)||v.fee<0||v.fee>100000000||typeof v.active!=="boolean"||typeof v.days!=="string"||!v.days.trim()||v.days.length>100)return bad("INVALID_SHIPPING");await db().query("UPDATE national_shipping_policy SET fee=$1,days=$2,active=$3,updated_at=now() WHERE id=1",[v.fee,v.days.trim(),v.active]);return NextResponse.json({ok:true},{headers:noStore})}catch(e){return errorResponse(e)}}
