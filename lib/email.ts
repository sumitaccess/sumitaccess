// ============================================================================
// Email provider — Resend-compatible architecture.
// In development, "sends" are logged to the server console and (if the client
// is authenticated) can be viewed through the app. Swap `send()` for a real
// Resend/SES/SMTP implementation without touching call sites.
// ============================================================================

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const from = process.env.EMAIL_FROM || "SkillSwap <no-reply@skillswap.app>";
  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey) {
    // Production path — Resend-compatible API
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: payload.to, subject: payload.subject, html: payload.html, text: payload.text }),
    });
    if (!res.ok) {
      console.error("Email send failed:", res.status, await res.text().catch(() => ""));
    }
    return;
  }

  // Development path — log the email (never fail the flow)
  console.log(`\n── 📧 SkillSwap email (dev sink) ─────────────────────────`);
  console.log(`  To:      ${payload.to}`);
  console.log(`  Subject: ${payload.subject}`);
  console.log(`${payload.text ?? payload.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300)}`);
  console.log(`───────────────────────────────────────────────────────\n`);
}

export async function sendOtpEmail(to: string, name: string, code: string): Promise<void> {
  await sendEmail({
    to,
    subject: "Your SkillSwap verification code",
    text: `Hi ${name},\n\nYour SkillSwap verification code is:\n\n${code}\n\nIt expires in 10 minutes. If you didn't create a SkillSwap account, you can safely ignore this email.\n\n— The SkillSwap team`,
    html: `<div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto">
      <h2 style="font-size:20px;margin-bottom:8px">Verify your email</h2>
      <p>Hi ${name},</p>
      <p>Your SkillSwap verification code is:</p>
      <p style="font-size:32px;font-weight:800;letter-spacing:8px;color:#4f46e5;margin:16px 0">${code}</p>
      <p style="color:#6b7280;font-size:13px">This code expires in 10 minutes. If you didn't create a SkillSwap account, you can safely ignore this email.</p>
    </div>`,
  });
}

export async function sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const link = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to,
    subject: "Reset your SkillSwap password",
    text: `Hi ${name},\n\nWe received a request to reset your SkillSwap password. Click the link below to choose a new one:\n\n${link}\n\nThis link expires in 60 minutes.\n\n— The SkillSwap team`,
    html: `<div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto">
      <h2 style="font-size:20px;margin-bottom:8px">Reset your SkillSwap password</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Click the button below to choose a new one:</p>
      <a href="${link}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">Reset password</a>
      <p style="color:#6b7280;font-size:13px;margin-top:16px">This link expires in 60 minutes. If you didn't request this, you can safely ignore this email.</p>
    </div>`,
  });
}
