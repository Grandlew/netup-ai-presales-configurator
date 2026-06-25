"use client";

import type { Recommendation } from "@/lib/types";

export function ResultsPanel({ recommendation, reportHtml }: { recommendation: Recommendation; reportHtml?: string | null }) {
  const reportHref = reportHtml ? `data:text/html;charset=utf-8,${encodeURIComponent(reportHtml)}` : undefined;
  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-blue">Preliminary NetUP Recommendation</p>
        <h3 className="mt-2 text-3xl font-semibold text-ink">{recommendation.project_summary}</h3>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-paper p-4">
            <p className="text-sm text-slate-500">Safety-adjusted bandwidth</p>
            <p className="text-3xl font-semibold text-ink">{recommendation.capacity.safety_adjusted_bandwidth_mbps} Mbps</p>
          </div>
          <div className="rounded-2xl bg-paper p-4">
            <p className="text-sm text-slate-500">Safety-adjusted archive storage</p>
            <p className="text-3xl font-semibold text-ink">{recommendation.capacity.safety_adjusted_archive_storage_tb} TB</p>
          </div>
        </div>
      </section>

      <section className="panel p-6">
        <h4 className="text-xl font-semibold text-ink">Recommended product families</h4>
        <div className="mt-4 grid gap-4">
          {recommendation.recommendations.map((item) => (
            <article key={`${item.category}-${item.product}`} className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-blue">{item.category}</p>
              <h5 className="mt-1 text-xl font-semibold text-ink">{item.product}</h5>
              <p className="mt-2 text-sm text-slate-600">{item.reason}</p>
              {item.warning ? <p className="mt-2 text-xs text-slate-500">{item.warning}</p> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="panel p-6 lg:col-span-2">
          <h4 className="text-xl font-semibold text-ink">Assumptions and warnings</h4>
          <p className="mt-3 text-sm text-slate-500">{recommendation.capacity.unicast_bandwidth_formula}</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {recommendation.assumptions.map((item) => (
              <li key={item}>{item}</li>
            ))}
            {recommendation.warnings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="panel p-6">
          <h4 className="text-xl font-semibold text-ink">Missing information</h4>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {(recommendation.missing_information.length ? recommendation.missing_information : ["No major gaps detected in the submitted profile."]).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      {reportHtml ? (
        <section className="panel p-6">
          <div className="flex items-center justify-between gap-4">
            <h4 className="text-xl font-semibold text-ink">Printable preliminary report</h4>
            <a
              href={reportHref}
              download="netup-preliminary-report.html"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-ink"
            >
              Download report
            </a>
          </div>
          <iframe title="Report Preview" className="mt-4 h-[480px] w-full rounded-2xl border border-slate-200" srcDoc={reportHtml} />
        </section>
      ) : null}
    </div>
  );
}
