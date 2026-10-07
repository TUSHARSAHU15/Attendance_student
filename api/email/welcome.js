// Vercel Serverless Function - Welcome Email
// POST /api/email/welcome
// Body: { email: string, name: string }

import { sendWelcomeEmail } from './emailService.js';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!globalThis.WebSocket) globalThis.WebSocket = class {};

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
  : null;

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, name } = req.body;

    // Validate input
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Send welcome email
    try {
      await sendWelcomeEmail({ email, name });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      return res.status(500).json({ error: 'Failed to send welcome email' });
    }

    // Log audit event
    if (supabase) {
      await supabase.from('audit_logs').insert([{
        id: 'log_' + crypto.randomUUID(),
        timestamp: Date.now(),
        level: 'INFO',
        message: 'Welcome Email Sent',
        details: `Welcome email sent to ${email} (${name})`,
      }]);
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Welcome email sent successfully' 
    });

  } catch (error) {
    console.error('Welcome email error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}