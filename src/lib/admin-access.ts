import "server-only";
import {db} from "@/lib/db";
import type {CurrentUser} from "@/lib/session";
export type AdminScope="owner"|"manager"|"catalog"|"warehouse"|"orders"|"support";
export type AdminArea="team"|"catalog"|"warehouse"|"orders"|"support"|"reports"|"content";
const scopes:AdminScope[]=["owner","manager","catalog","warehouse","orders","support"];
export async function getAdminScope(user:CurrentUser|null):Promise<AdminScope|null>{
 if(user?.role!=="admin")return null;
 const result=await db().query<{scope:string}>("SELECT scope FROM admin_permissions WHERE user_id=$1",[user.id]);
 const scope=result.rows[0]?.scope;
 // Existing admin users without explicit permissions retain full control.
 return scopes.includes(scope as AdminScope)?scope as AdminScope:"owner";
}
export async function adminCan(user:CurrentUser|null,area:AdminArea):Promise<boolean>{
 const scope=await getAdminScope(user);
 if(!scope)return false;
 if(scope==="owner")return true;
 if(area==="team")return false;
 if(scope==="manager")return true;
 if(area==="content")return scope==="catalog";
 if(area==="reports")return false;
 return scope===area;
}
