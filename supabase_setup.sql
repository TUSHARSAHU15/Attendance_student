-- ==========================================================
-- Supabase Schema for Secure Attendance Tracking System
-- ==========================================================

-- 1. Create USERS table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  password TEXT NOT NULL,
  "registeredFingerprint" TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create SUBJECTS table
CREATE TABLE IF NOT EXISTS public.subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "teacherId" TEXT,
  subnet TEXT,
  schedule TEXT,
  room TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create SESSIONS table
CREATE TABLE IF NOT EXISTS public.sessions (
  id TEXT PRIMARY KEY,
  "subjectId" TEXT NOT NULL,
  "createdBy" TEXT,
  "createdAt" BIGINT,
  active BOOLEAN DEFAULT TRUE
);

-- 4. Create ATTENDANCE table
CREATE TABLE IF NOT EXISTS public.attendance (
  id TEXT PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "studentName" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "subjectName" TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  status TEXT NOT NULL,
  "ipAddress" TEXT,
  fingerprint TEXT,
  method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create AUDIT_LOGS table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  timestamp BIGINT NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create PASSWORD_RESETS table
CREATE TABLE IF NOT EXISTS public.password_resets (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT,
  token_hash TEXT,
  code TEXT,
  expires_at BIGINT,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------
-- Enable Row Level Security (RLS) & Grant Public / Anon Access
-- ----------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- Allow anon key full read & write access for webapp operations
DROP POLICY IF EXISTS "Allow anon all on users" ON public.users;
CREATE POLICY "Allow anon all on users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on subjects" ON public.subjects;
CREATE POLICY "Allow anon all on subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on sessions" ON public.sessions;
CREATE POLICY "Allow anon all on sessions" ON public.sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on attendance" ON public.attendance;
CREATE POLICY "Allow anon all on attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on audit_logs" ON public.audit_logs;
CREATE POLICY "Allow anon all on audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on password_resets" ON public.password_resets;
CREATE POLICY "Allow anon all on password_resets" ON public.password_resets FOR ALL USING (true) WITH CHECK (true);

-- ----------------------------------------------------------
-- Seed Initial Data
-- ----------------------------------------------------------
INSERT INTO public.users (id, name, email, role, password, "registeredFingerprint")
VALUES
  ('TCH-001', 'Dr. Alan Turing', 'alan.turing@college.edu', 'teacher', 'teacher123', NULL),
  ('BCA/40051/24', 'Alice Smith', 'alice.smith@college.edu', 'student', 'student123', NULL),
  ('BCA/40052/24', 'Bob Jones', 'bob.jones@college.edu', 'student', 'student123', NULL),
  ('BCA/40053/24', 'Charlie Brown', 'charlie.brown@college.edu', 'student', 'student123', NULL),
  ('ADM-001', 'System Admin', 'admin@college.edu', 'admin', 'admin123', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.subjects (id, name, "teacherId", subnet, schedule, room)
VALUES
  ('CS-101', 'Network Security & Cryptography', 'TCH-001', '192.168.1.*', 'Mon/Wed/Fri 10:00 AM', 'LH-101'),
  ('CS-102', 'Operating Systems', 'TCH-001', '10.0.0.*', 'Tue/Thu 02:00 PM', 'Lab-3'),
  ('CS-103', 'Database Management Systems', 'TCH-001', '192.168.1.*', 'Mon/Wed 11:30 AM', 'LH-102')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.audit_logs (id, timestamp, level, message, details)
VALUES
  ('log_init_01', 1700000000000, 'INFO', 'System Initialization Complete', 'Classrooms LH-101, LH-102, Lab-3 configured with active subnet whitelists.')
ON CONFLICT (id) DO NOTHING;
