import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {currentUser} from "@/lib/session";
import {bad,errorResponse,noStore,sameOrigin} from "@/lib/http";
export const runtime="nodejs";
export async function GET(_req:NextRequest,{params}:{params:Promise<{slug:string}>}){
 try{const {slug}=await params;if(!/^[a-z0-9][a-z0-9-]{0,119}$/.test(slug))return bad("INVALID_PRODUCT");
 const r=await db().query(`SELECT r.rating,r.body,r.created_at,'خریدار تأییدشده'::text AS author FROM product_reviews r WHERE r.product_slug=$1 AND r.state='approved' ORDER BY r.created_at DESC LIMIT 50`,[slug]);return NextResponse.json({reviews:r.rows},{headers:noStore});}catch(e){return errorResponse(e)}
}
export async function POST(req:NextRequest,{params}:{params:Promise<{slug:string}>}){
 try{if(!sameOrigin(req))return bad("CROSS_ORIGIN",403);const actor=await currentUser();if(!actor)return bad("AUTH_REQUIRED",401);
 const {slug}=await params;if(!/^[a-z0-9][a-z0-9-]{0,119}$/.test(slug))return bad("INVALID_PRODUCT");
 const input=await req.json();if(!input||typeof input!=="object"||!Number.isInteger(input.rating)||input.rating<1||input.rating>5||typeof input.body!=="string"||input.body.trim().length<10||input.body.trim().length>1500)return bad("INVALID_REVIEW");
 const bought=await db().query(`SELECT 1 FROM order_items i JOIN orders o ON i.order_id=o.id WHERE o.user_id=$1 AND i.product_slug=$2 AND o.status='delivered' LIMIT 1`,[actor.id,slug]);
 if(!bought.rowCount)return bad("VERIFIED_PURCHASE_REQUIRED",403);
 const prior=await db().query("SELECT id FROM product_reviews WHERE product_slug=$1 AND user_id=$2",[slug,actor.id]);if(prior.rowCount)return bad("REVIEW_EXISTS",409);
 await db().query("INSERT INTO product_reviews(product_slug,user_id,rating,body) VALUES($1,$2,$3,$4)",[slug,actor.id,input.rating,input.body.trim()]);
 return NextResponse.json({ok:true,status:"pending"},{status:201,headers:noStore});
 }catch(e){if(e instanceof SyntaxError)return bad("INVALID_JSON");if((e as {code?:string}).code==="23505")return bad("REVIEW_EXISTS",409);return errorResponse(e)}
}
