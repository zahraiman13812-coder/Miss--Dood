import { createHmac, randomInt, randomBytes, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db, transaction } from "@/lib/db";
import { bad, errorResponse, noStore, sameOrigin } from "@/lib/http";
import { currentUser, hashPassword, issueSession } from "@/lib/session";
import { consumeAuthAttempt } from "@/lib/authRateLimit";

export const runtime = "nodejs";

function validEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
function otpDigest(email: string, code: string) {
  const secret = process.env.AUTH_OTP_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_OTP_SECRET must contain at least 32 characters");
  return createHmac("sha256", secret).update(`${email}:${code}`).digest("hex");
}
function safeEqual(a: string, b: string) {
  if (!/^[a-f0-9]{64}$/.test(a) || !/^[a-f0-9]{64}$/.test(b)) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

async function sendEmail(to: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const sender = process.env.EMAIL_FROM?.trim();
  const from = sender && !sender.includes("<") ? `MISS DOOD <${sender}>` : sender;
  if (!apiKey || !from) throw new Error("EMAIL_NOT_CONFIGURED");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "کد ورود به MISS DOOD",
      text: `کد ورود شما: ${code}\nاین کد تا ۱۰ دقیقه معتبر است و فقط یک بار قابل استفاده است. اگر شما درخواست نداده‌اید، این پیام را نادیده بگیرید.`,
      html: `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;background:#11100d;color:#f5efe2;padding:32px;border:1px solid #806638;border-radius:18px;text-align:center"><h2>کد ورود به MISS DOOD</h2><p style="color:#c7b895">برای ورود، کد زیر را در سایت وارد کنید.</p><div style="display:inline-block;background:#090806;border:1px solid #b08b4b;border-radius:12px;padding:18px 28px;font-size:32px;letter-spacing:10px;font-weight:bold;color:#f0d8a7">${code}</div><p style="color:#c7b895">این کد تا ۱۰ دقیقه معتبر است و فقط یک‌بار قابل استفاده است.</p></div>`,
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    console.error("Resend delivery failed", { status: response.status });
    if (response.status === 401 || response.status === 403) throw new Error("RESEND_ACCESS_DENIED");
    if (response.status === 422) throw new Error("RESEND_SENDER_INVALID");
    throw new Error("EMAIL_DELIVERY_FAILED");
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!sameOrigin(request)) return bad("CROSS_ORIGIN", 403);
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return bad("INVALID_BODY");
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!validEmail(email)) return bad("INVALID_EMAIL");
    // Shared PostgreSQL rate limits work across Vercel serverless instances.
    // Per-email buckets limit OTP probing; the IP bucket also limits broad address spraying.
    const action = body.action;
    if (action === "send" || action === "verify") {
      const remote = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
      const allowedForEmail = await consumeAuthAttempt(`otp:${action}:${email}`, "email");
      if (!allowedForEmail) return bad("TOO_MANY_ATTEMPTS", 429);
      const allowedForRemote = await consumeAuthAttempt(`otp:${action}`, remote);
      if (!allowedForRemote) return bad("TOO_MANY_ATTEMPTS", 429);
    }

    if (body.action === "send") {
      const mode = body.mode === "register" ? "register" : body.mode === "login" ? "login" : null;
      if (!mode) return bad("INVALID_ACTION");
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (mode === "register" && (!name || name.length > 120)) return bad("INVALID_NAME");
      const existing = await db().query<{ id: string }>("SELECT id FROM users WHERE email=$1", [email]);
      if (mode === "register" && existing.rows[0]) return bad("ACCOUNT_EXISTS", 409);
      if (mode === "login" && !existing.rows[0]) return bad("ACCOUNT_NOT_FOUND", 404);

      const code = String(randomInt(100000, 1000000));
      const digest = otpDigest(email, code);
      const result = await transaction(async (client) => {
        await client.query(
          `INSERT INTO email_otp_challenges(email,purpose,full_name,code_hash,expires_at,attempts,last_sent_at,send_window_started_at,send_count)
           VALUES($1,$2,$3,$4,now()+interval '10 minutes',0,now(),now(),0)
           ON CONFLICT(email) DO NOTHING`,
          [email, mode, mode === "register" ? name : "", digest],
        );
        const current = await client.query<{ last_sent_at: Date; send_window_started_at: Date; send_count: number }>(
          "SELECT last_sent_at,send_window_started_at,send_count FROM email_otp_challenges WHERE email=$1 FOR UPDATE", [email],
        );
        const row = current.rows[0];
        if (!row) throw new Error("OTP_STORAGE_FAILED");
        // New challenges start with send_count=0 and last_sent_at=now().
        // Do not apply the resend cooldown until an email has actually been sent.
        if (row.send_count > 0 && Date.now() - new Date(row.last_sent_at).getTime() < 60_000) {
          throw new Error("OTP_COOLDOWN");
        }
        const windowActive = Date.now() - new Date(row.send_window_started_at).getTime() < 24 * 60 * 60 * 1000;
        if (windowActive && row.send_count >= 8) throw new Error("OTP_DAILY_LIMIT");
        await client.query(
          `UPDATE email_otp_challenges SET purpose=$2,full_name=$3,code_hash=$4,expires_at=now()+interval '10 minutes',attempts=0,consumed_at=NULL,last_sent_at=now(),
           send_window_started_at=CASE WHEN send_window_started_at < now()-interval '24 hours' THEN now() ELSE send_window_started_at END,
           send_count=CASE WHEN send_window_started_at < now()-interval '24 hours' THEN 1 ELSE send_count+1 END WHERE email=$1`,
          [email, mode, mode === "register" ? name : "", digest],
        );
      });
      try {
        await sendEmail(email, code);
      } catch (error) {
        await db().query("UPDATE email_otp_challenges SET consumed_at=now() WHERE email=$1", [email]);
        if (error instanceof Error && error.message === "EMAIL_NOT_CONFIGURED") return bad("EMAIL_NOT_CONFIGURED", 503);
        if (error instanceof Error && error.message === "RESEND_ACCESS_DENIED") return bad("RESEND_ACCESS_DENIED", 503);
        if (error instanceof Error && error.message === "RESEND_SENDER_INVALID") return bad("RESEND_SENDER_INVALID", 503);
        return bad("EMAIL_SEND_FAILED", 503);
      }
      return NextResponse.json({ ok: true }, { headers: noStore });
    }

    if (body.action === "verify") {
      const mode = body.mode === "register" ? "register" : body.mode === "login" ? "login" : null;
      const code = typeof body.code === "string" ? body.code : "";
      if (!mode || !/^\d{6}$/.test(code)) return bad("INVALID_OTP");
      const verification = await transaction(async (client): Promise<{ userId?: string; error?: string }> => {
        const result = await client.query<{
          purpose: string; full_name: string; code_hash: string; attempts: number; consumed_at: Date | null; expires_at: Date;
        }>("SELECT purpose,full_name,code_hash,attempts,consumed_at,expires_at FROM email_otp_challenges WHERE email=$1 FOR UPDATE", [email]);
        const challenge = result.rows[0];
        if (!challenge || challenge.consumed_at) return { error: "OTP_NOT_FOUND" };
        if (new Date(challenge.expires_at).getTime() <= Date.now()) {
          await client.query("UPDATE email_otp_challenges SET consumed_at=now() WHERE email=$1", [email]);
          return { error: "OTP_EXPIRED" };
        }
        if (challenge.attempts >= 5) {
          await client.query("UPDATE email_otp_challenges SET consumed_at=now() WHERE email=$1", [email]);
          return { error: "OTP_ATTEMPTS_EXCEEDED" };
        }
        if (challenge.purpose !== mode || !safeEqual(challenge.code_hash, otpDigest(email, code))) {
          await client.query("UPDATE email_otp_challenges SET attempts=attempts+1,consumed_at=CASE WHEN attempts+1 >= 5 THEN now() ELSE consumed_at END WHERE email=$1", [email]);
          return { error: challenge.attempts + 1 >= 5 ? "OTP_ATTEMPTS_EXCEEDED" : "INVALID_OTP" };
        }
        let id: string;
        if (mode === "register") {
          const created = await client.query<{ id: string }>(
            "INSERT INTO users(email,password_hash,full_name) VALUES($1,$2,$3) ON CONFLICT(email) DO NOTHING RETURNING id",
            [email, hashPassword(randomBytes(32).toString("hex")), challenge.full_name],
          );
          if (!created.rows[0]) return { error: "ACCOUNT_EXISTS" };
          id = created.rows[0].id;
        } else {
          const user = await client.query<{ id: string }>("SELECT id FROM users WHERE email=$1", [email]);
          if (!user.rows[0]) return { error: "ACCOUNT_NOT_FOUND" };
          id = user.rows[0].id;
        }
        await client.query("UPDATE email_otp_challenges SET consumed_at=now() WHERE email=$1", [email]);
        return { userId: id };
      });
      if (verification.error) throw new Error(verification.error);
      if (!verification.userId) throw new Error("OTP_VERIFICATION_FAILED");
      await issueSession(verification.userId);
      return NextResponse.json({ ok: true, user: await currentUser() }, { headers: noStore });
    }
    return bad("INVALID_ACTION");
  } catch (error) {
    if (error instanceof SyntaxError) return bad("INVALID_JSON");
    if (error instanceof Error) {
      const status: Record<string, number> = {
        OTP_COOLDOWN: 429, OTP_DAILY_LIMIT: 429, OTP_NOT_FOUND: 404, OTP_EXPIRED: 410,
        OTP_ATTEMPTS_EXCEEDED: 429, INVALID_OTP: 401, ACCOUNT_EXISTS: 409, ACCOUNT_NOT_FOUND: 404,
      };
      if (status[error.message]) return bad(error.message, status[error.message]);
    }
    return errorResponse(error);
  }
}
