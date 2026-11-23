import {NextRequest,NextResponse} from "next/server";
import {currentUser} from "@/lib/session";
import {db} from "@/lib/db";
import {bad,errorResponse,noStore,sameOrigin} from "@/lib/http";
export const runtime="nodejs";
export async function POST(req:NextRequest){try{
 if(!sameOrigin(req))return bad("CROSS_ORIGIN",403);
 const user=await currentUser();if(!user)return bad("AUTH_REQUIRED",401);
 const v=await req.json();if(!v||!Array.isArray(v.items)||v.items.length<1||v.items.length>50)return bad("INVALID_ITEMS");
 const seen=new Set<string>();let subtotal=0;const lines=[];
 for(const i of v.items){if(!i||typeof i.slug!=="string"||!/^[a-z0-9][a-z0-9-]{0,119}$/.test(i.slug)||!Number.isSafeInteger(i.quantity)||i.quantity<1||i.quantity>99||seen.has(i.slug))return bad("INVALID_ITEMS");seen.add(i.slug)}
 const method=v.shippingMethod;if(!["post","express","pickup"].includes(method))return bad("INVALID_SHIPPING_METHOD");
 const name=typeof v.recipientName==="string"?v.recipientName.trim():"";
 const phone=typeof v.recipientPhone==="string"?v.recipientPhone.trim():"";
 const address=typeof v.shippingAddress==="string"?v.shippingAddress.trim():"";
 const province=typeof v.shippingProvince==="string"?v.shippingProvince.trim():"";
 const building=typeof v.building==="string"?v.building.trim():"";
 const postalCode=typeof v.postalCode==="string"?v.postalCode.replace(/[۰-۹٠-٩]/g,(c:string)=>String(c.charCodeAt(0)-(c.charCodeAt(0)>1700?1776:1632))).replace(/\s/g,""):"";
 const coordsPresent=typeof v.latitude==="number"&&typeof v.longitude==="number"&&Number.isFinite(v.latitude)&&Number.isFinite(v.longitude)&&v.latitude>=-90&&v.latitude<=90&&v.longitude>=-180&&v.longitude<=180;
 if((v.latitude!=null||v.longitude!=null)&&!coordsPresent)return bad("INVALID_LOCATION");
 if(name.length<2||name.length>120||!/^\+?[0-9۰-۹٠-٩ \-]{8,22}$/.test(phone))return bad("INVALID_RECIPIENT");
 if(method!=="pickup"&&(!province||!building||address.length<6||address.length>1000||!/^[0-9]{10}$/.test(postalCode)))return bad("INVALID_SHIPPING_ADDRESS");
 const city=typeof v.shippingCity==='string'?v.shippingCity.trim():'';
 if(!city||city.length>120)return bad("INVALID_SHIPPING_CITY");
 const products=await db().query<{slug:string;name:string;stock:number;price:string|null}>("SELECT slug,name,stock,price_toman::text AS price FROM products WHERE active=true AND deleted_at IS NULL AND slug=ANY($1::text[])",[...seen]);
 if(products.rows.length!==seen.size)return bad("PRODUCT_UNAVAILABLE",409);
 for(const i of v.items){const p=products.rows.find(p=>p.slug===i.slug)!;if(p.stock<i.quantity)return bad("INSUFFICIENT_STOCK",409);if(p.price===null)return bad("PRICE_UNAVAILABLE",409);const amount=Number(p.price)*i.quantity;if(!Number.isSafeInteger(amount)||!Number.isSafeInteger(subtotal+amount))return bad("AMOUNT_OVERFLOW");subtotal+=amount;lines.push({slug:p.slug,name:p.name,quantity:i.quantity,amount})}
 let fee=0;
 const d=await db().query<{fee:string}>("SELECT fee::text FROM delivery_rate_options WHERE province=$1 AND city=$2 AND method_key=$3 AND active=true",[province,city,method]);
 const hasCustom=await db().query<{found:boolean}>("SELECT EXISTS(SELECT 1 FROM delivery_rate_options WHERE province=$1 AND city=$2 AND active=true AND method_key IN ('post','express','pickup')) AS found",[province,city]);
 if(hasCustom.rows[0]?.found&&!d.rows[0])return bad("INVALID_SHIPPING_METHOD",409);
 if(!hasCustom.rows[0]?.found && !["post","express","pickup"].includes(method))return bad("INVALID_SHIPPING_METHOD",409);
 if(!hasCustom.rows[0]?.found && method!=="post" && city!=="تهران")return bad("TEHRAN_ONLY",409);
 if(d.rows[0])fee=Number(d.rows[0].fee);
 else if(method==='express'){
  const r=await db().query<{fee:string}>("SELECT fee::text AS fee FROM delivery_config WHERE method='express' AND active=true");if(!r.rows[0])return bad("EXPRESS_UNAVAILABLE",409);fee=Number(r.rows[0].fee)
 }else if(method==='post'&&!d.rows[0]){
  const r=await db().query<{fee:string}>("SELECT fee::text AS fee FROM shipping_rules WHERE city=$1 AND active=true",[city]);
  if(r.rows[0])fee=Number(r.rows[0].fee);
  else{const n=await db().query<{fee:string}>("SELECT fee::text AS fee FROM national_shipping_policy WHERE id=1 AND active=true");if(!n.rows[0])return bad("INVALID_SHIPPING_CITY",409);fee=Number(n.rows[0].fee)}
 }
 if(!Number.isSafeInteger(subtotal+fee))return bad("AMOUNT_OVERFLOW");
 return NextResponse.json({demo:true,orderCreated:false,paymentCollected:false,city,method,lines,subtotal,shippingFee:fee,total:subtotal+fee},{headers:noStore});
}catch(e){if(e instanceof SyntaxError)return bad("INVALID_JSON");return errorResponse(e)}}
