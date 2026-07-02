import type { Lang } from "@/i18n/messages";

/**
 * Format tuổi từ tổng số tháng (backend trả locale-neutral) sang chuỗi hiển thị theo ngôn ngữ.
 * VI: "2 tuổi" / "8 tháng tuổi" / "Sơ sinh"   ·   EN: "2 years old" / "8 months old" / "Newborn"
 */
export function formatAge(ageMonths: number | null | undefined, lang: Lang): string {
  if (ageMonths == null || ageMonths < 0) return "—";
  if (ageMonths < 1) return lang === "vi" ? "Sơ sinh" : "Newborn";
  const years = Math.floor(ageMonths / 12);
  const months = ageMonths % 12;
  if (years >= 1) return lang === "vi" ? `${years} tuổi` : `${years} year${years > 1 ? "s" : ""} old`;
  return lang === "vi" ? `${months} tháng tuổi` : `${months} month${months > 1 ? "s" : ""} old`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
export function formatPhone(phone: string): string {
  return phone.replace(/(\+84|0)(\d{3})(\d{3})(\d{3,4})/, (_, p, a, b, c) => `${p}${a} ${b} ${c}`);
}
