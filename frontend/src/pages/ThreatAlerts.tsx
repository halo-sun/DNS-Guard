import { useState } from "react";
import { Search, Info } from "lucide-react";
import { useAlerts, useUpdateAlertStatus } from "../lib/queries";
import { Alert, AlertStatus } from "../types";
import { PageHeader } from "../components/ui/PageHeader";
import { SeverityBadge } from "../components/ui/SeverityBadge";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Dialog } from "../components/ui/Dialog";
import { LoadingState, EmptyState, ErrorState } from "../components/ui/States";

export function ThreatAlerts() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [activeAlert, setActiveAlert] = useState<Alert | null>(null);
  const [noteInput, setNoteInput] = useState("");

  const { data, isLoading, error, refetch } = useAlerts({
    status: statusFilter !== "all" ? statusFilter : undefined,
    severity: severityFilter !== "all" ? severityFilter : undefined,
    search: search || undefined,
  });

  const updateStatusMutation = useUpdateAlertStatus();

  const alerts = data?.items || [];

  const handleStatusChange = async (alertId: string, newStatus: AlertStatus) => {
    await updateStatusMutation.mutateAsync({
      alertId,
      status: newStatus,
      notes: noteInput || undefined,
    });
    if (activeAlert && activeAlert.id === alertId) {
      setActiveAlert({ ...activeAlert, status: newStatus });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Correlated Threat Alerts"
        description="Explainable heuristic detections grouped by client endpoint, target domain, and rule category."
      />

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-surface-1 border border-hairline">
        <Input
          placeholder="Filter by target domain or client IP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="w-4 h-4" />}
        />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Alert Statuses</option>
          <option value="new">New / Unacknowledged</option>
          <option value="investigating">Under Investigation</option>
          <option value="confirmed">Confirmed Suspicious</option>
          <option value="benign">Benign / False Positive</option>
          <option value="closed">Closed</option>
        </Select>
        <Select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
          <option value="all">All Severities</option>
          <option value="critical">Critical (80–100)</option>
          <option value="high">High (60–79)</option>
          <option value="medium">Medium (30–59)</option>
          <option value="low">Low (0–29)</option>
        </Select>
      </div>

      {/* Alerts Grid */}
      {isLoading ? (
        <LoadingState title="Loading correlated alerts..." />
      ) : error ? (
        <ErrorState onRetry={() => refetch()} />
      ) : alerts.length === 0 ? (
        <EmptyState
          title="No threat alerts match criteria"
          description="Your DNS telemetry does not currently violate any configured detection thresholds."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {alerts.map((alert) => (
            <Card
              key={alert.id}
              variant="surface-1"
              hoverable
              onClick={() => {
                setActiveAlert(alert);
                setNoteInput(alert.notes || "");
              }}
              className="border-hairline hover:border-hairline-strong transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-hairline">
                <div className="flex items-center gap-2.5">
                  <SeverityBadge severity={alert.severity} score={alert.risk_score} />
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-3 text-ink-muted border border-hairline uppercase">
                    {alert.status}
                  </span>
                  {alert.is_demo && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary-hover border border-primary/30">
                      DEMO
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono text-ink-subtle">
                  <span>First: {new Date(alert.first_seen_at).toLocaleTimeString()}</span>
                  <span>Last: {new Date(alert.last_seen_at).toLocaleTimeString()}</span>
                  <span className="text-ink font-semibold">({alert.related_event_count} events)</span>
                </div>
              </div>

              <div className="py-3">
                <h3 className="text-sm font-bold text-ink">{alert.title}</h3>
                <p className="text-xs text-ink-subtle mt-1 font-mono">
                  Category: <span className="text-ink-muted">{alert.category}</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs font-mono">
                  <div className="p-2 rounded bg-surface-2 border border-hairline">
                    <span className="text-ink-subtle text-[10px] block">Target Domain</span>
                    <span className="text-ink font-semibold break-all">{alert.normalized_domain}</span>
                  </div>
                  <div className="p-2 rounded bg-surface-2 border border-hairline">
                    <span className="text-ink-subtle text-[10px] block">Client Host / IP</span>
                    <span className="text-primary-hover font-semibold">{alert.client_ip}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  <span className="text-[11px] text-ink-subtle mr-1">Matched Rules:</span>
                  {alert.matched_rules.map((rule) => (
                    <span
                      key={rule}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface-3 text-ink border border-hairline"
                    >
                      {rule}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Alert Investigation & Evidence Dialog */}
      <Dialog
        isOpen={Boolean(activeAlert)}
        onClose={() => setActiveAlert(null)}
        title={activeAlert?.title || "Alert Investigation"}
        description={`Grouping Key: ${activeAlert?.grouping_key}`}
        maxWidth="lg"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => activeAlert && handleStatusChange(activeAlert.id, "investigating")}
                disabled={activeAlert?.status === "investigating"}
              >
                Investigate
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => activeAlert && handleStatusChange(activeAlert.id, "benign")}
                disabled={activeAlert?.status === "benign"}
              >
                Mark Benign
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => activeAlert && handleStatusChange(activeAlert.id, "confirmed")}
                disabled={activeAlert?.status === "confirmed"}
              >
                Confirm Suspicious
              </Button>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setActiveAlert(null)}>
              Done
            </Button>
          </div>
        }
      >
        {activeAlert && (
          <div className="space-y-4 text-xs">
            {/* Risk Explanation Notice */}
            <div className="p-3 rounded-lg bg-surface-2 border border-hairline flex items-start gap-2.5">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-ink-subtle">
                DNS Guard scores are bounded explainable heuristics (0–100) derived from rule violations, not
                definitive probabilities of compromise. DNS traffic is observed passively.
              </p>
            </div>

            {/* Evidence Breakdown Table */}
            <div>
              <h4 className="font-semibold text-ink text-xs uppercase tracking-wider mb-2">
                Rule Evidence & Contributions
              </h4>
              <div className="space-y-2">
                {activeAlert.evidence.map((ev, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-surface-2 border border-hairline space-y-1 font-mono"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-ink">{ev.rule_name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/20 text-primary-hover font-semibold">
                        +{ev.contribution} pts
                      </span>
                    </div>
                    <div className="text-[11px] text-ink-muted font-sans mt-0.5">
                      {ev.explanation}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-ink-subtle pt-1 mt-1 border-t border-hairline">
                      <span>Threshold: <strong className="text-ink">{String(ev.threshold_used)}</strong></span>
                      <span>Observed: <strong className="text-ink">{String(ev.observed_value)}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Response Actions */}
            {activeAlert.recommended_actions && activeAlert.recommended_actions.length > 0 && (
              <div>
                <h4 className="font-semibold text-ink text-xs uppercase tracking-wider mb-2">
                  Recommended Investigation Actions
                </h4>
                <ul className="list-disc pl-4 space-y-1 text-ink-muted text-[11px]">
                  {activeAlert.recommended_actions.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Analyst Notes */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Investigation Notes
              </label>
              <textarea
                className="w-full bg-surface-2 text-ink text-xs rounded-md border border-hairline p-2.5 focus:outline-none focus:border-primary font-mono"
                rows={3}
                placeholder="Record investigation findings, ticket ID, or analyst comments..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
