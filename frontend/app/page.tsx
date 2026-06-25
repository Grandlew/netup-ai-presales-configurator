"use client";

import { useEffect, useState } from "react";

import { ConversationPanel } from "@/components/conversation-panel";
import { Wizard } from "@/components/wizard";
import { api } from "@/lib/api";
import type { ConfigOptionsResponse } from "@/lib/types";

export default function HomePage() {
  const [options, setOptions] = useState<ConfigOptionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversationResetSignal, setConversationResetSignal] = useState(0);
  const [resultsViewActive, setResultsViewActive] = useState(false);

  useEffect(() => {
    api
      .options()
      .then(setOptions)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load configurator options."));
  }, []);

  function focusWizard() {
    document.getElementById("guided-configurator")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="shell">
      <section className={resultsViewActive ? "grid gap-7" : "grid gap-7 xl:grid-cols-[minmax(0,1.22fr)_minmax(300px,0.78fr)] xl:items-start"}>
        <div id="guided-configurator" className={resultsViewActive ? "min-w-0 space-y-5" : "min-w-0 space-y-5"}>
          <p className="text-sm uppercase tracking-[0.28em] text-blue">NetUP AI Presales Configurator</p>
          <h1 className="max-w-4xl font-serif text-[2.7rem] leading-[1.05] text-ink md:text-[3.2rem] xl:text-[4rem]">
            Design Your IPTV or OTT Solution
          </h1>
          <p className="max-w-3xl text-[1.05rem] text-slate-600 md:text-lg">
            Describe your project or complete the guided questionnaire to receive a preliminary NetUP solution recommendation.
          </p>
          <div className="panel max-w-3xl p-5 text-sm text-slate-600">
            This configurator provides a preliminary recommendation. Final equipment, licensing, capacity, compatibility, redundancy, and pricing must be validated by a NetUP engineer.
          </div>
          {error ? <div className="panel p-6 text-sm text-red-600">{error}</div> : null}
          {options ? (
            <Wizard
              options={options}
              onStartOver={() => setConversationResetSignal((current) => current + 1)}
              onResultsViewChange={setResultsViewActive}
            />
          ) : (
            <div className="panel p-6 text-sm text-slate-500">Loading configurator options...</div>
          )}
        </div>
        <aside className={resultsViewActive ? "hidden" : "min-w-0 space-y-5 xl:pt-2"}>
          <ConversationPanel
            onUseGuidedConfigurator={focusWizard}
            resetSignal={conversationResetSignal}
          />
          <div className="panel p-5">
            <p className="text-sm uppercase tracking-[0.24em] text-blue">Why deterministic rules</p>
            <h2 className="mt-2 text-xl font-semibold text-ink">AI assists the intake, not the recommendation engine</h2>
            <ul className="mt-3 space-y-2.5 text-sm text-slate-600">
              <li>Recommendations always come from validated backend rules.</li>
              <li>Capacity calculations stay deterministic and auditable.</li>
              <li>Every result is framed as a preliminary presales view, not a final engineering design.</li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}
