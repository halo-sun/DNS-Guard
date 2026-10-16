import { useState } from "react";
import { Download, Activity, AlertTriangle, Shield, Server } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
} from "recharts";
import { api } from "../lib/api";
import { useQuery } from "@tanstack/react-query";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/States";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

interface AnalyticsResponse {
  // re-export schema shape from backend (see /backend/app/schemas/dashboard.py)
  time_range: string;
  start_time: string;
  end_time: string;
  total_queries: number;
  nxdomain_count: number;
  record_type_breakdown: Record<string, number>;
  response_code_breakdown: Record<string, number>;
  alert_open_count: number;
  alert_closed_count: number;
  severity_breakdown: Record<string, number>;
  query_volume_timeline: { timestamp: string; queries: number; nxdomain: number }[];
  top_domains: { domain: string; count: number }[];
  top_clients: { client_ip: string; count: number }[];
}

function useAnalytics(timeRange: string) {
  return useQuery<AnalyticsResponse | null>({
    queryKey: ["analyticsExtended", timeRange],
    queryFn: () => api.getAnalyticsExtended(timeRange),
    staleTime: 10000,
  });
}

function TimelineChart({ data, isLoading, error, refetch }: {
  data: AnalyticsResponse["query_volume_timeline"];
  isLoading: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
}) {
  return (
    <Card variant="surface-1">
      <CardHeader>
        <div>
          <CardTitle>
            <Activity className="w-4 h-4 inline mr-2 align-middle" />
            DNS Telemetry Volume &amp; NXDOMAIN Failures
          </CardTitle>
          <p className="text-xs text-ink-subtle">Aggregated query rate versus non-existent domain anomalies</p>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState title="Loading analytics timeline..." />
        ) : error ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !data || data.length === 0 ? (
          <EmptyState title="No timeline data" description="No DNS telemetry aggregated for the selected window." />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="queryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5e6ad2" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#5e6ad2" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="nxGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="timestamp" stroke="#62666d" fontSize={11} tickLine={false} />
                <YAxis stroke="#62666d" fontSize={11} tickLine={false} axisLine={false} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#0f1011",
                    borderColor: "#34343a",
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: "#f7f8f8",
                  }}
                />
                <Area type="monotone" dataKey="queries" stroke="#5e6ad2" strokeWidth={2} fill="url(#queryGrad)" name="Total Queries" />
                <Area type="monotone" dataKey="nxdomain" stroke="#f59e0b" strokeWidth={2} fill="url(#nxGrad)" name="NXDOMAIN" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecordTypeBreakdown({
  breakdown, isLoading, error, refetch
}: {
  breakdown: Record<string, number>;
  isLoading: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
}) {
  const entries = Object.entries(breakdown);
  const grandTotal = entries.reduce((sum, [, count]) => sum + count, 0);
  const visibleEntries = entries.filter(([, count]) => count > 0);

  return (
    <Card variant="surface-1">
      <CardHeader>
        <CardTitle><Server className="w-4 h-4 inline mr-2 align-middle" />Record Type Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState title="Loading record types..." />
        ) : error ? (
          <ErrorState onRetry={() => refetch()} />
        ) : visibleEntries.length === 0 ? (
          <EmptyState title="No record-type data" description="No DNS query types observed in the selected window." />
        ) : (
          <div className="space-y-3">
            {visibleEntries.map(([type, count]) => (
              <div key={type} className="space-y-1 font-mono text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-ink font-semibold">{type}</span>
                  <span className="text-ink-subtle tabular-nums">
                    {count.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-surface-3 h-2 rounded overflow-hidden">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${grandTotal > 0 ? (count / grandTotal) * 100 : 0}%`,
                      backgroundColor: "#5e6ad2",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ResponseCodeBreakdown({
  breakdown, isLoading, error, refetch
}: {
  breakdown: Record<string, number>;
  isLoading: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
}) {
  const entries = Object.entries(breakdown);
  const visibleEntries = entries.filter(([, count]) => count > 0);

  return (
    <Card variant="surface-1">
      <CardHeader>
        <CardTitle><Server className="w-4 h-4 inline mr-2 align-middle" />Response Code Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState title="Loading response codes..." />
        ) : error ? (
          <ErrorState onRetry={() => refetch()} />
        ) : visibleEntries.length === 0 ? (
          <EmptyState title="No response-code data" description="No DNS response codes observed in the selected window." />
        ) : (
          <BarChart width={420} height={220} data={visibleEntries.map(([code, count]) => ({ code, count }))} layout="vertical">
            <XAxis type="number" domain={[0, "data.max"]} stroke="#62666d" fontSize={11} tickLine={false} />
            <YAxis dataKey="code" type="category" width={48} stroke="#62666d" fontSize={11} tickLine={false} />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: "#0f1011",
                borderColor: "#34343a",
                borderRadius: "6px",
                fontSize: "12px",
                color: "#f7f8f8",
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {visibleEntries.map(([code]) => (
                <Cell key={String(code)} fill="#5e6ad2" />
              ))}
            </Bar>
          </BarChart>
        )}
      </CardContent>
    </Card>
  );
}

function SeverityBreakdown({
  breakdown, isLoading, error, refetch
}: {
  breakdown: Record<string, number>;
  isLoading: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
}) {
  const entries = Object.entries(breakdown);
  const grandTotal = entries.reduce((sum, [, count]) => sum + count, 0);
  const visibleEntries = entries.filter(([, count]) => count > 0);

  return (
    <Card variant="surface-1">
      <CardHeader>
        <CardTitle><Shield className="w-4 h-4 inline mr-2 align-middle" />Alert Severity Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState title="Loading severity distribution..." />
        ) : error ? (
          <ErrorState onRetry={() => refetch()} />
        ) : visibleEntries.length === 0 ? (
          <EmptyState title="No alert data" description="No alerts generated in the selected window." />
        ) : (
          <div className="space-y-3">
            {visibleEntries
              .sort(([a], [b]) => {
                const rank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
                return (rank[a] ?? 9) - (rank[b] ?? 9);
              })
              .map(([severity, count]) => (
                <div key={severity} className="space-y-1 font-mono text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-ink font-semibold">{severity}</span>
                    <span className="text-ink-subtle tabular-nums">
                      {count.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-surface-3 h-2 rounded overflow-hidden">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${grandTotal > 0 ? (count / grandTotal) * 100 : 0}%`,
                        backgroundColor: SEVERITY_COLORS[severity] ?? "#5e6ad2",
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function Analytics() {
  const [timeRange, setTimeRange] = useState("24h");
  const [isExporting, setIsExporting] = useState(false);
  const { data, isLoading, error, refetch } = useAnalytics(timeRange);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await api.exportAnalyticsCsv(timeRange);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historical Analytics &amp; Reporting"
        description="Aggregate resolution trends, failure rates, protocol distribution, and alert severity across stored DNS telemetry."
        actions={
          <div className="flex items-center gap-2">
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-36 text-xs"
            >
              <option value="1h">Last 1 Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportCsv}
              isLoading={isExporting}
              className="gap-1.5 text-xs"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
          </div>
        }
      />

      {/* Timeline */}
      <TimelineChart
        data={data?.query_volume_timeline ?? []}
        isLoading={isLoading}
        error={error}
        refetch={refetch}
      />

      {/* Breakdown grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecordTypeBreakdown
          breakdown={data?.record_type_breakdown ?? {}}
          isLoading={isLoading}
          error={error}
          refetch={refetch}
        />
        <ResponseCodeBreakdown
          breakdown={data?.response_code_breakdown ?? {}}
          isLoading={isLoading}
          error={error}
          refetch={refetch}
        />
      </div>

      {/* Alert severity */}
      <SeverityBreakdown
        breakdown={data?.severity_breakdown ?? {}}
        isLoading={isLoading}
        error={error}
        refetch={refetch}
      />

      {/* Statistical summary */}
      <Card variant="surface-1">
        <CardHeader>
          <CardTitle><AlertTriangle className="w-4 h-4 inline mr-2 align-middle" />Aggregation Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
          {isLoading ? (
            <LoadingState title="Loading statistics..." />
          ) : error ? (
            <ErrorState onRetry={() => refetch()} />
          ) : !data ? (
            <EmptyState title="No statistics available" description="No telemetry aggregated in the selected window." />
          ) : (
            <>
              <div className="p-3 rounded bg-surface-2 border border-hairline flex items-center justify-between gap-3">
                <span className="text-ink-subtle truncate">Total Queries</span>
                <span className="text-ink font-bold tabular-nums">{data.total_queries.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded bg-surface-2 border border-hairline flex items-center justify-between gap-3">
                <span className="text-ink-subtle truncate">NXDOMAIN Failures</span>
                <span className="text-ink font-bold tabular-nums">{data.nxdomain_count.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded bg-surface-2 border border-hairline flex items-center justify-between gap-3">
                <span className="text-ink-subtle truncate">Open Alerts</span>
                <span className="text-severity-critical font-bold tabular-nums">{data.alert_open_count.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded bg-surface-2 border border-hairline flex items-center justify-between gap-3">
                <span className="text-ink-subtle truncate">Closed Alerts</span>
                <span className="text-ink font-bold tabular-nums">{data.alert_closed_count.toLocaleString()}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
