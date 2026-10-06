import { useState, useEffect } from "react";
import { fetchUsers } from "../state/db";
import { ShieldAlert, Key, Mail, Lock, Loader2 } from "lucide-react";

export default function Login({ onLogin, triggerRefresh, onForgotPassword }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      const fetchedUsers = await fetchUsers();
      setUsers(fetchedUsers);
      setIsLoading(false);
    }
    init();
  }, [triggerRefresh]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      setError("No account found with that email address.");
      setIsSubmitting(false);
      return;
    }

    if (user.password !== password) {
      setError("Incorrect password. Please try again.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    onLogin(user);
  };

  if (isLoading) {
    return (
      <div className="min-h-[90svh] flex justify-center items-center">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[90svh] flex flex-col justify-center items-center py-10 px-4">
      {/* Brand Logo & Header */}
      <div className="text-center mb-8 max-w-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 glass-panel text-[#0e5b9e] dark:text-emerald-300 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
          <Key className="h-3.5 w-3.5" /> SECURE ATTENDANCE TRACKING
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#0e5b9e] via-emerald-600 to-rose-500 dark:from-sky-200 dark:via-emerald-200 dark:to-rose-200 select-none tracking-tight leading-none mb-3">
          Digital Attendance
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          A security-hardened web attendance system implementing dynamic QR code authentication, device binding, and IP range constraints.
        </p>
      </div>

      {/* Login Form */}
      <div className="w-full max-w-md glass rounded-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        <div className="text-center">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">
            Sign In
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enter your credentials to access the system
          </p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                className="w-full pl-10 pr-3 py-2.5 bg-white/45 border border-white/60 dark:bg-white/5 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

              <div className="space-y-1.5">
            <label htmlFor="password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-3 py-2.5 bg-white/45 border border-white/60 dark:bg-white/5 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="text-right">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-xs text-[#0e5b9e] dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
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
              <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="pt-4 border-t border-slate-200 dark:border-white/10 text-center space-y-2">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Quick Demo Sign In
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={() => { setEmail("alan.turing@college.edu"); setPassword("teacher123"); }}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 transition cursor-pointer font-medium"
            >
              Teacher (Dr. Turing)
            </button>
            <button
              type="button"
              onClick={() => { setEmail("alice.smith@college.edu"); setPassword("student123"); }}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800/50 hover:bg-sky-100 transition cursor-pointer font-medium"
            >
              Student (Alice Smith)
            </button>
            <button
              type="button"
              onClick={() => { setEmail("admin@college.edu"); setPassword("admin123"); }}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 hover:bg-purple-100 transition cursor-pointer font-medium"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
