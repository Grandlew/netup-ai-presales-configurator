"use client";

import { useId, useMemo, useState } from "react";

import type { WizardFormValues } from "@/lib/schema";
import type { Recommendation } from "@/lib/types";

const ENUM_LABELS: Record<string, string> = {
  local_network: "Local network",
  internet_ott: "Internet / OTT",
  live_tv: "Live TV",
  smart_tv: "Smart TV",
  set_top_box: "Set-top box",
  ip_streams: "Existing IP streams",
};

function formatList(items: string[], emptyMessage: string) {
  return items.length ? items : [emptyMessage];
}

function humanizeEnum(value: string) {
  if (ENUM_LABELS[value]) return ENUM_LABELS[value];
  return value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatNumber(value: number, maximumFractionDigits = 2) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return String(value);
  const minimumFractionDigits = maximumFractionDigits === 0 ? 0 : Number.isInteger(numericValue) ? 0 : 1;

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numericValue);
}

function formatValue(value: unknown) {
  if (Array.isArray(value)) return value.length ? value.map((item) => humanizeEnum(String(item))).join(", ") : "Not specified";
  if (typeof value === "string") return value ? humanizeEnum(value) : "Not specified";
  if (typeof value === "number") return formatNumber(value);
  if (value === null || value === undefined || value === "") return "Not specified";
  return String(value);
}

function formatGeneratedDate() {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

function formatReferenceNumber(recommendation: Recommendation, submittedValues?: WizardFormValues | null) {
  const source = [recommendation.rule_version, recommendation.project_summary, submittedValues?.project_type, submittedValues?.subscribers_or_rooms].filter(Boolean).join("|");
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) % 100000;
  }
  const datePart = new Intl.DateTimeFormat("en-CA").format(new Date()).replaceAll("-", "");
  return `REC-${datePart}-${String(hash).padStart(5, "0")}`;
}

function buildProjectTitle(submittedValues: WizardFormValues | null | undefined, recommendation: Recommendation) {
  if (!submittedValues?.project_type || !submittedValues.subscribers_or_rooms) {
    return recommendation.project_summary;
  }

  const projectType = humanizeEnum(submittedValues.project_type);
  const scaleUnit =
    submittedValues.project_type === "hotel"
      ? "rooms"
      : submittedValues.project_type === "hospital"
        ? "rooms / screens"
        : "subscribers";
  const delivery = submittedValues.delivery_mode ? humanizeEnum(submittedValues.delivery_mode) : undefined;

  return `${projectType} solution for ${formatNumber(submittedValues.subscribers_or_rooms, 0)} ${scaleUnit}${delivery ? ` · ${delivery}` : ""}`;
}

function getMatchedRuleConditions(item: Recommendation["recommendations"][number], submittedValues?: WizardFormValues | null) {
  if (!submittedValues) {
    return ["The recommendation is based on the submitted project scope and validated NetUP rules."];
  }

  const conditions = [
    item.rule_id ? `Matched rule reference: ${item.rule_id}` : null,
    submittedValues.project_type ? `Project type: ${humanizeEnum(submittedValues.project_type)}` : null,
    submittedValues.subscribers_or_rooms ? `Project scale: ${formatNumber(submittedValues.subscribers_or_rooms, 0)} rooms / subscribers` : null,
    submittedValues.number_of_channels ? `Channel count: ${formatNumber(submittedValues.number_of_channels, 0)} TV channels` : null,
    submittedValues.delivery_mode ? `Delivery mode: ${humanizeEnum(submittedValues.delivery_mode)}` : null,
    submittedValues.services?.length ? `Services: ${submittedValues.services.map(humanizeEnum).join(", ")}` : null,
    submittedValues.viewer_devices?.length ? `Viewer devices: ${submittedValues.viewer_devices.map(humanizeEnum).join(", ")}` : null,
    submittedValues.signal_sources?.length ? `Signal sources: ${submittedValues.signal_sources.map(humanizeEnum).join(", ")}` : null,
    submittedValues.expected_concurrent_viewers ? `Concurrent viewers: ${formatNumber(submittedValues.expected_concurrent_viewers, 0)}` : null,
  ];

  return conditions.filter((condition): condition is string => Boolean(condition)).slice(0, 6);
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
  submittedValues,
  defaultExpanded = false,
}: {
  item: Recommendation["recommendations"][number];
  submittedValues?: WizardFormValues | null;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const detailId = useId();
  const matchedConditions = useMemo(() => getMatchedRuleConditions(item, submittedValues), [item, submittedValues]);
  const validationBadge = item.validation_status ?? "Preliminary recommendation";

  return (
    <article className="rounded-3xl border border-slate-200 p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">{item.category}</p>
          <h4 className="mt-1 text-xl font-semibold text-ink">{item.product}</h4>
          <p className="mt-3 text-sm leading-6 text-slate-700">{item.reason}</p>
        </div>
        <span className="inline-flex items-center justify-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue">
          {validationBadge}
        </span>
      </div>

      {item.warning ? <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{item.warning}</p> : null}

      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={detailId}
        onClick={() => setExpanded((current) => !current)}
        className="mt-4 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-ink transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
      >
        {expanded ? "Hide matched rule conditions" : "Show matched rule conditions"}
      </button>

      {expanded ? (
        <div id={detailId} className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700">
          <p className="font-semibold text-ink">Matched rule conditions</p>
          <ul className="mt-3 space-y-2">
            {matchedConditions.map((condition) => (
              <li key={condition} className="rounded-2xl bg-paper px-3 py-2">
                {condition}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

export function ResultsPanel({
  recommendation,
  submittedValues,
  reportHtml,
  reportReady,
  onRequestEngineeringReview,
  onSaveLead,
  onPrintReport,
  onDownloadPdf,
  onDownloadWord,
  onStartOver,
  onEditConfiguration,
  leadSaved,
  loadingAction,
}: {
  recommendation: Recommendation;
  submittedValues?: WizardFormValues | null;
  reportHtml?: string | null;
  reportReady: boolean;
  onRequestEngineeringReview: () => void | Promise<boolean>;
  onSaveLead: () => void | Promise<boolean>;
  onPrintReport: () => void | Promise<boolean>;
  onDownloadPdf: () => void | Promise<boolean>;
  onDownloadWord: () => void | Promise<boolean>;
  onStartOver: () => void;
  onEditConfiguration: () => void;
  leadSaved: boolean;
  loadingAction: boolean;
}) {
  const reportHref = reportHtml ? `data:text/html;charset=utf-8,${encodeURIComponent(reportHtml)}` : undefined;
  const generatedDate = useMemo(() => formatGeneratedDate(), []);
  const referenceNumber = useMemo(() => formatReferenceNumber(recommendation, submittedValues), [recommendation, submittedValues]);
  const projectTitle = useMemo(() => buildProjectTitle(submittedValues, recommendation), [recommendation, submittedValues]);
  const concurrentViewers = submittedValues?.expected_concurrent_viewers;

  return (
    <div className="mx-auto max-w-[1160px] space-y-6 print:max-w-none">
      <section className="panel p-5 md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm uppercase tracking-[0.24em] text-blue">Preliminary Solution Recommendation</p>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue">
                Preliminary
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-ink md:text-3xl">{projectTitle}</h2>
            <p className="mt-3 max-w-4xl text-base leading-7 text-slate-700">
              This preliminary recommendation summarizes the current NetUP fit, estimated capacity, and the follow-up items needed before engineering validation.
            </p>
          </div>

          <dl className="grid shrink-0 gap-3 rounded-3xl bg-paper p-4 text-sm text-slate-700 sm:grid-cols-2 lg:w-[360px]">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Generated date</dt>
              <dd className="mt-1 font-medium text-ink">{generatedDate}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Reference number</dt>
              <dd className="mt-1 font-medium text-ink">{referenceNumber}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Recommendation rules version</dt>
              <dd className="mt-1 font-medium text-ink">{recommendation.rule_version}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="panel p-5 md:p-6">
        <h3 className="text-xl font-semibold text-ink">Project summary</h3>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
            <p className="mt-2 text-sm text-slate-600">Each card shows the preliminary product fit, why it applies, and the configuration signals that triggered the recommendation.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {recommendation.recommendations.map((item, index) => (
            <ProductCard key={`${item.category}-${item.product}`} item={item} submittedValues={submittedValues} defaultExpanded={index === 0} />
          ))}
        </div>
      </section>

      <section className="panel p-5 md:p-6" data-testid="capacity-section">
        <h3 className="text-xl font-semibold text-ink">Capacity estimates</h3>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-paper p-5" data-testid="capacity-card">
            <p className="text-sm font-medium text-slate-500">Concurrent viewers</p>
            <p className="mt-3 whitespace-nowrap text-3xl font-semibold text-ink">{concurrentViewers ? formatNumber(concurrentViewers, 0) : "Pending"}</p>
            <div className="mt-4 border-t border-slate-200 pt-3 text-sm text-slate-600">
              <p className="font-medium text-ink">Base input</p>
              <p className="mt-1">Customer-provided estimate</p>
            </div>
          </div>

          <div className="rounded-3xl bg-paper p-5" data-testid="capacity-card">
            <p className="text-sm font-medium text-slate-500">Estimated bandwidth</p>
            <p className="mt-3 whitespace-nowrap text-3xl font-semibold text-ink">{formatNumber(recommendation.capacity.safety_adjusted_bandwidth_mbps)} Mbps</p>
            <div className="mt-4 border-t border-slate-200 pt-3 text-sm text-slate-600">
              <p className="font-medium text-ink">Base estimate</p>
              <p className="mt-1">{formatNumber(recommendation.capacity.base_bandwidth_mbps)} Mbps</p>
              <p className="mt-3 font-medium text-ink">Safety-adjusted</p>
              <p className="mt-1">{formatNumber(recommendation.capacity.safety_adjusted_bandwidth_mbps)} Mbps</p>
            </div>
          </div>

          <div className="rounded-3xl bg-paper p-5" data-testid="capacity-card">
            <p className="text-sm font-medium text-slate-500">Estimated archive storage</p>
            <p className="mt-3 whitespace-nowrap text-3xl font-semibold text-ink">{formatNumber(recommendation.capacity.safety_adjusted_archive_storage_tb)} TB</p>
            <div className="mt-4 border-t border-slate-200 pt-3 text-sm text-slate-600">
              <p className="font-medium text-ink">Base estimate</p>
              <p className="mt-1">{formatNumber(recommendation.capacity.estimated_archive_storage_tb)} TB</p>
              <p className="mt-3 font-medium text-ink">Safety-adjusted</p>
              <p className="mt-1">{formatNumber(recommendation.capacity.safety_adjusted_archive_storage_tb)} TB</p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-ink">Bandwidth assumptions</p>
          <p className="mt-2 text-sm text-slate-600">{recommendation.capacity.unicast_bandwidth_formula}</p>
          <p className="mt-3 text-sm text-slate-500">
            Preliminary sizing assumes unicast delivery for bandwidth planning until NetUP engineering confirms multicast or any architecture-specific optimization.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {recommendation.capacity.assumptions.map((item) => (
              <li key={item} className="rounded-2xl bg-paper px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-ink">Missing information</h3>
              <p className="mt-2 text-sm text-slate-600">These details would help refine the final engineering recommendation.</p>
            </div>
            <button
              type="button"
              onClick={onEditConfiguration}
              className="hidden min-h-11 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-ink transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 sm:inline-flex"
            >
              Edit configuration
            </button>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            {formatList(recommendation.missing_information, "No major gaps detected in the submitted profile.").map((item) => (
              <li key={item} className="rounded-2xl bg-paper px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onEditConfiguration}
            className="mt-4 inline-flex min-h-11 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-ink transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 sm:hidden"
          >
            Edit configuration
          </button>
        </div>

        <div className="panel p-5 md:p-6">
          <h3 className="text-xl font-semibold text-ink">Assumptions</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            {formatList(recommendation.assumptions, "No additional assumptions were noted.").map((item) => (
              <li key={item} className="rounded-2xl bg-paper px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="panel p-5 md:p-6">
        <h3 className="flex items-center gap-2 text-xl font-semibold text-ink">
          <span aria-hidden="true">!</span>
          <span>Engineering warnings</span>
        </h3>
        <ul className="mt-4 space-y-3 text-sm text-slate-700">
          {formatList(recommendation.warnings, "No engineering warnings were raised by the current rules.").map((item) => (
            <li key={item} className="rounded-2xl bg-amber-50 px-4 py-3">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
        <div className="panel p-5 md:p-6">
          <h3 className="text-xl font-semibold text-ink">Next steps</h3>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            <li className="rounded-2xl bg-paper px-4 py-3">Confirm any remaining customer inputs and review the warnings before handoff.</li>
            <li className="rounded-2xl bg-paper px-4 py-3">Save the lead when the opportunity is ready for follow-up or engineering review.</li>
            <li className="rounded-2xl bg-paper px-4 py-3">Use the preliminary report for customer discussion, internal review, or scope alignment.</li>
          </ul>
        </div>

        <section className="panel p-5 md:p-6 print:hidden" data-testid="actions-card">
          <h3 className="text-xl font-semibold text-ink">Actions</h3>
          <div className="mt-5 flex flex-col gap-3">
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
              Prepare report preview
            </button>
            <button
              type="button"
              onClick={() => void onDownloadPdf()}
              disabled={loadingAction}
              className="min-h-12 rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-ink transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 disabled:opacity-50"
            >
              Download PDF report
            </button>
            <button
              type="button"
              onClick={() => void onDownloadWord()}
              disabled={loadingAction}
              className="min-h-12 rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-ink transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 disabled:opacity-50"
            >
              Download Word report
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
      </section>

      {reportHtml ? (
        <section className="panel p-5 md:p-6 print:hidden" data-testid="report-preview">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-ink">Printable preliminary report</h3>
              <p className="mt-2 text-sm text-slate-600">Use the preview below to print or download the current presales summary in HTML, Word, or PDF format.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={reportHref}
                download="netup-preliminary-report.html"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-ink transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
              >
                Download HTML
              </a>
              <button
                type="button"
                onClick={() => void onDownloadPdf()}
                disabled={loadingAction}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-ink transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 disabled:opacity-50"
              >
                Download PDF
              </button>
              <button
                type="button"
                onClick={() => void onDownloadWord()}
                disabled={loadingAction}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-ink transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 disabled:opacity-50"
              >
                Download Word
              </button>
            </div>
          </div>
          <iframe title="Report Preview" className="mt-4 h-[480px] w-full rounded-2xl border border-slate-200 bg-white" srcDoc={reportHtml} />
        </section>
      ) : reportReady ? (
        <section className="panel p-5 md:p-6 print:hidden" data-testid="report-ready">
          <h3 className="text-xl font-semibold text-ink">Report ready for download</h3>
          <p className="mt-2 text-sm text-slate-600">The report has been generated. You can download it as Word or PDF from the actions panel above.</p>
        </section>
      ) : null}
    </div>
  );
}
