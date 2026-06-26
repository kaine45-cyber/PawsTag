// iPhone 15 status bar — shown inside PhoneFrame on desktop only.
// Displays Dynamic Island, time, WiFi and battery icons.

export default function StatusBar() {
  return (
    <div className="relative h-[54px] w-full shrink-0 overflow-hidden bg-[#F7F9FC]">
      {/* ── Dynamic Island ── */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bg-[#1C1C1C]"
        style={{ top: 10, width: 120, height: 35, borderRadius: 22 }}
      />

      {/* ── Left: time ── */}
      <span
        className="absolute bottom-[10px] left-[24px] text-[15px] font-bold text-[#1A2332] font-display select-none"
      >
        9:41
      </span>

      {/* ── Right: status icons ── */}
      <div className="absolute bottom-[10px] right-[20px] flex items-center gap-[5px]">
        {/* Cellular bars */}
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
          <rect x="0"  y="7"  width="3" height="5"  rx="1" fill="#1A2332" />
          <rect x="4.5" y="5" width="3" height="7"  rx="1" fill="#1A2332" />
          <rect x="9"  y="3"  width="3" height="9"  rx="1" fill="#1A2332" />
          <rect x="13.5" y="0" width="3" height="12" rx="1" fill="#1A2332" />
        </svg>

        {/* WiFi */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path d="M8 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" fill="#1A2332" />
          <path d="M4.2 7.3a5.3 5.3 0 0 1 7.6 0" stroke="#1A2332" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <path d="M1.4 4.5a9.3 9.3 0 0 1 13.2 0" stroke="#1A2332" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </svg>

        {/* Battery */}
        <div className="flex items-center gap-[1px]">
          <div className="relative w-[24px] h-[12px] rounded-[3px] border-[1.5px] border-[#1A2332]">
            <div className="absolute inset-[1.5px] right-[2px] rounded-[1.5px] bg-[#1A2332]" style={{ width: "80%" }} />
          </div>
          <div className="w-[2px] h-[5px] rounded-r-sm bg-[#1A2332]" />
        </div>
      </div>
    </div>
  );
}
