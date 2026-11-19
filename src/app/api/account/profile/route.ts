import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { bad, errorResponse, noStore, sameOrigin } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return bad("AUTH_REQUIRED", 401);
    const result = await db().query<{ id: string; full_name: string; email: string; phone: string }>(
      "SELECT id,full_name,email,phone FROM users WHERE id=$1", [user.id]
    );
    return NextResponse.json({ profile: result.rows[0] }, { headers: noStore });
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!sameOrigin(request)) return bad("CROSS_ORIGIN", 403);
    const user = await currentUser();
    if (!user) return bad("AUTH_REQUIRED", 401);
    const data: unknown = await request.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) return bad("INVALID_BODY");
    const body = data as Record<string, unknown>;
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    if (fullName.length < 2 || fullName.length > 120) return bad("INVALID_NAME");
    if (phone && !/^\+?[0-9۰-۹٠-٩ \-]{8,25}$/.test(phone)) return bad("INVALID_PHONE");
    const result = await db().query<{ id: string; full_name: string; email: string; phone: string }>(
      "UPDATE users SET full_name=$2,phone=$3 WHERE id=$1 RETURNING id,full_name,email,phone",
      [user.id, fullName, phone]
    );
    return NextResponse.json({ profile: result.rows[0] }, { headers: noStore });
  } catch (error) {
    if (error instanceof SyntaxError) return bad("INVALID_JSON");
    return errorResponse(error);
  }
}
