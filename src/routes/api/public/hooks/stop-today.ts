import { createFileRoute } from "@tanstack/react-router";

const ALLOWED = ["nency.dave321@gmail.com", "nency.dave@cmarix.com"];

function istDateString(): string {
  // YYYY-MM-DD in Asia/Kolkata
  const now = new Date();
  const ist = new Date(now.getTime() + (5.5 * 60 - now.getTimezoneOffset()) * 60000);
  return ist.toISOString().slice(0, 10);
}

function htmlPage(title: string, message: string, accent: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;">
  <div style="max-width:480px;width:100%;background:#fff;border-radius:16px;box-shadow:0 4px 16px rgba(15,23,42,0.08);overflow:hidden;text-align:center;">
    <div style="background:${accent};padding:28px;color:#fff;font-size:32px;">✅</div>
    <div style="padding:28px;">
      <h1 style="margin:0 0 10px;font-size:20px;color:#111827;">${title}</h1>
      <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.6;">${message}</p>
    </div>
  </div>
</body></html>`;
}

export const Route = createFileRoute("/api/public/hooks/stop-today")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const email = (url.searchParams.get("email") ?? "").toLowerCase().trim();

        if (!ALLOWED.includes(email)) {
          return new Response(
            htmlPage("Invalid request", "This stop link is not valid.", "#dc2626"),
            { status: 400, headers: { "Content-Type": "text/html" } }
          );
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const today = istDateString();

        const { error } = await supabaseAdmin
          .from("reminder_stops")
          .upsert({ stop_date: today, stopped_by: email }, { onConflict: "stop_date" });

        if (error) {
          return new Response(
            htmlPage("Something went wrong", error.message, "#dc2626"),
            { status: 500, headers: { "Content-Type": "text/html" } }
          );
        }

        return new Response(
          htmlPage(
            "Reminders stopped for today",
            `No more reminder emails will be sent today (${today} IST). They'll resume automatically tomorrow.`,
            "linear-gradient(135deg,#10b981 0%,#059669 100%)"
          ),
          { headers: { "Content-Type": "text/html" } }
        );
      },
    },
  },
});
