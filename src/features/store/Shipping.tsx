"use client";
import {useState} from "react";
import { productPrice } from "@/data/mock/latestProducts";
import { updateStore, findShippingRule, type ShippingRule } from "./store";
import {IranCitySelect} from "./IranCitySelect";

import { useStore } from "./useStore";

export function ShippingAmount({rule,subtotal}:{rule:ShippingRule;subtotal:number}) {
  return <dl className="my-4 space-y-2 border-y border-line py-3 text-sm">
    <div className="flex justify-between gap-2"><dt>ارسال به {rule.city}</dt><dd>{rule.fee ? productPrice(rule.fee) : "رایگان"}</dd></div>
    <div className="flex justify-between gap-2"><dt>زمان تقریبی تحویل</dt><dd>{rule.days}</dd></div>
    <div className="flex flex-wrap justify-between gap-2 font-bold text-accent"><dt>جمع با ارسال</dt><dd>{productPrice(subtotal+rule.fee)}</dd></div>
  </dl>;
}
export function ShippingPicker({subtotal}:{subtotal:number}) {
  const {shipping,city,nationalPost}=useStore();
  const [province,setProvince]=useState("");
  const [error,setError]=useState("");
  const rule=findShippingRule(shipping,city,nationalPost);
  return <section className="my-4 rounded-xl border border-[#62472b] bg-[#15100e] p-3 text-sm">
    <p className="font-bold">مقصد ارسال پستی</p><div className="mt-2 grid gap-3 sm:grid-cols-2"><IranCitySelect className="md-control mt-1 block w-full" province={province} city={city} onChange={(p,c)=>{setProvince(p);updateStore(s=>({...s,city:c}));setError("")}}/></div>
    <p className="mt-2 text-xs leading-6 text-muted">هزینه پست فقط برای مقصدهای دارای تعرفه اختصاصی یا تعرفه سراسری فعال قابل محاسبه است.</p>
    {rule && <ShippingAmount subtotal={subtotal} rule={rule}/>}<p role="status">{error}</p>
  </section>;
}
