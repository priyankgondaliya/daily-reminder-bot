import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, Clock, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Daily Login Reminder Automation" },
      { name: "description", content: "Automated daily login reminders sent every hour from 8 AM to 2 PM IST." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-2xl text-center space-y-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">Daily Login Reminder</h1>
          <p className="text-muted-foreground text-lg">
            Sends a reminder email to both recipients every hour from 8 AM to 2 PM IST.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-left">
          <div className="border rounded-lg p-4">
            <Clock className="w-5 h-5 text-primary mb-2" />
            <p className="font-medium">Schedule</p>
            <p className="text-sm text-muted-foreground">8, 9, 10, 11 AM &amp; 12, 1, 2 PM (IST)</p>
          </div>
          <div className="border rounded-lg p-4">
            <CheckCircle2 className="w-5 h-5 text-primary mb-2" />
            <p className="font-medium">Recipients</p>
            <p className="text-sm text-muted-foreground break-all">
              nency.dave321@gmail.com<br />nency.dave@cmarix.com
            </p>
          </div>
        </div>

        <Link
          to="/reminders"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
        >
          View Delivery Log →
        </Link>
      </div>
    </div>
  );
}
