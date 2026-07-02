/**
 * Dịch nội dung thông báo (do backend sinh bằng tiếng Anh) theo MẪU.
 * Tên riêng (pet/người) và địa điểm được giữ nguyên qua placeholder.
 * Mẫu nào không khớp → trả về nguyên văn (an toàn).
 */

type T = (key: string) => string;
const fill = (s: string, vars: Record<string, string>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);

/** Dịch tiêu đề thông báo. */
export function localizeNotifTitle(title: string, t: T): string {
  let m: RegExpExecArray | null;
  if ((m = /^🎉 (.+) may have been found!$/.exec(title))) return fill(t("ntf.t.found"), { name: m[1] });
  if ((m = /^(.+)'s tag was scanned!$/.exec(title))) return fill(t("ntf.t.tagScanned"), { name: m[1] });
  if ((m = /^(.+) was scanned!$/.exec(title))) return fill(t("ntf.t.scanned"), { name: m[1] });
  if ((m = /^(.+) scanned again$/.exec(title))) return fill(t("ntf.t.scannedAgain"), { name: m[1] });
  if ((m = /^(.+)'s NFC was tapped!$/.exec(title))) return fill(t("ntf.t.nfcTapped"), { name: m[1] });
  if (title === "🔔 Daily Summary") return t("ntf.t.dailySummary");
  if (title === "🐾 Profile Tip") return t("ntf.t.profileTip");
  if (title === "NFC Tag Delivered!") return t("ntf.t.delivered");
  if (title === "Location shared") return t("ntf.t.locShared");
  return title;
}

/** Dịch nội dung thông báo. */
export function localizeNotifBody(body: string, t: T): string {
  let m: RegExpExecArray | null;
  if ((m = /^Someone scanned (.+)'s QR tag at (.+)$/.exec(body))) return fill(t("ntf.b.scannedAt"), { name: m[1], loc: m[2] });
  if ((m = /^Tag scanned by (.+) at (.+)$/.exec(body))) return fill(t("ntf.b.scannedBy"), { by: m[1], loc: m[2] });
  if ((m = /^(.+) received (\d+) scans today across (\d+) different locations\.$/.exec(body))) return fill(t("ntf.b.summary"), { name: m[1], n: m[2], m: m[3] });
  if ((m = /^(.+)'s NFC tag was tapped at (.+) yesterday$/.exec(body))) return fill(t("ntf.b.nfcTappedAt"), { name: m[1], loc: m[2] });
  if ((m = /^Add (.+)'s vaccination record to complete .* badge\.$/.exec(body))) return fill(t("ntf.b.tip"), { name: m[1] });
  if (body === "Your PawsTag NFC sticker order has been delivered. Tap to program it now.") return t("ntf.b.delivered");
  if ((m = /^(.+)'s QR code was scanned at (.+)$/.exec(body))) return fill(t("ntf.b.qrScannedAt"), { name: m[1], loc: m[2] });
  if ((m = /^Someone scanned (.+)'s tag\.$/.exec(body))) return fill(t("ntf.b.someoneScanned"), { name: m[1] });
  if ((m = /^Someone reported finding (.+) and shared their location\.$/.exec(body))) return fill(t("ntf.b.foundLoc"), { name: m[1] });
  if ((m = /^Someone reported finding (.+)\.$/.exec(body))) return fill(t("ntf.b.found"), { name: m[1] });
  if ((m = /^A finder shared their location for (.+)\.$/.exec(body))) return fill(t("ntf.b.locFor"), { name: m[1] });
  return body;
}

/** Dịch thời gian tương đối ("2 min ago" → "2 phút trước"). Ngày tuyệt đối giữ nguyên. */
export function localizeRelativeTime(time: string, t: T): string {
  if (!time) return time;
  if (time === "just now") return t("ntf.time.justNow");
  if (time === "Yesterday") return t("ntf.time.yesterday");
  let m: RegExpExecArray | null;
  if ((m = /^(\d+) min ago$/.exec(time))) return fill(t("ntf.time.min"), { n: m[1] });
  if ((m = /^(\d+) hours? ago$/.exec(time))) return fill(t("ntf.time.hours"), { n: m[1] });
  if ((m = /^(\d+) days ago$/.exec(time))) return fill(t("ntf.time.days"), { n: m[1] });
  return time; // ngày tuyệt đối "Jan 5, 14:30"
}
