import type { ConfigOptionsResponse, ExtractResponse, Recommendation } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

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
  const response = await fetch(`${API_BASE}${path}`, {
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

    console.error(
      `API request failed\nPath: ${path}\nStatus: ${response.status}\nCode: ${code ?? "none"}\nResponse: ${JSON.stringify(error, null, 2)}`,
    );

    throw new ApiError(detail || `Request failed with status ${response.status}`, response.status, code);
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
    request<{ id: string; generated_content: string }>("/api/reports", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
