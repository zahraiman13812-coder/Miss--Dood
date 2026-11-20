import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime="nodejs";
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^[a-f0-9-]{36}$/i.test(id))return new NextResponse(null,{status:404});
 try{
 const r=await db().query<{bytes:Buffer;mime_type:string}>("SELECT bytes,mime_type FROM admin_media WHERE id=$1",[id]);
 if(!r.rows[0])return new NextResponse(null,{status:404});
 const b=r.rows[0].bytes;
 return new NextResponse(new Uint8Array(b),{headers:{"Content-Type":r.rows[0].mime_type,"Cache-Control":"public, max-age=3600","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; sandbox"}});
 }catch{return new NextResponse(null,{status:503})}
}
