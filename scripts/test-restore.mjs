import {spawnSync} from "node:child_process";
import {existsSync} from "node:fs";
const dump=process.argv[2];const target=process.env.RESTORE_TEST_DATABASE_URL;const source=process.env.DATABASE_URL;
if(!dump||!existsSync(dump)){console.error("Usage: npm run db:restore:test -- <file.dump>");process.exit(1)}
if(!target||!source){console.error("Set RESTORE_TEST_DATABASE_URL and DATABASE_URL");process.exit(1)}
const redact=u=>{const x=new URL(u);return `${x.hostname}:${x.port||5432}/${x.pathname.replace(/^\//,"")}`};
if(redact(target)===redact(source)){console.error("REFUSED: restore target is the main database");process.exit(1)}
if(process.env.RESTORE_TEST_CONFIRM!=="I_UNDERSTAND_THIS_WIPES_THE_TARGET"){console.error("Set RESTORE_TEST_CONFIRM=I_UNDERSTAND_THIS_WIPES_THE_TARGET after verifying the disposable database target.");process.exit(1)}
const r=spawnSync("pg_restore",["--exit-on-error","--clean","--if-exists","--no-owner","--no-acl",dump],{env:{...process.env,PGDATABASE:target},stdio:"inherit"});
if(r.error){console.error("Install PostgreSQL CLI tools (pg_restore) and retry");process.exit(1)}
if(r.status!==0)process.exit(r.status??1);
const test=spawnSync("psql",["-X","-A","-t","-c","SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"],{env:{...process.env,PGDATABASE:target},encoding:"utf8"});
if(test.status!==0||Number(test.stdout.trim())<5){console.error("Restore validation failed");process.exit(1)}
console.log("Disposable restore test passed: schema tables:",test.stdout.trim());
