import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { adminCan } from "@/lib/admin-access";
import { db, transaction } from "@/lib/db";
import { bad, errorResponse, noStore, sameOrigin } from "@/lib/http";
import { validMediaUrl } from "@/lib/catalog-media";

export const runtime = "nodejs";
const validSlug = (s:unknown):s is string => typeof s === "string" && /^[a-z0-9][a-z0-9-]{0,119}$/.test(s);
const validTag = (s:unknown):s is string => typeof s === "string" && /^[a-z0-9][a-z0-9-]{0,79}$/.test(s);
type ImageItem = { src:string; alt:string };
type ProductInput = {
 slug:string; name:string; category:string; brand:string; description:string;
 priceToman:number|null; stock:number; active:boolean;
 images:ImageItem[]; specs:[string,string][];
};
function validInput(data:unknown): data is ProductInput {
 if(!data||typeof data!=="object"||Array.isArray(data))return false;
 const d=data as Record<string,unknown>;
 if(!validSlug(d.slug)||typeof d.name!=="string"||!d.name.trim()||d.name.length>200||!validTag(d.category)||!(d.brand===""||validTag(d.brand))||
    typeof d.description!=="string"||d.description.length>3000||typeof d.active!=="boolean"||
    !(d.priceToman===null||(Number.isSafeInteger(d.priceToman)&&(d.priceToman as number)>=0&&(d.priceToman as number)<=1_000_000_000_000))||
    !Number.isSafeInteger(d.stock)||(d.stock as number)<0||(d.stock as number)>1_000_000)return false;
 if(!Array.isArray(d.images)||d.images.length<1||d.images.length>12)return false;
 const imgs=d.images as unknown[];
 if(imgs.some(im=>!im||typeof im!=="object"||!validMediaUrl((im as ImageItem).src)||typeof (im as ImageItem).alt!=="string"||(im as ImageItem).alt.length>180))return false;
 if(new Set(imgs.map(im=>(im as ImageItem).src)).size!==imgs.length)return false;
 if(!Array.isArray(d.specs)||d.specs.length>30)return false;
 if((d.specs as unknown[]).some(row=>!Array.isArray(row)||row.length!==2||row.some(v=>typeof v!=="string"||!v.trim()||v.length>140)))return false;
 return true;
}
export async function GET(req:NextRequest){
 try{
  const actor=await currentUser();if(!actor||!await adminCan(actor,"catalog"))return bad("FORBIDDEN",403);
  const slug=req.nextUrl.searchParams.get("slug");if(!validSlug(slug))return bad("INVALID_SLUG");
  const [p,imgs]=await Promise.all([
   db().query(`SELECT slug,name,category,brand,description,image,price_toman::float8 AS "priceToman",stock,active,specs FROM products WHERE slug=$1 AND deleted_at IS NULL`,[slug]),
   db().query(`SELECT src,alt FROM product_images WHERE product_slug=$1 ORDER BY sort_order,id`,[slug])
  ]);
  if(!p.rows[0])return bad("NOT_FOUND",404);
  const product=p.rows[0];
  const images=imgs.rows.length?imgs.rows:product.image?[{src:product.image,alt:product.name}]:[];
  return NextResponse.json({product:{...product,images}},{headers:noStore});
 }catch(e){return errorResponse(e)}
}
export async function PUT(req:NextRequest){
 try{
  if(!sameOrigin(req))return bad("CROSS_ORIGIN",403);
  const actor=await currentUser();if(!actor||!await adminCan(actor,"catalog"))return bad("FORBIDDEN",403);
  const payload:unknown=await req.json();if(!payload||typeof payload!=="object"||Array.isArray(payload))return bad("INVALID_PRODUCT");
  const data=(payload as {product?:unknown}).product;
  if(!validInput(data))return bad("INVALID_PRODUCT",400);
  const mode=(payload as {mode?:unknown}).mode;
  if(mode!=="create"&&mode!=="edit")return bad("INVALID_MODE");
  const hasStockPermission=await adminCan(actor,"warehouse");
  const result=await transaction(async c=>{
   const old=await c.query<{stock:number}>("SELECT stock FROM products WHERE slug=$1 AND deleted_at IS NULL FOR UPDATE",[data.slug]);
   if(mode==="create"&&old.rowCount)return "ALREADY_EXISTS";
   if(mode==="edit"&&!old.rowCount)return "NOT_FOUND";
   if(!hasStockPermission && old.rows[0] && old.rows[0].stock!==data.stock)return "INVENTORY_PERMISSION_REQUIRED";
   if(!hasStockPermission && mode==="create"&&data.stock!==0)return "INVENTORY_PERMISSION_REQUIRED";
   const name=data.name.trim();const image=data.images[0].src;
   if(mode==="create")await c.query(`INSERT INTO products(slug,name,category,brand,description,image,price_toman,stock,active,specs)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`,[data.slug,name,data.category,data.brand,data.description,image,data.priceToman,data.stock,data.active,JSON.stringify(data.specs)]);
   else await c.query(`UPDATE products SET name=$2,category=$3,brand=$4,description=$5,image=$6,price_toman=$7,stock=$8,active=$9,specs=$10::jsonb,updated_at=now() WHERE slug=$1`,[data.slug,name,data.category,data.brand,data.description,image,data.priceToman,data.stock,data.active,JSON.stringify(data.specs)]);
   await c.query("DELETE FROM product_images WHERE product_slug=$1",[data.slug]);
   for(let i=0;i<data.images.length;i++)await c.query("INSERT INTO product_images(product_slug,src,alt,sort_order) VALUES($1,$2,$3,$4)",[data.slug,data.images[i].src,data.images[i].alt,i]);
   const before=old.rows[0]?.stock??0;
   if(before!==data.stock)await c.query(`INSERT INTO inventory_movements(product_slug,actor_id,quantity_delta,before_stock,after_stock,reason)
     VALUES($1,$2,$3,$4,$5,$6)`,[data.slug,actor.id,data.stock-before,before,data.stock,mode==="create"?"admin.product.create":"admin.product.edit"]);
   await c.query("INSERT INTO admin_audit_log(actor_id,action,target) VALUES($1,$2,$3)",[actor.id,`product.${mode}.full`,data.slug]);
   return "OK";
  });
  if(result!=="OK")return bad(result,result==="NOT_FOUND"?404:result==="INVENTORY_PERMISSION_REQUIRED"?403:409);
  return NextResponse.json({ok:true,slug:data.slug},{headers:noStore});
 }catch(e){if(e instanceof SyntaxError)return bad("INVALID_JSON");return errorResponse(e)}
}

/** Reversible archival: retain purchase history, inventory ledger and media references. */
export async function DELETE(req:NextRequest){
 try{
  if(!sameOrigin(req))return bad("CROSS_ORIGIN",403);
  const actor=await currentUser();
  if(!actor||!await adminCan(actor,"catalog"))return bad("FORBIDDEN",403);
  const slug=req.nextUrl.searchParams.get("slug");
  if(!validSlug(slug))return bad("INVALID_SLUG",400);
  const result=await transaction(async client=>{
   const product=await client.query<{slug:string}>("SELECT slug FROM products WHERE slug=$1 AND deleted_at IS NULL FOR UPDATE",[slug]);
   if(!product.rows[0])return false;
   await client.query("UPDATE products SET active=false,deleted_at=now(),updated_at=now() WHERE slug=$1",[slug]);
   await client.query("INSERT INTO admin_audit_log(actor_id,action,target) VALUES($1,$2,$3)",[actor.id,"product.archive",slug]);
   return true;
  });
  if(!result)return bad("NOT_FOUND",404);
  return NextResponse.json({ok:true,archived:true},{headers:noStore});
 }catch(e){return errorResponse(e)}
}
