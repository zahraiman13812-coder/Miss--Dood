import {adminCan} from "@/lib/admin-access";
import {NextRequest,NextResponse} from "next/server";
import {currentUser} from "@/lib/session";
import {db,transaction} from "@/lib/db";
import {bad,errorResponse,noStore,sameOrigin} from "@/lib/http";
import {validMediaUrl} from "@/lib/catalog-media";
export const runtime="nodejs";
export async function GET(req:NextRequest){try{
 if((await currentUser())?.role!=="admin"||!await adminCan(await currentUser(),"catalog"))return bad("FORBIDDEN",403);
 if(req.nextUrl.searchParams.get("list")==="1"){
  const list=await db().query("SELECT slug,name,image FROM products ORDER BY name LIMIT 2000");
  return NextResponse.json({products:list.rows},{headers:noStore});
 }
 const slug=req.nextUrl.searchParams.get("slug")??"";if(!/^[a-z0-9][a-z0-9-]{0,119}$/.test(slug))return bad("INVALID_SLUG");
 const r=await db().query("SELECT src,alt,sort_order FROM product_images WHERE product_slug=$1 ORDER BY sort_order,id",[slug]);
 return NextResponse.json({images:r.rows},{headers:noStore});
 }catch(e){return errorResponse(e)}}
export async function PUT(req:NextRequest){try{
 if(!sameOrigin(req))return bad("CROSS_ORIGIN",403);
 const actor=await currentUser();if(actor?.role!=="admin"||!await adminCan(await currentUser(),"catalog"))return bad("FORBIDDEN",403);
 const {slug,images}=await req.json();
 if(typeof slug!=="string"||!/^[a-z0-9][a-z0-9-]{0,119}$/.test(slug)||!Array.isArray(images)||images.length>12||!images.length)return bad("INVALID_IMAGES");
 if(images.some((x:unknown)=>!x||typeof x!=="object"||!validMediaUrl((x as {src?:unknown}).src)||typeof (x as {alt?:unknown}).alt!=="string"||(x as {alt:string}).alt.length>180)||new Set(images.map((x:{src:string})=>x.src)).size!==images.length)return bad("INVALID_IMAGES");
 await transaction(async client=>{
  const exists=await client.query("SELECT slug FROM products WHERE slug=$1 FOR UPDATE",[slug]);if(!exists.rowCount)throw Error("NOT_FOUND");
  await client.query("DELETE FROM product_images WHERE product_slug=$1",[slug]);
  for(let i=0;i<images.length;i++)await client.query("INSERT INTO product_images(product_slug,src,alt,sort_order) VALUES($1,$2,$3,$4)",[slug,images[i].src,images[i].alt,i]);
  await client.query("UPDATE products SET image=$1,updated_at=now() WHERE slug=$2",[images[0].src,slug]);
  await client.query("INSERT INTO admin_audit_log(actor_id,action,target) VALUES($1,'product.images.update',$2)",[actor.id,slug]);
 });return NextResponse.json({ok:true},{headers:noStore});
 }catch(e){if(e instanceof Error&&e.message==="NOT_FOUND")return bad("NOT_FOUND",404);return errorResponse(e)}}
