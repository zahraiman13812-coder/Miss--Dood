"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { Crosshair, MapPin, Minus, Plus } from "lucide-react";

export type Coordinates = { lat: number; lng: number };
const TEHRAN: Coordinates = { lat: 35.7004, lng: 51.4161 };
const cityCenters: Record<string,Coordinates> = {
  "تهران":TEHRAN,"کرج":{lat:35.83,lng:50.99},"مشهد":{lat:36.297,lng:59.606},"اصفهان":{lat:32.66,lng:51.68},
  "شیراز":{lat:29.591,lng:52.583},"تبریز":{lat:38.08,lng:46.29},"رشت":{lat:37.28,lng:49.58},
  "قم":{lat:34.64,lng:50.88},"اهواز":{lat:31.32,lng:48.68},"کرمان":{lat:30.29,lng:57.06},
  "یزد":{lat:31.89,lng:54.37},"ارومیه":{lat:37.55,lng:45.07},"بندرعباس":{lat:27.19,lng:56.27},
  "همدان":{lat:34.8,lng:48.52},"اراک":{lat:34.09,lng:49.7},"کرمانشاه":{lat:34.31,lng:47.06}
};
const tileSize = 256;
const mercator = (lat: number, lng: number, zoom: number) => {
  const n = 2 ** zoom;
  const x = ((lng + 180) / 360) * n * tileSize;
  const safeLat = Math.max(-85.051129, Math.min(85.051129, lat));
  const phi = safeLat * Math.PI / 180;
  const y = ((1 - Math.asinh(Math.tan(phi)) / Math.PI) / 2) * n * tileSize;
  return { x, y };
};
const geo = (x: number, y: number, zoom: number): Coordinates => {
  const scale = 2 ** zoom * tileSize;
  const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / scale))) * 180 / Math.PI;
  return { lat: Math.max(-85, Math.min(85, lat)), lng: ((x / scale) * 360 - 180 + 540) % 360 - 180 };
};

/** Lightweight OpenStreetMap click-to-select map. No browser location permission required. */
export default function LocationPicker({ value, onChange, label = "انتخاب موقعیت روی نقشه", city, province = "", street = "", address = "" }: {
  value: Coordinates | null;
  onChange: (next: Coordinates) => void;
  label?: string; city?: string; province?: string; street?: string; address?: string;
}) {
  const [center, setCenter] = useState<Coordinates>(value ?? TEHRAN);
  const [zoom, setZoom] = useState(13);
  const [width, setWidth] = useState(600);
  const [searchBusy,setSearchBusy]=useState(false);
  const [searchMessage,setSearchMessage]=useState("");
  const canvas = useRef<HTMLDivElement>(null);
  const height = 290;
  useEffect(() => {
    if (!canvas.current) return;
    const observer = new ResizeObserver((entries) => setWidth(Math.max(280, Math.round(entries[0].contentRect.width))));
    observer.observe(canvas.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => { if (value) setCenter(value); }, [value?.lat, value?.lng]);
  useEffect(() => { if (!value && city && cityCenters[city.trim()]) setCenter(cityCenters[city.trim()]); }, [city, value]);
  const tiles = useMemo(() => {
    const c = mercator(center.lat, center.lng, zoom);
    const count = 2 ** zoom;
    const left = c.x - width / 2;
    const top = c.y - height / 2;
    const result: { x: number; y: number; left: number; top: number; key: string; url: string }[] = [];
    for (let x = Math.floor(left / tileSize); x <= Math.floor((left + width) / tileSize); x++) {
      for (let y = Math.floor(top / tileSize); y <= Math.floor((top + height) / tileSize); y++) {
        if (y < 0 || y >= count) continue;
        const wrappedX = ((x % count) + count) % count;
        result.push({x, y, left: Math.round(x * tileSize - left), top: Math.round(y * tileSize - top), key: `${zoom}-${x}-${y}`, url: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png`});
      }
    }
    return result;
  }, [center, zoom, width]);
  async function searchAddress(){
    if(!city||!province){setSearchMessage("ابتدا استان و شهر را انتخاب کنید.");return;}
    setSearchBusy(true);setSearchMessage("");
    try{const q=new URLSearchParams({city,province,street,address});const r=await fetch(`/api/geo/search?${q}`,{cache:"no-store"});const d=await r.json();if(!r.ok||typeof d.lat!=="number"||typeof d.lng!=="number")throw Error("نشانی پیدا نشد؛ نقطه را دستی روی نقشه انتخاب کنید.");setCenter({lat:d.lat,lng:d.lng});setZoom(16);setSearchMessage("مکان تقریبی پیدا شد. برای تأیید نهایی حتماً روی محل صحیح در نقشه کلیک کنید.")}catch(e){setSearchMessage(e instanceof Error?e.message:"جستجو انجام نشد")}finally{setSearchBusy(false)}
  }
  function locateMe(){
    if(!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos=>{
      const point={lat:Number(pos.coords.latitude.toFixed(6)),lng:Number(pos.coords.longitude.toFixed(6))};
      onChange(point);setCenter(point);setZoom(16);
    },()=>{}, {enableHighAccuracy:false,timeout:8000,maximumAge:60000});
  }
  function choose(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const point = mercator(center.lat, center.lng, zoom);
    const target = geo(point.x + event.clientX - rect.left - rect.width / 2,
      point.y + event.clientY - rect.top - rect.height / 2, zoom);
    onChange({lat: Number(target.lat.toFixed(6)), lng: Number(target.lng.toFixed(6))});
  }
  const marker = value ? mercator(value.lat, value.lng, zoom) : null;
  const centerPx = mercator(center.lat, center.lng, zoom);
  const pinX = marker ? width / 2 + marker.x - centerPx.x : width / 2;
  const pinY = marker ? height / 2 + marker.y - centerPx.y : height / 2;
  return <div className="space-y-2">
    <p className="flex items-center gap-2 text-sm font-bold text-[#eed3a2]"><MapPin size={17}/>{label}</p>
    <button type="button" disabled={searchBusy || !city || !province} onClick={()=>void searchAddress()} className="min-h-11 rounded-xl border border-[#b49564] px-4 text-sm text-[#e9c484] disabled:opacity-50">{searchBusy?"در حال جستجو...":"یافتن موقعیت تقریبی استان، شهر و خیابان"}</button>
    {searchMessage&&<p role="status" className="text-xs text-[#e5c68f]">{searchMessage}</p>}
    <div ref={canvas} className="relative isolate h-[290px] w-full select-none overflow-hidden rounded-2xl border border-[#8c6e3d] bg-[#26241d]" dir="ltr">
      <div className="absolute inset-0 cursor-crosshair" onClick={choose} role="button" tabIndex={0} aria-label="نقشه؛ برای انتخاب مکان روی نقشه کلیک کنید"
        onKeyDown={e => { if(e.key === "Enter" || e.key === " ") {e.preventDefault(); onChange(center);}}}>
        {tiles.map(t => <img key={t.key} src={t.url} alt="" loading="lazy" draggable={false} width={256} height={256}
          className="pointer-events-none absolute max-w-none" style={{left:t.left, top:t.top, width:256, height:256}}/>)}
        {value && <span aria-hidden="true" className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full text-[#aa3037] drop-shadow-[0_2px_3px_white]" style={{left:pinX, top:pinY}}><MapPin size={36} fill="#aa3037" stroke="white" strokeWidth={2}/></span>}
      </div>
      <div className="absolute left-3 top-3 z-20 flex flex-col gap-2">
        <button type="button" aria-label="بزرگ‌نمایی نقشه" onClick={()=>setZoom(z=>Math.min(18,z+1))} className="grid size-10 place-items-center rounded-xl border border-[#c29b5b] bg-[#15110a] text-[#ebcf90]"><Plus size={18}/></button>
        <button type="button" aria-label="کوچک‌نمایی نقشه" onClick={()=>setZoom(z=>Math.max(5,z-1))} className="grid size-10 place-items-center rounded-xl border border-[#c29b5b] bg-[#15110a] text-[#ebcf90]"><Minus size={18}/></button>
        <button type="button" title="موقعیت فعلی با اجازه شما" aria-label="استفاده از موقعیت فعلی" onClick={locateMe} className="grid size-10 place-items-center rounded-xl border border-[#c29b5b] bg-[#15110a] text-[#ebcf90]"><MapPin size={18}/></button>
        <button type="button" title="بازگشت به مکان انتخاب‌شده" aria-label="مرکز کردن نقشه" onClick={()=>setCenter(value??TEHRAN)} className="grid size-10 place-items-center rounded-xl border border-[#c29b5b] bg-[#15110a] text-[#ebcf90]"><Crosshair size={18}/></button>
      </div>
      <div className="absolute bottom-0 right-0 z-20 bg-white/90 px-2 py-1 text-[10px] text-black"><a target="_blank" rel="noopener noreferrer" href="https://www.openstreetmap.org/copyright" className="underline">© OpenStreetMap contributors</a></div>
    </div>
    <p className="text-xs leading-6 text-[#c9b78d]">نتیجه جستجو تقریبی است؛ برای تأیید محل حتماً روی نقطه دقیق ساختمان بزنید. نشانی متنی و کد پستی را هم جداگانه وارد کنید. برای جابه‌جایی محدوده نقشه، بزرگ‌نمایی را تغییر دهید یا روی نقطه دیگری بزنید.</p>
    {value && <p className="rounded-xl border border-[#5c482c] bg-[#110e0a] p-3 text-xs text-[#edcf8e]" dir="ltr">{value.lat.toFixed(6)}, {value.lng.toFixed(6)}</p>}
  </div>;
}
