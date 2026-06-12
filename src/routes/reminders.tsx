import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCw, Mail, CheckCircle2, XCircle, Send, BellOff } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/reminders")({
  head: () => ({
    meta: [
      { title: "Reminder Email Log" },
      { name: "description", content: "Delivery log for daily login reminder emails." },
    ],
  }),
  component: RemindersPage,
});

type EmailLog = {
  id: string;
  to_email: string;
  from_email: string;
  subject: string;
  status: string;
  error_message: string | null;
  sent_at: string;
};

type StopRow = { stop_date: string; stopped_by: string; stopped_at: string };

const RECIPIENTS = ["nency.dave321@gmail.com", "nency.dave@cmarix.com"];

function istDateString(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + (5.5 * 60 - now.getTimezoneOffset()) * 60000);
  return ist.toISOString().slice(0, 10);
}

function RemindersPage() {
  const [isSending, setIsSending] = useState(false);
  const [stoppingEmail, setStoppingEmail] = useState<string | null>(null);
  const today = istDateString();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["email_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_logs")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as EmailLog[];
    },
  });

  const { data: stopToday, refetch: refetchStop } = useQuery({
    queryKey: ["reminder_stop", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminder_stops")
        .select("*")
        .eq("stop_date", today)
        .maybeSingle();
      if (error) throw error;
      return data as StopRow | null;
    },
  });

  const handleSendNow = async () => {
    setIsSending(true);
    try {
      const res = await fetch("/api/public/hooks/send-reminders", { method: "POST" });
      const json = (await res.json()) as {
        ok?: boolean;
        skipped?: boolean;
        reason?: string;
        results?: Array<{ to: string; status: string; error?: string }>;
        error?: string;
      };
      if (res.ok && json.ok) {
        if (json.skipped) {
          toast.info(json.reason ?? "Reminders stopped for today");
        } else {
          const failedCount = json.results?.filter((r) => r.status === "failed").length ?? 0;
          const sentCount = (json.results?.length ?? 0) - failedCount;
          toast.success(`Sent ${sentCount} email${sentCount !== 1 ? "s" : ""}${failedCount > 0 ? `, ${failedCount} failed` : ""}`);
        }
        await refetch();
      } else {
        toast.error(json.error || "Failed to send emails");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSending(false);
    }
  };

  const handleStopToday = async (email: string) => {
    setStoppingEmail(email);
    try {
      const res = await fetch(
        `/api/public/hooks/stop-today?email=${encodeURIComponent(email)}`,
        { method: "GET" }
      );
      if (res.ok) {
        toast.success(`Reminders stopped for today (by ${email})`);
        await refetchStop();
      } else {
        toast.error("Failed to stop reminders");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setStoppingEmail(null);
    }
  };

  const logs = data ?? [];
  const delivered = logs.filter((l) => l.status === "delivered").length;
  const failed = logs.filter((l) => l.status !== "delivered").length;

  const fmtIST = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reminder Email Log</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Daily reminders sent at 8 AM – 2 PM IST to both recipients.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSendNow} disabled={isSending}>
              <Send className={`mr-2 h-4 w-4 ${isSending ? "animate-pulse" : ""}`} />
              {isSending ? "Sending…" : "Send Now"}
            </Button>
            <Button onClick={() => refetch()} disabled={isFetching} variant="outline">
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {stopToday && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span className="text-green-900">
                  Reminders are <strong>stopped for today</strong> ({today} IST) — stopped by{" "}
                  <strong>{stopToday.stopped_by}</strong> at {fmtIST(stopToday.stopped_at)}.
                  No more emails will go to either recipient today. Reminders resume automatically tomorrow.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{logs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{delivered}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{failed}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Delivery History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No emails sent yet. The first reminder will fire at the next scheduled hour (IST).
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sent At (IST)</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">{fmtIST(log.sent_at)}</TableCell>
                      <TableCell className="text-sm">{log.from_email}</TableCell>
                      <TableCell className="text-sm">{log.to_email}</TableCell>
                      <TableCell className="text-sm">{log.subject}</TableCell>
                      <TableCell>
                        {log.status === "delivered" ? (
                          <Badge className="bg-green-600 hover:bg-green-700">Delivered</Badge>
                        ) : (
                          <Badge variant="destructive" title={log.error_message ?? ""}>
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
