// Server-side Email Service using direct Gmail SMTP and optional Resend
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { passwordResetTemplate, emailVerificationTemplate, welcomeTemplate } from '../templates/index.js';

// Initialize Resend client with API key
const defaultKey = Buffer.from('cmVfQmZneFhCVUxfR2VmVko3ZzRzOGZWUnhOZkF4TEVDNnRI', 'base64').toString('utf8');
const resendApiKey = process.env.RESEND_API_KEY || defaultKey;
const resend = new Resend(resendApiKey);

// Gmail SMTP configuration (App Password for direct delivery to EVERY user's email)
const defaultSmtpUser = 'securedattendance@gmail.com';
const defaultSmtpPass = Buffer.from('aXhsbHdkcWp2d2VhZ3lycw==', 'base64').toString('utf8'); // App password: ixll wdqj vwea gyrs
const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || defaultSmtpUser;
const smtpPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || defaultSmtpPass).replace(/\s+/g, '');

// Email configuration
const EMAIL_CONFIG = {
  appName: process.env.EMAIL_APP_NAME || 'Secure Attendance',
  appUrl: process.env.EMAIL_APP_URL || 'https://attendance-jet-beta.vercel.app',
};

/**
 * Send an email directly to the recipient's mail address
 * Uses Gmail SMTP with forced IPv4 (Port 465 SSL, fallback Port 587 TLS) for serverless compatibility
 */
async function sendEmail({ to, subject, html, text }) {
  const recipient = (to || '').trim();
  if (!recipient) {
    throw new Error('Recipient email is required.');
  }

  const fromSender = `"${EMAIL_CONFIG.appName}" <${smtpUser}>`;
  let lastError = null;

  // 1. Primary: SMTP via Port 465 (SSL) with forced IPv4 (vital for Vercel/AWS serverless)
  if (smtpUser && smtpPass) {
    try {
      const transporter465 = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: smtpUser, pass: smtpPass },
        family: 4,
        pool: false,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
      });

      const info = await transporter465.sendMail({
        from: fromSender,
        to: recipient,
        replyTo: smtpUser,
        subject,
        html,
        text,
        priority: 'high',
        headers: {
          'X-Auto-Response-Suppress': 'OOF, AutoReply',
        },
      });
      console.log(`[SMTP 465 Sent] to ${recipient}, Message ID: ${info.messageId}`);
      return { success: true, provider: 'smtp-465', data: info };
    } catch (err465) {
      console.warn(`[SMTP 465 Warning] Delivery to ${recipient} failed: ${err465.message}. Retrying via port 587...`);
    }

    // 2. Secondary: SMTP via Port 587 (STARTTLS) with forced IPv4
    try {
      const transporter587 = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user: smtpUser, pass: smtpPass },
        family: 4,
        pool: false,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
      });

      const info = await transporter587.sendMail({
        from: fromSender,
        to: recipient,
        replyTo: smtpUser,
        subject,
        html,
        text,
        priority: 'high',
        headers: {
          'X-Auto-Response-Suppress': 'OOF, AutoReply',
        },
      });
      console.log(`[SMTP 587 Sent] to ${recipient}, Message ID: ${info.messageId}`);
      return { success: true, provider: 'smtp-587', data: info };
    } catch (err587) {
      console.error(`[SMTP 587 Failed] ${err587.message}`);
      lastError = err587;
    }
  }

  // 3. Fallback: If recipient is verified on Resend or custom domain is enabled
  if (recipient.toLowerCase() === 'securedattendance@gmail.com' || process.env.RESEND_DOMAIN_VERIFIED === 'true') {
    try {
      const fromResend = process.env.EMAIL_FROM || 'onboarding@resend.dev';
      const { data, error } = await resend.emails.send({
        from: fromResend,
        to: [recipient],
        subject,
        html,
        text,
      });

      if (!error) {
        console.log(`[Resend Sent] to ${recipient}`);
        return { success: true, provider: 'resend', data };
      }
      lastError = error;
    } catch (resendErr) {
      lastError = resendErr;
    }
  }

  throw new Error(`Failed to deliver email to ${recipient}: ${lastError?.message || 'SMTP service error'}`);
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

  return sendEmail({ to: email, subject, html, text });
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