import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";
export const runtime="nodejs";
export async function GET() {try {
 type ProductRow={images?:string[];rating?:number;reviewCount?:number;slug:string;category:string;brand:string|null;name:string;description:string|null;image:string|null;priceToman:number;stock:number;specs:unknown};
 type ShippingRow={city:string;fee:number;days:number};
 const [p,s,national]=await Promise.all([
  db().query<ProductRow>(`SELECT slug,category,brand,name,description,image,price_toman::float8 AS "priceToman",stock,specs,
   COALESCE((SELECT json_agg(i.src ORDER BY i.sort_order,i.id) FROM product_images i WHERE i.product_slug=products.slug),'[]'::json) AS images,
   (SELECT round(avg(r.rating)::numeric,1)::float8 FROM product_reviews r WHERE r.product_slug=products.slug AND r.state='approved') AS rating,
   (SELECT count(*)::int FROM product_reviews r WHERE r.product_slug=products.slug AND r.state='approved') AS "reviewCount"
   FROM products WHERE active=true AND deleted_at IS NULL ORDER BY name`),
  db().query<ShippingRow>("SELECT city,fee::float8 AS fee,days FROM shipping_rules WHERE active=true ORDER BY city"),
  db().query<{fee:number;days:string;active:boolean}>("SELECT fee::float8 AS fee,days,active FROM national_shipping_policy WHERE id=1")
 ]);
 return NextResponse.json({products:p.rows.map(({stock,...v})=>v),stock:Object.fromEntries(p.rows.map(v=>[v.slug,v.stock])),shipping:s.rows,nationalPost:national.rows[0]??null},{headers:{"Cache-Control":"no-store"}});
} catch(e){return errorResponse(e);} }
