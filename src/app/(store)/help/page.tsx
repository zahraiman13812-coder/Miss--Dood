import Link from "next/link";
import {getCms} from "@/lib/site-cms";
export const metadata = {
  title: "راهنمای خرید و پرسش‌های متداول",
  description: "پاسخ پرسش‌های متداول و راهنمای استفاده از خدمات و پشتیبانی فروشگاه میس دود.",
  alternates: { canonical: "/help" },
  openGraph: { url: "/help", title: "راهنمای خرید و پرسش‌های متداول" },
};
export const dynamic="force-dynamic";
export default async function HelpPage(){const {guide}=await getCms();return <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8 sm:py-12"><nav className="mb-4 text-sm text-muted"><Link href="/">خانه</Link> / راهنمای خرید</nav><h1 className="mb-3 text-2xl font-bold sm:text-3xl">راهنمای خرید و پرسش‌های متداول</h1><p className="mb-8 leading-8 text-muted">{guide.intro}</p><div className="space-y-3">{guide.questions.map(({question,answer},i)=><details key={`${question}-${i}`} className="group rounded-2xl border border-line bg-panel p-4 sm:p-5"><summary className="cursor-pointer font-semibold leading-7">{question}</summary><p className="mt-3 whitespace-pre-line border-t border-line pt-3 leading-8 text-muted">{answer}</p></details>)}</div><div className="mt-8 flex flex-wrap gap-3"><Link href="/shop" className="rounded-xl bg-accent px-5 py-3 font-bold text-on-accent">مشاهده محصولات</Link><Link href="/contact" className="rounded-xl border border-line px-5 py-3 font-bold">تماس با ما</Link></div></main>}
