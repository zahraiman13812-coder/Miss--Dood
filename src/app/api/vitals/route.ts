import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {bad} from "@/lib/http";
const limit={start:Date.now(),count:0};
export const runtime="nodejs";
const allowed=["LCP","INP","CLS","FCP","TTFB"];
export async function POST(req:NextRequest){
 try{
  const origin=req.headers.get("origin");const host=req.headers.get("host");
  if(!origin||!host||new URL(origin).host!==host)return bad("CROSS_ORIGIN",403);
  if(Number(req.headers.get("content-length")??0)>2048)return bad("INVALID_SIZE",413);
  const body=await req.json();const metric=body?.metric;const value=body?.value;const path=body?.path;const device=body?.device;
  if(!allowed.includes(metric)||typeof value!=="number"||!Number.isFinite(value)||value<0||value>=1000000||typeof path!=="string"||!/^\/[a-z0-9\/_-]*$/i.test(path)||path.length>200||!(["mobile","desktop"].includes(device)))return bad("INVALID_METRIC");
  // Coarse per-process backpressure; no user/IP data is retained.
  if(Date.now()-limit.start>60000){limit.start=Date.now();limit.count=0}
  if(++limit.count>120)return bad("RATE_LIMIT",429);
  await db().query("INSERT INTO web_vitals(metric,value,path,device) VALUES($1,$2,$3,$4)",[metric,value,path,device]);
  return new NextResponse(null,{status:204,headers:{"Cache-Control":"no-store"}})
 }catch{return bad("INVALID_REQUEST",400)}
}
