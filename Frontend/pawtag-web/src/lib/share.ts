// Chia sẻ qua Web Share API, fallback copy link vào clipboard.
export async function shareOrCopy(data: { title?: string; text?: string; url?: string }): Promise<"shared" | "copied" | "cancelled" | "unsupported"> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(data);
      return "shared";
    } catch {
      return "cancelled";
    }
  }
  if (data.url && typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(data.url);
      return "copied";
    } catch {
      return "unsupported";
    }
  }
  return "unsupported";
}
