"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, KeyRound, ArrowRight, CheckCircle2 } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { authService } from "@/services/auth.service";
import { useI18n } from "@/i18n/LanguageContext";

type Step = "email" | "otp" | "done";

const DEFAULT_COOLDOWN_SECONDS = 60;

export default function ForgotPasswordPage() {
  const { t } = useI18n();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  function statusOf(e: unknown): number | undefined {
    return (e as { response?: { status?: number } })?.response?.status;
  }

  function retryAfterOf(e: unknown): number {
    const headers = (e as { response?: { headers?: Record<string, unknown> & { get?: (name: string) => unknown } } })?.response?.headers;
    const raw = headers?.["retry-after"] ?? headers?.get?.("retry-after");
    const retryAfter = Number(Array.isArray(raw) ? raw[0] : raw);
    return Number.isFinite(retryAfter) && retryAfter > 0 ? Math.ceil(retryAfter) : DEFAULT_COOLDOWN_SECONDS;
  }

  function cooldownOf(data?: { resendCooldownSeconds?: number } | null): number {
    const seconds = Number(data?.resendCooldownSeconds);
    return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : DEFAULT_COOLDOWN_SECONDS;
  }

  function errMsg(e: unknown, fallback: string): string {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    return msg || fallback;
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError(t("fp.fillEmail")); return; }
    setError("");
    setLoading(true);
    try {
      const data = await authService.forgotPassword(email.trim());
      setStep("otp");
      setCooldown(cooldownOf(data));
    } catch (err) {
      if (statusOf(err) === 429) {
        setStep("otp");
        setCooldown(retryAfterOf(err));
        setError(t("fp.tooSoon"));
      } else {
        setError(errMsg(err, t("fp.genericError")));
      }
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim() || !newPassword.trim()) { setError(t("fp.fillAll")); return; }
    setError("");
    setLoading(true);
    try {
      await authService.resetPassword(email.trim(), otp.trim(), newPassword);
      setStep("done");
    } catch (err) {
      setError(statusOf(err) === 429 ? t("fp.tooManyAttempts") : errMsg(err, t("fp.invalidOtp")));
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (cooldown > 0) return;
    setError("");
    try {
      const data = await authService.forgotPassword(email.trim());
      setCooldown(cooldownOf(data));
    } catch (err) {
      if (statusOf(err) === 429) {
        setCooldown(retryAfterOf(err));
        setError(t("fp.tooSoon"));
      } else {
        setError(errMsg(err, t("fp.genericError")));
      }
    }
  }

  const inputClass =
    "w-full h-[52px] px-[18px] rounded-2xl bg-[#F0F4FA] border border-[rgba(74,143,232,0.12)] text-[15px] text-[#1A2332] font-body outline-none focus:border-[#4A8FE8] focus:bg-white transition-all placeholder:text-[#9BAABB]";

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#EFF3FB] to-[#F7F9FC] flex flex-col px-5 pt-4 pb-8 overflow-hidden">
      <div className="absolute -top-20 -left-24 w-72 h-72 rounded-full bg-[#4A8FE8] opacity-15 blur-[70px] pointer-events-none" />
      <div className="absolute -top-20 -right-24 w-72 h-72 rounded-full bg-[#52C97F] opacity-15 blur-[70px] pointer-events-none" />

      <Link
        href={ROUTES.login}
        className="relative w-11 h-11 rounded-full bg-white shadow-card flex items-center justify-center transition-all active:scale-90 self-start z-10"
      >
        <ArrowLeft size={18} className="text-[#1A2332]" />
      </Link>

      <div className="relative z-10 max-w-sm mx-auto w-full flex flex-col mt-6">
        {step === "email" && (
          <>
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-3xl gradient-brand flex items-center justify-center shadow-cta mb-4">
                <KeyRound size={28} color="#fff" />
              </div>
              <h1 className="text-[26px] font-black text-[#1A2332] font-display text-center">{t("fp.step1Title")}</h1>
              <p className="text-[15px] text-[#6B7A8D] font-body mt-2 text-center">{t("fp.step1Sub")}</p>
            </div>

            <form onSubmit={sendCode} className="bg-white rounded-3xl p-6 shadow-form flex flex-col gap-4">
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

              {error && <p className="text-[13px] text-[#EF4444] font-body text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl gradient-brand text-white font-extrabold text-[17px] shadow-cta transition-all active:scale-95 font-display disabled:opacity-70"
              >
                {loading ? (
                  <><div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" /><span>{t("fp.sending")}</span></>
                ) : (
                  <>{t("fp.sendCode")} <ArrowRight size={20} /></>
                )}
              </button>
            </form>
          </>
        )}

        {step === "otp" && (
          <>
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-3xl gradient-brand flex items-center justify-center shadow-cta mb-4">
                <KeyRound size={28} color="#fff" />
              </div>
              <h1 className="text-[26px] font-black text-[#1A2332] font-display text-center">{t("fp.step2Title")}</h1>
              <p className="text-[15px] text-[#6B7A8D] font-body mt-2 text-center">
                {t("fp.step2Sub").replace("{email}", email.trim())}
              </p>
            </div>

            <form onSubmit={resetPassword} className="bg-white rounded-3xl p-6 shadow-form flex flex-col gap-4">
              <div>
                <label className="block text-[15px] font-bold text-[#1A2332] font-display mb-2">{t("fp.otpLabel")}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder={t("fp.otpPlaceholder")}
                  className={`${inputClass} text-center tracking-[0.4em] font-mono text-[20px]`}
                />
              </div>

              <div>
                <label className="block text-[15px] font-bold text-[#1A2332] font-display mb-2">{t("fp.newPassword")}</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("fp.newPwPlaceholder")}
                    autoComplete="new-password"
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
              </div>

              {error && <p className="text-[13px] text-[#EF4444] font-body text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl gradient-brand text-white font-extrabold text-[17px] shadow-cta transition-all active:scale-95 font-display disabled:opacity-70"
              >
                {loading ? (
                  <><div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" /><span>{t("fp.resetting")}</span></>
                ) : (
                  <>{t("fp.resetBtn")}</>
                )}
              </button>

              <button
                type="button"
                onClick={resend}
                disabled={cooldown > 0}
                className="text-[14px] text-[#4A8FE8] font-bold font-display text-center disabled:text-[#9BAABB] disabled:cursor-not-allowed"
              >
                {cooldown > 0 ? t("fp.resendIn").replace("{s}", String(cooldown)) : t("fp.resendCode")}
              </button>
            </form>
          </>
        )}

        {step === "done" && (
          <div className="bg-white rounded-3xl p-6 shadow-form flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-[#EDF7F2] flex items-center justify-center">
              <CheckCircle2 size={32} className="text-[#22C55E]" />
            </div>
            <h1 className="text-[22px] font-black text-[#1A2332] font-display">{t("fp.successTitle")}</h1>
            <p className="text-[15px] text-[#6B7A8D] font-body">{t("fp.successSub")}</p>
            <Link
              href={ROUTES.login}
              className="mt-2 w-full flex items-center justify-center gap-2 py-4 rounded-2xl gradient-brand text-white font-extrabold text-[17px] shadow-cta transition-all active:scale-95 font-display"
            >
              {t("fp.goToLogin")}
            </Link>
          </div>
        )}

        {step !== "done" && (
          <p className="text-center text-[15px] text-[#6B7A8D] font-body mt-6">
            <Link href={ROUTES.login} className="text-[#4A8FE8] font-bold font-display">
              {t("fp.backToLogin")}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
