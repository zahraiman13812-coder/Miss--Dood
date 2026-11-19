"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Clock3, CreditCard, Heart, LifeBuoy, LogOut, Mail, MapPin,
  Package, RefreshCw, ShieldCheck, Sparkles, Ticket, Truck, User2
} from "lucide-react";

type User = { id: string; email: string; full_name: string; role: string };
type OrderItem = { name: string; quantity: number; amount: number };
type Order = {
  id: string;
  status: string;
  date: string;
  subtotal: number;
  total: number;
  shipping?: { city?: string; fee?: number; days?: string };
  items?: OrderItem[];
};
type TicketInfo = { id: string; subject: string; status: "open" | "closed" | "answered"; created_at: string; messages?: unknown[] };

const panel =
  "rounded-[28px] border border-[#7e6538]/60 bg-gradient-to-br from-[#16130f] via-[#0f0d0a] to-[#0a0907] shadow-[0_18px_45px_rgba(0,0,0,.35)]";
const soft =
  "rounded-2xl border border-[#56462a]/75 bg-[#0d0b09]/85 text-[#f3e8cf] shadow-[inset_0_1px_0_rgba(255,255,255,.03)]";
const gold =
  "text-[#e6c47b]";
const muted = "text-[#b7a98b]";
const statusMap: Record<string, { label: string; tone: string; icon: typeof Clock3 }> = {
  received: { label: "دریافت شد", tone: "bg-[#503c16]/45 text-[#f5d487] border-[#a27f3e]/50", icon: Clock3 },
  processing: { label: "در حال پردازش", tone: "bg-[#3d2f10]/45 text-[#f4d186] border-[#9a7a39]/50", icon: RefreshCw },
  shipped: { label: "ارسال شده", tone: "bg-[#15304d]/45 text-[#92c2ff] border-[#2e5d92]/50", icon: Truck },
  delivered: { label: "تحویل شده", tone: "bg-[#18341e]/45 text-[#9ee2a4] border-[#2b7240]/50", icon: ShieldCheck },
  cancelled: { label: "لغو شده", tone: "bg-[#421b1b]/45 text-[#f0aaaa] border-[#814040]/50", icon: Ticket },
  open: { label: "باز", tone: "bg-[#503c16]/45 text-[#f5d487] border-[#a27f3e]/50", icon: Ticket },
  answered: { label: "پاسخ داده شد", tone: "bg-[#17311b]/45 text-[#a7e0b2] border-[#2b7240]/50", icon: LifeBuoy },
  closed: { label: "بسته", tone: "bg-[#1f2430]/55 text-[#c6d0e1] border-[#4c566b]/55", icon: Ticket },
};
function fmtMoney(value: number | undefined) {
  return typeof value === "number"
    ? `${value.toLocaleString("fa-IR")} تومان`
    : "—";
}
function fmtDate(value: string | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
}
function statusBadge(status: string) {
  const current = statusMap[status] ?? { label: status, tone: "bg-black/25 text-[#eadcc0] border-[#705d36]/55", icon: Clock3 };
  const Icon = current.icon;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${current.tone}`}>
      <Icon size={14} />
      {current.label}
    </span>
  );
}
function StatCard({
  title, value, hint, icon: Icon,
}: { title: string; value: string; hint: string; icon: typeof Package }) {
  return (
    <div className={`${soft} p-4 sm:p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-bold tracking-[.18em] ${gold}`}>{title}</p>
          <p className="mt-2 text-2xl font-black text-[#f7efdf] sm:text-[28px]">{value}</p>
          <p className={`mt-2 text-xs leading-6 ${muted}`}>{hint}</p>
        </div>
        <span className="grid size-11 place-items-center rounded-2xl border border-[#7e6538]/60 bg-[#d2a961]/12 text-[#e6c47b]">
          <Icon size={20} />
        </span>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [tickets, setTickets] = useState<TicketInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function refresh() {
    setNotice("");
    const authResponse = await fetch("/api/auth", { cache: "no-store" });
    const authData = await authResponse.json().catch(() => null);
    if (!authResponse.ok || !authData?.user) {
      router.replace("/login");
      return;
    }
    setUser(authData.user);
    const [ordersResponse, favoritesResponse, supportResponse] = await Promise.allSettled([
      fetch("/api/orders", { cache: "no-store" }),
      fetch("/api/favorites", { cache: "no-store" }),
      fetch("/api/support", { cache: "no-store" }),
    ]);

    if (ordersResponse.status === "fulfilled" && ordersResponse.value.ok) {
      const data = await ordersResponse.value.json().catch(() => ({ orders: [] }));
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } else setOrders([]);

    if (favoritesResponse.status === "fulfilled" && favoritesResponse.value.ok) {
      const data = await favoritesResponse.value.json().catch(() => ({ favorites: [] }));
      setFavorites(Array.isArray(data.favorites) ? data.favorites : []);
    } else setFavorites([]);

    if (supportResponse.status === "fulfilled" && supportResponse.value.ok) {
      const data = await supportResponse.value.json().catch(() => ({ tickets: [] }));
      setTickets(Array.isArray(data.tickets) ? data.tickets : []);
    } else setTickets([]);
  }

  useEffect(() => {
    refresh().catch(() => setNotice("اطلاعات پنل با خطا روبه‌رو شد. دوباره تلاش کنید.")).finally(() => setLoading(false));
  }, []);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth", { method: "DELETE" });
      router.replace("/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const openTickets = tickets.filter((ticket) => ticket.status !== "closed").length;
  const pendingOrders = orders.filter((order) => ["received", "processing", "shipped"].includes(order.status)).length;
  const latestOrders = useMemo(() => orders.slice(0, 3), [orders]);
  const latestTickets = useMemo(() => tickets.slice(0, 2), [tickets]);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className={`${panel} p-8 text-center ${gold}`}>در حال بارگذاری پنل کاربری…</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <section className={`${panel} overflow-hidden`}>
        <div className="relative isolate p-6 sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,170,87,.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(212,170,87,.12),transparent_28%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid size-16 place-items-center rounded-[22px] border border-[#8d6f39]/65 bg-[#d2a961]/10 text-[#e6c47b] shadow-[0_0_35px_rgba(210,169,91,.12)]">
                <User2 size={30} />
              </span>
              <div>
                <div className={`mb-2 flex items-center gap-2 text-xs font-bold tracking-[.25em] ${gold}`}>
                  <Sparkles size={14} /> MISS DOOD ACCOUNT
                </div>
                <h1 className="text-2xl font-black text-[#faf2e2] sm:text-3xl">
                  {user?.full_name || "کاربر میس دود"}
                </h1>
                <div className={`mt-3 flex flex-wrap items-center gap-3 text-sm ${muted}`}>
                  <span className="inline-flex items-center gap-2"><Mail size={16} /> {user?.email}</span>
                  {user?.role === "admin" && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#8d6f39]/60 bg-[#d2a961]/10 px-3 py-1 text-xs font-bold text-[#e8c784]">
                      <ShieldCheck size={14} /> مدیر فروشگاه
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button onClick={() => refresh().catch(() => setNotice("به‌روزرسانی ناموفق بود."))} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#71592f] bg-[#120f0b] px-4 font-bold text-[#f4e1b6] transition hover:border-[#d6b36c] hover:text-white">
                <RefreshCw size={18} /> به‌روزرسانی پنل
              </button>
              <button disabled={busy} onClick={logout} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#7c3a3a] bg-[#2a1313] px-4 font-bold text-[#f3b2b2] transition hover:border-[#cc6d6d] hover:text-white disabled:opacity-60">
                <LogOut size={18} /> خروج امن
              </button>
            </div>
          </div>
          {notice && (
            <p className="relative mt-5 rounded-2xl border border-[#7e6538]/55 bg-[#0e0c09]/75 px-4 py-3 text-sm text-[#f3deae]">
              {notice}
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="سفارش‌ها" value={orders.length.toLocaleString("fa-IR")} hint="تمام سفارش‌های ثبت‌شده شما" icon={Package} />
        <StatCard title="در جریان" value={pendingOrders.toLocaleString("fa-IR")} hint="سفارش‌هایی که هنوز نهایی نشده‌اند" icon={Truck} />
        <StatCard title="علاقه‌مندی‌ها" value={favorites.length.toLocaleString("fa-IR")} hint="محصولات ذخیره‌شده برای خرید بعدی" icon={Heart} />
        <StatCard title="پشتیبانی" value={openTickets.toLocaleString("fa-IR")} hint="گفت‌وگوهای باز و پاسخ‌داده‌نشده" icon={LifeBuoy} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_.95fr]">
        <div className={`${panel} p-5 sm:p-6`}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-[#f8efdf]">آخرین سفارش‌ها</h2>
              <p className={`mt-1 text-sm ${muted}`}>مشاهده سریع وضعیت سفارش‌های اخیر شما</p>
            </div>
            <Link href="/orders" className={`inline-flex items-center gap-2 text-sm font-bold ${gold} hover:text-[#f5deac]`}>
              مشاهده همه سفارش‌ها <ArrowLeft size={16} />
            </Link>
          </div>
          {latestOrders.length ? (
            <div className="space-y-4">
              {latestOrders.map((order) => (
                <article key={order.id} className={`${soft} p-4 sm:p-5`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-[#f7efdf]">سفارش #{order.id.slice(0, 8)}</h3>
                        {statusBadge(order.status)}
                      </div>
                      <p className={`text-xs leading-6 ${muted}`}>{fmtDate(order.date)}</p>
                      <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-sm ${muted}`}>
                        <span className="inline-flex items-center gap-2"><CreditCard size={15} /> {fmtMoney(order.total)}</span>
                        <span className="inline-flex items-center gap-2"><MapPin size={15} /> {order.shipping?.city || "—"}</span>
                      </div>
                    </div>
                    <div className="sm:text-left">
                      <p className={`text-xs font-bold tracking-[.18em] ${gold}`}>تعداد آیتم</p>
                      <p className="mt-1 text-xl font-black text-[#f7efdf]">{(order.items?.length ?? 0).toLocaleString("fa-IR")}</p>
                    </div>
                  </div>
                  {(order.items?.length ?? 0) > 0 && (
                    <div className="mt-4 rounded-2xl border border-[#4e4127]/65 bg-black/20 px-4 py-3 text-sm text-[#d8ccb2]">
                      {order.items!.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 py-1">
                          <span>{item.name}</span>
                          <span className="text-xs">{item.quantity.toLocaleString("fa-IR")} عدد</span>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className={`${soft} p-6 text-center`}>
              <Package className="mx-auto mb-3 text-[#d2a961]" size={28} />
              <p className="font-bold text-[#f5ecdb]">هنوز سفارشی ثبت نکرده‌اید.</p>
              <Link href="/shop" className={`mt-4 inline-flex items-center gap-2 text-sm font-bold ${gold} hover:text-[#f5deac]`}>
                شروع خرید <ArrowLeft size={16} />
              </Link>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <section className={`${panel} p-5 sm:p-6`}>
            <h2 className="text-xl font-black text-[#f8efdf]">میانبرهای کاربردی</h2>
            <div className="mt-5 grid gap-3">
              {[
                { href: "/shop", title: "ادامه خرید", hint: "مشاهده محصولات و دسته‌بندی‌ها", icon: Package },
                { href: "/favorites", title: "علاقه‌مندی‌ها", hint: "کالاهای ذخیره‌شده برای بعد", icon: Heart },
                { href: "/orders", title: "پیگیری سفارش", hint: "بررسی وضعیت تحویل و جزئیات", icon: Truck },
                { href: "/contact", title: "تماس و پشتیبانی", hint: "شماره تماس و راه‌های ارتباطی", icon: LifeBuoy },
              ].map(({ href, title, hint, icon: Icon }) => (
                <Link key={href} href={href} className={`${soft} group flex items-center justify-between gap-3 p-4 transition hover:border-[#d6b36c]`}>
                  <span className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-2xl border border-[#7e6538]/60 bg-[#d2a961]/10 text-[#e6c47b]">
                      <Icon size={19} />
                    </span>
                    <span>
                      <span className="block font-extrabold text-[#f7efdf]">{title}</span>
                      <span className={`block text-xs ${muted}`}>{hint}</span>
                    </span>
                  </span>
                  <ArrowLeft size={18} className="text-[#d8c39a] transition group-hover:-translate-x-1 group-hover:text-[#f3ddab]" />
                </Link>
              ))}
            </div>
          </section>

          <section className={`${panel} p-5 sm:p-6`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-[#f8efdf]">پشتیبانی اخیر</h2>
              <Link href="/contact" className={`text-sm font-bold ${gold} hover:text-[#f5deac]`}>
                تماس با ما
              </Link>
            </div>
            {latestTickets.length ? (
              <div className="space-y-3">
                {latestTickets.map((ticket) => (
                  <article key={ticket.id} className={`${soft} p-4`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-[#f7efdf]">{ticket.subject || "درخواست پشتیبانی"}</p>
                        <p className={`mt-1 text-xs ${muted}`}>{fmtDate(ticket.created_at)}</p>
                      </div>
                      {statusBadge(ticket.status)}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className={`${soft} p-5 text-sm ${muted}`}>درخواست پشتیبانی فعالی ندارید.</div>
            )}
          </section>

          <section className={`${panel} p-5 sm:p-6`}>
            <h2 className="text-xl font-black text-[#f8efdf]">اطلاعات حساب</h2>
            <div className="mt-4 space-y-3">
              <div className={`${soft} flex items-center justify-between gap-3 p-4`}>
                <span className={muted}>نام و نام خانوادگی</span>
                <strong className="text-[#f7efdf]">{user?.full_name || "ثبت نشده"}</strong>
              </div>
              <div className={`${soft} flex items-center justify-between gap-3 p-4`} dir="ltr">
                <span className={muted}>Email</span>
                <strong className="truncate text-[#f7efdf]">{user?.email || "—"}</strong>
              </div>
              <div className={`${soft} flex items-center justify-between gap-3 p-4`}>
                <span className={muted}>سطح دسترسی</span>
                <strong className="text-[#f7efdf]">{user?.role === "admin" ? "مدیر" : "مشتری"}</strong>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
