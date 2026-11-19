import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, noStore } from "@/lib/http";

export const runtime = "nodejs";
export async function GET() {
  try {
    const result = await db().query<{fee:number;active:boolean}>("SELECT fee::float8 AS fee,active FROM delivery_config WHERE method='express'");
    const row = result.rows[0];
    return NextResponse.json({pickup:{active:true,fee:0},express:{active:row?.active===true,fee:row?.active ? row.fee : null},post:{active:true,fee:null}}, {headers:noStore});
  } catch (error) { return errorResponse(error); }
}
