import { defaultCms, type CmsKey, type SiteCms } from "@/lib/site-cms";
const text=(s:unknown,max=1000):s is string=>typeof s==="string"&&s.length<=max&&!/[\u0000-\u0008]/.test(s);
const slug=(s:unknown):s is string=>typeof s==="string"&&/^[a-z0-9][a-z0-9-]{0,79}$/.test(s);
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==="object"&&!Array.isArray(v);
const image=(v:unknown):v is string=>typeof v==="string"&&v.length<500&&(/^\/api\/media\/[a-f0-9-]{36}$/i.test(v)||/^\/images\/[a-zA-Z0-9_./-]+$/.test(v)&&!v.includes("..")||/^\/brand\/[a-zA-Z0-9_./-]+$/.test(v)&&!v.includes("..")||/^https:\/\/[^\s<>"']+$/i.test(v));
const mapUrl=(v:unknown)=>v===""||(typeof v==="string"&&v.length<1000&&/^https:\/\/(www\.google\.com|maps\.google\.com|goo\.gl|maps\.app\.goo\.gl|balad\.ir|neshan\.org|nshn\.ir)(\/|$)/i.test(v));
const validPhone=(v:unknown)=>typeof v==="string"&&/^[+\d۰-۹٠-٩\s()-]{7,25}$/.test(v);
export function validateCms(key:CmsKey,v:unknown):v is SiteCms[typeof key]{
 if(key==="contact")return obj(v)&&text(v.address,500)&&text(v.description,800)&&Array.isArray(v.phones)&&v.phones.length<=5&&v.phones.every(validPhone)&&(!v.mapLinks||(obj(v.mapLinks)&&["google","balad","neshan"].every(k=>mapUrl(v.mapLinks && (v.mapLinks as Record<string,unknown>)[k]))));
 if(key==="about")return obj(v)&&text(v.heading,150)&&Array.isArray(v.paragraphs)&&v.paragraphs.length<=12&&v.paragraphs.every(x=>text(x,3000));
 if(key==="guide")return obj(v)&&text(v.intro,1000)&&Array.isArray(v.questions)&&v.questions.length<=40&&v.questions.every(x=>obj(x)&&text(x.question,220)&&text(x.answer,3000)&&x.question.length>0);
 if(key==="banners")return Array.isArray(v)&&v.length<=12&&v.every(x=>obj(x)&&image(x.src)&&text(x.alt,170)&&typeof x.active==="boolean"&&typeof x.href==="string"&&(/^\/[a-zA-Z0-9/?=&%_-]*$/.test(x.href)||x.href===""));
 if(key==="catalog")return obj(v)&&Array.isArray(v.categories)&&v.categories.length<=50&&v.categories.every(x=>obj(x)&&slug(x.slug)&&text(x.label,85)&&x.label.trim().length>0&&(!x.image||image(x.image))&&Array.isArray(x.brands)&&x.brands.length<=60&&x.brands.every(b=>obj(b)&&slug(b.slug)&&text(b.label,85)&&b.label.trim().length>0&&(!b.image||image(b.image)))&&new Set(x.brands.map(b=>(b as Record<string,unknown>).slug)).size===x.brands.length)&&new Set(v.categories.map(x=>x.slug)).size===v.categories.length;
 if(key==="branding")return obj(v)&&image(v.logo);
 if(key==="decor")return obj(v)&&Array.isArray(v.items)&&v.items.length<=24&&v.items.every(x=>obj(x)&&slug(x.id)&&text(x.name,100)&&x.name.trim().length>0&&image(x.image))&&new Set(v.items.map(x=>x.id)).size===v.items.length;
 return false;
}
export { defaultCms };
