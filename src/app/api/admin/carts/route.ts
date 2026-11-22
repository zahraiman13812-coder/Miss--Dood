import {NextResponse} from "next/server";
export const runtime="nodejs";
const removed=()=>NextResponse.json({error:"NOT_FOUND"},{status:404});
export const GET=removed;
export const PATCH=removed;
