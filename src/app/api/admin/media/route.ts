import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { bad, errorResponse, noStore, sameOrigin } from "@/lib/http";
export const runtime="nodejs";
const MAX=2*1024*1024;
function detect(bytes:Buffer):string|null{
 if(bytes.length>=8 && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return "image/png";
 if(bytes.length>=3 && bytes.subarray(0,3).equals(Buffer.from([255,216,255])))return "image/jpeg";
 if(bytes.length>=12 && bytes.toString("ascii",0,4)==="RIFF" && bytes.toString("ascii",8,12)==="WEBP")return "image/webp";
 if(bytes.length>=6 && ["GIF87a","GIF89a"].includes(bytes.toString("ascii",0,6)))return "image/gif";
 return null;
}
export async function GET(){
 try{if((await currentUser())?.role!=="admin")return bad("FORBIDDEN",403);
 const result=await db().query("SELECT id,filename,mime_type,byte_size,created_at FROM admin_media ORDER BY created_at DESC LIMIT 100");
 return NextResponse.json({items:result.rows},{headers:noStore});
 }catch(e){return errorResponse(e)}
}
export async function POST(req:NextRequest){
 try{
 if(!sameOrigin(req))return bad("CROSS_ORIGIN",403);
 const actor=await currentUser();if(actor?.role!=="admin")return bad("FORBIDDEN",403);
 const length=Number(req.headers.get("content-length")??0);if(length>MAX+100000)return bad("IMAGE_TOO_LARGE",413);
 const form=await req.formData();const file=form.get("file");
 if(!(file instanceof File)||file.size===0||file.size>MAX)return bad("INVALID_IMAGE_SIZE",413);
 const bytes=Buffer.from(await file.arrayBuffer());const mime=detect(bytes);
 if(!mime||mime!==file.type)return bad("INVALID_IMAGE_TYPE",400);
 const filename=file.name.slice(0,150).replace(/[\\/\u0000-\u001f]/g,"_")||"image";
 const result=await db().query<{id:string}>("INSERT INTO admin_media(filename,mime_type,bytes,byte_size,uploaded_by) VALUES($1,$2,$3,$4,$5) RETURNING id",[filename,mime,bytes,bytes.length,actor.id]);
 await db().query("INSERT INTO admin_audit_log(actor_id,action,target) VALUES($1,'media.upload',$2)",[actor.id,result.rows[0].id]);
 return NextResponse.json({id:result.rows[0].id,url:`/api/media/${result.rows[0].id}`},{status:201,headers:noStore});
 }catch(e){return errorResponse(e)}
}
