"use client";

import clsx from "clsx";

import type { ResultsPayload, ReviewPayload } from "@/lib/flow-storage";
import { buildReadinessDiagnosis, EXAMPLE_PROMPTS, HOME_WORKFLOW_STEPS } from "@/lib/presales-diagnosis";
import { formatEnumLabel } from "@/lib/recommendation-presentation";
import type { ReadinessDiagnosis, Recommendation, ValidationStatus } from "@/lib/types";

function StatusPill({ status }: { status: ValidationStatus }) {
  const styles: Record<ValidationStatus, string> = {
    validated_rule: "bg-emerald-50 text-emerald-700",
    detected: "bg-blue-50 text-blue",
    confirmed: "bg-emerald-50 text-emerald-700",
    missing: "bg-red-50 text-red-700",
    needs_review: "bg-amber-50 text-amber-900",
    assumption: "bg-slate-100 text-slate-700",
    needs_engineer_review: "bg-amber-50 text-amber-900",
    missing_data: "bg-red-50 text-red-700",
  };

  const labels: Record<ValidationStatus, string> = {
    validated_rule: "Validated rule",
    detected: "Detected",
    confirmed: "Confirmed",
    missing: "Missing",
    needs_review: "Needs review",
    assumption: "Assumption",
    needs_engineer_review: "Needs engineer review",
    missing_data: "Missing data",
  };

  return <span className={clsx("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]", styles[status])}>{labels[status]}</span>;
}

function WorkflowSteps() {
  return (
    <section className="panel border-blue/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(244,249,255,0.96)_100%)] p-5 md:p-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {HOME_WORKFLOW_STEPS.map((step, index) => (
          <div key={step.id} className="rounded-3xl border border-white/80 bg-white/78 p-4 shadow-[0_10px_30px_rgba(15,39,69,0.06)]">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-ink text-sm font-semibold text-white">{index + 1}</span>
              <div>
                <p className="text-sm font-semibold text-ink">{step.title}</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExamplePromptChips({ onSelect }: { onSelect: (value: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {EXAMPLE_PROMPTS.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelect(prompt)}
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-blue hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}

function RequirementPreviewPanel({ reviewPayload }: { reviewPayload: ReviewPayload | null }) {
  const diagnosis = reviewPayload
    ? buildReadinessDiagnosis(
        reviewPayload.response.extracted_requirements,
        reviewPayload.response.extraction_trace,
        reviewPayload.response.missing_required_fields,
        reviewPayload.response.next_question,
      )
    : null;

  return (
    <section className="panel border-blue/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(244,249,255,0.96)_100%)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-blue">Requirement Extraction</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Structured technical needs</h2>
        </div>
        <StatusPill status={reviewPayload ? "detected" : "assumption"} />
      </div>

      {diagnosis ? (
        <div className="mt-5 space-y-3">
          {diagnosis.cards.slice(0, 6).map((card) => (
            <div key={card.id} className="rounded-3xl border border-white/80 bg-white/82 p-4 shadow-[0_10px_24px_rgba(15,39,69,0.05)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{card.title}</p>
                  <p className="mt-2 text-sm font-medium text-ink">{card.value}</p>
                  {card.detail ? <p className="mt-2 text-xs leading-5 text-slate-500">{card.detail}</p> : null}
                </div>
                <StatusPill status={card.status} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white/72 p-5 text-sm leading-6 text-slate-600">
          Extracted requirement cards will appear here after analysis. The assistant separates detected values, missing data, and items that still need engineer review.
        </div>
      )}
    </section>
  );
}

function RecommendationSummaryPanel({
  reviewPayload,
  resultsPayload,
}: {
  reviewPayload: ReviewPayload | null;
  resultsPayload: ResultsPayload | null;
}) {
  const diagnosis: ReadinessDiagnosis | null = reviewPayload
    ? buildReadinessDiagnosis(
        reviewPayload.response.extracted_requirements,
        reviewPayload.response.extraction_trace,
        reviewPayload.response.missing_required_fields,
        reviewPayload.response.next_question,
      )
    : null;

  const recommendation: Recommendation | null = resultsPayload?.recommendation ?? null;

  return (
    <section className="panel border-ink/10 bg-[linear-gradient(160deg,rgba(15,39,69,0.98)_0%,rgba(31,71,117,0.96)_100%)] p-5 text-white">
      <p className="text-sm uppercase tracking-[0.22em] text-blue-100">Recommendation Summary</p>
      <h2 className="mt-2 text-2xl font-semibold">Validated NetUP guidance</h2>
      <p className="mt-3 text-sm leading-6 text-blue-50/90">
        Here is a preliminary NetUP solution package, based on validated rules, with assumptions and engineer-review items clearly separated.
      </p>

      <div className="mt-5 space-y-3">
        <div className="rounded-3xl border border-white/10 bg-white/8 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">Project readiness</p>
              <p className="mt-2 text-3xl font-semibold">{diagnosis ? `${diagnosis.score}% complete` : "Waiting for intake"}</p>
            </div>
            <StatusPill status={diagnosis && diagnosis.score >= 70 ? "validated_rule" : diagnosis ? "needs_review" : "assumption"} />
          </div>
          <p className="mt-3 text-sm text-blue-50/80">
            {diagnosis ? `${diagnosis.completeCount} of ${diagnosis.totalCount} presales inputs are already identified.` : "Readiness updates after the assistant detects the customer’s technical scope."}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/8 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">Rule-validation posture</p>
          <ul className="mt-3 space-y-2 text-sm text-blue-50/85">
            <li>Validated backend rules map needs to NetUP product components.</li>
            <li>Assumptions and unknowns remain visible for engineer review.</li>
            <li>Final compatibility, sizing, licensing, redundancy, and pricing stay with NetUP engineering.</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/8 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">Next action</p>
          <p className="mt-2 text-sm leading-6 text-white">
            {recommendation?.next_question ?? diagnosis?.nextQuestion ?? "Analyze a project description or open the guided questionnaire to start the presales workflow."}
          </p>
          {recommendation?.recommendations?.length ? (
            <p className="mt-3 text-xs uppercase tracking-[0.14em] text-blue-100">
              Latest package: {recommendation.recommendations[0] ? formatEnumLabel(recommendation.recommendations[0].claim_status) : "Preliminary"}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function HomeWorkspacePreview({
  reviewPayload,
  resultsPayload,
}: {
  reviewPayload: ReviewPayload | null;
  resultsPayload: ResultsPayload | null;
}) {
  return (
    <>
      <WorkflowSteps />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <RequirementPreviewPanel reviewPayload={reviewPayload} />
        <RecommendationSummaryPanel reviewPayload={reviewPayload} resultsPayload={resultsPayload} />
      </div>
    </>
  );
}

export function HeroSection() {
  return (
    <section className="panel overflow-hidden border-blue/20 bg-[radial-gradient(circle_at_top_left,rgba(45,91,145,0.16),transparent_20%),linear-gradient(135deg,rgba(250,252,255,0.98)_0%,rgba(235,243,251,0.96)_52%,rgba(255,255,255,0.98)_100%)] p-6 md:p-8">
      <div className="max-w-5xl space-y-4">
        <p className="text-sm uppercase tracking-[0.28em] text-blue">NetUP AI Presales Configurator</p>
        <h1 className="max-w-5xl font-serif text-[2.6rem] leading-[1.04] text-ink md:text-[3.2rem] xl:text-[4rem]">
          Plan a validated NetUP IPTV / OTT solution in minutes
        </h1>
        <p className="max-w-4xl text-base leading-7 text-slate-700 md:text-lg">
          Describe your project, upload requirements, or answer a guided questionnaire. The assistant extracts technical needs, checks them against NetUP product rules, and produces a preliminary presales recommendation for engineer review.
        </p>
        <div className="grid gap-3 pt-2 md:grid-cols-3">
          <div className="rounded-3xl border border-white/80 bg-white/75 p-4 shadow-[0_10px_24px_rgba(15,39,69,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue">NetUP-specific</p>
            <p className="mt-2 text-sm text-slate-700">Focused on NetUP IPTV / OTT product families, delivery modes, and presales constraints.</p>
          </div>
          <div className="rounded-3xl border border-white/80 bg-white/75 p-4 shadow-[0_10px_24px_rgba(15,39,69,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue">Rule validated</p>
            <p className="mt-2 text-sm text-slate-700">Recommendations are validated by deterministic backend rules instead of generic model-only output.</p>
          </div>
          <div className="rounded-3xl border border-white/80 bg-white/75 p-4 shadow-[0_10px_24px_rgba(15,39,69,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue">Engineer reviewed</p>
            <p className="mt-2 text-sm text-slate-700">Final equipment selection, licensing, compatibility, redundancy, and pricing stay with a NetUP engineer.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function IntakePromptAssist({ onSelect }: { onSelect: (value: string) => void }) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink">Example project prompts</p>
          <p className="mt-1 text-sm text-slate-600">Start from a realistic NetUP presales scenario instead of writing from a blank page.</p>
        </div>
        <StatusPill status="assumption" />
      </div>
      <div className="mt-4">
        <ExamplePromptChips onSelect={onSelect} />
      </div>
    </div>
  );
}
