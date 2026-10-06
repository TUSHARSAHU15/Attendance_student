# DESIGN.md — Roster-Gate

## UI / UX Design System

### Color Palette

- **Primary**: #0e5b9e (deep blue) — buttons, links, focus rings
- **Accent**: emerald-600 (#059669) — success states, biometric verified
- **Danger**: rose-500 (#f43f5e) — errors, delete actions, recording indicator
- **Background**: gray-50 (#f9fafb) — page backgrounds
- **Surface**: white — cards, modals, forms
- **Text Primary**: gray-900 (#111827) — headings, body
- **Text Secondary**: gray-500 (#6b7280) — labels, metadata
- **Success**: green-600 (#16a34a) — present/done states
- **Warning**: yellow-600 (#ca8a04) — late/processing states
- **Critical**: red-600 (#dc2626) — security violations, audit logs

### Typography

- **Headings**: system-ui, font-extrabold, gradient text (blue → green → rose)
- **Body**: system-ui, text-sm, text-slate-800
- **Mono**: ui-monospace — QR tokens, IP addresses, timestamps
- **Branding**: "Digital Attendance" gradient heading on login/forgot pages

### Component Patterns

#### Glass Cards (JUNO Theme)
- `glass rounded-2xl overflow-hidden p-6 sm:p-8 space-y-6`
- Semi-transparent with backdrop blur (`bg-white/80 backdrop-blur-lg`)
- Used for: login form, dashboard sections, modals
- Border: `border border-white/60` for subtle definition

#### Buttons
- **Primary**: `bg-[#0e5b9e]/90 hover:bg-[#004b87] text-white rounded-lg shadow-lg font-semibold text-sm`
- **Danger**: `bg-rose-500 hover:bg-rose-600 text-white` (record/delete)
- **Success**: `bg-emerald-500 hover:bg-emerald-600 text-white` (verify/confirm)
- **Ghost**: `text-xs text-slate-500 hover:text-slate-700` (back links)
- **Disabled**: `disabled:opacity-50 cursor-not-allowed`
- **Icon + Label**: Lucide icons left of text, `flex items-center gap-2`

#### Forms
- Inputs: `bg-white/45 border border-white/60 dark:bg-white/5 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-emerald-500`
- Labels: `text-xs font-semibold text-slate-700 uppercase tracking-wider`
- Error: `bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-start gap-2`
- Icons: Left-aligned Lucide icons in input fields (Mail, Lock, Fingerprint)
- Password fields: Toggle visibility with Eye/EyeOff icons

#### Status Badges
- Present: `bg-emerald-100 text-emerald-700`
- Late: `bg-amber-100 text-amber-700`
- Absent: `bg-gray-100 text-gray-500`
- Bound: green dot + "Bound" (`flex items-center gap-1.5`)
- Unbound: gray dot + "Unbound"
- Loading: spinner + "Verifying..."

#### Section Headers
- Inline-flex badge: `glass-panel text-[#0e5b9e] rounded-full text-xs font-semibold uppercase tracking-wider`
- Icon + label pattern (e.g., Shield, Fingerprint, QrCode, Users)
- Toggle button: `text-xs font-medium hover:text-[#0e5b9e]` (Load/Close)

#### Tables
- Header: `text-xs font-semibold text-slate-500 uppercase tracking-wider`
- Rows: `hover:bg-slate-50/50` with horizontal scroll on mobile
- Action buttons: icon-only, `p-1.5 rounded hover:bg-slate-100`

### Page Layouts

#### Login
- Centered card on gradient background (`bg-gradient-to-br from-blue-50 via-white to-emerald-50`)
- "SECURE ATTENDANCE TRACKING" badge at top
- "Digital Attendance" gradient heading (blue → green → rose)
- Email + password form with icons
- "Forgot Password?" link (ghost button)
- Error banner with ShieldAlert icon, dismissible

#### Forgot Password
- Same layout as Login
- 3-step wizard: Request → Verify → Success
- Step indicator: numbered circles with connecting line
- 6-digit code input with monospace font, auto-focus each field
- New password + confirmation fields with strength indicator
- Success checkmark animation (scale + fade in)

#### Student Dashboard
- Two-column layout (sidebar + main) on lg+, stacked on mobile
- **Left sidebar (lg:w-80)**: Credentials card (enrollment, programme, semester), Quick Links (nav pills)
- **Right main**: Three expandable sections with Load/Close toggles
  - Class Attendance Scanner (animated viewfinder, scan line, camera fallback, manual token input)
  - Biometric Device Registration (WebAuthn, credential display, status badge)
  - Attendance Log Registry (table with status badges, IP, method, timestamp)

#### Teacher Dashboard
- Two-column layout (sidebar + main) on lg+, stacked on mobile
- **Left sidebar (lg:w-80)**: Instructor credentials, Quick Links
- **Right main**: Three expandable sections
  - QR Broadcast Controls (subject selector, live QR with countdown overlay, session timer)
  - Historical Analytics (AreaChart: attendance trends, PieChart: present/late/absent ratio)
  - Live Class Roster (table with override buttons: Present/Late/Absent)

#### Admin Dashboard
- Two-column layout (sidebar + main) on lg+, stacked on mobile
- **Left sidebar (lg:w-80)**: Admin info, module links
- **Right main**: Four expandable sections
  - Add New User (form: name, email, role, password, enrollment/programme for students)
  - Student Device Registry (table: name, email, bind status, unbind/delete actions)
  - System Security Logs (scrollable audit table: level badge, message, timestamp, details)
  - Danger Zone (factory reset button with confirmation modal)

#### Simulation Panel
- Floating bottom-right toggle button (fixed, z-50)
- Slide-in sidebar from right (fixed, w-96, h-full, transform translateX)
- IP presets: Classroom Wi-Fi A, Subnet B, Home Network, Custom input
- Clock offset slider: -15s to +15s, step 1s, shows current offset
- Live diagnostic feed with token display (monospace, copy button)
- Reset to defaults button (clears localStorage sat_simulation)

### Animations

- QR scan line: CSS `@keyframes scanLine` moving top-to-bottom in viewfinder
- Recording pulse: red-500 dot with `animate-pulse` scale animation
- Section expand/collapse: height transition with `max-h-0` to `max-h-[500px]`
- Slide-in panel: `transform transition-transform duration-300 ease-out`
- Toast notifications: slide in from right, auto-dismiss after 4s
- Button press: `active:scale-[0.98]` for tactile feedback

### Responsive Design

- Mobile-first with `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px) breakpoints
- Sidebar collapses to bottom drawer on mobile (< lg)
- QR code and scanner adapt to viewport (max-w-[280px] on mobile)
- Tables scroll horizontally on mobile with `overflow-x-auto`
- Text scales: `text-sm sm:text-base` for body, `text-2xl sm:text-3xl` for headings
- Touch targets: minimum 44x44px for buttons and interactive elements

### Accessibility

- Semantic HTML: `<main>`, `<section>`, `<nav>`, `<article>`
- Focus visible: `focus-visible:ring-2 focus-visible:ring-[#0e5b9e] focus-visible:ring-offset-2`
- ARIA labels on icon-only buttons
- Color contrast: WCAG AA compliant for all text/background combos
- Reduced motion: respects `prefers-reduced-motion` for animations

### JUNO Theme Implementation

The "JUNO" branding theme uses:
- Glass morphism cards with backdrop blur
- Gradient text for headings (primary → accent → danger)
- Deep blue primary with emerald success accent
- Consistent 8px spacing scale (p-6, gap-6, space-y-6)
- Rounded-2xl for cards, rounded-lg for buttons/inputs
- Subtle shadows: `shadow-lg` for elevated, `shadow-sm` for inline
