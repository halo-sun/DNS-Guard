import { useState } from "react";
import { Search, Info } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Input } from "../components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { SeverityBadge } from "../components/ui/SeverityBadge";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/States";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

interface ClientSummary {
  client_ip: string;
  query_count: number;
  distinct_domains: number;
  open_alert_count: number;
  highest_severity: string | null;
  last_seen_at: string | null;
}

function useClientsList() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: () => api.getClientsList({ page_size: 200 }),
    staleTime: 10000,
  });
}

function useClientDetail(clientIp: string, enabled: boolean) {
  return useQuery({
    queryKey: ["clientSummary", clientIp],
    queryFn: () => api.getClientSummary(clientIp),
    enabled: enabled && Boolean(clientIp),
    staleTime: 10000,
  });
}

export function Clients() {
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<string>("");
  const listQuery = useClientsList();
  const detailQuery = useClientDetail(selectedClient, Boolean(selectedClient));

  const filtered = (listQuery.data?.items ?? []).filter(
    (c: ClientSummary) =>
      c.client_ip.includes(search)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Endpoint Telemetry"
        description="Observed IP addresses and network endpoints producing DNS queries."
      />

      {/* Security Disclaimer */}
      <div className="p-3.5 rounded-lg bg-surface-2 border border-hairline flex items-start gap-3">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-ink-subtle">
          <strong className="text-ink">Technical Note: </strong>
          IP addresses represent network interfaces and NAT gateways. They do not uniquely identify a human person.
          Heuristic findings indicate anomalous query behaviors, not verified malicious intent.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client List (1 col) */}
        <div className="space-y-3">
          <Input
            placeholder="Search client IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />

          <div className="space-y-2">
            {listQuery.isLoading ? (
              <LoadingState title="Loading clients..." />
            ) : listQuery.error ? (
              <ErrorState onRetry={() => listQuery.refetch()} />
            ) : filtered.length === 0 ? (
              <EmptyState
                title="No clients found"
                description="No client endpoints observed in the selected scope."
              />
            ) : (
              filtered.map((client: ClientSummary) => {
                const isSelected = selectedClient === client.client_ip;
                return (
                  <div
                    key={client.client_ip}
                    onClick={() => setSelectedClient(client.client_ip)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer font-mono text-xs ${
                      isSelected
                        ? "bg-surface-2 border-primary-hover shadow-sm"
                        : "bg-surface-1 border-hairline hover:bg-surface-2"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-ink">{client.client_ip}</span>
                      {client.open_alert_count > 0 ? (
                        <SeverityBadge
                          severity={client.highest_severity as any}
                          score={client.open_alert_count}
                        />
                      ) : (
                        <span className="text-[10px] text-[#4ade80] px-1.5 py-0.5 rounded bg-surface-3">
                          Clean
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-ink-tertiary mt-2 pt-1.5 border-t border-hairline">
                      <span>{client.query_count} queries</span>
                      <span>{client.distinct_domains} domains</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Client Investigation Panel (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedClient ? (
            <Card variant="surface-1">
              <EmptyState
                title="No client selected"
                description="Choose a client endpoint from the list to inspect its telemetry."
              />
            </Card>
          ) : detailQuery.isLoading ? (
            <Card variant="surface-1">
              <LoadingState title="Loading client detail..." />
            </Card>
          ) : detailQuery.error ? (
            <Card variant="surface-1">
              <ErrorState onRetry={() => detailQuery.refetch()} />
            </Card>
          ) : !detailQuery.data ? (
            <Card variant="surface-1">
              <EmptyState title="No data for this client" description="No telemetry found." />
            </Card>
          ) : (
            <Card variant="surface-1">
              <CardHeader>
                <div>
                  <span className="text-[10px] font-mono text-primary uppercase font-bold tracking-wider">
                    Endpoint Profile
                  </span>
                  <CardTitle className="text-lg font-mono mt-0.5">{detailQuery.data.client_ip}</CardTitle>
                </div>
                <div className="text-right">
                  <span className="text-xs text-ink-subtle block">Open Alerts</span>
                  <span className="text-xl font-bold font-mono text-severity-critical">
                    {detailQuery.data.open_alert_count}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono my-2">
                  <div className="p-2.5 rounded bg-surface-2 border border-hairline">
                    <span className="text-ink-subtle text-[10px] block">Total Queries</span>
                    <span className="text-ink font-semibold">{detailQuery.data.query_count}</span>
                  </div>
                  <div className="p-2.5 rounded bg-surface-2 border border-hairline">
                    <span className="text-ink-subtle text-[10px] block">Distinct Domains</span>
                    <span className="text-ink font-semibold">{detailQuery.data.distinct_domains}</span>
                  </div>
                  <div className="p-2.5 rounded bg-surface-2 border border-hairline">
                    <span className="text-ink-subtle text-[10px] block">First Seen</span>
                    <span className="text-ink font-semibold">
                      {detailQuery.data.first_seen_at
                        ? new Date(detailQuery.data.first_seen_at).toLocaleTimeString()
                        : "—"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-surface-2 border border-hairline">
                    <span className="text-ink-subtle text-[10px] block">Last Seen</span>
                    <span className="text-ink font-semibold">
                      {detailQuery.data.last_seen_at
                        ? new Date(detailQuery.data.last_seen_at).toLocaleTimeString()
                        : "—"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {detailQuery.data && (
            <Card variant="surface-1">
              <CardHeader>
                <CardTitle>Recent Query Telemetry</CardTitle>
                <span className="text-xs text-ink-subtle font-mono">Last Observations</span>
              </CardHeader>
              <CardContent>
                {detailQuery.data.recent_events.length === 0 ? (
                  <EmptyState title="No recent events" description="No recent DNS queries recorded." />
                ) : (
                  detailQuery.data.recent_events.map((q: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded bg-surface-2 border border-hairline text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-surface-3 font-bold border border-hairline">
                          {q.record_type}
                        </span>
                        <span className="text-ink font-medium">{q.domain}</span>
                      </div>
                      <span className="text-ink-subtle text-[11px]">
                        {q.observed_at
                          ? new Date(q.observed_at).toLocaleTimeString()
                          : "—"}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
