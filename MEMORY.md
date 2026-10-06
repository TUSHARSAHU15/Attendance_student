# MEMORY.md — Roster-Gate

## Project Memory

### Files Created

```
src/
  state/
    supabaseClient.js         — Supabase client init
    db.js                     — Core business logic, DB queries, security engine
  components/
    Login.jsx                 — Email/password login form
    ForgotPassword.jsx        — 3-step password reset via EmailJS
    StudentDashboard.jsx      — Student portal (scanner, biometric, history)
    TeacherDashboard.jsx      — Teacher portal (QR broadcast, roster, charts)
    AdminDashboard.jsx        — Admin portal (users, audit logs, danger zone)
    SimulationPanel.jsx       — Floating security sandbox for attack simulation
  App.jsx                     — Top-level layout, routing, auth state
  main.jsx                    — React root mount
  index.css                   — Tailwind imports + custom JUNO theme classes
```

### Environment Variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=
```

### Decisions Made

1. Using React 19 (not 18) — latest stable at build time
2. Tailwind CSS v4 with @tailwindcss/vite plugin — not v3 PostCSS setup
3. No TypeScript — JSX only
4. No react-router — view switching via React state in App.jsx
5. Supabase is the only backend — no custom server
6. Client-side Supabase queries — no Edge Functions or API routes
7. Passwords stored in plaintext — acceptable for academic demo scope
8. QR window is 15 seconds (QR_WINDOW_MS = 15000)
9. EmailJS for password reset emails — not Supabase Auth
10. WebAuthn for biometric device binding — native browser API
11. Simulation state persists in localStorage (key: sat_simulation)
12. QR validation tolerance = 2x window = 30 seconds
13. ID prefixes: sess_, att_, log_ for sessions, attendance, audit logs
14. Subnet format: CIDR-like prefix (e.g., 192.168.1.*)
15. Audit log levels: INFO, WARN, CRITICAL (uppercase)
16. Attendance status: Present, Late, Absent

### Known Issues

1. Passwords stored in plaintext (no hashing)
2. Supabase anon key exposed in .env (accepted trade-off for demo)
3. Chart data in teacher dashboard is mocked, not live
4. No Row Level Security policies visible in codebase
5. QR window is 15s but README historically said 5s — docs now updated
6. WebAuthn requires HTTPS in production (works on localhost)
7. No email verification on signup
8. ipify API for client IP detection may fail offline (falls back to simulation IP)
9. Recharts mocked data — not connected to real attendance data
10. Single-user prototype — no real-time multi-user sync

### Testing Checklist (Manual)

- [ ] Login as student/teacher/admin → correct dashboard loads
- [ ] Student: WebAuthn registration → credential stored
- [ ] Student: QR scan (camera) → attendance recorded
- [ ] Student: Manual token inject → attendance recorded
- [ ] Teacher: Start session → QR rotates every 15s
- [ ] Teacher: Live roster updates when student scans
- [ ] Teacher: Manual override (Present/Late/Absent) works
- [ ] Admin: Add user → appears in registry
- [ ] Admin: Unbind device → student can re-register
- [ ] Admin: Factory reset → all data wiped, bindings cleared
- [ ] Admin: Audit logs show INFO/WARN/CRITICAL correctly
- [ ] Simulation: IP spoof (Home) → subnet mismatch rejection
- [ ] Simulation: Clock drift (+40s) → QR expiry rejection
- [ ] Simulation: Fingerprint spoof → biometric mismatch rejection
- [ ] Password reset: Request → email sent with 6-digit code
- [ ] Password reset: Verify code → new password set → login works
- [ ] Build: `npm run build` passes with no warnings

### Supabase Setup Commands

Run these SQL statements in Supabase SQL Editor:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create all tables (see AGENT_CONTEXT.md for full schema)
-- users, subjects, sessions, attendance, audit_logs, password_resets

-- Enable email/password auth in Supabase Auth settings
-- Disable email confirmation for demo
```

### EmailJS Setup

1. Create EmailJS account
2. Add email service (Gmail/Outlook/etc.)
3. Create template with variables: to_email, reset_code, app_name
4. Copy Service ID, Template ID, Public Key to .env

### Deployment Notes

- Vercel: Connect GitHub repo, add environment variables
- Build command: `npm run build`
- Output directory: `dist`
- Ensure HTTPS for WebAuthn in production
- Supabase anon key is public — safe for client-side