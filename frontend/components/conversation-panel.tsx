"use client";

import { useState } from "react";

import { api } from "@/lib/api";
import type { ExtractResponse } from "@/lib/types";

export function ConversationPanel() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState<ExtractResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.extract({ message, current_requirements: response?.extracted_requirements ?? {} });
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversation request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel p-6">
      <p className="text-sm uppercase tracking-[0.24em] text-blue">Describe My Project</p>
      <h3 className="mt-2 text-2xl font-semibold text-ink">Natural-language intake</h3>
      <p className="mt-2 text-sm text-slate-600">
        Describe your project in plain language. The AI layer only extracts requirements and asks follow-up questions.
      </p>
      <textarea
        className="mt-6 min-h-40 w-full rounded-2xl border border-slate-200 p-4 text-sm text-slate-700 outline-none ring-0"
        placeholder="We have a 180-room hotel. We want 85 satellite and IP channels on LG Smart TVs, plus catch-up TV and mobile viewing."
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!message || loading}
        className="mt-4 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Extracting..." : "Extract requirements"}
      </button>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {response ? (
        <div className="mt-6 rounded-2xl bg-paper p-4 text-sm text-slate-700">
          {!response.ai_available ? (
            <p className="font-medium text-ink">Conversational extraction is currently disabled because no OpenAI API key is configured.</p>
          ) : null}
          <p className="mt-2 font-medium text-ink">Next question</p>
          <p>{response.next_question ?? "The project is ready for a deterministic recommendation."}</p>
          <p className="mt-4 font-medium text-ink">Missing required fields</p>
          <p>{response.missing_required_fields.join(", ") || "None"}</p>
        </div>
      ) : null}
    </div>
  );
}
