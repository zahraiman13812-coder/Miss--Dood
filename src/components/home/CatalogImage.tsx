"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {src?: string; alt: string; fill?: boolean; className?: string; sizes?: string; width?: number; height?: number};
/** Do not show the browser's broken-image icon if CMS media was deleted or a URL is unavailable. */
export default function CatalogImage({src,alt,fill,className,sizes,width,height}:Props) {
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[src]);
 if(!src||failed)return <span role="img" aria-label={alt} className="flex h-full w-full items-center justify-center text-[#c5a270]"><ImageOff size={32} aria-hidden="true"/></span>;
 return fill
  ? <Image unoptimized src={src} alt={alt} fill sizes={sizes} className={className} onError={()=>setFailed(true)}/>
  : <Image unoptimized src={src} alt={alt} width={width??100} height={height??80} className={className} onError={()=>setFailed(true)}/>;
}
