"use client";
import { type ReactNode } from "react";
import { SlidersHorizontal, ChevronRight } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/core/accordion";
import styles from "./FilterPanel.module.css";

export default function FilterPanel({ children }: { children: ReactNode }) {
  return <aside className="overflow-hidden rounded-[26px] border border-[#78542f] bg-gradient-to-br from-[#211411] via-[#15110d] to-[#0f0c0b] p-4 shadow-[0_14px_35px_rgba(0,0,0,.25)] lg:sticky lg:top-32 lg:p-5">
    <div className="hidden items-center gap-2 border-b border-[#58402e] pb-4 text-lg font-black text-[#f0d49f] lg:flex"><SlidersHorizontal size={20}/> فیلتر محصولات</div>
    <Accordion transition={{ type: "spring", stiffness: 120, damping: 20 }} variants={{ expanded: { opacity: 1, scale: 1 }, collapsed: { opacity: 0, scale: .7 } }}>
      <AccordionItem value="filters" className={styles.item}>
        <AccordionTrigger className="flex min-h-12 w-full items-center gap-2 text-right font-black text-[#f0d49f] lg:hidden"><SlidersHorizontal size={19}/> جست‌وجو و فیلترها <ChevronRight data-accordion-chevron size={17} className="ms-auto"/></AccordionTrigger>
        <AccordionContent desktopVisible className={`${styles.content} origin-right`}><div className="pt-4 lg:pt-0">{children}</div></AccordionContent>
      </AccordionItem>
    </Accordion>
  </aside>;
}
