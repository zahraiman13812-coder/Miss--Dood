"use client";

import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail, ShieldCheck, Sparkles } from "lucide-react";

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
    setMode(next); setStage("details"); setCode(Array(digitsCount).fill("")); setError(""); setNotice("");
  }

  async function requestCode(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/auth/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "send", mode, email: email.trim(), name: name.trim() }) });
      const result = await response.json();
      if (!response.ok) {
        const messages: Record<string, string> = { INVALID_EMAIL: "آدرس ایمیل معتبر نیست.", INVALID_NAME: "نام و نام خانوادگی را وارد کنید.", ACCOUNT_EXISTS: "این ایمیل قبلاً ثبت‌نام کرده است؛ وارد حساب شوید.", ACCOUNT_NOT_FOUND: "حسابی با این ایمیل پیدا نشد؛ ابتدا ثبت‌نام کنید.", OTP_COOLDOWN: "برای ارسال مجدد کد کمی صبر کنید.", OTP_DAILY_LIMIT: "تعداد درخواست کد امروز به سقف مجاز رسیده است.", EMAIL_NOT_CONFIGURED: "تنظیمات ارسال ایمیل در Vercel کامل نیست؛ متغیرهای Resend را بررسی کنید.",
          EMAIL_SEND_FAILED: "Resend ارسال را رد کرد. در حالت آزمایشی گیرنده باید همان ایمیل تأییدشده حساب Resend باشد و EMAIL_FROM برابر onboarding@resend.dev باشد." };
        throw new Error(messages[result.error] ?? "ارسال کد انجام نشد. دوباره تلاش کنید.");
      }
      setStage("verify"); setCode(Array(digitsCount).fill("")); setSeconds(60);
      setNotice("کد تأیید شش‌رقمی به ایمیل شما ارسال شد. اعتبار کد ۱۰ دقیقه است.");
      window.setTimeout(() => inputs.current[0]?.focus(), 50);
    } catch (err) { setError(err instanceof Error ? err.message : "خطای ارتباط با سرور."); }
    finally { setBusy(false); }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const otp = code.join("");
    if (!/^\d{6}$/.test(otp)) { setError("هر شش رقم کد را وارد کنید."); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify", mode, email: email.trim(), code: otp }) });
      const result = await response.json();
      if (!response.ok) {
        const messages: Record<string, string> = { INVALID_OTP: "کد واردشده صحیح نیست.", OTP_EXPIRED: "اعتبار کد تمام شده است؛ کد جدید دریافت کنید.", OTP_ATTEMPTS_EXCEEDED: "تعداد تلاش‌ها بیش از حد مجاز است؛ کد جدید بگیرید.", OTP_NOT_FOUND: "کدی برای این ایمیل پیدا نشد؛ دوباره کد بگیرید.", ACCOUNT_EXISTS: "این ایمیل قبلاً ثبت‌نام شده است؛ وارد حساب شوید." };
        throw new Error(messages[result.error] ?? "تأیید کد انجام نشد. دوباره تلاش کنید.");
      }
      router.replace("/account"); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "خطای ارتباط با سرور."); }
    finally { setBusy(false); }
  }

  function updateDigit(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    setCode((current) => { const next = [...current]; next[index] = digit; return next; });
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
    event.preventDefault(); setCode(Array.from({ length: digitsCount }, (_, index) => pasted[index] ?? ""));
    inputs.current[Math.min(pasted.length, digitsCount) - 1]?.focus();
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#090806] px-4 py-10 text-[#f5efe2] sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(181,139,65,.16),transparent_52%)]"/>
      <section className="relative w-full max-w-[560px] overflow-hidden rounded-[30px] border border-[#806638]/65 bg-gradient-to-br from-[#1b1914] via-[#12110e] to-[#0d0c0a] px-5 py-8 shadow-[0_28px_90px_rgba(0,0,0,.55)] sm:px-10 sm:py-10">
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#d7b56d] to-transparent"/>
        <div className="mx-auto flex size-[62px] items-center justify-center rounded-[22px] border border-[#b08b4b]/55 bg-[#b08b4b]/10 text-[#e4bf76] shadow-[0_0_35px_rgba(210,169,91,.12)]">
          <ShieldCheck size={30} strokeWidth={1.8} aria-hidden="true"/>
        </div>
        <div className="mt-5 flex items-center justify-center gap-2 text-xs font-bold tracking-[.24em] text-[#d7b56d]"><Sparkles size={14}/> MISS DOOD</div>
        <h1 className="mt-3 text-center text-[25px] font-black tracking-tight text-[#f7f0e3] sm:text-[29px]">
          {stage === "verify" ? "تأیید کد ورود" : mode === "register" ? "عضویت در میس دود" : "ورود به حساب کاربری"}
        </h1>
        <p className="mx-auto mt-4 max-w-[470px] text-center text-sm leading-8 text-[#bdb29d] sm:text-base">
          {stage === "verify" ? "کد شش‌رقمی ارسال‌شده به ایمیل خود را وارد کنید." : "برای ورود امن، ایمیل خود را وارد کنید تا کد یک‌بارمصرف برایتان ارسال شود."}
        </p>

        {stage === "details" ? (
          <>
            <div className="mt-8 grid grid-cols-2 gap-1 rounded-2xl border border-[#57472d] bg-[#090806] p-1" role="tablist" aria-label="نوع حساب">
              <button type="button" role="tab" aria-selected={mode === "login"} onClick={() => changeMode("login")} className={`min-h-[52px] rounded-xl border font-bold transition ${mode === "login" ? "border-[#d7b56d] bg-gradient-to-b from-[#49391f] to-[#2b2114] text-[#f8e6bd] shadow-inner" : "border-transparent text-[#b7aa92] hover:text-[#f5e8ce]"}`}>ورود</button>
              <button type="button" role="tab" aria-selected={mode === "register"} onClick={() => changeMode("register")} className={`min-h-[52px] rounded-xl border font-bold transition ${mode === "register" ? "border-[#d7b56d] bg-gradient-to-b from-[#49391f] to-[#2b2114] text-[#f8e6bd] shadow-inner" : "border-transparent text-[#b7aa92] hover:text-[#f5e8ce]"}`}>ثبت‌نام</button>
            </div>
            <form onSubmit={requestCode} className="mt-7 space-y-6">
              {mode === "register" && <label className="block text-sm font-bold text-[#eee3ce]">نام و نام خانوادگی
                <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} autoComplete="name" placeholder="نام شما" className="mt-3 min-h-[58px] w-full rounded-2xl border border-[#57472d] bg-[#090806] px-5 text-base text-[#f5efe2] outline-none placeholder:text-[#8f826b] focus:border-[#d7b56d] focus:ring-2 focus:ring-[#d7b56d]/20" dir="auto"/>
              </label>}
              <label className="block text-sm font-bold text-[#eee3ce]">آدرس ایمیل
                <input value={email} onChange={(event) => setEmail(event.target.value)} required type="email" autoComplete="email" maxLength={254} placeholder="name@example.com" className="mt-3 min-h-[58px] w-full rounded-2xl border border-[#57472d] bg-[#090806] px-5 text-left text-base text-[#f0d8a7] outline-none placeholder:text-[#8f826b] focus:border-[#d7b56d] focus:ring-2 focus:ring-[#d7b56d]/20" dir="ltr"/>
              </label>
              {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</p>}
              <button disabled={busy} className="flex min-h-[62px] w-full items-center justify-center gap-3 rounded-2xl border border-[#e1c17d] bg-gradient-to-b from-[#c6a15d] to-[#94703a] px-5 text-base font-extrabold text-[#1a140a] shadow-[0_10px_28px_rgba(180,137,62,.18)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">
                {busy ? "در حال ارسال..." : "ارسال کد ورود"}<ArrowLeft size={21}/>
              </button>
              <p className="text-center text-xs leading-6 text-[#a99b81]">کد یک‌بارمصرف است و پس از ۱۰ دقیقه منقضی می‌شود.</p>
            </form>
          </>
        ) : (
          <form onSubmit={verifyCode} className="mt-8 space-y-6">
            <div className="flex items-center justify-center gap-3 text-sm text-[#c5b796]" dir="ltr"><Mail size={20}/><span className="max-w-[80%] truncate">{email}</span></div>
            <fieldset>
              <legend className="mb-3 w-full text-right text-sm font-bold text-[#eee3ce]">کد تأیید ۶ رقمی</legend>
              <div className="grid grid-cols-6 gap-2 sm:gap-3" dir="ltr" onPaste={pasteCode}>
                {code.map((digit, index) => <input key={index} ref={(element) => { inputs.current[index] = element; }} aria-label={`رقم ${index + 1} کد تأیید`}
                  autoComplete={index === 0 ? "one-time-code" : "off"} inputMode="numeric" pattern="[0-9]*" maxLength={1} value={digit}
                  onChange={(event) => updateDigit(index, event.target.value)} onKeyDown={(event) => handleKeyDown(index, event)}
                  className="h-[58px] min-w-0 rounded-xl border border-[#8c6b37] bg-[#090806] text-center text-2xl font-bold text-[#f0d8a7] outline-none transition focus:border-[#e4bf76] focus:ring-2 focus:ring-[#e4bf76]/25 sm:h-[66px] sm:rounded-2xl sm:text-3xl"/>)}
              </div>
            </fieldset>
            {notice && <p role="status" className="rounded-xl border border-[#806638]/60 bg-[#3a2c16]/35 px-4 py-3 text-sm font-semibold leading-7 text-[#e8d6b2]">{notice}</p>}
            {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</p>}
            <button disabled={busy || code.join("").length !== digitsCount} className="flex min-h-[62px] w-full items-center justify-center gap-3 rounded-2xl border border-[#e1c17d] bg-gradient-to-b from-[#c6a15d] to-[#94703a] px-5 text-base font-extrabold text-[#1a140a] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "در حال بررسی..." : "تأیید و ورود"}<ArrowLeft size={21}/></button>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <button type="button" disabled={seconds > 0 || busy} onClick={() => requestCode()} className="font-semibold text-[#e4bf76] underline-offset-4 hover:underline disabled:text-[#84765c]">{seconds > 0 ? `ارسال مجدد تا ${seconds} ثانیه` : "ارسال مجدد کد"}</button>
              <button type="button" disabled={busy} onClick={() => { setStage("details"); setCode(Array(digitsCount).fill("")); setError(""); setNotice(""); }} className="flex items-center gap-1 font-semibold text-[#bdb29d] hover:text-[#f5e8ce]"><ArrowRight size={17}/> تغییر ایمیل</button>
            </div>
            <p className="text-center text-xs leading-6 text-[#a99b81]">هر کد فقط یک‌بار قابل استفاده است و ۱۰ دقیقه اعتبار دارد.</p>
          </form>
        )}
        <div className="mt-8 border-t border-[#57472d]/70 pt-5 text-center"><Link href="/shop" className="text-sm font-semibold text-[#bdb29d] transition hover:text-[#e4bf76]">بازگشت به فروشگاه</Link></div>
      </section>
    </main>
  );
}
