import { createFileRoute } from "@tanstack/react-router";
import nodemailer from "nodemailer";

const RECIPIENTS = ["nency.dave321@gmail.com", "nency.dave@cmarix.com"];
const SUBJECT = "Reminder: Log in to Web & Keka";
const HTML_BODY = `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; padding:24px; max-width:560px; margin:auto;">
    <h2 style="color:#111;">Daily Login Reminder</h2>
    <p style="font-size:15px; color:#333; line-height:1.6;">Hi Nency,</p>
    <p style="font-size:15px; color:#333; line-height:1.6;">
      This is your scheduled reminder to <strong>log in to the Web portal</strong> and <strong>Keka</strong>.
    </p>
    <p style="font-size:14px; color:#666; line-height:1.6;">
      You'll receive this reminder every hour from 8 AM to 2 PM IST.
    </p>
    <p style="font-size:13px; color:#888; margin-top:32px;">— Automated Reminder Bot</p>
  </div>
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
