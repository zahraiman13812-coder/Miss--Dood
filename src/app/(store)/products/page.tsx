import type { Metadata } from "next";
import ShopPage from "../shop/page";

// This route reuses ShopPage; route-level config must be explicit here too.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'محصولات',
  description: 'فهرست محصولات میس دود؛ مشاهده جزئیات و مشخصات کالاها.',
  alternates: { canonical: '/shop' },
  openGraph: { title: 'محصولات', description: 'فهرست محصولات میس دود؛ مشاهده جزئیات و مشخصات کالاها.', url: '/shop' },
};

export default ShopPage;
