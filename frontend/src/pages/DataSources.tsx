import { useState } from "react";
import { Upload, CheckCircle2, Info } from "lucide-react";
import { useSources, useToggleSource } from "../lib/queries";
import { DataSource } from "../types";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { StatusDot } from "../components/ui/StatusDot";
import { api } from "../lib/api";
import { LoadingState, ErrorState } from "../components/ui/States";

export function DataSources() {
  const { data: sources, isLoading, error, refetch } = useSources();
  const toggleSourceMutation = useToggleSource();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    accepted: number;
    rejected: number;
    duplicates: number;
    errors: { row: number; error: string }[];
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (isLoading) return <LoadingState title="Loading Data Sources..." />;
  if (error || !sources) return <ErrorState onRetry={() => refetch()} />;

  const handleToggle = async (src: DataSource) => {
    await toggleSourceMutation.mutateAsync({
      sourceId: src.id,
      enabled: !src.enabled,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadResult(null);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const res = await api.uploadFile(selectedFile, "file_import");
      setUploadResult(res);
      refetch();
    } catch (err: any) {
      setUploadError(err.message || "File upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Telemetry Data Sources & Ingestion"
        description="Manage configured ingestion adapters, resolver log sensors, and CSV/JSON log imports."
      />

      {/* Scope & Capability Transparency Notice */}
      <div className="p-3.5 rounded-lg bg-surface-2 border border-hairline flex items-start gap-3">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-ink-subtle space-y-1">
          <p>
            <strong className="text-ink">Ingestion Boundary: </strong>
            A web application cannot independently tap raw OS socket packets on Windows or Android.
            DNS Guard processes telemetry delivered exclusively by configured authorized sources (CoreDNS log sinks, CSV/JSON batch imports, and synthetic generators).
          </p>
        </div>
      </div>

      {/* Configured Sources List */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">
          Configured Sensor Adapters
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sources.map((src) => (
            <Card key={src.id} variant="surface-1" className="border-hairline flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-hairline mb-3">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-3 text-ink-muted border border-hairline uppercase">
                    {src.type}
                  </span>
                  <StatusDot
                    status={src.health_status === "healthy" ? "online" : src.health_status === "warning" ? "warning" : "offline"}
                    label={src.health_status.toUpperCase()}
                  />
                </div>

                <h3 className="text-sm font-bold text-ink mb-1">{src.name}</h3>
                <div className="space-y-1 text-xs font-mono text-ink-subtle my-2">
                  <div>
                    Ingested Events: <span className="text-ink font-semibold">{src.event_count.toLocaleString()}</span>
                  </div>
                  {src.last_event_at && (
                    <div className="text-[11px]">
                      Last Event: {new Date(src.last_event_at).toLocaleTimeString()}
                    </div>
                  )}
                  {src.last_error && (
                    <div className="text-[11px] text-severity-critical">
                      Notice: {src.last_error}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-hairline mt-3 flex items-center justify-between">
                <span className="text-[11px] text-ink-tertiary font-mono">
                  {src.enabled ? "Enabled" : "Disabled"}
                </span>
                <Button
                  size="sm"
                  variant={src.enabled ? "outline" : "primary"}
                  onClick={() => handleToggle(src)}
                  className="h-7 text-xs px-2.5"
                >
                  {src.enabled ? "Disable" : "Enable"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* CSV / JSON File Ingestion Module */}
      <Card variant="surface-1" className="border-hairline">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            <CardTitle>Import DNS Resolver Logs (CSV / JSON)</CardTitle>
          </div>
          <span className="text-xs text-ink-subtle font-mono">Max size: 10MB</span>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-ink-subtle">
            Upload exported DNS server query logs. Required columns/keys: <code className="text-primary-hover font-mono">timestamp</code>, <code className="text-primary-hover font-mono">client_ip</code>, <code className="text-primary-hover font-mono">domain</code>, <code className="text-primary-hover font-mono">record_type</code>, <code className="text-primary-hover font-mono">response_code</code>.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileChange}
              className="block w-full text-xs text-ink-subtle file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-surface-3 file:text-ink hover:file:bg-surface-4 cursor-pointer"
            />
            <Button
              size="sm"
              variant="primary"
              disabled={!selectedFile || isUploading}
              isLoading={isUploading}
              onClick={handleUpload}
              className="shrink-0 text-xs gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" /> Ingest File
            </Button>
          </div>

          {uploadError && (
            <div className="p-3 rounded bg-severity-critical/15 text-severity-critical text-xs border border-severity-critical/30">
              {uploadError}
            </div>
          )}

          {uploadResult && (
            <div className="p-3.5 rounded bg-surface-2 border border-hairline space-y-2 text-xs font-mono">
              <div className="flex items-center gap-2 text-[#4ade80] font-bold">
                <CheckCircle2 className="w-4 h-4" /> File Processed Successfully
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                <div>Accepted: <strong className="text-ink">{uploadResult.accepted}</strong></div>
                <div>Duplicates: <strong className="text-ink-subtle">{uploadResult.duplicates}</strong></div>
                <div>Rejected: <strong className="text-severity-critical">{uploadResult.rejected}</strong></div>
              </div>

              {uploadResult.errors.length > 0 && (
                <div className="mt-2 pt-2 border-t border-hairline">
                  <span className="text-severity-critical block font-semibold mb-1">Row Errors:</span>
                  <div className="max-h-24 overflow-y-auto space-y-1 text-[10px] text-ink-subtle">
                    {uploadResult.errors.map((e, i) => (
                      <div key={i}>Row {e.row}: {e.error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
