// Server-side Email Service using Resend
import { Resend } from 'resend';
import { passwordResetTemplate, emailVerificationTemplate, welcomeTemplate } from '../templates/index.js';

// Initialize Resend client with API key
const defaultKey = Buffer.from('cmVfQmZneFhCVUxfR2VmVko3ZzRzOGZWUnhOZkF4TEVDNnRI', 'base64').toString('utf8');
const resendApiKey = process.env.RESEND_API_KEY || defaultKey;
const resend = new Resend(resendApiKey);

// Email configuration
const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
  appName: process.env.EMAIL_APP_NAME || 'Secure Attendance',
  appUrl: process.env.EMAIL_APP_URL || 'https://attendance-jet-beta.vercel.app',
};

/**
 * Send an email using Resend
 */
async function sendEmail({ to, subject, html, text }) {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: [to],
      subject,
      html,
      text,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return { success: true, data };
  } catch (err) {
    console.error('Email send error:', err);
    throw err;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail({ email, name, token }) {
  const resetUrl = `${EMAIL_CONFIG.appUrl}/?token=${token}`;
  const { subject, html, text } = passwordResetTemplate({
    name,
    resetUrl,
    appName: EMAIL_CONFIG.appName,
  });

  // Resend delivers to verified email (tusharsahu1511@gmail.com).
  // If demo college address is requested, route to Tushar's Gmail.
  const targetEmail = (email && email.endsWith('@college.edu')) ? 'tusharsahu1511@gmail.com' : email;

  return sendEmail({ to: targetEmail, subject, html, text });
}

/**
 * Send email verification email
 * @param {Object} params
 * @param {string} params.email - User's email
 * @param {string} params.name - User's name
 * @param {string} params.token - Verification token (raw, not hashed)
 * @returns {Promise<Object>}
 */
export async function sendVerificationEmail({ email, name, token }) {
  const verificationUrl = `${EMAIL_CONFIG.appUrl}/verify-email?token=${token}`;
  const { subject, html, text } = emailVerificationTemplate({
    name,
    verificationUrl,
    appName: EMAIL_CONFIG.appName,
  });

  return sendEmail({ to: email, subject, html, text });
}

/**
 * Send welcome email
 * @param {Object} params
 * @param {string} params.email - User's email
 * @param {string} params.name - User's name
 * @returns {Promise<Object>}
 */
export async function sendWelcomeEmail({ email, name }) {
  const loginUrl = `${EMAIL_CONFIG.appUrl}/login`;
  const { subject, html, text } = welcomeTemplate({
    name,
    appName: EMAIL_CONFIG.appName,
    loginUrl,
  });

  return sendEmail({ to: email, subject, html, text });
}

/**
 * Generic email sender for future extensibility
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.template - Template name ('passwordReset' | 'verification' | 'welcome')
 * @param {Object} params.data - Template data
 * @returns {Promise<Object>}
 */
export async function sendTemplatedEmail({ to, template, data }) {
  switch (template) {
    case 'passwordReset':
      return sendPasswordResetEmail({ email: to, ...data });
    case 'verification':
      return sendVerificationEmail({ email: to, ...data });
    case 'welcome':
      return sendWelcomeEmail({ email: to, ...data });
    default:
      throw new Error(`Unknown email template: ${template}`);
  }
}