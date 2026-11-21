import type { Metadata } from "next";
import ShopCatalog from "@/features/catalog/ShopCatalog";
import {getCms} from "@/lib/site-cms";
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// The CMS is loaded from Neon per request, not while generating static pages.
export const dynamic = "force-dynamic";

const shopMetadata: Metadata = {
  title: "فهرست محصولات",
  description: "مشاهده فهرست محصولات میس دود، اطلاعات کالا، مشخصات و دسته‌بندی‌ها.",
  alternates: { canonical: "/shop" },
  openGraph: { title: "فهرست محصولات", description: "مشاهده فهرست محصولات میس دود، اطلاعات کالا، مشخصات و دسته‌بندی‌ها.", url: "/shop" },
};

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const query = await searchParams;
  // Search and filter results aren't standalone landing pages; avoid indexing infinite variants.
  const hasFilters = Object.keys(query).some((key) => ["q", "category", "brand", "sort", "page", "min", "max"].includes(key));
  return hasFilters ? { ...shopMetadata, robots: { index: false, follow: true } } : shopMetadata;
}

export default async function ShopPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const {catalog}=await getCms();
  return <ShopCatalog params={await searchParams} cmsCategories={catalog.categories}/>;
}
