import {spawnSync} from "node:child_process";
import {mkdirSync,chmodSync} from "node:fs";
import {resolve,join} from "node:path";
const url=process.env.DATABASE_URL;
if(!url||!url.startsWith("postgres")){console.error("DATABASE_URL missing");process.exit(1)}
const target=resolve(process.argv[2]??"./private-backups");
mkdirSync(target,{recursive:true,mode:0o700});
const stamp=new Date().toISOString().replace(/[:.]/g,"-");
const file=join(target,`miss-dood-${stamp}.dump`);
const opts={env:{...process.env,PGCONNECT_TIMEOUT:"10",PGDATABASE:url},stdio:"inherit"};
const r=spawnSync("pg_dump",["--format=custom","--no-owner","--no-acl","--file",file],opts);
if(r.error){console.error("Install PostgreSQL CLI tools (pg_dump) and retry.");process.exit(1)}
if(r.status!==0){console.error("Backup failed. Do not consider this a valid backup.");process.exit(r.status??1)}
try{chmodSync(file,0o600)}catch{}
console.log(`Backup saved: ${file}`);
