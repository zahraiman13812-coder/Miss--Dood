import {NextRequest,NextResponse} from "next/server";
import {currentUser} from "@/lib/session";
import {adminCan,getAdminScope} from "@/lib/admin-access";
import {db,transaction} from "@/lib/db";
import {bad,errorResponse,noStore,sameOrigin} from "@/lib/http";
export const runtime="nodejs";
export async function GET(req:NextRequest){try{
 const user=await currentUser();if(user?.role!=="admin"||!await adminCan(user,"orders"))return bad("FORBIDDEN",403);
 const page=Math.min(1000,Math.max(1,Number(req.nextUrl.searchParams.get("page"))||1));
 const status=req.nextUrl.searchParams.get("status")??"";
 if(status&&!['received','processing','shipped','delivered','cancelled'].includes(status))return bad("INVALID_STATUS");
 const q=req.nextUrl.searchParams.get("q")?.trim()??"";
 if(q.length>120)return bad("INVALID_SEARCH");
 const result=await db().query(`SELECT id,status,created_at,recipient_name,shipping_city,total::float8 AS total,payment_status FROM orders WHERE ($1::text='' OR status=$1) AND ($2::text='' OR recipient_name ILIKE '%'||$2||'%' OR id::text ILIKE '%'||$2||'%') ORDER BY created_at DESC LIMIT 50 OFFSET $3`,[status,q,(page-1)*50]);
 return NextResponse.json({orders:result.rows,page,canDelete:await getAdminScope(user)==="owner"},{headers:noStore});
 }catch(e){return errorResponse(e)}}

// Permanently removes an order and its invoice. Only the explicitly scoped primary owner may do so.
export async function DELETE(req:NextRequest){try{
 if(!sameOrigin(req))return bad("CROSS_ORIGIN",403);
 const user=await currentUser();
 if(user?.role!=="admin"||await getAdminScope(user)!=="owner")return bad("FORBIDDEN",403);
 const payload=await req.json().catch(()=>null);
 const id=payload?.id;
 if(typeof id!=="string"||!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id))return bad("INVALID_ID");
 await transaction(async client=>{
  const result=await client.query<{status:string}>("SELECT status FROM orders WHERE id=$1 FOR UPDATE",[id]);
  if(!result.rowCount)throw Error("NOT_FOUND");
  // Only unfulfilled orders return to stock; shipped/delivered orders are not physically returned.
  if(["received","processing"].includes(result.rows[0].status)){
   const items=await client.query<{product_slug:string;quantity:number}>("SELECT product_slug,quantity FROM order_items WHERE order_id=$1",[id]);
   for(const item of items.rows){
    const stock=await client.query<{stock:number}>("SELECT stock FROM products WHERE slug=$1 FOR UPDATE",[item.product_slug]);
    if(!stock.rowCount)continue;
    const before=stock.rows[0].stock,after=before+item.quantity;
    await client.query("UPDATE products SET stock=$1 WHERE slug=$2",[after,item.product_slug]);
    await client.query("INSERT INTO inventory_movements(product_slug,actor_id,quantity_delta,before_stock,after_stock,reason) VALUES($1,$2,$3,$4,$5,$6)",[item.product_slug,user.id,item.quantity,before,after,"order.deleted"]);
   }
  }
  await client.query("DELETE FROM orders WHERE id=$1",[id]);
  await client.query("INSERT INTO admin_audit_log(actor_id,action,target) VALUES($1,$2,$3)",[user.id,"order.deleted",id]);
 });
 return NextResponse.json({ok:true},{headers:noStore});
}catch(e){if(e instanceof Error&&e.message==="NOT_FOUND")return bad("NOT_FOUND",404);return errorResponse(e)}}
