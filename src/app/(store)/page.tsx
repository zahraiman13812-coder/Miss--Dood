import type { Metadata } from "next";
import {getCms} from "@/lib/site-cms";
import DecorDeck from "@/features/decor/DecorDeck";
import LatestProducts from "@/components/home/LatestProducts";
import CategoryGrid from "@/components/home/CategoryGrid";
import BrandStrip from "@/components/home/BrandStrip";
import HeroSlider from "@/components/home/HeroSlider";
import HomeIntro from "@/components/home/HomeIntro";

export const dynamic="force-dynamic";
export const metadata: Metadata = {
  title: { absolute: 'MISS DOOD | میس دود' },
  description: 'وب\u200cسایت رسمی میس دود؛ آشنایی با محصولات، مشاهده مشخصات، راهنمای خرید و اطلاعات تماس فروشگاه.',
  alternates: { canonical: '/' },
  openGraph: { title: 'MISS DOOD | میس دود', description: 'وب\u200cسایت رسمی میس دود؛ آشنایی با محصولات، مشاهده مشخصات، راهنمای خرید و اطلاعات تماس فروشگاه.', url: '/' },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "MISS DOOD",
  alternateName: "میس دود",
  url: "https://missdoodproject.vercel.app/",
  inLanguage: "fa-IR",
};

export default async function Home() {
 const {banners,catalog}=await getCms();
 const brandList = Array.from(
   new Map(catalog.categories.flatMap(category =>
     category.brands.map(brand => [brand.slug, {slug: brand.slug, name: brand.label, image: brand.image}] as const)
   )).values()
 );
  return <main aria-label="صفحه اصلی" className="w-full min-w-0 overflow-x-clip">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema).replace(/</g, "\\u003c") }} />
    <HeroSlider banners={banners}/>
    <HomeIntro/>
    <CategoryGrid categories={catalog.categories}/>
    <LatestProducts/>
    <BrandStrip brandList={brandList}/>
    <DecorDeck/>
  </main>;
}
