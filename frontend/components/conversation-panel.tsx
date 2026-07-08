"use client";

import { useEffect, useState } from "react";

import { IntakePromptAssist } from "@/components/home-workspace";
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

  function applyExamplePrompt(value: string) {
    setMessage(value);
    setError(null);
  }

  return (
    <div className="panel border-blue/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(244,249,255,0.96)_100%)] p-5 md:p-6">
      <p className="text-sm uppercase tracking-[0.24em] text-blue">Intake Workspace</p>
      <h2 className="mt-2 text-[1.9rem] font-semibold text-ink">Project intake and requirement analysis</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Describe the project in plain language and the assistant will extract technical requirements for rule-based NetUP validation.
      </p>

      <div className="mt-5">
        <IntakePromptAssist onSelect={applyExamplePrompt} />
      </div>

      <label htmlFor="conversation-message" className="mt-5 block text-sm font-medium text-ink">
        Project description
      </label>
      <textarea
        id="conversation-message"
        maxLength={MAX_MESSAGE_LENGTH}
        className="mt-2 min-h-36 w-full rounded-2xl border border-slate-200 p-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
        placeholder="Example: 180-room hotel with LG Smart TVs, 85 channels, satellite + IP sources, catch-up TV, and mobile viewing."
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>Use the guided questionnaire anytime if you already know the technical scope.</span>
        <span aria-live="polite">{`${message.length}/${MAX_MESSAGE_LENGTH}`}</span>
      </div>

      <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-white/72 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Upload requirements</p>
            <p className="mt-1 text-sm text-slate-600">Requirement attachment intake is not configured yet in this deployment.</p>
          </div>
          <button
            type="button"
            disabled
            title="Engineer handoff integration not configured yet."
            className="min-h-11 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-400"
          >
            Upload requirements
          </button>
        </div>
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
            "Analyze Project Requirements"
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
