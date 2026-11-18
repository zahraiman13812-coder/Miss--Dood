export const categories = [
  ["cigarettes", "سیگار"], ["tobacco", "تنباکو"], ["charcoal", "ذغال"],
  ["lighters", "فندک"], ["pods", "پاد"], ["e-liquid", "جویس"],
  ["nic-salt", "سالت"], ["hookah", "قلیون"], ["gas", "گاز"], ["fuel", "بنزین"],
] as const;

/** برندهای زیرمنوی هر دسته؛ slugها با فیلتر برند در کاتالوگ هماهنگ هستند. */
export const categoryBrands = {
  cigarettes: [
    ["winston", "وینستون"], ["kent", "کنت"], ["bahman", "بهمن"], ["mond", "موند"],
    ["cavallo", "کاوالو"], ["marlboro", "مارلبرو"], ["esse", "اسی"], ["milano", "میلانو"],
    ["more", "مور"], ["captain-black", "کاپیتان بلک"], ["senator", "سناتور"],
    ["gtm", "جی تی ام"], ["chapman", "چاپمن"],
  ],
  tobacco: [
    ["mazaya", "مزایا"], ["bang-bang", "بنگ بنگ"], ["adalya", "ادالیا"], ["ostooreh", "اسطوره"],
    ["sharq", "شرق"], ["al-waha", "الواحه"], ["al-fakher", "الفاخر"], ["al-nakhla", "النخل"],
    ["jelayer", "جلایر"], ["mahmood", "محمود"], ["ajman", "اجمان"], ["bazooka", "بازهوکا"], ["fuel", "فیول"],
  ],
  charcoal: [
    ["mia", "میا"], ["coco-baba", "کوکوبابا"], ["cocokhalifeh", "کوکوخلیفه"], ["cocoyaya", "کوکویایا"],
  ],
  pods: [["vozol", "وُزُل"], ["nasli", "نسلی"]],
  "nic-salt": [["vigad", "ویگاد"]],
  "e-liquid": [["nasli", "نسلی"]],
  hookah: [["korno", "کرنو"], ["khalil-mamoon", "خلیل مامون"]],
  gas: [["zippo", "زیپو"]],
} as const;

export const pages = [["/", "صفحه اصلی"], ["/contact", "تماس با ما"], ["/about", "درباره ما"], ["/help", "راهنمای خرید"]] as const;
