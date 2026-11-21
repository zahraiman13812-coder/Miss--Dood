"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {getComparison} from "@/features/catalog/CompareToggle";
import {useStore} from "@/features/store/useStore";
export default function ComparePage(){
 const {products}=useStore();const [ids,setIds]=useState<string[]>([]);
 useEffect(()=>{setIds(getComparison());const change=()=>setIds(getComparison());window.addEventListener("md-compare",change);return()=>window.removeEventListener("md-compare",change)},[]);
 const selected=ids.map(id=>products.find(p=>p.slug===id)).filter((p):p is NonNullable<typeof p>=>Boolean(p));
 const specKeys=[...new Set(selected.flatMap(x=>(x.specs??[]).map(([k])=>k)))];
 return <main className="mx-auto max-w-6xl space-y-5 px-3 py-8 text-[#f6e8cf] sm:px-6"><h1 className="text-2xl font-black">مقایسه محصولات</h1><p className="text-sm text-[#bfae94]">حداکثر چهار محصول. مقایسه بر پایه مشخصات ثبت‌شده انجام می‌شود.</p>{!selected.length?<p>هنوز محصولی انتخاب نکرده‌اید. <Link className="text-[#ebc880] underline" href="/shop">رفتن به فروشگاه</Link></p>:<div className="overflow-x-auto rounded-xl border border-[#62482f]"><table className="min-w-[560px] w-full text-right text-sm"><thead><tr><th className="p-3">ویژگی</th>{selected.map(x=><th key={x.slug} className="min-w-32 p-3"><Link className="text-[#eac580]" href={`/products/${x.slug}`}>{x.name}</Link><button className="mt-2 block text-xs text-[#c8a3a3] underline" onClick={()=>{const v=ids.filter(id=>id!==x.slug);localStorage.setItem("missdood.compare.v1",JSON.stringify(v));setIds(v)}}>حذف</button></th>)}</tr></thead><tbody>{[["برند",...selected.map(x=>x.brand||"—")],["دسته",...selected.map(x=>x.category)],["قیمت",...selected.map(x=>x.priceToman==null?"نامشخص":x.priceToman.toLocaleString("fa-IR")+" تومان")],...specKeys.map(k=>[k,...selected.map(x=>x.specs.find(s=>s[0]===k)?.[1]??"—")])].map((row,i)=><tr key={i} className="border-t border-[#503b2a]"><th className="p-3 text-[#d0b692]">{row[0]}</th>{row.slice(1).map((v,j)=><td className="p-3" key={j}>{v}</td>)}</tr>)}</tbody></table></div>}</main>;
}
