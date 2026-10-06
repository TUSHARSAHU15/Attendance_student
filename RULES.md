# RULES.md — Roster-Gate

## Development Rules

### Code Style

1. **No comments** in code unless explicitly requested
2. **Functional components** only — no class components
3. **Tailwind CSS** for all styling — no CSS modules, no styled-components
4. **JSX** files — not TSX
5. **Default exports** for components
6. **No TypeScript** — plain JavaScript/JSX
7. **Arrow functions** for component definitions
8. **Destructuring** for props and state

### File Naming

- Components: `src/components/PascalCase.jsx`
- State: `src/state/camelCase.js`
- Assets: `src/assets/camelCase.{png,svg}`
- Entry points: `src/main.jsx`, `src/App.jsx`
- Styles: `src/index.css`

### Data Rules

1. **Supabase is the only backend** — no custom server
2. **Client-side queries** — all DB operations from the browser
3. **Client-side API keys** — acceptable for academic demo
4. **Plaintext passwords** — documented as known limitation
5. **localStorage** for simulation state persistence (`sat_simulation` key)
6. **No Row Level Security** — all queries run with anon key
7. **Real-time subscriptions not used** — polling/manual refresh only

### Security Rules

1. **QR tokens rotate every 15 seconds** — `QR_WINDOW_MS = 15000`
2. **Biometric verification via WebAuthn** — native browser API only
3. **Subnet check** — compare client IP against course subnet prefix
4. **Audit logging** — all security events logged to `audit_logs` table
5. **Device binding** — one device per student, admin can unbind
6. **QR validation tolerance** — 2x window = 30 seconds
7. **Never silently bypass security checks** — all failures must log CRITICAL audit event
8. **Password reset codes** — 6-digit numeric, 10-minute TTL, single-use

### Component Rules

1. **State in App.jsx** — global auth state, view routing, user object
2. **Props drilling preferred** over context for simplicity
3. **SimulationPanel** renders in App.jsx for all authenticated views
4. **Collapsible sections** — use `useState` for open/closed, Load/Close toggle
5. **Forms** — controlled components, validation on submit
6. **Error handling** — try/catch with user-friendly error banners
7. **Loading states** — spinner + disabled buttons during async ops

### API/Integration Rules

1. **EmailJS for password reset** — not Supabase Auth
2. **6-digit numeric codes** — 10-minute expiry
3. **Template variables must match** — `to_email`, `reset_code`, `app_name`
4. **ipify API** for client IP detection (fallback to simulation IP)
5. **WebAuthn** — requires HTTPS in production, localhost works for dev

### Git Rules

1. **Never commit secrets** — `.env` is gitignored
2. **Concise commit messages** matching repo style
3. **Only commit when explicitly asked**
4. **Build must pass** (`npm run build`) before any commit

### Testing

- Build must pass (`npm run build`) before any commit
- Run `npm run lint` if linting is configured
- Manual testing in Chrome/Edge for WebAuthn and QR features
- Test all three attack vectors via simulation panel

### Known Limitations (Do Not Fix Silently)

1. Passwords stored in plaintext
2. No Row Level Security policies
3. Chart data is mocked
4. QR window is 15s but may be documented as 5s
5. WebAuthn requires HTTPS in production
6. No email verification on signup
7. Supabase anon key exposed in client bundle

### Project-Specific Conventions

1. **QR payload format**: `{ sessionId: string, timestamp: number, salt: string }` → base64
2. **ID prefixes**: `sess_` for sessions, `att_` for attendance, `log_` for audit logs
3. **Timestamp format**: Unix milliseconds (`Date.now()`)
4. **Subnet format**: CIDR-like prefix (e.g., `192.168.1.*`)
5. **Audit log levels**: `INFO`, `WARN`, `CRITICAL` (uppercase)
6. **Attendance status**: `Present`, `Late`, `Absent`
7. **Simulation localStorage key**: `sat_simulation`
8. **Environment variable prefix**: `VITE_` for all client-exposed vars
