"use client";
import {useCallback,useEffect,useState,type FormEvent} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {ArrowRight,Plus,Trash2,ImagePlus,Save,ArrowUp,ArrowDown} from "lucide-react";

type ImageItem={src:string;alt:string};
type Product={slug:string;name:string;category:string;brand:string;description:string;priceToman:number|null;stock:number;active:boolean;images:ImageItem[];specs:[string,string][]};
const empty:Product={slug:"",name:"",category:"lighters",brand:"",description:"",priceToman:null,stock:0,active:true,images:[],specs:[]};
const control="md-control mt-2 w-full min-w-0";
const btn="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#987447] px-4 py-2 text-sm text-[#f2d398] disabled:opacity-40";
const panel="space-y-4 rounded-2xl border border-[#655034] bg-[#18120f] p-4 sm:p-6";
const getMessage=(code:string)=>({INVALID_PRODUCT:"یکی از اطلاعات محصول نامعتبر است؛ تصویر اصلی، نام، دسته و مشخصات را بررسی کنید.",ALREADY_EXISTS:"شناسه این محصول قبلاً ثبت شده است.",INVENTORY_PERMISSION_REQUIRED:"برای تغییر موجودی اجازه دسترسی انبار لازم است.",FORBIDDEN:"برای ویرایش محصول مجوز کافی ندارید.",NOT_FOUND:"محصول پیدا نشد."} as Record<string,string>)[code]??code;

export default function ProductEditor({mode,slug}:{mode:"create"|"edit";slug?:string}){
 const router=useRouter();
 const [value,setValue]=useState<Product>({...empty});
 const [deleting,setDeleting]=useState(false);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(mode==="edit"),[message,setMessage]=useState(""),[scope,setScope]=useState("loading");
 const [catalog,setCatalog]=useState<{slug:string;label:string;brands:{slug:string;label:string}[]}[]>([]);
 const load=useCallback(async()=>{
  if(mode!=="edit"||!slug)return;
  const response=await fetch(`/api/admin/product-editor?slug=${encodeURIComponent(slug)}`,{cache:"no-store"});
  const result=await response.json();if(!response.ok)throw Error(getMessage(result.error??"LOAD_FAILED"));
  setValue(result.product);
 },[mode,slug]);
 useEffect(()=>{
  if(mode==="edit")load().catch(e=>setMessage(e.message)).finally(()=>setLoading(false));
  void fetch("/api/admin/access",{cache:"no-store"}).then(r=>r.json()).then(j=>setScope(j.scope??"loading")).catch(()=>{});
  void fetch("/api/admin/content",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(j=>{if(j?.catalog?.categories)setCatalog(j.catalog.categories)}).catch(()=>{});
 },[load,mode]);
 const set=(patch:Partial<Product>)=>setValue(v=>({...v,...patch}));
 const hasStockPermission=["owner","manager","warehouse"].includes(scope);
 const setImage=(i:number,patch:Partial<ImageItem>)=>setValue(v=>({...v,images:v.images.map((x,j)=>i===j?{...x,...patch}:x)}));
 const moveImage=(i:number,by:number)=>setValue(v=>{const next=[...v.images],j=i+by;if(j<0||j>=next.length)return v;[next[i],next[j]]=[next[j],next[i]];return {...v,images:next}});
 async function upload(files:FileList|null){if(!files?.length)return;setBusy(true);setMessage("");try{
  const uploaded:ImageItem[]=[];
  if(value.images.length+files.length>12)throw Error("حداکثر ۱۲ عکس برای هر محصول مجاز است.");
  for(const file of Array.from(files)){
   const f=new FormData();f.append("file",file);
   const response=await fetch("/api/admin/media",{method:"POST",body:f});const result=await response.json();
   if(!response.ok)throw Error(getMessage(result.error??"خطا در آپلود عکس"));uploaded.push({src:result.url,alt:value.name});
  }
  setValue(v=>({...v,images:[...v.images,...uploaded]}));setMessage("عکس‌ها اضافه شدند؛ برای ثبت نهایی دکمه ذخیره محصول را بزنید.");
 }catch(e){setMessage(e instanceof Error?e.message:"خطا در آپلود")}finally{setBusy(false)}}
 async function save(event:FormEvent){event.preventDefault();setBusy(true);setMessage("");try{
  if(!value.images.length)throw Error("ابتدا حداقل یک عکس برای محصول اضافه کنید.");
  if(new Set(value.images.map(i=>i.src)).size!==value.images.length)throw Error("عکس تکراری در گالری وجود دارد.");
  if(value.specs.some(([a,b])=>!a.trim()||!b.trim()))throw Error("مشخصات فنی خالی را تکمیل یا حذف کنید.");
  const response=await fetch("/api/admin/product-editor",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode,product:value})});
  const result=await response.json();if(!response.ok)throw Error(getMessage(result.error??"ذخیره ناموفق بود"));
  setMessage("محصول، تصاویر و مشخصات فنی با موفقیت ذخیره شدند.");
  if(mode==="create")router.replace(`/admin/products/${value.slug}`);
 }catch(e){setMessage(e instanceof Error?e.message:"خطا در ذخیره")}finally{setBusy(false)}}
 async function deleteProduct(){
  if(mode!=="edit"||!slug||busy||deleting)return;
  if(!window.confirm(`آیا می‌خواهید «${value.name}» از فروشگاه حذف شود؟\nاین عملیات محصول را از فروشگاه و فهرست عادی مدیریت مخفی می‌کند؛ سوابق سفارش‌ها حفظ می‌شوند.`))return;
  const confirmation=window.prompt(`برای تأیید حذف، شناسه محصول را دقیقاً وارد کنید:\n${slug}`);
  if(confirmation!==slug){if(confirmation!==null)setMessage("شناسه واردشده صحیح نیست؛ محصول حذف نشد.");return;}
  setDeleting(true);setMessage("");
  try{
   const response=await fetch(`/api/admin/product-editor?slug=${encodeURIComponent(slug)}`,{method:"DELETE"});
   const result=await response.json().catch(()=>({error:"DELETE_FAILED"}));
   if(!response.ok)throw Error(getMessage(result.error??"حذف محصول ناموفق بود"));
   router.replace("/admin/products");router.refresh();
  }catch(e){setMessage(e instanceof Error?e.message:"خطا در حذف محصول");setDeleting(false)}
 }
 if(loading)return <main className="p-8">در حال بارگذاری محصول…</main>;
 return <main dir="rtl" className="mx-auto max-w-6xl space-y-6 px-3 py-6 sm:px-7 sm:py-9">
  <div className="flex flex-wrap items-start justify-between gap-3"><div><Link href="/admin/products" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#e5bd78]"><ArrowRight size={17}/> همه محصولات</Link><h1 className="mt-2 text-2xl font-black">{mode==="create"?"افزودن محصول جدید":`ویرایش محصول: ${value.name}`}</h1><p className="mt-2 text-sm text-[#bda88b]">اطلاعات، تصاویر و مشخصات فنی را در همین صفحه وارد کنید و یک‌جا ذخیره کنید.</p></div><div className="flex flex-wrap items-center gap-2"><Link href="/admin/products/new" className={btn}><Plus size={17}/>محصول جدید</Link>{mode==="edit"&&<button type="button" onClick={()=>void deleteProduct()} disabled={busy||deleting||loading} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#a9434a] bg-[#41181d] px-4 py-2 text-sm font-bold text-[#ffd1d1] transition hover:bg-[#63232b] disabled:opacity-40"><Trash2 size={17}/>{deleting?"در حال حذف…":"حذف محصول"}</button>}</div></div>
  <form onSubmit={e=>void save(e)} className="space-y-5">
   <section className={panel}><h2 className="text-lg font-bold text-[#efd09a]">۱. اطلاعات اصلی محصول</h2><div className="grid gap-4 sm:grid-cols-2">
    <label>شناسه یکتا (انگلیسی)<input className={control} required pattern="[a-z0-9][a-z0-9-]{0,119}" maxLength={120} disabled={mode==="edit"} value={value.slug} onChange={e=>set({slug:e.target.value.toLowerCase()})}/></label>
    <label>نام محصول<input className={control} required maxLength={200} value={value.name} onChange={e=>set({name:e.target.value})}/></label>
    <label>دسته‌بندی{catalog.length?<select className={control} value={value.category} onChange={e=>set({category:e.target.value,brand:""})}><option value={value.category}>{catalog.find(c=>c.slug===value.category)?.label??value.category}</option>{catalog.filter(c=>c.slug!==value.category).map(c=><option key={c.slug} value={c.slug}>{c.label}</option>)}</select>:<input className={control} required pattern="[a-z0-9][a-z0-9-]{0,79}" value={value.category} onChange={e=>set({category:e.target.value})}/>}</label>
    <label>برند {catalog.find(c=>c.slug===value.category)?.brands?.length?<select className={control} value={value.brand} onChange={e=>set({brand:e.target.value})}><option value="">بدون برند</option>{value.brand&&!catalog.find(c=>c.slug===value.category)?.brands?.some(b=>b.slug===value.brand)&&<option value={value.brand}>{value.brand}</option>}{catalog.find(c=>c.slug===value.category)?.brands?.map(b=><option value={b.slug} key={b.slug}>{b.label}</option>)}</select>:<input className={control} value={value.brand} pattern="[a-z0-9-]*" onChange={e=>set({brand:e.target.value})}/>}</label>
    <label>قیمت (تومان)<input className={control} type="number" min="0" step="1" value={value.priceToman??""} onChange={e=>set({priceToman:e.target.value?Number(e.target.value):null})}/></label>
    <label>موجودی<input className={control} type="number" min="0" max="1000000" step="1" disabled={!hasStockPermission} value={value.stock} onChange={e=>set({stock:Number(e.target.value)})}/>{!hasStockPermission&&<span className="mt-1 block text-xs text-[#be9876]">تغییر موجودی مخصوص مدیر دارای مجوز انبار است.</span>}</label>
    <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={value.active} onChange={e=>set({active:e.target.checked})}/> محصول فعال و قابل نمایش باشد</label>
    <label className="sm:col-span-2">توضیحات محصول<textarea className={`${control} min-h-32`} maxLength={3000} value={value.description} onChange={e=>set({description:e.target.value})}/></label>
   </div></section>
   <section className={panel}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-[#efd09a]">۲. تصاویر محصول</h2><p className="mt-1 text-xs text-[#b9a081]">حداکثر ۱۲ عکس؛ عکس اول تصویر اصلی محصول است. هر فایل حداکثر ۲ مگابایت.</p></div><label className={`${btn} cursor-pointer`}><ImagePlus size={18}/> انتخاب تصاویر از گالری<input className="sr-only" type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" disabled={busy||value.images.length>=12} onChange={e=>{void upload(e.target.files);e.target.value=""}}/></label></div>
   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{value.images.map((img,i)=><article key={`${i}-${img.src}`} className="min-w-0 space-y-3 rounded-xl border border-[#725536] p-3"><div className="relative flex h-44 items-center justify-center rounded-lg bg-[#0b0908]"><img className="max-h-full max-w-full object-contain" src={img.src} alt={img.alt||`تصویر شماره ${i+1}`}/>{i===0&&<span className="absolute right-2 top-2 rounded bg-[#d7b16e] px-2 py-1 text-xs font-bold text-[#1b100a]">تصویر اصلی</span>}</div><label className="block text-sm">توضیح تصویر<input className={control} maxLength={180} value={img.alt} onChange={e=>setImage(i,{alt:e.target.value})}/></label><div className="flex flex-wrap gap-2"><button type="button" className={btn} disabled={i===0} aria-label="انتقال به قبل" onClick={()=>moveImage(i,-1)}><ArrowUp size={16}/></button><button type="button" className={btn} disabled={i===value.images.length-1} aria-label="انتقال به بعد" onClick={()=>moveImage(i,1)}><ArrowDown size={16}/></button><button type="button" className={btn} onClick={()=>setValue(v=>({...v,images:v.images.filter((_,j)=>i!==j)}))}><Trash2 size={16}/>حذف</button></div></article>)}</div>
   {!value.images.length&&<p className="rounded-xl border border-dashed border-[#705437] p-8 text-center text-sm">هنوز تصویری انتخاب نشده است.</p>}</section>
   <section className={panel}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-[#efd09a]">۳. مشخصات فنی</h2><p className="mt-1 text-xs text-[#b9a081]">حداکثر ۳۰ مشخصه برای نمایش و مقایسه محصولات</p></div><button type="button" disabled={value.specs.length>=30} className={btn} onClick={()=>setValue(v=>({...v,specs:[...v.specs,["",""]]}))}><Plus size={17}/>افزودن مشخصه</button></div>
   <div className="space-y-3">{value.specs.map(([name,val],i)=><div key={i} className="grid gap-2 rounded-xl border border-[#725536] p-3 sm:grid-cols-[1fr_1fr_auto]"><input className={control} aria-label={`نام مشخصه ${i+1}`} placeholder="عنوان (مثلاً جنس)" maxLength={140} value={name} onChange={e=>setValue(v=>({...v,specs:v.specs.map((x,j)=>j===i?([e.target.value,x[1]] as [string,string]):x)}))}/><input className={control} aria-label={`مقدار مشخصه ${i+1}`} placeholder="مقدار" maxLength={140} value={val} onChange={e=>setValue(v=>({...v,specs:v.specs.map((x,j)=>j===i?([x[0],e.target.value] as [string,string]):x)}))}/><button type="button" className={btn} onClick={()=>setValue(v=>({...v,specs:v.specs.filter((_,j)=>j!==i)}))}><Trash2 size={16}/>حذف</button></div>)}</div></section>
   <div className="sticky bottom-2 z-10 rounded-2xl border border-[#b48b55] bg-[#211612]/95 p-3 shadow-xl backdrop-blur-sm sm:p-4"><div className="flex flex-wrap items-center justify-between gap-3"><p role="status" className="min-w-0 flex-1 text-sm text-[#efce90]">{message||"بعد از واردکردن اطلاعات، همه تغییرات را یکجا ذخیره کنید."}</p><button type="submit" disabled={busy||loading||deleting} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#dfbc7c] px-6 font-black text-[#1b100c] disabled:opacity-50"><Save size={19}/>{busy?"در حال ذخیره…":"ذخیره کامل محصول"}</button></div></div>
  </form>
 </main>
}
