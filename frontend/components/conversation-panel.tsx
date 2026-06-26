"use client";

import { useEffect, useState } from "react";

import { ApiError, api } from "@/lib/api";
import type { ExtractResponse } from "@/lib/types";

const MAX_MESSAGE_LENGTH = 600;

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" aria-hidden="true" />;
}

function getClientErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return "We could not extract the project requirements. Please try again.";
}

export function ConversationPanel({
  onUseGuidedConfigurator,
  onExtractionSuccess,
  resetSignal = 0,
}: {
  onUseGuidedConfigurator?: () => void;
  onExtractionSuccess?: (response: ExtractResponse, message: string) => void;
  resetSignal?: number;
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false);

  useEffect(() => {
    setMessage("");
    setError(null);
    setLoading(false);
    setAiUnavailable(false);
  }, [resetSignal]);

  const trimmedMessage = message.trim();
  const showRetry = Boolean(trimmedMessage) && Boolean(error) && !loading && !aiUnavailable;

  const handleSubmit = async () => {
    if (!trimmedMessage || loading || aiUnavailable) return;

    setLoading(true);
    setError(null);
    try {
      const result = await api.extract({
        message: trimmedMessage,
        current_requirements: {},
      });

      if (result.extraction_succeeded) {
        onExtractionSuccess?.(result, trimmedMessage);
        return;
      }

      setAiUnavailable(!result.ai_available);
      setError(result.message ?? "We could not extract the project requirements. Please try again.");
    } catch (err) {
      setError(getClientErrorMessage(err));
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
        {error ? (
          <div className={`rounded-2xl px-4 py-3 text-sm ${aiUnavailable ? "border border-blue/20 bg-blue-50 text-slate-700" : "border border-red-200 bg-red-50 text-red-700"}`}>
            <p>{error}</p>
            {aiUnavailable ? <p className="mt-1 text-slate-600">You can continue with the guided configurator.</p> : null}
          </div>
        ) : null}
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
    </div>
  );
}
