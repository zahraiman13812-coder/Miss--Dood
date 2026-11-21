import "server-only";
import {createHash} from "node:crypto";
import {db} from "@/lib/db";
/** Explicitly omit exception text, headers, emails and request bodies to avoid logging PII. */
export async function recordOperationError(scope:string,error:unknown):Promise<void>{
 const code=(error && typeof error==="object" && "code" in error && typeof error.code==="string")?error.code:"UNEXPECTED";
 const safeScope=scope.replace(/[^a-z0-9:._-]/gi,"_").slice(0,100)||"unknown";
 const fingerprint=createHash("sha256").update(`${safeScope}:${code}`).digest("hex").slice(0,32);
 try{await db().query("INSERT INTO app_error_events(scope,message,fingerprint) VALUES($1,$2,$3)",[safeScope,code.slice(0,500),fingerprint])}catch(e){console.error("operations logging unavailable",e instanceof Error?e.name:"error")}
}
