import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {currentUser} from "@/lib/session";
import {bad,errorResponse,noStore,sameOrigin} from "@/lib/http";
export const runtime="nodejs";
export async function PUT(req:NextRequest){try{if(!sameOrigin(req))return bad("CROSS_ORIGIN",403);const user=await currentUser();if(!user)return bad("AUTH_REQUIRED",401);const v=await req.json();const items=v?.items;if(!items||typeof items!=="object"||Array.isArray(items)||Object.keys(items).length>50)return bad("INVALID_ITEMS");for(const [slug,count] of Object.entries(items))if(!/^[a-z0-9][a-z0-9-]{0,119}$/.test(slug)||!Number.isSafeInteger(count)||Number(count)<1||Number(count)>99)return bad("INVALID_ITEMS");await db().query("INSERT INTO customer_cart_snapshots(user_id,items) VALUES($1,$2::jsonb) ON CONFLICT(user_id) DO UPDATE SET items=$2::jsonb,updated_at=now(),reviewed_at=NULL",[user.id,JSON.stringify(items)]);return NextResponse.json({ok:true},{headers:noStore})}catch(e){if(e instanceof SyntaxError)return bad("INVALID_JSON");return errorResponse(e)}}
