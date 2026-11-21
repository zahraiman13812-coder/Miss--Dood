"use client";
import {useEffect,useMemo,useState} from "react";
import {iranCitiesFallback} from "@/data/iran-cities-fallback";
type Region={province:string;cities:string[]};
export function IranCitySelect({province,city,onChange,className}:{province:string;city:string;onChange:(province:string,city:string)=>void;className:string}){
 const [regions,setRegions]=useState<Region[]>(iranCitiesFallback);
 useEffect(()=>{fetch("/data/iran-cities.json").then(r=>r.ok?r.json():Promise.reject()).then(data=>{if(Array.isArray(data)&&data.length===31)setRegions(data)}).catch(()=>{})},[]);
 const choices=useMemo(()=>regions.find(x=>x.province===province)?.cities??[],[regions,province]);
 return <>
  <label>استان<select required className={className} value={province} onChange={e=>onChange(e.target.value,"")}><option value="">انتخاب استان</option>{regions.map(x=><option key={x.province} value={x.province}>{x.province}</option>)}</select></label>
  <label>شهر<select required className={className} value={city} onChange={e=>onChange(province,e.target.value)}><option value="">انتخاب شهر</option>{choices.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
 </>
}
