// Password Reset Email Template - Optimized for inbox deliverability
export function passwordResetTemplate({ name, resetUrl, appName = "Secure Attendance" }) {
  const subject = `${appName}: Password Reset Request`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
    <tr>
      <td style="background-color: #0e5b9e; padding: 24px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.01em;">
          ${appName}
        </h1>
        <p style="margin: 4px 0 0 0; color: #bae6fd; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
          Digital Attendance System
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 28px;">
        <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #0f172a;">
          Reset Your Password
        </h2>
        <p style="margin: 0 0 14px 0; font-size: 14px; color: #334155;">
          Hello ${name || "User"},
        </p>
        <p style="margin: 0 0 20px 0; font-size: 14px; color: #334155;">
          A password reset was requested for your account on the <strong>${appName}</strong> portal. Click the button below to securely set your new password:
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #0e5b9e; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 6px;">
            Reset Password
          </a>
        </div>
        <p style="margin: 20px 0 6px 0; font-size: 13px; color: #64748b;">
          Or copy and paste this URL into your browser:
        </p>
        <p style="margin: 0 0 20px 0; font-size: 12px; color: #0e5b9e; word-break: break-all;">
          <a href="${resetUrl}" style="color: #0e5b9e; text-decoration: underline;">${resetUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="margin: 0; font-size: 13px; color: #64748b;">
          This link will expire in 1 hour. If you did not make this request, you can safely ignore this email.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">
          © ${new Date().getFullYear()} ${appName}. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
${appName} - Password Reset Request

Hello ${name || "User"},

A password reset was requested for your account on the ${appName} portal.

Reset your password using this link:
${resetUrl}

This link is valid for 1 hour and can only be used once. If you did not request this, you can safely ignore this email.

---
© ${new Date().getFullYear()} ${appName}
  `.trim();

  return { subject, html, text };
}