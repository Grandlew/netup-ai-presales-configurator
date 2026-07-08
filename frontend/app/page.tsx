"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ConversationPanel } from "@/components/conversation-panel";
import { HeroSection, HomeWorkspacePreview } from "@/components/home-workspace";
import { Wizard } from "@/components/wizard";
import { api } from "@/lib/api";
import { consumeHomeNavigationIntent, getResultsPayload, getReviewPayload, setReviewPayload } from "@/lib/flow-storage";
import type { ConfigOptionsResponse, ExtractResponse } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [options, setOptions] = useState<ConfigOptionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversationResetSignal, setConversationResetSignal] = useState(0);
  const [entryMode, setEntryMode] = useState<"guided" | "conversation">("conversation");
  const [guidedFocusSignal, setGuidedFocusSignal] = useState(0);
  const [modeAnnouncement, setModeAnnouncement] = useState("");
  const [wizardSeedValues, setWizardSeedValues] = useState<Record<string, unknown> | null>(null);
  const [wizardSeedSignal, setWizardSeedSignal] = useState(0);
  const [wizardSeedStep, setWizardSeedStep] = useState(0);
  const [reviewPayload, setExistingReviewPayload] = useState(getReviewPayload());
  const [resultsPayload, setExistingResultsPayload] = useState(getResultsPayload());
  const wizardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    api
      .options()
      .then(setOptions)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load configurator options."));
  }, []);

  useEffect(() => {
    const intent = consumeHomeNavigationIntent();
    if (!intent) return;

    if (intent.seedValues) {
      setWizardSeedValues(intent.seedValues as Record<string, unknown>);
      setWizardSeedStep(intent.seedStartStep ?? 0);
      setWizardSeedSignal((current) => current + 1);
    }

    setEntryMode(intent.entryMode);
    setModeAnnouncement(intent.entryMode === "guided" ? "Guided configurator selected." : "Natural-language intake selected.");

    if (intent.entryMode === "guided") {
      setGuidedFocusSignal((current) => current + 1);
      requestAnimationFrame(() => {
        wizardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, []);

  function focusWizard(seedValues?: Record<string, unknown>, seedStep = 0) {
    if (seedValues) {
      setWizardSeedValues(seedValues);
      setWizardSeedStep(seedStep);
      setWizardSeedSignal((current) => current + 1);
    }
    setEntryMode("guided");
    setModeAnnouncement("Guided configurator selected.");
    setGuidedFocusSignal((current) => current + 1);
    requestAnimationFrame(() => {
      wizardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function showConversationMode() {
    setEntryMode("conversation");
    setModeAnnouncement("Natural-language intake selected.");
  }

  function showConversationReview(response: ExtractResponse, originalMessage: string) {
    setReviewPayload({ response, originalMessage });
    setExistingReviewPayload({ response, originalMessage });
    router.push("/review");
  }

  return (
    <main className="shell">
      <div className="sr-only" aria-live="polite">
        {modeAnnouncement}
      </div>

      <div className="space-y-7">
        <HeroSection />
        <HomeWorkspacePreview reviewPayload={reviewPayload} resultsPayload={resultsPayload} />

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.14fr)_minmax(0,0.92fr)_minmax(300px,0.86fr)] xl:items-start">
          {entryMode === "conversation" ? (
            <>
              <div className="min-w-0 xl:col-span-1">
                <ConversationPanel
                  onUseGuidedConfigurator={focusWizard}
                  onExtractionSuccess={showConversationReview}
                  resetSignal={conversationResetSignal}
                />
              </div>
              <div className="min-w-0 xl:col-span-1">
                <div className="panel border-blue/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(244,249,255,0.96)_100%)] p-5">
                  <p className="text-sm uppercase tracking-[0.22em] text-blue">Requirement Auditor</p>
                  <h2 className="mt-2 text-2xl font-semibold text-ink">What the assistant will check</h2>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                    <li>Project type, scale, channels, and content-source mix.</li>
                    <li>Client devices, delivery path, and required feature set.</li>
                    <li>Existing infrastructure, redundancy expectations, and open engineering questions.</li>
                    <li>Whether enough data exists for a credible preliminary NetUP package.</li>
                  </ul>
                </div>
              </div>
              <aside className="min-w-0 space-y-5 xl:col-span-1">
                <div className="panel border-blue/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(244,249,255,0.96)_100%)] p-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-blue">Why deterministic rules</p>
                  <h2 className="mt-2 text-xl font-semibold text-ink">AI extracts. NetUP rules validate.</h2>
                  <ul className="mt-3 space-y-2.5 text-sm text-slate-600">
                    <li>Recommendations come from validated backend rules, not generic AI text generation.</li>
                    <li>Missing data stays visible so the presales diagnosis remains honest.</li>
                    <li>Final compatibility, sizing, pricing, and redundancy design still belong to a NetUP engineer.</li>
                  </ul>
                </div>
              </aside>
            </>
          ) : null}
        </section>

        <div id="guided-configurator" ref={wizardRef} className={entryMode === "guided" ? "min-w-0 space-y-5" : "hidden"}>
          {error ? <div className="panel p-6 text-sm text-red-600">{error}</div> : null}
          {options ? (
            <Wizard
              options={options}
              onStartOver={() => {
                setConversationResetSignal((current) => current + 1);
                setWizardSeedValues(null);
                setEntryMode("conversation");
              }}
              focusRequestSignal={guidedFocusSignal}
              seedValues={wizardSeedValues}
              seedSignal={wizardSeedSignal}
              seedStartStep={wizardSeedStep}
              onDescribeProjectInstead={entryMode === "guided" ? showConversationMode : undefined}
            />
          ) : (
            <div className="panel p-6 text-sm text-slate-500">Loading configurator options...</div>
          )}
        </div>
      </div>
    </main>
  );
}
