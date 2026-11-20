import {getCms} from "@/lib/site-cms";
import DecorDeck from "@/features/decor/DecorDeck";
import BuyingGuide from "@/components/home/BuyingGuide";
import LatestProducts from "@/components/home/LatestProducts";
import CategoryGrid from "@/components/home/CategoryGrid";
import BrandStrip from "@/components/home/BrandStrip";
import HeroSlider from "@/components/home/HeroSlider";
import HomeIntro from "@/components/home/HomeIntro";

export const dynamic="force-dynamic";
export default async function Home() {
 const {banners,catalog}=await getCms();
 const brandList = Array.from(
   new Map(catalog.categories.flatMap(category =>
     category.brands.map(brand => [brand.slug, {slug: brand.slug, name: brand.label}] as const)
   )).values()
 );
  return <main aria-label="صفحه اصلی" className="w-full min-w-0 overflow-x-clip">
    <HeroSlider banners={banners}/>
    <HomeIntro/>
    <CategoryGrid categories={catalog.categories}/>
    <LatestProducts/>
    <BrandStrip brandList={brandList}/>
    <DecorDeck/>
    <BuyingGuide/>
  </main>;
}
