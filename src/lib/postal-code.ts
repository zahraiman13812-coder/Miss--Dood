/** Keep only decimal digits (ASCII, Persian and Arabic-Indic) in postal code inputs. */
export function postalDigits(value: string): string {
  return value.replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 1632))
    .replace(/[^0-9]/g, "").slice(0, 10);
}
