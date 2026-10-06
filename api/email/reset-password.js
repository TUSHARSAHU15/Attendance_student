// Vercel Serverless Function - Reset Password (Complete Flow)
// POST /api/email/reset-password
// Body: { token: string, newPassword: string }

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
    const { token, newPassword } = req.body;

    // Validate input
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token is required' });
    }
    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ error: 'New password is required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
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
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Check expiration
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Reset token has expired. Please request a new one.' });
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', record.email)
      .single();

    if (userError || !user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update password:', updateError);
      return res.status(500).json({ error: 'Failed to update password' });
    }

    // Mark token as used
    await supabase
      .from('password_resets')
      .update({ used: true })
      .eq('id', record.id);

    // Log audit event
    await supabase.from('audit_logs').insert([{
      id: 'log_' + crypto.randomUUID(),
      timestamp: Date.now(),
      level: 'INFO',
      message: 'Password Reset Completed',
      details: `Password updated for user ${user.email} (${user.name})`,
    }]);

    return res.status(200).json({ 
      success: true, 
      message: 'Password has been reset successfully' 
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}