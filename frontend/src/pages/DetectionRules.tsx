import { useState } from "react";
import { Info, Edit2 } from "lucide-react";
import { useRules, useUpdateRule } from "../lib/queries";
import { DetectionRule } from "../types";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { Input } from "../components/ui/Input";
import { LoadingState, ErrorState } from "../components/ui/States";

export function DetectionRules() {
  const { data: rules, isLoading, error, refetch } = useRules();
  const updateRuleMutation = useUpdateRule();
  const [editingRule, setEditingRule] = useState<DetectionRule | null>(null);
  const [editContribution, setEditContribution] = useState<number>(0);

  if (isLoading) return <LoadingState title="Loading Detection Rules..." />;
  if (error || !rules) return <ErrorState onRetry={() => refetch()} />;

  const handleToggle = async (rule: DetectionRule) => {
    await updateRuleMutation.mutateAsync({
      ruleId: rule.rule_id,
      updates: { enabled: !rule.enabled },
    });
  };

  const handleSaveEdit = async () => {
    if (!editingRule) return;
    await updateRuleMutation.mutateAsync({
      ruleId: editingRule.rule_id,
      updates: { contribution: editContribution },
    });
    setEditingRule(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Explainable Threat Detection Rules"
        description="Inspect and configure modular detection algorithms, score contributions, and heuristic thresholds."
      />

      {/* Heuristic Framework Notice */}
      <div className="p-3.5 rounded-lg bg-surface-2 border border-hairline flex items-start gap-3">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-ink-subtle space-y-1">
          <p>
            <strong className="text-ink">Additive Risk Scoring: </strong>
            Total alert risk score is computed as <code className="text-primary-hover font-mono font-bold">min(100, sum(enabled_rule_contributions))</code>.
          </p>
          <p>
            Severity bands: <strong>Low</strong> (0–29), <strong>Medium</strong> (30–59), <strong>High</strong> (60–79), <strong>Critical</strong> (80–100).
            Rules are observe-only and never trigger intrusive packet blocking.
          </p>
        </div>
      </div>

      {/* Rules List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule) => (
          <Card key={rule.rule_id} variant="surface-1" className="border-hairline flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-hairline mb-3">
                <span className="font-mono text-[11px] font-bold text-primary-hover bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  {rule.rule_id}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-ink-subtle">
                    +{rule.contribution} pts
                  </span>
                  <button
                    onClick={() => handleToggle(rule)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors ${
                      rule.enabled
                        ? "bg-[#27a644]/15 text-[#4ade80] border-[#27a644]/30"
                        : "bg-surface-3 text-ink-tertiary border-hairline"
                    }`}
                  >
                    {rule.enabled ? "ACTIVE" : "DISABLED"}
                  </button>
                </div>
              </div>

              <h3 className="text-sm font-bold text-ink mb-1">{rule.name}</h3>
              <p className="text-xs text-ink-subtle mb-3">{rule.description}</p>
            </div>

            <div className="pt-3 border-t border-hairline bg-surface-2/30 -mx-4 -mb-4 p-4 rounded-b-lg flex items-center justify-between text-xs font-mono">
              <span className="text-ink-subtle text-[11px]">Category: {rule.category}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingRule(rule);
                  setEditContribution(rule.contribution);
                }}
                className="h-7 text-xs px-2 gap-1"
              >
                <Edit2 className="w-3 h-3" /> Tune
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Tune Rule Dialog */}
      <Dialog
        isOpen={Boolean(editingRule)}
        onClose={() => setEditingRule(null)}
        title={`Tune ${editingRule?.name}`}
        description={`Identifier: ${editingRule?.rule_id}`}
        footer={
          <>
            <Button size="sm" variant="outline" onClick={() => setEditingRule(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </>
        }
      >
        {editingRule && (
          <div className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-ink text-xs font-semibold mb-1">
                Score Contribution (0 – 100)
              </label>
              <Input
                type="number"
                min={1}
                max={100}
                value={editContribution}
                onChange={(e) => setEditContribution(Number(e.target.value))}
              />
            </div>
            <div className="p-3 rounded bg-surface-2 border border-hairline">
              <span className="text-ink-subtle block text-[10px] mb-1">Threshold Parameters (JSON)</span>
              <pre className="text-ink text-[11px] overflow-x-auto">
                {JSON.stringify(editingRule.threshold, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
