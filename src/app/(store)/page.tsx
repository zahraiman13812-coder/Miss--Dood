import DecorDeck from "@/features/decor/DecorDeck";
import BuyingGuide from "@/components/home/BuyingGuide";
import LatestProducts from "@/components/home/LatestProducts";
import CategoryGrid from "@/components/home/CategoryGrid";
import BrandStrip from "@/components/home/BrandStrip";
import HeroSlider from "@/components/home/HeroSlider";
import HomeIntro from "@/components/home/HomeIntro";

export default function Home() {
  return <main aria-label="صفحه اصلی" className="w-full min-w-0 overflow-x-clip">
    <HeroSlider/>
    <HomeIntro/>
    <CategoryGrid/>
    <LatestProducts/>
    <BrandStrip/>
    <DecorDeck/>
    <BuyingGuide/>
  </main>;
}
