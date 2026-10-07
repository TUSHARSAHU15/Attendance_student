// ForgotPassword Component - Updated to support demo reset links and back navigation
import { useState } from "react";
import { requestPasswordReset } from "../services/email";
import { ShieldAlert, Key, Mail, Loader2, ArrowLeft, ExternalLink } from "lucide-react";

export default function ForgotPassword({ onBack }) {
  const [step, setStep] = useState("request"); // request | verify
  const [email, setEmail] = useState("");
  const [resetLink, setResetLink] = useState("");
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
      const res = await requestPasswordReset(email);
      setIsSubmitting(false);
      if (res.resetLink) {
        setResetLink(res.resetLink);
      }
      setStep("verify");
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const [copied, setCopied] = useState(false);

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
                Enter your email to receive a secure reset link (Sandbox Mailbox)
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
                    <Loader2 className="h-4 w-4 animate-spin" /> Preparing Sandbox Link...
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
          <div className="space-y-4 animate-fade-in">
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[11px] font-semibold mb-2">
                <span>📬 Sandbox Mailbox (1 New Message)</span>
              </div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">
                Email Delivered
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                A password reset email has been sent for <span className="font-semibold text-slate-700 dark:text-slate-300">{email}</span>
              </p>
            </div>

            {/* Simulated Email Envelope */}
            <div className="bg-slate-50/80 dark:bg-slate-950/70 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-xs space-y-3 shadow-inner">
              <div className="space-y-1 pb-2.5 border-b border-zinc-200 dark:border-zinc-800 text-[11px]">
                <div className="flex justify-between text-slate-500">
                  <span>From:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">no-reply@college.edu</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>To:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{email}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Subject:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">🔒 Reset your Secure Attendance Password</span>
                </div>
              </div>

              <div className="text-slate-650 dark:text-slate-300 space-y-1.5 leading-relaxed text-xs">
                <p>Hello,</p>
                <p>
                  We received a request to reset your password. Click the button below to be redirected directly to the reset password page. This link will expire in 1 hour.
                </p>
              </div>

              {/* Direct Redirect Button */}
              <div className="pt-2">
                <a
                  href={resetLink}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow-md shadow-emerald-900/20 transition cursor-pointer text-center"
                >
                  <span>👉 Click Here to Reset Password</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              {/* Copy URL helper */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={resetLink}
                  className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-[10px] font-mono text-slate-500 truncate"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(resetLink);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition shrink-0"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => setStep("request")}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition"
              >
                Request for Another Email
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