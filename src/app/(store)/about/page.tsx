import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCms } from "@/lib/site-cms";
export const dynamic="force-dynamic";
export const metadata: Metadata = {
  title: 'درباره میس دود',
  description: 'درباره فروشگاه میس دود، اطلاعات و راه\u200cهای آشنایی بیشتر با مجموعه.',
  alternates: { canonical: '/about' },
  openGraph: { title: 'درباره میس دود', description: 'درباره فروشگاه میس دود، اطلاعات و راه\u200cهای آشنایی بیشتر با مجموعه.', url: '/about' },
};

export default async function AboutPage() {
  const {about}=await getCms();
  return <main className="mx-auto w-full max-w-4xl px-5 py-12"><article className="grid items-center gap-6 rounded-3xl border border-line bg-panel p-6 sm:grid-cols-[10rem_1fr] sm:p-9">
    <Image src="/brand/miss-dood-logo.png" alt="نشان میس دود" width={160} height={160} className="mx-auto rounded-xl"/>
    <div className="space-y-4"><h1 className="text-3xl font-bold text-accent">{about.heading}</h1>
      {about.paragraphs.map((paragraph,i)=><p key={i} className="whitespace-pre-line leading-8">{paragraph}</p>)}
      <div className="flex flex-wrap gap-4 text-accent"><Link href="/shop">مشاهده محصولات</Link><Link href="/contact">تماس با ما</Link></div>
    </div></article></main>;
}
