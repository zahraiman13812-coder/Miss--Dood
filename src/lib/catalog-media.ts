export function validMediaUrl(value:unknown):value is string {
 return typeof value==="string"&&value.length<500&&(
  (/^\/api\/media\/[0-9a-f-]{36}$/i.test(value))||
  (/^\/images\/[a-z0-9_./-]+$/i.test(value)&&!value.includes(".."))
 );
}
