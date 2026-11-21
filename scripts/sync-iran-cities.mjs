/** Run locally once: node scripts/sync-iran-cities.mjs. Commit the generated JSON. */
import {writeFile,mkdir} from "node:fs/promises";
const base="https://raw.githubusercontent.com/sajaddp/list-of-cities-in-Iran/main/dist/json/";
const read=async name=>{const r=await fetch(base+name,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`${name}: ${r.status}`);return r.json()};
const [provinces,cities]=await Promise.all([read("provinces.json"),read("cities-filtered.json")]);
if(!Array.isArray(provinces)||provinces.length!==31||!Array.isArray(cities)||cities.length<1400)throw Error("Iran city source incomplete");
const output=provinces.map(p=>({province:p.name,cities:[...new Set(cities.filter(c=>c.province_id===p.id).map(c=>c.name))].sort((a,b)=>a.localeCompare(b,"fa"))}));
if(output.some(p=>!p.cities.length))throw Error("One or more provinces are missing cities");
await mkdir("public/data",{recursive:true});await writeFile("public/data/iran-cities.json",JSON.stringify(output));
console.log(`Iran cities synced: ${output.length} provinces and ${output.reduce((x,p)=>x+p.cities.length,0)} city entries`);
