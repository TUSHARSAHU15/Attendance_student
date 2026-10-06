import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vkeipkzszhfxkvtukypp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_lINMUTnM7Zo4KbxPDYILmA_zDzqc6GM';

const isRealSupabase = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your_supabase') &&
  supabaseUrl.startsWith('https://')
);

// Initial seed database for local standalone mode
const INITIAL_DB = {
  users: [
    {
      id: "TCH-001",
      name: "Dr. Alan Turing",
      email: "alan.turing@college.edu",
      role: "teacher",
      password: "teacher123",
      registeredFingerprint: null
    },
    {
      id: "BCA/40051/24",
      name: "Alice Smith",
      email: "alice.smith@college.edu",
      role: "student",
      password: "student123",
      registeredFingerprint: null
    },
    {
      id: "BCA/40052/24",
      name: "Bob Jones",
      email: "bob.jones@college.edu",
      role: "student",
      password: "student123",
      registeredFingerprint: null
    },
    {
      id: "BCA/40053/24",
      name: "Charlie Brown",
      email: "charlie.brown@college.edu",
      role: "student",
      password: "student123",
      registeredFingerprint: null
    },
    {
      id: "ADM-001",
      name: "System Admin",
      email: "admin@college.edu",
      role: "admin",
      password: "admin123",
      registeredFingerprint: null
    }
  ],
  subjects: [
    {
      id: "CS-101",
      name: "Network Security & Cryptography",
      teacherId: "TCH-001",
      subnet: "192.168.1.*",
      schedule: "Mon/Wed/Fri 10:00 AM",
      room: "LH-101"
    },
    {
      id: "CS-102",
      name: "Operating Systems",
      teacherId: "TCH-001",
      subnet: "10.0.0.*",
      schedule: "Tue/Thu 02:00 PM",
      room: "Lab-3"
    },
    {
      id: "CS-103",
      name: "Database Management Systems",
      teacherId: "TCH-001",
      subnet: "192.168.1.*",
      schedule: "Mon/Wed 11:30 AM",
      room: "LH-102"
    }
  ],
  sessions: [],
  attendance: [],
  audit_logs: [
    {
      id: "log_init_01",
      timestamp: Date.now() - 3600000,
      level: "INFO",
      message: "System Initialization Complete",
      details: "Classrooms LH-101, LH-102, Lab-3 configured with active subnet whitelists."
    }
  ],
  password_resets: []
};

function getLocalTable(table) {
  const key = "sat_db_" + table;
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // ignore
    }
  }
  const initial = INITIAL_DB[table] || [];
  localStorage.setItem(key, JSON.stringify(initial));
  return initial;
}

function saveLocalTable(table, data) {
  localStorage.setItem("sat_db_" + table, JSON.stringify(data));
}

class MockQueryBuilder {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this._orderCol = null;
    this._ascending = true;
    this._limit = null;
    this._isSingle = false;
    this._isMaybeSingle = false;
    this._action = 'select';
    this._payload = null;
  }

  select() {
    if (this._action !== 'insert') {
      this._action = 'select';
    }
    return this;
  }

  insert(rows) {
    this._action = 'insert';
    this._payload = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  update(fields) {
    this._action = 'update';
    this._payload = fields;
    return this;
  }

  delete() {
    this._action = 'delete';
    return this;
  }

  eq(col, val) {
    this.filters.push(row => String(row[col]) === String(val));
    return this;
  }

  neq(col, val) {
    this.filters.push(row => String(row[col]) !== String(val));
    return this;
  }

  order(col, { ascending = true } = {}) {
    this._orderCol = col;
    this._ascending = ascending;
    return this;
  }

  limit(count) {
    this._limit = count;
    return this;
  }

  single() {
    this._isSingle = true;
    return this;
  }

  maybeSingle() {
    this._isMaybeSingle = true;
    return this;
  }

  async _execute() {
    const allRows = getLocalTable(this.table);

    if (this._action === 'insert') {
      const newRows = this._payload.map(r => ({ ...r }));
      const updated = [...allRows, ...newRows];
      saveLocalTable(this.table, updated);
      return { data: newRows, error: null };
    }

    const matchedIndices = [];
    const matchedRows = [];
    allRows.forEach((row, idx) => {
      const match = this.filters.every(f => f(row));
      if (match) {
        matchedIndices.push(idx);
        matchedRows.push(row);
      }
    });

    if (this._action === 'delete') {
      const matchSet = new Set(matchedIndices);
      const remaining = allRows.filter((_, idx) => !matchSet.has(idx));
      saveLocalTable(this.table, remaining);
      return { data: matchedRows, error: null };
    }

    if (this._action === 'update') {
      const updatedRows = matchedRows.map(row => ({ ...row, ...this._payload }));
      const matchSet = new Set(matchedIndices);
      let matchIdx = 0;
      const newTable = allRows.map((row, idx) => {
        if (matchSet.has(idx)) {
          return updatedRows[matchIdx++];
        }
        return row;
      });
      saveLocalTable(this.table, newTable);
      return { data: updatedRows, error: null };
    }

    // Select query
    let result = [...matchedRows];
    if (this._orderCol) {
      result.sort((a, b) => {
        const valA = a[this._orderCol];
        const valB = b[this._orderCol];
        if (valA < valB) return this._ascending ? -1 : 1;
        if (valA > valB) return this._ascending ? 1 : -1;
        return 0;
      });
    }

    if (this._limit !== null) {
      result = result.slice(0, this._limit);
    }

    if (this._isSingle) {
      if (result.length === 0) {
        return { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
      }
      return { data: result[0], error: null };
    }

    if (this._isMaybeSingle) {
      return { data: result[0] || null, error: null };
    }

    return { data: result, error: null };
  }

  then(resolve, reject) {
    return this._execute().then(resolve, reject);
  }
}

const mockSupabase = {
  from(tableName) {
    return new MockQueryBuilder(tableName);
  },
  auth: {
    async getSession() { return { data: { session: null }, error: null }; },
    async signOut() { return { error: null }; }
  }
};

let supabaseInstance = null;

if (isRealSupabase) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase connected to:', supabaseUrl);
  } catch (err) {
    console.warn('⚠️ Supabase connection error. Falling back to local storage:', err);
    supabaseInstance = mockSupabase;
  }
} else {
  console.info('ℹ️ Running in Standalone Simulated Mode with local storage.');
  supabaseInstance = mockSupabase;
}

export const supabase = supabaseInstance;