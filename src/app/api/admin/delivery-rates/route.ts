import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {currentUser} from "@/lib/session";
import {adminCan} from "@/lib/admin-access";
import {bad,errorResponse,noStore,sameOrigin} from "@/lib/http";
export const runtime="nodejs";
async function permitted(){return adminCan(await currentUser(),"orders")}
export async function GET(){try{if(!await permitted())return bad("FORBIDDEN",403);const q=await db().query(`SELECT id::text,province,city,method_key AS "key",method_label AS label,fee::float8 AS fee,days,active FROM delivery_rate_options ORDER BY province,city,method_label LIMIT 2000`);return NextResponse.json({rates:q.rows},{headers:noStore})}catch(e){return errorResponse(e)}}
export async function POST(req:NextRequest){try{
 if(!sameOrigin(req))return bad("CROSS_ORIGIN",403);if(!await permitted())return bad("FORBIDDEN",403);
 const v=await req.json();
 if(typeof v?.province!=="string"||typeof v.city!=="string"||typeof v.key!=="string"||typeof v.label!=="string"||typeof v.days!=="string"||typeof v.active!=="boolean"||!Number.isSafeInteger(v.fee)||v.fee<0||v.fee>100000000||!v.province.trim()||v.province.length>80||!v.city.trim()||v.city.length>120||!/^[a-z][a-z0-9_]{1,31}$/.test(v.key)||v.label.trim().length<2||v.label.length>100||v.days.trim().length<2||v.days.length>100)return bad("INVALID_RATE");
 await db().query(`INSERT INTO delivery_rate_options(province,city,method_key,method_label,fee,days,active) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(province,city,method_key) DO UPDATE SET method_label=$4,fee=$5,days=$6,active=$7,updated_at=now()`,[v.province.trim(),v.city.trim(),v.key,v.label.trim(),v.fee,v.days.trim(),v.active]);
 return NextResponse.json({ok:true},{headers:noStore});
 }catch(e){if(e instanceof SyntaxError)return bad("INVALID_JSON");return errorResponse(e)}}
export async function PATCH(req:NextRequest){try{if(!sameOrigin(req))return bad("CROSS_ORIGIN",403);if(!await permitted())return bad("FORBIDDEN",403);const v=await req.json();if(!/^\d+$/.test(String(v?.id))||typeof v?.active!=="boolean")return bad("INVALID_RATE");const q=await db().query("UPDATE delivery_rate_options SET active=$2,updated_at=now() WHERE id=$1 RETURNING id",[v.id,v.active]);if(!q.rowCount)return bad("NOT_FOUND",404);return NextResponse.json({ok:true},{headers:noStore})}catch(e){return errorResponse(e)}}
