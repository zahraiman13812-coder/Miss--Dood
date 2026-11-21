import {adminCan} from "@/lib/admin-access";
import {NextRequest,NextResponse} from "next/server";
import {currentUser} from "@/lib/session";
import {db,transaction} from "@/lib/db";
import {bad,errorResponse,noStore,sameOrigin} from "@/lib/http";
export const runtime="nodejs";
const slugValid=(s:string)=>/^[a-z0-9][a-z0-9-]{0,119}$/.test(s);
export async function GET(req:NextRequest){try{if((await currentUser())?.role!=="admin"||!await adminCan(await currentUser(),"catalog"))return bad("FORBIDDEN",403);if(req.nextUrl.searchParams.get("list")==="1"){
  const list=await db().query("SELECT slug,name,image FROM products ORDER BY name LIMIT 2000");
  return NextResponse.json({products:list.rows},{headers:noStore});
 }
 const slug=req.nextUrl.searchParams.get("slug")??"";if(!slugValid(slug))return bad("INVALID_SLUG");const r=await db().query("SELECT specs FROM products WHERE slug=$1",[slug]);if(!r.rowCount)return bad("NOT_FOUND",404);return NextResponse.json({specs:r.rows[0].specs},{headers:noStore})}catch(e){return errorResponse(e)}}
export async function PUT(req:NextRequest){try{if(!sameOrigin(req))return bad("CROSS_ORIGIN",403);const user=await currentUser();if(user?.role!=="admin"||!await adminCan(await currentUser(),"catalog"))return bad("FORBIDDEN",403);const {slug,specs}=await req.json();if(typeof slug!=="string"||!slugValid(slug)||!Array.isArray(specs)||specs.length>30||specs.some(x=>!Array.isArray(x)||x.length!==2||x.some((s:unknown)=>typeof s!=="string"||s.trim().length<1||s.length>140)))return bad("INVALID_SPECS");await transaction(async c=>{const r=await c.query("UPDATE products SET specs=$1::jsonb,updated_at=now() WHERE slug=$2 RETURNING slug",[JSON.stringify(specs),slug]);if(!r.rowCount)throw Error("NOT_FOUND");await c.query("INSERT INTO admin_audit_log(actor_id,action,target) VALUES($1,'product.specs.update',$2)",[user.id,slug])});return NextResponse.json({ok:true},{headers:noStore})}catch(e){if(e instanceof Error&&e.message==="NOT_FOUND")return bad("NOT_FOUND",404);return errorResponse(e)}}
