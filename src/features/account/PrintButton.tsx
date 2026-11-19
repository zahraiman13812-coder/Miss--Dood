"use client";
import { Printer } from "lucide-react";
export default function PrintButton() {
  return <button type="button" onClick={() => window.print()}
    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#c5a25f] bg-[#372b19] px-5 text-sm font-bold text-[#f6dfa9] hover:bg-[#4d3b20]">
    <Printer size={17} /> چاپ یا ذخیره PDF
  </button>;
}
