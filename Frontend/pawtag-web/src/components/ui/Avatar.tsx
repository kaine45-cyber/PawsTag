// Avatar — hiện ảnh nếu có, ngược lại hiện chữ cái đầu tên (không phụ thuộc mạng).

function initials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function Avatar({
  src,
  name,
  className = "",
  textCls = "text-[16px]",
}: {
  src?: string | null;
  name?: string | null;
  className?: string;
  textCls?: string;
}) {
  if (src) {
    return <img src={src} alt={name ?? "Avatar"} className={`object-cover ${className}`} />;
  }
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-[#4A8FE8] to-[#52C97F] ${className}`}>
      <span className={`text-white font-black font-display ${textCls}`}>{initials(name)}</span>
    </div>
  );
}
