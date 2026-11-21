import type { Metadata } from "next";
import DecorCatalog from "@/features/decor/DecorCatalog";

export const metadata: Metadata = {
  title: 'محصولات تزئینی',
  description: 'معرفی محصولات تزئینی میس دود همراه با تصاویر، توضیحات و مشخصات هر محصول.',
  alternates: { canonical: '/decor' },
  openGraph: { title: 'محصولات تزئینی', description: 'معرفی محصولات تزئینی میس دود همراه با تصاویر، توضیحات و مشخصات هر محصول.', url: '/decor' },
};

export default function DecorPage() {
  return <DecorCatalog />;
}
