import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";
export const runtime="nodejs";
export async function GET() {try {
 type ProductRow={slug:string;category:string;brand:string|null;name:string;description:string|null;image:string|null;priceToman:number;stock:number;specs:unknown};
 type ShippingRow={city:string;fee:number;days:number};
 const [p,s]=await Promise.all([
  db().query<ProductRow>(`SELECT slug,category,brand,name,description,image,price_toman::float8 AS "priceToman",stock,specs FROM products WHERE active=true ORDER BY name`),
  db().query<ShippingRow>("SELECT city,fee::float8 AS fee,days FROM shipping_rules WHERE active=true ORDER BY city")
 ]);
 return NextResponse.json({products:p.rows.map(({stock,...v})=>v),stock:Object.fromEntries(p.rows.map(v=>[v.slug,v.stock])),shipping:s.rows},{headers:{"Cache-Control":"no-store"}});
} catch(e){return errorResponse(e);} }
