// Vercel Serverless Function - Email Verification
// POST /api/email/verify
// Body: { email: string, name: string }

import { sendVerificationEmail } from './emailService';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

    // Check if user already exists
    let existingUser = null;
    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email.toLowerCase())
        .single();

      if (!error && data) {
        existingUser = data;
      }
    }

    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Generate secure token
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    // Store token hash in database (using a verification_tokens table or password_resets)
    if (supabase) {
      // Clean up any existing verification tokens for this email
      await supabase
        .from('password_resets')
        .delete()
        .eq('email', email.toLowerCase());

      // Insert new verification token (reusing password_resets table with a type field would be better)
      const { error: insertError } = await supabase
        .from('password_resets')
        .insert([{
          email: email.toLowerCase(),
          token_hash: tokenHash,
          expires_at: expiresAt,
          used: false,
        }]);

      if (insertError) {
        console.error('Failed to store verification token:', insertError);
        return res.status(500).json({ error: 'Failed to process verification request' });
      }
    }

    // Send verification email
    try {
      await sendVerificationEmail({
        email,
        name,
        token: rawToken,
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    // Log audit event
    if (supabase) {
      await supabase.from('audit_logs').insert([{
        id: 'log_' + crypto.randomUUID(),
        timestamp: Date.now(),
        level: 'INFO',
        message: 'Email Verification Sent',
        details: `Verification email sent to ${email} (${name})`,
      }]);
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Verification email sent successfully' 
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}