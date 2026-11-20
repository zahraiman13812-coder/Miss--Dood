import { defaultCms, type CmsKey, type SiteCms } from "@/lib/site-cms";
const text=(s:unknown,max=1000):s is string=>typeof s==="string"&&s.length<=max&&!/[\u0000-\u0008]/.test(s);
const slug=(s:unknown):s is string=>typeof s==="string"&&/^[a-z0-9][a-z0-9-]{0,79}$/.test(s);
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==="object"&&!Array.isArray(v);
const image=(v:unknown):v is string=>typeof v==="string"&&v.length<500&&( /^\/images\/[a-zA-Z0-9_./-]+$/.test(v)&&!v.includes("..") || /^https:\/\/[^\s<>"']+$/i.test(v));
export function validateCms(key:CmsKey,v:unknown): v is SiteCms[typeof key] {
  if(key==="contact")return obj(v)&&text(v.address,500)&&text(v.description,800)&&Array.isArray(v.phones)&&v.phones.length<=5&&v.phones.every(x=>typeof x==="string"&&/^[+\d\s()-]{7,25}$/.test(x));
  if(key==="about")return obj(v)&&text(v.heading,150)&&Array.isArray(v.paragraphs)&&v.paragraphs.length<=12&&v.paragraphs.every(x=>text(x,3000));
  if(key==="guide")return obj(v)&&text(v.intro,1000)&&Array.isArray(v.questions)&&v.questions.length<=40&&v.questions.every(x=>obj(x)&&text(x.question,220)&&text(x.answer,3000)&&x.question.length>0);
  if(key==="banners")return Array.isArray(v)&&v.length<=12&&v.every(x=>obj(x)&&image(x.src)&&text(x.alt,170)&&typeof x.active==="boolean"&&typeof x.href==="string"&&(/^\/[a-zA-Z0-9/?=&%_-]*$/.test(x.href)||x.href===""));
  if(key==="catalog")return obj(v)&&Array.isArray(v.categories)&&v.categories.length<=50&&v.categories.every(x=>obj(x)&&slug(x.slug)&&text(x.label,85)&&Array.isArray(x.brands)&&x.brands.length<=60&&x.brands.every(b=>obj(b)&&slug(b.slug)&&text(b.label,85)))&&new Set(v.categories.map(x=>x.slug)).size===v.categories.length;
  return false;
}
export { defaultCms };
