"use client";

import { useId, useMemo, useState, type ReactNode } from "react";

import type { WizardFormValues } from "@/lib/schema";
import {
  buildProjectTitle,
  buildReferenceNumber,
  formatGeneratedDate,
  formatEnumLabel,
  formatNumber,
  formatRuleVersion,
  formatValue,
  getArchitectureStages,
  getArchitectureText,
  getMatchedConditions,
  getVisibleProductWarning,
  parseBandwidthFormula,
} from "@/lib/recommendation-presentation";
import type { Recommendation } from "@/lib/types";

function formatList(items: string[], emptyMessage: string) {
  return items.length ? items : [emptyMessage];
}

function DetailRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/78 px-4 py-3 shadow-[0_10px_30px_rgba(15,39,69,0.06)] backdrop-blur-sm">
      <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{formatValue(value)}</dd>
    </div>
  );
}

function StatusPill({ status }: { status: "detected" | "validated_rule" | "needs_engineer_review" }) {
  const labels = {
    detected: "Detected",
    validated_rule: "Validated rule",
    needs_engineer_review: "Needs engineer review",
  };

  const styles = {
    detected: "bg-blue-50 text-blue",
    validated_rule: "bg-emerald-50 text-emerald-700",
    needs_engineer_review: "bg-amber-50 text-amber-900",
  };

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${styles[status]}`}>{labels[status]}</span>;
}

function InfoTooltip({ label, content }: { label: string; content: string }) {
  const tooltipId = useId();

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-describedby={tooltipId}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-paper text-slate-500 transition hover:border-slate-300 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 10v5" />
          <path d="M12 7h.01" />
        </svg>
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute right-0 top-full z-20 mt-2 hidden w-72 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm leading-6 text-slate-700 shadow-[0_20px_40px_rgba(15,39,69,0.14)] group-hover:block group-focus-within:block"
      >
        {content}
      </span>
    </span>
  );
}

function SectionHeading({
  title,
  info,
}: {
  title: string;
  info?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h3 className="text-xl font-semibold text-ink">{title}</h3>
      {info ? <InfoTooltip label={`${title} information`} content={info} /> : null}
    </div>
  );
}

function ArchitectureArrow() {
  return (
    <div
      aria-hidden="true"
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-blue/20 bg-blue-50 text-2xl font-semibold text-blue shadow-[0_10px_24px_rgba(45,91,145,0.16)] print:h-8 print:w-8 print:text-base"
    >
      &rarr;
    </div>
  );
}

function LinkIcon() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-blue/20 bg-blue-50 text-blue"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L10.7 5.22" />
        <path d="M14 11a5 5 0 0 0-7.07 0L4.81 13.1a5 5 0 0 0 7.07 7.07L13.3 18.8" />
      </svg>
    </span>
  );
}

function ArchitectureDiagram({
  recommendation,
  submittedValues,
}: {
  recommendation: Recommendation;
  submittedValues?: WizardFormValues | null;
}) {
  const stages = useMemo(() => getArchitectureStages(recommendation, submittedValues), [recommendation, submittedValues]);

  if (!stages.length) {
    return null;
  }

  return (
    <section className="panel border-blue/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(237,244,251,0.95)_100%)] p-5 md:p-6 print:break-inside-avoid" data-testid="architecture-diagram">
      <SectionHeading
        title="Architecture Overview"
        info="This deterministic sequence uses only the selected requirements and recommended NetUP product families."
      />
      <p className="sr-only">Architecture sequence: {getArchitectureText(stages)}</p>
      <div className="mt-5 flex flex-wrap items-center gap-3 print:gap-2">
        {stages.map((stage, index) => (
          <div key={stage.id} className="contents">
            <div className="min-w-[160px] flex-1 rounded-3xl border border-white/80 bg-white/86 px-4 py-4 shadow-[0_12px_30px_rgba(15,39,69,0.08)] print:break-inside-avoid">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{stage.label}</p>
              <p className="mt-2 text-sm font-medium text-ink">{stage.items.join(", ")}</p>
            </div>
            {index < stages.length - 1 ? <ArchitectureArrow /> : null}
          </div>
        ))}
      </div>
    </section>
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
  const matchedConditions = useMemo(() => getMatchedConditions(item, submittedValues), [item, submittedValues]);
  const visibleWarning = getVisibleProductWarning(item);

  return (
    <article className="rounded-3xl border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,251,254,0.96)_100%)] p-5 shadow-[0_14px_36px_rgba(15,39,69,0.06)] print:break-inside-avoid">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">{item.category}</p>
          <h4 className="mt-1 text-xl font-semibold text-ink">{item.product}</h4>
          <p className="mt-3 text-sm leading-6 text-slate-700">{item.reason}</p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <span className="inline-flex items-center rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink">Preliminary recommendation</span>
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue">
            {formatEnumLabel(item.claim_status)}
          </span>
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue">
            {item.validation_status ?? "Requires NetUP validation"}
          </span>
        </div>
      </div>

      {visibleWarning ? (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-semibold">Project note:</span> {visibleWarning}
        </p>
      ) : null}

      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={detailId}
        onClick={() => setExpanded((current) => !current)}
        className="mt-4 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-ink transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 print:hidden"
      >
        {expanded ? "Hide why this was selected" : "Why this was selected"}
      </button>

      {expanded ? (
        <div id={detailId} className="mt-4 rounded-2xl border border-slate-200 bg-paper/60 px-4 py-4 text-sm text-slate-700">
          <p className="font-semibold text-ink">Why this was selected</p>
          <dl className="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)]">
            {matchedConditions.map((condition) => (
              <div key={`${item.product}-${condition.label}`} className="contents">
                <dt className="font-medium text-slate-500">{condition.label}</dt>
                <dd className="text-ink">{condition.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      <div className="mt-4 hidden rounded-2xl border border-slate-200 bg-paper/60 px-4 py-4 text-sm text-slate-700 print:block">
        <p className="font-semibold text-ink">Why this was selected</p>
        <dl className="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)]">
          {matchedConditions.map((condition) => (
            <div key={`print-${item.product}-${condition.label}`} className="contents">
              <dt className="font-medium text-slate-500">{condition.label}</dt>
              <dd className="text-ink">{condition.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}

export function ResultsPanel({
  recommendation,
  submittedValues,
  reportHtml,
  reportReady,
  reportFileName,
  onRequestEngineeringReview,
  onSaveLead,
  onPrintReport,
  onCopyReport,
  onDownloadPdf,
  onDownloadWord,
  onStartOver,
  onEditConfiguration,
  leadSaved,
  loadingAction,
  followUpEditor,
}: {
  recommendation: Recommendation;
  submittedValues?: WizardFormValues | null;
  reportHtml?: string | null;
  reportReady: boolean;
  reportFileName: string;
  onRequestEngineeringReview: () => void | Promise<boolean>;
  onSaveLead: () => void | Promise<boolean>;
  onPrintReport: () => void | Promise<boolean>;
  onCopyReport: () => void | Promise<boolean>;
  onDownloadPdf: () => void | Promise<boolean>;
  onDownloadWord: () => void | Promise<boolean>;
  onStartOver: () => void;
  onEditConfiguration: () => void;
  leadSaved: boolean;
  loadingAction: boolean;
  followUpEditor?: ReactNode;
}) {
  const reportHref = reportHtml ? `data:text/html;charset=utf-8,${encodeURIComponent(reportHtml)}` : undefined;
  const generatedDate = useMemo(() => formatGeneratedDate(), []);
  const referenceNumber = useMemo(() => buildReferenceNumber(recommendation, submittedValues), [recommendation, submittedValues]);
  const projectTitle = useMemo(() => buildProjectTitle(submittedValues, recommendation), [recommendation, submittedValues]);
  const concurrentViewers = recommendation.capacity.assumed_concurrent_viewers;
  const archiveRequired = Boolean(submittedValues?.archive_days && submittedValues.archive_days > 0);
  const formulaLines = useMemo(
    () => parseBandwidthFormula(recommendation.capacity.unicast_bandwidth_formula, recommendation.capacity.safety_adjusted_bandwidth_mbps),
    [recommendation.capacity.safety_adjusted_bandwidth_mbps, recommendation.capacity.unicast_bandwidth_formula],
  );
  const detailedMissingInformation = recommendation.missing_information_items ?? [];
  const claimStatements = recommendation.claim_statements ?? [];
  const officialReferences = recommendation.official_references ?? [];
  const alternativeArchitectures = recommendation.alternative_architectures ?? [];
  const missingInformation = recommendation.missing_information.length ? recommendation.missing_information : ["No major gaps detected in the submitted project profile."];

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-6 print:max-w-none">
      <section className="panel overflow-hidden border-blue/20 bg-[radial-gradient(circle_at_top_left,rgba(45,91,145,0.16),transparent_24%),linear-gradient(135deg,rgba(250,252,255,0.96)_0%,rgba(235,243,251,0.96)_58%,rgba(255,255,255,0.96)_100%)] p-5 md:p-7 print:break-inside-avoid">
        <SectionHeading
          title="Executive Summary"
          info="This preliminary recommendation summarizes the current NetUP fit, estimated capacity, and the follow-up items needed before engineering validation."
        />
        <div className="mt-5 flex flex-col gap-6">
          <div className="text-center">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <p className="text-sm uppercase tracking-[0.24em] text-blue">Preliminary solution recommendation</p>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue">
                Preliminary
              </span>
            </div>
            <h2 className="mx-auto mt-3 max-w-4xl text-2xl font-semibold text-ink md:text-3xl">{projectTitle}</h2>
          </div>

          <dl className="grid gap-3 rounded-3xl border border-white/80 bg-white/76 p-4 text-sm text-slate-700 shadow-[0_12px_30px_rgba(15,39,69,0.06)] sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Generated date</dt>
              <dd className="mt-1 font-medium text-ink">{generatedDate}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Reference number</dt>
              <dd className="mt-1 font-medium text-ink">{referenceNumber}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Recommendation rules version</dt>
              <dd className="mt-1 font-medium text-ink">{formatRuleVersion(recommendation.rule_version)}</dd>
            </div>
          </dl>

          <div>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-xl font-semibold text-ink">Detected Requirements</h3>
              <StatusPill status="detected" />
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <DetailRow label="Project type" value={submittedValues?.project_type} />
            <DetailRow label="Country" value={submittedValues?.country} />
            <DetailRow label="Rooms or endpoints" value={submittedValues?.subscribers_or_rooms} />
            <DetailRow label="Channels" value={submittedValues?.number_of_channels} />
            <DetailRow label="Delivery mode" value={submittedValues?.delivery_mode} />
            <DetailRow label="Selected services" value={submittedValues?.services} />
            <DetailRow label="Selected devices" value={submittedValues?.viewer_devices} />
            <DetailRow label="Signal sources" value={submittedValues?.signal_sources} />
            </div>
          </div>
        </div>
      </section>

      <ArchitectureDiagram recommendation={recommendation} submittedValues={submittedValues} />

      <section className="panel border-blue/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,251,254,0.96)_100%)] p-5 md:p-6">
        <SectionHeading
          title="Recommended NetUP Components"
          info="Each product is tagged with a confidence status so inferred or conditional conclusions are not presented as confirmed facts."
        />
        <div className="mt-5 grid gap-4">
          {recommendation.recommendations.map((item, index) => (
            <ProductCard key={`${item.category}-${item.product}`} item={item} submittedValues={submittedValues} defaultExpanded={index === 0} />
          ))}
        </div>
      </section>

      <section className="panel border-amber-100 bg-[linear-gradient(180deg,rgba(255,252,246,0.96)_0%,rgba(246,250,255,0.96)_100%)] p-5 md:p-6 print:break-inside-avoid" data-testid="capacity-section">
        <h3 className="text-xl font-semibold text-ink">Capacity Assumptions</h3>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/80 bg-white/78 p-5 shadow-[0_12px_30px_rgba(15,39,69,0.06)]" data-testid="capacity-card">
            <p className="text-sm font-medium text-slate-500">Concurrent viewers</p>
            <p className="mt-3 whitespace-nowrap text-3xl font-semibold text-ink">{formatNumber(concurrentViewers, 0)}</p>
            <div className="mt-4 border-t border-slate-200 pt-3 text-sm text-slate-600">
              <p className="font-medium text-ink">{submittedValues?.expected_concurrent_viewers ? "Customer-provided value" : "Estimated default"}</p>
              <p className="mt-1">{submittedValues?.expected_concurrent_viewers ? "Provided directly in the project profile." : "Estimated from project scale for preliminary sizing."}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/80 bg-white/78 p-5 shadow-[0_12px_30px_rgba(15,39,69,0.06)]" data-testid="capacity-card">
            <p className="text-sm font-medium text-slate-500">Estimated OTT viewer egress</p>
            <p className="mt-3 whitespace-nowrap text-3xl font-semibold text-ink">{formatNumber(recommendation.capacity.safety_adjusted_bandwidth_mbps)} Mbps</p>
            <div className="mt-4 border-t border-slate-200 pt-3 text-sm text-slate-600">
              <p className="font-medium text-ink">Base estimate</p>
              <p className="mt-1">{formatNumber(recommendation.capacity.base_bandwidth_mbps)} Mbps</p>
              <p className="mt-3 font-medium text-ink">Safety-adjusted</p>
              <p className="mt-1">{formatNumber(recommendation.capacity.safety_adjusted_bandwidth_mbps)} Mbps</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/80 bg-white/78 p-5 shadow-[0_12px_30px_rgba(15,39,69,0.06)]" data-testid="capacity-card">
            <p className="text-sm font-medium text-slate-500">Estimated archive storage</p>
            <p className="mt-3 whitespace-nowrap text-3xl font-semibold text-ink">
              {recommendation.capacity.storage_status === "unknown"
                ? "Pending input"
                : archiveRequired
                  ? `${formatNumber(recommendation.capacity.safety_adjusted_archive_storage_tb)} TB`
                  : "Not required"}
            </p>
            <div className="mt-4 border-t border-slate-200 pt-3 text-sm text-slate-600">
              {recommendation.capacity.storage_status === "unknown" ? (
                <p className="mt-1">{recommendation.capacity.storage_status_message}</p>
              ) : (
                <>
                  <p className="font-medium text-ink">Base estimate</p>
                  <p className="mt-1">{formatNumber(recommendation.capacity.estimated_archive_storage_tb)} TB</p>
                  <p className="mt-3 font-medium text-ink">Safety-adjusted</p>
                  <p className="mt-1">{formatNumber(recommendation.capacity.safety_adjusted_archive_storage_tb)} TB</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-white/80 bg-white/78 p-5 shadow-[0_12px_30px_rgba(15,39,69,0.06)] print:break-inside-avoid">
          <p className="text-sm font-semibold text-ink">Formula and assumptions</p>
          <ol className="mt-4 space-y-2 text-sm text-slate-700">
            {formulaLines.map((line) => (
              <li key={line} className="rounded-2xl bg-paper px-4 py-3">
                {line}
              </li>
            ))}
          </ol>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li className="rounded-2xl bg-paper px-4 py-3">OTT unicast capacity scales with concurrent viewers.</li>
            <li className="rounded-2xl bg-paper px-4 py-3">LAN multicast may use substantially less access bandwidth than unicast delivery.</li>
            <li className="rounded-2xl bg-paper px-4 py-3">Multiple adaptive-bitrate renditions may increase origin, processing, and storage requirements.</li>
            <li className="rounded-2xl bg-paper px-4 py-3">All capacity estimates remain preliminary pending NetUP engineering validation.</li>
          </ul>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-paper px-4 py-3 text-sm text-slate-700">
              <p className="font-medium text-ink">Source ingest bandwidth</p>
              <p className="mt-1">{formatNumber(recommendation.capacity.source_ingest_bandwidth_mbps ?? 0)} Mbps</p>
            </div>
            <div className="rounded-2xl bg-paper px-4 py-3 text-sm text-slate-700">
              <p className="font-medium text-ink">Per active viewer</p>
              <p className="mt-1">{formatNumber(recommendation.capacity.per_viewer_bandwidth_mbps)} Mbps</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="panel border-blue/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(244,249,255,0.96)_100%)] p-5 md:p-6 print:break-inside-avoid">
          <h3 className="text-xl font-semibold text-ink">Risks / Unknowns</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            {formatList(recommendation.assumptions, "No additional assumptions were noted.").map((item) => (
              <li key={item} className="rounded-2xl bg-paper px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="panel border-amber-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(255,249,240,0.96)_100%)] p-5 md:p-6 print:break-inside-avoid">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SectionHeading
                title="Questions for NetUP Engineer"
                info="Only recommendation, capacity, or implementation inputs that materially affect the design are listed here."
              />
            </div>
            {recommendation.missing_information.length ? (
              <button
                type="button"
                onClick={onEditConfiguration}
                className="hidden min-h-11 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-ink transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 sm:inline-flex print:hidden"
              >
                Edit configuration
              </button>
            ) : null}
          </div>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            {detailedMissingInformation.length
              ? detailedMissingInformation.map((item) => (
                  <li key={item.code} className="rounded-2xl bg-paper px-4 py-3">
                    <p className="font-medium text-ink">{item.label}</p>
                    <p className="mt-1 text-slate-600">{item.reason}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue">{formatEnumLabel(item.category)}</p>
                  </li>
                ))
              : missingInformation.map((item) => (
                  <li key={item} className="rounded-2xl bg-paper px-4 py-3">
                    {item}
                  </li>
                ))}
          </ul>
          {recommendation.missing_information.length ? (
            <button
              type="button"
              onClick={onEditConfiguration}
              className="mt-4 inline-flex min-h-11 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-ink transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 sm:hidden print:hidden"
            >
              Edit configuration
            </button>
          ) : null}
        </div>
      </section>

      <section className="panel border-amber-200 bg-[linear-gradient(180deg,rgba(255,251,242,0.96)_0%,rgba(255,255,255,0.96)_100%)] p-5 md:p-6 print:break-inside-avoid">
        <h3 className="flex items-center gap-2 text-xl font-semibold text-ink">
          <span aria-hidden="true">!</span>
          <span>Additional Engineer Warnings</span>
        </h3>
        <ul className="mt-4 space-y-3 text-sm text-slate-700">
          {formatList(recommendation.warnings, "No engineering warnings were raised by the current rules.").map((item) => (
            <li key={item} className="rounded-2xl bg-amber-50 px-4 py-3">
              {item}
            </li>
          ))}
        </ul>
      </section>

      {claimStatements.length ? (
        <section className="panel border-blue/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(245,249,255,0.96)_100%)] p-5 md:p-6 print:break-inside-avoid">
          <h3 className="text-xl font-semibold text-ink">Validation Status</h3>
          <div className="mt-4 grid gap-3">
            {claimStatements.map((statement) => (
              <div key={statement.claim} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink">{formatEnumLabel(statement.status)}</span>
                  <p className="text-sm font-medium text-ink">{statement.claim}</p>
                </div>
                {statement.notes ? <p className="mt-2 text-sm text-slate-600">{statement.notes}</p> : null}
                {statement.conditions.length ? <p className="mt-2 text-sm text-slate-600">Conditions: {statement.conditions.join(", ")}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {alternativeArchitectures.length ? (
        <section className="panel border-blue/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(244,249,255,0.96)_100%)] p-5 md:p-6 print:break-inside-avoid">
          <h3 className="text-xl font-semibold text-ink">Alternative architecture</h3>
          <div className="mt-4 grid gap-4">
            {alternativeArchitectures.map((option) => (
              <div key={option.name} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink">{formatEnumLabel(option.status)}</span>
                  <p className="text-sm font-medium text-ink">{option.name}</p>
                </div>
                <p className="mt-2 text-sm text-slate-600">{option.reason}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {officialReferences.length ? (
        <section className="panel border-blue/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(244,249,255,0.96)_100%)] p-5 md:p-6 print:break-inside-avoid">
          <h3 className="text-xl font-semibold text-ink">Official NetUP references</h3>
          <div className="mt-4 grid gap-3">
            {officialReferences.map((reference) => (
              <a
                key={reference.id}
                href={reference.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700 transition hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
              >
                <LinkIcon />
                <div className="min-w-0">
                  <p className="font-medium text-ink">{reference.title}</p>
                  <p className="mt-1 leading-6 text-slate-600">{reference.extracted_capability}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.7fr)]">
        <div className="panel border-blue/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(244,249,255,0.96)_100%)] p-5 md:p-6 print:break-inside-avoid">
          <h3 className="text-xl font-semibold text-ink">Recommended Next Step</h3>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            <li className="rounded-2xl bg-paper px-4 py-3">1. Review the preliminary recommendation.</li>
            <li className="rounded-2xl bg-paper px-4 py-3">2. Confirm unresolved technical and commercial requirements.</li>
            <li className="rounded-2xl bg-paper px-4 py-3">3. Submit the project for NetUP engineering validation.</li>
            <li className="rounded-2xl bg-paper px-4 py-3">4. Receive the final architecture, licensing scope, and quotation.</li>
          </ol>
          {recommendation.next_question ? (
            <div className="mt-4 rounded-2xl border border-blue/20 bg-blue-50 px-4 py-3 text-sm text-slate-700">
              <p className="font-medium text-ink">Highest-priority follow-up question</p>
              {followUpEditor ?? <p className="mt-1">{recommendation.next_question}</p>}
            </div>
          ) : null}
        </div>

        <section className="panel border-ink/10 bg-[linear-gradient(160deg,rgba(15,39,69,0.98)_0%,rgba(31,71,117,0.96)_100%)] p-5 text-white print:hidden" data-testid="actions-card">
          <h3 className="text-xl font-semibold text-white">Actions</h3>
          <div className="mt-5 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => void onDownloadPdf()}
              disabled={loadingAction}
              className="min-h-12 rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 disabled:opacity-50"
            >
              Download PDF
            </button>
            <button
              type="button"
              onClick={() => void onCopyReport()}
              disabled={loadingAction}
              className="min-h-12 rounded-full border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/45 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 disabled:opacity-50"
            >
              Copy Report
            </button>
            <button
              type="button"
              onClick={onStartOver}
              className="min-h-12 rounded-full border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/45 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 disabled:opacity-50"
            >
              Start New Configuration
            </button>
            <button
              type="button"
              disabled
              title="Engineer handoff integration not configured yet."
              className="min-h-12 rounded-full border border-white/25 px-5 py-3 text-sm font-semibold text-white/70 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed"
            >
              Send to NetUP Engineer
            </button>
          </div>
        </section>
      </section>

      {reportHtml ? (
        <section className="panel border-blue/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(244,249,255,0.96)_100%)] p-5 md:p-6 print:hidden" data-testid="report-preview">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <SectionHeading
                title="Printable report preview"
                info="The customer-facing report includes the architecture, recommendations, capacity estimates, warnings, and disclaimer footer."
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={reportHref}
                download={`${reportFileName}.html`}
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
          <iframe title="Report Preview" className="mt-4 h-[520px] w-full rounded-2xl border border-slate-200 bg-white" srcDoc={reportHtml} />
        </section>
      ) : reportReady ? (
        <section className="panel border-blue/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(244,249,255,0.96)_100%)] p-5 md:p-6 print:hidden" data-testid="report-ready">
          <SectionHeading
            title="Report ready for download"
            info="The latest printable report is ready. Use the download options once the preview is opened."
          />
        </section>
      ) : null}
    </div>
  );
}
