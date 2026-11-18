import { MapPin, Phone, Navigation } from "lucide-react";
import { dialLink, storeContact } from "@/data/storeContact";

function mapLinks(address: string) {
  const query = encodeURIComponent(address);
  return [
    { name: "Google Maps", href: `https://www.google.com/maps/search/?api=1&query=${query}`, icon: "G", tone: "bg-[#f5f5f5] text-[#4285f4]" },
    { name: "بلد", href: `https://balad.ir/search/${query}`, icon: "ب", tone: "bg-[#e7f5ed] text-[#16834a]" },
    { name: "نشان", href: `https://neshan.org/maps/search/${query}`, icon: "ن", tone: "bg-[#e8f1ff] text-[#1768c5]" },
  ];
}

export default function ContactPage() {
  const phones = storeContact.phones.filter(Boolean);
  const maps = mapLinks(storeContact.address);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-9 sm:px-8 lg:py-14">
      <header className="space-y-3 text-center">
        <p className="text-xs font-bold tracking-[.25em] text-accent">MISS DOOD</p>
        <h1 className="text-3xl font-black sm:text-4xl">تماس با ما</h1>
        <p className="mx-auto max-w-xl text-sm leading-8 text-muted">برای تماس تلفنی یا مسیریابی تا فروشگاه، از راه‌های زیر استفاده کنید.</p>
        <div className="mx-auto h-px w-24 bg-gradient-to-r from-transparent via-accent to-transparent"/>
      </header>

      <section className="grid gap-5 md:grid-cols-2">
        <article className="rounded-3xl border border-line bg-gradient-to-br from-panel to-header p-6 shadow-[0_16px_45px_rgba(0,0,0,.2)] sm:p-8">
          <div className="mb-5 flex size-12 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-accent"><Phone size={23}/></div>
          <h2 className="mb-2 text-xl font-extrabold">ارتباط تلفنی</h2>
          <p className="mb-5 text-sm leading-7 text-muted">برای تماس، روی شماره موردنظر بزنید.</p>
          {phones.length ? (
            <div className="space-y-3">
              {phones.map((phone) => (
                <a key={phone} href={dialLink(phone)} className="group flex min-h-14 items-center justify-between rounded-2xl border border-line bg-page/70 px-4 transition hover:border-accent/70 hover:bg-accent/5" dir="ltr">
                  <span className="font-bold tracking-wide text-accent"><bdi>{phone}</bdi></span>
                  <span className="flex items-center gap-2 text-xs text-muted group-hover:text-content"><Phone size={15}/> تماس</span>
                </a>
              ))}
            </div>
          ) : <p className="rounded-xl border border-line bg-page/60 p-4 text-sm leading-7 text-muted">شماره تماس فروشگاه هنوز ثبت نشده است.</p>}
        </article>

        <article className="rounded-3xl border border-line bg-gradient-to-br from-panel to-header p-6 shadow-[0_16px_45px_rgba(0,0,0,.2)] sm:p-8">
          <div className="mb-5 flex size-12 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-accent"><MapPin size={23}/></div>
          <h2 className="mb-2 text-xl font-extrabold">آدرس فروشگاه</h2>
          <p className="mb-5 text-sm leading-8 text-muted">{storeContact.address}</p>
          <p className="mb-3 flex items-center gap-2 text-xs font-bold text-accent"><Navigation size={15}/> مسیریابی با برنامه دلخواه</p>
          <div className="grid grid-cols-3 gap-2">
            {maps.map((map) => (
              <a key={map.name} href={map.href} target="_blank" rel="noopener noreferrer"
                className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-page/70 px-2 py-3 transition hover:-translate-y-0.5 hover:border-accent/70 hover:bg-accent/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
                <span aria-hidden="true" className={`grid size-9 place-items-center rounded-xl text-lg font-black ${map.tone}`}>{map.icon}</span>
                <span className="text-xs font-bold text-content">{map.name}</span>
              </a>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
