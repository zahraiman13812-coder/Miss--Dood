
import "server-only";
import nodemailer from "nodemailer";

export async function sendOtpEmail(
  to: string,
  code: string
): Promise<void> {
  const user = process.env.GMAIL_USER?.trim();
  const password = process.env.GMAIL_APP_PASSWORD
    ?.replace(/\s/g, "");

  if (!user || !password) {
    throw new Error("EMAIL_NOT_CONFIGURED");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user,
      pass: password,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  const info = await transporter.sendMail({
    from: `"MISS DOOD" <${user}>`,
    to,
    subject: "کد تأیید ورود به MISS DOOD",
    text:
      `کد تأیید شما: ${code}\n` +
      "این کد تا ۱۰ دقیقه معتبر است.\n" +
      "اگر درخواست ورود نداده‌اید، این پیام را نادیده بگیرید.",
  });

  if (!info.accepted.includes(to)) {
    throw new Error("EMAIL_DELIVERY_FAILED");
  }
}
