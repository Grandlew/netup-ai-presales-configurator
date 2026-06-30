import type { ConfigOptionsResponse, ExtractResponse, Recommendation } from "@/lib/types";

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function resolveApiBaseUrl() {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return normalizeBaseUrl(configuredBaseUrl);
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://127.0.0.1:8000";
  }

  console.warn(
    "NEXT_PUBLIC_API_BASE_URL is not set for this production build. API requests will use the current origin until the variable is configured.",
  );
  return "";
}

function buildUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}

const API_BASE = resolveApiBaseUrl();

export class ApiError extends Error {
  status: number;
  code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const rawText = await response.text();

    let error: Record<string, unknown> = {};

    try {
      error = rawText ? JSON.parse(rawText) : {};
    } catch {
      error = { detail: rawText || "Request failed" };
    }

    const detail =
      typeof error.detail === "string"
        ? error.detail
        : JSON.stringify(error.detail ?? error);

    const code = typeof error.error_code === "string" ? error.error_code : null;

    throw new ApiError(detail || `Request failed with status ${response.status}`, response.status, code);
  }

  return response.json() as Promise<T>;
}

async function requestBlob(path: string, init?: RequestInit): Promise<Blob> {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const rawText = await response.text();
    throw new ApiError(rawText || `Request failed with status ${response.status}`, response.status, null);
  }

  return response.blob();
}

function normalizeRecommendBody(body: Record<string, unknown>) {
  const normalized = { ...body };

  if (normalized.archive_days === "") {
    normalized.archive_days = 0;
  }

  if (normalized.channels_to_record === "") {
    normalized.channels_to_record = null;
  }

  if (normalized.available_storage_tb === "") {
    normalized.available_storage_tb = null;
  }

  if (normalized.expected_concurrent_viewers === "") {
    normalized.expected_concurrent_viewers = null;
  }

  if (normalized.existing_network_bandwidth_mbps === "") {
    normalized.existing_network_bandwidth_mbps = null;
  }

  if (normalized.estimated_vod_library_size_tb === "") {
    normalized.estimated_vod_library_size_tb = null;
  }

  const networkTypeMap: Record<string, string | null> = {
    managed_lan_multicast: "ethernet",
    managed_lan_unicast: "ethernet",
    coaxial_dvb_c: "coaxial",
    hybrid: "hybrid",
    unknown: null,
  };

  if (typeof normalized.in_property_network_type === "string") {
    normalized.in_property_network_type = networkTypeMap[normalized.in_property_network_type] ?? normalized.in_property_network_type;
  }

  return normalized;
}

export const api = {
  options: () => request<ConfigOptionsResponse>("/api/config/options"),
  recommend: (body: Record<string, unknown>) =>
    request<Recommendation>("/api/recommend", { method: "POST", body: JSON.stringify(normalizeRecommendBody(body)) }),
  extract: (body: Record<string, unknown>) =>
    request<ExtractResponse>("/api/conversation/extract", { method: "POST", body: JSON.stringify(body) }),
  createLead: (body: Record<string, unknown>) =>
    request<{ id: string }>("/api/leads", { method: "POST", body: JSON.stringify(body) }),
  createReport: (body: Record<string, unknown>) =>
    request<{ id: string; generated_content: string }>("/api/reports", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  downloadReport: (reportId: string, format: "pdf" | "doc") =>
    requestBlob(`/api/reports/${reportId}/download?format=${format}`),
};
