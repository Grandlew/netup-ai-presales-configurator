"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ConversationReview } from "@/components/conversation-review";
import { api } from "@/lib/api";
import { getReviewPayload, setHomeNavigationIntent } from "@/lib/flow-storage";
import type { ConfigOptionsResponse } from "@/lib/types";

export default function ReviewPage() {
  const router = useRouter();
  const [options, setOptions] = useState<ConfigOptionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payloadAvailable, setPayloadAvailable] = useState(false);
  const payload = getReviewPayload();

  useEffect(() => {
    setPayloadAvailable(Boolean(getReviewPayload()));

    api
      .options()
      .then(setOptions)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load configurator options."));
  }, []);

  if (!payloadAvailable || !payload) {
    return (
      <main className="shell">
        <section className="panel mx-auto max-w-3xl p-6 md:p-7">
          <p className="text-sm uppercase tracking-[0.24em] text-blue">Review unavailable</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">No extracted intake is available</h1>
          <p className="mt-3 text-sm text-slate-600">Return to the configurator and run a new natural-language extraction to review customer details.</p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-6 min-h-12 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
          >
            Back to configurator
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <div className="space-y-5">
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="min-h-11 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-ink transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
          >
            Back to configurator
          </button>
          <p className="text-sm uppercase tracking-[0.28em] text-blue">NetUP AI Presales Configurator</p>
        </div>

        {error ? <div className="panel p-6 text-sm text-red-600">{error}</div> : null}

        {options ? (
          <ConversationReview
            options={options}
            response={payload.response}
            originalMessage={payload.originalMessage}
            onBackToIntake={() => router.push("/")}
            onUseGuidedConfigurator={(seedValues, targetStep = 0) => {
              setHomeNavigationIntent({
                entryMode: "guided",
                seedValues: seedValues as never,
                seedStartStep: targetStep,
              });
              router.push("/");
            }}
          />
        ) : (
          <div className="panel p-6 text-sm text-slate-500">Loading configurator options...</div>
        )}
      </div>
    </main>
  );
}
