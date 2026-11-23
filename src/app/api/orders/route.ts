import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { db, transaction } from "@/lib/db";
import { bad, errorResponse, noStore, sameOrigin } from "@/lib/http";
import {getCms} from "@/lib/site-cms";
export const runtime="nodejs";
class OrderError extends Error {constructor(public code:string){super(code);}}
export async function GET(req: NextRequest) {try {
 const user=await currentUser(); if(!user)return bad("AUTH_REQUIRED",401);
 const pageValue=Number(req.nextUrl.searchParams.get("page") ?? "1");
 const sizeValue=Number(req.nextUrl.searchParams.get("pageSize") ?? "100");
 const page=Number.isSafeInteger(pageValue)?Math.max(1,Math.min(pageValue,10000)):1;
 const pageSize=Number.isSafeInteger(sizeValue)?Math.max(1,Math.min(sizeValue,100)):100;
 const offset=(page-1)*pageSize;
 const countResult=await db().query<{count:number}>("SELECT count(*)::int AS count FROM orders WHERE user_id=$1",[user.id]);
 const result=await db().query(`SELECT o.id,o.status,o.created_at AS date,o.subtotal::float8 AS subtotal,o.total::float8 AS total,
 json_build_object('city',o.shipping_city,'fee',o.shipping_fee::float8,'days','', 'method',o.shipping_method,'postalCode',o.postal_code,'province',o.shipping_province) AS shipping,
 COALESCE((SELECT json_agg(json_build_object('name',i.product_name,'quantity',i.quantity,'amount',i.amount::float8)) FROM order_items i WHERE i.order_id=o.id),'[]'::json) AS items
 FROM orders o WHERE o.user_id=$1 ORDER BY o.created_at DESC,o.id DESC LIMIT $2 OFFSET $3`,[user.id,pageSize,offset]);
 return NextResponse.json({orders:result.rows,pagination:{page,pageSize,total:countResult.rows[0]?.count??0}},{headers:noStore});
} catch(e){return errorResponse(e);} }
export async function POST(req:NextRequest) {try {
 if(!sameOrigin(req))return bad("CROSS_ORIGIN",403);
 const user=await currentUser();if(!user)return bad("AUTH_REQUIRED",401);
 const key=req.headers.get("idempotency-key");
 if(!key || !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(key))return bad("INVALID_REQUEST_ID");
 const data=await req.json();
 if(!data || typeof data!=="object" || Array.isArray(data))return bad("INVALID_BODY");
 const name=typeof data.recipientName==="string"?data.recipientName.trim():"", phone=typeof data.recipientPhone==="string"?data.recipientPhone.trim():"", address=typeof data.shippingAddress==="string"?data.shippingAddress.trim():"", city=typeof data.shippingCity==="string"?data.shippingCity.trim():"";
 const method = typeof data.shippingMethod === "string" && /^[a-z][a-z0-9_]{1,31}$/.test(data.shippingMethod) ? data.shippingMethod : null;
 if (!method || !["post","express","pickup"].includes(method)) return bad("INVALID_SHIPPING_METHOD");
 const postalCode = typeof data.postalCode === "string" ? data.postalCode.replace(/[۰-۹٠-٩]/g,(c:string)=>String(c.charCodeAt(0)-(c.charCodeAt(0)>1700?1776:1632))).replace(/\s/g,"") : "";
 const lat = data.latitude===null || data.latitude===undefined ? null : data.latitude;
 const lng = data.longitude===null || data.longitude===undefined ? null : data.longitude;
 const hasCoords = typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng) && lat>=-90 && lat<=90 && lng>=-180 && lng<=180;
 if ((lat!==null || lng!==null) && !hasCoords) return bad("INVALID_LOCATION");
 if (method !== "pickup" && !/^\d{10}$/.test(postalCode)) return bad("INVALID_POSTAL_CODE");

 const province = typeof data.shippingProvince === "string" ? data.shippingProvince.trim() : "";
 const building = typeof data.building === "string" ? data.building.trim() : "";
 const unit = typeof data.unit === "string" ? data.unit.trim() : "";
 if ((method !== "pickup" && (!province || province.length > 80 || !building)) || building.length > 40 || unit.length > 40) return bad("INVALID_SHIPPING_ADDRESS");
 const note=typeof data.note==="string"?data.note.trim():"";
 if(!name||name.length>120||!/^\+?[0-9۰-۹٠-٩ \-]{8,22}$/.test(phone)||(method!=="pickup" && address.length<6)||address.length>1000||!city||city.length>120||note.length>1000) return bad("INVALID_RECIPIENT");
 if(!Array.isArray(data.items)||data.items.length<1||data.items.length>50) return bad("INVALID_ITEMS");
 const unique=new Set<string>();
 const items:{slug:string;quantity:number}[]=[];
 for(const item of data.items){if(!item||typeof item.slug!=="string"||!/^[a-z0-9][a-z0-9-]{0,119}$/.test(item.slug)||!Number.isSafeInteger(item.quantity)||item.quantity<1||item.quantity>99||unique.has(item.slug))return bad("INVALID_ITEMS");unique.add(item.slug);items.push({slug:item.slug,quantity:item.quantity});}
 // Fast path for retries after the original request has already committed.
 const existing=await db().query<{id:string}>("SELECT id FROM orders WHERE user_id=$1 AND idempotency_key=$2",[user.id,key]);
 if(existing.rows[0])return NextResponse.json({orderId:existing.rows[0].id},{status:200,headers:noStore});
 const {contact:storeContact}=await getCms();
 const orderId=await transaction(async client=>{
  // Serialize retries for the same user and idempotency key, even if the
  // associated products differ or the cart is empty in another retry.
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))", [user.id + ":" + key]);
  const previous=await client.query<{id:string}>("SELECT id FROM orders WHERE user_id=$1 AND idempotency_key=$2",[user.id,key]);
  if(previous.rows[0])return previous.rows[0].id;
  const directRate=await client.query<{fee:string}>("SELECT fee::text FROM delivery_rate_options WHERE province=$1 AND city=$2 AND method_key=$3 AND active=true",[province,city,method]);
  const customOptions=await client.query<{exists:boolean}>("SELECT EXISTS(SELECT 1 FROM delivery_rate_options WHERE province=$1 AND city=$2 AND active=true AND method_key IN ('post','express','pickup')) AS exists",[province,city]);
  if(customOptions.rows[0]?.exists && !directRate.rows[0])throw new OrderError("INVALID_SHIPPING_METHOD");
  if(!customOptions.rows[0]?.exists && !["post","express","pickup"].includes(method))throw new OrderError("INVALID_SHIPPING_METHOD");
  if(!customOptions.rows[0]?.exists && method!=="post" && city.replace(/\s/g,"")!=="تهران")throw new OrderError("TEHRAN_ONLY");
  const shipping=await client.query<{fee:string}>("SELECT fee::text FROM shipping_rules WHERE city=$1 AND active=true",[city]);
  let nationalFee:number|null=null;
  if(!directRate.rows[0] && !shipping.rows[0] && method==="post"){
    const fallback=await client.query<{fee:string}>("SELECT fee::text AS fee FROM national_shipping_policy WHERE id=1 AND active=true");
    nationalFee=fallback.rows[0]?Number(fallback.rows[0].fee):null;
  }
  if(!directRate.rows[0] && !shipping.rows[0] && nationalFee===null && method!=="pickup")throw new OrderError("INVALID_SHIPPING_CITY");
  let fee = directRate.rows[0] ? Number(directRate.rows[0].fee) : method === "pickup" ? 0 : Number(shipping.rows[0]?.fee??nationalFee);
  if (method === "express" && !directRate.rows[0]) {
    const express=await client.query<{fee:string}>("SELECT fee::text FROM delivery_config WHERE method='express' AND active=true");
    if(!express.rows[0])throw new OrderError("EXPRESS_UNAVAILABLE");
    fee=Number(express.rows[0].fee);
  }
  const rows=await client.query<{slug:string;name:string;price_toman:string;stock:number}>("SELECT slug,name,price_toman::text,stock FROM products WHERE slug = ANY($1::text[]) AND active=true AND deleted_at IS NULL ORDER BY slug FOR UPDATE",[items.map(i=>i.slug)]);
  // Product row locks also protect stock levels across different checkouts.
  if(rows.rows.length!==items.length)throw new OrderError("PRODUCT_UNAVAILABLE");
  let subtotal=0;const lines=[];
  for(const item of items){const product=rows.rows.find(p=>p.slug===item.slug)!;
   if(product.price_toman===null)throw new OrderError("PRICE_UNAVAILABLE");
   if(product.stock<item.quantity)throw new OrderError("INSUFFICIENT_STOCK");
   const price=Number(product.price_toman),amount=price*item.quantity;
   if(!Number.isSafeInteger(amount)||!Number.isSafeInteger(subtotal+amount))throw new OrderError("AMOUNT_OVERFLOW");
   subtotal+=amount;lines.push({...item,name:product.name,price,amount});
  }
  if(!Number.isSafeInteger(fee)||!Number.isSafeInteger(subtotal+fee))throw new OrderError("AMOUNT_OVERFLOW");
  const result=await client.query<{id:string}>(`INSERT INTO orders(user_id,recipient_name,recipient_phone,shipping_address,shipping_city,subtotal,shipping_fee,total,note,idempotency_key,postal_code,latitude,longitude,shipping_method,shipping_province,building,unit) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING id`,[user.id,name,phone,method==="pickup"?storeContact.address:address,city,subtotal,fee,subtotal+fee,note||null,key,method==="pickup"?"":postalCode,hasCoords?lat:null,hasCoords?lng:null,method,method==="pickup"?"تهران":province,method==="pickup"?"":building,method==="pickup"?"":unit]);
  for(const line of lines){
   const before=rows.rows.find(p=>p.slug===line.slug)!.stock;
   await client.query("UPDATE products SET stock=stock-$1,updated_at=now() WHERE slug=$2",[line.quantity,line.slug]);
   await client.query("INSERT INTO inventory_movements(product_slug,actor_id,quantity_delta,before_stock,after_stock,reason,order_id) VALUES($1,$2,$3,$4,$5,'order.checkout',$6)",[line.slug,user.id,-line.quantity,before,before-line.quantity,result.rows[0].id]);
   await client.query("INSERT INTO order_items(order_id,product_slug,product_name,unit_price,quantity,amount) VALUES($1,$2,$3,$4,$5,$6)",[result.rows[0].id,line.slug,line.name,line.price,line.quantity,line.amount]);
  }
  await client.query("INSERT INTO order_events(order_id,actor_id,to_status,note) VALUES($1,$2,'received','ثبت سفارش')",[result.rows[0].id,user.id]);
  return result.rows[0].id;
 });
 return NextResponse.json({orderId},{status:201,headers:noStore});
} catch(e){if(e instanceof OrderError)return bad(e.code,409);if(e instanceof SyntaxError)return bad("INVALID_JSON");return errorResponse(e);} }
