import { useState, useEffect, useRef } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import {
  fetchUsers, fetchSessions, fetchSubjects, fetchAttendance,
  getSimulationState,
  registerStudentDevice,
  verifyAndSubmitAttendance,
  isWebAuthnSupported
} from "../state/db";
import { Laptop, ScanLine, Clock, MapPin, History, CheckCircle2, AlertTriangle, User, Calendar, UserCheck, Loader2 } from "lucide-react";

export default function StudentDashboard({ user, onTriggerRefresh, triggerRefresh }) {
  const [data, setData] = useState({ users: [], sessions: [], subjects: [], attendance: [] });
  const [simState, setSimState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const scannerControlsRef = useRef(null);
  const scannerStatusAtRef = useRef(0);
  
  const [manualToken, setManualToken] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [isCameraScanning, setIsCameraScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scannerStatus, setScannerStatus] = useState("Camera idle.");

  // JUNO Interactive Load States
  const [isScannerLoaded, setIsScannerLoaded] = useState(false);
  const [isDeviceLoaded, setIsDeviceLoaded] = useState(false);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);

  useEffect(() => {
    async function loadAllData() {
      setIsLoading(true);
      const [u, se, su, a] = await Promise.all([
        fetchUsers(), fetchSessions(), fetchSubjects(), fetchAttendance()
      ]);
      setData({ users: u, sessions: se, subjects: su, attendance: a });
      setSimState(getSimulationState());
      setIsLoading(false);
    }
    loadAllData();
  }, [triggerRefresh]);

  const currentUser = data.users.find(u => u.id === user.id) ?? user;
  
  const activeSessionBase = data.sessions.length > 0
    ? [...data.sessions].sort((a, b) => {
      const aTime = a.createdAt ?? a.startedAt ?? 0;
      const bTime = b.createdAt ?? b.startedAt ?? 0;
      return bTime - aTime;
    })[0]
    : null;
    
  const activeSession = activeSessionBase
    ? (() => {
      const subject = data.subjects.find(s => s.id === activeSessionBase.subjectId);
      return {
        ...activeSessionBase,
        subjectName: subject ? subject.name : "Unknown",
        subjectCode: subject ? subject.id : "",
        subnet: subject ? subject.subnet : ""
      };
    })()
    : null;

  const attendanceHistory = data.attendance
    .filter(a => a.studentId === user.id)
    .sort((a, b) => b.timestamp - a.timestamp);

  const handleRegisterDevice = async () => {
    const res = await registerStudentDevice(currentUser.id);
    if (res.success) {
      onTriggerRefresh();
    } else {
      alert(res.message);
    }
  };

  const handleScanSubmit = async (tokenToScan) => {
    if (!tokenToScan) {
      alert("No token payload found to scan.");
      return;
    }

    const result = await verifyAndSubmitAttendance(currentUser.id, tokenToScan);
    setScanResult({
      success: result.success,
      message: result.message
    });
    setScannerStatus(result.message);

    setManualToken("");
    onTriggerRefresh();

    setTimeout(() => {
      setScanResult(null);
    }, 6000);
  };

  function stopCameraScanner() {
    if (scannerControlsRef.current) {
      scannerControlsRef.current.stop();
      scannerControlsRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraScanning(false);
    setScannerStatus("Camera idle.");
  }

  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, []);

  const startCameraScanner = async () => {
    setCameraError("");
    setScannerStatus("Opening camera...");

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Live camera access is not available in this browser. Use the phone camera fallback below.");
      setScannerStatus("Camera unavailable.");
      return;
    }

    try {
      setIsCameraScanning(true);
      await new Promise(resolve => requestAnimationFrame(resolve));

      if (!videoRef.current) {
        throw new Error("Scanner video element is not ready");
      }

      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      hints.set(DecodeHintType.ALSO_INVERTED, true);

      const codeReader = new BrowserQRCodeReader(hints, {
        delayBetweenScanAttempts: 60,
        delayBetweenScanSuccess: 300,
        tryPlayVideoTimeout: 7000
      });
      setScannerStatus("Camera ready. Center the teacher QR inside the box.");

      scannerControlsRef.current = await codeReader.decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        },
        videoRef.current,
        (result, _error, controls) => {
          if (!result) {
            const now = Date.now();
            if (now - scannerStatusAtRef.current > 1800) {
              scannerStatusAtRef.current = now;
              setScannerStatus("Scanning... move closer and keep the QR flat in the frame.");
            }
            return;
          }

          const scannedToken = result.getText().trim();
          setScannerStatus("QR detected. Verifying attendance...");
          controls.stop();
          scannerControlsRef.current = null;
          setIsCameraScanning(false);
          handleScanSubmit(scannedToken);
        }
      );
    } catch {
      stopCameraScanner();
      setCameraError("Live camera could not open. Use HTTPS, allow camera permission, or tap the phone camera fallback below.");
      setScannerStatus("Camera stopped.");
    }
  };

  const handleImageQrUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setCameraError("");
    setScannerStatus("Reading captured QR image...");
    let imageUrl = "";

    try {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      const codeReader = new BrowserQRCodeReader(hints);
      imageUrl = URL.createObjectURL(file);
      const result = await codeReader.decodeFromImageUrl(imageUrl);
      setScannerStatus("QR image decoded. Verifying attendance...");
      handleScanSubmit(result.getText().trim());
    } catch {
      setCameraError("Could not read a QR code from that camera image. Retake it with the QR centered and in focus.");
      setScannerStatus("Camera image did not contain a readable QR.");
    } finally {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-20">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const isDeviceBound = !!currentUser.registeredFingerprint;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left max-w-7xl mx-auto py-2">
      {/* ================= LEFT SIDEBAR COLUMN ================= */}
      <div className="lg:col-span-1 space-y-4">
        {/* Student Academic Info Card */}
        <div className="juno-card">
          <h3 className="font-bold text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            Student Credentials
          </h3>

          <div className="space-y-3.5 text-xs">
            <div>
              <div className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase font-semibold">Enrollment No</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{currentUser.id}</div>
            </div>

            <div>
              <div className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase font-semibold">Programme</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">(L) BCA0100 - Computer Applications</div>
            </div>

            <div>
              <div className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase font-semibold">Semester</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">2024-2028-SP26 SEM IV</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase font-semibold">Division</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">Sec-B</div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase font-semibold">Batch</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">2024 - 2028</div>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase font-semibold">Unique ID</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">BCA/40051/24</div>
            </div>

            <div>
              <div className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase font-semibold">Biometric Status</div>
              <div className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                {currentUser.registeredFingerprint ? "Bound to this device" : "Not registered"}
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => {
                  setIsDeviceLoaded(true);
                  document.getElementById("device-card")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="juno-btn-secondary w-full text-center"
              >
                Register Biometric
              </button>
            </div>
          </div>
        </div>

        {/* Quick Links Card */}
        <div className="juno-card">
          <h3 className="font-bold text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
            Quick Links
          </h3>
          <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mb-4">Open common student actions directly.</p>

          <div className="space-y-2 text-xs">
            <button
              onClick={() => {
                setIsDeviceLoaded(true);
                document.getElementById("device-card")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg font-semibold text-slate-800 dark:text-slate-200 text-left transition cursor-pointer"
            >
              <User className="h-4 w-4 text-emerald-500" />
              <span>Verify Profile Fingerprint</span>
            </button>

            <button
              onClick={() => {
                setIsScannerLoaded(true);
                document.getElementById("scanner-card")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg font-semibold text-slate-800 dark:text-slate-200 text-left transition cursor-pointer"
            >
              <ScanLine className="h-4 w-4 text-emerald-500" />
              <span>Attendance QR Scan Portal</span>
            </button>

            <button
              onClick={() => {
                setIsHistoryLoaded(true);
                document.getElementById("history-card")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg font-semibold text-slate-800 dark:text-slate-200 text-left transition cursor-pointer"
            >
              <Calendar className="h-4 w-4 text-emerald-500" />
              <span>View Roster Log History</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= RIGHT MAIN SECTION ================= */}
      <div className="lg:col-span-2 space-y-4">
        {/* Card 1: Dynamic QR Code Scanner */}
        <div id="scanner-card" className="juno-card">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <ScanLine className="h-4.5 w-4.5 text-[#0e5b9e] dark:text-[#10b981]" />
                <span>Class Attendance Scanner</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Mark attendance for the current classroom session. Decodes dynamic QR coordinates.
              </p>
            </div>
            <button
              onClick={() => setIsScannerLoaded(!isScannerLoaded)}
              className="juno-btn-primary shrink-0"
            >
              {isScannerLoaded ? "Close" : "Load"}
            </button>
          </div>

          {isScannerLoaded ? (
            <div className="mt-4 pt-4 border-t border-zinc-150 dark:border-zinc-800 space-y-4 animate-fade-in">
              {scanResult && (
                <div className={`p-4 rounded-xl text-xs flex gap-3 ${scanResult.success
                  ? "bg-emerald-50 dark:glass-emerald text-emerald-800 dark:text-emerald-200 border border-emerald-250"
                  : "bg-rose-50 dark:glass-rose text-rose-800 dark:text-rose-200 border border-rose-250"
                  }`}>
                  {scanResult.success ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
                  )}
                  <div>
                    <h4 className="font-bold mb-0.5">{scanResult.success ? "Verification Success" : "Security Blocked"}</h4>
                    <p>{scanResult.message}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Viewfinder simulation */}
                <div className="relative h-60 bg-slate-950 border border-slate-900 rounded-xl overflow-hidden flex flex-col justify-center items-center text-center p-4">
                  <div className="absolute inset-4 border border-dashed border-slate-800 rounded-lg pointer-events-none"></div>
                  <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-emerald-500"></div>
                  <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-emerald-500"></div>
                  <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-emerald-500"></div>
                  <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-emerald-500"></div>
                  <div className="absolute left-6 right-6 h-0.5 bg-rose-500 opacity-60 animate-scan-line pointer-events-none"></div>

                  {activeSession ? (
                    <div className="space-y-4 z-10">
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full inline-flex items-center justify-center animate-pulse">
                        <ScanLine className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs text-slate-200">Active Classroom QR Found</h4>
                        <p className="text-[10px] text-emerald-400 font-medium font-mono">{activeSession.subjectCode} - {activeSession.subjectName}</p>
                      </div>
                      <button
                        onClick={isCameraScanning ? stopCameraScanner : startCameraScanner}
                        className="px-4 py-2 text-xs font-semibold rounded-lg shadow transition cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse"
                      >
                        {isCameraScanning ? "Stop Camera" : "Open Camera Scanner"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 z-10 text-slate-500">
                      <ScanLine className="h-8 w-8 mx-auto stroke-1" />
                      <p className="text-xs">No active attendance session broadcast in range.</p>
                      <p className="text-[10px] opacity-75">Start a session in the Teacher portal to begin.</p>
                    </div>
                  )}
                </div>

                {/* Subnet details & manual payload */}
                <div className="space-y-4 text-xs font-sans text-slate-600 dark:text-zinc-400">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">Phone camera scanner:</h4>
                    <div className="relative h-44 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                      <video
                        ref={videoRef}
                        className={`h-full w-full object-cover ${isCameraScanning ? "block" : "hidden"}`}
                        playsInline
                        muted
                      />
                      {!isCameraScanning && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center text-slate-500">
                          <ScanLine className="h-8 w-8 stroke-1" />
                          <p>Tap Open Camera Scanner, then point at the teacher QR.</p>
                        </div>
                      )}
                      {isCameraScanning && (
                        <>
                          <div className="absolute inset-6 rounded-lg border border-dashed border-emerald-400/70 pointer-events-none"></div>
                          <div className="absolute left-8 right-8 top-1/2 h-0.5 bg-rose-500/80 animate-scan-line pointer-events-none"></div>
                        </>
                      )}
                    </div>
                    <button
                      onClick={isCameraScanning ? stopCameraScanner : startCameraScanner}
                      className="juno-btn-primary w-full"
                    >
                      {isCameraScanning ? "Stop Camera" : "Open Camera Scanner"}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageQrUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="juno-btn-secondary w-full"
                    >
                      Open Phone Camera Fallback
                    </button>
                    <div className="rounded-lg border border-slate-200 bg-white/40 p-2.5 text-[10px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                      {scannerStatus}
                    </div>
                    {!activeSession && (
                      <p className="text-[10px] leading-relaxed text-amber-700 dark:text-amber-300">
                        No active teacher broadcast is running yet. The camera can open, but attendance will only submit after a teacher starts a QR session.
                      </p>
                    )}
                    {cameraError && (
                      <div className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                        {cameraError}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">Location constraints:</h4>
                    <div className="space-y-1.5 font-sans">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                        <span>Room Location: <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{activeSession ? activeSession.room : "N/A"}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                        <span>Subnet Subnet Limit: <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{activeSession ? activeSession.subnet : "N/A"}</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-zinc-150 dark:border-zinc-800 pt-3 space-y-2">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">Simulate Token Capture Injection</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Paste base64 token..."
                        value={manualToken}
                        onChange={(e) => setManualToken(e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded px-2.5 py-1.5 font-mono text-[10px] text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={() => handleScanSubmit(manualToken)}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded font-semibold transition cursor-pointer"
                      >
                        Inject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              Click Load to fetch today's active camera scanning viewport.
            </p>
          )}
        </div>

        {/* Card 2: Biometric Registration */}
        <div id="device-card" className="juno-card">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Laptop className="h-4.5 w-4.5 text-[#0e5b9e] dark:text-[#10b981]" />
                <span>Biometric Device Registration</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Register your device biometric (Touch ID / Face ID) to prevent proxy attendance.
              </p>
            </div>
            <button
              onClick={() => setIsDeviceLoaded(!isDeviceLoaded)}
              className="juno-btn-primary shrink-0"
            >
              {isDeviceLoaded ? "Close" : "Load"}
            </button>
          </div>

          {isDeviceLoaded ? (
            <div className="mt-4 pt-4 border-t border-zinc-150 dark:border-zinc-800 space-y-4 animate-fade-in">
              {!isWebAuthnSupported() ? (
                <div className="p-3 bg-rose-50 border border-rose-250 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 rounded-lg flex gap-2">
                  <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
                  <p className="leading-relaxed">
                    WebAuthn is not supported on this device. Biometric registration requires a device with Touch ID, Face ID, or a security key.
                  </p>
                </div>
              ) : isDeviceBound ? (
                <div className="space-y-3.5 text-xs">
                  <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400 rounded-lg">
                    <UserCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                    <span>Biometric Registered & Ready</span>
                  </div>

                  <div>
                    <div className="text-[10px] text-zinc-500">Credential ID:</div>
                    <div className="font-mono bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-2 rounded text-slate-800 dark:text-emerald-400 select-all mt-1 text-[10px] break-all">
                      {currentUser.registeredFingerprint}
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Your device biometric is registered. When you scan a QR code, your phone will prompt for Touch ID / Face ID to verify your identity.
                  </p>

                  <button
                    onClick={handleRegisterDevice}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-sm font-semibold text-xs cursor-pointer transition-all"
                  >
                    Re-register Biometric
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5 text-xs">
                  <div className="p-3 bg-amber-50 border border-amber-250 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400 rounded-lg flex gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                    <p className="leading-relaxed">
                      Biometric registration is required. This ensures only you can mark attendance from this device.
                    </p>
                  </div>

                  <button
                    onClick={handleRegisterDevice}
                    className="juno-btn-primary w-full"
                  >
                    Register Device Biometric
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              Click Load to set up biometric authentication.
            </p>
          )}
        </div>

        {/* Card 3: Academic Attendance History */}
        <div id="history-card" className="juno-card">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <History className="h-4.5 w-4.5 text-[#0e5b9e] dark:text-[#10b981]" />
                <span>Attendance Log Registry</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                View completed attendance records from active courses.
              </p>
            </div>
            <button
              onClick={() => setIsHistoryLoaded(!isHistoryLoaded)}
              className="juno-btn-primary shrink-0"
            >
              {isHistoryLoaded ? "Close" : "Load"}
            </button>
          </div>

          {isHistoryLoaded ? (
            <div className="mt-4 pt-4 border-t border-zinc-150 dark:border-zinc-800 animate-fade-in">
              {attendanceHistory.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs font-sans">
                  No verified attendance scans found in the database.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                        <th className="py-2.5 font-semibold">Subject</th>
                        <th className="py-2.5 font-semibold">Status</th>
                        <th className="py-2.5 font-semibold">Scan IP</th>
                        <th className="py-2.5 font-semibold">Verification Method</th>
                        <th className="py-2.5 font-semibold text-right">Time Logged</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceHistory.map(item => (
                        <tr key={item.id} className="border-b border-zinc-100 dark:border-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900/20">
                          <td className="py-3 font-semibold">
                            <div>{item.subjectName}</div>
                            <div className="text-[10px] text-zinc-500 font-mono font-medium">{item.subjectId}</div>
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-450 border border-emerald-250 dark:border-emerald-900/30 rounded-full font-medium">
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 font-mono text-[10px]">{item.ipAddress}</td>
                          <td className="py-3 text-zinc-500 dark:text-zinc-400">{item.method}</td>
                          <td className="py-3 text-right font-mono text-[10px]">
                            {new Date(item.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              Click Load to fetch historical logs.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}