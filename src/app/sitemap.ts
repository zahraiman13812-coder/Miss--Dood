import type {MetadataRoute} from "next";
export default function sitemap():MetadataRoute.Sitemap{
 const origin="https://missdoodproject.vercel.app";
 return ["/","/shop","/about","/contact","/help"].map(path=>({url:origin+path,changeFrequency:path==="/"?"weekly":"monthly",priority:path==="/"?1:0.6}));
}
