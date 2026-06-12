import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Mail, CheckCircle2, XCircle, Send, Search, X, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useMemo, useState } from "react";


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
        .limit(2000);
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

  // Filters & pagination
  const [search, setSearch] = useState("");
  const [recipientFilter, setRecipientFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fmtIST = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

  const recipientOptions = useMemo(
    () => Array.from(new Set([...RECIPIENTS, ...logs.map((l) => l.to_email)])),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromTs = dateFrom ? new Date(dateFrom + "T00:00:00").getTime() : null;
    const toTs = dateTo ? new Date(dateTo + "T23:59:59.999").getTime() : null;
    return logs.filter((l) => {
      if (recipientFilter !== "all" && l.to_email !== recipientFilter) return false;
      if (statusFilter !== "all") {
        if (statusFilter === "delivered" && l.status !== "delivered") return false;
        if (statusFilter === "failed" && l.status === "delivered") return false;
      }
      const ts = new Date(l.sent_at).getTime();
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts > toTs) return false;
      if (q) {
        const hay = `${l.to_email} ${l.from_email} ${l.subject} ${l.error_message ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [logs, search, recipientFilter, statusFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pagedLogs = filteredLogs.slice(pageStart, pageStart + pageSize);

  const hasActiveFilter =
    search !== "" || recipientFilter !== "all" || statusFilter !== "all" || dateFrom !== "" || dateTo !== "";

  const resetFilters = () => {
    setSearch("");
    setRecipientFilter("all");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };



  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-2">
            <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 px-2 text-muted-foreground hover:text-foreground">
              <Link to="/">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Reminder Email Log</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Daily reminders sent at 8 AM – 2 PM IST to both recipients.
              </p>
            </div>
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
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid gap-3 md:grid-cols-12">
              <div className="md:col-span-4 relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search email, subject, error…"
                  className="pl-8"
                />
              </div>
              <div className="md:col-span-3">
                <Select
                  value={recipientFilter}
                  onValueChange={(v) => {
                    setRecipientFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All recipients</SelectItem>
                    {recipientOptions.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3 grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                  aria-label="From date"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                  aria-label="To date"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground flex-wrap gap-2">
              <span>
                Showing <strong>{filteredLogs.length === 0 ? 0 : pageStart + 1}</strong>–
                <strong>{Math.min(pageStart + pageSize, filteredLogs.length)}</strong> of{" "}
                <strong>{filteredLogs.length}</strong>
                {hasActiveFilter && ` (filtered from ${logs.length})`}
              </span>
              {hasActiveFilter && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <X className="mr-1 h-3 w-3" />
                  Clear filters
                </Button>
              )}
            </div>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No emails sent yet. The first reminder will fire at the next scheduled hour (IST).
              </p>
            ) : filteredLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No emails match the current filters.</p>
            ) : (
              <>
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
                    {pagedLogs.map((log) => (
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

                {/* Pagination */}
                <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Rows per page</span>
                    <Select
                      value={String(pageSize)}
                      onValueChange={(v) => {
                        setPageSize(Number(v));
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8 w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 25, 50, 100].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                      Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
