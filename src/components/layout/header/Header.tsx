"use client";
import { useCart } from "@/features/cart/useCart";
import { useSignedInEmail } from "@/features/auth/emailAuth";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronDown, Grid2X2, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { pages } from "@/data/navigation";
import { CategoryMegaMenu, MobileCategoryMenu } from "./CategoryMegaMenu";

const action = "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl transition hover:bg-panel hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent";
function SearchForm({ focus = false, close }: { focus?: boolean; close?: () => void }) {
  return <form action="/shop" role="search" onSubmit={close}
    className="group flex min-h-14 items-center gap-2 rounded-2xl border border-line bg-page p-1.5 shadow-inner transition focus-within:border-accent/80 focus-within:ring-2 focus-within:ring-accent/15">
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent"><Search size={19}/></span>
    <input name="q" type="search" required autoFocus={focus} aria-label="جست‌وجوی کالا"
      placeholder="نام کالا، دسته‌بندی یا برند را جست‌وجو کنید…"
      className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-content outline-none placeholder:text-muted"/>
    <button aria-label="اجرای جست‌وجو" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-accent px-3 text-sm font-extrabold text-on-accent transition hover:brightness-110">
      <span className="hidden sm:inline">جست‌وجو</span><ArrowLeft size={17}/>
    </button>
  </form>;
}
export default function Header() {
  const signedIn = useSignedInEmail();
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
    const breakpoint = matchMedia("(min-width: 80rem)");
    const reset = () => { drawer.current?.close(); setOpen(null); };
    breakpoint.addEventListener("change", reset);
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape);
    return () => { breakpoint.removeEventListener("change", reset); document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  const close = () => { setOpen(null); drawer.current?.close(); };
  const navLinks = [...pages, ["/orders", "پیگیری سفارش"]].map(([href, label]) => <Link key={href} href={href} onClick={close} aria-current={path === href ? "page" : undefined}
    className="py-3 transition hover:text-accent aria-[current=page]:text-accent aria-[current=page]:underline underline-offset-8">{label}</Link>);
  return <header ref={header} className="sticky top-0 z-50 shrink-0 border-b border-line bg-header/95 text-sm backdrop-blur-xl shadow-[0_1px_0_rgba(139,45,56,.65)]">
    <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 sm:px-8 xl:flex xl:justify-between xl:gap-4">
      <button className={action + " justify-self-start xl:hidden"} aria-label="باز کردن منو" onClick={() => { if (!drawer.current?.open) drawer.current?.showModal(); }}><Menu/></button>
      <Link href="/" onClick={close} aria-label="میس دود، صفحه اصلی"><Image src="/brand/miss-dood-logo.png" alt="MISS DOOD" width={112} height={112} priority className="size-16 object-contain sm:size-20 xl:size-28"/></Link>
      <nav aria-label="منوی اصلی" className="hidden items-center gap-4 xl:flex xl:gap-7">
        <div className="relative">
          <button ref={categoryButton} aria-expanded={open === "categories"} onClick={() => setOpen(open === "categories" ? null : "categories")} className={action + " px-3 text-accent"}><Grid2X2 size={17}/>دسته‌بندی کالا<ChevronDown size={15}/></button>
          {open === "categories" && <div className="absolute right-0 top-full mt-3 rounded-[26px] shadow-[0_24px_70px_rgba(0,0,0,.55)]"><CategoryMegaMenu close={close}/></div>}
        </div>
        {navLinks}
      </nav>
      <div className="flex items-center justify-self-end gap-2 xl:ms-auto">
        <div className="relative hidden xl:block">
          <button ref={searchButton} aria-label="جست‌وجو" aria-expanded={open === "search"} className={action} onClick={() => setOpen(open === "search" ? null : "search")}><Search size={21}/></button>
          {open === "search" && <div className="absolute left-0 top-full mt-3 w-[min(27rem,90vw)] rounded-2xl border border-line bg-[#11100d] p-3 shadow-2xl"><SearchForm focus close={close}/></div>}
        </div>
        <Link href={signedIn ? "/account" : "/login"} onClick={close} aria-label={signedIn ? "حساب کاربری" : "ورود یا ثبت‌نام"} title={signedIn ? "حساب کاربری" : "ورود یا ثبت‌نام"} className={action + " border border-line px-2 text-accent"}><UserRound size={21}/></Link>
        <Link href="/cart" onClick={close} aria-label={`سبد خرید، ${count} کالا`} className={action + " border border-line px-2 text-accent"}><ShoppingBag size={19}/><span>{count}</span></Link>
      </div>
    </div>
    <dialog ref={drawer} aria-labelledby="menu-title" className="fixed inset-y-0 start-0 m-0 h-dvh max-h-dvh w-[min(25rem,90vw)] max-w-none overflow-y-auto border-e border-line bg-panel p-5 text-content shadow-2xl backdrop:bg-black/60" onClick={e => { if (e.target === drawer.current && e.clientX < e.currentTarget.getBoundingClientRect().left) close(); }}>
      <div className="mb-5 flex items-center justify-between"><strong id="menu-title" className="text-accent">منوی فروشگاه</strong><button className={action} onClick={close} aria-label="بستن منو"><X/></button></div>
      <SearchForm close={close}/>
      <nav aria-label="منوی موبایل" className="mt-5 flex flex-col gap-2">
        <details className="border-b border-line pb-3"><summary className="cursor-pointer py-3 font-bold text-accent">دسته‌بندی کالاها</summary><div className="pt-3"><MobileCategoryMenu close={close}/></div></details>
        {navLinks}
        <Link href={signedIn ? "/account" : "/login"} onClick={close} aria-label={signedIn ? "حساب کاربری" : "ورود یا ثبت‌نام"} className="flex size-12 items-center justify-center rounded-xl border border-line text-accent"><UserRound size={21}/></Link>
      </nav>
    </dialog>
  </header>;
}
