import Image from "next/image";
import { MapPin, Phone, Navigation, ExternalLink } from "lucide-react";
import { dialLink } from "@/data/storeContact";
import { getCms } from "@/lib/site-cms";
export const dynamic="force-dynamic";
function mapLinks(address: string, custom?: {google:string;balad:string;neshan:string}) {
 const query=encodeURIComponent(address);
 return [
  {name:"Google Maps",href:custom?.google||`https://www.google.com/maps/search/?api=1&query=${query}`,logo:"/images/map-services/google-maps.png"},
  {name:"بلد",href:custom?.balad||`https://balad.ir/search/${query}`,logo:"/images/map-services/balad.png"},
  {name:"نشان",href:custom?.neshan||`https://neshan.org/maps/search/${query}`,logo:"/images/map-services/neshan.png"},
 ];
}
export default async function ContactPage() {
 const {contact}=await getCms();const maps=mapLinks(contact.address,contact.mapLinks);
 return <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-9 sm:px-8 lg:py-14">
 <header className="space-y-3 text-center"><p className="text-xs font-bold tracking-[.25em] text-accent">MISS DOOD</p><h1 className="text-3xl font-black sm:text-4xl">تماس با ما</h1><p className="mx-auto max-w-xl text-sm leading-8 text-muted">{contact.description}</p><div className="mx-auto h-px w-24 bg-gradient-to-r from-transparent via-accent to-transparent"/></header>
 <section className="grid gap-5 md:grid-cols-2"><article className="rounded-3xl border border-line bg-gradient-to-br from-panel to-header p-6 sm:p-8"><div className="mb-5 flex size-12 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-accent"><Phone/></div><h2 className="mb-2 text-xl font-extrabold">ارتباط تلفنی</h2><p className="mb-5 text-sm leading-7 text-muted">برای تماس روی شماره بزنید.</p>
 {contact.phones.length?contact.phones.map(phone=><a key={phone} href={dialLink(phone)} className="mb-3 flex min-h-14 items-center justify-between rounded-2xl border border-line bg-page/70 px-4 text-accent transition hover:border-accent/70" dir="ltr"><bdi>{phone}</bdi><Phone size={16}/></a>):<p>شماره تماس ثبت نشده است.</p>}</article>
 <article className="rounded-3xl border border-line bg-gradient-to-br from-panel to-header p-6 sm:p-8"><div className="mb-5 flex size-12 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-accent"><MapPin/></div><h2 className="mb-2 text-xl font-extrabold">آدرس فروشگاه</h2><p className="mb-5 whitespace-pre-line text-sm leading-8 text-muted">{contact.address}</p><p className="mb-3 flex items-center gap-2 text-xs font-bold text-accent"><Navigation size={16}/> مسیریابی</p><div className="grid grid-cols-3 gap-2">{maps.map(map=><a key={map.name} href={map.href} target="_blank" rel="noopener noreferrer" className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-page/70 p-2 hover:border-accent/70"><span className="grid size-12 place-items-center rounded-xl bg-white p-1"><Image src={map.logo} alt="" width={48} height={48} className="h-full w-full object-contain"/></span><span className="flex items-center gap-1 text-xs font-bold"><ExternalLink size={12}/>{map.name}</span></a>)}</div></article></section></main>;
}
