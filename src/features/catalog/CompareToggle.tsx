"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
const KEY="missdood.compare.v1";
export function getComparison():string[]{try{const parsed=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(parsed)?parsed.filter(x=>typeof x==="string").slice(0,4):[]}catch{return []}}
export default function CompareToggle({slug}:{slug:string}){
 const [selected,setSelected]=useState(false);const [count,setCount]=useState(0);
 useEffect(()=>{const change=()=>{const xs=getComparison();setSelected(xs.includes(slug));setCount(xs.length)};change();window.addEventListener("storage",change);window.addEventListener("md-compare",change);return()=>{window.removeEventListener("storage",change);window.removeEventListener("md-compare",change)}},[slug]);
 function toggle(){let xs=getComparison();if(xs.includes(slug))xs=xs.filter(x=>x!==slug);else if(xs.length<4)xs=[...xs,slug];else return;localStorage.setItem(KEY,JSON.stringify(xs));window.dispatchEvent(new Event("md-compare"))}
 return <div className="flex flex-wrap items-center gap-3"><button className="min-h-11 rounded-xl border border-[#987447] px-4 text-[#e9c881]" type="button" onClick={toggle} aria-pressed={selected}>{selected?"حذف از مقایسه":"افزودن به مقایسه"}</button><Link className="text-sm text-[#e9c881] underline" href="/compare">مقایسه محصولات ({count.toLocaleString("fa-IR")})</Link></div>;
}
