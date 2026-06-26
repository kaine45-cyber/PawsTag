"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Check, ArrowRight } from "lucide-react";
import { authService } from "@/services/auth.service";

const CORGI = "/images/corgi.jpg";

const PET_TYPES = [
  { key: "dog",   emoji: "🐕", label: "Dog"   },
  { key: "cat",   emoji: "🐈", label: "Cat"   },
  { key: "other", emoji: "🐰", label: "Other" },
];

const PLAN = [
  "1 pet profile & QR tag",
  "Emergency contact page",
  "Scan notifications",
  "Basic pet passport",
  "Community lost pet alerts",
];

const NEXT_STEPS = [
  "Add your pet's photo & info",
  "Set up emergency contacts",
  "Get your QR & NFC tag",
  "Attach tag to pet's collar",
];

function pwStrength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Za-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s; // 0..4
}

const inputClass =
  "w-full h-[52px] px-[18px] rounded-2xl bg-[#F0F4FA] border border-[rgba(74,143,232,0.12)] text-[15px] text-[#1A2332] font-body outline-none focus:border-[#4A8FE8] focus:bg-white transition-all placeholder:text-[#9BAABB]";

export default function RegisterPage() {
  const [step, setStep] = useState(1);

  // Step 1
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [phone,    setPhone]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [terms,    setTerms]    = useState(false);

  // Step 2
  const [petType,  setPetType]  = useState("dog");
  const [petCount, setPetCount] = useState("1");

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const strength = pwStrength(password);
  const strong = strength >= 3;

  function goToStep2(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) { setError("Please fill in all fields."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (!terms) { setError("Please accept the Terms of Service."); return; }
    setError("");
    setStep(2);
  }

  async function createAccount() {
    setError("");
    setLoading(true);
    try {
      const { token } = await authService.register(name, email, password, phone || undefined);
      localStorage.setItem("pawtag_token", token);
      setStep(3);
    } catch {
      setError("Registration failed. Email may already be in use.");
      setStep(1);
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3: success ──
  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#EFF3FB] to-[#F7F9FC] flex flex-col px-5 pt-8 pb-8">
        <div className="max-w-sm mx-auto w-full flex flex-col items-center">
          <div className="relative w-[104px] h-[104px] mb-3">
            <img src={CORGI} alt="Pet" className="w-full h-full rounded-[30px] object-cover border-4 border-white shadow-xl" />
            <div className="absolute -bottom-2 -right-2 w-11 h-11 rounded-full bg-[#22C55E] flex items-center justify-center shadow-lg border-2 border-white">
              <Check size={20} color="#fff" strokeWidth={3} />
            </div>
          </div>
          <div className="flex gap-3 text-[22px] mb-2">🐾 ✨ 🏷️</div>
          <h1 className="text-[30px] font-black text-[#1A2332] font-display">Account Created!</h1>
          <p className="text-[15px] text-[#6B7A8D] font-body text-center mt-2 leading-relaxed">
            Welcome to PawsTag! Create your first pet profile to get a smart QR + NFC tag.
          </p>

          <div className="w-full flex flex-col gap-3 mt-6">
            {NEXT_STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#EEF2FB] rounded-2xl px-4 py-3.5">
                <span className="w-9 h-9 rounded-full border-2 border-[#4A8FE8] flex items-center justify-center text-[14px] font-bold text-[#4A8FE8] font-display shrink-0">
                  {i + 1}
                </span>
                <p className="text-[15px] text-[#1A2332] font-body">{s}</p>
              </div>
            ))}
          </div>

          <div className="w-full mt-5 rounded-2xl bg-[#EDF7F2] border border-[#22C55E]/20 px-4 py-3 text-center">
            <p className="text-[13px] font-bold text-[#2A6B47] font-display">🎁 First tag ships FREE when you order within 24 hours!</p>
          </div>

          <button
            type="button"
            onClick={() => { window.location.href = "/pet/create"; }}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl gradient-premium text-white font-extrabold text-[17px] font-display shadow-cta transition-all active:scale-95 mt-6"
          >
            🚀 Create My First Pet Tag!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EFF3FB] to-[#F7F9FC] flex flex-col">

      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-4 pb-4 bg-white/60">
        {step === 1 ? (
          <Link href="/" aria-label="Go back" className="w-11 h-11 rounded-full bg-[#EEF2FB] flex items-center justify-center transition-all active:scale-90">
            <ArrowLeft size={18} className="text-[#1A2332]" />
          </Link>
        ) : (
          <button type="button" onClick={() => setStep(1)} aria-label="Go back" className="w-11 h-11 rounded-full bg-[#EEF2FB] flex items-center justify-center transition-all active:scale-90">
            <ArrowLeft size={18} className="text-[#1A2332]" />
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-[22px] font-black text-[#1A2332] font-display leading-none">Create Account</h1>
          <p className="text-[13px] text-[#9BAABB] font-body mt-1">Step {step} of 3</p>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <span key={s} className={`h-1.5 rounded-full transition-all ${s <= step ? "w-6 bg-[#4A8FE8]" : "w-3 bg-[#D8DEE9]"}`} />
          ))}
        </div>
      </header>

      <main className="flex-1 flex flex-col px-5 pb-10 max-w-sm mx-auto w-full">

        {step === 1 && (
          <form onSubmit={goToStep2} className="flex flex-col">
            {/* Hero */}
            <div className="flex flex-col items-center mt-5 mb-5">
              <div className="relative w-[104px] h-[104px] mb-4">
                <img src={CORGI} alt="Pet" className="w-full h-full rounded-[30px] object-cover border-4 border-white shadow-xl" />
                <span className="absolute -bottom-1 -right-1 text-[28px]">🎉</span>
              </div>
              <h2 className="text-[30px] font-black text-[#1A2332] font-display text-center leading-tight">Join 10,000+ pet families!</h2>
              <p className="text-[15px] text-[#6B7A8D] font-body mt-2">Create your free PawsTag account</p>
            </div>

            {/* Social */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button type="button" onClick={() => setError("Social sign-up is coming soon.")} className="flex items-center justify-center gap-2 h-[52px] rounded-2xl border border-[#EEF2F7] bg-white transition-all active:scale-95">
                <span className="text-[18px]">🌐</span>
                <span className="text-[13px] font-semibold text-[#1A2332] font-body">Continue with Google</span>
              </button>
              <button type="button" onClick={() => setError("Social sign-up is coming soon.")} className="flex items-center justify-center gap-2 h-[52px] rounded-2xl border border-[#EEF2F7] bg-white transition-all active:scale-95">
                <span className="text-[18px]">📘</span>
                <span className="text-[13px] font-semibold text-[#1A2332] font-body">Continue with FB</span>
              </button>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-[#E1E7F0]" />
              <span className="text-[13px] text-[#9BAABB] font-body">or with email</span>
              <div className="flex-1 h-px bg-[#E1E7F0]" />
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[15px] font-bold text-[#1A2332] font-display mb-2">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sarah Nguyen" autoComplete="name" className={inputClass} />
              </div>
              <div>
                <label className="block text-[15px] font-bold text-[#1A2332] font-display mb-2">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" autoComplete="email" className={inputClass} />
              </div>
              <div>
                <label className="block text-[15px] font-bold text-[#1A2332] font-display mb-2">Phone Number</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+84 901 234 567" autoComplete="tel" className={inputClass} />
              </div>
              <div>
                <label className="block text-[15px] font-bold text-[#1A2332] font-display mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    className={`${inputClass} pr-12`}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} aria-label="Toggle password" className="absolute right-4 top-1/2 -translate-y-1/2">
                    {showPass ? <EyeOff size={18} className="text-[#9BAABB]" /> : <Eye size={18} className="text-[#9BAABB]" />}
                  </button>
                </div>
                {/* Strength */}
                {password.length > 0 && (
                  <>
                    <div className="grid grid-cols-4 gap-1.5 mt-2.5">
                      {[0, 1, 2, 3].map((i) => (
                        <span key={i} className={`h-1.5 rounded-full ${i < strength ? (strong ? "bg-[#22C55E]" : "bg-[#F59E0B]") : "bg-[#E1E7F0]"}`} />
                      ))}
                    </div>
                    <p className={`text-[13px] font-bold font-display mt-1.5 ${strong ? "text-[#22C55E]" : "text-[#F59E0B]"}`}>
                      {strong ? "Strong password ✓" : "Keep going — add numbers & length"}
                    </p>
                  </>
                )}
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="sr-only" />
                <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${terms ? "bg-[#4A8FE8] border-[#4A8FE8]" : "border-[#C5CFD9]"}`}>
                  {terms && <Check size={14} color="#fff" strokeWidth={3} />}
                </span>
                <span className="text-[14px] text-[#1A2332] font-body leading-relaxed">
                  I agree to PawsTag&apos;s <span className="text-[#4A8FE8] font-semibold">Terms of Service</span> and <span className="text-[#4A8FE8] font-semibold">Privacy Policy</span>
                </span>
              </label>

              {error && <p className="text-[13px] text-[#EF4444] font-body text-center">{error}</p>}

              <button type="submit" className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl gradient-brand text-white font-extrabold text-[18px] font-display shadow-cta transition-all active:scale-95">
                Create Account <ArrowRight size={20} />
              </button>
            </div>

            <p className="text-center text-[15px] text-[#6B7A8D] font-body mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-[#4A8FE8] font-bold font-display">Sign In</Link>
            </p>
          </form>
        )}

        {step === 2 && (
          <div className="flex flex-col mt-5">
            <h2 className="text-[28px] font-black text-[#1A2332] font-display">Tell us about your pets 🐾</h2>
            <p className="text-[15px] text-[#6B7A8D] font-body mt-1">We&apos;ll customize PawsTag for you</p>

            <p className="text-[16px] font-bold text-[#1A2332] font-display mt-7 mb-3">What kind of pet do you have?</p>
            <div className="grid grid-cols-3 gap-3">
              {PET_TYPES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setPetType(t.key)}
                  className={`flex flex-col items-center gap-2 py-5 rounded-2xl bg-white transition-all active:scale-95 ${petType === t.key ? "border-2 border-[#4A8FE8] shadow-cta" : "border border-[#EEF2F7] shadow-card"}`}
                >
                  <span className="text-[34px]">{t.emoji}</span>
                  <span className={`text-[15px] font-bold font-display ${petType === t.key ? "text-[#4A8FE8]" : "text-[#6B7A8D]"}`}>{t.label}</span>
                </button>
              ))}
            </div>

            <p className="text-[16px] font-bold text-[#1A2332] font-display mt-7 mb-3">How many pets?</p>
            <div className="grid grid-cols-4 gap-3">
              {["1", "2", "3", "4+"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setPetCount(c)}
                  className={`h-[60px] rounded-2xl bg-white text-[20px] font-black font-display transition-all active:scale-95 ${petCount === c ? "border-2 border-[#4A8FE8] text-[#4A8FE8] shadow-cta" : "border border-[#EEF2F7] text-[#6B7A8D] shadow-card"}`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Free plan */}
            <div className="mt-7 rounded-2xl bg-gradient-to-br from-[#EEF5FF] to-[#EDF7F2] p-5">
              <p className="text-[16px] font-extrabold text-[#4A8FE8] font-display mb-3">🎁 Your free plan includes:</p>
              <div className="flex flex-col gap-2.5">
                {PLAN.map((p) => (
                  <div key={p} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#22C55E] flex items-center justify-center shrink-0">
                      <Check size={14} color="#fff" strokeWidth={3} />
                    </span>
                    <span className="text-[15px] text-[#1A2332] font-body">{p}</span>
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="text-[13px] text-[#EF4444] font-body text-center mt-4">{error}</p>}

            <button
              type="button"
              onClick={createAccount}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl gradient-brand text-white font-extrabold text-[18px] font-display shadow-cta transition-all active:scale-95 mt-7 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>Continue <ArrowRight size={20} /></>
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
