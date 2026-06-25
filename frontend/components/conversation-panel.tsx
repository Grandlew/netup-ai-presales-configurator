"use client";

import { useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";
import type { ExtractResponse } from "@/lib/types";

const MAX_MESSAGE_LENGTH = 600;

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" aria-hidden="true" />;
}

function renderExtractedValue(value: unknown) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined || value === "") return "Not provided";
  return String(value);
}

function getAiUnavailableMessage(reason: ExtractResponse["ai_unavailable_reason"]) {
  switch (reason) {
    case "not_configured":
      return "Natural-language intake is currently unavailable because the AI service is not configured.";
    case "upstream_unavailable":
      return "Natural-language intake is currently unavailable because the AI service could not be reached right now.";
    default:
      return "Natural-language intake is currently unavailable because the AI service is not available right now.";
  }
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
  const [aiUnavailable, setAiUnavailable] = useState(false);

  useEffect(() => {
    setMessage("");
    setResponse(null);
    setError(null);
    setLoading(false);
    setAiUnavailable(false);
  }, [resetSignal]);

  const extractedEntries = useMemo(() => Object.entries(response?.extracted_requirements ?? {}), [response]);
  const trimmedMessage = message.trim();
  const aiUnavailableMessage = getAiUnavailableMessage(response?.ai_unavailable_reason);

  const handleSubmit = async () => {
    if (!trimmedMessage || aiUnavailable || loading) return;

    setLoading(true);
    setError(null);
    try {
      const result = await api.extract({
        message: trimmedMessage,
        current_requirements: response?.extracted_requirements ?? {},
      });
      setResponse(result);
      setAiUnavailable(!result.ai_available);
      setError(null);
    } catch (err) {
      setError("We could not extract requirements from this description. Please try again or continue with the guided configurator.");
    } finally {
      setLoading(false);
    }
  };

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

      {aiUnavailable ? (
        <div className="mt-4 rounded-2xl border border-blue/20 bg-blue-50 px-4 py-3 text-sm text-slate-700" aria-live="polite" role="status">
          <p>{aiUnavailableMessage}</p>
          <p className="mt-1 text-slate-600">You can continue with the guided configurator.</p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!trimmedMessage || aiUnavailable || loading}
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

      <div aria-live="assertive" className="mt-4">
        {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      </div>

      {response ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl bg-paper p-4 text-sm text-slate-700">
            <h3 className="text-base font-semibold text-ink">Extracted fields</h3>
            {extractedEntries.length ? (
              <dl className="mt-3 grid gap-3">
                {extractedEntries.map(([key, value]) => (
                  <div key={key} className="grid gap-1 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{key.replaceAll("_", " ")}</dt>
                    <dd className="text-sm text-ink">{renderExtractedValue(value)}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-3 text-sm text-slate-600">No fields have been extracted yet.</p>
            )}
          </div>

          <div className="rounded-2xl bg-paper p-4 text-sm text-slate-700">
            <h3 className="text-base font-semibold text-ink">Missing information</h3>
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
