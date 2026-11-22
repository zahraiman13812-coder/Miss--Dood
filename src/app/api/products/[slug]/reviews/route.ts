import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {currentUser} from "@/lib/session";
import {consumeAuthAttempt} from "@/lib/authRateLimit";
import {bad,errorResponse,noStore,sameOrigin} from "@/lib/http";
export const runtime="nodejs";
export async function GET(_req:NextRequest,{params}:{params:Promise<{slug:string}>}){
 try{const {slug}=await params;if(!/^[a-z0-9][a-z0-9-]{0,119}$/.test(slug))return bad("INVALID_PRODUCT");
 const r=await db().query(`SELECT r.rating,r.body,r.created_at,CASE WHEN EXISTS (SELECT 1 FROM order_items i JOIN orders o ON o.id=i.order_id WHERE o.user_id=r.user_id AND i.product_slug=r.product_slug AND o.status='delivered') THEN 'خریدار تأییدشده' ELSE 'نظر کاربر' END AS author FROM product_reviews r WHERE r.product_slug=$1 AND r.state='approved' ORDER BY r.created_at DESC LIMIT 50`,[slug]);return NextResponse.json({reviews:r.rows},{headers:noStore});}catch(e){return errorResponse(e)}
}
export async function POST(req:NextRequest,{params}:{params:Promise<{slug:string}>}){
 try{if(!sameOrigin(req))return bad("CROSS_ORIGIN",403);const actor=await currentUser();if(!actor)return bad("AUTH_REQUIRED",401);
 const {slug}=await params;if(!/^[a-z0-9][a-z0-9-]{0,119}$/.test(slug))return bad("INVALID_PRODUCT");
 // Only visible, non-archived products can receive new reviews.
 const product=await db().query<{slug:string}>("SELECT slug FROM products WHERE slug=$1 AND active=true AND deleted_at IS NULL",[slug]);
 if(!product.rows[0])return bad("PRODUCT_UNAVAILABLE",404);
 // Distributed database-backed limit shared between Vercel instances.
 if(!await consumeAuthAttempt(`review:${actor.id}`,`product:${slug}`))return bad("TOO_MANY_ATTEMPTS",429);
 const input=await req.json();if(!input||typeof input!=="object"||!Number.isInteger(input.rating)||input.rating<1||input.rating>5||typeof input.body!=="string"||input.body.trim().length<10||input.body.trim().length>1500)return bad("INVALID_REVIEW");
 // Non-purchasers may submit moderated reviews; verified label is earned only after delivery.

 // A rejected review can be revised and resubmitted for moderation; pending and approved cannot.
 const saved=await db().query(`INSERT INTO product_reviews(product_slug,user_id,rating,body,state)
   VALUES($1,$2,$3,$4,'pending')
   ON CONFLICT(product_slug,user_id) DO UPDATE
   SET rating=EXCLUDED.rating,body=EXCLUDED.body,state='pending',created_at=now(),reviewed_at=NULL
   WHERE product_reviews.state='rejected'
   RETURNING id`,[slug,actor.id,input.rating,input.body.trim()]);
 if(!saved.rowCount)return bad("REVIEW_EXISTS",409);
 return NextResponse.json({ok:true,status:"pending"},{status:201,headers:noStore});
 }catch(e){if(e instanceof SyntaxError)return bad("INVALID_JSON");if((e as {code?:string}).code==="23505")return bad("REVIEW_EXISTS",409);return errorResponse(e)}
}
