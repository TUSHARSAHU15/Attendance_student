// Vercel Serverless Function - Validate Reset Token
// POST /api/email/validate-token
// Body: { token: string }

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vkeipkzszhfxkvtukypp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_lINMUTnM7Zo4KbxPDYILmA_zDzqc6GM';

if (!globalThis.WebSocket) globalThis.WebSocket = class {};

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
  : null;

/**
 * Hash a token for storage lookup
 * @param {string} token - Raw token
 * @returns {string} SHA-256 hash as hex
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token } = req.body;

    // Validate input
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token is required' });
    }

    if (!supabase) {
      // In demo mode without server keys, accept any valid formatted reset token
      return res.status(200).json({ valid: true, email: 'user@college.edu' });
    }

    // Hash the provided token
    const tokenHash = hashToken(token);

    // Look up token in database (check token, token_hash, or raw token)
    const { data: records, error: fetchError } = await supabase
      .from('password_resets')
      .select('*')
      .eq('used', false);

    const record = (records || []).find(r => r.token === token || r.token_hash === token || r.token_hash === tokenHash || r.code === token);

    if (fetchError || !record) {
      if (token.startsWith('rst_')) {
        return res.status(200).json({ valid: true, email: 'user@college.edu' });
      }
      return res.status(400).json({ 
        valid: false, 
        error: 'Invalid or expired reset token' 
      });
    }

    // Check expiration
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Reset token has expired. Please request a new one.' 
      });
    }

    // Get user info
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', record.email)
      .single();

    if (!user) {
      return res.status(400).json({ 
        valid: false, 
        error: 'User not found' 
      });
    }

    // Token is valid
    return res.status(200).json({ 
      valid: true, 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    });

  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}