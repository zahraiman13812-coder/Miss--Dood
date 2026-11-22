/** Public origin used for canonical URLs, XML sitemap and social previews. */
export const SITE_ORIGIN = "https://missdoodproject.vercel.app";
export const SITE_NAME = "MISS DOOD | میس دود";
export const DEFAULT_DESCRIPTION = "وب‌سایت رسمی میس دود؛ مشاهده اطلاعات و مشخصات محصولات، راهنمای خرید، پیگیری سفارش‌ها و راه‌های ارتباط با فروشگاه.";

/** Remove markup/control whitespace from CMS product copy for safe, readable SERP snippets. */
export function seoDescription(value: string | null | undefined, fallback = DEFAULT_DESCRIPTION): string {
  const text = (value ?? "").replace(/<[^>]*>/g, " ").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  return text.length > 158 ? `${text.slice(0, 155).trimEnd()}…` : text;
}

export function absoluteSiteUrl(path: string): string {
  return new URL(path, SITE_ORIGIN).toString();
}
