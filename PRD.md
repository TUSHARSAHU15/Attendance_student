# PRD — Roster-Gate

## Product Requirements Document

### 1. Product Vision

A React web app that prevents attendance fraud in university classrooms by implementing multi-layered security verification: dynamic QR codes with 15-second TTL (30s tolerance), hardware-bound device fingerprinting (WebAuthn), and WiFi subnet whitelisting. Features a simulation sandbox for live security demos.

### 2. Target Users

- BCA final-year students (academic evaluation project)
- Three user roles: Student, Teacher, Admin
- Single-user-per-device model

### 3. Core Features

| ID | Feature | Description |
|----|---------|-------------|
| F1 | Auth | Email/password login against Supabase users table; session persisted in React state |
| F2 | Student Portal | Biometric registration (WebAuthn), QR scanner (camera + manual input), attendance history with status badges |
| F3 | Teacher Portal | Start/end sessions, broadcast dynamic QR codes (15s rotation), roster grid with manual override, analytics charts |
| F4 | Admin Portal | User CRUD, device registry with bind/unbind, audit logs with severity levels, factory reset (danger zone) |
| F5 | Security Engine | QR generation/verification, subnet check, WebAuthn assertion, duplicate detection, audit logging |
| F6 | Simulation Sandbox | IP spoof presets (classroom/home/custom), clock offset slider (-15s to +15s), live diagnostic feed |
| F7 | Password Reset | EmailJS 6-digit code flow with 10-min TTL, 3-step wizard (request → verify → success) |

### 4. Non-Goals

- Real-time multi-user collaboration (simulated single-user prototype)
- Video recording or processing
- Calendar integration
- Custom backend server beyond Supabase
- Production-grade password hashing (plaintext stored, documented)
- Mobile native app
- Row Level Security policies

### 5. Success Criteria

- Student can register device via WebAuthn and mark attendance by scanning QR
- Teacher can start session, broadcast rotating QR codes, view live roster
- Admin can manage users, view audit logs, unbind devices
- Security defenses block: remote access (subnet mismatch), screenshot sharing (QR expiry), account sharing (fingerprint mismatch)
- Simulation panel demonstrates all attack vectors and defenses
- Password reset flow works end-to-end via EmailJS

### 6. Constraints

- Supabase (Postgres + Auth) is the entire backend
- SPA, client-rendered — no SSR
- No react-router — state-based view switching in App.jsx
- Target Chrome/Edge for WebAuthn and QR scanning
- Academic demo scope — security trade-offs documented
- QR window: 15 seconds rotation, 30-second validation tolerance
- WebAuthn requires HTTPS in production

### 7. Known Limitations

- Passwords stored in plaintext (no hashing)
- No Row Level Security policies enforced
- QR window is 15s but may be documented as 5s in some places
- Chart data is mocked, not live from database
- WebAuthn requires HTTPS in production
- No email verification on signup
- Supabase anon key exposed in client bundle (accepted for demo)

### 8. Database Schema Overview

| Table | Purpose |
|-------|---------|
| `users` | Students, teachers, admins with role, fingerprint, password |
| `subjects` | Courses with teacher, subnet, schedule, room |
| `sessions` | Attendance sessions created by teachers |
| `attendance` | Student attendance records per session |
| `audit_logs` | Security events (INFO/WARN/CRITICAL) |
| `password_resets` | 6-digit reset codes with 10-min TTL |

### 9. Security Validation Pipeline

```
verifyAndSubmitAttendance(token, studentId):
  1. Decode base64 token → {sessionId, timestamp, salt}
  2. Look up session → get subjectId → get subnet
  3. Verify biometric → WebAuthn assertion against registeredFingerprint
  4. Check QR age → |now - timestamp| < 2 * QR_WINDOW_MS (30s tolerance)
  5. Check subnet → client IP matches course subnet prefix
  6. Check duplicate → no existing attendance for student + session
  7. Insert attendance record → write audit log → return success
```

All three checks must pass; failure logs CRITICAL audit event.
