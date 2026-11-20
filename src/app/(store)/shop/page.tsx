import ShopCatalog from "@/features/catalog/ShopCatalog";
import {getCms} from "@/lib/site-cms";
export default async function ShopPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const {catalog}=await getCms();
  return <ShopCatalog params={await searchParams} cmsCategories={catalog.categories}/>;
}
