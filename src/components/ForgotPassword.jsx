// ForgotPassword Component - Updated to support demo reset links and back navigation
import { useState } from "react";
import { requestPasswordReset } from "../services/email";
import { ShieldAlert, Key, Mail, Loader2, ArrowLeft, MailCheck } from "lucide-react";

export default function ForgotPassword({ onBack }) {
  const [step, setStep] = useState("request"); // request | verify
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      await requestPasswordReset(email);
      setIsSubmitting(false);
      setStep("verify");
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[90svh] flex flex-col justify-center items-center py-10 px-4">
      <div className="text-center mb-8 max-w-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 glass-panel text-[#0e5b9e] dark:text-emerald-300 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
          <Key className="h-3.5 w-3.5" /> SECURE ATTENDANCE TRACKING
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#0e5b9e] via-emerald-600 to-rose-500 dark:from-sky-200 dark:via-emerald-200 dark:to-rose-200 select-none tracking-tight leading-none mb-3">
          Digital Attendance
        </h1>
      </div>

      <div className="w-full max-w-md glass rounded-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        {step === "request" && (
          <>
            <div className="text-center">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">
                Forgot Password
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter your registered email address to receive a password reset link
              </p>
            </div>

            <form onSubmit={handleRequestCode} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="reset-email"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="reset-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@college.edu or gmail"
                    className="w-full pl-10 pr-3 py-2.5 bg-white/45 border border-white/60 dark:bg-white/5 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg text-xs bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-800 dark:text-rose-400 flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-[#0e5b9e]/90 hover:bg-[#004b87] active:bg-[#063d6b] text-white rounded-lg shadow-lg shadow-sky-900/15 border border-white/20 font-semibold text-sm cursor-pointer transition-all duration-300 transform active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending Reset Link...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>

              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="w-full text-center text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-500 hover:underline flex items-center justify-center gap-1 cursor-pointer pt-2"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                </button>
              )}
            </form>
          </>
        )}

        {step === "verify" && (
          <div className="space-y-5 text-center animate-fade-in py-2">
            <div className="h-16 w-16 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
              <MailCheck className="h-8 w-8" />
            </div>

            <div>
              <h3 className="font-bold text-xl text-slate-800 dark:text-slate-200">
                Check Your Email
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                We have sent a password reset link to:
                <br />
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm font-mono mt-1 inline-block">
                  {email}
                </span>
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 space-y-2 text-left leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">1.</span>
                <span>Open your Gmail / email inbox.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">2.</span>
                <span>Open the email with subject <strong>"Reset your Secure Attendance password"</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">3.</span>
                <span>Click the <strong>Reset Password</strong> button inside the email to set your new password.</span>
              </div>
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-slate-400">
                💡 Don't see it? Please check your <strong>Spam / Junk</strong> folder.
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => setStep("request")}
                className="w-full py-2.5 px-4 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition"
              >
                Send to Another Email Address
              </button>

              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="w-full text-center text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-500 hover:underline flex items-center justify-center gap-1 cursor-pointer pt-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}