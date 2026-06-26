"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ResultsPanel } from "@/components/results-panel";
import { api } from "@/lib/api";
import { clearResultsPayload, getResultsPayload, setHomeNavigationIntent } from "@/lib/flow-storage";

type BannerState =
  | { kind: "success"; message: string }
  | { kind: "error"; message: string }
  | null;

export default function ResultsPage() {
  const router = useRouter();
  const payload = getResultsPayload();
  const [reportHtml, setReportHtml] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [startOverOpen, setStartOverOpen] = useState(false);
  const [banner, setBanner] = useState<BannerState>(null);

  if (!payload) {
    return (
      <main className="shell">
        <section className="panel mx-auto max-w-3xl p-6 md:p-7">
          <p className="text-sm uppercase tracking-[0.24em] text-blue">Results unavailable</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">No recommendation is available</h1>
          <p className="mt-3 text-sm text-slate-600">Return to the configurator and generate a preliminary recommendation to view this page.</p>
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

  const resultsPayload = payload;

  async function ensureLeadAndReport(successMessage: string) {
    setLoadingAction(true);
    setBanner(null);

    try {
      const resolvedLeadId =
        leadId ??
        (
          await api.createLead({
            contact_name: resultsPayload.submittedValues.contact_name,
            email: resultsPayload.submittedValues.email,
            company: resultsPayload.submittedValues.company,
            phone: resultsPayload.submittedValues.phone,
            country: resultsPayload.submittedValues.country,
            project_type: resultsPayload.submittedValues.project_type,
            requirements: resultsPayload.submittedValues,
            recommendation: resultsPayload.recommendation,
            source: "wizard",
            consent_given: resultsPayload.submittedValues.consent_given,
          })
        ).id;

      if (!leadId) {
        setLeadId(resolvedLeadId);
      }

      let resolvedReportId = reportId;

      if (!reportHtml || !resolvedReportId) {
        const report = await api.createReport({
          lead_id: resolvedLeadId,
          requirements: resultsPayload.submittedValues,
          recommendation: resultsPayload.recommendation,
        });
        setReportHtml(report.generated_content);
        resolvedReportId = report.id;
        setReportId(report.id);
      }

      setBanner({ kind: "success", message: successMessage });
      return { ok: true, reportId: resolvedReportId };
    } catch (err) {
      setBanner({ kind: "error", message: err instanceof Error ? err.message : "We could not save the lead details." });
      return { ok: false, reportId: null };
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleReportAction(successMessage: string) {
    const result = await ensureLeadAndReport(successMessage);
    return result.ok;
  }

  async function handleDownload(format: "pdf" | "doc") {
    const result = await ensureLeadAndReport(
      format === "pdf"
        ? "The PDF report is being prepared for download."
        : "The Word report is being prepared for download.",
    );
    if (!result.ok || !result.reportId) return false;

    try {
      const blob = await api.downloadReport(result.reportId, format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `netup-preliminary-report.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      setBanner({ kind: "error", message: err instanceof Error ? err.message : "We could not download the report." });
      return false;
    }
  }

  function handleEditConfiguration() {
    setHomeNavigationIntent({
      entryMode: "guided",
      seedValues: resultsPayload.submittedValues,
      seedStartStep: 5,
    });
    router.push("/");
  }

  function handleStartOverConfirm() {
    clearResultsPayload();
    setHomeNavigationIntent({ entryMode: "conversation" });
    router.push("/");
  }

  return (
    <main className="shell">
      <div className="space-y-5">
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleEditConfiguration}
            className="min-h-11 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-ink transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
          >
            Back to configurator
          </button>
          <p className="text-sm uppercase tracking-[0.28em] text-blue">NetUP AI Presales Configurator</p>
        </div>

        {banner ? (
          <div
            className={banner.kind === "success" ? "panel border-blue/30 bg-blue-50 px-5 py-4 text-sm text-ink" : "panel border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"}
            aria-live="polite"
          >
            {banner.message}
          </div>
        ) : null}

        <ResultsPanel
          recommendation={resultsPayload.recommendation}
          submittedValues={resultsPayload.submittedValues}
          reportHtml={reportHtml}
          reportReady={Boolean(reportId)}
          onRequestEngineeringReview={() => handleReportAction("Engineering review has been requested and the lead was saved.")}
          onSaveLead={() => handleReportAction("Lead saved successfully for follow-up.")}
          onPrintReport={() => handleReportAction("The preliminary report is ready below for printing or download.")}
          onDownloadPdf={() => handleDownload("pdf")}
          onDownloadWord={() => handleDownload("doc")}
          onStartOver={() => setStartOverOpen(true)}
          onEditConfiguration={handleEditConfiguration}
          leadSaved={Boolean(leadId)}
          loadingAction={loadingAction}
        />
      </div>

      {startOverOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 px-4">
          <div role="dialog" aria-modal="true" aria-labelledby="start-over-title" className="panel w-full max-w-md p-6">
            <h3 id="start-over-title" className="text-xl font-semibold text-ink">
              Start over?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              This clears the current wizard inputs, recommendation results, and conversation context for a fresh presales walkthrough.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setStartOverOpen(false)}
                className="min-h-12 rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-ink transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartOverConfirm}
                className="min-h-12 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
              >
                Confirm start over
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
