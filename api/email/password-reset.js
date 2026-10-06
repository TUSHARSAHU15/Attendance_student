// Vercel Serverless Function - Password Reset Email
// POST /api/email/password-reset
// Body: { email: string }

import { sendPasswordResetEmail } from './emailService';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vkeipkzszhfxkvtukypp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_lINMUTnM7Zo4KbxPDYILmA_zDzqc6GM';

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * Generate a cryptographically secure random token
 * @returns {string} Raw token (URL-safe base64)
 */
function generateSecureToken() {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Hash a token for storage
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
    const { email } = req.body;

    // Validate input
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user exists (using service role to bypass RLS)
    let user = null;
    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('email', email.toLowerCase())
        .single();

      if (!error && data) {
        user = data;
      }
    }

    // SECURITY: Always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      // Log for debugging (server-side only)
      console.log(`Password reset requested for non-existent email: ${email}`);
      return res.status(200).json({ 
        success: true, 
        message: 'If an account exists, a reset email has been sent.' 
      });
    }

    // Generate secure token
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Store token hash in database
    if (supabase) {
      // Clean up any existing reset tokens for this email
      await supabase
        .from('password_resets')
        .delete()
        .eq('email', email.toLowerCase());

      // Insert new token
      const resetId = 'rst_' + crypto.randomUUID().replace(/-/g, '');
      const { error: insertError } = await supabase
        .from('password_resets')
        .insert([{
          id: resetId,
          email: email.toLowerCase(),
          token: rawToken,
          token_hash: tokenHash,
          expires_at: expiresAt,
          used: false,
        }]);

      if (insertError) {
        console.error('Failed to store reset token:', insertError);
        return res.status(500).json({ error: 'Failed to process reset request' });
      }
    }

    // Send email
    try {
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        token: rawToken,
      });
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      // Don't expose email failure to client
      // Token is stored, user can retry
    }

    // Log audit event
    if (supabase) {
      await supabase.from('audit_logs').insert([{
        id: 'log_' + crypto.randomUUID(),
        timestamp: Date.now(),
        level: 'INFO',
        message: 'Password Reset Requested',
        details: `Email sent to ${user.email} (${user.name})`,
      }]);
    }

    return res.status(200).json({ 
      success: true, 
      message: 'If an account exists, a reset email has been sent.' 
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}