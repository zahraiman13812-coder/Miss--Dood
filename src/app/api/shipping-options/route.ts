import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {errorResponse,noStore} from "@/lib/http";
export const runtime="nodejs";
export async function GET(req:NextRequest){
 try{
  const province=(req.nextUrl.searchParams.get("province")??"").trim(),city=(req.nextUrl.searchParams.get("city")??"").trim();
  if(!province||!city||province.length>80||city.length>120)return NextResponse.json({options:[]},{headers:noStore});
  const results=await db().query(`SELECT method_key AS "key",method_label AS "label",fee::float8 AS fee,days FROM delivery_rate_options WHERE province=$1 AND city=$2 AND active=true AND method_key IN ('post','express','pickup') ORDER BY fee,method_label`,[province,city]);
  return NextResponse.json({options:results.rows},{headers:noStore});
 }catch(e){return errorResponse(e)}
}
