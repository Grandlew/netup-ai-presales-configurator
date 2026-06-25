"use client";

import { useEffect, useState } from "react";

import { ConversationPanel } from "@/components/conversation-panel";
import { Wizard } from "@/components/wizard";
import { api } from "@/lib/api";
import type { ConfigOptionsResponse } from "@/lib/types";

export default function HomePage() {
  const [options, setOptions] = useState<ConfigOptionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .options()
      .then(setOptions)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load configurator options."));
  }, []);

  return (
    <main className="shell">
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.28em] text-blue">NetUP AI Presales Configurator</p>
          <h1 className="max-w-4xl font-serif text-5xl leading-tight text-ink md:text-6xl">
            Design Your IPTV or OTT Solution
          </h1>
          <p className="max-w-3xl text-lg text-slate-600">
            Describe your project or complete the guided questionnaire to receive a preliminary NetUP solution recommendation.
          </p>
          <div className="panel max-w-3xl p-5 text-sm text-slate-600">
            This configurator provides a preliminary recommendation. Final equipment, licensing, capacity, compatibility, redundancy, and pricing must be validated by a NetUP engineer.
          </div>
          {error ? <div className="panel p-6 text-sm text-red-600">{error}</div> : null}
          {options ? <Wizard options={options} /> : <div className="panel p-6 text-sm text-slate-500">Loading configurator options...</div>}
        </div>
        <aside className="space-y-6">
          <ConversationPanel />
          <div className="panel p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-blue">Why deterministic rules</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">AI assists the intake, not the recommendation engine</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
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
