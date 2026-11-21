import { NextResponse } from "next/server";
import { getCms } from "@/lib/site-cms";
export const runtime="nodejs";
export async function GET(){const cms=await getCms();return NextResponse.json({catalog:cms.catalog,contact:cms.contact,branding:cms.branding},{headers:{"Cache-Control":"public, s-maxage=60, stale-while-revalidate=60"}})}
