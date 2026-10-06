# PHASES.md — Roster-Gate

## Build Phases

### Phase 0 — Project Initialization
**Status:** Done  
**Date:** 2026-07-13

- Scaffolded Vite + React 19 project
- Installed dependencies:
  - `@supabase/supabase-js` — database & auth client
  - `qrcode.react` — QR code generation (QRCodeSVG)
  - `@zxing/browser` + `@zxing/library` — QR code scanning via camera
  - `recharts` — AreaChart & PieChart for analytics
  - `lucide-react` — icon system
  - `@emailjs/browser` — password reset emails
- Installed Tailwind CSS v4 with `@tailwindcss/vite` plugin (no PostCSS config)
- Created directory structure: `src/{components,state,assets}`
- Created `.env` with Supabase and EmailJS credential placeholders
- Created `supabaseClient.js` (client initialization)
- Created `db.js` (core state machine skeleton)

### Phase 1 — Authentication & Database
**Status:** Done  
**Date:** 2026-07-13

- Implemented Supabase client initialization with anon key
- Created `Login.jsx` — email/password form with validation, error handling, loading state
- Built `App.jsx` with:
  - Auth state management (user, view, loading)
  - Role-based view switching: login, forgotPassword, student, teacher, admin
  - Logout handler clearing session
  - SimulationPanel rendered for all authenticated views
- Configured view switching logic in App.jsx (no react-router)
- Added password visibility toggle in login form

### Phase 2 — Student Portal
**Status:** Done  
**Date:** 2026-07-13

- Created `StudentDashboard.jsx` with three collapsible sections:
  - **Biometric Device Registration**: WebAuthn `navigator.credentials.create()` flow, credential ID display, status badge (Bound/Unbound), error handling for unsupported browsers
  - **Class Attendance Scanner**: `@zxing/browser` camera scanning, animated viewfinder with scan line, manual token injection fallback, real-time verification feedback
  - **Attendance Log Registry**: Table with subject, status (Present/Late/Absent badges), IP, method, timestamp
- Implemented device fingerprint binding: stores WebAuthn credential ID in `users.registeredFingerprint`
- Added fingerprint verification on attendance submission
- Sidebar with student credentials (enrollment, programme, semester) and quick links

### Phase 3 — Teacher Portal
**Status:** Done  
**Date:** 2026-07-13

- Created `TeacherDashboard.jsx` with three collapsible sections:
  - **QR Broadcast Controls**: Subject selector dropdown, Start/End Session buttons, live QRCodeSVG with 15-second countdown timer overlay, session status indicator
  - **Historical Analytics**: AreaChart (attendance trends over time, mocked data), PieChart (present/late/absent ratio)
  - **Live Class Roster**: Grid/table of all enrolled students with real-time attendance status, manual override buttons (Present/Late/Absent) per student
- Implemented dynamic QR generation: `generateQrToken(sessionId)` called every 15s via `setInterval`
- QR payload: base64-encoded `{ sessionId, timestamp, salt }`
- Session management: create/end sessions in Supabase `sessions` table

### Phase 4 — Admin Portal
**Status:** Done  
**Date:** 2026-07-13

- Created `AdminDashboard.jsx` with four collapsible sections:
  - **Add New User**: Form with name, email, role (student/teacher), password, enrollment/programme (students only), inserts into `users` table
  - **Student Device Registry**: Table of all students with bind status (green/gray dot), Unbind button (clears `registeredFingerprint`), Delete button
  - **System Security Logs**: Scrollable table with level badges (INFO=blue, WARN=yellow, CRITICAL=red), message, timestamp, expandable details
  - **Danger Zone**: Factory Reset button with confirmation modal — wipes `attendance`, `sessions`, `audit_logs`, clears all `registeredFingerprint` fields
- Role-based user management (CRUD operations on `users` table)
- Audit log pagination/virtualization for performance

### Phase 5 — Security Engine
**Status:** Done  
**Date:** 2026-07-13

- Implemented core validation functions in `db.js`:
  - `generateQrToken(sessionId)` — creates cryptographically random salt + timestamp, base64 encodes
  - `verifyQrToken(token)` — decodes base64, validates JSON structure, checks session exists
  - `verifySubnet(clientIP, subnet)` — prefix matching (e.g., `192.168.1.*` matches `192.168.1.45`)
  - `verifyFingerprint(credentialId, userId)` — WebAuthn assertion via `navigator.credentials.get()`
  - `verifyAndSubmitAttendance(...)` — orchestrates full pipeline: QR decode → session lookup → biometric → QR age (30s tolerance) → subnet → duplicate check → insert attendance + audit log
  - `insertAuditLog(level, message, details)` — structured logging to `audit_logs` table
- QR_WINDOW_MS = 15000 (15-second rotation)
- Validation tolerance = 2 * QR_WINDOW_MS = 30000ms (30 seconds)

### Phase 6 — Simulation Sandbox
**Status:** Done  
**Date:** 2026-07-13

- Created `SimulationPanel.jsx` as floating bottom-right panel:
  - **IP Spoof Controls**: 4 presets (Classroom Wi-Fi A: 192.168.1.45, Subnet B: 192.168.2.10, Home Network: 73.12.84.10, Custom input), radio selection
  - **Clock Offset**: Slider -15s to +15s, step 1s, displays current offset, feeds into QR age validation
  - **Live Diagnostic Feed**: Real-time display of simulated IP, clock offset, biometric status, active QR token (monospace, copyable)
  - **Biometric Spoof**: Checkbox to simulate fingerprint mismatch
  - State persists in `localStorage` under key `sat_simulation`
  - Reset to Defaults button clears simulation state

### Phase 7 — Password Reset
**Status:** Done  
**Date:** 2026-07-23

- Created `ForgotPassword.jsx` with 3-step wizard:
  1. **Request**: Email input → calls `sendResetCode(email)` → generates 6-digit code, stores in `password_resets` with 10-min TTL, sends via EmailJS
  2. **Verify**: 6-digit code input (auto-focus each digit) + new password + confirm → calls `verifyResetCode(email, code)` → validates code, expiry, not used
  3. **Success**: Confirmation message with back-to-login button
- Backend functions in `db.js`:
  - `sendResetCode(email)` — inserts code, calls EmailJS `send()` with template variables
  - `verifyResetCode(email, code)` — checks code matches, not expired, not used
  - `updatePassword(email, newPassword)` — updates `users.password`, marks reset code as used
- EmailJS template variables: `to_email`, `reset_code`, `app_name`

### Phase 8 — Polish & Error States
**Status:** Done  
**Date:** 2026-07-23

- Added loading spinners on all async operations (login, registration, scanning, QR generation, password reset)
- Implemented error banners with descriptive messages and dismiss actions
- Added empty states for no data (no attendance history, no sessions, no users)
- Form validation: required fields, email format, password min 6 chars, password match
- Toast notifications for success/error feedback (auto-dismiss 4s)
- Clean production build: `npm run build` passes with no warnings
- Verified all security defenses work via simulation panel
