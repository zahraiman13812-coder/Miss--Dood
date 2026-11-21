import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (f) => readFileSync(join(root, f), "utf8");
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };

const seo = read("src/lib/seo.ts");
const robots = read("src/app/robots.ts");
const sitemap = read("src/app/sitemap.ts");
const product = read("src/app/(store)/products/[slug]/page.tsx");
const layout = read("src/app/layout.tsx");
check(seo.includes("https://missdoodproject.vercel.app"), "Origin must match canonical production domain");
check(robots.includes("/sitemap.xml"), "robots must reference sitemap");
check(!robots.includes('"/cart"') && !robots.includes('"/login"'), "HTML pages with noindex must not be blocked from crawling");
check(sitemap.includes("active = true AND deleted_at IS NULL"), "Sitemap must exclude archived/inactive items");
check(product.includes("active=true AND deleted_at IS NULL"), "Metadata must exclude archived/inactive items");
for (const f of ["admin", "account", "cart", "checkout", "login", "orders", "favorites", "compare"]) {
  const route = `src/app/(store)/${f}/layout.tsx`;
  check(existsSync(join(root, route)) && /index:\s*false/.test(read(route)), `${route} must set noindex`);
}
for (const f of ["opengraph-image.png", "twitter-image.png", "apple-icon.png", "favicon.ico"]) {
  check(existsSync(join(root, "src/app", f)), `Missing social/icon asset: ${f}`);
}
check(layout.includes('lang="fa"') && layout.includes('dir="rtl"'), "HTML language/direction required");
check(layout.includes("metadataBase"), "metadataBase required");
check(product.includes("generateMetadata"), "Product pages need dynamic metadata");
if (errors.length) {
  for (const e of errors) console.error(`FAIL: ${e}`);
  process.exitCode = 1;
} else console.log("SEO source audit passed (live crawl / Search Console still required)");
