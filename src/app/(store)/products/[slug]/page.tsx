import type {Metadata} from "next";
import {db} from "@/lib/db";
import ProductDetail from "@/features/catalog/ProductDetail";
export default async function ProductPage({params}:{params:Promise<{slug:string}>}) {
  return <ProductDetail slug={(await params).slug}/>;
}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const {slug}=await params;
 if(!/^[a-z0-9][a-z0-9-]{0,119}$/.test(slug))return {title:"محصول یافت نشد",robots:{index:false}};
 try{
  const r=await db().query<{name:string;description:string;image:string}>("SELECT name,description,image FROM products WHERE slug=$1 AND active=true",[slug]);
  const item=r.rows[0];if(!item)return {title:"محصول یافت نشد",robots:{index:false}};
  return {title:item.name,description:item.description?.slice(0,155)||`اطلاعات ${item.name}`,alternates:{canonical:`/products/${slug}`}};
 }catch{return {title:"محصولات MISS DOOD"}}
}
