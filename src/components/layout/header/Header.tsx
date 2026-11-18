"use client";
import { useCart } from "@/features/cart/useCart";
import { useSignedInEmail } from "@/features/auth/emailAuth";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Grid2X2, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { categories, categoryBrands, pages } from "@/data/navigation";

const action = "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md hover:bg-panel hover:text-accent";
function CategoryLinks({ close }: { close: () => void }) {
  return <div className="grid max-h-[min(70vh,34rem)] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
    {categories.map(([slug, label]) => {
      const brands = categoryBrands[slug as keyof typeof categoryBrands];
      return <section key={slug} className="min-w-0 rounded-xl border border-line/70 p-2">
        <Link href={`/shop?category=${slug}`} onClick={close} className="block rounded-lg px-3 py-2 font-bold text-content hover:bg-header hover:text-accent">{label}</Link>
        {brands?.length ? <details className="group px-2">
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between rounded-lg px-2 text-sm text-muted hover:bg-header hover:text-accent [&::-webkit-details-marker]:hidden">
            <span>برندها و زیر‌دسته‌ها</span><ChevronDown size={15} className="transition-transform group-open:rotate-180" />
          </summary>
          <div className="grid grid-cols-2 gap-1 pb-2 pt-1">
            {brands.map(([brandSlug, brandLabel]) => <Link key={brandSlug} href={`/shop?category=${slug}&brand=${brandSlug}`} onClick={close}
              className="rounded-lg px-2 py-2 text-sm text-muted hover:bg-header hover:text-accent">{brandLabel}</Link>)}
          </div>
        </details> : null}
      </section>;
    })}
  </div>;
}
function SearchForm({ focus = false, close }: { focus?: boolean; close?: () => void }) {
  return <form action="/shop" role="search" onSubmit={close} className="flex items-center gap-2 rounded-md border border-line bg-header p-2">
    <input name="q" type="search" required autoFocus={focus} aria-label="جست‌وجوی کالا" placeholder="جست‌وجوی کالا…" className="min-w-0 flex-1 px-2 py-2 placeholder:text-muted" />
    <button aria-label="اجرای جست‌وجو" className={action}><Search size={18}/></button></form>;
}
export default function Header() {
  const signedIn = useSignedInEmail();
  const accountLabel = signedIn ? "حساب کاربری" : "ورود کاربر";
  const count = Object.values(useCart()).reduce((sum, qty) => sum + qty, 0).toLocaleString("fa-IR");
  const path = usePathname();
  const [open, setOpen] = useState<"categories" | "search" | null>(null);
  const header = useRef<HTMLElement>(null);
  const drawer = useRef<HTMLDialogElement>(null);
  const categoryButton = useRef<HTMLButtonElement>(null);
  const searchButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const outside = (e: PointerEvent) => { if (!header.current?.contains(e.target as Node)) setOpen(null); };
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape" && open) {
      (open === "search" ? searchButton : categoryButton).current?.focus(); setOpen(null);
    }};
    const breakpoint = matchMedia("(min-width: 64rem)");
    const reset = () => { drawer.current?.close(); setOpen(null); };
    breakpoint.addEventListener("change",reset);
    document.addEventListener("pointerdown",outside); document.addEventListener("keydown",escape);
    return () => { breakpoint.removeEventListener("change",reset); document.removeEventListener("pointerdown",outside); document.removeEventListener("keydown",escape); };
  }, [open]);
  const close = () => { setOpen(null); drawer.current?.close(); };
  const navLinks = [...pages, ["/orders", "پیگیری سفارش"]].map(([href,label]) => <Link key={href} href={href} onClick={close} aria-current={path===href ? "page" : undefined}
    className="py-3 hover:text-accent aria-[current=page]:text-accent aria-[current=page]:underline underline-offset-8">{label}</Link>);
  return <header ref={header} className="sticky top-0 z-50 shrink-0 border-b border-line bg-header text-sm">
    <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 sm:px-8 lg:flex lg:justify-between lg:gap-4">
      <button className={action+" justify-self-start lg:hidden"} aria-label="باز کردن منو" onClick={()=>{if(!drawer.current?.open)drawer.current?.showModal();}}><Menu/></button>
      <Link href="/" onClick={close} aria-label="میس دود، صفحه اصلی"><Image src="/brand/miss-dood-logo.jpg" alt="MISS DOOD" width={112} height={112} priority className="size-16 object-contain sm:size-20 lg:size-28"/></Link>
      <nav aria-label="منوی اصلی" className="hidden items-center gap-4 lg:flex xl:gap-7">
        <div className="relative"><button ref={categoryButton} aria-expanded={open==="categories"} onClick={()=>setOpen(open==="categories"?null:"categories")} className={action+" px-3 text-accent"}><Grid2X2 size={17}/>دسته‌بندی کالا<ChevronDown size={15}/></button>
        {open==="categories" && <div className="absolute right-0 top-full mt-2 w-[min(46rem,90vw)] rounded-2xl border border-line bg-panel p-3 shadow-xl"><CategoryLinks close={close}/></div>}</div>{navLinks}</nav>
      <div className="flex items-center justify-self-end gap-2 lg:ms-auto">
        <div className="relative hidden lg:block"><button ref={searchButton} aria-label="جست‌وجو" aria-expanded={open==="search"} className={action} onClick={()=>setOpen(open==="search"?null:"search")}><Search size={21}/></button>
        {open==="search" && <div className="absolute left-0 top-full mt-2 w-80 rounded-md border border-line bg-panel p-2"><SearchForm focus close={close}/></div>}</div>
        <Link href={signedIn ? "/account" : "/login"} onClick={close} className={action+" hidden px-3 lg:inline-flex"}><UserRound size={19}/>{accountLabel}</Link>
        <Link href="/cart" onClick={close} aria-label={`سبد خرید، ${count} کالا`} className={action+" border border-line px-2 text-accent"}><ShoppingBag size={19}/><span>{count}</span></Link>
      </div>
    </div>
    <dialog ref={drawer} aria-labelledby="menu-title" className="fixed inset-y-0 start-0 m-0 h-dvh max-h-dvh w-[min(24rem,88vw)] max-w-none overflow-y-auto border-e border-line bg-panel p-5 text-content shadow-2xl backdrop:bg-black/40" onClick={e=>{if(e.target===drawer.current && e.clientX < e.currentTarget.getBoundingClientRect().left) close();}}>
      <div className="mb-5 flex items-center justify-between"><strong id="menu-title" className="text-accent">منوی فروشگاه</strong><button className={action} onClick={close} aria-label="بستن منو"><X/></button></div>
      <SearchForm close={close}/><nav aria-label="منوی موبایل" className="mt-5 flex flex-col gap-2">
        <details className="border-b border-line pb-3"><summary className="cursor-pointer py-3 font-bold text-accent">دسته‌بندی کالا و برندها</summary><div className="pt-3"><CategoryLinks close={close}/></div></details>
        {navLinks}<Link href={signedIn ? "/account" : "/login"} onClick={close} className="flex items-center gap-2 py-3"><UserRound size={18}/>{accountLabel}</Link>
      </nav>
    </dialog>
  </header>;
}
