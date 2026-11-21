const base=(process.env.SMOKE_BASE_URL??"http://127.0.0.1:3000").replace(/\/$/,"");
const paths=["/","/shop","/about","/contact","/help","/login","/cart","/admin","/api/health"];
let failed=false;
for(const path of paths){try{const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);let r;
try{r=await fetch(base+path,{redirect:"manual",signal:controller.signal})}finally{clearTimeout(timeout)}
const good=path==="/admin"?[200,302,303,307,308].includes(r.status):r.status>=200&&r.status<400;
console.log(`${good?"OK":"FAIL"} ${path} ${r.status}`);if(!good)failed=true;
}catch(e){console.error("FAIL",path,e.message);failed=true}}
if(failed)process.exitCode=1;
