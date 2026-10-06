import { useState, useEffect } from "react";
import { 
  fetchUsers, fetchSubjects, fetchSessions, fetchAttendance, fetchAuditLogs,
  unbindStudentDevice, resetSystemData, addUser, deleteUser
} from "../state/db";
import { Shield, Database, Users, Activity, Trash2, Unlock, AlertTriangle, Loader2, UserPlus } from "lucide-react";

export default function AdminDashboard({ user, onTriggerRefresh, triggerRefresh }) {
  const [data, setData] = useState({ users: [], subjects: [], sessions: [], attendance: [], auditLogs: [] });
  const [isLoading, setIsLoading] = useState(true);

  // JUNO Interactive Load States
  const [isUsersLoaded, setIsUsersLoaded] = useState(true);
  const [isLogsLoaded, setIsLogsLoaded] = useState(true);
  const [isDangerLoaded, setIsDangerLoaded] = useState(false);
  const [isAddUserLoaded, setIsAddUserLoaded] = useState(false);

  // Add User Form State
  const [newUser, setNewUser] = useState({ id: "", name: "", email: "", role: "student", password: "" });
  const [addUserMessage, setAddUserMessage] = useState(null);
  const [isAddingUser, setIsAddingUser] = useState(false);

  useEffect(() => {
    async function loadAllData() {
      setIsLoading(true);
      const [u, sub, sess, att, logs] = await Promise.all([
        fetchUsers(), fetchSubjects(), fetchSessions(), fetchAttendance(), fetchAuditLogs()
      ]);
      setData({ users: u, subjects: sub, sessions: sess, attendance: att, auditLogs: logs });
      setIsLoading(false);
    }
    loadAllData();
  }, [triggerRefresh]);

  const handleUnbind = async (studentId) => {
    if (confirm("Are you sure you want to unbind this student's device fingerprint? They will need to re-register on their next login.")) {
      const res = await unbindStudentDevice(studentId);
      if (res.success) {
        onTriggerRefresh();
      }
    }
  };

  const handleReset = async () => {
    if (confirm("WARNING: This will wipe ALL attendance records, sessions, logs, and device bindings. This action cannot be undone. Proceed?")) {
      await resetSystemData();
      onTriggerRefresh();
      alert("System database reset successfully.");
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddUserMessage(null);
    setIsAddingUser(true);

    const res = await addUser(newUser);
    setAddUserMessage(res);
    setIsAddingUser(false);

    if (res.success) {
      setNewUser({ id: "", name: "", email: "", role: "student", password: "" });
      onTriggerRefresh();
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete "${userName}"? This cannot be undone.`)) return;
    const res = await deleteUser(userId);
    if (res.success) {
      onTriggerRefresh();
    } else {
      alert(res.message);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-20">
        <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  const students = data.users.filter(u => u.role === "student");
  const registeredCount = students.filter(s => s.registeredFingerprint).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left max-w-7xl mx-auto py-2">
      {/* ================= LEFT SIDEBAR COLUMN ================= */}
      <div className="lg:col-span-1 space-y-4">
        {/* Admin Info Card */}
        <div className="juno-card">
          <h3 className="font-bold text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            System Administrator
          </h3>

          <div className="space-y-3.5 text-xs">
            <div>
              <div className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase font-semibold">Admin ID</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{user.id}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase font-semibold">Access Level</div>
              <div className="font-bold text-amber-600 dark:text-amber-400 mt-0.5">Root / Superuser</div>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-2 text-center">
              <div className="p-2 bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <div className="text-[9px] text-zinc-450 uppercase font-semibold">Total Users</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{data.users.length}</div>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <div className="text-[9px] text-zinc-450 uppercase font-semibold">Bound Devices</div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{registeredCount}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links Card */}
        <div className="juno-card">
          <h3 className="font-bold text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
            Admin Modules
          </h3>
          <div className="space-y-2 text-xs">
            <button
              onClick={() => {
                setIsAddUserLoaded(true);
                document.getElementById("add-user-card")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg font-semibold text-slate-800 dark:text-slate-200 text-left transition cursor-pointer"
            >
              <UserPlus className="h-4 w-4 text-emerald-500" />
              <span>Add New User</span>
            </button>

            <button
              onClick={() => {
                setIsUsersLoaded(true);
                document.getElementById("users-card")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg font-semibold text-slate-800 dark:text-slate-200 text-left transition cursor-pointer"
            >
              <Users className="h-4 w-4 text-amber-500" />
              <span>User Device Management</span>
            </button>

            <button
              onClick={() => {
                setIsLogsLoaded(true);
                document.getElementById("logs-card")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg font-semibold text-slate-800 dark:text-slate-200 text-left transition cursor-pointer"
            >
              <Activity className="h-4 w-4 text-amber-500" />
              <span>Security Audit Logs</span>
            </button>

            <button
              onClick={() => {
                setIsDangerLoaded(true);
                document.getElementById("danger-card")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg font-semibold text-slate-800 dark:text-slate-200 text-left transition cursor-pointer"
            >
              <Shield className="h-4 w-4 text-amber-500" />
              <span>System Operations</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= RIGHT MAIN SECTION ================= */}
      <div className="lg:col-span-2 space-y-4">
        
        {/* Card 0: Add New User */}
        <div id="add-user-card" className="juno-card">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <UserPlus className="h-4.5 w-4.5 text-emerald-500" />
                <span>Add New User</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Register a new student or teacher into the system.
              </p>
            </div>
            <button onClick={() => setIsAddUserLoaded(!isAddUserLoaded)} className="juno-btn-primary shrink-0">
              {isAddUserLoaded ? "Close" : "Load"}
            </button>
          </div>

          {isAddUserLoaded && (
            <div className="mt-4 pt-4 border-t border-zinc-150 dark:border-zinc-800 animate-fade-in">
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      User ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={newUser.id}
                      onChange={(e) => setNewUser({ ...newUser, id: e.target.value })}
                      placeholder="e.g. BCA/40051/24"
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="e.g. john@college.edu"
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Role *
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Set login password"
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {addUserMessage && (
                  <div className={`p-3 rounded-lg text-xs ${addUserMessage.success
                    ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400"
                    : "bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-800 dark:text-rose-400"
                  }`}>
                    {addUserMessage.message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAddingUser}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAddingUser ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Adding...</>
                  ) : (
                    <><UserPlus className="h-3.5 w-3.5" /> Add User</>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Card 1: User Device Management */}
        <div id="users-card" className="juno-card">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-amber-500" />
                <span>Student Device Registry</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Manage hardware bindings. Unbind devices if a student loses their phone.
              </p>
            </div>
            <button onClick={() => setIsUsersLoaded(!isUsersLoaded)} className="juno-btn-primary shrink-0">
              {isUsersLoaded ? "Close" : "Load"}
            </button>
          </div>

          {isUsersLoaded && (
            <div className="mt-4 pt-4 border-t border-zinc-150 dark:border-zinc-800 animate-fade-in overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                    <th className="py-2.5 font-semibold">User</th>
                    <th className="py-2.5 font-semibold">Role</th>
                    <th className="py-2.5 font-semibold">Binding Status</th>
                    <th className="py-2.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.filter(u => u.role !== "admin").map(u => (
                    <tr key={u.id} className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-900/20">
                      <td className="py-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{u.name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{u.id}</div>
                      </td>
                      <td className="py-3">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${u.role === "student"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                          : "bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-[10px]">
                        {u.registeredFingerprint ? (
                          <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-900/40">Bound</span>
                        ) : (
                          <span className="text-zinc-400">Unbound</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex gap-1">
                          {u.role === "student" && (
                            <button
                              onClick={() => handleUnbind(u.id)}
                              disabled={!u.registeredFingerprint}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded text-[10px] font-bold disabled:opacity-50 transition cursor-pointer dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-rose-900/30 dark:hover:border-rose-900/50 dark:hover:text-rose-400"
                            >
                              <Unlock className="h-3 w-3 inline mr-0.5" />
                              Unbind
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded text-[10px] font-bold transition cursor-pointer dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-rose-900/30 dark:hover:border-rose-900/50 dark:hover:text-rose-400"
                          >
                            <Trash2 className="h-3 w-3 inline mr-0.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Card 2: Security Audit Logs */}
        <div id="logs-card" className="juno-card">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Activity className="h-4.5 w-4.5 text-amber-500" />
                <span>System Security Logs</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Monitor cheating attempts, session states, and manual overrides.
              </p>
            </div>
            <button onClick={() => setIsLogsLoaded(!isLogsLoaded)} className="juno-btn-primary shrink-0">
              {isLogsLoaded ? "Close" : "Load"}
            </button>
          </div>

          {isLogsLoaded && (
            <div className="mt-4 pt-4 border-t border-zinc-150 dark:border-zinc-800 animate-fade-in overflow-x-auto">
              {data.auditLogs.length === 0 ? (
                <div className="text-center py-6 text-zinc-500 text-xs">No logs found.</div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="sticky top-0 bg-white dark:bg-[#0b1120]">
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                        <th className="py-2.5 font-semibold">Time</th>
                        <th className="py-2.5 font-semibold">Level</th>
                        <th className="py-2.5 font-semibold">Event</th>
                        <th className="py-2.5 font-semibold">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.auditLogs.map((log) => (
                        <tr key={log.id} className="border-b border-zinc-100 dark:border-zinc-900/50">
                          <td className="py-2 font-mono text-[9px] text-zinc-500 whitespace-nowrap pr-2">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                          </td>
                          <td className="py-2 pr-2">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              log.level === 'CRITICAL' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-400' :
                              log.level === 'WARN' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400' :
                              'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                            }`}>
                              {log.level}
                            </span>
                          </td>
                          <td className="py-2 font-semibold text-slate-800 dark:text-slate-200 pr-2">{log.message}</td>
                          <td className="py-2 font-mono text-[9px] text-zinc-500">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card 3: Danger Zone */}
        <div id="danger-card" className="juno-card border-rose-200 dark:border-rose-900/30">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-sm text-rose-600 dark:text-rose-500 flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5" />
                <span>Danger Zone</span>
              </h3>
            </div>
            <button onClick={() => setIsDangerLoaded(!isDangerLoaded)} className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-900/40 dark:text-rose-400 rounded-lg font-semibold text-xs transition cursor-pointer border border-rose-200 dark:border-rose-900/30">
              {isDangerLoaded ? "Close" : "Unlock"}
            </button>
          </div>

          {isDangerLoaded && (
            <div className="mt-4 pt-4 border-t border-rose-100 dark:border-rose-900/20 animate-fade-in">
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl flex items-start gap-4">
                <Database className="h-8 w-8 text-rose-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-rose-800 dark:text-rose-400 text-sm">Factory Reset Database</h4>
                  <p className="text-xs text-rose-700/80 dark:text-rose-400/80 mt-1 mb-3">
                    Clear all attendance records, active sessions, bindings, and audit logs. Users and Subjects will remain intact.
                  </p>
                  <button 
                    onClick={handleReset}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition cursor-pointer flex items-center gap-2"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Wipe Database
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}