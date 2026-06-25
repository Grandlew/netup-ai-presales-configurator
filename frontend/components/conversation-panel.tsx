"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { ApiError, api } from "@/lib/api";
import type { ExtractResponse } from "@/lib/types";

const MAX_MESSAGE_LENGTH = 600;

const ENUM_LABELS: Record<string, string> = {
  catchup_tv: "Catch-up TV",
  internet_ott: "Internet / OTT",
  ip_streams: "Existing IP streams",
  live_tv: "Live TV",
  local_network: "Local network",
  mobile: "Mobile",
  set_top_box: "Set-top box",
  smart_tv: "Smart TV",
};

const FIELD_LABELS: Record<string, string> = {
  additional_project_notes: "Additional notes",
  adaptive_bitrate_required: "Adaptive bitrate required",
  archive_days: "Archive days",
  available_storage_tb: "Available storage",
  average_channel_bitrate_mbps: "Average channel bitrate",
  company_name: "Company name",
  country: "Country",
  delivery_mode: "Delivery mode",
  expected_concurrent_viewers: "Expected concurrent viewers",
  number_of_channels: "Number of channels",
  output_type: "Output type",
  project_type: "Project type",
  redundancy_required: "Redundancy required",
  services: "Required services",
  signal_source_details: "Signal source details",
  signal_sources: "Signal sources",
  subscribers_or_rooms: "Rooms or subscribers",
  viewer_devices: "Viewer devices",
};

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" aria-hidden="true" />;
}

function humanizeKey(value: string) {
  if (FIELD_LABELS[value]) return FIELD_LABELS[value];
  if (ENUM_LABELS[value]) return ENUM_LABELS[value];
  return value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function hasDisplayableValue(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length > 0;
  return true;
}

function formatPrimitive(value: unknown) {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return new Intl.NumberFormat("en-US").format(value);
  if (typeof value === "string") return humanizeKey(value);
  return String(value);
}

function renderExtractedValue(value: unknown): ReactNode {
  if (Array.isArray(value)) return value.map((item) => formatPrimitive(item)).join(", ");

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (!entries.length) return "No additional details";

    return (
      <div className="grid gap-2">
        {entries.map(([key, nestedValue]) => (
          <div key={key} className="grid gap-1 rounded-2xl bg-paper px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{humanizeKey(key)}</span>
            <span className="text-sm text-ink">{formatPrimitive(nestedValue)}</span>
          </div>
        ))}
      </div>
    );
  }

  return formatPrimitive(value);
}

function getClientErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return "We could not extract the project requirements. Please try again.";
}

export function ConversationPanel({
  onUseGuidedConfigurator,
  resetSignal = 0,
}: {
  onUseGuidedConfigurator?: () => void;
  resetSignal?: number;
}) {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState<ExtractResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMessage("");
    setResponse(null);
    setError(null);
    setLoading(false);
  }, [resetSignal]);

  const trimmedMessage = message.trim();
  const showExtractionResults = response?.extraction_succeeded === true;
  const aiUnavailable = response?.ai_available === false;
  const extractedEntries = useMemo(
    () =>
      Object.entries(response?.extracted_requirements ?? {}).filter(([, value]) => hasDisplayableValue(value)),
    [response],
  );

  const handleSubmit = async () => {
    if (!trimmedMessage || loading || aiUnavailable) return;

    setLoading(true);
    setError(null);
    try {
      const result = await api.extract({
        message: trimmedMessage,
        current_requirements: response?.extraction_succeeded ? response.extracted_requirements : {},
      });
      setResponse(result);
      if (!result.extraction_succeeded && result.message) {
        setError(result.message);
      }
    } catch (err) {
      setResponse(null);
      setError(getClientErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const showRetry = Boolean(trimmedMessage) && !loading && !aiUnavailable && (Boolean(error) || response?.extraction_succeeded === false);

  return (
    <div className="panel p-5 md:p-6">
      <p className="text-sm uppercase tracking-[0.24em] text-blue">Describe My Project</p>
      <h2 className="mt-2 text-[1.7rem] font-semibold text-ink">Natural-language intake</h2>
      <p className="mt-2 text-sm text-slate-600">
        Describe your project in plain language. The AI layer only extracts requirements and asks follow-up questions.
      </p>

      <label htmlFor="conversation-message" className="mt-5 block text-sm font-medium text-ink">
        Project description
      </label>
      <textarea
        id="conversation-message"
        maxLength={MAX_MESSAGE_LENGTH}
        className="mt-2 min-h-36 w-full rounded-2xl border border-slate-200 p-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
        placeholder="We have a 180-room hotel. We want 85 satellite and IP channels on LG Smart TVs, plus catch-up TV and mobile viewing."
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>Use the guided configurator anytime if you already know the project details.</span>
        <span aria-live="polite">{`${message.length}/${MAX_MESSAGE_LENGTH}`}</span>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!trimmedMessage || loading || aiUnavailable}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Spinner />
              <span>Extracting project requirements...</span>
            </>
          ) : (
            "Extract requirements"
          )}
        </button>
        <button
          type="button"
          onClick={onUseGuidedConfigurator}
          className="min-h-12 rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-ink transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
        >
          Use guided configurator
        </button>
      </div>

      <div aria-live="assertive" className="mt-4 space-y-3">
        {response && !response.extraction_succeeded ? (
          <div className={`rounded-2xl px-4 py-3 text-sm ${aiUnavailable ? "border border-blue/20 bg-blue-50 text-slate-700" : "border border-red-200 bg-red-50 text-red-700"}`}>
            <p>{response.message ?? "We could not extract the project requirements. Please try again."}</p>
            {aiUnavailable ? <p className="mt-1 text-slate-600">You can continue with the guided configurator.</p> : null}
          </div>
        ) : null}
        {!response && error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      </div>

      {showRetry ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={handleSubmit}
            className="min-h-11 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-ink transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
          >
            Retry
          </button>
        </div>
      ) : null}

      {showExtractionResults ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl bg-paper p-4 text-sm text-slate-700">
            <h3 className="text-base font-semibold text-ink">Extracted fields</h3>
            <dl className="mt-3 grid gap-3">
              {extractedEntries.map(([key, value]) => (
                <div key={key} className="grid gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{humanizeKey(key)}</dt>
                  <dd className="text-sm text-ink">{renderExtractedValue(value)}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-2xl bg-paper p-4 text-sm text-slate-700">
            <h3 className="text-base font-semibold text-ink">Missing required information</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {response.missing_required_fields.length ? (
                response.missing_required_fields.map((item) => (
                  <span key={item} className="rounded-full bg-white px-3 py-1 text-sm text-ink ring-1 ring-slate-200">
                    {item}
                  </span>
                ))
              ) : (
                <span className="rounded-full bg-white px-3 py-1 text-sm text-ink ring-1 ring-slate-200">No major gaps detected</span>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-paper p-4 text-sm text-slate-700">
            <h3 className="text-base font-semibold text-ink">Follow-up question</h3>
            <p className="mt-3">{response.next_question ?? "The project is ready for a deterministic recommendation."}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
