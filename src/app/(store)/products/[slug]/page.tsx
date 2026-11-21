import type {Metadata} from "next";
import {db} from "@/lib/db";
import { absoluteSiteUrl, seoDescription } from "@/lib/seo";
import ProductDetail from "@/features/catalog/ProductDetail";
import { SITE_NAME } from "@/lib/seo";
export default async function ProductPage({params}:{params:Promise<{slug:string}>}) {
  const { slug } = await params;
  // Breadcrumb markup reflects actual public page hierarchy (no invented reviews/ratings).
  if (!/^[a-z0-9][a-z0-9-]{0,119}$/.test(slug)) return <ProductDetail slug={slug} />;
  let breadcrumb: Record<string, unknown> | null = null;
  let productSchema: Record<string, unknown> | null = null;
  try {
    const result = await db().query<{ name: string; description: string; image: string; brand: string }>(
      "SELECT name,description,image,brand FROM products WHERE slug=$1 AND active=true AND deleted_at IS NULL", [slug],
    );
    const product = result.rows[0];
    if (product) {
      const url = absoluteSiteUrl(`/products/${slug}`);
      const image = product.image?.startsWith("/") && !product.image.startsWith("//")
        ? absoluteSiteUrl(product.image)
        : /^https:\/\/[^\s<>"']+$/.test(product.image ?? "") ? product.image : undefined;
      // Describe only verified catalog fields; never invent ratings, availability or paid orders.
      productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "@id": `${url}#product`,
        name: product.name,
        url,
        ...(product.description?.trim() ? { description: seoDescription(product.description) } : {}),
        ...(image ? { image: [image] } : {}),
        ...(product.brand?.trim() ? { brand: { "@type": "Brand", name: product.brand.trim() } } : {}),
      };
    }
    if (product) breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE_NAME, item: absoluteSiteUrl("/") },
        { "@type": "ListItem", position: 2, name: "فروشگاه", item: absoluteSiteUrl("/shop") },
        { "@type": "ListItem", position: 3, name: product.name, item: absoluteSiteUrl(`/products/${slug}`) },
      ],
    };
  } catch {
    // A transient database failure must not fabricate product data.
  }
  return <>
    {productSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{
      __html: JSON.stringify(productSchema).replace(/</g, "\\u003c"),
    }} />}
    {breadcrumb && <script type="application/ld+json" dangerouslySetInnerHTML={{
      __html: JSON.stringify(breadcrumb).replace(/</g, "\\u003c"),
    }} />}
    <ProductDetail slug={slug} />
  </>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!/^[a-z0-9][a-z0-9-]{0,119}$/.test(slug)) {
    return { title: "محصول یافت نشد", robots: { index: false, follow: false } };
  }
  try {
    const result = await db().query<{ name: string; description: string; image: string }>(
      "SELECT name,description,image FROM products WHERE slug=$1 AND active=true AND deleted_at IS NULL", [slug],
    );
    const product = result.rows[0];
    if (!product) return { title: "محصول یافت نشد", robots: { index: false, follow: false } };
    const description = seoDescription(product.description, `مشخصات و اطلاعات محصول ${product.name} در میس دود.`);
    const canonical = `/products/${slug}`;
    const safeImage = product.image?.startsWith("/") && !product.image.startsWith("//")
      ? absoluteSiteUrl(product.image)
      : /^https:\/\/[^\s<>"']+$/.test(product.image ?? "") ? product.image : undefined;
    return {
      title: product.name,
      description,
      alternates: { canonical },
      openGraph: { type: "website", title: product.name, description, url: canonical,
        ...(safeImage ? { images: [{ url: safeImage, alt: product.name }] } : {}) },
      twitter: { card: "summary_large_image", title: product.name, description,
        ...(safeImage ? { images: [safeImage] } : {}) },
    };
  } catch {
    // Do not fabricate a description for a product whose database record is unavailable.
    return { title: "محصولات MISS DOOD", robots: { index: false, follow: false } };
  }
}
