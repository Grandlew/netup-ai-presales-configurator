"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ResultsPanel } from "@/components/results-panel";
import { api } from "@/lib/api";
import { clearResultsPayload, getResultsPayload, type ResultsPayload, setHomeNavigationIntent } from "@/lib/flow-storage";
import { buildReferenceNumber, buildReportFileName } from "@/lib/recommendation-presentation";

type BannerState =
  | { kind: "success"; message: string }
  | { kind: "error"; message: string }
  | null;

export default function ResultsPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<ResultsPayload | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [reportHtml, setReportHtml] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [startOverOpen, setStartOverOpen] = useState(false);
  const [banner, setBanner] = useState<BannerState>(null);
  const [saveLeadSuccess, setSaveLeadSuccess] = useState(false);

  useEffect(() => {
    setPayload(getResultsPayload());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!saveLeadSuccess) return;
    const timeoutId = window.setTimeout(() => setSaveLeadSuccess(false), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [saveLeadSuccess]);

  if (!hydrated) {
    return (
      <main className="shell">
        <section className="panel mx-auto max-w-3xl p-6 md:p-7">
          <p className="text-sm uppercase tracking-[0.24em] text-blue">Loading results</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Preparing recommendation view</h1>
          <p className="mt-3 text-sm text-slate-600">Loading the saved recommendation details for this session.</p>
        </section>
      </main>
    );
  }

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
  const referenceNumber = buildReferenceNumber(resultsPayload.recommendation, resultsPayload.submittedValues);
  const reportFileName = buildReportFileName(referenceNumber);

  async function ensureLeadAndReport(successMessage: string, action: "review" | "save" | "report" = "report") {
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
      if (action === "save") {
        setSaveLeadSuccess(true);
      }
      return { ok: true, reportId: resolvedReportId };
    } catch (err) {
      setBanner({ kind: "error", message: err instanceof Error ? err.message : "We could not save the lead details." });
      return { ok: false, reportId: null };
    } finally {
      setLoadingAction(false);
    }
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
      link.download = `${reportFileName}.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      setBanner({ kind: "error", message: err instanceof Error ? err.message : "We could not download the report." });
      return false;
    }
  }

  async function handleCopyReport() {
    try {
      const lines = [
        "NetUP Preliminary Presales Recommendation",
        "",
        "Executive Summary",
        resultsPayload.recommendation.project_summary,
        "",
        "Detected Requirements",
        `Project type: ${resultsPayload.submittedValues.project_type ?? "Not specified"}`,
        `Scale: ${resultsPayload.submittedValues.subscribers_or_rooms ?? "Not specified"}`,
        `Channels: ${resultsPayload.submittedValues.number_of_channels ?? "Not specified"}`,
        `Delivery mode: ${resultsPayload.submittedValues.delivery_mode ?? "Not specified"}`,
        "",
        "Recommended NetUP Components",
        ...resultsPayload.recommendation.recommendations.map((item) => `- ${item.product}: ${item.reason}`),
        "",
        "Risks / Unknowns",
        ...resultsPayload.recommendation.assumptions,
        "",
        "Recommended Next Step",
        resultsPayload.recommendation.next_question ?? "Proceed to NetUP engineer review.",
      ].filter(Boolean);

      await navigator.clipboard.writeText(lines.join("\n"));
      setBanner({ kind: "success", message: "The report content was copied to the clipboard." });
      return true;
    } catch (err) {
      setBanner({ kind: "error", message: err instanceof Error ? err.message : "We could not copy the report." });
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
          reportFileName={reportFileName}
          onRequestEngineeringReview={() => ensureLeadAndReport("Engineering review has been requested and the lead was saved.", "review").then((result) => result.ok)}
          onSaveLead={() => ensureLeadAndReport("Lead saved successfully for follow-up.", "save").then((result) => result.ok)}
          onPrintReport={() => ensureLeadAndReport("The preliminary report is ready below for printing or download.", "report").then((result) => result.ok)}
          onCopyReport={handleCopyReport}
          onDownloadPdf={() => handleDownload("pdf")}
          onDownloadWord={() => handleDownload("doc")}
          onStartOver={() => setStartOverOpen(true)}
          onEditConfiguration={handleEditConfiguration}
          leadSaved={saveLeadSuccess || Boolean(leadId)}
          loadingAction={loadingAction}
        />
      </div>

      <footer className="mt-8 border-t border-slate-200 pt-6 text-center print:hidden">
        <p className="text-sm uppercase tracking-[0.28em] text-blue">NetUP AI Presales Configurator</p>
      </footer>

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
