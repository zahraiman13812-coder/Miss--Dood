import { ChevronRight } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/core/accordion";

const questions = [
  {
    title: "مشخصات فندک را چطور بخوانم؟",
    answer: "برای مقایسهٔ دو فندک، اول نوع سوخت و قابلیت پرکردن مجدد را در مشخصات همان مدل ببین. بعد ابعاد و وزن را کنار هم بگذار تا اندازهٔ واقعی هر مدل برایت روشن شود.",
  },
  {
    title: "کدام سوخت با فندکم سازگار است؟",
    answer: "نام و شمارهٔ مدل را روی بدنه یا جعبه پیدا کن. نوع سوخت درج‌شده در دفترچهٔ همان مدل یا مشخصات رسمی سازنده را با برچسب سوخت تطبیق بده. اگر مدل مشخص نیست، پیش از خرید از فروشنده دربارهٔ سازگاری بپرس.",
  },
  {
    title: "از کجا بدانم چه وسایلی همراه قلیون است؟",
    answer: "فهرست اقلام همراه همان مدل را روی بسته یا در توضیحات کالا بخوان. شلنگ، سری، سینی و انبر را جداگانه بررسی کن. اگر وسیله‌ای فقط در عکس دیده می‌شود، از فروشنده بپرس که داخل بسته هم هست یا جدا فروخته می‌شود.",
  },
];

export default function BuyingGuide() {
  return (
    <section aria-labelledby="guide-title" className="mx-auto max-w-7xl px-4 pb-12 sm:px-8">
      <div className="grid gap-6 rounded-2xl border border-line bg-header p-5 sm:p-8 lg:grid-cols-[1fr_2fr]">
        <h2 id="guide-title" className="self-start border-s-2 border-accent ps-4 text-xl font-bold text-content sm:text-2xl">
          قبل از انتخاب
        </h2>
        <Accordion className="divide-y divide-line" transition={{ type: "spring", stiffness: 120, damping: 20 }} variants={{ expanded: { opacity: 1, scale: 1 }, collapsed: { opacity: 0, scale: .7 } }}>
          {questions.map(({ title, answer }) => (
            <AccordionItem key={title} value={title}>
              <AccordionTrigger className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-sm py-3 text-start font-semibold text-content hover:text-accent [&::-webkit-details-marker]:hidden">
                {title}
                <ChevronRight data-accordion-chevron size={19} aria-hidden="true" className="shrink-0 text-accent" />
              </AccordionTrigger>
              <AccordionContent className="origin-right"><p className="max-w-prose pb-5 text-sm leading-8 text-muted">{answer}</p></AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
