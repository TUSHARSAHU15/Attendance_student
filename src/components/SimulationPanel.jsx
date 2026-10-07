import { useState, useEffect } from "react";
import { getSimulationState, saveSimulationState, QR_WINDOW_MS } from "../state/db";
import { Terminal, Shield, Cpu, RefreshCw, X, Radio, Mail, ExternalLink, Trash2 } from "lucide-react";

export default function SimulationPanel({ onUpdate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [clientIp, setClientIp] = useState("192.168.1.45");
  const [timeOffset, setTimeOffset] = useState(0);
  const [activeSessionToken, setActiveSessionToken] = useState("");
  const [spoofFingerprint, setSpoofFingerprint] = useState(false);
  const [sandboxEmails, setSandboxEmails] = useState(() => {
    try {
      const raw = localStorage.getItem("sat_sandbox_emails");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleEmail = (e) => {
      if (e.detail) {
        setSandboxEmails(prev => [e.detail, ...prev.filter(m => m.id !== e.detail.id).slice(0, 19)]);
      }
    };
    window.addEventListener("sat_sandbox_email", handleEmail);
    return () => window.removeEventListener("sat_sandbox_email", handleEmail);
  }, []);

  useEffect(() => {
    const sim = getSimulationState();
    if (sim.clientIp) setClientIp(sim.clientIp);
    if (sim.timeOffsetSeconds) setTimeOffset(sim.timeOffsetSeconds);
    if (sim.fingerprintOverride) setSpoofFingerprint(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const sim = getSimulationState();
      const timeOffsetMs = (sim.timeOffsetSeconds || 0) * 1000;
      const currentTimestamp = Date.now() + timeOffsetMs;
      const windowTimestamp = Math.floor(currentTimestamp / QR_WINDOW_MS) * QR_WINDOW_MS;
      const payload = {
        sid: "diag",
        ts: windowTimestamp,
        x: "diag"
      };
      setActiveSessionToken(btoa(JSON.stringify(payload)));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const applySettings = (newIp, newOffset, spoofBio) => {
    const sim = {
      clientIp: newIp,
      timeOffsetSeconds: parseInt(newOffset) || 0,
      fingerprintOverride: spoofBio ? "spoofed_signature_mismatch" : ""
    };
    saveSimulationState(sim);
    if (onUpdate) onUpdate();
  };

  const handleIpChange = (ip) => {
    setClientIp(ip);
    applySettings(ip, timeOffset, spoofFingerprint);
  };

  const handleOffsetChange = (offset) => {
    setTimeOffset(offset);
    applySettings(clientIp, offset, spoofFingerprint);
  };

  const handleFingerprintToggle = (e) => {
    const checked = e.target.checked;
    setSpoofFingerprint(checked);
    applySettings(clientIp, timeOffset, checked);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-full shadow-lg cursor-pointer transition-all duration-300 transform hover:scale-105"
      >
        <Terminal className="h-5 w-5 animate-pulse" />
        <span className="font-semibold text-sm">Simulation Panel</span>
        {sandboxEmails.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-amber-400 text-slate-950 font-bold rounded-full">
            {sandboxEmails.length}
          </span>
        )}
      </button>

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 z-40 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out transform ${isOpen ? "translate-x-0" : "translate-x-full"
          } flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <div className="flex items-center gap-2 text-emerald-400">
            <Shield className="h-5 w-5" />
            <h2 className="font-bold text-lg text-slate-100">Security Sandbox</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contents */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm">
          <p className="text-xs text-slate-400 leading-relaxed">
            Use these controls to simulate hacking attempts (e.g. screenshot sharing, location spoofing) and test the system's defenses.
          </p>

          {/* 1. Client IP / Subnet */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider">
              Simulate Client IP (Location)
            </label>
            <div className="space-y-1.5">
              <button
                onClick={() => handleIpChange("192.168.1.45")}
                className={`w-full text-left px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all duration-200 ${clientIp === "192.168.1.45"
                    ? "bg-emerald-950/50 border-emerald-500 text-emerald-200"
                    : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
              >
                <div className="font-medium">Classroom Wi-Fi (Subnet A)</div>
                <div className="text-[10px] opacity-75">IP: 192.168.1.45 (Expected for CS-101/103)</div>
              </button>

              <button
                onClick={() => handleIpChange("10.0.0.8")}
                className={`w-full text-left px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all duration-200 ${clientIp === "10.0.0.8"
                    ? "bg-emerald-950/50 border-emerald-500 text-emerald-200"
                    : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
              >
                <div className="font-medium">Classroom Wi-Fi (Subnet B)</div>
                <div className="text-[10px] opacity-75">IP: 10.0.0.8 (Expected for CS-102)</div>
              </button>

              <button
                onClick={() => handleIpChange("73.12.84.10")}
                className={`w-full text-left px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all duration-200 ${clientIp === "73.12.84.10"
                    ? "bg-emerald-950/50 border-emerald-500 text-emerald-200"
                    : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
              >
                <div className="font-medium">Home Network (External)</div>
                <div className="text-[10px] opacity-75">IP: 73.12.84.10 (Triggers subnet failure)</div>
              </button>

              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs">
                  IP:
                </span>
                <input
                  type="text"
                  value={clientIp}
                  onChange={(e) => handleIpChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950/50 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  placeholder="Enter custom IP"
                />
              </div>
            </div>
          </div>

          {/* 2. Clock Drift (TTL Control) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider">
              Clock Offset (TTL Expiry)
            </label>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Simulated Offset:</span>
                <span className={`font-mono px-2 py-0.5 rounded ${timeOffset === 0 ? "text-emerald-400 bg-emerald-950/30" : "text-rose-400 bg-rose-950/30"
                  }`}>
                  {timeOffset === 0 ? "Perfect Sync (0s)" : `${timeOffset > 0 ? "+" : ""}${timeOffset} seconds`}
                </span>
              </div>
              <input
                type="range"
                min="-15"
                max="15"
                value={timeOffset}
                onChange={(e) => handleOffsetChange(e.target.value)}
                className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleOffsetChange(0)}
                  className="flex-1 py-1 text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer transition"
                >
                  Sync (0s)
                </button>
                <button
                  onClick={() => handleOffsetChange(10)}
                  className="flex-1 py-1 text-[10px] font-semibold bg-rose-950/40 hover:bg-rose-900/30 text-rose-300 border border-rose-900/40 rounded cursor-pointer transition"
                >
                  +10s (Expired QR)
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                QR tokens expire after {(QR_WINDOW_MS / 1000).toFixed(0)} seconds. Setting drift to +10s simulates scanning a shared screenshot later in time.
              </p>
            </div>
          </div>

          {/* 3. Device Fingerprint Spoof */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider">
              Device Fingerprint Spoof
            </label>
            <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-800 bg-slate-950/40 text-xs text-slate-300 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={spoofFingerprint}
                onChange={handleFingerprintToggle}
                className="rounded accent-emerald-500 h-4 w-4"
              />
              <div>
                <div className="font-medium text-slate-200">Spoof Device Fingerprint</div>
                <div className="text-[10px] text-slate-400">Simulates account sharing from an unregistered device</div>
              </div>
            </label>
          </div>

          {/* 4. Diagnostics Feed */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
              <Cpu className="h-3.5 w-3.5" /> Live Diagnostic Feed
            </label>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2 text-xs font-mono text-slate-300 select-all">
              <div>
                <span className="text-slate-500">Client IP:</span>{" "}
                <span className="text-emerald-400">{clientIp}</span>
              </div>
              <div className="border-t border-slate-900 pt-2 mt-1">
                <span className="text-slate-500">Local Time Offset:</span>{" "}
                <span className="text-slate-300">{timeOffset}s</span>
              </div>
              <div className="border-t border-slate-900 pt-2 mt-1">
                <span className="text-slate-500">Biometric:</span>{" "}
                <span className="text-emerald-400">WebAuthn (cannot be spoofed)</span>
              </div>
              {activeSessionToken ? (
                <div className="space-y-1">
                  <div className="text-slate-500 border-t border-slate-900 pt-2 mt-1">Active QR Payload Token:</div>
                  <div className="text-[10px] break-all bg-slate-900/60 p-1.5 border border-slate-800 rounded select-all text-slate-400 hover:text-slate-200 transition">
                    {activeSessionToken}
                  </div>
                  <div className="text-[9px] text-slate-500 italic">Pasting this mimics sending raw intercepted network data.</div>
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 border-t border-slate-900 pt-2 mt-1">
                  No active session to sniff token payloads.
                </div>
              )}
            </div>
          </div>

          {/* 5. Email Sandbox (Mail Catcher) */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email Sandbox ({sandboxEmails.length})
              </label>
              {sandboxEmails.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("sat_sandbox_emails");
                    setSandboxEmails([]);
                  }}
                  className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
              )}
            </div>

            {sandboxEmails.length === 0 ? (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-500 text-center">
                No simulated emails caught yet. Request a password reset to see it captured here!
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {sandboxEmails.map((mail) => (
                  <div
                    key={mail.id || mail.token}
                    className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1.5 hover:border-emerald-500/40 transition"
                  >
                    <div className="flex justify-between items-start text-[10px]">
                      <span className="font-semibold text-emerald-400 truncate max-w-[170px]">{mail.to}</span>
                      <span className="text-slate-500 font-mono text-[9px]">
                        {new Date(mail.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 line-clamp-1">{mail.subject}</div>
                    <a
                      href={mail.resetLink}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline pt-0.5"
                    >
                      <span>Open Reset Link</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Radio className="h-3 w-3 text-emerald-500 animate-ping" />
            <span>Sandbox Listening</span>
          </div>
          <button
            onClick={() => {
              saveSimulationState({ clientIp: "192.168.1.45", timeOffsetSeconds: 0, fingerprintOverride: "" });
              setClientIp("192.168.1.45");
              setTimeOffset(0);
              setSpoofFingerprint(false);
              if (onUpdate) onUpdate();
            }}
            className="flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded cursor-pointer transition"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Reset DB Settings</span>
          </button>
        </div>
      </div>
    </>
  );
}
