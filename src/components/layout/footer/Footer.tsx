"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Code2, ExternalLink, MapPin, Phone, Sparkles } from "lucide-react";
import { dialLink, storeContact as defaultContact } from "@/data/storeContact";

const linkStyle = "block w-fit py-2 text-sm text-muted hover:text-accent";

type PublicContact = { address: string; phones: string[] };
type PublicBranding = { logo: string };

export default function Footer() {
  const [storeContact, setStoreContact] = useState<PublicContact>(defaultContact);
  const [logo, setLogo] = useState("/brand/miss-dood-logo.png");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/site-content", { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then((data: {contact?: PublicContact; branding?: PublicBranding} | null) => {
        if (!data || controller.signal.aborted) return;
        if (data.contact && typeof data.contact.address === "string" &&
            Array.isArray(data.contact.phones) && data.contact.phones.every(p => typeof p === "string")) {
          setStoreContact(data.contact);
        }
        if (typeof data.branding?.logo === "string" && data.branding.logo) setLogo(data.branding.logo);
      })
      .catch(() => { /* Keep static public fallbacks when CMS is unavailable. */ });
    return () => controller.abort();
  }, []);
  return (
    <>
    <footer className="mt-auto border-t border-accent/45 bg-header text-content">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-6 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_1fr_1.5fr] lg:py-12">
        <Link href="/" aria-label="میس دود، صفحه اصلی" className="col-span-2 mx-auto w-fit self-start rounded-md lg:col-span-1 lg:mx-0">
          <Image src={logo} unoptimized width={136} height={136} alt="MISS DOOD" className="size-24 object-contain lg:size-32" />
        </Link>
        <nav aria-label="دسترسی سریع در فوتر">
          <h2 className="mb-2 font-bold text-accent">دسترسی سریع</h2>
          <Link href="/shop" className={linkStyle}>فروشگاه</Link>
          <Link href="/decor" className={linkStyle}>کاتالوگ تزئینی</Link>
          <Link href="/cart" className={linkStyle}>سبد خرید</Link>
          <Link href="/help" className={linkStyle}>راهنمای خرید و پرسش‌های متداول</Link>
        </nav>
        <div className="min-w-0">
          <h2 className="mb-2 font-bold text-accent">ارتباط با میس دود</h2>
          <Link href="/about" className={linkStyle}>دربارهٔ ما</Link>
          <Link href="/contact" className={linkStyle}>تماس با ما</Link>
          {(storeContact.phones.some(Boolean) || storeContact.address) && (
            <address className="mt-3 space-y-3 border-t border-line pt-3 text-sm not-italic text-muted">
              {storeContact.phones.filter(Boolean).map(phone => <a key={phone} href={dialLink(phone)} className="flex w-fit items-center gap-2 hover:text-accent">
                <Phone size={16} aria-hidden="true" className="shrink-0 text-accent" />
                <span dir="ltr">{phone}</span>
              </a>)}
              {storeContact.address && <p className="flex items-start gap-2 leading-7">
                <MapPin size={16} aria-hidden="true" className="mt-1 shrink-0 text-accent" />
                <span>{storeContact.address}</span>
              </p>}
            </address>
          )}
        </div>
      </div>
    </footer>
    <div className="relative overflow-hidden border-t border-[#b78b45]/30 bg-[#0c0b0a] px-4 py-5 text-[#d8c5a7] sm:px-8" dir="rtl">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(192,148,71,0.12),transparent_65%)]" />
      <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-center gap-2 text-center sm:flex-row sm:flex-wrap sm:gap-x-3">
        <span className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-[#bcae98] sm:text-sm">
          <Code2 aria-hidden="true" size={17} className="text-[#d9ac61]" />
          طراحی و توسعه با دقت و خلاقیت
          <Sparkles aria-hidden="true" size={15} className="text-[#d9ac61]" />
        </span>
        <span aria-hidden="true" className="hidden h-4 w-px bg-[#b78b45]/40 sm:block" />
        <a
          href="https://www.zahraimani.ir/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="وب‌سایت زهرا ایمانی، طراح و توسعه‌دهنده وب (باز شدن در پنجره جدید)"
          className="group inline-flex items-center gap-2 rounded-full border border-[#b78b45]/55 bg-[#2a2116]/60 px-4 py-2 text-sm font-bold text-[#f8d996] shadow-[0_0_20px_rgba(183,139,69,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#f5cb80] hover:bg-[#3a2b1a] hover:text-white hover:shadow-[0_0_24px_rgba(183,139,69,0.25)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f5cb80]"
        >
          <span>زهرا ایمانی</span>
          <span className="text-xs font-normal text-[#d8c5a7]">| برنامه‌نویس وب</span>
          <ExternalLink aria-hidden="true" size={15} className="transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>
    </div>
    </>
  );
}
