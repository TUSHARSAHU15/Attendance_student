import { useState, useEffect, useRef } from "react";
import {
  fetchUsers, fetchSessions, fetchSubjects, fetchAttendance, getSimulationState,
  startTeacherSession,
  endTeacherSession,
  generateQrPayload,
  QR_WINDOW_MS,
  submitManualOverride
} from "../state/db";
import { QRCodeSVG } from "qrcode.react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { Play, Users, Eye, Loader2 } from "lucide-react";

export default function TeacherDashboard({ user, onTriggerRefresh, triggerRefresh }) {
  const [data, setData] = useState({ users: [], sessions: [], subjects: [], attendance: [] });
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  const lastTimestampRef = useRef(0);

  // Live QR States
  const [qrToken, setQrToken] = useState("");
  const [timeLeft, setTimeLeft] = useState(QR_WINDOW_MS / 1000);

  // JUNO Interactive Load States
  const [isControlsLoaded, setIsControlsLoaded] = useState(true);
  const [isAnalyticsLoaded, setIsAnalyticsLoaded] = useState(false);
  const [isRosterLoaded, setIsRosterLoaded] = useState(true);

  useEffect(() => {
    async function loadAllData() {
      setIsLoading(true);
      const [u, se, su, a] = await Promise.all([
        fetchUsers(), fetchSessions(), fetchSubjects(), fetchAttendance()
      ]);
      setData({ users: u, sessions: se, subjects: su, attendance: a });
      setIsLoading(false);
    }
    loadAllData();
  }, [triggerRefresh]);

  const subjects = data.subjects.filter(s => s.teacherId === user.id);
  const activeSession = data.sessions.find(s => s.teacherId === user.id) || null;
  const sessionEnrolledStudents = data.users.filter(u => u.role === "student");
  const attendanceRecords = activeSession
    ? data.attendance.filter(a => a.sessionId === activeSession.id)
    : [];
  const effectiveSelectedSubjectId = selectedSubjectId || subjects[0]?.id || "";

  // Mock analytics data
  const chartData = [
    { name: "Mon", rate: 88 },
    { name: "Tue", rate: 92 },
    { name: "Wed", rate: 85 },
    { name: "Thu", rate: 94 },
    { name: "Fri", rate: 89 }
  ];

  const pieData = [
    { name: "Present", value: 18 },
    { name: "Late", value: 3 },
    { name: "Absent", value: 4 }
  ];
  const COLORS = ["#10b981", "#f5e04f", "#f43f5e"];

  // Periodic QR Code Refresh Logic
  useEffect(() => {
    if (!activeSession) return;
    let isMounted = true;

    // Helper function to update the token
    const updateQR = async (timestamp) => {
      const payloadInfo = await generateQrPayload(activeSession.id);
      if (isMounted) {
        setQrToken(payloadInfo.token);
        lastTimestampRef.current = timestamp;
      }
    };

    const interval = setInterval(() => {
      const sim = getSimulationState();
      const timeOffsetMs = sim.timeOffsetSeconds * 1000;
      const currentTimestamp = Date.now() + timeOffsetMs;

      // Calculate milliseconds left in the current rolling interval
      const msLeft = QR_WINDOW_MS - (currentTimestamp % QR_WINDOW_MS);
      const secondsLeft = (msLeft / 1000);
      setTimeLeft(secondsLeft);

      // Round down current timestamp to find the stable window boundary
      const windowTimestamp = Math.floor(currentTimestamp / QR_WINDOW_MS) * QR_WINDOW_MS;

      // Only regenerate when we cross into a new window timestamp
      if (windowTimestamp !== lastTimestampRef.current) {
        updateQR(windowTimestamp);
      }
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeSession?.id]);

  const handleStartSession = async () => {
    if (!effectiveSelectedSubjectId) return;
    const res = await startTeacherSession(user.id, effectiveSelectedSubjectId);
    if (res.success) {
      onTriggerRefresh();
    } else {
      alert(res.message);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    const res = await endTeacherSession(activeSession.id);
    if (res.success) {
      setQrToken("");
      onTriggerRefresh();
    }
  };

  const handleOverride = async (studentId, status) => {
    if (!activeSession) return;
    const res = await submitManualOverride(studentId, activeSession.id, status);
    if (res.success) {
      onTriggerRefresh();
    }
  };

  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-20">
        <Loader2 className="h-8 w-8 text-[#0e5b9e] animate-spin" />
      </div>
    );
  }

  // Compute live stats for dashboard cards
  const totalStudents = sessionEnrolledStudents.length;
  const presentCount = attendanceRecords.filter(r => r.status === "Present").length;
  const activeSubject = subjects.find(s => s.id === (activeSession ? activeSession.subjectId : effectiveSelectedSubjectId));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left max-w-7xl mx-auto py-2">
      {/* ================= LEFT SIDEBAR COLUMN ================= */}
      <div className="lg:col-span-1 space-y-4">
        {/* Teacher Academic Info Card */}
        <div className="juno-card">
          <h3 className="font-bold text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            Instructor Credentials
          </h3>

          <div className="space-y-3.5 text-xs">
            <div>
              <div className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase font-semibold">Instructor ID</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{user.id}</div>
            </div>

            <div>
              <div className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase font-semibold">Programme / Department</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">Department of Computer Science</div>
            </div>

            <div>
              <div className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase font-semibold">Designation</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">Associate Professor</div>
            </div>

            <div>
              <div className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase font-semibold">Email Address</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">{user.email}</div>
            </div>

            <div>
              <div className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase font-semibold">Active Broadcast Sessions</div>
              <div className={`font-bold mt-0.5 ${activeSession ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"}`}>
                {activeSession ? `Active (${activeSession.subjectId})` : "None (Idle)"}
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-2 text-center">
              <div className="p-2 bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <div className="text-[9px] text-zinc-450 uppercase font-semibold">Enrolled</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{activeSession ? totalStudents : "—"}</div>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <div className="text-[9px] text-zinc-450 uppercase font-semibold">Present</div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{activeSession ? presentCount : "—"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links Card */}
        <div className="juno-card">
          <h3 className="font-bold text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
            Quick Links
          </h3>
          <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mb-4">Open common instructor actions directly.</p>

          <div className="space-y-2 text-xs">
            <button
              onClick={() => {
                setIsControlsLoaded(true);
                document.getElementById("controls-card")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg font-semibold text-slate-800 dark:text-slate-200 text-left transition cursor-pointer"
            >
              <Play className="h-4 w-4 text-[#0e5b9e] dark:text-[#10b981]" />
              <span>Broadcast Controls</span>
            </button>

            <button
              onClick={() => {
                setIsAnalyticsLoaded(true);
                document.getElementById("analytics-card")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg font-semibold text-slate-800 dark:text-slate-200 text-left transition cursor-pointer"
            >
              <Eye className="h-4 w-4 text-[#0e5b9e] dark:text-[#10b981]" />
              <span>Roster Analytics</span>
            </button>

            <button
              onClick={() => {
                setIsRosterLoaded(true);
                document.getElementById("roster-card")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg font-semibold text-slate-800 dark:text-slate-200 text-left transition cursor-pointer"
            >
              <Users className="h-4 w-4 text-[#0e5b9e] dark:text-[#10b981]" />
              <span>Attendance Roster</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= RIGHT MAIN SECTION ================= */}
      <div className="lg:col-span-2 space-y-4">
        {/* Card 1: Broadcast Controls */}
        <div id="controls-card" className="juno-card">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Play className="h-4.5 w-4.5 text-[#0e5b9e] dark:text-[#10b981]" />
                <span>QR Broadcast Controls</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Select a class to activate live, rotating attendance verification.
              </p>
            </div>
            <button
              onClick={() => setIsControlsLoaded(!isControlsLoaded)}
              className="juno-btn-primary shrink-0"
            >
              {isControlsLoaded ? "Close" : "Load"}
            </button>
          </div>

          {isControlsLoaded && (
            <div className="mt-4 pt-4 border-t border-zinc-150 dark:border-zinc-800 animate-fade-in">
              {!activeSession ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-650 dark:text-slate-400 uppercase tracking-wider">
                      Select Subject & Class
                    </label>
                    <select
                      value={effectiveSelectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="w-full bg-slate-50 border border-zinc-300 dark:bg-zinc-950/80 dark:border-zinc-800 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0e5b9e] dark:focus:border-emerald-500 cursor-pointer"
                    >
                      {subjects.map(s => (
                        <option key={s.id} value={s.id} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">
                          {s.id} - {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {activeSubject && (
                    <div className="p-3 bg-slate-50 border border-zinc-200 dark:bg-zinc-950/40 dark:border-zinc-800 rounded-xl space-y-2 text-xs">
                      <div><span className="text-slate-500">Scheduled Time:</span> <span className="text-slate-800 dark:text-slate-350 font-semibold">{activeSubject.schedule}</span></div>
                      <div><span className="text-slate-500">Classroom Location:</span> <span className="text-slate-800 dark:text-slate-350 font-semibold">{activeSubject.room}</span></div>
                      <div><span className="text-slate-500">Authorized WiFi Subnet:</span> <span className="text-slate-800 dark:text-slate-350 font-mono font-semibold">{activeSubject.subnet}</span></div>
                    </div>
                  )}

                  <button
                    onClick={handleStartSession}
                    className="w-full py-2.5 bg-[#0e5b9e] hover:bg-[#004b87] text-white rounded-lg shadow-sm font-semibold text-xs cursor-pointer transition-all"
                  >
                    Start Attendance Broadcast
                  </button>
                </div>
              ) : (
                <div className="space-y-5 text-center flex flex-col items-center">
                  <div className="p-2 px-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-250 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs inline-flex items-center gap-1.5 font-semibold">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Broadcasting Live QR Codes ({activeSession.subjectId})</span>
                  </div>

                  {/* QR Code Canvas with Countdown */}
                  <div className="relative inline-block p-4 bg-white border border-zinc-200 rounded-2xl shadow-sm">
                    {qrToken ? (
                      <QRCodeSVG value={qrToken} size={300} level="M" marginSize={2} bgColor="#ffffff" fgColor="#020617" />
                    ) : (
                      <div className="h-[280px] w-[280px] bg-slate-200 rounded animate-pulse flex items-center justify-center text-xs text-slate-500">Generating payload...</div>
                    )}
                    {/* Countdown overlay circle indicator */}
                    <div className="absolute -bottom-3 -right-3 flex items-center justify-center bg-slate-900 border border-slate-850 rounded-full h-11 w-11 shadow-md text-xs font-mono font-bold text-emerald-400 select-none">
                      {timeLeft.toFixed(1)}s
                    </div>
                  </div>

                  <div className="w-full space-y-1.5 text-left border-t border-zinc-150 dark:border-zinc-800 pt-3">
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Raw Token Payload (Sniffer Debug View)</span>
                    <div className="text-[9px] break-all bg-slate-50 dark:bg-slate-950/60 p-2 border border-zinc-200 dark:border-zinc-800 rounded font-mono select-all text-slate-650 dark:text-slate-400">
                      {qrToken || "Loading..."}
                    </div>
                  </div>

                  <button
                    onClick={handleEndSession}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-sm font-semibold text-xs cursor-pointer transition-all"
                  >
                    Close Session & Lock QR
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card 2: Historical Analytics */}
        <div id="analytics-card" className="juno-card">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Eye className="h-4.5 w-4.5 text-[#0e5b9e] dark:text-[#10b981]" />
                <span>Historical Dashboard Analytics</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Visualizing weekly attendance trends and current session ratios.
              </p>
            </div>
            <button
              onClick={() => setIsAnalyticsLoaded(!isAnalyticsLoaded)}
              className="juno-btn-primary shrink-0"
            >
              {isAnalyticsLoaded ? "Close" : "Load"}
            </button>
          </div>

          {isAnalyticsLoaded && (
            <div className="mt-4 pt-4 border-t border-zinc-150 dark:border-zinc-800 space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Recharts Area Chart */}
                <div className="md:col-span-2 h-44">
                  <span className="text-[10px] text-zinc-450 uppercase font-semibold">Weekly Attendance Trends</span>
                  <ResponsiveContainer width="100%" height="90%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0e5b9e" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0e5b9e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#888" fontSize={10} tickLine={false} />
                      <YAxis stroke="#888" fontSize={10} tickLine={false} domain={[50, 100]} />
                      <Tooltip contentStyle={{ background: '#0e5b9e', color: 'white', border: 'none', borderRadius: '8px', fontSize: 10 }} />
                      <Area type="monotone" dataKey="rate" stroke="#0e5b9e" strokeWidth={2} fillOpacity={1} fill="url(#colorRate)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Recharts Pie Chart */}
                <div className="h-44 flex flex-col justify-center items-center">
                  <span className="text-[10px] text-zinc-450 uppercase font-semibold block mb-2">Today's Ratio</span>
                  <ResponsiveContainer width="100%" height="70%">
                    <PieChart>
                      <Pie data={pieData} innerRadius={22} outerRadius={36} paddingAngle={3} dataKey="value">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex gap-2 text-[8px] font-semibold text-zinc-400">
                    <span className="flex items-center gap-0.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>Pres</span>
                    <span className="flex items-center gap-0.5"><span className="h-1.5 w-1.5 rounded-full bg-yellow-400"></span>Late</span>
                    <span className="flex items-center gap-0.5"><span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>Abs</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card 3: Live Class Roster & Override */}
        <div id="roster-card" className="juno-card">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-[#0e5b9e] dark:text-[#10b981]" />
                <span>Live Class Roster & Override</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Real-time connection grid and manual attendance adjustments.
              </p>
            </div>
            <button
              onClick={() => setIsRosterLoaded(!isRosterLoaded)}
              className="juno-btn-primary shrink-0"
            >
              {isRosterLoaded ? "Close" : "Load"}
            </button>
          </div>

          {isRosterLoaded && (
            <div className="mt-4 pt-4 border-t border-zinc-150 dark:border-zinc-800 space-y-4 animate-fade-in">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Active Course: <span className="font-bold text-slate-800 dark:text-slate-200">{activeSession ? activeSession.subjectId : "None"}</span></span>
                {activeSession && (
                  <span className="px-2 py-0.5 bg-slate-50 border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 rounded font-medium">
                    Present: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{presentCount}</span> / Enrolled: <span className="text-slate-800 dark:text-slate-200">{totalStudents}</span>
                  </span>
                )}
              </div>

              {!activeSession ? (
                <div className="text-center py-10 text-zinc-450 text-xs">
                  Attendance roster is only available during an active live session. Select a subject and click "Start Attendance Broadcast" above.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-450 font-bold">
                        <th className="py-2 font-semibold">Student Name</th>
                        <th className="py-2 font-semibold">Device Status</th>
                        <th className="py-2 font-semibold">Roster Log</th>
                        <th className="py-2 font-semibold">IP Address Details</th>
                        <th className="py-2 font-semibold text-right">Manual Override</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionEnrolledStudents.map(student => {
                        const record = attendanceRecords.find(r => r.studentId === student.id);
                        const isRegistered = !!student.registeredFingerprint;

                        let statusBadge = (
                          <span className="px-2 py-0.5 bg-slate-50 text-slate-400 border border-zinc-200 rounded-full font-semibold text-[10px] dark:bg-zinc-950 dark:border-zinc-800">
                            Not Scanned
                          </span>
                        );

                        if (record) {
                          if (record.status === "Present") {
                            statusBadge = (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-semibold text-[10px] dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30">
                                Present
                              </span>
                            );
                          } else if (record.status === "Late") {
                            statusBadge = (
                              <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-250 rounded-full font-semibold text-[10px] dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-900/30">
                                Late
                              </span>
                            );
                          }
                        }

                        return (
                          <tr key={student.id} className="border-b border-zinc-150 dark:border-zinc-900/40 hover:bg-slate-50 dark:hover:bg-zinc-900/10">
                            <td className="py-2.5">
                              <div className="font-bold text-slate-800 dark:text-slate-200">{student.name}</div>
                              <div className="text-[9px] text-zinc-450 font-mono">{student.id}</div>
                            </td>
                            <td className="py-2.5">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${isRegistered
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/20"
                                : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/20"
                                }`}>
                                {isRegistered ? "Device Linked" : "No Device"}
                              </span>
                            </td>
                            <td className="py-2.5">{statusBadge}</td>
                            <td className="py-2.5 font-mono text-[9px] text-slate-500">
                              {record ? (
                                <div>
                                  <div>IP: {record.ipAddress}</div>
                                  <div className="text-[8px] opacity-75">Via {record.method}</div>
                                </div>
                              ) : (
                                <span>—</span>
                              )}
                            </td>
                            <td className="py-2.5 text-right">
                              <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-0.5 gap-0.5">
                                <button
                                  onClick={() => handleOverride(student.id, "Present")}
                                  className={`px-2 py-1 rounded text-[9px] font-bold cursor-pointer transition ${record && record.status === "Present"
                                    ? "bg-[#0e5b9e] text-white shadow-xs"
                                    : "text-zinc-500 hover:text-slate-800 dark:hover:text-slate-200"
                                    }`}
                                >
                                  Pres
                                </button>
                                <button
                                  onClick={() => handleOverride(student.id, "Late")}
                                  className={`px-2 py-1 rounded text-[9px] font-bold cursor-pointer transition ${record && record.status === "Late"
                                    ? "bg-yellow-500 text-slate-950 shadow-xs"
                                    : "text-zinc-500 hover:text-slate-800 dark:hover:text-slate-200"
                                    }`}
                                >
                                  Late
                                </button>
                                <button
                                  onClick={() => handleOverride(student.id, "Absent")}
                                  className={`px-2 py-1 rounded text-[9px] font-bold cursor-pointer transition ${!record
                                    ? "bg-rose-600 text-white shadow-xs"
                                    : "text-zinc-500 hover:text-slate-800 dark:hover:text-slate-200"
                                    }`}
                                >
                                  Abs
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}