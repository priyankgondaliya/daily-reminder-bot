import { createFileRoute } from "@tanstack/react-router";

// const RECIPIENTS = ["nency.dave321@gmail.com", "nency.dave@cmarix.com"];
const RECIPIENT = "nency.dave@cmarix.com";
const FROM_EMAIL = "Reminder <onboarding@resend.dev>";
const SUBJECT = "Reminder: Log in to Web & Keka";
const HTML_BODY = `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; padding:24px; max-width:560px; margin:auto;">
    <h2 style="color:#111;">Daily Login Reminder</h2>
    <p style="font-size:15px; color:#333; line-height:1.6;">
      Hi Nency,
    </p>
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
        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        if (!RESEND_API_KEY) {
          return new Response(
            JSON.stringify({ error: "RESEND_API_KEY not configured" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const results: Array<{ to: string; status: string; id?: string; error?: string }> = [];

        for (const to of RECIPIENTS) {
          try {
            const res = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
              },
              body: JSON.stringify({
                from: FROM_EMAIL,
                to: [to],
                subject: SUBJECT,
                html: HTML_BODY,
              }),
            });

            const data = (await res.json()) as { id?: string; message?: string; name?: string };

            if (res.ok && data.id) {
              await supabaseAdmin.from("email_logs").insert({
                to_email: to,
                from_email: FROM_EMAIL,
                subject: SUBJECT,
                status: "delivered",
                resend_id: data.id,
              });
              results.push({ to, status: "delivered", id: data.id });
            } else {
              const errMsg = data.message || data.name || `HTTP ${res.status}`;
              await supabaseAdmin.from("email_logs").insert({
                to_email: to,
                from_email: FROM_EMAIL,
                subject: SUBJECT,
                status: "failed",
                error_message: errMsg,
              });
              results.push({ to, status: "failed", error: errMsg });
            }
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err);
            await supabaseAdmin.from("email_logs").insert({
              to_email: to,
              from_email: FROM_EMAIL,
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
