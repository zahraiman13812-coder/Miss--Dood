import Link from "next/link";
import { ArrowLeft, Headphones, PackageSearch, Search, ShieldCheck, Truck } from "lucide-react";

export default function HomeIntro() {
  return <section className="mx-auto w-full max-w-7xl min-w-0 px-3 pb-9 sm:px-6 sm:pb-12 xl:px-8" aria-labelledby="welcome-title">
    <div className="relative overflow-hidden rounded-[26px] border border-[#735931] bg-[linear-gradient(120deg,#19130d_0%,#0c0b09_68%,#1d0e0e_100%)] p-5 sm:p-8 lg:p-10">
      <div aria-hidden="true" className="pointer-events-none absolute -left-12 -top-20 size-64 rounded-full bg-[#8f242c]/10 blur-3xl"/>
      <div className="relative grid items-center gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.8fr)] lg:gap-10">
        <div className="min-w-0">
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-extrabold tracking-[.2em] text-[#dfbc78]"><span className="size-2 rounded-full bg-[#9e3438]"/> MISS DOOD</p>
          <h1 id="welcome-title" className="max-w-2xl text-[clamp(1.5rem,3vw,2.55rem)] font-black leading-[1.6] text-[#f8eedb]">خوش آمدید به <span className="text-[#e4bf76]">میس دود</span></h1>
          <p className="mt-3 max-w-xl text-sm leading-8 text-[#c8bca7] sm:text-base">دسته‌بندی‌ها، اطلاعات محصولات و وضعیت سفارش‌های خود را در یک فضای ساده و منظم دنبال کنید.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/shop" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#d2a55e] px-5 font-extrabold text-[#211508] transition hover:bg-[#e9c181]">مشاهده فروشگاه <ArrowLeft size={18}/></Link>
            <Link href="/orders" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#8b673b] bg-black/15 px-5 font-bold text-[#ead5b2] transition hover:border-[#e4bf76]">پیگیری سفارش <Truck size={18}/></Link>
          </div>
        </div>
        <form action="/shop" role="search" className="min-w-0 rounded-[22px] border border-[#6e532e] bg-black/25 p-4 sm:p-6">
          <label htmlFor="home-search" className="mb-3 flex items-center gap-2 text-sm font-bold text-[#f1dfbc]"><PackageSearch size={18} className="text-[#e4bf76]"/> دنبال چه محصولی می‌گردید؟</label>
          <div className="flex min-w-0 items-center gap-2 rounded-xl border border-[#816238] bg-[#100e0a] p-1.5 transition focus-within:border-[#e4bf76] focus-within:ring-2 focus-within:ring-[#e4bf76]/20">
            <Search size={19} className="ms-2 shrink-0 text-[#e4bf76]"/>
            <input id="home-search" name="q" type="search" required placeholder="نام کالا یا برند..." className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-[#f6eedb] outline-none placeholder:text-[#aea089] sm:text-base" />
            <button type="submit" className="min-h-11 shrink-0 rounded-lg bg-[#d2a55e] px-3 text-xs font-black text-[#211508] transition hover:bg-[#e9c181] sm:px-5 sm:text-sm">جست‌وجو</button>
          </div>
          <p className="mt-3 text-xs leading-6 text-[#b9a98e]">جست‌وجو در نام، دسته‌بندی و توضیحات کالاهای ثبت‌شده</p>
        </form>
      </div>
    </div>
    <div className="mt-4 grid grid-cols-1 gap-3 min-[430px]:grid-cols-2 lg:grid-cols-3">
      {[
        {Icon:ShieldCheck,title:"اطلاعات شفاف",description:"مشخصات و موجودی قابل مشاهده"},
        {Icon:Truck,title:"وضعیت سفارش",description:"پیگیری مرحله‌های سفارش در پنل"},
        {Icon:Headphones,title:"ارتباط با فروشگاه",description:"دسترسی به صفحه تماس و پشتیبانی"},
      ].map(({Icon,title,description})=><div key={title} className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#5b482a] bg-[#15120e] p-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-[#9d3034]/45 bg-[#8c252e]/10 text-[#e7bf7b]"><Icon size={20}/></span>
        <span className="min-w-0"><strong className="block text-sm text-[#f2e5cb]">{title}</strong><span className="mt-1 block text-xs leading-6 text-[#b9ad97]">{description}</span></span>
      </div>)}
    </div>
  </section>;
}
