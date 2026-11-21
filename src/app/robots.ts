import type {MetadataRoute} from "next";
export default function robots():MetadataRoute.Robots{
 return {rules:[{userAgent:"*",allow:["/","/shop","/about","/contact","/help"],disallow:["/admin","/account","/checkout","/cart","/api","/login","/orders"]}],sitemap:"https://missdoodproject.vercel.app/sitemap.xml"};
}
