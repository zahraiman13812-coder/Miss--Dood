import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";

const vazirmatn = localFont({
  src: [
    { path: "../fonts/Vazirmatn-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/Vazirmatn-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/Vazirmatn-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../fonts/Vazirmatn-Bold.woff2", weight: "700", style: "normal" },
    { path: "../fonts/Vazirmatn-ExtraBold.woff2", weight: "800 900", style: "normal" },
  ],
  variable: "--font-vazirmatn",
  display: "swap",
  preload: true,
  fallback: ["Tahoma", "Arial", "sans-serif"],
});

const siteUrl = "https://missdoodproject.vercel.app";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "MISS DOOD | میس دود", template: "%s | MISS DOOD" },
  description: "وب‌سایت رسمی میس دود؛ مشاهده اطلاعات محصولات، پیگیری سفارش و پشتیبانی فروشگاه.",
  applicationName: "MISS DOOD",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "512x512" }, { url: "/favicon.ico", sizes: "any" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website", locale: "fa_IR", siteName: "MISS DOOD", url: siteUrl,
    title: "MISS DOOD | میس دود",
    description: "وب‌سایت رسمی میس دود",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "نشان طلایی MISS DOOD" }],
  },
  twitter: { card: "summary_large_image", images: ["/twitter-image.png"] },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${vazirmatn.variable} min-h-dvh bg-page text-content`}>
        {children}
      </body>
    </html>
  );
}
