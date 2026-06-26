export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
export function formatPhone(phone: string): string {
  return phone.replace(/(\+84|0)(\d{3})(\d{3})(\d{3,4})/, (_, p, a, b, c) => `${p}${a} ${b} ${c}`);
}
