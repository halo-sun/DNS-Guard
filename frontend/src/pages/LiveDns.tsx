import { useState } from "react";
import { Search, Pause, Play, RefreshCw, Info } from "lucide-react";
import { useEvents } from "../lib/queries";
import { DnsEvent } from "../types";
import { PageHeader } from "../components/ui/PageHeader";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table";
import { Dialog } from "../components/ui/Dialog";
import { LoadingState, EmptyState, ErrorState } from "../components/ui/States";

export function LiveDns() {
  const [search, setSearch] = useState("");
  const [recordType, setRecordType] = useState("");
  const [responseCode, setResponseCode] = useState("");
  const [isLive, setIsLive] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<DnsEvent | null>(null);

  const { data, isLoading, error, refetch } = useEvents({
    search: search || undefined,
    record_type: recordType || undefined,
    response_code: responseCode || undefined,
    page_size: 50,
  });

  const events = data?.items || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live DNS Event Stream"
        description="Inspect normalized DNS queries and resolver responses in real-time."
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isLive ? "primary" : "secondary"}
              onClick={() => setIsLive(!isLive)}
              className="gap-1.5 text-xs"
            >
              {isLive ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pause Feed
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Resume Stream
                </>
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={() => refetch()} aria-label="Refresh events">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-surface-1 border border-hairline">
        <Input
          placeholder="Filter by domain or client IP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="w-4 h-4" />}
        />
        <Select value={recordType} onChange={(e) => setRecordType(e.target.value)}>
          <option value="">All Record Types</option>
          <option value="A">A (IPv4)</option>
          <option value="AAAA">AAAA (IPv6)</option>
          <option value="TXT">TXT (Text / SPF / Tunnel)</option>
          <option value="MX">MX (Mail)</option>
          <option value="CNAME">CNAME (Alias)</option>
          <option value="PTR">PTR (Reverse)</option>
          <option value="NS">NS (Name Server)</option>
        </Select>
        <Select value={responseCode} onChange={(e) => setResponseCode(e.target.value)}>
          <option value="">All Response Codes</option>
          <option value="NOERROR">NOERROR (Success)</option>
          <option value="NXDOMAIN">NXDOMAIN (Non-Existent)</option>
          <option value="SERVFAIL">SERVFAIL (Server Failure)</option>
          <option value="REFUSED">REFUSED (Query Denied)</option>
        </Select>
      </div>

      {/* Events Table / Card Feed */}
      {isLoading ? (
        <LoadingState title="Streaming telemetry events..." />
      ) : error ? (
        <ErrorState onRetry={() => refetch()} />
      ) : events.length === 0 ? (
        <EmptyState
          title="No DNS events found"
          description="Try adjusting your search criteria or trigger demo events."
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-lg border border-hairline bg-surface-1 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time (UTC)</TableHead>
                  <TableHead>Client IP</TableHead>
                  <TableHead>Normalized Query Domain</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>RCode</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((evt) => (
                  <TableRow key={evt.id} className="hover:bg-surface-2/80">
                    <TableCell className="text-ink-subtle text-[11px]">
                      {new Date(evt.observed_at).toLocaleTimeString()}
                    </TableCell>
                    <TableCell className="text-primary-hover font-medium">
                      {evt.client_ip}
                      {evt.client_name && (
                        <span className="block text-[10px] text-ink-tertiary">
                          {evt.client_name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-ink">
                      {evt.normalized_domain}
                    </TableCell>
                    <TableCell>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-surface-2 border border-hairline font-bold">
                        {evt.record_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          evt.response_code === "NXDOMAIN"
                            ? "bg-severity-medium/15 text-[#fbbf24] border border-severity-medium/30"
                            : evt.response_code === "SERVFAIL"
                            ? "bg-severity-critical/15 text-severity-critical border border-severity-critical/30"
                            : "bg-surface-2 text-ink-muted border border-hairline"
                        }`}
                      >
                        {evt.response_code}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border ${
                          evt.is_demo || evt.source_type === "demo"
                            ? "bg-primary/10 text-primary-hover border-primary/20"
                            : "bg-surface-3 text-ink-subtle border-hairline"
                        }`}
                      >
                        {evt.source_type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedEvent(evt)}
                        className="h-7 text-xs px-2"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card Feed (< 768px) */}
          <div className="md:hidden space-y-2.5">
            {events.map((evt) => (
              <div
                key={evt.id}
                onClick={() => setSelectedEvent(evt)}
                className="p-3.5 rounded-lg bg-surface-1 border border-hairline active:bg-surface-2 text-xs font-mono space-y-2 cursor-pointer"
              >
                <div className="flex items-center justify-between text-[11px] text-ink-subtle">
                  <span>{new Date(evt.observed_at).toLocaleTimeString()}</span>
                  <span className="px-1.5 py-0.5 rounded bg-surface-2 border border-hairline">
                    {evt.record_type}
                  </span>
                </div>
                <div className="font-semibold text-ink text-sm truncate">
                  {evt.normalized_domain}
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-hairline">
                  <span className="text-primary-hover">{evt.client_ip}</span>
                  <span
                    className={
                      evt.response_code === "NXDOMAIN"
                        ? "text-severity-medium font-bold"
                        : "text-ink-subtle"
                    }
                  >
                    {evt.response_code}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Event Details Inspection Dialog */}
      <Dialog
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title="DNS Event Telemetry Details"
        description={`Event Fingerprint: ${selectedEvent?.fingerprint || "N/A"}`}
        footer={
          <Button size="sm" variant="secondary" onClick={() => setSelectedEvent(null)}>
            Close
          </Button>
        }
      >
        {selectedEvent && (
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 rounded bg-surface-2 border border-hairline space-y-2">
              <div className="text-ink-subtle text-[11px]">Normalized Domain</div>
              <div className="text-sm font-bold text-ink break-all">
                {selectedEvent.normalized_domain}
              </div>
              {selectedEvent.original_domain !== selectedEvent.normalized_domain && (
                <div className="text-[11px] text-ink-tertiary">
                  Original: {selectedEvent.original_domain}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded bg-surface-2 border border-hairline">
                <span className="text-ink-subtle block text-[10px]">Client IP</span>
                <span className="text-ink font-semibold">{selectedEvent.client_ip}</span>
              </div>
              <div className="p-2.5 rounded bg-surface-2 border border-hairline">
                <span className="text-ink-subtle block text-[10px]">Record Type</span>
                <span className="text-ink font-semibold">{selectedEvent.record_type}</span>
              </div>
              <div className="p-2.5 rounded bg-surface-2 border border-hairline">
                <span className="text-ink-subtle block text-[10px]">Response Code</span>
                <span className="text-ink font-semibold">{selectedEvent.response_code}</span>
              </div>
              <div className="p-2.5 rounded bg-surface-2 border border-hairline">
                <span className="text-ink-subtle block text-[10px]">Protocol</span>
                <span className="text-ink font-semibold">{selectedEvent.protocol}</span>
              </div>
            </div>

            {selectedEvent.response_details && (
              <div className="p-3 rounded bg-surface-2 border border-hairline">
                <span className="text-ink-subtle block text-[10px] mb-1">Answer / Payload</span>
                <span className="text-ink text-[11px] break-all">{selectedEvent.response_details}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-ink-subtle pt-2 border-t border-hairline">
              <span>Source: {selectedEvent.source_type}</span>
              <span>Observed: {new Date(selectedEvent.observed_at).toISOString()}</span>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
