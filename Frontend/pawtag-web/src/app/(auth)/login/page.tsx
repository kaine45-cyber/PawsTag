"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, PawPrint, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/LanguageContext";
import { ROUTES } from "@/constants/routes";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const { t }     = useI18n();
  const router    = useRouter();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError(t("lg.fillAll")); return; }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || t("lg.invalid"));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle(credential: string) {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle(credential);
      router.replace("/dashboard");
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || t("lg.googleFailed"));
      setLoading(false);
    }
  }

  const inputClass =
    "w-full h-[52px] px-[18px] rounded-2xl bg-[#F0F4FA] border border-[rgba(74,143,232,0.12)] text-[15px] text-[#1A2332] font-body outline-none focus:border-[#4A8FE8] focus:bg-white transition-all placeholder:text-[#9BAABB]";

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#EFF3FB] to-[#F7F9FC] flex flex-col px-5 pt-4 pb-8 overflow-hidden">

      {/* Ambient blobs */}
      <div className="absolute -top-20 -left-24 w-72 h-72 rounded-full bg-[#52C97F] opacity-15 blur-[70px] pointer-events-none" />
      <div className="absolute -top-20 -right-24 w-72 h-72 rounded-full bg-[#4A8FE8] opacity-15 blur-[70px] pointer-events-none" />

      {/* Back */}
      <Link
        href="/"
        className="relative w-11 h-11 rounded-full bg-white shadow-card flex items-center justify-center transition-all active:scale-90 self-start z-10"
      >
        <ArrowLeft size={18} className="text-[#1A2332]" />
      </Link>

      <div className="relative z-10 max-w-sm mx-auto w-full flex flex-col">

        {/* Hero + heading */}
        <div className="flex flex-col items-center mt-2 mb-6">
          <div className="relative w-[104px] h-[104px] mb-5">
            <img
              src="/images/corgi.jpg"
              alt="Bobby"
              className="w-full h-full rounded-[30px] object-cover border-4 border-white shadow-xl"
            />
            <div className="absolute -bottom-2 -right-2 w-11 h-11 rounded-full gradient-brand flex items-center justify-center shadow-cta border-2 border-white">
              <PawPrint size={18} color="#fff" />
            </div>
          </div>
          <h1 className="text-[34px] font-black text-[#1A2332] font-display flex items-center gap-2">
            {t("lg.welcome")} <span className="text-[28px]">👋</span>
          </h1>
          <p className="text-[15px] text-[#6B7A8D] font-body mt-2 text-center">
            {t("lg.heroSub")}
          </p>
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-form flex flex-col gap-4">
          {/* Social */}
          <div className="flex flex-col gap-3">
            <GoogleSignInButton onCredential={handleGoogle} onError={() => setError(t("lg.googleFailed"))} text="signin_with" />
            <button
              type="button"
              onClick={() => setError(t("lg.socialSoon"))}
              className="flex items-center justify-center gap-2 h-[52px] rounded-2xl border border-[#EEF2F7] bg-white transition-all active:scale-95"
            >
              <span className="text-[18px]">📘</span>
              <span className="text-[14px] font-semibold text-[#1A2332] font-body">Facebook</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#EEF2F7]" />
            <span className="text-[12px] text-[#9BAABB] font-body">{t("lg.orEmail")}</span>
            <div className="flex-1 h-px bg-[#EEF2F7]" />
          </div>

          {/* Email */}
          <div>
            <label className="block text-[15px] font-bold text-[#1A2332] font-display mb-2">{t("lg.email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("lg.emailPlaceholder")}
              autoComplete="email"
              className={inputClass}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[15px] font-bold text-[#1A2332] font-display mb-2">{t("lg.password")}</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("lg.pwPlaceholder")}
                autoComplete="current-password"
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                {showPass ? <EyeOff size={18} className="text-[#9BAABB]" /> : <Eye size={18} className="text-[#9BAABB]" />}
              </button>
            </div>
            <div className="flex justify-end mt-2">
              <Link href={ROUTES.forgotPassword} className="text-[14px] text-[#4A8FE8] font-bold font-display">
                {t("lg.forgot")}
              </Link>
            </div>
          </div>

          {/* Error */}
          {error && <p className="text-[13px] text-[#EF4444] font-body text-center">{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl gradient-brand text-white font-extrabold text-[18px] shadow-cta transition-all active:scale-95 font-display disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>{t("lg.signingIn")}</span>
              </>
            ) : (
              <>{t("lg.signIn")} <ArrowRight size={20} /></>
            )}
          </button>
        </form>

        {/* Create account */}
        <p className="text-center text-[15px] text-[#6B7A8D] font-body mt-6">
          {t("lg.noAccount")}{" "}
          <Link href="/register" className="text-[#4A8FE8] font-bold font-display">
            {t("lg.createFree")}
          </Link>
        </p>

        {/* Testimonial card */}
        <div className="mt-6 rounded-2xl bg-[#EEF2FB] p-4 flex items-start gap-3">
          <span className="text-[34px] leading-none shrink-0">🐕</span>
          <div className="min-w-0">
            <p className="text-[14px] text-[#1A2332] font-body leading-relaxed">
              {t("lg.testimonial")}
            </p>
            <p className="text-[14px] font-bold text-[#4A8FE8] font-display mt-1">{t("lg.testimonialBy")}</p>
          </div>
        </div>

        {/* Footer */}
        <p className="flex items-center justify-center gap-1.5 text-[13px] text-[#9BAABB] font-body mt-6">
          <PawPrint size={13} className="text-[#9BAABB]" />
          {t("lg.footer")}
        </p>
      </div>
    </div>
  );
}
