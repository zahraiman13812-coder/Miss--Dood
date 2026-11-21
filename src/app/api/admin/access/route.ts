import {NextResponse} from "next/server";
import {currentUser} from "@/lib/session";
import {getAdminScope} from "@/lib/admin-access";
import {bad,noStore,errorResponse} from "@/lib/http";
export const runtime="nodejs";
export async function GET(){try{const scope=await getAdminScope(await currentUser());if(!scope)return bad("FORBIDDEN",403);return NextResponse.json({scope},{headers:noStore})}catch(e){return errorResponse(e)}}
