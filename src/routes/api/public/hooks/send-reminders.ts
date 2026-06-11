import { createFileRoute } from "@tanstack/react-router";
import nodemailer from "nodemailer";

const RECIPIENTS = ["nency.dave321@gmail.com", "nency.dave@cmarix.com"];
const SUBJECT = "⏰ Reminder: Log in to Web Portal & Keka";
const HTML_BODY = `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(15,23,42,0.06);">
            <tr>
              <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:32px 32px 28px;text-align:center;">
                <div style="font-size:40px;line-height:1;margin-bottom:8px;">⏰</div>
                <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.2px;">Daily Login Reminder</h1>
                <p style="margin:6px 0 0;color:#e0e7ff;font-size:13px;">VKJ_TMS Automation</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 14px;font-size:16px;color:#111827;">Hi Nency,</p>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#374151;">
                  Just a friendly reminder to complete your daily check-in. Please make sure to log in to both systems below:
                </p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
                  <tr>
                    <td style="padding:14px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;">
                      <div style="font-size:14px;color:#6b7280;margin-bottom:2px;">✅ Step 1</div>
                      <div style="font-size:15px;font-weight:600;color:#111827;">Log in to the Web Portal</div>
                    </td>
                  </tr>
                  <tr><td style="height:10px;line-height:10px;font-size:0;">&nbsp;</td></tr>
                  <tr>
                    <td style="padding:14px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;">
                      <div style="font-size:14px;color:#6b7280;margin-bottom:2px;">✅ Step 2</div>
                      <div style="font-size:15px;font-weight:600;color:#111827;">Log in to Keka</div>
                    </td>
                  </tr>
                </table>

                <div style="padding:14px 16px;background:#eef2ff;border-left:4px solid #4f46e5;border-radius:8px;margin-bottom:8px;">
                  <p style="margin:0;font-size:13px;color:#3730a3;line-height:1.5;">
                    🕐 This reminder runs every hour from <strong>8 AM to 2 PM IST</strong>, Monday to Friday.
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px 28px;text-align:center;border-top:1px solid #f1f5f9;">
                <p style="margin:0;font-size:12px;color:#9ca3af;">
                  Sent automatically by VKJ_TMS Reminder Bot
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

export const Route = createFileRoute("/api/public/hooks/send-reminders")({
  server: {
    handlers: {
      POST: async () => {
        const {
          SMTP_HOST,
          SMTP_PORT,
          SMTP_SECURE,
          SMTP_USER,
          SMTP_PASS,
          EMAIL_FROM,
          EMAIL_FROM_NAME,
        } = process.env;

        if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM) {
          return new Response(
            JSON.stringify({ error: "SMTP env vars not configured" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const fromEmail = EMAIL_FROM_NAME ? `${EMAIL_FROM_NAME} <${EMAIL_FROM}>` : EMAIL_FROM;

        const transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port: Number(SMTP_PORT ?? 587),
          secure: SMTP_SECURE === "true",
          auth: { user: SMTP_USER, pass: SMTP_PASS },
        });

        const results: Array<{ to: string; status: string; id?: string; error?: string }> = [];

        for (const to of RECIPIENTS) {
          try {
            const info = await transporter.sendMail({
              from: fromEmail,
              to,
              subject: SUBJECT,
              html: HTML_BODY,
            });

            await supabaseAdmin.from("email_logs").insert({
              to_email: to,
              from_email: fromEmail,
              subject: SUBJECT,
              status: "delivered",
              resend_id: info.messageId ?? null,
            });
            results.push({ to, status: "delivered", id: info.messageId });
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err);
            await supabaseAdmin.from("email_logs").insert({
              to_email: to,
              from_email: fromEmail,
              subject: SUBJECT,
              status: "failed",
              error_message: errMsg,
            });
            results.push({ to, status: "failed", error: errMsg });
          }
        }

        return new Response(JSON.stringify({ ok: true, results }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
