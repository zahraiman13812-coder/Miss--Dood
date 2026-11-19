export default function AdminLoading() {
  return (
    <main className="min-h-[70vh] bg-[#0b0908] px-4 py-10 text-[#f2d398]" aria-busy="true" role="status">
      <div className="mx-auto max-w-7xl animate-pulse space-y-5">
        <div className="h-28 rounded-[24px] border border-[#5c452d] bg-[#1b1510]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-36 rounded-[24px] border border-[#5c452d] bg-[#1b1510]" />)}
        </div>
        <div className="h-72 rounded-[24px] border border-[#5c452d] bg-[#1b1510]" />
      </div>
      <p className="sr-only">در حال بارگذاری پنل مدیریت میس دود...</p>
    </main>
  );
}
