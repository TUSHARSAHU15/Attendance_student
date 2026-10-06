import { useState } from "react";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import StudentDashboard from "./components/StudentDashboard";
import TeacherDashboard from "./components/TeacherDashboard";
import AdminDashboard from "./components/AdminDashboard";
import SimulationPanel from "./components/SimulationPanel";
import { LogOut } from "lucide-react";

export default function App() {
  const [user, setUser] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [view, setView] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("token")) return "resetPassword";
    }
    return "login";
  });

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleLogout = () => {
    setUser(null);
    setView("login");
  };

  const handleBackToLogin = () => {
    if (typeof window !== "undefined" && window.location.search.includes("token")) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    setView("login");
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500/30">
      {/* Top Navigation Bar */}
      {user && (
        <header className="sticky top-0 z-40 w-full glass border-b border-white/20 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-gradient-to-br from-[#0e5b9e] to-emerald-500 flex items-center justify-center shadow-inner">
                <span className="text-white font-bold text-lg leading-none select-none">S</span>
              </div>
              <span className="font-bold text-lg tracking-tight hidden sm:inline-block">
                Secure<span className="text-emerald-600 dark:text-emerald-400">Attendance</span>
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold leading-tight">{user.name}</div>
                <div className="text-[10px] font-semibold text-emerald-650 dark:text-emerald-400 uppercase tracking-wider">{user.role}</div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="px-4 pb-20">
        {!user ? (
          view === "forgotPassword" ? (
            <ForgotPassword onBack={handleBackToLogin} />
          ) : view === "resetPassword" ? (
            <ResetPassword onBack={handleBackToLogin} />
          ) : (
            <Login onLogin={setUser} triggerRefresh={refreshKey} onForgotPassword={() => setView("forgotPassword")} />
          )
        ) : (
          <div className="py-6 animate-fade-in">
            {user.role === "student" && <StudentDashboard user={user} onTriggerRefresh={triggerRefresh} triggerRefresh={refreshKey} />}
            {user.role === "teacher" && <TeacherDashboard user={user} onTriggerRefresh={triggerRefresh} triggerRefresh={refreshKey} />}
            {user.role === "admin" && <AdminDashboard user={user} onTriggerRefresh={triggerRefresh} triggerRefresh={refreshKey} />}
          </div>
        )}
      </main>

      {/* Global Simulation Sandbox Panel */}
      <SimulationPanel onUpdate={triggerRefresh} />
    </div>
  );
}