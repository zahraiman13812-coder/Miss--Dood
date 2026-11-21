import {NextRequest,NextResponse} from "next/server";
import {noStore} from "@/lib/http";
export const runtime="nodejs";
// Nominatim requires a descriptive user-agent, attribution, and low request frequency.
// This endpoint is only invoked by an explicit user click, not on each keystroke.
let lastRequest=0;
export async function GET(req:NextRequest){
 const q=req.nextUrl.searchParams;
 const province=(q.get("province")||"").trim(),city=(q.get("city")||"").trim();
 const street=(q.get("street")||"").trim(),address=(q.get("address")||"").trim();
 if(!province||!city||[province,city,street,address].some(v=>v.length>160))return NextResponse.json({error:"INVALID_ADDRESS"},{status:400,headers:noStore});
 // Best-effort global spacing; production should use a distributed rate limiter and a contracted geocoder.
 if(Date.now()-lastRequest<1200)return NextResponse.json({error:"TRY_LATER"},{status:429,headers:noStore});
 lastRequest=Date.now();
 try{
  const query=[street,city,province,"Iran"].filter(Boolean).join(", ");
  const url=new URL("https://nominatim.openstreetmap.org/search");url.searchParams.set("q",query);url.searchParams.set("format","json");url.searchParams.set("limit","1");url.searchParams.set("countrycodes","ir");
  const r=await fetch(url,{headers:{"User-Agent":"MISS-DOOD-AddressPicker/1.0 (website: https://missdoodproject.vercel.app)","Accept-Language":"fa"},signal:AbortSignal.timeout(8000),cache:"no-store"});
  if(!r.ok)return NextResponse.json({error:"GEOCODE_UNAVAILABLE"},{status:503,headers:noStore});
  const found=await r.json() as {lat:string;lon:string}[];
  if(!Array.isArray(found)||!found[0])return NextResponse.json({error:"NOT_FOUND"},{status:404,headers:noStore});
  const lat=Number(found[0].lat),lng=Number(found[0].lon);
  if(!Number.isFinite(lat)||!Number.isFinite(lng))throw Error("INVALID_COORDS");
  return NextResponse.json({lat,lng,approximate:true},{headers:noStore});
 }catch{return NextResponse.json({error:"GEOCODE_UNAVAILABLE"},{status:503,headers:noStore});}
}
