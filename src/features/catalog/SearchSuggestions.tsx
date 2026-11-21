"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {useStore} from "@/features/store/useStore";
const norm=(s:string)=>s.toLowerCase().normalize("NFKC").replace(/ي/g,"ی").replace(/ك/g,"ک").trim();
export default function SearchSuggestions({initial=""}:{initial?:string}){
 const [q,setQ]=useState(initial);const [open,setOpen]=useState(false);const {products}=useStore();
 useEffect(()=>setQ(initial),[initial]);
 const options=useMemo(()=>{const v=norm(q);return v.length<2?[]:products.filter(x=>norm(`${x.name} ${x.brand} ${x.description}`).includes(v)).slice(0,6)},[products,q]);
 return <div className="relative"><label className="block text-sm font-bold text-[#e7d1a9]" htmlFor="md-search-q">جست‌وجوی کالا</label><input id="md-search-q" name="q" type="search" className="md-control mt-2 block" value={q} onChange={e=>{setQ(e.target.value);setOpen(true)}} onFocus={()=>setOpen(true)} onBlur={()=>window.setTimeout(()=>setOpen(false),180)} autoComplete="off" placeholder="نام کالا یا برند…" aria-autocomplete="list" aria-controls="md-search-options" aria-expanded={open&&options.length>0}/>
 {open&&options.length>0&&<ul id="md-search-options" role="listbox" className="absolute inset-x-0 top-full z-30 max-h-64 overflow-y-auto rounded-xl border border-[#9e7545] bg-[#211714] p-1 shadow-2xl">{options.map(p=><li key={p.slug} role="option" aria-selected={false}><Link href={`/products/${p.slug}`} className="block rounded-lg px-3 py-3 text-sm text-[#f2ddba] hover:bg-[#5a3032]">{p.name}</Link></li>)}</ul>}
 </div>;
}
