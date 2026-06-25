"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { ResultsPanel } from "@/components/results-panel";
import { api } from "@/lib/api";
import { wizardSchema, type WizardFormValues } from "@/lib/schema";
import type { ConfigOptionsResponse, Recommendation } from "@/lib/types";

const steps = [
  "Project profile",
  "Content sources",
  "Required services",
  "Devices and delivery",
  "Capacity and reliability",
  "Contact details",
  "Results",
];

function labelForAudience(projectType: string | undefined) {
  if (projectType === "hotel") return "Number of rooms";
  if (projectType === "hospital") return "Number of rooms or screens";
  if (projectType === "large_operator" || projectType === "small_provider" || projectType === "cable_operator") {
    return "Number of subscribers";
  }
  return "Number of subscribers, rooms, or endpoints";
}

export function Wizard({ options }: { options: ConfigOptionsResponse }) {
  const [step, setStep] = useState(0);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [reportHtml, setReportHtml] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<WizardFormValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      signal_sources: [],
      services: [],
      viewer_devices: [],
      adaptive_bitrate_required: false,
      output_type: "ip",
      redundancy_required: false,
      average_channel_bitrate_mbps: 6,
      archive_days: 0,
      consent_given: false as never,
    },
    mode: "onBlur",
  });

  const values = form.watch();

  async function submitAll(data: WizardFormValues) {
    setLoading(true);
    setSubmitError(null);
    try {
      const recommendationResult = await api.recommend(data);
      setRecommendation(recommendationResult);
      const lead = await api.createLead({
        contact_name: data.contact_name,
        email: data.email,
        company: data.company,
        phone: data.phone,
        country: data.country,
        project_type: data.project_type,
        requirements: data,
        recommendation: recommendationResult,
        source: "wizard",
        consent_given: data.consent_given,
      });
      const report = await api.createReport({
        lead_id: lead.id,
        requirements: data,
        recommendation: recommendationResult,
      });
      setReportHtml(report.generated_content);
      setStep(6);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = form.handleSubmit(submitAll);

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <div className="flex flex-wrap gap-3">
          {steps.map((label, index) => (
            <div key={label} className={clsx("rounded-full px-4 py-2 text-sm", index === step ? "bg-ink text-white" : "bg-paper text-slate-500")}>
              {index + 1}. {label}
            </div>
          ))}
        </div>
        <p className="mt-5 max-w-3xl text-sm text-slate-600">{options.disclaimer}</p>
      </div>

      <form onSubmit={onSubmit} className="panel p-6">
        {step === 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FieldSelect form={form} name="project_type" label="Project type" options={options.project_types} />
            <FieldInput form={form} name="country" label="Country" />
            <FieldInput form={form} name="company_name" label="Company name" />
            <FieldInput form={form} name="subscribers_or_rooms" label={labelForAudience(values.project_type)} type="number" />
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FieldInput form={form} name="number_of_channels" label="Number of TV channels" type="number" />
            <CheckboxGroup form={form} name="signal_sources" label="Signal sources" options={options.signal_sources} />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <CheckboxGroup form={form} name="services" label="Required services" options={options.services} />
            <div className="space-y-4">
              <FieldInput form={form} name="archive_days" label="Archive duration in days" type="number" />
              <FieldInput form={form} name="estimated_vod_library_size_tb" label="Estimated VoD library size (TB)" type="number" />
              <FieldCheckbox form={form} name="need_subscriber_packages" label="Need subscriber packages" />
              <FieldCheckbox form={form} name="need_local_advertising" label="Need local advertising" />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <CheckboxGroup form={form} name="viewer_devices" label="Viewer devices" options={options.viewer_devices} />
            <div className="space-y-4">
              <FieldSelect form={form} name="delivery_mode" label="Delivery mode" options={options.delivery_modes} />
              <FieldSelect form={form} name="output_type" label="Output type" options={options.output_types} />
              <FieldCheckbox form={form} name="adaptive_bitrate_required" label="Adaptive bitrate required" />
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FieldInput form={form} name="expected_concurrent_viewers" label="Expected concurrent viewers" type="number" />
            <FieldInput form={form} name="average_channel_bitrate_mbps" label="Average channel bitrate (Mbps)" type="number" />
            <FieldInput form={form} name="available_storage_tb" label="Available storage (TB)" type="number" />
            <FieldInput form={form} name="existing_network_bandwidth_mbps" label="Existing network bandwidth (Mbps)" type="number" />
            <FieldCheckbox form={form} name="redundancy_required" label="Redundancy required" />
            <FieldInput form={form} name="target_launch_date" label="Target launch date" />
            <FieldInput form={form} name="budget_range" label="Budget range" />
            <FieldTextArea form={form} name="existing_equipment" label="Existing equipment" />
          </div>
        ) : null}

        {step === 5 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FieldInput form={form} name="contact_name" label="Contact name" />
            <FieldInput form={form} name="email" label="Work email" />
            <FieldInput form={form} name="company" label="Company" />
            <FieldInput form={form} name="phone" label="Phone" />
            <FieldTextArea form={form} name="additional_project_notes" label="Additional project notes" />
            <FieldCheckbox form={form} name="consent_given" label="I consent to submitting this presales request" />
          </div>
        ) : null}

        {step === 6 && recommendation ? <ResultsPanel recommendation={recommendation} reportHtml={reportHtml} /> : null}

        {submitError ? <p className="mt-4 text-sm text-red-600">{submitError}</p> : null}

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            disabled={step === 0 || loading}
            className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-ink disabled:opacity-50"
          >
            Back
          </button>
          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep((current) => Math.min(5, current + 1))}
              className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
            >
              Continue
            </button>
          ) : step === 5 ? (
            <button type="submit" disabled={loading} className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
              {loading ? "Generating..." : "Request engineering review"}
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function FieldInput({ form, name, label, type = "text" }: { form: ReturnType<typeof useForm<WizardFormValues>>; name: keyof WizardFormValues; label: string; type?: string }) {
  const error = form.formState.errors[name]?.message as string | undefined;
  return (
    <label className="space-y-2 text-sm text-slate-700">
      <span>{label}</span>
      <input type={type} {...form.register(name)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
      {error ? <span className="text-red-600">{error}</span> : null}
    </label>
  );
}

function FieldTextArea({ form, name, label }: { form: ReturnType<typeof useForm<WizardFormValues>>; name: keyof WizardFormValues; label: string }) {
  const error = form.formState.errors[name]?.message as string | undefined;
  return (
    <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
      <span>{label}</span>
      <textarea {...form.register(name)} className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
      {error ? <span className="text-red-600">{error}</span> : null}
    </label>
  );
}

function FieldSelect({ form, name, label, options }: { form: ReturnType<typeof useForm<WizardFormValues>>; name: keyof WizardFormValues; label: string; options: { value: string; label: string }[] }) {
  const error = form.formState.errors[name]?.message as string | undefined;
  return (
    <label className="space-y-2 text-sm text-slate-700">
      <span>{label}</span>
      <select {...form.register(name)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none">
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-red-600">{error}</span> : null}
    </label>
  );
}

function FieldCheckbox({ form, name, label }: { form: ReturnType<typeof useForm<WizardFormValues>>; name: keyof WizardFormValues; label: string }) {
  const error = form.formState.errors[name]?.message as string | undefined;
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
      <input type="checkbox" {...form.register(name)} />
      <span>{label}</span>
      {error ? <span className="text-red-600">{error}</span> : null}
    </label>
  );
}

function CheckboxGroup({ form, name, label, options }: { form: ReturnType<typeof useForm<WizardFormValues>>; name: keyof WizardFormValues; label: string; options: { value: string; label: string }[] }) {
  const selected = (form.watch(name) as string[] | undefined) ?? [];
  const error = form.formState.errors[name]?.message as string | undefined;
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm text-slate-700">{label}</legend>
      <div className="grid gap-2">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={(event) => {
                const next = event.target.checked
                  ? [...selected, option.value]
                  : selected.filter((item) => item !== option.value);
                form.setValue(name, next as never, { shouldValidate: true });
              }}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {error ? <span className="text-red-600">{error}</span> : null}
    </fieldset>
  );
}
