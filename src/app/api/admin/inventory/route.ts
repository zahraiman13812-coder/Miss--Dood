import {adminCan} from "@/lib/admin-access";
import {NextRequest,NextResponse} from "next/server";
import {currentUser} from "@/lib/session";
import {db} from "@/lib/db";
import {bad,errorResponse,noStore} from "@/lib/http";
export const runtime="nodejs";
export async function GET(req:NextRequest){try{if((await currentUser())?.role!=="admin"||!await adminCan(await currentUser(),"warehouse"))return bad("FORBIDDEN",403);
 const slug=req.nextUrl.searchParams.get("slug");if(slug&&!/^[a-z0-9][a-z0-9-]{0,119}$/.test(slug))return bad("INVALID_SLUG");
 const [stock,movements]=await Promise.all([db().query("SELECT slug,name,stock,active FROM products ORDER BY stock ASC,name LIMIT 1000"),db().query(`SELECT m.product_slug,p.name,m.quantity_delta,m.before_stock,m.after_stock,m.reason,m.created_at FROM inventory_movements m JOIN products p ON p.slug=m.product_slug WHERE ($1::text IS NULL OR m.product_slug=$1) ORDER BY m.created_at DESC,m.id DESC LIMIT 250`,[slug||null])]);return NextResponse.json({stock:stock.rows,movements:movements.rows},{headers:noStore})}catch(e){return errorResponse(e)}}
