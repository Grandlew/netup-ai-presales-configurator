import type { ConfigOptionsResponse, ExtractResponse, Recommendation } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail ?? "Request failed");
  }

  return response.json() as Promise<T>;
}

export const api = {
  options: () => request<ConfigOptionsResponse>("/api/config/options"),
  recommend: (body: Record<string, unknown>) =>
    request<Recommendation>("/recommend", { method: "POST", body: JSON.stringify(body) }),
  extract: (body: Record<string, unknown>) =>
    request<ExtractResponse>("/api/conversation/extract", { method: "POST", body: JSON.stringify(body) }),
  createLead: (body: Record<string, unknown>) =>
    request<{ id: string }>("/api/leads", { method: "POST", body: JSON.stringify(body) }),
  createReport: (body: Record<string, unknown>) =>
    request<{ id: string; generated_content: string }>("/api/reports", { method: "POST", body: JSON.stringify(body) }),
};
