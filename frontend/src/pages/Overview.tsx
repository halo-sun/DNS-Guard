import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ShieldAlert,
  Globe,
  Radio,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Play,
} from "lucide-react";
import { useDashboardSummary } from "../lib/queries";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { SeverityBadge } from "../components/ui/SeverityBadge";
import { LoadingState, ErrorState } from "../components/ui/States";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { api } from "../lib/api";

export function Overview() {
  const { data: summary, isLoading, error, refetch } = useDashboardSummary();
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);

  const handleGenerateDemo = async () => {
    setIsGeneratingDemo(true);
    try {
      await api.triggerDemoIngest(30);
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  if (isLoading) return <LoadingState title="Loading DNS Guard Overview..." />;
  if (error || !summary) return <ErrorState onRetry={() => refetch()} />;

  const severityBarData = [
    { name: "Critical", count: summary.severity_distribution.critical, color: "#dc2626" },
    { name: "High", count: summary.severity_distribution.high, color: "#ea580c" },
    { name: "Medium", count: summary.severity_distribution.medium, color: "#f59e0b" },
    { name: "Low", count: summary.severity_distribution.low, color: "#27a644" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: DEMO MODE Notice or Source Indicator */}
      {summary.is_demo && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-lg bg-surface-2 border border-hairline-strong gap-3">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-primary text-white tracking-wider">
              DEMO MODE
            </span>
            <span className="text-xs text-ink-muted">
              Displaying deterministic synthetic telemetry for demonstration and evaluation.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            isLoading={isGeneratingDemo}
            onClick={handleGenerateDemo}
            className="text-xs gap-1.5 shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Generate Burst
          </Button>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="surface-1">
          <div className="flex items-center justify-between text-ink-subtle mb-2">
            <span className="text-xs font-medium">Total Queries</span>
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold font-mono text-ink tracking-tight">
            {summary.total_queries.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#4ade80] mt-1 font-mono">
            <TrendingUp className="w-3 h-3" />
            <span>Normal baseline</span>
          </div>
        </Card>

        <Card variant="surface-1">
          <div className="flex items-center justify-between text-ink-subtle mb-2">
            <span className="text-xs font-medium">Suspicious Events</span>
            <AlertTriangle className="w-4 h-4 text-severity-high" />
          </div>
          <div className="text-2xl font-bold font-mono text-severity-high tracking-tight">
            {summary.suspicious_events}
          </div>
          <div className="text-[11px] text-ink-subtle mt-1 font-mono">
            {((summary.suspicious_events / (summary.total_queries || 1)) * 100).toFixed(2)}% of total traffic
          </div>
        </Card>

        <Card variant="surface-1">
          <div className="flex items-center justify-between text-ink-subtle mb-2">
            <span className="text-xs font-medium">Open Threat Alerts</span>
            <ShieldAlert className="w-4 h-4 text-severity-critical" />
          </div>
          <div className="text-2xl font-bold font-mono text-severity-critical tracking-tight">
            {summary.open_alerts}
          </div>
          <div className="text-[11px] text-ink-subtle mt-1 flex items-center gap-1">
            <Link to="/alerts" className="text-primary-hover hover:underline inline-flex items-center gap-0.5">
              Review alerts <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>

        <Card variant="surface-1">
          <div className="flex items-center justify-between text-ink-subtle mb-2">
            <span className="text-xs font-medium">Observed Endpoints</span>
            <Radio className="w-4 h-4 text-primary-hover" />
          </div>
          <div className="text-2xl font-bold font-mono text-ink tracking-tight">
            {summary.unique_clients}
          </div>
          <div className="text-[11px] text-ink-subtle mt-1 font-mono">
            Across {summary.unique_domains} unique domains
          </div>
        </Card>
      </div>

      {/* Primary Visualizations: Query Volume & Severity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Timeline (2 cols) */}
        <Card variant="surface-1" className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>DNS Query Activity Timeline</CardTitle>
              <p className="text-xs text-ink-subtle">Aggregated query volume and suspicious event rate over time</p>
            </div>
            <Link to="/live-dns" className="text-xs text-primary-hover hover:underline flex items-center gap-1">
              Live Feed <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.query_volume_timeline}>
                  <defs>
                    <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5e6ad2" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#5e6ad2" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorSuspicious" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0} />
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
                  <Area
                    type="monotone"
                    dataKey="queries"
                    stroke="#5e6ad2"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorQueries)"
                    name="Queries"
                  />
                  <Area
                    type="monotone"
                    dataKey="suspicious"
                    stroke="#dc2626"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSuspicious)"
                    name="Suspicious"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Severity Distribution (1 col) */}
        <Card variant="surface-1">
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
            <p className="text-xs text-ink-subtle">Correlated findings by risk level</p>
          </CardHeader>
          <CardContent>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityBarData} layout="vertical">
                  <XAxis type="number" stroke="#62666d" fontSize={10} hide />
                  <YAxis dataKey="name" type="category" stroke="#8a8f98" fontSize={11} width={65} tickLine={false} />
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
                    {severityBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-hairline text-xs font-mono">
              <div className="p-2 rounded bg-surface-2 border border-hairline">
                <span className="text-ink-subtle block text-[10px]">NXDOMAIN Rate</span>
                <span className="text-ink font-semibold">{summary.nxdomain_rate_percent}%</span>
              </div>
              <div className="p-2 rounded bg-surface-2 border border-hairline">
                <span className="text-ink-subtle block text-[10px]">Active Sources</span>
                <span className="text-ink font-semibold">{summary.active_sources_count} Online</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Section: Recent Alerts & Top Queried Domains */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Threat Alerts */}
        <Card variant="surface-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-severity-critical" />
              <CardTitle>Recent Threat Alerts</CardTitle>
            </div>
            <Link to="/alerts" className="text-xs text-primary-hover hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.recent_alerts.length === 0 ? (
              <p className="text-xs text-ink-subtle py-4 text-center">No active alerts recorded.</p>
            ) : (
              summary.recent_alerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-lg bg-surface-2 border border-hairline hover:border-hairline-strong transition-all"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <SeverityBadge severity={alert.severity} score={alert.risk_score} />
                    <span className="text-[10px] text-ink-subtle font-mono">
                      {new Date(alert.last_seen_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-ink leading-snug">{alert.title}</h4>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-mono text-ink-subtle">
                    <span>Target: <span className="text-ink">{alert.normalized_domain}</span></span>
                    <span>Client: <span className="text-ink">{alert.client_ip}</span></span>
                    <span>Events: <span className="text-ink">{alert.related_event_count}</span></span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top Queried Domains */}
        <Card variant="surface-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <CardTitle>Top Queried Domains</CardTitle>
            </div>
            <Link to="/domains" className="text-xs text-primary-hover hover:underline flex items-center gap-1">
              Explorer <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {summary.top_queried_domains.map((item) => (
                <div
                  key={item.domain}
                  className="flex items-center justify-between p-2 rounded-md bg-surface-2/60 border border-hairline text-xs font-mono"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-surface-3 text-ink-muted border border-hairline">
                      {item.record_type}
                    </span>
                    <span className="truncate text-ink font-medium">{item.domain}</span>
                    {item.is_suspicious && (
                      <span className="px-1.5 py-0.5 text-[9px] rounded bg-severity-critical/20 text-[#ff6b6b] border border-severity-critical/30">
                        FLAGGED
                      </span>
                    )}
                  </div>
                  <span className="text-ink-subtle shrink-0 ml-2 font-semibold">
                    {item.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heuristic Anomaly Indicators Banner */}
      <Card variant="surface-2" className="border-hairline-strong">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Heuristic Anomaly Signals (Active Window)
          </h4>
          <span className="text-[10px] text-ink-tertiary font-mono">Observe-Only Engine</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded bg-surface-1 border border-hairline">
            <span className="text-ink-subtle text-[11px] block">Tunneling Bursts</span>
            <span className="text-lg font-bold text-ink">
              {summary.anomaly_summary.tunneling_candidates}
            </span>
          </div>
          <div className="p-2.5 rounded bg-surface-1 border border-hairline">
            <span className="text-ink-subtle text-[11px] block">NXDOMAIN Spikes</span>
            <span className="text-lg font-bold text-ink">
              {summary.anomaly_summary.nxdomain_spikes}
            </span>
          </div>
          <div className="p-2.5 rounded bg-surface-1 border border-hairline">
            <span className="text-ink-subtle text-[11px] block">DGA Patterns</span>
            <span className="text-lg font-bold text-ink">
              {summary.anomaly_summary.dga_candidates}
            </span>
          </div>
          <div className="p-2.5 rounded bg-surface-1 border border-hairline">
            <span className="text-ink-subtle text-[11px] block">High Entropy Labels</span>
            <span className="text-lg font-bold text-ink">
              {summary.anomaly_summary.entropy_spikes}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
