"use client";

import { useId, useState } from "react";

import type { WizardFormValues } from "@/lib/schema";
import type { Recommendation } from "@/lib/types";

function formatList(items: string[], emptyMessage: string) {
  return items.length ? items : [emptyMessage];
}

function formatValue(value: unknown) {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "Not specified";
  if (value === null || value === undefined || value === "") return "Not specified";
  return String(value);
}

function DetailRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-2xl bg-paper px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{formatValue(value)}</dd>
    </div>
  );
}

function ProductCard({
  item,
  defaultExpanded = false,
}: {
  item: Recommendation["recommendations"][number];
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const detailId = useId();

  return (
    <article className="rounded-3xl border border-slate-200 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">{item.category}</p>
          <h4 className="mt-1 text-xl font-semibold text-ink">{item.product}</h4>
        </div>
        <span className="inline-flex rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink">Preliminary recommendation</span>
      </div>
      <p className="mt-3 text-sm text-slate-700">{item.reason}</p>
      {item.warning ? <p className="mt-3 rounded-2xl bg-paper px-4 py-3 text-sm text-slate-600">{item.warning}</p> : null}
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={detailId}
        onClick={() => setExpanded((current) => !current)}
        className="mt-4 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-ink transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
      >
        {expanded ? "Hide selection details" : "Why this was selected"}
      </button>
      {expanded ? (
        <div id={detailId} className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          {item.reason}
        </div>
      ) : null}
    </article>
  );
}

export function ResultsPanel({
  recommendation,
  submittedValues,
  reportHtml,
  onRequestEngineeringReview,
  onSaveLead,
  onPrintReport,
  onStartOver,
  onEditConfiguration,
  leadSaved,
  loadingAction,
}: {
  recommendation: Recommendation;
  submittedValues?: WizardFormValues | null;
  reportHtml?: string | null;
  onRequestEngineeringReview: () => void | Promise<boolean>;
  onSaveLead: () => void | Promise<boolean>;
  onPrintReport: () => void | Promise<boolean>;
  onStartOver: () => void;
  onEditConfiguration: () => void;
  leadSaved: boolean;
  loadingAction: boolean;
}) {
  const reportHref = reportHtml ? `data:text/html;charset=utf-8,${encodeURIComponent(reportHtml)}` : undefined;
  const resultId = recommendation.rule_version ? `Rules ${recommendation.rule_version}` : undefined;

  return (
    <div className="space-y-6">
      <section className="panel p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-blue">Preliminary Solution Recommendation</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink md:text-3xl">{recommendation.project_summary}</h2>
            <p className="mt-3 max-w-3xl text-base text-slate-700">This preliminary recommendation summarizes the current NetUP fit, capacity outlook, and follow-up needs for presales review.</p>
            {resultId ? <p className="mt-3 text-sm text-slate-500">{resultId}</p> : null}
          </div>
          <span className="inline-flex items-center justify-center rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue">
            Preliminary status
          </span>
        </div>
      </section>

      <section className="panel p-5 md:p-6">
        <h3 className="text-xl font-semibold text-ink">Project summary</h3>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DetailRow label="Project type" value={submittedValues?.project_type} />
          <DetailRow label="Country" value={submittedValues?.country} />
          <DetailRow label="Rooms or endpoints" value={submittedValues?.subscribers_or_rooms} />
          <DetailRow label="Channels" value={submittedValues?.number_of_channels} />
          <DetailRow label="Delivery mode" value={submittedValues?.delivery_mode} />
          <DetailRow label="Selected services" value={submittedValues?.services} />
          <DetailRow label="Selected devices" value={submittedValues?.viewer_devices} />
          <DetailRow label="Signal sources" value={submittedValues?.signal_sources} />
        </div>
      </section>

      <section className="panel p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-ink">Recommended product families</h3>
            <p className="mt-2 text-sm text-slate-600">Each item below is a preliminary recommendation generated from validated rules.</p>
          </div>
          <span className="inline-flex items-center justify-center rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue">
            Preliminary recommendation
          </span>
        </div>
        <div className="mt-5 grid gap-4">
          {recommendation.recommendations.map((item, index) => (
            <ProductCard key={`${item.category}-${item.product}`} item={item} defaultExpanded={index === 0} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <div className="panel p-5 md:p-6">
          <h3 className="text-xl font-semibold text-ink">Capacity estimates</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-paper p-4">
              <p className="text-sm text-slate-500">Concurrent viewers</p>
              <p className="mt-2 text-3xl font-semibold text-ink">{submittedValues?.expected_concurrent_viewers ?? "Pending"}</p>
              <p className="mt-2 text-xs text-slate-500">Customer-provided input</p>
            </div>
            <div className="rounded-3xl bg-paper p-4">
              <p className="text-sm text-slate-500">Estimated bandwidth</p>
              <p className="mt-2 text-3xl font-semibold text-ink">{recommendation.capacity.safety_adjusted_bandwidth_mbps} Mbps</p>
              <p className="mt-2 text-xs text-slate-500">Base: {recommendation.capacity.base_bandwidth_mbps} Mbps</p>
            </div>
            <div className="rounded-3xl bg-paper p-4">
              <p className="text-sm text-slate-500">Estimated archive storage</p>
              <p className="mt-2 text-3xl font-semibold text-ink">{recommendation.capacity.safety_adjusted_archive_storage_tb} TB</p>
              <p className="mt-2 text-xs text-slate-500">Base: {recommendation.capacity.estimated_archive_storage_tb} TB</p>
            </div>
          </div>
          <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-ink">Formula and assumptions</p>
            <p className="mt-2 text-sm text-slate-600">{recommendation.capacity.unicast_bandwidth_formula}</p>
            <p className="mt-2 text-sm text-slate-500">Clarification: the preliminary bandwidth estimate assumes unicast delivery unless NetUP engineering confirms multicast behavior where relevant.</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {recommendation.capacity.assumptions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <section className="panel p-5 md:p-6">
            <h3 className="text-xl font-semibold text-ink">Missing information</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {formatList(recommendation.missing_information, "No major gaps detected in the submitted profile.").map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onEditConfiguration}
              className="mt-4 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-ink transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
            >
              Edit configuration
            </button>
          </section>

          <section className="panel p-5 md:p-6">
            <h3 className="flex items-center gap-2 text-xl font-semibold text-ink">
              <span aria-hidden="true">!</span>
              <span>Engineering warnings</span>
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              {formatList(recommendation.warnings, "No engineering warnings were raised by the current rules.").map((item) => (
                <li key={item} className="rounded-2xl bg-paper px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-5 md:p-6">
          <h3 className="text-xl font-semibold text-ink">Assumptions</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {formatList(recommendation.assumptions, "No additional assumptions were noted.").map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="panel p-5 md:p-6">
          <h3 className="text-xl font-semibold text-ink">Next steps</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            <li>Confirm unresolved customer details and review any technical warnings.</li>
            <li>Save the lead and request engineering review when the scope is ready for handoff.</li>
            <li>Print or download the preliminary report for the presales discussion.</li>
          </ul>
        </div>
      </section>

      <section className="panel p-5 md:p-6">
        <h3 className="text-xl font-semibold text-ink">Actions</h3>
        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:flex-wrap">
          <button
            type="button"
            onClick={() => void onRequestEngineeringReview()}
            disabled={loadingAction}
            className="min-h-12 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 disabled:opacity-50"
          >
            Request engineering review
          </button>
          <button
            type="button"
            onClick={() => void onSaveLead()}
            disabled={loadingAction}
            className="min-h-12 rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-ink transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {leadSaved ? "Lead saved" : "Save lead"}
          </button>
          <button
            type="button"
            onClick={() => void onPrintReport()}
            disabled={loadingAction}
            className="min-h-12 rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-ink transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 disabled:opacity-50"
          >
            Print preliminary report
          </button>
          <button
            type="button"
            onClick={onEditConfiguration}
            className="min-h-12 rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-ink transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
          >
            Edit configuration
          </button>
          <button
            type="button"
            onClick={onStartOver}
            className="min-h-12 rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-ink transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
          >
            Start over
          </button>
        </div>
      </section>

      {reportHtml ? (
        <section className="panel p-5 md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-ink">Printable preliminary report</h3>
              <p className="mt-2 text-sm text-slate-600">Use the preview below to print or download the current presales summary.</p>
            </div>
            <a
              href={reportHref}
              download="netup-preliminary-report.html"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-ink transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
            >
              Download report
            </a>
          </div>
          <iframe title="Report Preview" className="mt-4 h-[480px] w-full rounded-2xl border border-slate-200 bg-white print:h-auto" srcDoc={reportHtml} />
        </section>
      ) : null}
    </div>
  );
}
