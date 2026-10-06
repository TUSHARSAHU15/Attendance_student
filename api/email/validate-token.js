// Vercel Serverless Function - Validate Reset Token
// POST /api/email/validate-token
// Body: { token: string }

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
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
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Hash the provided token
    const tokenHash = hashToken(token);

    // Look up token in database
    const { data: record, error: fetchError } = await supabase
      .from('password_resets')
      .select('*')
      .eq('token_hash', tokenHash)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !record) {
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