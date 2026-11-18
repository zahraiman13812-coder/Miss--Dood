import { MapPin, Phone } from "lucide-react";
import { dialLink, storeContact } from "@/data/storeContact";

export default function ContactPage() {
  const phones = storeContact.phones.filter(Boolean);
  return <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-8 lg:py-12">
    <header className="space-y-2 text-center">
      <p className="text-sm font-semibold text-accent">MISS DOOD</p>
      <h1 className="text-3xl font-bold">تماس با ما</h1>
      <p className="text-sm text-muted">برای مراجعه حضوری یا تماس تلفنی از اطلاعات زیر استفاده کنید.</p>
    </header>
    <section className="grid gap-4 sm:grid-cols-2">
      <article className="rounded-2xl border border-line bg-panel p-6">
        <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-header text-accent"><Phone size={22}/></div>
        <h2 className="mb-3 font-bold">شماره تماس</h2>
        {phones.length ? phones.map(phone => <a key={phone} href={dialLink(phone)} className="mb-2 block text-lg font-semibold text-accent" dir="ltr"><bdi>{phone}</bdi></a>) : <p className="text-sm leading-7 text-muted">شماره تماس فروشگاه هنوز ثبت نشده است.</p>}
      </article>
      <article className="rounded-2xl border border-line bg-panel p-6">
        <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-header text-accent"><MapPin size={22}/></div>
        <h2 className="mb-3 font-bold">آدرس فروشگاه</h2>
        <address className="not-italic leading-8">{storeContact.address}</address>
      </article>
    </section>
  </main>;
}
