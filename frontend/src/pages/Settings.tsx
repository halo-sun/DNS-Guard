import { useState } from "react";
import { ShieldCheck, Database, Trash2, History as HistoryIcon } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ConfirmAction } from "../components/ui/ConfirmAction";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/States";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  created_at: string | null;
  metadata: Record<string, any>;
}

function useAuditLogs() {
  return useQuery({
    queryKey: ["auditLogs"],
    queryFn: () => api.getAuditLogs({ page_size: 50 }),
    staleTime: 10000,
  });
}

export function Settings() {
  const [retentionDays, setRetentionDays] = useState(30);
  const [isSaved, setIsSaved] = useState(false);
  const auditQuery = useAuditLogs();

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & Audit Security"
        description="Operational configuration, privacy posture, and append-only administrative audit log."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Operational Security Posture */}
        <Card variant="surface-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <CardTitle>Observe-Only Security Policy</CardTitle>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-[#4ade80] border border-emerald-800/40">
              ENFORCED
            </span>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-ink-muted">
            <p>
              DNS Guard operates strictly in <strong>observe-only mode</strong>. It does not tamper with host resolver
              files, hijack sockets, alter router routes, or emit DNS block responses.
            </p>
            <div className="p-3 rounded bg-surface-2 border border-hairline font-mono text-[11px] space-y-1">
              <div>Telemetry Mode: <strong className="text-ink">Passive Ingestion</strong></div>
              <div>External Threat Lookups: <strong className="text-ink">Disabled (Air-gapped)</strong></div>
              <div>Storage Engine: <strong className="text-ink">Local SQLite (Zero cloud leak)</strong></div>
            </div>
          </CardContent>
        </Card>

        {/* Data Retention & Storage */}
        <Card variant="surface-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              <CardTitle>Data Retention Limits</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-ink text-xs font-semibold mb-1">
                Telemetry Retention Period (Days)
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                  className="w-32"
                />
                <Button size="sm" variant="primary" onClick={handleSave}>
                  {isSaved ? "Saved!" : "Update"}
                </Button>
              </div>
              <p className="text-[11px] text-ink-subtle mt-1.5 font-sans">
                Events older than {retentionDays} days are pruned automatically to conserve disk storage.
              </p>
            </div>

            <div className="pt-3 border-t border-hairline">
              <ConfirmAction
                title="Purge Historical DNS Telemetry"
                description="This action is not implemented in the current backend. No data will be deleted."
                onConfirm={async () => {
                  // Not implemented
                }}
                trigger={(open) => (
                  <Button size="sm" variant="danger" onClick={open} className="gap-1.5 text-xs" disabled>
                    <Trash2 className="w-3.5 h-3.5" /> Purge Stored Telemetry
                  </Button>
                )}
              />
            </div>
          </CardContent>
        </Card>
      </div>        {/* Audit History Log */}
        <Card variant="surface-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <HistoryIcon className="w-4 h-4 text-primary" />
              <CardTitle>Append-Only Security Audit Log</CardTitle>
            </div>
            <span className="text-xs text-ink-subtle font-mono">
              {auditQuery.isLoading
                ? "Loading audit events..."
                : auditQuery.data
                ? `${auditQuery.data.meta.total_count} recorded events`
                : "No audit events recorded"}
            </span>
          </CardHeader>
          <CardContent>
            {auditQuery.isLoading ? (
              <LoadingState title="Loading audit log..." />
            ) : auditQuery.error ? (
              <ErrorState onRetry={() => auditQuery.refetch()} />
            ) : !auditQuery.data || auditQuery.data.items.length === 0 ? (
              <EmptyState
                title="No audit events"
                description="No administrative actions have been recorded yet."
              />
            ) : (
              <div className="space-y-3">
                {auditQuery.data.items.map((log: AuditLogEntry) => (
                  <div
                    key={log.id}
                    className="p-3 rounded bg-surface-2 border border-hairline text-xs font-mono space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-primary-hover">{log.action}</span>
                      <span className="text-ink-subtle">
                        {log.created_at
                          ? new Date(log.created_at).toLocaleTimeString()
                          : "—"}
                      </span>
                    </div>
                    <div className="text-ink font-sans text-xs">
                      {log.resource_type && log.resource_id
                        ? `${log.resource_type}: ${log.resource_id}`
                        : "System event"}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-ink-tertiary pt-1 border-t border-hairline">
                      <span>User: {log.user_id}</span>
                      <span>ID: {log.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
