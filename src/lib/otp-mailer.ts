import "server-only";

/** Sends one-time login codes through Resend; the API key stays server-side. */
export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) throw new Error("EMAIL_NOT_CONFIGURED");
  if (!/^(?:[^<>\r\n]+\s+<[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+>|[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+)$/.test(from)) {
    throw new Error("RESEND_SENDER_INVALID");
  }

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "کد تأیید ورود به MISS DOOD",
        text: `کد تأیید شما: ${code}\nاین کد تا ۱۰ دقیقه معتبر است.\nاگر درخواست ورود نداده‌اید، این پیام را نادیده بگیرید.`,
      }),
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
  } catch {
    // Do not expose the OTP, email address, secret key, or provider error details.
    throw new Error("EMAIL_SEND_FAILED");
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error("RESEND_ACCESS_DENIED");
    if (response.status === 422) throw new Error("RESEND_SENDER_INVALID");
    throw new Error("EMAIL_SEND_FAILED");
  }

  const result: unknown = await response.json().catch(() => null);
  if (!result || typeof result !== "object" || !("id" in result) || typeof result.id !== "string") {
    throw new Error("EMAIL_SEND_FAILED");
  }
}
