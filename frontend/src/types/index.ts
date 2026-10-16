export type Severity = "low" | "medium" | "high" | "critical" | "informational";
export type AlertStatus = "new" | "investigating" | "benign" | "confirmed" | "closed";

export interface DnsEvent {
  id: string;
  observed_at: string;
  ingested_at: string;
  client_ip: string;
  client_name?: string | null;
  original_domain: string;
  normalized_domain: string;
  record_type: string;
  response_code: string;
  response_details?: string | null;
  resolver_id?: string | null;
  protocol: string;
  source_id: string;
  source_type: "demo" | "import" | "coredns" | "sensor";
  query_size?: number | null;
  response_size?: number | null;
  duration_ms?: number | null;
  fingerprint: string;
  is_demo?: boolean;
}

export interface RuleEvidence {
  rule_id: string;
  rule_name: string;
  category: string;
  threshold_used: string | number;
  observed_value: string | number;
  contribution: number;
  explanation: string;
  details?: Record<string, any>;
}

export interface Alert {
  id: string;
  grouping_key: string;
  title: string;
  category: string;
  severity: Severity;
  risk_score: number;
  status: AlertStatus;
  client_ip: string;
  normalized_domain: string;
  first_seen_at: string;
  last_seen_at: string;
  related_event_count: number;
  evidence: RuleEvidence[];
  matched_rules: string[];
  recommended_actions: string[];
  notes?: string | null;
  is_demo?: boolean;
}

export interface DetectionRule {
  id: string;
  rule_id: string;
  name: string;
  category: string;
  description: string;
  enabled: boolean;
  contribution: number;
  threshold: Record<string, any>;
  updated_at: string;
}

export interface DataSource {
  id: string;
  type: "demo" | "file_import" | "coredns" | "sensor";
  name: string;
  enabled: boolean;
  health_status: "healthy" | "warning" | "error" | "offline";
  last_event_at?: string | null;
  last_error?: string | null;
  event_count: number;
  config_metadata?: Record<string, any>;
}

export interface DashboardSummary {
  total_queries: number;
  suspicious_events: number;
  open_alerts: number;
  unique_clients: number;
  unique_domains: number;
  active_sources_count: number;
  last_updated_at: string;
  nxdomain_rate_percent: number;
  severity_distribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  query_volume_timeline: {
    timestamp: string;
    queries: number;
    suspicious: number;
  }[];
  top_queried_domains: {
    domain: string;
    count: number;
    is_suspicious: boolean;
    record_type: string;
  }[];
  active_clients: {
    ip: string;
    hostname?: string;
    queries: number;
    alerts_count: number;
  }[];
  recent_alerts: Alert[];
  anomaly_summary: {
    nxdomain_spikes: number;
    tunneling_candidates: number;
    dga_candidates: number;
    entropy_spikes: number;
  };
  is_demo: boolean;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}
