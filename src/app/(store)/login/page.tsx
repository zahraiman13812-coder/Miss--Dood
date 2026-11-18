"use client";

import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail, ShieldCheck } from "lucide-react";

type Mode = "login" | "register";
type Stage = "details" | "verify";
const digitsCount = 6;

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [stage, setStage] = useState<Stage>("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState<string[]>(Array(digitsCount).fill(""));
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [seconds]);

  function changeMode(next: Mode) {
    setMode(next);
    setStage("details");
    setCode(Array(digitsCount).fill(""));
    setError("");
    setNotice("");
  }

  async function requestCode(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", mode, email: email.trim(), name: name.trim() }),
      });
      const result = await response.json();
      if (!response.ok) {
        const messages: Record<string, string> = {
          INVALID_EMAIL: "آدرس ایمیل معتبر نیست.",
          INVALID_NAME: "نام و نام خانوادگی را وارد کنید.",
          ACCOUNT_EXISTS: "این ایمیل قبلاً ثبت‌نام کرده است؛ وارد حساب شوید.",
          ACCOUNT_NOT_FOUND: "حسابی با این ایمیل پیدا نشد؛ ابتدا ثبت‌نام کنید.",
          OTP_COOLDOWN: "برای ارسال مجدد کد کمی صبر کنید.",
          OTP_DAILY_LIMIT: "تعداد درخواست کد امروز به سقف مجاز رسیده است.",
          EMAIL_NOT_CONFIGURED: "تنظیمات ارسال ایمیل در سرور کامل نیست. متغیرهای Resend را در Vercel بررسی کنید.",
          EMAIL_SEND_FAILED: "Resend ایمیل را نپذیرفت یا ارسال ناموفق بود. دامنه فرستنده و API Key را بررسی کنید.",

        };
        throw new Error(messages[result.error] ?? "ارسال کد انجام نشد. دوباره تلاش کنید.");
      }
      setStage("verify");
      setCode(Array(digitsCount).fill(""));
      setSeconds(60);
      setNotice("کد تأیید شش‌رقمی به ایمیل شما ارسال شد. اعتبار کد ۱۰ دقیقه است.");
      window.setTimeout(() => inputs.current[0]?.focus(), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطای ارتباط با سرور.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const otp = code.join("");
    if (!/^\d{6}$/.test(otp)) {
      setError("هر شش رقم کد را وارد کنید.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", mode, email: email.trim(), code: otp }),
      });
      const result = await response.json();
      if (!response.ok) {
        const messages: Record<string, string> = {
          INVALID_OTP: "کد واردشده صحیح نیست.",
          OTP_EXPIRED: "اعتبار کد تمام شده است؛ کد جدید دریافت کنید.",
          OTP_ATTEMPTS_EXCEEDED: "تعداد تلاش‌ها بیش از حد مجاز است؛ کد جدید بگیرید.",
          OTP_NOT_FOUND: "کدی برای این ایمیل پیدا نشد؛ دوباره کد بگیرید.",
          ACCOUNT_EXISTS: "این ایمیل قبلاً ثبت‌نام شده است؛ وارد حساب شوید.",
        };
        throw new Error(messages[result.error] ?? "تأیید کد انجام نشد. دوباره تلاش کنید.");
      }
      router.replace("/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطای ارتباط با سرور.");
    } finally {
      setBusy(false);
    }
  }

  function updateDigit(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    setCode((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });
    if (digit && index < digitsCount - 1) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !code[index] && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === "ArrowLeft" && index < digitsCount - 1) inputs.current[index + 1]?.focus();
    if (event.key === "ArrowRight" && index > 0) inputs.current[index - 1]?.focus();
  }

  function pasteCode(event: ClipboardEvent<HTMLDivElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, digitsCount);
    if (!pasted) return;
    event.preventDefault();
    setCode(Array.from({ length: digitsCount }, (_, index) => pasted[index] ?? ""));
    inputs.current[Math.min(pasted.length, digitsCount) - 1]?.focus();
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#070e18] px-4 py-8 text-white sm:px-6">
      <section className="w-full max-w-[560px] rounded-[28px] border border-[#263b52] bg-[#0e1b2b] px-5 py-8 shadow-[0_24px_80px_rgba(0,0,0,.28)] sm:px-10 sm:py-10">
        <div className="mx-auto flex h-[62px] w-[62px] items-center justify-center rounded-[22px] border border-[#07528c] bg-[#0d2942] text-[#0795ff]">
          <ShieldCheck size={30} strokeWidth={2} aria-hidden="true" />
        </div>

        <h1 className="mt-6 text-center text-[25px] font-extrabold tracking-tight sm:text-[29px]">
          {stage === "verify" ? "وارد کردن کد ایمیل" : mode === "register" ? "ثبت‌نام در میس دود" : "ورود به میس دود"}
        </h1>
        <p className="mx-auto mt-5 max-w-[470px] text-center text-sm leading-8 text-[#9bb5d4] sm:text-base">
          {stage === "verify"
            ? "رمز ۶ رقمی ارسال‌شده به ایمیل را وارد کنید و دکمه ورود را بزنید."
            : "ابتدا اطلاعات را وارد کنید و دکمه ارسال کد را بزنید؛ سپس در مرحله بعد رمز ایمیل را وارد کنید."}
        </p>

        {stage === "details" ? (
          <>
            <div className="mt-8 grid grid-cols-2 gap-1 rounded-2xl border border-[#263b52] bg-[#07111e] p-1" role="tablist" aria-label="نوع حساب">
              <button type="button" role="tab" aria-selected={mode === "register"} onClick={() => changeMode("register")} className={`min-h-[50px] rounded-xl border-2 text-sm font-bold transition-colors ${mode === "register" ? "border-white bg-[#14263b] text-white" : "border-transparent text-[#8ea9c9] hover:text-white"}`}>
                ثبت‌نام
              </button>
              <button type="button" role="tab" aria-selected={mode === "login"} onClick={() => changeMode("login")} className={`min-h-[50px] rounded-xl border-2 text-sm font-bold transition-colors ${mode === "login" ? "border-white bg-[#14263b] text-white" : "border-transparent text-[#8ea9c9] hover:text-white"}`}>
                ورود
              </button>
            </div>

            <form onSubmit={requestCode} className="mt-7 space-y-6">
              {mode === "register" && (
                <label className="block text-sm font-bold text-white">
                  نام و نام خانوادگی
                  <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} autoComplete="name" placeholder="نام شما" className="mt-3 min-h-[58px] w-full rounded-2xl border border-[#2a4058] bg-[#070e18] px-5 text-left text-base text-white outline-none placeholder:text-[#8ea9c9] focus:border-[#078df5] focus:ring-2 focus:ring-[#078df5]/25" dir="auto" />
                </label>
              )}
              <label className="block text-sm font-bold text-white">
                آدرس ایمیل
                <input value={email} onChange={(event) => setEmail(event.target.value)} required type="email" autoComplete="email" maxLength={254} placeholder="name@example.com" className="mt-3 min-h-[58px] w-full rounded-2xl border border-[#2a4058] bg-[#070e18] px-5 text-left text-base text-[#a9c8ed] outline-none placeholder:text-[#8ea9c9] focus:border-[#078df5] focus:ring-2 focus:ring-[#078df5]/25" dir="ltr" />
              </label>
              {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
              <button disabled={busy} className="flex min-h-[64px] w-full items-center justify-center gap-3 rounded-2xl border-2 border-white bg-[#078cf4] px-5 text-base font-extrabold text-white shadow-[0_8px_24px_rgba(0,140,244,.18)] transition hover:bg-[#087bd2] disabled:cursor-wait disabled:opacity-60">
                {busy ? "در حال ارسال..." : "ارسال کد"}<ArrowLeft size={21} aria-hidden="true" />
              </button>
              <p className="text-center text-xs leading-6 text-[#8ea9c9]">هر کد فقط یک‌بار قابل استفاده است و ۱۰ دقیقه اعتبار دارد.</p>
            </form>
          </>
        ) : (
          <form onSubmit={verifyCode} className="mt-8 space-y-6">
            <div className="flex items-center justify-center gap-3 text-sm text-[#9bb5d4]" dir="ltr">
              <Mail size={20} aria-hidden="true" />
              <span className="max-w-[80%] truncate">{email}</span>
            </div>
            <fieldset>
              <legend className="mb-3 w-full text-right text-sm font-bold">کد تأیید ۶ رقمی</legend>
              <div className="grid grid-cols-6 gap-2 sm:gap-3" dir="ltr" onPaste={pasteCode}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => { inputs.current[index] = element; }}
                    aria-label={`رقم ${index + 1} کد تأیید`}
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(event) => updateDigit(index, event.target.value)}
                    onKeyDown={(event) => handleKeyDown(index, event)}
                    className="h-[58px] min-w-0 rounded-xl border border-[#087bc8] bg-[#070e18] text-center text-2xl font-bold text-[#a9d5ff] outline-none transition focus:border-[#0795ff] focus:ring-2 focus:ring-[#0795ff]/40 sm:h-[66px] sm:rounded-2xl sm:text-3xl"
                  />
                ))}
              </div>
            </fieldset>
            {notice && <p role="status" className="rounded-xl border border-[#07528c] bg-[#102a43] px-4 py-3 text-sm font-semibold leading-7 text-[#c1d9f5]">{notice}</p>}
            {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
            <button disabled={busy || code.join("").length !== digitsCount} className="flex min-h-[62px] w-full items-center justify-center gap-3 rounded-2xl border-2 border-white bg-[#087bc8] px-5 text-base font-extrabold text-white transition hover:bg-[#086bad] disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? "در حال بررسی..." : "ورود"}<ArrowLeft size={21} aria-hidden="true" />
            </button>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <button type="button" disabled={seconds > 0 || busy} onClick={() => requestCode()} className="font-semibold text-[#078ff5] underline-offset-4 hover:underline disabled:text-[#71849b]">{seconds > 0 ? `ارسال مجدد تا ${seconds} ثانیه` : "ارسال مجدد کد"}</button>
              <button type="button" disabled={busy} onClick={() => { setStage("details"); setCode(Array(digitsCount).fill("")); setError(""); setNotice(""); }} className="flex items-center gap-1 font-semibold text-[#9bb5d4] hover:text-white"><ArrowRight size={17} /> تغییر ایمیل</button>
            </div>
            <p className="text-center text-xs leading-6 text-[#8ea9c9]">هر کد فقط یک‌بار قابل استفاده است و ۱۰ دقیقه اعتبار دارد.</p>
          </form>
        )}

        <div className="mt-8 border-t border-[#263b52] pt-5 text-center">
          <Link href="/shop" className="text-sm font-semibold text-[#8ea9c9] hover:text-white">بازگشت به فروشگاه</Link>
        </div>
      </section>
    </main>
  );
}
