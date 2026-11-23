import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {currentUser} from "@/lib/session";
import {adminCan} from "@/lib/admin-access";
import {bad,errorResponse,noStore,sameOrigin} from "@/lib/http";
export const runtime="nodejs";
async function permitted(){return adminCan(await currentUser(),"orders")}
export async function GET(){try{if(!await permitted())return bad("FORBIDDEN",403);const q=await db().query(`SELECT id::text,province,city,method_key AS "key",method_label AS label,fee::float8 AS fee,days,active FROM delivery_rate_options WHERE method_key IN ('post','express','pickup') ORDER BY province,city,method_label LIMIT 2000`);return NextResponse.json({rates:q.rows},{headers:noStore})}catch(e){return errorResponse(e)}}
export async function POST(req:NextRequest){try{
 if(!sameOrigin(req))return bad("CROSS_ORIGIN",403);if(!await permitted())return bad("FORBIDDEN",403);
 const v=await req.json();
 if(typeof v?.province!=="string"||typeof v.city!=="string"||typeof v.key!=="string"||typeof v.label!=="string"||typeof v.days!=="string"||typeof v.active!=="boolean"||!Number.isSafeInteger(v.fee)||v.fee<0||v.fee>100000000||!v.province.trim()||v.province.length>80||!v.city.trim()||v.city.length>120||!["post","express","pickup"].includes(v.key)||v.label.trim().length<2||v.label.length>100||v.days.trim().length<2||v.days.length>100)return bad("INVALID_RATE");
 await db().query(`INSERT INTO delivery_rate_options(province,city,method_key,method_label,fee,days,active) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(province,city,method_key) DO UPDATE SET method_label=$4,fee=$5,days=$6,active=$7,updated_at=now()`,[v.province.trim(),v.city.trim(),v.key,v.label.trim(),v.fee,v.days.trim(),v.active]);
 return NextResponse.json({ok:true},{headers:noStore});
 }catch(e){if(e instanceof SyntaxError)return bad("INVALID_JSON");return errorResponse(e)}}
const isId=(id:unknown)=>typeof id==="string" && /^\d+$/.test(id);
const validRate=(v:Record<string,unknown>)=>
 typeof v.province==="string" && v.province.trim().length>0 && v.province.length<=80 &&
 typeof v.city==="string" && v.city.trim().length>0 && v.city.length<=120 &&
 typeof v.key==="string" && ["post","express","pickup"].includes(v.key) &&
 typeof v.label==="string" && v.label.trim().length>=2 && v.label.length<=100 &&
 typeof v.days==="string" && v.days.trim().length>=2 && v.days.length<=100 &&
 Number.isSafeInteger(v.fee) && (v.fee as number)>=0 && (v.fee as number)<=100000000 && typeof v.active==="boolean";
export async function PATCH(req:NextRequest){try{
 if(!sameOrigin(req))return bad("CROSS_ORIGIN",403);if(!await permitted())return bad("FORBIDDEN",403);
 const v=await req.json();if(!isId(v?.id))return bad("INVALID_RATE");
 if(v.province===undefined){
  if(typeof v.active!=="boolean")return bad("INVALID_RATE");
  const q=await db().query("UPDATE delivery_rate_options SET active=$2,updated_at=now() WHERE id=$1 AND method_key IN ('post','express','pickup') RETURNING id",[v.id,v.active]);
  if(!q.rowCount)return bad("NOT_FOUND",404);
 }else{
  if(!validRate(v))return bad("INVALID_RATE");
  const q=await db().query(`UPDATE delivery_rate_options SET province=$2,city=$3,method_key=$4,method_label=$5,fee=$6,days=$7,active=$8,updated_at=now()
    WHERE id=$1 AND method_key IN ('post','express','pickup') RETURNING id`,[v.id,v.province.trim(),v.city.trim(),v.key,v.label.trim(),v.fee,v.days.trim(),v.active]);
  if(!q.rowCount)return bad("NOT_FOUND",404);
 }
 return NextResponse.json({ok:true},{headers:noStore});
}catch(e){if(e instanceof SyntaxError)return bad("INVALID_JSON");if((e as {code?:string})?.code==="23505")return bad("DUPLICATE_RATE",409);return errorResponse(e)}}
export async function DELETE(req:NextRequest){try{
 if(!sameOrigin(req))return bad("CROSS_ORIGIN",403);if(!await permitted())return bad("FORBIDDEN",403);
 const v=await req.json();if(!isId(v?.id))return bad("INVALID_RATE");
 const q=await db().query("DELETE FROM delivery_rate_options WHERE id=$1 AND method_key IN ('post','express','pickup') RETURNING id",[v.id]);
 if(!q.rowCount)return bad("NOT_FOUND",404);
 return NextResponse.json({ok:true},{headers:noStore});
}catch(e){if(e instanceof SyntaxError)return bad("INVALID_JSON");return errorResponse(e)}}
