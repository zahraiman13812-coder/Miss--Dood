"use client";
import { useEffect,useState } from "react";
import Link from "next/link";
import { Save,Plus,Trash2,ArrowRight,Image as ImageIcon } from "lucide-react";

type Banner={src:string;alt:string;href:string;active:boolean};
type Category={slug:string;label:string;brands:{slug:string;label:string}[]};
type Cms={contact:{address:string;phones:string[];description:string};about:{heading:string;paragraphs:string[]};guide:{intro:string;questions:{question:string;answer:string}[]};banners:Banner[];catalog:{categories:Category[]}};
type Key=keyof Cms;
const tabs:{key:Key;label:string}[]=[{key:"contact",label:"تماس با ما"},{key:"about",label:"درباره ما"},{key:"guide",label:"راهنمای خرید"},{key:"banners",label:"بنرهای اصلی"},{key:"catalog",label:"دسته‌بندی و برندها"}];
const input="min-h-11 w-full rounded-xl border border-[#765b36] bg-[#0e0a09] p-3 text-[#f5e3c3] outline-none focus:border-[#e8c27a]";
const btn="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#8c633c] bg-[#2a1716] px-4 text-sm font-bold text-[#f5ce90] hover:bg-[#54232b]";
const emptyBanner=():Banner=>({src:"/images/hero/miss-dood-1.webp",alt:"بنر جدید",href:"/shop",active:true});
const emptyCat=():Category=>({slug:"",label:"",brands:[]});
export default function ContentAdmin(){
 const [data,setData]=useState<Cms|null>(null);const [active,setActive]=useState<Key>("contact");
 const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
 useEffect(()=>{fetch("/api/admin/content",{cache:"no-store"}).then(async r=>{if(!r.ok)throw Error("دسترسی به اطلاعات ممکن نیست");return r.json()}).then(setData).catch(e=>setMessage(e.message));},[]);
 function update<K extends Key>(key:K,value:Cms[K]){setData(prev=>prev?{...prev,[key]:value}:prev)}
 async function save(){if(!data)return;setBusy(true);setMessage("");try{const r=await fetch("/api/admin/content",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:active,value:data[active]})});const v=await r.json();if(!r.ok)throw Error(v.error??"خطای ذخیره");setMessage("تغییرات ذخیره شدند. صفحات عمومی پس از بارگذاری مجدد به‌روزرسانی می‌شوند.");}catch(e){setMessage(e instanceof Error?e.message:"خطا")}finally{setBusy(false)}}
 const changeBanner=(i:number,patch:Partial<Banner>)=>{if(!data)return;update("banners",data.banners.map((v,j)=>i===j?{...v,...patch}:v))};
 const changeCat=(i:number,patch:Partial<Category>)=>{if(!data)return;update("catalog",{categories:data.catalog.categories.map((v,j)=>i===j?{...v,...patch}:v)})};
 return <main dir="rtl" className="mx-auto w-full max-w-7xl px-4 py-10 text-[#f5e4c6] sm:px-8">
 <Link href="/admin" className="mb-5 inline-flex items-center gap-2 text-sm text-[#e4bd79]"><ArrowRight size={16}/> بازگشت به داشبورد</Link>
 <div className="mb-7"><h1 className="text-3xl font-black">مدیریت محتوای سایت</h1><p className="mt-2 text-sm text-[#bda88a]">ویرایش اطلاعات و محتوای عمومی بدون تغییر کد یا انتشار مجدد</p></div>
 <div className="mb-6 flex flex-wrap gap-2">{tabs.map(t=><button key={t.key} onClick={()=>{setActive(t.key);setMessage("")}} className={`${btn} ${active===t.key?"border-[#e5be75] bg-[#623139]":""}`}>{t.label}</button>)}<Link href="/admin/team" className={btn}>مدیریت مدیران</Link></div>
 {!data?<p className="rounded-2xl border border-[#684932] p-8">در حال دریافت اطلاعات... {message}</p>:
 <section className="space-y-5 rounded-[24px] border border-[#795934] bg-[#15100d] p-5 sm:p-8">
 {active==="contact"&&<>
 <label className="block space-y-2">نشانی فروشگاه<textarea className={input} rows={3} value={data.contact.address} onChange={e=>update("contact",{...data.contact,address:e.target.value})}/></label>
 <label className="block space-y-2">شماره‌های تماس (هر شماره در یک خط)<textarea className={input} rows={3} value={data.contact.phones.join("\n")} onChange={e=>update("contact",{...data.contact,phones:e.target.value.split("\n").map(x=>x.trim()).filter(Boolean)})}/></label>
 <label className="block space-y-2">متن توضیح تماس<textarea className={input} rows={3} value={data.contact.description} onChange={e=>update("contact",{...data.contact,description:e.target.value})}/></label>
 </>}
 {active==="about"&&<><label className="block space-y-2">عنوان صفحه<input className={input} value={data.about.heading} onChange={e=>update("about",{...data.about,heading:e.target.value})}/></label>
 {data.about.paragraphs.map((s,i)=><div key={i} className="flex items-start gap-2"><textarea rows={4} className={input} aria-label={`پاراگراف ${i+1}`} value={s} onChange={e=>update("about",{...data.about,paragraphs:data.about.paragraphs.map((x,j)=>i===j?e.target.value:x)})}/><button aria-label="حذف پاراگراف" className={btn} onClick={()=>update("about",{...data.about,paragraphs:data.about.paragraphs.filter((_,j)=>j!==i)})}><Trash2/></button></div>)}
 <button className={btn} onClick={()=>update("about",{...data.about,paragraphs:[...data.about.paragraphs,""]})}><Plus/> افزودن پاراگراف</button></>}
 {active==="guide"&&<><label className="block space-y-2">متن معرفی<textarea className={input} value={data.guide.intro} onChange={e=>update("guide",{...data.guide,intro:e.target.value})}/></label>
 {data.guide.questions.map((q,i)=><div key={i} className="space-y-2 rounded-xl border border-[#523a29] p-4"><div className="flex gap-2"><input className={input} placeholder="سؤال" value={q.question} onChange={e=>update("guide",{...data.guide,questions:data.guide.questions.map((v,j)=>i===j?{...v,question:e.target.value}:v)})}/><button className={btn} aria-label="حذف سؤال" onClick={()=>update("guide",{...data.guide,questions:data.guide.questions.filter((_,j)=>j!==i)})}><Trash2/></button></div><textarea rows={3} className={input} placeholder="پاسخ" value={q.answer} onChange={e=>update("guide",{...data.guide,questions:data.guide.questions.map((v,j)=>i===j?{...v,answer:e.target.value}:v)})}/></div>)}
 <button className={btn} onClick={()=>update("guide",{...data.guide,questions:[...data.guide.questions,{question:"",answer:""}]})}><Plus/> سؤال جدید</button></>}
 {active==="banners"&&<><p className="text-sm text-[#bba386]">آدرس فایل موجود در public (مانند /images/hero/banner.webp) یا آدرس HTTPS تصویر. بارگذاری مستقیم عکس در این نسخه وجود ندارد.</p>
 {data.banners.map((b,i)=><div key={i} className="grid gap-3 rounded-xl border border-[#60462f] p-4 sm:grid-cols-[1fr_1fr]"><input className={input} value={b.src} onChange={e=>changeBanner(i,{src:e.target.value})} aria-label="آدرس تصویر" placeholder="آدرس تصویر"/><input className={input} value={b.alt} onChange={e=>changeBanner(i,{alt:e.target.value})} placeholder="توضیح بنر" aria-label="توضیح بنر"/><input className={input} value={b.href} onChange={e=>changeBanner(i,{href:e.target.value})} placeholder="لینک داخلی" aria-label="لینک داخلی"/><div className="flex items-center gap-3"><label><input type="checkbox" checked={b.active} onChange={e=>changeBanner(i,{active:e.target.checked})}/> فعال</label><button className={btn} onClick={()=>update("banners",data.banners.filter((_,j)=>j!==i))}><Trash2 size={17}/> حذف</button></div></div>)}
 <button className={btn} onClick={()=>update("banners",[...data.banners,emptyBanner()])}><ImageIcon size={18}/> افزودن بنر</button></>}
 {active==="catalog"&&<><p className="text-sm text-[#bba386]">شناسه دسته و برند باید انگلیسی و بدون فاصله باشد. تغییر شناسه دسته‌های موجود ممکن است فیلتر محصولات قبلی را ناسازگار کند؛ ترجیحاً نام نمایشی را تغییر دهید.</p>
 {data.catalog.categories.map((cat,i)=><div key={i} className="space-y-3 rounded-xl border border-[#674b30] p-4"><div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input className={input} aria-label="شناسه دسته" placeholder="شناسه دسته" value={cat.slug} onChange={e=>changeCat(i,{slug:e.target.value})}/><input className={input} aria-label="نام دسته" placeholder="نام دسته" value={cat.label} onChange={e=>changeCat(i,{label:e.target.value})}/><button className={btn} onClick={()=>update("catalog",{categories:data.catalog.categories.filter((_,j)=>j!==i)})}><Trash2 size={17}/></button></div>
 {cat.brands.map((brand,j)=><div className="grid gap-2 ps-2 sm:grid-cols-[1fr_1fr_auto]" key={j}><input className={input} aria-label="شناسه برند" placeholder="شناسه برند" value={brand.slug} onChange={e=>changeCat(i,{brands:cat.brands.map((v,k)=>k===j?{...v,slug:e.target.value}:v)})}/><input className={input} aria-label="نام برند" placeholder="نام برند" value={brand.label} onChange={e=>changeCat(i,{brands:cat.brands.map((v,k)=>k===j?{...v,label:e.target.value}:v)})}/><button className={btn} onClick={()=>changeCat(i,{brands:cat.brands.filter((_,k)=>k!==j)})}><Trash2 size={17}/></button></div>)}
 <button className={btn} onClick={()=>changeCat(i,{brands:[...cat.brands,{slug:"",label:""}]})}><Plus size={17}/> افزودن برند</button></div>)}
 <button className={btn} onClick={()=>update("catalog",{categories:[...data.catalog.categories,emptyCat()]})}><Plus/> دسته جدید</button></>}
 <div className="flex flex-wrap items-center gap-4 border-t border-[#60452c] pt-5"><button disabled={busy} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#e4bf76] px-6 font-extrabold text-[#21150e] disabled:opacity-50" onClick={save}><Save size={18}/>{busy?"در حال ذخیره...":"ذخیره تغییرات این بخش"}</button><p role="status" className="text-sm text-[#e7bd92]">{message}</p></div>
 </section>}
 </main>;
}
