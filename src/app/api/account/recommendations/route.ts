import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { bad, errorResponse, noStore } from "@/lib/http";

export const runtime = "nodejs";

type Product = {
  slug: string; name: string; category: string; description: string;
  image: string; priceToman: number | null; brand: string; stock: number;
};

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return bad("AUTH_REQUIRED", 401);
    // Rank by the signed-in customer's saved products and historical order categories.
    // Fall back to recently updated in-stock products if no purchase/favorite signal exists.
    const result = await db().query<Product>(`
      WITH signals AS (
        SELECT p.category, 4::int AS points FROM favorites f
        JOIN products p ON p.slug=f.product_slug WHERE f.user_id=$1
        UNION ALL
        SELECT p.category, LEAST(i.quantity, 5)::int AS points FROM orders o
        JOIN order_items i ON i.order_id=o.id
        JOIN products p ON p.slug=i.product_slug
        WHERE o.user_id=$1 AND o.status <> 'cancelled'
      ), preference AS (
        SELECT category, SUM(points) AS score FROM signals GROUP BY category
      ), seen AS (
        SELECT product_slug AS slug FROM favorites WHERE user_id=$1
        UNION SELECT i.product_slug AS slug FROM order_items i JOIN orders o ON o.id=i.order_id WHERE o.user_id=$1
      )
      SELECT p.slug,p.name,p.category,p.description,p.image,
             p.price_toman::float8 AS "priceToman",p.brand,p.stock
      FROM products p LEFT JOIN preference pref ON pref.category=p.category
      LEFT JOIN seen ON seen.slug=p.slug
      WHERE p.active=true AND p.stock > 0 AND p.price_toman IS NOT NULL
      ORDER BY COALESCE(pref.score,0) DESC, CASE WHEN seen.slug IS NULL THEN 0 ELSE 1 END,
               p.updated_at DESC, p.slug LIMIT 8
    `, [user.id]);
    const hasSignals = await db().query<{ count: number }>(`
      SELECT (
        (SELECT count(*) FROM favorites WHERE user_id=$1)
        + (SELECT count(*) FROM order_items i JOIN orders o ON o.id=i.order_id WHERE o.user_id=$1 AND o.status<>'cancelled')
      )::int AS count
    `, [user.id]);
    return NextResponse.json({
      recommendations: result.rows.map(({ stock, ...product }) => product),
      personalized: (hasSignals.rows[0]?.count ?? 0) > 0,
    }, { headers: noStore });
  } catch (error) { return errorResponse(error); }
}
