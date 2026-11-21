import {adminCan,type AdminArea} from "@/lib/admin-access";
import { NextRequest, NextResponse } from "next/server";
import { db, transaction } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { bad, errorResponse, noStore, sameOrigin } from "@/lib/http";
import { validMediaUrl } from "@/lib/catalog-media";

export const runtime = "nodejs";
const statuses = ["received", "processing", "shipped", "delivered", "cancelled"] as const;
const transitions: Record<string, string[]> = {
  received: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};
const validSlug = (value: unknown): value is string =>
  typeof value === "string" && /^[a-z0-9][a-z0-9-]{0,119}$/.test(value);
const validId = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);

export async function GET() {
  try {
    if ((await currentUser())?.role !== "admin") return bad("FORBIDDEN", 403);
    if (!await adminCan(await currentUser(),"reports")) return bad("FORBIDDEN",403);
    const [orders, products, shipping, customers, overview, timeline, bestsellers] = await Promise.all([
      db().query(`SELECT o.id,o.status,o.created_at AS date,o.recipient_name,o.recipient_phone,
        o.shipping_address,o.shipping_city,o.subtotal::float8,o.shipping_fee::float8,o.total::float8,
        COALESCE((SELECT json_agg(json_build_object('name',i.product_name,'slug',i.product_slug,
        'quantity',i.quantity,'amount',i.amount::float8) ORDER BY i.id)
        FROM order_items i WHERE i.order_id=o.id),'[]'::json) AS items
        FROM orders o ORDER BY o.created_at DESC LIMIT 300`),
      db().query(`SELECT slug,name,category,brand,description,image,price_toman::float8 AS "priceToman",
        stock,active,updated_at FROM products ORDER BY updated_at DESC,slug LIMIT 1000`),
      db().query("SELECT city,fee::float8 AS fee,days,active FROM shipping_rules ORDER BY city"),
      db().query(`SELECT u.id,u.email,u.full_name,u.role,u.created_at,
        count(o.id)::int AS "orderCount",
        COALESCE(sum(o.total) FILTER (WHERE o.status<>'cancelled'),0)::float8 AS "orderValue"
        FROM users u LEFT JOIN orders o ON o.user_id=u.id
        GROUP BY u.id,u.email,u.full_name,u.role,u.created_at
        ORDER BY u.created_at DESC LIMIT 300`),
      db().query(`SELECT
        (SELECT count(*)::int FROM orders) AS "orderCount",
        (SELECT count(*)::int FROM orders WHERE status IN ('received','processing','shipped')) AS "openOrderCount",
        (SELECT count(*)::int FROM users WHERE role='customer') AS "customerCount",
        (SELECT count(*)::int FROM products WHERE active) AS "activeProductCount",
        (SELECT count(*)::int FROM products WHERE active AND stock<=5) AS "lowStockCount",
        (SELECT count(*)::int FROM support_tickets WHERE status='open') AS "openTicketCount",
        (SELECT COALESCE(sum(total),0)::float8 FROM orders WHERE status<>'cancelled') AS "orderValue",
        (SELECT COALESCE(sum(total),0)::float8 FROM orders
           WHERE status<>'cancelled' AND created_at>=now()-interval '30 days') AS "last30Value",
        (SELECT count(*)::int FROM orders WHERE created_at>=now()-interval '30 days') AS "last30Orders"`),
      db().query(`SELECT to_char(day::date,'YYYY-MM-DD') AS day,
        COALESCE(x.count,0)::int AS count,COALESCE(x.value,0)::float8 AS value
        FROM generate_series(date_trunc('day',now())-interval '6 days',date_trunc('day',now()),interval '1 day') AS day
        LEFT JOIN LATERAL (
          SELECT count(*)::int AS count, COALESCE(sum(total),0)::float8 AS value FROM orders
          WHERE created_at>=day AND created_at<day+interval '1 day' AND status<>'cancelled'
        ) x ON true ORDER BY day`),
      db().query(`SELECT i.product_slug AS slug,max(i.product_name) AS name,
        sum(i.quantity)::int AS quantity, sum(i.amount)::float8 AS value
        FROM order_items i JOIN orders o ON o.id=i.order_id WHERE o.status<>'cancelled'
        GROUP BY i.product_slug ORDER BY quantity DESC LIMIT 6`),
    ]);
    return NextResponse.json({
      orders: orders.rows, products: products.rows, shipping: shipping.rows, customers: customers.rows,
      overview: overview.rows[0], timeline: timeline.rows, bestsellers: bestsellers.rows,
      limits: { orders: 300, customers: 300, products: 1000 },
    }, { headers: noStore });
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!sameOrigin(req)) return bad("CROSS_ORIGIN", 403);
    if ((await currentUser())?.role !== "admin") return bad("FORBIDDEN", 403);
    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return bad("INVALID_BODY");
    const data = body as Record<string, unknown>;
    const area:AdminArea = data.type==="stock"?"warehouse":data.type==="status"||data.type==="shipping"||data.type==="shippingStatus"?"orders":"catalog";
    if (!await adminCan(await currentUser(),area)) return bad("FORBIDDEN",403);

    if (data.type === "stock") {
      if (!validSlug(data.slug) || !Number.isSafeInteger(data.stock) || (data.stock as number) < 0 || (data.stock as number) > 1_000_000) return bad("INVALID_STOCK");
      const actor = await currentUser();
      const result = await transaction(async client => {
        const previous = await client.query<{stock:number}>("SELECT stock FROM products WHERE slug=$1 FOR UPDATE",[data.slug]);
        if (!previous.rows[0]) return false;
        const before = previous.rows[0].stock, after=data.stock as number;
        await client.query("UPDATE products SET stock=$1,updated_at=now() WHERE slug=$2",[after,data.slug]);
        if(before!==after)await client.query("INSERT INTO inventory_movements(product_slug,actor_id,quantity_delta,before_stock,after_stock,reason) VALUES($1,$2,$3,$4,$5,'admin.adjust')",[data.slug,actor!.id,after-before,before,after]);
        await client.query("INSERT INTO admin_audit_log(actor_id,action,target) VALUES($1,'inventory.adjust',$2)",[actor!.id,data.slug]);
        return true;
      });
      if (!result) return bad("NOT_FOUND", 404);
    } else if (data.type === "status") {
      if (!validId(data.id) || typeof data.status !== "string" || !statuses.includes(data.status as typeof statuses[number])) return bad("INVALID_STATUS");
      await transaction(async client => {
        const old = await client.query<{ status: string }>("SELECT status FROM orders WHERE id=$1 FOR UPDATE", [data.id]);
        if (!old.rows[0]) throw new Error("NOT_FOUND");
        const before = old.rows[0].status;
        const after = data.status as string;
        if (before !== after && !transitions[before]?.includes(after)) throw new Error("INVALID_TRANSITION");
        if (before !== "cancelled" && after === "cancelled") {
          // Record each restored item in the inventory ledger.
          const lines=await client.query<{product_slug:string;quantity:number;stock:number}>(`SELECT i.product_slug,i.quantity,p.stock FROM order_items i JOIN products p ON p.slug=i.product_slug WHERE i.order_id=$1 FOR UPDATE OF p`,[data.id]);
          const actor=await currentUser();
          for(const line of lines.rows)await client.query("INSERT INTO inventory_movements(product_slug,actor_id,quantity_delta,before_stock,after_stock,reason,order_id) VALUES($1,$2,$3,$4,$5,'order.cancel',$6)",[line.product_slug,actor?.id??null,line.quantity,line.stock,line.stock+line.quantity,data.id]);
          await client.query(`UPDATE products p SET stock=p.stock+i.quantity,updated_at=now()
            FROM order_items i WHERE i.order_id=$1 AND p.slug=i.product_slug`, [data.id]);
        }
        await client.query("UPDATE orders SET status=$1 WHERE id=$2", [after, data.id]);
        if(before!==after){
         const actor=await currentUser();
         await client.query("INSERT INTO order_events(order_id,actor_id,from_status,to_status) VALUES($1,$2,$3,$4)",[data.id,actor?.id??null,before,after]);
         await client.query("INSERT INTO admin_audit_log(actor_id,action,target) VALUES($1,'order.status',$2)",[actor?.id??null,data.id]);
        }
      });
    } else if (data.type === "shipping") {
      if (typeof data.city !== "string" || data.city.trim().length < 2 || data.city.length > 120 ||
        !Number.isSafeInteger(data.fee) || (data.fee as number) < 0 || (data.fee as number) > 100_000_000 ||
        typeof data.days !== "string" || data.days.trim().length < 1 || data.days.length > 120) return bad("INVALID_SHIPPING");
      await db().query(`INSERT INTO shipping_rules(city,fee,days) VALUES($1,$2,$3)
        ON CONFLICT(city) DO UPDATE SET fee=$2,days=$3,active=true`, [data.city.trim(), data.fee, data.days.trim()]);
    } else if (data.type === "shippingStatus") {
      if (typeof data.city !== "string" || typeof data.active !== "boolean") return bad("INVALID_SHIPPING");
      const result = await db().query("UPDATE shipping_rules SET active=$1 WHERE city=$2 RETURNING city", [data.active, data.city]);
      if (!result.rowCount) return bad("NOT_FOUND", 404);
    } else if (data.type === "visibility") {
      if (!validSlug(data.slug) || typeof data.active !== "boolean") return bad("INVALID_PRODUCT");
      const result = await db().query("UPDATE products SET active=$1,updated_at=now() WHERE slug=$2 RETURNING slug", [data.active, data.slug]);
      if (!result.rowCount) return bad("NOT_FOUND", 404);
    } else if (data.type === "product") {
      if (!validSlug(data.slug) || typeof data.name !== "string" || !data.name.trim() || data.name.length > 200 ||
        typeof data.category !== "string" || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(data.category) ||
        typeof data.brand !== "string" || data.brand.length > 80 || (data.brand !== "" && !/^[a-z0-9][a-z0-9-]{0,79}$/.test(data.brand)) ||
        !(data.priceToman === null || (Number.isSafeInteger(data.priceToman) && (data.priceToman as number) >= 0)) ||
        !Number.isSafeInteger(data.stock) || (data.stock as number) < 0 || (data.stock as number) > 1_000_000) return bad("INVALID_PRODUCT");
      const description = typeof data.description === "string" ? data.description.slice(0, 3000) : "";
      const image = validMediaUrl(data.image) ? data.image : "/images/categories/lighters.webp";
      const actor = await currentUser();
      await transaction(async client => {
        const prev=await client.query<{stock:number;image:string}>("SELECT stock,image FROM products WHERE slug=$1 FOR UPDATE",[data.slug]);
        if(!await adminCan(actor,"warehouse") && (prev.rows[0]?.stock??0)!==(data.stock as number)) throw new Error("INVENTORY_PERMISSION_REQUIRED");
        await client.query(`INSERT INTO products(slug,brand,name,category,description,image,price_toman,stock)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8)
          ON CONFLICT(slug) DO UPDATE SET brand=$2,name=$3,category=$4,description=$5,image=$6,
            price_toman=$7,stock=$8,updated_at=now()`,
          [data.slug,data.brand,(data.name as string).trim(),data.category,description,image,data.priceToman,data.stock]);
        if(prev.rows[0] && prev.rows[0].stock!==data.stock){
          const before=prev.rows[0].stock,after=data.stock as number;
          await client.query("INSERT INTO inventory_movements(product_slug,actor_id,quantity_delta,before_stock,after_stock,reason) VALUES($1,$2,$3,$4,$5,'admin.product.edit')",[data.slug,actor!.id,after-before,before,after]);
        }
        const images=await client.query("SELECT id,src FROM product_images WHERE product_slug=$1 ORDER BY sort_order,id LIMIT 1",[data.slug]);
        if(!images.rowCount)await client.query("INSERT INTO product_images(product_slug,src,alt,sort_order) VALUES($1,$2,$3,0)",[data.slug,image,data.name]);
        else if(prev.rows[0] && prev.rows[0].image!==image)await client.query("UPDATE product_images SET src=$1 WHERE id=$2",[image,images.rows[0].id]);
        await client.query("INSERT INTO admin_audit_log(actor_id,action,target) VALUES($1,'product.update',$2)",[actor!.id,data.slug]);
      });
    } else return bad("INVALID_TYPE");

    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch (error) {
    if (error instanceof SyntaxError) return bad("INVALID_JSON");
    if (error instanceof Error && error.message === "INVENTORY_PERMISSION_REQUIRED") return bad(error.message,403);
    if (error instanceof Error && ["NOT_FOUND", "INVALID_TRANSITION"].includes(error.message)) return bad(error.message, 409);
    return errorResponse(error);
  }
}
