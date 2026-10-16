import {
  DashboardSummary,
  DnsEvent,
  Alert,
  PaginatedResponse,
  DetectionRule,
  DataSource,
} from "../../types";
import {
  DEMO_DASHBOARD_SUMMARY,
  DEMO_EVENTS,
  DEMO_ALERTS,
  DEMO_RULES,
  DEMO_DATA_SOURCES,
} from "../demoData";

const API_BASE = "/api/v1";

export class ApiError extends Error {
  code: string;
  details?: Record<string, any>;

  constructor(message: string, code: string = "INTERNAL_ERROR", details?: Record<string, any>) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!res.ok) {
      let errorData;
      try {
        errorData = await res.json();
      } catch {
        // non-json response
      }
      const message = errorData?.error?.message || `HTTP error ${res.status}: ${res.statusText}`;
      const code = errorData?.error?.code || `HTTP_${res.status}`;
      throw new ApiError(message, code, errorData?.error?.details);
    }

    return await res.json();
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || "Failed to communicate with DNS Guard server", "NETWORK_ERROR");
  }
}

export const api = {
  // System Health
  async getHealth(): Promise<{ status: string; version: string; mode: string }> {
    try {
      return await request("/health");
    } catch {
      return { status: "offline", version: "1.0.0", mode: "demo_fallback" };
    }
  },

  // Dashboard Overview
  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      return await request<DashboardSummary>("/dashboard/summary");
    } catch {
      // Graceful fallback to demo fixtures
      return DEMO_DASHBOARD_SUMMARY;
    }
  },

  // Events
  async getEvents(params: {
    page?: number;
    page_size?: number;
    search?: string;
    client_ip?: string;
    domain?: string;
    record_type?: string;
    response_code?: string;
    source_type?: string;
  } = {}): Promise<PaginatedResponse<DnsEvent>> {
    try {
      const query = new URLSearchParams();
      if (params.page) query.set("page", params.page.toString());
      if (params.page_size) query.set("page_size", params.page_size.toString());
      if (params.search) query.set("search", params.search);
      if (params.client_ip) query.set("client_ip", params.client_ip);
      if (params.domain) query.set("domain", params.domain);
      if (params.record_type) query.set("record_type", params.record_type);
      if (params.response_code) query.set("response_code", params.response_code);
      if (params.source_type) query.set("source_type", params.source_type);

      return await request<PaginatedResponse<DnsEvent>>(`/events?${query.toString()}`);
    } catch {
      // Filter demo events locally for offline demo mode
      let filtered = [...DEMO_EVENTS];
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.normalized_domain.includes(q) ||
            e.client_ip.includes(q) ||
            e.record_type.toLowerCase().includes(q)
        );
      }
      return {
        items: filtered,
        meta: {
          page: params.page || 1,
          page_size: params.page_size || 50,
          total_count: filtered.length,
          total_pages: 1,
        },
      };
    }
  },

  async getEventById(id: string): Promise<DnsEvent> {
    try {
      return await request<DnsEvent>(`/events/${id}`);
    } catch {
      const match = DEMO_EVENTS.find((e) => e.id === id);
      if (match) return match;
      throw new ApiError(`Event ${id} not found`, "NOT_FOUND");
    }
  },

  // Alerts
  async getAlerts(params: {
    page?: number;
    page_size?: number;
    status?: string;
    severity?: string;
    search?: string;
  } = {}): Promise<PaginatedResponse<Alert>> {
    try {
      const query = new URLSearchParams();
      if (params.page) query.set("page", params.page.toString());
      if (params.page_size) query.set("page_size", params.page_size.toString());
      if (params.status) query.set("status", params.status);
      if (params.severity) query.set("severity", params.severity);
      if (params.search) query.set("search", params.search);

      return await request<PaginatedResponse<Alert>>(`/alerts?${query.toString()}`);
    } catch {
      let filtered = [...DEMO_ALERTS];
      if (params.status && params.status !== "all") {
        filtered = filtered.filter((a) => a.status === params.status);
      }
      if (params.severity && params.severity !== "all") {
        filtered = filtered.filter((a) => a.severity === params.severity);
      }
      return {
        items: filtered,
        meta: {
          page: params.page || 1,
          page_size: params.page_size || 50,
          total_count: filtered.length,
          total_pages: 1,
        },
      };
    }
  },

  async updateAlertStatus(alertId: string, status: string, notes?: string): Promise<Alert> {
    return await request<Alert>(`/alerts/${alertId}`, {
      method: "PATCH",
      body: JSON.stringify({ status, notes }),
    });
  },

  // Rules
  async getRules(): Promise<DetectionRule[]> {
    try {
      return await request<DetectionRule[]>("/rules");
    } catch {
      return DEMO_RULES;
    }
  },

  async updateRule(
    ruleId: string,
    updates: { enabled?: boolean; contribution?: number; threshold?: Record<string, any> }
  ): Promise<DetectionRule> {
    return await request<DetectionRule>(`/rules/${ruleId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  // Sources
  async getSources(): Promise<DataSource[]> {
    try {
      return await request<DataSource[]>("/sources");
    } catch {
      return DEMO_DATA_SOURCES;
    }
  },

  async toggleSource(sourceId: string, enabled: boolean): Promise<DataSource> {
    return await request<DataSource>(`/sources/${sourceId}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    });
  },

  // File Ingestion / Upload
  async uploadFile(file: File, sourceType: string): Promise<{
    accepted: number;
    rejected: number;
    duplicates: number;
    errors: { row: number; error: string }[];
  }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("source_type", sourceType);

    const res = await fetch(`${API_BASE}/imports`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(err?.error?.message || "File import failed", err?.error?.code || "UPLOAD_ERROR");
    }

    return await res.json();
  },

  // Ingestion of synthetic events
  async triggerDemoIngest(count: number = 25): Promise<{ ingested: number }> {
    return await request<{ ingested: number }>("/events/ingest/demo", {
      method: "POST",
      body: JSON.stringify({ count }),
    });
  },

  // Extended analytics
  async getAnalyticsExtended(timeRange: string): Promise<any> {
    return await request<any>(`/analytics/extended?time_range=${encodeURIComponent(timeRange)}`);
  },

  async exportAnalyticsCsv(timeRange: string): Promise<void> {
    const res = await fetch(`${API_BASE}/exports/analytics.csv?time_range=${encodeURIComponent(timeRange)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(err?.error?.message || "Analytics export failed", err?.error?.code || "EXPORT_ERROR");
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dns_guard_analytics_${timeRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Domains
  async getDomainsList(params: {
    page?: number;
    page_size?: number;
    search?: string;
    min_count?: number;
  } = {}): Promise<PaginatedResponse<any>> {
    const query = new URLSearchParams();
    if (params.page) query.set("page", params.page.toString());
    if (params.page_size) query.set("page_size", params.page_size.toString());
    if (params.search) query.set("search", params.search);
    if (params.min_count) query.set("min_count", params.min_count.toString());
    return await request<PaginatedResponse<any>>(`/domains?${query.toString()}`);
  },

  async getDomainSummary(normalizedDomain: string): Promise<any> {
    return await request<any>(`/domains/summary/${encodeURIComponent(normalizedDomain)}`);
  },

  // Clients
  async getClientsList(params: {
    page?: number;
    page_size?: number;
    search?: string;
  } = {}): Promise<PaginatedResponse<any>> {
    const query = new URLSearchParams();
    if (params.page) query.set("page", params.page.toString());
    if (params.page_size) query.set("page_size", params.page_size.toString());
    if (params.search) query.set("search", params.search);
    return await request<PaginatedResponse<any>>(`/clients?${query.toString()}`);
  },

  async getClientSummary(clientIp: string): Promise<any> {
    return await request<any>(`/clients/summary/${encodeURIComponent(clientIp)}`);
  },

  // Audit
  async getAuditLogs(params: {
    page?: number;
    page_size?: number;
    action?: string;
    resource_type?: string;
    search?: string;
  } = {}): Promise<PaginatedResponse<any>> {
    const query = new URLSearchParams();
    if (params.page) query.set("page", params.page.toString());
    if (params.page_size) query.set("page_size", params.page_size.toString());
    if (params.action) query.set("action", params.action);
    if (params.resource_type) query.set("resource_type", params.resource_type);
    if (params.search) query.set("search", params.search);
    return await request<PaginatedResponse<any>>(`/audit/logs?${query.toString()}`);
  },
};
