"use client";

import { useEffect, useMemo, useState } from "react";

import type { ConfigOptionsResponse, ExtractResponse } from "@/lib/types";

const ENUM_LABELS: Record<string, string> = {
  both: "Local network and Internet / OTT",
  catchup_tv: "Catch-up TV",
  internet_ott: "Internet / OTT",
  ip_streams: "Existing IP streams",
  live_tv: "Live TV",
  local_network: "Local network",
  mobile: "Mobile",
  set_top_box: "Set-top box",
  smart_tv: "Smart TV",
  video_on_demand: "Video on demand",
};

const FIELD_LABELS: Record<string, string> = {
  additional_project_notes: "Additional notes",
  company_name: "Company name",
  country: "Country",
  delivery_mode: "Delivery mode",
  number_of_channels: "Number of channels",
  project_type: "Project type",
  services: "Required services",
  signal_sources: "Signal sources",
  subscribers_or_rooms: "Rooms or subscribers",
  viewer_devices: "Viewer devices",
};

const REQUIRED_REVIEW_FIELDS = [
  "project_type",
  "subscribers_or_rooms",
  "number_of_channels",
  "signal_sources",
  "services",
  "viewer_devices",
  "delivery_mode",
] as const;

const OPTIONAL_REVIEW_FIELDS = ["country", "company_name", "additional_project_notes"] as const;

type ReviewFieldKey = (typeof REQUIRED_REVIEW_FIELDS)[number] | (typeof OPTIONAL_REVIEW_FIELDS)[number];
type ReviewValues = Record<string, unknown>;

function humanize(value: string) {
  if (ENUM_LABELS[value]) return ENUM_LABELS[value];
  if (FIELD_LABELS[value]) return FIELD_LABELS[value];
  return value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function formatValue(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => humanize(String(item))).join(", ");
  if (typeof value === "number") return new Intl.NumberFormat("en-US").format(value);
  if (typeof value === "string") return humanize(value);
  return "Not provided";
}

function createInitialValues(extracted: ReviewValues, originalMessage: string) {
  return {
    project_type: extracted.project_type ?? "",
    subscribers_or_rooms: extracted.subscribers_or_rooms ?? "",
    number_of_channels: extracted.number_of_channels ?? "",
    signal_sources: Array.isArray(extracted.signal_sources) ? extracted.signal_sources : [],
    services: Array.isArray(extracted.services) ? extracted.services : [],
    viewer_devices: Array.isArray(extracted.viewer_devices) ? extracted.viewer_devices : [],
    delivery_mode: extracted.delivery_mode ?? "",
    country: extracted.country ?? "",
    company_name: extracted.company_name ?? "",
    additional_project_notes:
      typeof extracted.additional_project_notes === "string" && extracted.additional_project_notes.trim()
        ? extracted.additional_project_notes
        : `Customer request: ${originalMessage}`,
  };
}

function getOptionsForField(fieldKey: ReviewFieldKey, options: ConfigOptionsResponse) {
  switch (fieldKey) {
    case "project_type":
      return options.project_types;
    case "delivery_mode":
      return options.delivery_modes;
    case "signal_sources":
      return options.signal_sources;
    case "services":
      return options.services;
    case "viewer_devices":
      return options.viewer_devices;
    default:
      return [];
  }
}

export function ConversationReview({
  options,
  response,
  originalMessage,
  onBackToIntake,
  onUseGuidedConfigurator,
}: {
  options: ConfigOptionsResponse;
  response: ExtractResponse;
  originalMessage: string;
  onBackToIntake: () => void;
  onUseGuidedConfigurator: (seedValues: Record<string, unknown>, targetStep?: number) => void;
}) {
  const [formValues, setFormValues] = useState<ReviewValues>(() => createInitialValues(response.extracted_requirements ?? {}, originalMessage));

  useEffect(() => {
    setFormValues(createInitialValues(response.extracted_requirements ?? {}, originalMessage));
  }, [response, originalMessage]);

  const remainingRequiredFields = useMemo(
    () => REQUIRED_REVIEW_FIELDS.filter((field) => !hasValue(formValues[field])),
    [formValues],
  );

  const extractedSummary = useMemo(
    () =>
      REQUIRED_REVIEW_FIELDS.filter((field) => hasValue(formValues[field])).map((field) => ({
        field,
        value: formValues[field],
      })),
    [formValues],
  );

  const canShortcutToRecommendation = remainingRequiredFields.length === 0;

  const updateArrayField = (fieldKey: ReviewFieldKey, optionValue: string, checked: boolean) => {
    const current = Array.isArray(formValues[fieldKey]) ? (formValues[fieldKey] as string[]) : [];
    const next = checked ? [...current, optionValue] : current.filter((item) => item !== optionValue);
    setFormValues((previous) => ({ ...previous, [fieldKey]: next }));
  };

  return (
    <div className="mx-auto max-w-[1080px] space-y-6">
      <section className="panel p-6 md:p-7">
        <p className="text-sm uppercase tracking-[0.24em] text-blue">Natural-language intake</p>
        <h2 className="mt-2 text-[1.9rem] font-semibold text-ink md:text-[2.3rem]">Customer confirmation</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-600">
          Review the extracted project details below, adjust anything that needs correction, and complete the remaining required fields before continuing.
        </p>
      </section>

      <section className="panel p-6 md:p-7">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-ink">Extracted project summary</h3>
            <p className="mt-2 text-sm text-slate-600">This is the current project picture assembled from the customer’s description.</p>
          </div>
          <div className="rounded-2xl bg-paper px-4 py-3 text-sm text-slate-700">
            <p className="font-medium text-ink">Follow-up prompt</p>
            <p className="mt-1">{response.next_question ?? "Review and confirm the extracted details below."}</p>
          </div>
        </div>

        <dl className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {extractedSummary.map(({ field, value }) => (
            <div key={field} className="rounded-3xl border border-slate-200 bg-white px-5 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{humanize(field)}</dt>
              <dd className="mt-2 text-base text-ink">{formatValue(value)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="panel p-6 md:p-7">
        <div className="flex flex-col gap-3">
          <h3 className="text-lg font-semibold text-ink">Customer confirmation form</h3>
          <p className="text-sm text-slate-600">
            Edit the extracted values directly here. Any required field left blank will stay in the guided configurator for follow-up.
          </p>
        </div>

        {remainingRequiredFields.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {remainingRequiredFields.map((field) => (
              <span key={field} className="rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-900 ring-1 ring-amber-200">
                {humanize(field)}
              </span>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-blue/20 bg-blue-50 px-4 py-3 text-sm text-slate-700">
            All required intake fields are complete. You can jump ahead to the next guided step and continue toward recommendation.
          </div>
        )}

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5">
            <h4 className="text-base font-semibold text-ink">Project basics</h4>

            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-medium text-ink">{humanize("project_type")}</span>
              <select
                value={String(formValues.project_type ?? "")}
                onChange={(event) => setFormValues((previous) => ({ ...previous, project_type: event.target.value }))}
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
              >
                <option value="">Select</option>
                {options.project_types.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-medium text-ink">{humanize("subscribers_or_rooms")}</span>
              <input
                type="number"
                min={1}
                value={String(formValues.subscribers_or_rooms ?? "")}
                onChange={(event) => setFormValues((previous) => ({ ...previous, subscribers_or_rooms: event.target.value ? Number(event.target.value) : "" }))}
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-medium text-ink">{humanize("number_of_channels")}</span>
              <input
                type="number"
                min={1}
                value={String(formValues.number_of_channels ?? "")}
                onChange={(event) => setFormValues((previous) => ({ ...previous, number_of_channels: event.target.value ? Number(event.target.value) : "" }))}
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-medium text-ink">{humanize("country")}</span>
              <input
                type="text"
                value={String(formValues.country ?? "")}
                onChange={(event) => setFormValues((previous) => ({ ...previous, country: event.target.value }))}
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-medium text-ink">{humanize("company_name")}</span>
              <input
                type="text"
                value={String(formValues.company_name ?? "")}
                onChange={(event) => setFormValues((previous) => ({ ...previous, company_name: event.target.value }))}
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
              />
            </label>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5">
            <h4 className="text-base font-semibold text-ink">Service and delivery</h4>

            {(["signal_sources", "services", "viewer_devices"] as const).map((fieldKey) => (
              <fieldset key={fieldKey} className="space-y-3">
                <legend className="text-sm font-medium text-ink">{humanize(fieldKey)}</legend>
                <div className="grid gap-2">
                  {getOptionsForField(fieldKey, options).map((option) => {
                    const selected = Array.isArray(formValues[fieldKey]) ? (formValues[fieldKey] as string[]).includes(option.value) : false;
                    return (
                      <label key={option.value} className="flex min-h-11 items-start gap-3 rounded-2xl border border-slate-200 bg-paper px-4 py-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(event) => updateArrayField(fieldKey, option.value, event.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue focus:ring-blue"
                        />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}

            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-medium text-ink">{humanize("delivery_mode")}</span>
              <select
                value={String(formValues.delivery_mode ?? "")}
                onChange={(event) => setFormValues((previous) => ({ ...previous, delivery_mode: event.target.value }))}
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
              >
                <option value="">Select</option>
                {options.delivery_modes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
          <label className="space-y-2 text-sm text-slate-700">
            <span className="font-medium text-ink">{humanize("additional_project_notes")}</span>
            <textarea
              value={String(formValues.additional_project_notes ?? "")}
              onChange={(event) => setFormValues((previous) => ({ ...previous, additional_project_notes: event.target.value }))}
              className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
            />
          </label>
        </div>
      </section>

      <section className="panel p-6 md:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => onUseGuidedConfigurator(formValues)}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
          >
            Open guided configurator
          </button>

          {canShortcutToRecommendation ? (
            <button
              type="button"
              onClick={() => onUseGuidedConfigurator(formValues, 4)}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-ink transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
            >
              Continue to recommendation
            </button>
          ) : null}

          <button
            type="button"
            onClick={onBackToIntake}
            className="min-h-12 rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-ink transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
          >
            Edit original description
          </button>
        </div>
      </section>
    </div>
  );
}
