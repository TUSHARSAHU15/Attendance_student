// Welcome Email Template
export function welcomeTemplate({ name, appName = "SecureAttendance", loginUrl = "/" }) {
  const subject = `Welcome to ${appName}!`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f8fafc; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Header -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #0e5b9e 0%, #059669 50%, #f43f5e 100%); border-radius: 12px 12px 0 0; padding: 32px 24px; text-align: center;">
          <tr>
            <td>
              <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.15); padding: 8px 16px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: white; margin-bottom: 16px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                SECURE ATTENDANCE TRACKING
              </div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: white; letter-spacing: -0.02em;">Digital Attendance</h1>
            </td>
          </tr>
        </table>

        <!-- Content Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: white; border-radius: 0 0 12px 12px; padding: 40px 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding-bottom: 24px; text-align: center;">
              <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background: linear-gradient(135deg, #0e5b9e 0%, #059669 100%); border-radius: 16px; margin-bottom: 16px;">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="vertical-align: middle;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
              </div>
              <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #111827;">Welcome to ${appName}!</h2>
              <p style="margin: 0; font-size: 15px; color: #6b7280;">Hi ${name || "there"},</p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 16px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #374151;">Your account has been created successfully. You're now ready to use ${appName} for secure, fraud-proof attendance tracking.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 0; text-align: center;">
              <a href="${loginUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: linear-gradient(135deg, #0e5b9e 0%, #059669 100%); color: white; font-size: 15px; font-weight: 600; text-decoration: none; padding: 16px 32px; border-radius: 8px; box-shadow: 0 4px 14px 0 rgba(14, 91, 158, 0.4); transition: all 0.2s ease;">
                Sign In to ${appName}
              </a>
            </td>
          </tr>
          <tr>
            <td style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
              <h3 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #111827;">What you can do:</h3>
              <ul style="margin: 0; padding: 0 0 0 20px; font-size: 14px; color: #374151; line-height: 2;">
                <li style="margin-bottom: 8px;">🔐 <strong>Students:</strong> Register biometric, scan QR codes, view attendance history</li>
                <li style="margin-bottom: 8px;">👨‍🏫 <strong>Teachers:</strong> Create sessions, broadcast dynamic QR codes, monitor live roster</li>
                <li style="margin-bottom: 8px;">🛡️ <strong>Admins:</strong> Manage users, audit logs, device registry</li>
              </ul>
            </td>
          </tr>
          <tr>
            <td style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
              <p style="margin: 0; font-size: 13px; color: #9ca3af;">Need help? Contact your system administrator or reply to this email.</p>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 24px 0 0 0; text-align: center;">
          <tr>
            <td>
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af;">© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
              <p style="margin: 0; font-size: 11px; color: #d1d5db;">This is an automated message, please do not reply.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
${appName} - Welcome!

Hi ${name || "there"},

Welcome to ${appName}! Your account has been created successfully.

Sign in here: ${loginUrl}

What you can do:
- Students: Register biometric, scan QR codes, view attendance history
- Teachers: Create sessions, broadcast dynamic QR codes, monitor live roster
- Admins: Manage users, audit logs, device registry

Need help? Contact your system administrator.

---
© ${new Date().getFullYear()} ${appName}. All rights reserved.
This is an automated message, please do not reply.
  `.trim();

  return { subject, html, text };
}