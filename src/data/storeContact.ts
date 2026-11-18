// آدرس و شماره‌های عمومی فروشگاه را اینجا وارد کنید؛ فقط شماره واقعی فروشگاه را قرار دهید.
// نمونه قالب: phones: ["02112345678", "09121234567"]
export const storeContact = {
  address: "خیابان انقلاب، پل چوبی، سپاه شمالی، پلاک ۶۵",
  phones: ["", ""],
};

export function dialLink(phone: string) {
  const ascii = phone.replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 1632));
  return "tel:" + ascii.replace(/[^+\d]/g, "");
}
