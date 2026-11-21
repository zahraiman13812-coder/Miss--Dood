import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/seo";

/**
 * The private page layouts use <meta name="robots" content="noindex">.
 * Do not Disallow those HTML pages here: crawlers must be able to fetch
 * them to see the noindex directive. Only block non-page private endpoints.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    }],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
