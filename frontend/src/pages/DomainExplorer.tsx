import { useState, useMemo } from "react";
import { Search, ShieldAlert, Activity, Hash, Lock } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Input } from "../components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { SeverityBadge } from "../components/ui/SeverityBadge";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/States";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

interface DomainSummaryResponse {
  normalized_domain: string;
  query_count: number;
  first_seen_at: string | null;
  last_seen_at: string | null;
  record_type_breakdown: Record<string, number>;
  response_code_breakdown: Record<string, number>;
  client_counts: Array<{ client_ip: string; client_name: string | null; query_count: number }>;
  associated_alert_ids: string[];
  associated_alerts: Array<{ id: string; severity: string; risk_score: number; status: string; title: string; category: string; client_ip: string; first_seen_at: string; last_seen_at: string; related_event_count: number }>;
}

function calculateEntropy(str: string): number {
  if (!str) return 0;
  const frequencies: Record<string, number> = {};
  for (const char of str) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  let entropy = 0;
  const len = str.length;
  for (const count of Object.values(frequencies)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return Number(entropy.toFixed(3));
}

function useDomainSummary(domain: string, enabled: boolean) {
  return useQuery<DomainSummaryResponse | null>({
    queryKey: ["domainSummary", domain],
    queryFn: () => api.getDomainSummary(domain),
    enabled: enabled && Boolean(domain),
    staleTime: 10000,
  });
}

export function DomainExplorer() {
  const [domainInput, setDomainInput] = useState("");
  const normalizedDomain = domainInput.trim().toLowerCase();
  const summaryQuery = useDomainSummary(normalizedDomain, Boolean(normalizedDomain));

  const entropy = useMemo(() => {
    if (!normalizedDomain) return 0;
    const labels = normalizedDomain.split(".");
    const firstLabel = labels[0] || "";
    return calculateEntropy(firstLabel);
  }, [normalizedDomain]);

  const isHighEntropy = entropy >= 3.8;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (domainInput.trim()) {
      const next = domainInput.trim().toLowerCase();
      setDomainInput(next);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Domain Intelligence Explorer"
        description="Inspect persisted DNS domain telemetry, local Shannon entropy, client associations, and related heuristic findings."
      />

      {/* Search Input */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Enter domain name (e.g. tunnel.c2server.org, github.com)..."
          value={domainInput}
          onChange={(e) => setDomainInput(e.target.value)}
          icon={<Search className="w-4 h-4" />}
          className="flex-1"
        />
        <Button variant="primary" size="md" type="submit" disabled={!domainInput.trim()}>
          Analyze
        </Button>
      </form>

      {/* Domain Overview Grid */}
      {summaryQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} variant="surface-1">
              <LoadingState title="Loading domain data..." />
            </Card>
          ))}
        </div>
      ) : summaryQuery.error ? (
        <ErrorState onRetry={() => summaryQuery.refetch()} />
      ) : !normalizedDomain ? (
        <EmptyState
          title="No domain selected"
          description="Enter a normalized domain name to inspect its stored telemetry."
        />
      ) : summaryQuery.data?.query_count === 0 ? (
        <EmptyState
          title="No telemetry for this domain"
          description={`No stored DNS events found for ${normalizedDomain}.`}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card variant="surface-1">
              <div className="text-xs text-ink-subtle mb-1 flex items-center justify-between">
                <span>Shannon Entropy (Subdomain)</span>
                <Hash className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-bold font-mono text-ink">{entropy} bits/char</div>
              <div className="text-[11px] text-ink-subtle mt-1 font-mono">
                {isHighEntropy ? (
                  <span className="text-severity-critical font-semibold">Elevated (&ge; 3.8 bits/char)</span>
                ) : (
                  <span className="text-[#4ade80]">Normal distribution</span>
                )}
              </div>
            </Card>

            <Card variant="surface-1">
              <div className="text-xs text-ink-subtle mb-1 flex items-center justify-between">
                <span>Telemetry Volume</span>
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-bold font-mono text-ink">
                {summaryQuery.data?.query_count.toLocaleString() ?? 0}
              </div>
              <div className="text-[11px] text-ink-subtle mt-1 font-mono">
                Observed across {(summaryQuery.data?.client_counts ?? []).length} distinct clients
              </div>
            </Card>

            <Card variant="surface-1">
              <div className="text-xs text-ink-subtle mb-1 flex items-center justify-between">
                <span>Local Heuristic Evaluation</span>
                <ShieldAlert className="w-4 h-4 text-severity-high" />
              </div>
              <div className="text-2xl font-bold font-mono">
                {(() => {
                  const associated = (summaryQuery.data?.associated_alerts ?? []) as Array<{ severity: string }>;
                  if (associated.some((a) => a.severity === "critical")) {
                    return <span className="text-severity-critical">Flagged</span>;
                  }
                  if (associated.some((a) => a.severity === "high")) {
                    return <span className="text-severity-high">Suspicious</span>;
                  }
                  if (associated.some((a) => a.severity === "medium")) {
                    return <span className="text-severity-medium">Review</span>;
                  }
                  return <span className="text-[#4ade80]">No local alerts</span>;
                })()}
              </div>
              <div className="text-[11px] text-ink-subtle mt-1">
                Based on stored detection findings only
              </div>
            </Card>
          </div>

          {/* Privacy Notice */}
          <div className="p-3.5 rounded-lg bg-surface-2 border border-hairline flex items-start gap-3">
            <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-ink-subtle">
              <strong className="text-ink">Privacy Guarantee: </strong>
              DNS queries reveal sensitive browsing metadata. DNS Guard never sends queries to third-party reputation
              services unless explicitly enabled by an administrator. All entropy and risk analysis is performed locally.
            </div>
          </div>

          {/* Details Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Associated Clients */}
            <Card variant="surface-1">
              <CardHeader>
                <CardTitle>Requesting Client Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {summaryQuery.isLoading ? (
                  <LoadingState title="Loading clients..." />
                ) : !summaryQuery.data ? (
                  <EmptyState title="No client data" description="No client associations recorded." />
                ) : summaryQuery.data.client_counts.length === 0 ? (
                  <EmptyState title="No client associations" description="No clients observed for this domain." />
                ) : (
                  summaryQuery.data.client_counts.map((c: any) => (
                    <div
                      key={c.client_ip}
                      className="flex items-center justify-between p-2.5 rounded bg-surface-2 border border-hairline text-xs font-mono"
                    >
                      <div>
                        <span className="text-primary-hover font-semibold block">{c.client_ip}</span>
                        {c.client_name && (
                          <span className="text-ink-subtle text-[11px]">{c.client_name}</span>
                        )}
                      </div>
                      <span className="text-ink font-bold">{c.query_count} queries</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Record Type Breakdown */}
            <Card variant="surface-1">
              <CardHeader>
                <CardTitle>Query Record Type Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {summaryQuery.isLoading ? (
                  <LoadingState title="Loading record types..." />
                ) : !summaryQuery.data ? (
                  <EmptyState title="No record type data" description="No telemetry recorded." />
                ) : Object.keys(summaryQuery.data.record_type_breakdown).length === 0 ? (
                  <EmptyState title="No record types" description="No record types observed." />
                ) : (
                  (() => {
                    const breakdown = (summaryQuery.data?.record_type_breakdown ?? {}) as Record<string, number>;
                    const grandTotal = Object.values(breakdown).reduce((a: number, b: number) => a + b, 0);
                    return Object.entries(breakdown).map(([type, count]) => (
                      <div
                        key={type}
                        className="flex items-center justify-between p-2.5 rounded bg-surface-2 border border-hairline text-xs font-mono"
                      >
                        <span className="font-bold text-ink">{type} Record</span>
                        <div className="flex items-center gap-3">
                          <span className="text-ink-subtle">{count} requests</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-3 border border-hairline">
                            {grandTotal > 0 ? ((count / grandTotal) * 100).toFixed(0) : 0}%
                          </span>
                        </div>
                      </div>
                    ));
                  })()
                )}
              </CardContent>
            </Card>
          </div>

          {/* Associated Alerts */}
          {summaryQuery.data && (summaryQuery.data.associated_alerts?.length ?? 0) > 0 && (
            <Card variant="surface-1">
              <CardHeader>
                <CardTitle>Related Threat Findings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(summaryQuery.data?.associated_alerts ?? []).map((alert: any) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-2.5 rounded bg-surface-2 border border-hairline text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={alert.severity as any} score={alert.risk_score} />
                      <span className="text-ink-subtle">{alert.title}</span>
                    </div>
                    <span className="text-ink-tertiary">{alert.status}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
