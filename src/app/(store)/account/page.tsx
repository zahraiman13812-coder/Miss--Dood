"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Download, Heart, Home, LogOut, MapPin, Package,
  Pencil, Plus, RefreshCw, Save, ShieldCheck, Sparkles, Trash2, UserRound, X } from "lucide-react";
import type { Product } from "@/data/mock/latestProducts";
import ProductCard from "@/features/catalog/ProductCard";

type Tab = "overview" | "addresses" | "orders" | "profile" | "recommended";
type Profile = { id: string; full_name: string; email: string; phone: string };
type Address = { id: string; title: string; recipient_name: string; phone: string; city: string; address: string; postal_code: string; is_default: boolean };
type Order = { id: string; status: string; date: string; subtotal: number; total: number; shipping?: {city?:string;fee?:number}; items: {name:string;quantity:number;amount:number}[] };
type AddressDraft = Omit<Address,"id">;
const emptyAddress: AddressDraft = {title:"خانه",recipient_name:"",phone:"",city:"",address:"",postal_code:"",is_default:false};
const money = (price: number) => `${price.toLocaleString("fa-IR")} تومان`;
const panel = "rounded-[26px] border border-[#705a31]/65 bg-[#14110d] p-5 shadow-[0_12px_40px_rgba(0,0,0,.25)] sm:p-7";
const field = "mt-2 min-h-12 w-full rounded-xl border border-[#786039] bg-[#090807] px-4 py-3 text-[#f7edda] outline-none placeholder:text-[#9d9077] focus:border-[#e0be7b] focus:ring-2 focus:ring-[#e0be7b]/20";
const goldButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#e3c47f] bg-gradient-to-b from-[#d4b06c] to-[#a27a3d] px-5 py-2 font-black text-[#171109] transition hover:brightness-110 disabled:opacity-50";
const outlineButton = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#786039] bg-[#211b12] px-4 py-2 text-sm font-bold text-[#e5c480] transition hover:border-[#d5b36e] disabled:opacity-50";
const tabs: {id:Tab;label:string;icon:typeof Home}[] = [
  {id:"overview",label:"پیشخوان",icon:Home}, {id:"orders",label:"سفارش‌ها و فاکتورها",icon:Package},
  {id:"addresses",label:"آدرس‌های من",icon:MapPin}, {id:"profile",label:"ویرایش پروفایل",icon:UserRound},
  {id:"recommended",label:"پیشنهادهای شما",icon:Heart},
];
const statuses: Record<string,string> = { received:"ثبت شده",processing:"در حال آماده‌سازی",shipped:"ارسال شده",delivered:"تحویل شده",cancelled:"لغو شده" };
async function jsonFetch<T>(url:string, init?:RequestInit):Promise<T> {
  const response = await fetch(url,{cache:"no-store",...init});
  const data = await response.json().catch(()=>({error:"NETWORK_ERROR"}));
  if(!response.ok) throw Error(data.error === "AUTH_REQUIRED" ? "ابتدا وارد حساب شوید." : data.error ?? "درخواست ناموفق بود.");
  return data as T;
}
export default function AccountPage() {
  const router = useRouter();
  const [tab,setTab] = useState<Tab>("overview");
  const [profile,setProfile] = useState<Profile|null>(null);
  const [formProfile,setFormProfile] = useState({fullName:"",phone:""});
  const [addresses,setAddresses] = useState<Address[]>([]);
  const [addressForm,setAddressForm] = useState<AddressDraft>(emptyAddress);
  const [editingId,setEditingId] = useState<string|null>(null);
  const [orderList,setOrderList] = useState<Order[]>([]);
  const [orderPage,setOrderPage] = useState(1);
  const [orderTotal,setOrderTotal] = useState(0);
  const [recommendations,setRecommendations] = useState<Product[]>([]);
  const [personalized,setPersonalized] = useState(false);
  const [favoritesCount,setFavoritesCount] = useState(0);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");

  const loadOrders = useCallback(async (page:number,append=false) => {
    const data=await jsonFetch<{orders:Order[];pagination:{total:number}}>(`/api/orders?page=${page}&pageSize=30`);
    setOrderList(previous=>append?[...previous,...data.orders]:data.orders);
    setOrderTotal(data.pagination.total);
    setOrderPage(page);
  },[]);
  const reload = useCallback(async () => {
    const auth=await jsonFetch<{user:Profile|null}>("/api/auth");
    if(!auth.user){router.replace("/login");return;}
    const [details,addressesData,ordersData,recoData,favoriteData] = await Promise.allSettled([
      jsonFetch<{profile:Profile}>("/api/account/profile"),
      jsonFetch<{addresses:Address[]}>("/api/account/addresses"),
      jsonFetch<{orders:Order[];pagination:{total:number}}>("/api/orders?page=1&pageSize=30"),
      jsonFetch<{recommendations:Product[];personalized:boolean}>("/api/account/recommendations"),
      jsonFetch<{favorites:string[]}>("/api/favorites")
    ]);
    if(details.status==="fulfilled"){
      setProfile(details.value.profile);
      setFormProfile({fullName:details.value.profile.full_name,phone:details.value.profile.phone||""});
    }else{
      setProfile(auth.user);
      setFormProfile({fullName:auth.user.full_name,phone:""});
    }
    if(addressesData.status==="fulfilled") setAddresses(addressesData.value.addresses);
    if(ordersData.status==="fulfilled") {
      setOrderList(ordersData.value.orders);setOrderTotal(ordersData.value.pagination.total);setOrderPage(1);
    }
    if(recoData.status==="fulfilled"){
      setRecommendations(recoData.value.recommendations);setPersonalized(recoData.value.personalized);
    }
    if(favoriteData.status==="fulfilled")setFavoritesCount(favoriteData.value.favorites.length);
    if([details,addressesData,ordersData,recoData].some(result=>result.status==="rejected"))
      setMessage("بخشی از اطلاعات بارگذاری نشد؛ مطمئن شوید Migration جدید را در pgAdmin اجرا کرده‌اید.");
  },[router]);
  useEffect(()=>{
    const requested = new URLSearchParams(window.location.search).get("tab");
    if(tabs.some(t=>t.id===requested)) setTab(requested as Tab);
    reload().catch(()=>setMessage("اتصال به سرور برقرار نشد؛ دوباره تلاش کنید.")).finally(()=>setLoading(false));
  },[reload]);

  const activeOrders = useMemo(()=>orderList.filter(o=>!["cancelled","delivered"].includes(o.status)).length,[orderList]);
  function goTab(next:Tab){setTab(next);setMessage("");router.replace(`/account?tab=${next}`,{scroll:false});}
  function editAddress(address?:Address){
    setEditingId(address?.id??null);
    setAddressForm(address?{title:address.title,recipient_name:address.recipient_name,phone:address.phone,city:address.city,address:address.address,postal_code:address.postal_code,is_default:address.is_default}:{...emptyAddress,recipient_name:profile?.full_name??"",phone:profile?.phone??""});
    document.getElementById("account-address-form")?.scrollIntoView({behavior:"smooth",block:"start"});
  }
  async function saveAddress(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage("");
    try{
      const method=editingId?"PATCH":"POST";
      await jsonFetch("/api/account/addresses",{method,headers:{"Content-Type":"application/json"},body:JSON.stringify({...addressForm,...(editingId?{id:editingId}:{})})});
      const data=await jsonFetch<{addresses:Address[]}>("/api/account/addresses");
      setAddresses(data.addresses);setEditingId(null);setAddressForm(emptyAddress);setMessage("آدرس با موفقیت ذخیره شد.");
    }catch(e){setMessage(e instanceof Error?e.message:"ذخیره آدرس ناموفق بود.");}
    finally{setBusy(false);}
  }
  async function removeAddress(id:string){
    if(!window.confirm("این آدرس حذف شود؟"))return;
    setBusy(true);setMessage("");
    try{
      await jsonFetch("/api/account/addresses",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
      setAddresses(list=>list.filter(a=>a.id!==id));
      const data=await jsonFetch<{addresses:Address[]}>("/api/account/addresses");
      setAddresses(data.addresses);setMessage("آدرس حذف شد.");
    }catch(e){setMessage(e instanceof Error?e.message:"حذف آدرس ناموفق بود.");}
    finally{setBusy(false);}
  }
  async function saveProfile(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage("");
    try{
      const data=await jsonFetch<{profile:Profile}>("/api/account/profile",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(formProfile)});
      setProfile(data.profile);setMessage("اطلاعات حساب به‌روزرسانی شد.");
    }catch(e){setMessage(e instanceof Error?e.message:"ثبت اطلاعات ناموفق بود.");}
    finally{setBusy(false);}
  }
  async function logout(){setBusy(true);try{await jsonFetch("/api/auth",{method:"DELETE"});router.replace("/login");router.refresh();}catch{setMessage("خروج ناموفق بود.");setBusy(false);}}

  if(loading)return <main className="mx-auto max-w-7xl px-4 py-12"><p role="status" className={panel}>در حال دریافت اطلاعات حساب…</p></main>;
  if(!profile)return <main className="mx-auto max-w-xl px-4 py-10"><div className={panel}><h1 className="text-2xl font-bold">حساب کاربری</h1><p className="my-5 text-[#dbc7a3]">{message||"ابتدا وارد حساب شوید."}</p><Link href="/login" className={goldButton}>ورود به حساب</Link></div></main>;

  return <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 text-[#f6eddc] sm:px-6 lg:px-8">
    <header className={`${panel} relative overflow-hidden`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(193,150,69,.22),transparent_48%)]" />
      <div className="relative flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-4"><span className="grid size-14 place-items-center rounded-2xl border border-[#b89652] bg-[#ae8748]/15 text-[#e6c47b]"><UserRound size={28}/></span>
          <div><p className="mb-1 text-xs font-bold tracking-[.25em] text-[#dabb76]">MISS DOOD CLUB</p><h1 className="text-2xl font-black sm:text-3xl">سلام، {profile.full_name||"دوست عزیز"}</h1><p className="mt-2 text-sm text-[#b8a98c]" dir="ltr">{profile.email}</p></div>
        </div><div className="flex flex-wrap gap-2"><button className={outlineButton} onClick={()=>{setMessage("");void reload().catch(()=>setMessage("به‌روزرسانی ناموفق بود."));}}><RefreshCw size={16}/> به‌روزرسانی</button><button className={outlineButton} disabled={busy} onClick={logout}><LogOut size={16}/> خروج امن</button></div>
      </div>
    </header>
    <div className="grid items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className={`${panel} lg:sticky lg:top-32`} aria-label="منوی حساب کاربری">
        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
          {tabs.map(({id,label,icon:Icon})=><button key={id} onClick={()=>goTab(id)} aria-current={tab===id?"page":undefined}
            className={`flex min-h-12 items-center gap-2 rounded-xl border px-3 text-right text-sm font-bold transition ${tab===id?"border-[#c5a15c] bg-[#4a381d] text-[#f8deaa]":"border-[#554528]/65 bg-[#0d0b09] text-[#c6b698] hover:border-[#a48950]"}`}>
            <Icon size={17}/>{label}
          </button>)}
        </nav>
        <div className="mt-5 border-t border-[#594629] pt-4"><Link href="/shop" className="inline-flex items-center gap-2 text-sm font-bold text-[#dabb76]"><ArrowLeft size={16}/> بازگشت به فروشگاه</Link></div>
      </aside>
      <div className="min-w-0 space-y-5">
        {message&&<p role="status" className="rounded-2xl border border-[#aa8545]/55 bg-[#3b2c16] px-5 py-4 text-sm leading-7 text-[#f0d6a2]">{message}</p>}

        {tab==="overview"&&<>
          <div className="grid gap-3 sm:grid-cols-3">
            {[{label:"کل سفارش‌ها",value:orderTotal,icon:Package},{label:"در جریان (بارگذاری‌شده)",value:activeOrders,icon:ClipboardList},{label:"علاقه‌مندی‌ها",value:favoritesCount,icon:Heart}].map(({label,value,icon:Icon})=><div key={label} className={`${panel} flex items-center justify-between`}><div><p className="text-xs text-[#c2ad84]">{label}</p><p className="mt-3 text-3xl font-black text-[#f6d48f]">{value.toLocaleString("fa-IR")}</p></div><Icon className="text-[#b58e4b]" size={26}/></div>)}
          </div>
          <section className={panel}><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black">آخرین سفارش‌های شما</h2><button onClick={()=>goTab("orders")} className="text-sm font-bold text-[#e6c47b]">مشاهده همه</button></div>
            {orderList.length?orderList.slice(0,3).map(o=><div key={o.id} className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#56462b] bg-[#0d0b09] p-4"><div><p className="font-bold">سفارش {o.id.slice(0,8)}</p><p className="mt-1 text-xs text-[#baa987]">{new Date(o.date).toLocaleDateString("fa-IR")} · {statuses[o.status]||o.status}</p></div><Link className={outlineButton} href={`/account/invoices/${o.id}`}>صورتحساب <Download size={15}/></Link></div>):<p className="text-sm text-[#baa987]">هنوز سفارشی ثبت نشده است.</p>}
          </section>
          <div className="grid gap-4 sm:grid-cols-2"><button onClick={()=>goTab("addresses")} className={`${panel} flex items-center justify-between text-right`}><span><strong>آدرس‌های ذخیره‌شده</strong><span className="mt-2 block text-sm text-[#b9a987]">{addresses.length.toLocaleString("fa-IR")} آدرس</span></span><MapPin className="text-[#e6c47b]"/></button><button onClick={()=>goTab("recommended")} className={`${panel} flex items-center justify-between text-right`}><span><strong>پیشنهاد مخصوص شما</strong><span className="mt-2 block text-sm text-[#b9a987]">بر اساس سابقه خرید و علاقه‌مندی</span></span><Sparkles className="text-[#e6c47b]"/></button></div>
        </>}

        {tab==="addresses"&&<>
          <section className={panel}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">دفترچه آدرس‌ها</h2><p className="mt-2 text-sm text-[#b9a987]">حداکثر ۲۰ آدرس؛ امکان ویرایش، حذف و انتخاب آدرس پیش‌فرض.</p></div><button onClick={()=>editAddress()} className={outlineButton}><Plus size={17}/> آدرس جدید</button></div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">{addresses.map(a=><article key={a.id} className="rounded-2xl border border-[#6d5630] bg-[#0b0a08] p-5"><div className="flex items-center justify-between gap-2"><h3 className="font-black text-[#e6c47b]">{a.title}</h3>{a.is_default&&<span className="rounded-full border border-[#a88b54] bg-[#44341b] px-3 py-1 text-xs">پیش‌فرض</span>}</div><p className="mt-3 text-sm leading-7">{a.recipient_name}، {a.phone}</p><p className="mt-2 text-sm leading-7 text-[#b9a987]">{a.city}، {a.address}</p>{a.postal_code&&<p className="mt-1 text-xs text-[#b9a987]">کد پستی: {a.postal_code}</p>}<div className="mt-4 flex gap-2"><button className={outlineButton} onClick={()=>editAddress(a)}><Pencil size={15}/> ویرایش</button><button className={outlineButton} disabled={busy} onClick={()=>void removeAddress(a.id)}><Trash2 size={15}/> حذف</button></div></article>)}
            {!addresses.length&&<p className="text-sm text-[#b9a987]">هنوز آدرسی ذخیره نکرده‌اید.</p>}</div>
          </section>
          <section id="account-address-form" className={panel}><div className="mb-5 flex justify-between gap-3"><h2 className="text-xl font-black">{editingId?"ویرایش آدرس":"افزودن آدرس جدید"}</h2>{editingId&&<button onClick={()=>editAddress()} className={outlineButton}><X size={15}/> لغو</button>}</div>
            <form onSubmit={saveAddress} className="grid gap-4 sm:grid-cols-2">
              {([{key:"title",label:"عنوان آدرس",placeholder:"خانه، محل کار"},{key:"recipient_name",label:"نام گیرنده",placeholder:"نام کامل"},{key:"phone",label:"شماره تماس",placeholder:"09..."},{key:"city",label:"شهر",placeholder:"نام شهر"},{key:"postal_code",label:"کد پستی (اختیاری)",placeholder:"کد پستی"}] as const).map(item=><label key={item.key} className="text-sm font-bold">{item.label}<input required={item.key!=="postal_code"} value={addressForm[item.key]} onChange={e=>setAddressForm(v=>({...v,[item.key]:e.target.value}))} placeholder={item.placeholder} className={field} maxLength={item.key==="title"?80:item.key==="postal_code"?20:120} dir="auto"/></label>)}
              <label className="sm:col-span-2 text-sm font-bold">نشانی کامل<textarea required minLength={6} maxLength={1000} rows={3} value={addressForm.address} onChange={e=>setAddressForm(v=>({...v,address:e.target.value}))} className={field}/></label>
              <label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={addressForm.is_default} onChange={e=>setAddressForm(v=>({...v,is_default:e.target.checked}))}/> آدرس پیش‌فرض من</label>
              <div className="sm:text-left"><button disabled={busy} type="submit" className={goldButton}><Save size={16}/>{busy?"در حال ذخیره…":editingId?"ذخیره ویرایش":"ثبت آدرس"}</button></div>
            </form>
          </section>
        </>}

        {tab==="orders"&&<section className={panel}><div className="mb-5"><h2 className="text-xl font-black">تاریخچه سفارش‌ها و صورتحساب‌ها</h2><p className="mt-2 text-sm text-[#b9a987]">{orderTotal.toLocaleString("fa-IR")} سفارش ثبت شده؛ صورتحساب هر سفارش قابل چاپ یا ذخیره به PDF است.</p></div>
          {orderList.map(o=><article key={o.id} className="mb-4 rounded-2xl border border-[#66512d] bg-[#0b0a08] p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="break-all font-bold">شماره سفارش: <bdi dir="ltr">{o.id}</bdi></p><p className="mt-2 text-xs text-[#b9a987]">{new Date(o.date).toLocaleString("fa-IR")} · {statuses[o.status]||o.status}</p></div><Link href={`/account/invoices/${o.id}`} className={outlineButton}><Download size={16}/> مشاهده صورتحساب</Link></div>
            <ul className="mt-4 space-y-2 border-t border-[#55452a] pt-4 text-sm">{(o.items??[]).map((i,n)=><li key={n} className="flex justify-between gap-3"><span>{i.name} × {i.quantity.toLocaleString("fa-IR")}</span><span>{money(i.amount)}</span></li>)}</ul>
            <p className="mt-4 border-t border-[#55452a] pt-3 text-left font-black text-[#ebc87f]">{money(o.total)}</p>
          </article>)}
          {!orderList.length&&<p className="py-5 text-center text-sm text-[#b9a987]">تاکنون سفارشی ثبت نکرده‌اید.</p>}
          {orderList.length<orderTotal&&<button className={goldButton} disabled={busy} onClick={async()=>{setBusy(true);setMessage("");try{await loadOrders(orderPage+1,true);}catch(e){setMessage(e instanceof Error?e.message:"خطا در دریافت سفارش‌ها.");}finally{setBusy(false);}}}>نمایش سفارش‌های بیشتر <ArrowLeft size={17}/></button>}
        </section>}

        {tab==="profile"&&<section className={panel}><h2 className="text-xl font-black">ویرایش اطلاعات حساب</h2><p className="mt-2 text-sm leading-7 text-[#b9a987]">برای امنیت حساب، تغییر ایمیل ورود از این بخش فعال نیست.</p><form onSubmit={saveProfile} className="mt-6 max-w-xl space-y-5"><label className="block text-sm font-bold">نام و نام خانوادگی<input required minLength={2} maxLength={120} autoComplete="name" value={formProfile.fullName} onChange={e=>setFormProfile(v=>({...v,fullName:e.target.value}))} className={field}/></label>
          <label className="block text-sm font-bold">شماره تماس (اختیاری)<input type="tel" maxLength={25} value={formProfile.phone} onChange={e=>setFormProfile(v=>({...v,phone:e.target.value}))} className={field} dir="ltr"/></label>
          <label className="block text-sm font-bold">ایمیل ورود (فقط خواندنی)<input readOnly value={profile.email} className={`${field} opacity-70`} dir="ltr"/></label>
          <button disabled={busy} className={goldButton}><Save size={17}/> ذخیره تغییرات</button></form>
          <p className="mt-6 flex items-center gap-2 text-xs text-[#b9a987]"><ShieldCheck size={16}/> اطلاعات فقط در حساب شما ذخیره می‌شوند.</p>
        </section>}

        {tab==="recommended"&&<section className={panel}><div className="mb-6"><h2 className="flex items-center gap-2 text-xl font-black"><Sparkles className="text-[#e6c47b]"/> پیشنهادهای مخصوص شما</h2><p className="mt-2 text-sm leading-7 text-[#b9a987]">{personalized?"بر اساس دسته‌بندی کالاهای موردعلاقه و سفارش‌های قبلی شما":"چون هنوز سابقه کافی ندارید، محصولات موجود و تازه‌تر را نمایش می‌دهیم."}</p></div>
          {recommendations.length?<ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{recommendations.map(p=><li key={p.slug}><ProductCard product={p} saveable/></li>)}</ul>:<div className="rounded-xl border border-[#6e5630] p-6 text-center text-sm text-[#b9a987]">در حال حاضر کالای موجودی برای پیشنهاد نداریم.</div>}
        </section>}
      </div>
    </div>
  </main>;
}
