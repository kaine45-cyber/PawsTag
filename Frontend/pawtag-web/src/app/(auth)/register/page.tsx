"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Check, ArrowRight } from "lucide-react";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/LanguageContext";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import FacebookSignInButton from "@/components/auth/FacebookSignInButton";

const CORGI = "/images/corgi.jpg";

const PET_TYPES = [
  { key: "dog",   emoji: "🐕", labelKey: "rg.dog"   },
  { key: "cat",   emoji: "🐈", labelKey: "rg.cat"   },
  { key: "other", emoji: "🐰", labelKey: "rg.other" },
];

const PLAN_KEYS = ["rg.plan1", "rg.plan2", "rg.plan3", "rg.plan4", "rg.plan5"];
const NEXT_STEP_KEYS = ["rg.next1", "rg.next2", "rg.next3", "rg.next4"];

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
  const { t } = useI18n();
  const router = useRouter();
  const { loginWithGoogle, loginWithFacebook } = useAuth();
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
    if (!name || !email || !password) { setError(t("rg.fillAll")); return; }
    if (password.length < 8) { setError(t("rg.pwMin")); return; }
    if (new TextEncoder().encode(password).length > 72) { setError(t("rg.pwMax")); return; }
    if (!terms) { setError(t("rg.acceptTerms")); return; }
    setError("");
    setStep(2);
  }

  async function createAccount() {
    setError("");
    setLoading(true);
    try {
      await authService.register(name, email, password, phone || undefined);
      setStep(3);
    } catch {
      setError(t("rg.failed"));
      setStep(1);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle(credential: string) {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle(credential);
      router.replace("/pet/create");
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || t("rg.googleFailed"));
      setStep(1);
      setLoading(false);
    }
  }

  async function handleFacebook(accessToken: string) {
    setError("");
    setLoading(true);
    try {
      await loginWithFacebook(accessToken);
      router.replace("/pet/create");
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || t("rg.facebookFailed"));
      setStep(1);
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
          <h1 className="text-[30px] font-black text-[#1A2332] font-display">{t("rg.success")}</h1>
          <p className="text-[15px] text-[#6B7A8D] font-body text-center mt-2 leading-relaxed">
            {t("rg.welcome")}
          </p>

          <div className="w-full flex flex-col gap-3 mt-6">
            {NEXT_STEP_KEYS.map((k, i) => (
              <div key={k} className="flex items-center gap-3 bg-[#EEF2FB] rounded-2xl px-4 py-3.5">
                <span className="w-9 h-9 rounded-full border-2 border-[#4A8FE8] flex items-center justify-center text-[14px] font-bold text-[#4A8FE8] font-display shrink-0">
                  {i + 1}
                </span>
                <p className="text-[15px] text-[#1A2332] font-body">{t(k)}</p>
              </div>
            ))}
          </div>

          <div className="w-full mt-5 rounded-2xl bg-[#EDF7F2] border border-[#22C55E]/20 px-4 py-3 text-center">
            <p className="text-[13px] font-bold text-[#2A6B47] font-display">🎁 {t("rg.shipFree")}</p>
          </div>

          <button
            type="button"
            onClick={() => { window.location.href = "/pet/create"; }}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl gradient-premium text-white font-extrabold text-[17px] font-display shadow-cta transition-all active:scale-95 mt-6"
          >
            🚀 {t("rg.createFirst")}
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
          <h1 className="text-[22px] font-black text-[#1A2332] font-display leading-none">{t("rg.createAccount")}</h1>
          <p className="text-[13px] text-[#9BAABB] font-body mt-1">{t("rg.step").replace("{n}", String(step))}</p>
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
              <h2 className="text-[30px] font-black text-[#1A2332] font-display text-center leading-tight">{t("rg.join")}</h2>
              <p className="text-[15px] text-[#6B7A8D] font-body mt-2">{t("rg.subtitle")}</p>
            </div>

            {/* Social */}
            <div className="flex flex-col gap-3 mb-5">
              <GoogleSignInButton onCredential={handleGoogle} onError={() => setError(t("rg.googleFailed"))} text="signup_with" />
              <FacebookSignInButton onToken={handleFacebook} onError={() => setError(t("rg.facebookFailed"))} label={t("rg.facebook")} />
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-[#E1E7F0]" />
              <span className="text-[13px] text-[#9BAABB] font-body">{t("rg.orEmail")}</span>
              <div className="flex-1 h-px bg-[#E1E7F0]" />
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[15px] font-bold text-[#1A2332] font-display mb-2">{t("rg.fullName")}</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("rg.namePlaceholder")} autoComplete="name" className={inputClass} />
              </div>
              <div>
                <label className="block text-[15px] font-bold text-[#1A2332] font-display mb-2">{t("rg.email")}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("rg.emailPlaceholder")} autoComplete="email" className={inputClass} />
              </div>
              <div>
                <label className="block text-[15px] font-bold text-[#1A2332] font-display mb-2">{t("rg.phone")}</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("rg.phonePlaceholder")} autoComplete="tel" className={inputClass} />
              </div>
              <div>
                <label className="block text-[15px] font-bold text-[#1A2332] font-display mb-2">{t("rg.password")}</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("rg.pwPlaceholder")}
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={72}
                    required
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
                      {strong ? t("rg.strong") : t("rg.keepGoing")}
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
                  {t("rg.agree")} <span className="text-[#4A8FE8] font-semibold">{t("rg.terms")}</span> {t("rg.and")} <span className="text-[#4A8FE8] font-semibold">{t("rg.privacy")}</span>
                </span>
              </label>

              {error && <p className="text-[13px] text-[#EF4444] font-body text-center">{error}</p>}

              <button type="submit" className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl gradient-brand text-white font-extrabold text-[18px] font-display shadow-cta transition-all active:scale-95">
                {t("rg.createAccount")} <ArrowRight size={20} />
              </button>
            </div>

            <p className="text-center text-[15px] text-[#6B7A8D] font-body mt-6">
              {t("rg.haveAccount")}{" "}
              <Link href="/login" className="text-[#4A8FE8] font-bold font-display">{t("rg.signIn")}</Link>
            </p>
          </form>
        )}

        {step === 2 && (
          <div className="flex flex-col mt-5">
            <h2 className="text-[28px] font-black text-[#1A2332] font-display">{t("rg.tellPets")} 🐾</h2>
            <p className="text-[15px] text-[#6B7A8D] font-body mt-1">{t("rg.customize")}</p>

            <p className="text-[16px] font-bold text-[#1A2332] font-display mt-7 mb-3">{t("rg.whatPet")}</p>
            <div className="grid grid-cols-3 gap-3">
              {PET_TYPES.map((pt) => (
                <button
                  key={pt.key}
                  type="button"
                  onClick={() => setPetType(pt.key)}
                  className={`flex flex-col items-center gap-2 py-5 rounded-2xl bg-white transition-all active:scale-95 ${petType === pt.key ? "border-2 border-[#4A8FE8] shadow-cta" : "border border-[#EEF2F7] shadow-card"}`}
                >
                  <span className="text-[34px]">{pt.emoji}</span>
                  <span className={`text-[15px] font-bold font-display ${petType === pt.key ? "text-[#4A8FE8]" : "text-[#6B7A8D]"}`}>{t(pt.labelKey)}</span>
                </button>
              ))}
            </div>

            <p className="text-[16px] font-bold text-[#1A2332] font-display mt-7 mb-3">{t("rg.howMany")}</p>
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
              <p className="text-[16px] font-extrabold text-[#4A8FE8] font-display mb-3">🎁 {t("rg.planTitle")}</p>
              <div className="flex flex-col gap-2.5">
                {PLAN_KEYS.map((k) => (
                  <div key={k} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#22C55E] flex items-center justify-center shrink-0">
                      <Check size={14} color="#fff" strokeWidth={3} />
                    </span>
                    <span className="text-[15px] text-[#1A2332] font-body">{t(k)}</span>
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
                  <span>{t("rg.creating")}</span>
                </>
              ) : (
                <>{t("rg.continue")} <ArrowRight size={20} /></>
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
