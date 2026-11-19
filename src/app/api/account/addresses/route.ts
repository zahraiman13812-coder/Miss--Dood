import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { db, transaction } from "@/lib/db";
import { bad, errorResponse, noStore, sameOrigin } from "@/lib/http";

type Address = {
  id: string; title: string; recipient_name: string; phone: string;
  city: string; province:string; building:string; unit:string; address: string; postal_code: string; is_default: boolean; latitude: number | null; longitude: number | null; preferred_shipping_method: "post"|"express"|"pickup";
};
type AddressInput = Omit<Address, "id">;
export const runtime = "nodejs";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function parseInput(input: unknown): AddressInput | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const data = input as Record<string, unknown>;
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const recipient_name = typeof data.recipient_name === "string" ? data.recipient_name.trim() : "";
  const phone = typeof data.phone === "string" ? data.phone.trim() : "";
  const city = typeof data.city === "string" ? data.city.trim() : "";
  const province = typeof data.province === "string" ? data.province.trim() : "";
  const building = typeof data.building === "string" ? data.building.trim() : "";
  const unit = typeof data.unit === "string" ? data.unit.trim() : "";
  const address = typeof data.address === "string" ? data.address.trim() : "";
  const postal_code = typeof data.postal_code === "string" ? data.postal_code.trim() : "";
  const preferred_shipping_method = data.preferred_shipping_method ?? "post";
  if (preferred_shipping_method !== "post" && preferred_shipping_method !== "express" && preferred_shipping_method !== "pickup") return null;
  if (preferred_shipping_method !== "post" && city.replace(/\s/g,"") !== "تهران") return null;
  const latitude = data.latitude === null || data.latitude === undefined ? null : data.latitude;
  const longitude = data.longitude === null || data.longitude === undefined ? null : data.longitude;
  const coordsValid = (latitude === null && longitude === null) ||
    (typeof latitude === "number" && typeof longitude === "number" && Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180);
  if (!coordsValid) return null;
  if (!title || title.length > 80 || !recipient_name || recipient_name.length > 120 ||
    !/^\+?[0-9۰-۹٠-٩ \-]{8,25}$/.test(phone) || !city || city.length > 120 || !province || province.length > 80 || building.length > 40 || unit.length > 40 ||
    address.length < 6 || address.length > 1000 || postal_code.length > 20 ||
    (postal_code.length > 0 && !/^[0-9۰-۹٠-٩\- ]+$/.test(postal_code))) return null;
  return { title, recipient_name, phone, city, province, building, unit, address, postal_code, is_default: data.is_default === true, latitude: latitude as number|null, longitude: longitude as number|null, preferred_shipping_method };
}

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return bad("AUTH_REQUIRED", 401);
    const result = await db().query<Address>(
      "SELECT id,title,recipient_name,phone,city,province,building,unit,address,postal_code,is_default,latitude,longitude,preferred_shipping_method FROM user_addresses WHERE user_id=$1 ORDER BY is_default DESC, created_at DESC",
      [user.id]
    );
    return NextResponse.json({ addresses: result.rows }, { headers: noStore });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    if (!sameOrigin(request)) return bad("CROSS_ORIGIN", 403);
    const user = await currentUser();
    if (!user) return bad("AUTH_REQUIRED", 401);
    const data = parseInput(await request.json());
    if (!data) return bad("INVALID_ADDRESS");
    const result = await transaction(async (client) => {
      // Serialize address writes for this user so there can be only one default address.
      await client.query("SELECT id FROM users WHERE id=$1 FOR UPDATE", [user.id]);
      const count = await client.query<{ count: number }>(
        "SELECT count(*)::int AS count FROM user_addresses WHERE user_id=$1", [user.id]
      );
      if ((count.rows[0]?.count ?? 0) >= 20) return null;
      const first = count.rows[0]?.count === 0;
      if (data.is_default || first) await client.query("UPDATE user_addresses SET is_default=false WHERE user_id=$1", [user.id]);
      const inserted = await client.query<Address>(
        `INSERT INTO user_addresses (user_id,title,recipient_name,phone,city,province,building,unit,address,postal_code,is_default,latitude,longitude,preferred_shipping_method)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING id,title,recipient_name,phone,city,province,building,unit,address,postal_code,is_default,latitude,longitude,preferred_shipping_method`,
        [user.id, data.title, data.recipient_name, data.phone, data.city, data.province, data.building, data.unit, data.address, data.postal_code, data.is_default || first, data.latitude, data.longitude, data.preferred_shipping_method]
      );
      return inserted.rows[0];
    });
    if (!result) return bad("ADDRESS_LIMIT", 409);
    return NextResponse.json({ address: result }, { status: 201, headers: noStore });
  } catch (error) {
    if (error instanceof SyntaxError) return bad("INVALID_JSON");
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!sameOrigin(request)) return bad("CROSS_ORIGIN", 403);
    const user = await currentUser();
    if (!user) return bad("AUTH_REQUIRED", 401);
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return bad("INVALID_BODY");
    const input = body as Record<string, unknown>;
    if (typeof input.id !== "string" || !uuid.test(input.id)) return bad("INVALID_ADDRESS_ID");
    const data = parseInput(body);
    if (!data) return bad("INVALID_ADDRESS");
    const result = await transaction(async (client) => {
      await client.query("SELECT id FROM users WHERE id=$1 FOR UPDATE", [user.id]);
      const exists = await client.query("SELECT id FROM user_addresses WHERE user_id=$1 AND id=$2", [user.id, input.id]);
      if (!exists.rowCount) return null;
      // Under the unique per-user default index, remove the old default first,
      // then promote the replacement. The existing user-row lock serializes writes.
      const wasDefault = await client.query<{is_default:boolean}>(
        "SELECT is_default FROM user_addresses WHERE user_id=$1 AND id=$2", [user.id, input.id]
      );
      const otherAddressExists = !data.is_default && wasDefault.rows[0]?.is_default === true
        ? (await client.query("SELECT 1 FROM user_addresses WHERE user_id=$1 AND id<>$2 LIMIT 1", [user.id,input.id])).rowCount !== 0
        : false;
      const keepDefault = data.is_default || (wasDefault.rows[0]?.is_default === true && !otherAddressExists);
      if (data.is_default) {
        await client.query("UPDATE user_addresses SET is_default=false WHERE user_id=$1", [user.id]);
      } else if (wasDefault.rows[0]?.is_default && otherAddressExists) {
        await client.query("UPDATE user_addresses SET is_default=false WHERE user_id=$1 AND id=$2", [user.id,input.id]);
        await client.query(`UPDATE user_addresses SET is_default=true,updated_at=now()
          WHERE id=(SELECT id FROM user_addresses WHERE user_id=$1 AND id<>$2 ORDER BY created_at DESC,id DESC LIMIT 1)`,
          [user.id,input.id]);
      }
      const updated = await client.query<Address>(
        `UPDATE user_addresses SET title=$3,recipient_name=$4,phone=$5,city=$6,province=$7,building=$8,unit=$9,address=$10,postal_code=$11,
         is_default=$12,latitude=$13,longitude=$14,preferred_shipping_method=$15,updated_at=now() WHERE user_id=$1 AND id=$2
         RETURNING id,title,recipient_name,phone,city,province,building,unit,address,postal_code,is_default,latitude,longitude,preferred_shipping_method`,
        [user.id, input.id, data.title, data.recipient_name, data.phone, data.city, data.province, data.building, data.unit, data.address, data.postal_code, keepDefault, data.latitude, data.longitude, data.preferred_shipping_method]
      );
      return updated.rows[0];
    });
    if (!result) return bad("NOT_FOUND", 404);
    return NextResponse.json({ address: result }, { headers: noStore });
  } catch (error) {
    if (error instanceof SyntaxError) return bad("INVALID_JSON");
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!sameOrigin(request)) return bad("CROSS_ORIGIN", 403);
    const user = await currentUser();
    if (!user) return bad("AUTH_REQUIRED", 401);
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return bad("INVALID_BODY");
    const { id } = body as { id?: unknown };
    if (typeof id !== "string" || !uuid.test(id)) return bad("INVALID_ADDRESS_ID");
    const removed = await transaction(async (client) => {
      await client.query("SELECT id FROM users WHERE id=$1 FOR UPDATE", [user.id]);
      const deleted = await client.query<{ is_default: boolean }>(
        "DELETE FROM user_addresses WHERE id=$1 AND user_id=$2 RETURNING is_default", [id, user.id]
      );
      if (deleted.rows[0]?.is_default) {
        await client.query(`UPDATE user_addresses SET is_default=true,updated_at=now()
          WHERE id=(SELECT id FROM user_addresses WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1)`, [user.id]);
      }
      return Boolean(deleted.rowCount);
    });
    if (!removed) return bad("NOT_FOUND", 404);
    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch (error) {
    if (error instanceof SyntaxError) return bad("INVALID_JSON");
    return errorResponse(error);
  }
}
