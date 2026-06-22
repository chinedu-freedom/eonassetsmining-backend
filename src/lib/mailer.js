import { emailTemplate } from "./template.js";
import { sendEmail } from "./zohoMailer.js";

// Verification Email
export async function sendVerificationEmail({ email, name, code }) {
  const subject = "Verify Your Email - EonAssets";

  const content = `
    <div style="text-align:center; padding:10px 0;">
      <h2 style="color:#0f172a; margin-bottom:10px;">Verify Your Email Address</h2>
      <p style="color:#475569; font-size:16px; line-height:1.6; margin-bottom: 24px;">
        Hi ${name},<br><br>
        To complete your profile and unlock full access to investing, deposits, and withdrawals, please use the verification code below:
      </p>
      <div style="margin:30px 0;">
        <span style="background:#f1f5f9; color:#2563eb; padding:16px 32px; border-radius:8px; font-size:28px; font-weight:bold; letter-spacing: 8px; display:inline-block; border: 1px dashed #cbd5e1;">
          ${code}
        </span>
      </div>
      <p style="font-size:14px; color:#64748b; margin-top:20px;">
        This code will expire in <strong>10 minutes</strong>.
      </p>
      <p style="font-size:13px; color:#94a3b8; margin-top:30px;">
        If you did not request this verification, you can safely ignore this email.
      </p>
    </div>
  `;

  return await sendEmail({ to: email, subject, html: emailTemplate(content) });
}
