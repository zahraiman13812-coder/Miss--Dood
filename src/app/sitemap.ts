import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE_ORIGIN } from "@/lib/seo";

// Read product URLs at request time; don't depend on Neon during builds.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_ORIGIN}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_ORIGIN}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_ORIGIN}/decor`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_ORIGIN}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_ORIGIN}/contact`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_ORIGIN}/help`, changeFrequency: "monthly", priority: 0.5 },
  ];
  try {
    // Mirrors the live-product condition of the archive feature (migration 011).
    const result = await db().query<{ slug: string; updated_at: Date }>(
      `SELECT slug, updated_at FROM products
       WHERE active = true AND deleted_at IS NULL
       ORDER BY updated_at DESC LIMIT 10000`,
    );
    for (const product of result.rows) {
      if (!/^[a-z0-9][a-z0-9-]{0,119}$/.test(product.slug)) continue;
      pages.push({
        url: `${SITE_ORIGIN}/products/${encodeURIComponent(product.slug)}`,
        lastModified: product.updated_at,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch (error) {
    // Keep static pages available when Neon is temporarily unavailable.
    console.error("Sitemap products unavailable", error instanceof Error ? error.name : "unknown");
  }
  return pages;
}
