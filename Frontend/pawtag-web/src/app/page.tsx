import Link from "next/link";
import { PawPrint, Check, ArrowRight, Star } from "lucide-react";

const FEATURES = [
  { emoji: "🔲", title: "QR Pet Profile",     desc: "Instant scan reveals full pet info and emergency contacts", bg: "bg-[#F3F0FF]", arrow: "text-[#8B5CF6]", arrowBg: "bg-[#F3F0FF]" },
  { emoji: "📡", title: "NFC Pet Tag",        desc: "Tap-enabled smart tag works with any smartphone",           bg: "bg-[#EDF7F2]", arrow: "text-[#22C55E]", arrowBg: "bg-[#EDF7F2]" },
  { emoji: "📞", title: "Emergency Contact",  desc: "One-tap call and message to reach owner immediately",       bg: "bg-[#FFF0F0]", arrow: "text-[#FF7B35]", arrowBg: "bg-[#FFF7F0]" },
  { emoji: "🔔", title: "Scan Notifications", desc: "Get real-time alerts whenever your pet's tag is scanned",    bg: "bg-[#F3F0FF]", arrow: "text-[#8B5CF6]", arrowBg: "bg-[#F3F0FF]" },
  { emoji: "📋", title: "Pet Passport",       desc: "Complete health records, vaccinations, and ID on the go",   bg: "bg-[#FFF7E8]", arrow: "text-[#F59E0B]", arrowBg: "bg-[#FFF7E8]" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EEF2FB] to-[#F7F9FC] flex flex-col">

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl gradient-brand flex items-center justify-center shadow-cta">
            <PawPrint size={18} color="#fff" />
          </div>
          <span className="text-[20px] font-black text-[#1A2332] font-display">PawsTag</span>
        </div>
        <Link
          href="/login"
          className="px-5 py-2 rounded-full border-2 border-[#4A8FE8]/40 text-[#4A8FE8] text-[14px] font-bold font-display transition-all active:scale-95"
        >
          Sign In
        </Link>
      </header>

      <main className="flex-1 flex flex-col px-5 pb-10 max-w-md mx-auto w-full">

        {/* ── Hero image ── */}
        <div className="mt-4 mb-6 self-center">
          <div className="relative w-60 h-60">
            <img
              src="/images/corgi.jpg"
              alt="Happy corgi"
              className="w-full h-full rounded-full object-cover border-4 border-white shadow-xl"
            />
            {/* Verified check badge */}
            <div className="absolute top-2 -right-1 w-12 h-12 rounded-2xl bg-white shadow-card-md flex items-center justify-center">
              <div className="w-9 h-9 rounded-xl bg-[#22C55E] flex items-center justify-center">
                <Check size={20} color="#fff" strokeWidth={3} />
              </div>
            </div>
            {/* Tag badge */}
            <div className="absolute bottom-3 -right-1 w-16 h-16 rounded-full gradient-brand flex items-center justify-center shadow-cta text-[26px]">
              🏷️
            </div>
          </div>
        </div>

        {/* ── Title ── */}
        <h1 className="text-[40px] font-black text-[#1A2332] font-display text-center leading-[1.1]">
          Every Pet Deserves<br />
          <span className="text-[#4A8FE8]">a Way Home</span>
        </h1>
        <p className="text-[15px] text-[#6B7A8D] font-body text-center mt-4 leading-relaxed">
          Smart QR &amp; NFC pet tags that connect finders instantly to your contact info,
          pet profile, and emergency details.
        </p>

        {/* ── Stat chips ── */}
        <div className="flex items-center justify-center gap-2.5 mt-6 flex-wrap">
          <span className="px-4 py-2 rounded-full bg-white/70 text-[13px] font-bold text-[#4A8FE8] font-display shadow-card">10K+ Pets Safe</span>
          <span className="px-4 py-2 rounded-full bg-white/70 text-[13px] font-bold text-[#4A8FE8] font-display shadow-card">50K+ Scans</span>
          <span className="px-4 py-2 rounded-full bg-white/70 text-[13px] font-bold text-[#4A8FE8] font-display shadow-card flex items-center gap-1">
            <Star size={12} fill="#4A8FE8" className="text-[#4A8FE8]" /> 4.9/5
          </span>
        </div>

        {/* ── CTAs ── */}
        <Link
          href="/register"
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl gradient-brand text-white font-extrabold text-[17px] font-display shadow-cta transition-all active:scale-95 mt-7"
        >
          <PawPrint size={20} />
          Create Free Pet Tag
        </Link>
        <Link
          href="/login"
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-[#4A8FE8]/30 bg-white text-[#4A8FE8] font-extrabold text-[16px] font-display transition-all active:scale-95 mt-3"
        >
          🧮 See How It Works
        </Link>

        {/* ── Features ── */}
        <section className="mt-12">
          <h2 className="text-[26px] font-black text-[#1A2332] font-display mb-5">
            Everything you need 🐶
          </h2>
          <div className="flex flex-col gap-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-center gap-4 bg-white rounded-3xl px-4 py-4 shadow-card">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-[26px] ${f.bg}`}>
                  {f.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[17px] font-extrabold text-[#1A2332] font-display">{f.title}</p>
                  <p className="text-[13px] text-[#6B7A8D] font-body leading-snug mt-0.5">{f.desc}</p>
                </div>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${f.arrowBg}`}>
                  <ArrowRight size={16} className={f.arrow} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Testimonial ── */}
        <section className="mt-10">
          <div className="rounded-3xl p-5 bg-gradient-to-br from-[#EDF7F2] to-[#EEF5FF] shadow-card">
            <div className="flex items-start gap-3">
              <img
                src="https://images.unsplash.com/photo-1602241628512-1a66af5f3b00?w=120&q=80"
                alt="Reviewer"
                className="w-14 h-14 rounded-full object-cover border-2 border-white shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[17px] font-extrabold text-[#1A2332] font-display">Nguyen Thu Ha</p>
                <p className="text-[13px] text-[#6B7A8D] font-body">Bobby&apos;s Mom 💗</p>
              </div>
              <div className="flex gap-0.5 shrink-0 pt-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="text-[#F59E0B]" fill="#F59E0B" />
                ))}
              </div>
            </div>
            <p className="text-[15px] text-[#1A2332] font-body leading-relaxed mt-4">
              &ldquo;PawsTag saved Bobby when he got lost at the park. A kind stranger scanned
              his tag and called me immediately. Best investment ever!&rdquo;
            </p>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <Link
          href="/register"
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl gradient-premium text-white font-extrabold text-[18px] font-display shadow-cta transition-all active:scale-95 mt-8"
        >
          Get Started — It&apos;s Free 🚀
        </Link>

        <p className="text-center text-[12px] text-[#9BAABB] font-body mt-6">
          PawsTag · Every pet deserves a way home 🐾
        </p>
      </main>
    </div>
  );
}
