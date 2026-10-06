// ResetPassword Component - Updated to use custom email module
import { useState, useEffect } from "react";
import { validateResetToken, completePasswordReset } from "../services/email";
import { Lock, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function ResetPassword({ onBack }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  // Extract token from URL
  const getTokenFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token');
  };

  // Validate token on mount
  useEffect(() => {
    const token = getTokenFromUrl();
    if (!token) {
      setError("Invalid or missing reset token.");
      setLoading(false);
      return;
    }

    validateResetToken(token)
      .then(() => {
        setTokenValid(true);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const token = getTokenFromUrl();
    if (!token) {
      setError("Reset token missing. Please request a new reset link.");
      return;
    }

    setIsSubmitting(true);

    try {
      await completePasswordReset(token, password);
      setIsSubmitting(false);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[90svh] flex flex-col justify-center items-center py-10 px-4">
        <div className="w-full max-w-md glass rounded-2xl overflow-hidden p-6 sm:p-8 space-y-6">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#0e5b9e]" />
          </div>
          <p className="text-center text-slate-500 dark:text-slate-400">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-[90svh] flex flex-col justify-center items-center py-10 px-4">
        <div className="w-full max-w-md glass rounded-2xl overflow-hidden p-6 sm:p-8 space-y-6 text-center">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">
            Invalid Reset Link
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {error || "This password reset link is invalid or has expired."}
          </p>
          <button
            onClick={onBack}
            className="w-full py-3 px-4 bg-[#0e5b9e]/90 hover:bg-[#004b87] active:bg-[#063d6b] text-white rounded-lg shadow-lg shadow-sky-900/15 border border-white/20 font-semibold text-sm cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 mt-4"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[90svh] flex flex-col justify-center items-center py-10 px-4">
        <div className="w-full max-w-md glass rounded-2xl overflow-hidden p-6 sm:p-8 space-y-6 text-center">
          <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">
            Password Updated Successfully
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Your password has been changed. You can now sign in with your new password.
          </p>
          <button
            onClick={onBack}
            className="w-full py-3 px-4 bg-[#0e5b9e]/90 hover:bg-[#004b87] active:bg-[#063d6b] text-white rounded-lg shadow-lg shadow-sky-900/15 border border-white/20 font-semibold text-sm cursor-pointer transition-all duration-300 flex items-center justify-center gap-2"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[90svh] flex flex-col justify-center items-center py-10 px-4">
      <div className="text-center mb-8 max-w-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 glass-panel text-[#0e5b9e] dark:text-emerald-300 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
          <Lock className="h-3.5 w-3.5" /> SECURE ATTENDANCE TRACKING
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#0e5b9e] via-emerald-600 to-rose-500 dark:from-sky-200 dark:via-emerald-200 dark:to-rose-200 select-none tracking-tight leading-none mb-3">
          Digital Attendance
        </h1>
      </div>

      <div className="w-full max-w-md glass rounded-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        <div className="text-center">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">
            Set New Password
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="new-password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-10 py-2.5 bg-white/45 border border-white/60 dark:bg-white/5 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm-password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full pl-10 pr-3 py-2.5 bg-white/45 border border-white/60 dark:bg-white/5 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg text-xs bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-800 dark:text-rose-400 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
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
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </button>
        </form>

        <button
          onClick={onBack}
          className="w-full py-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer transition-colors flex items-center justify-center gap-1"
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );
}