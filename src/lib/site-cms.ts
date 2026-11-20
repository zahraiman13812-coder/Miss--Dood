import "server-only";
import { db } from "@/lib/db";
import { categories, categoryBrands } from "@/data/navigation";
import { storeContact } from "@/data/storeContact";

export type Banner = { src: string; alt: string; href: string; active: boolean };
export type SiteCms = {
  contact: { address: string; phones: string[]; description: string };
  about: { heading: string; paragraphs: string[] };
  guide: { intro: string; questions: { question: string; answer: string }[] };
  banners: Banner[];
  catalog: { categories: { slug: string; label: string; brands: { slug: string; label: string }[] }[] };
};
export const defaultCms: SiteCms = {
  contact: { ...storeContact, description: "برای تماس تلفنی یا مسیریابی تا فروشگاه از راه‌های زیر استفاده کنید." },
  about: { heading: "دربارهٔ میس دود", paragraphs: ["میس دود فروشگاه دخانیات، لوازم جانبی و محصولات تزئینی است. در صفحهٔ هر کالا می‌توانید تصویر، قیمت و مشخصات آن را کنار هم ببینید و مدل‌های مرتبط را بررسی کنید.","برای پیدا کردن یک مدل از دسته‌بندی‌های فروشگاه شروع کنید. اگر سؤالی دارید از بخش تماس با ما پیام بگذارید."] },
  guide: { intro: "پاسخ کوتاه به سؤال‌های رایج درباره ثبت، ارسال و پیگیری سفارش.", questions: [
    {question:"چطور سفارش ثبت کنم؟",answer:"کالا را به سبد خرید اضافه کنید و مشخصات گیرنده را وارد کنید. برای ثبت نهایی باید وارد حساب شوید."},
    {question:"هزینه ارسال چگونه محاسبه می‌شود؟",answer:"تعرفه مقصد در سبد خرید و پیش از ثبت سفارش نمایش داده می‌شود."},
    {question:"چگونه سفارش را پیگیری کنم؟",answer:"از صفحه پیگیری سفارش یا حساب کاربری استفاده کنید."},
    {question:"آیا پرداخت آنلاین فعال است؟",answer:"درگاه پرداخت آنلاین فعلاً فعال نیست؛ برای هماهنگی پرداخت با فروشگاه تماس بگیرید."},
  ] },
  banners: [1,2,3].map(n=>({src:`/images/hero/miss-dood-${n}.webp`,alt:`بنر ${n} میس دود`,href:"/shop",active:true})),
  catalog: {categories: categories.map(([slug,label])=>({slug,label,brands: ((categoryBrands as Record<string, readonly (readonly [string,string])[]>)[slug]??[]).map(([bs,bl])=>({slug:bs,label:bl}))}))},
};
export type CmsKey = keyof SiteCms;
export const cmsKeys: CmsKey[] = ["contact","about","guide","banners","catalog"];
export async function getCms():Promise<SiteCms> {
  try {
    const result = await db().query<{key:string;value:unknown}>("SELECT key,value FROM site_settings WHERE key = ANY($1::text[])",[cmsKeys]);
    const data:SiteCms={...defaultCms};
    for(const row of result.rows) if(cmsKeys.includes(row.key as CmsKey)) (data as unknown as Record<string,unknown>)[row.key]=row.value;
    return data;
  } catch (error) {
    // Prior to migration, keep public pages alive and use defaults.
    if ((error as {code?:string}).code==="42P01") return defaultCms;
    throw error;
  }
}
