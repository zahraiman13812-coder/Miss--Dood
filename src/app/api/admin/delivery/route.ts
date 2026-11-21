import {adminCan} from "@/lib/admin-access";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { bad, errorResponse, noStore, sameOrigin } from "@/lib/http";

export const runtime = "nodejs";
export async function GET() {
  try {
    if ((await currentUser())?.role !== "admin"||!await adminCan(await currentUser(),"orders")) return bad("FORBIDDEN",403);
    const r = await db().query<{fee:string;active:boolean}>("SELECT fee::text,active FROM delivery_config WHERE method='express'");
    return NextResponse.json({express: r.rows[0] ?? {fee:"0", active:false}}, {headers:noStore});
  } catch (error) { return errorResponse(error); }
}
export async function PATCH(request:NextRequest) {
  try {
    if (!sameOrigin(request)) return bad("CROSS_ORIGIN",403);
    if ((await currentUser())?.role !== "admin"||!await adminCan(await currentUser(),"orders")) return bad("FORBIDDEN",403);
    const data = await request.json();
    if (!data || !Number.isSafeInteger(data.fee) || data.fee<0 || data.fee>100_000_000 || typeof data.active!=="boolean") return bad("INVALID_DELIVERY_FEE");
    await db().query(`INSERT INTO delivery_config(method,fee,active) VALUES('express',$1,$2)
       ON CONFLICT(method) DO UPDATE SET fee=$1,active=$2,updated_at=now()`,[data.fee,data.active]);
    return NextResponse.json({ok:true},{headers:noStore});
  } catch(error) { if(error instanceof SyntaxError) return bad("INVALID_JSON");return errorResponse(error); }
}
