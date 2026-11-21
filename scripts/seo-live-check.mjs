/** Read-only live SEO audit; never makes changes or needs credentials.
 * Usage: node scripts/seo-live-check.mjs https://missdoodproject.vercel.app [product-path]
 */
const originArg = process.argv[2] || "https://missdoodproject.vercel.app";
let origin;
try {
  const url = new URL(originArg);
  if (!/^https?:$/.test(url.protocol)) throw new Error("Invalid protocol");
  origin = url.origin;
} catch { console.error("Provide a valid http(s) origin"); process.exit(2); }
const productPath = process.argv[3];
const checks = [];
const assert = (condition, text) => {
  checks.push({ ok: Boolean(condition), text });
  console.log(`${condition ? "PASS" : "FAIL"} ${text}`);
};
async function get(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(new URL(path, origin), {
      signal: controller.signal,
      headers: { "User-Agent": "MISS-DOOD-SEO-Audit/1.0" },
      redirect: "follow", cache: "no-store",
    });
    return { status: response.status, url: response.url, body: await response.text(), contentType: response.headers.get("content-type") || "" };
  } finally { clearTimeout(timeout); }
}
function tag(html, attribute) {
  return [...html.matchAll(/<meta\s+[^>]*>/gi)].map(x => x[0]).find(x => new RegExp(`\\b(?:name|property)=["']${attribute}["']`, "i").test(x));
}
function canonical(html) {
  const match = [...html.matchAll(/<link\s+[^>]*>/gi)].map(x => x[0]).find(x => /\brel=["']canonical["']/i.test(x));
  return match?.match(/\bhref=["']([^"']+)/i)?.[1] || "";
}
try {
  const robots = await get("/robots.txt");
  assert(robots.status === 200, "robots.txt returns HTTP 200");
  assert(/sitemap:\s*https?:\/\//i.test(robots.body), "robots.txt advertises a sitemap");
  const map = await get("/sitemap.xml");
  assert(map.status === 200 && /<urlset\b/.test(map.body), "sitemap.xml returns valid-looking URL set");
  assert(map.body.includes(`${origin}/`), "Sitemap includes production homepage");
  assert(!/<loc>[^<]*\/(admin|account|cart|checkout|login)(\/|<)/i.test(map.body), "Sitemap excludes private pages");
  const home = await get("/");
  assert(home.status === 200, "Homepage returns HTTP 200");
  assert(/<html[^>]+lang=["']fa["']/i.test(home.body), "Homepage declares Persian language");
  assert(/<title>[^<]+<\/title>/i.test(home.body), "Homepage has non-empty title");
  assert(Boolean(tag(home.body, "description")), "Homepage has meta description");
  assert(canonical(home.body) === `${origin}/`, "Homepage canonical points to production URL");
  const cart = await get("/cart");
  assert(Boolean(tag(cart.body, "robots")?.match(/noindex/i)), "Cart page includes noindex");
  const filtered = await get("/shop?q=seo-audit-probe");
  assert(Boolean(tag(filtered.body, "robots")?.match(/noindex/i)), "Filtered search page includes noindex");
  if (productPath) {
    const path = productPath.startsWith("/") ? productPath : `/products/${productPath}`;
    const product = await get(path);
    assert(product.status === 200, "Product page returns HTTP 200");
    assert(canonical(product.body).startsWith(`${origin}/products/`), "Product canonical is on production origin");
    assert(product.body.includes('"@type":"Product"') || product.body.includes('"@type": "Product"'), "Product JSON-LD exists");
    assert(product.body.includes('"@type":"BreadcrumbList"') || product.body.includes('"@type": "BreadcrumbList"'), "Product breadcrumb JSON-LD exists");
  }
} catch (e) {
  console.error("Live audit request failed:", e instanceof Error ? e.message : "unknown");
  process.exitCode = 1;
}
if (checks.some(c => !c.ok)) process.exitCode = 1;
else if (!process.exitCode) console.log(`Live SEO smoke checks passed (${checks.length} checks). Google indexing remains a separate process.`);
