"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm, type FieldErrors, type FieldPath, type UseFormReturn } from "react-hook-form";

import { api } from "@/lib/api";
import { setResultsPayload } from "@/lib/flow-storage";
import { wizardSchema, type WizardFormValues } from "@/lib/schema";
import type { ConfigOptionsResponse } from "@/lib/types";

const steps = [
  {
    title: "Project profile",
    description: "Capture the customer profile and the overall deployment scope.",
  },
  {
    title: "Content sources",
    description: "Define the channel count and how signal feeds reach the platform.",
  },
  {
    title: "Required services",
    description: "Select the service set that shapes storage, packaging, and feature needs.",
  },
  {
    title: "Devices and delivery",
    description: "Match viewer endpoints with the delivery approach and output format.",
  },
  {
    title: "Capacity and reliability",
    description: "Add traffic, storage, and resilience inputs for the preliminary sizing model.",
  },
  {
    title: "Contact details",
    description: "Provide the presales contact so the recommendation can be shared and reviewed.",
  },
  {
    title: "Results",
    description: "Review the preliminary recommendation, assumptions, and follow-up actions.",
  },
] as const;

const stepTitlesCompact = ["Profile", "Sources", "Services", "Delivery", "Capacity", "Contact", "Results"] as const;

const mobileViewingScopeOptions = [
  { value: "hotel_wifi_only", label: "Hotel Wi-Fi only" },
  { value: "off_property_access", label: "Internet / OTT outside the property" },
  { value: "both", label: "Both" },
  { value: "unknown", label: "Unknown" },
] as const;

const inPropertyNetworkOptions = [
  { value: "managed_lan_multicast", label: "Managed LAN multicast" },
  { value: "managed_lan_unicast", label: "Managed LAN unicast" },
  { value: "coaxial_dvb_c", label: "Coaxial / DVB-C" },
  { value: "hybrid", label: "Hybrid" },
  { value: "unknown", label: "Unknown" },
] as const;

const stepFields: Array<FieldPath<WizardFormValues>[]> = [
  ["project_type", "subscribers_or_rooms"],
  ["number_of_channels", "signal_sources"],
  ["services", "archive_days"],
  ["viewer_devices", "delivery_mode"],
  ["expected_concurrent_viewers"],
  ["contact_name", "email", "consent_given"],
  [],
] as const;

type BannerState = { kind: "info"; message: string } | null;

function labelForAudience(projectType: string | undefined) {
  if (projectType === "hotel") return "Number of rooms";
  if (projectType === "hospital") return "Number of rooms or screens";
  if (projectType === "large_operator" || projectType === "small_provider" || projectType === "cable_operator") {
    return "Number of subscribers";
  }
  return "Number of subscribers, rooms, or endpoints";
}

function getFirstErrorName(errors: FieldErrors<WizardFormValues>, names: FieldPath<WizardFormValues>[]) {
  const errorMap = errors as Record<string, unknown>;
  return names.find((name) => Boolean(errorMap[name]));
}

function Spinner({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function Wizard({
  options,
  onStartOver,
  focusRequestSignal = 0,
  seedValues,
  seedSignal = 0,
  seedStartStep = 0,
  onDescribeProjectInstead,
}: {
  options: ConfigOptionsResponse;
  onStartOver?: () => void;
  focusRequestSignal?: number;
  seedValues?: Partial<WizardFormValues> | Record<string, unknown> | null;
  seedSignal?: number;
  seedStartStep?: number;
  onDescribeProjectInstead?: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState(0);
  const [attemptedSteps, setAttemptedSteps] = useState<number[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<BannerState>(null);
  const wizardTopRef = useRef<HTMLDivElement | null>(null);

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
    mode: "onTouched",
    reValidateMode: "onChange",
    shouldFocusError: true,
  });

  const values = form.watch();
  const selectedServices = values.services ?? [];
  const archiveRequired = selectedServices.includes("catchup_tv") || selectedServices.includes("time_shift");
  const hotelSmartTvFlow = values.project_type === "hotel" && (values.viewer_devices ?? []).includes("smart_tv");
  const mobileSelected = (values.viewer_devices ?? []).includes("mobile");
  const currentStep = steps[step];
  const progressPercent = ((step + 1) / steps.length) * 100;
  const canGoBack = step > 0 && !loading;

  useEffect(() => {
    if (!focusRequestSignal) return;

    setBanner(null);
    setSubmitError(null);
    setStep(0);

    requestAnimationFrame(() => {
      wizardTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      requestAnimationFrame(() => {
        form.setFocus("project_type");
      });
    });
  }, [focusRequestSignal, form]);

  useEffect(() => {
    if (!seedSignal || !seedValues) return;

    form.reset({
      signal_sources: [],
      services: [],
      viewer_devices: [],
      adaptive_bitrate_required: false,
      output_type: "ip",
      redundancy_required: false,
      average_channel_bitrate_mbps: 6,
      archive_days: 0,
      consent_given: false as never,
      ...(seedValues as Partial<WizardFormValues>),
    });
    setAttemptedSteps([]);
    setSubmitError(null);
    setBanner({ kind: "info", message: "Extracted project details were added to the guided configurator. Review and complete the remaining fields." });
    setMaxUnlockedStep(seedStartStep);
    setStep(seedStartStep);
  }, [form, seedSignal, seedStartStep, seedValues]);

  const markStepAttempted = (index: number) => {
    setAttemptedSteps((current) => (current.includes(index) ? current : [...current, index]));
  };

  async function goToNextStep() {
    const fields = stepFields[step];
    markStepAttempted(step);
    const valid = await form.trigger(fields, { shouldFocus: true });
    if (!valid) return;
    setBanner(null);
    setSubmitError(null);
    setMaxUnlockedStep((current) => Math.max(current, step + 1));
    setStep((current) => Math.min(5, current + 1));
  }

  function goToStep(index: number) {
    if (index <= maxUnlockedStep) {
      setBanner(null);
      setSubmitError(null);
      setStep(index);
    }
  }

  async function handleGenerateRecommendation() {
    markStepAttempted(5);
    const valid = await form.trigger(stepFields[5], { shouldFocus: true });
    if (!valid) {
      const firstInvalidField = getFirstErrorName(form.formState.errors, stepFields[5]);
      if (firstInvalidField) form.setFocus(firstInvalidField);
      return;
    }

    setLoading(true);
    setBanner(null);
    setSubmitError(null);

    try {
      const data = form.getValues();
      const recommendation = await api.recommend(data);
      setResultsPayload({ recommendation, submittedValues: data });
      router.push("/results");
    } catch {
      setSubmitError("We could not generate the recommendation. Please check that the backend is running and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleStartOver() {
    form.reset({
      signal_sources: [],
      services: [],
      viewer_devices: [],
      adaptive_bitrate_required: false,
      output_type: "ip",
      redundancy_required: false,
      average_channel_bitrate_mbps: 6,
      archive_days: 0,
      consent_given: false as never,
    });
    setStep(0);
    setMaxUnlockedStep(0);
    setAttemptedSteps([]);
    setSubmitError(null);
    setBanner(null);
    setLoading(false);
    onStartOver?.();
  }

  return (
    <div className="space-y-6">
      <div ref={wizardTopRef} />

      {onDescribeProjectInstead && step < 6 ? (
        <div className="flex justify-start print:hidden">
          <button
            type="button"
            onClick={onDescribeProjectInstead}
            className="min-h-11 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-ink transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
          >
            Describe my project instead
          </button>
        </div>
      ) : null}

      <div className="panel p-5 md:p-6 print:hidden">
        <div className="hidden gap-1.5 xl:grid xl:grid-cols-7" aria-label="Wizard progress" data-testid="desktop-progress">
          {steps.map((item, index) => {
            const status = index < step ? "complete" : index === step ? "current" : "future";
            const canNavigate = index <= maxUnlockedStep;

            return (
              <button
                key={item.title}
                type="button"
                onClick={() => goToStep(index)}
                disabled={!canNavigate}
                aria-current={index === step ? "step" : undefined}
                aria-label={`${stepTitlesCompact[index]}${status === "complete" ? ", completed" : status === "current" ? ", current step" : ""}`}
                className={clsx(
                  "flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-3 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed",
                  status === "complete" && "border-blue/30 bg-paper text-ink",
                  status === "current" && "border-ink bg-ink text-white shadow-[0_10px_30px_rgba(16,35,61,0.18)]",
                  status === "future" && "border-slate-200 bg-white text-slate-400",
                )}
              >
                <span
                  className={clsx(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                    status === "complete" && "border-blue/30 bg-white text-blue",
                    status === "current" && "border-white/30 bg-white/10 text-white",
                    status === "future" && "border-slate-200 bg-slate-50 text-slate-400",
                  )}
                  aria-hidden="true"
                >
                  {status === "complete" ? "OK" : index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-[12px] font-semibold leading-tight text-current">{stepTitlesCompact[index]}</span>
                  {status === "current" ? <span className="mt-0.5 block text-[10px] leading-tight text-blue-100">Current step</span> : null}
                </span>
              </button>
            );
          })}
        </div>

        <div className="hidden grid-cols-4 gap-2 md:grid lg:grid xl:hidden" aria-label="Wizard progress" data-testid="desktop-progress-compact">
          {steps.map((item, index) => {
            const status = index < step ? "complete" : index === step ? "current" : "future";
            const canNavigate = index <= maxUnlockedStep;

            return (
              <button
                key={`${item.title}-compact`}
                type="button"
                onClick={() => goToStep(index)}
                disabled={!canNavigate}
                aria-current={index === step ? "step" : undefined}
                aria-label={`${stepTitlesCompact[index]}${status === "complete" ? ", completed" : status === "current" ? ", current step" : ""}`}
                className={clsx(
                  "flex min-w-0 items-center gap-2 rounded-2xl border px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed",
                  status === "complete" && "border-blue/30 bg-paper text-ink",
                  status === "current" && "border-ink bg-ink text-white shadow-[0_10px_30px_rgba(16,35,61,0.18)]",
                  status === "future" && "border-slate-200 bg-white text-slate-400",
                )}
              >
                <span
                  className={clsx(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                    status === "complete" && "border-blue/30 bg-white text-blue",
                    status === "current" && "border-white/30 bg-white/10 text-white",
                    status === "future" && "border-slate-200 bg-slate-50 text-slate-400",
                  )}
                  aria-hidden="true"
                >
                  {status === "complete" ? "OK" : index + 1}
                </span>
                <span className="min-w-0 text-[12px] font-semibold leading-tight text-current">{stepTitlesCompact[index]}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-3 md:hidden" data-testid="compact-progress">
          <div className="flex items-center justify-between gap-3 text-sm font-medium text-ink">
            <span>{`Step ${step + 1} of ${steps.length}`}</span>
            <span className="text-right">{currentStep.title}</span>
          </div>
          <div className="h-2 rounded-full bg-paper" aria-hidden="true">
            <div className="h-2 rounded-full bg-ink transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      {banner ? (
        <div className="panel border-slate-200 bg-paper px-5 py-4 text-sm text-slate-700 print:hidden" aria-live="polite">
          {banner.message}
        </div>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleGenerateRecommendation();
        }}
        className="panel p-5 md:p-6 print:border-0 print:bg-transparent print:p-0 print:shadow-none"
        noValidate
      >
        <div className="step-panel" data-step-active="true">
          <div className="mb-8 border-b border-slate-200 pb-6">
            <h2 className="text-2xl font-semibold text-ink md:text-3xl">{currentStep.title}</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">{currentStep.description}</p>
          </div>

          {step === 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <FieldSelect form={form} name="project_type" label="Project type" options={options.project_types} showError={shouldShowError(form, "project_type", attemptedSteps.includes(0))} />
              <FieldInput form={form} name="country" label="Country" showError={shouldShowError(form, "country", attemptedSteps.includes(0))} />
              <FieldInput form={form} name="company_name" label="Company name" showError={shouldShowError(form, "company_name", attemptedSteps.includes(0))} />
              <FieldInput
                form={form}
                name="subscribers_or_rooms"
                label={labelForAudience(values.project_type)}
                type="number"
                showError={shouldShowError(form, "subscribers_or_rooms", attemptedSteps.includes(0))}
              />
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <FieldInput
                form={form}
                name="number_of_channels"
                label="Number of TV channels"
                type="number"
                showError={shouldShowError(form, "number_of_channels", attemptedSteps.includes(1))}
              />
              <CheckboxGroup
                form={form}
                name="signal_sources"
                label="Signal sources"
                options={options.signal_sources}
                showError={shouldShowError(form, "signal_sources", attemptedSteps.includes(1))}
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <CheckboxGroup
                form={form}
                name="services"
                label="Required services"
                options={options.services}
                showError={shouldShowError(form, "services", attemptedSteps.includes(2))}
              />
              <div className="space-y-4">
                {archiveRequired ? (
                  <FieldInput
                    form={form}
                    name="archive_days"
                    label="Archive duration in days"
                    type="number"
                    helperText="Shown when catch-up TV or time-shift is selected."
                    showError={shouldShowError(form, "archive_days", attemptedSteps.includes(2))}
                  />
                ) : null}
                <FieldInput
                  form={form}
                  name="estimated_vod_library_size_tb"
                  label="Estimated VoD library size (TB)"
                  type="number"
                  showError={shouldShowError(form, "estimated_vod_library_size_tb", attemptedSteps.includes(2))}
                />
                <FieldCheckbox
                  form={form}
                  name="need_subscriber_packages"
                  label="Need subscriber packages"
                  showError={shouldShowError(form, "need_subscriber_packages", attemptedSteps.includes(2))}
                />
                <FieldCheckbox
                  form={form}
                  name="need_local_advertising"
                  label="Need local advertising"
                  showError={shouldShowError(form, "need_local_advertising", attemptedSteps.includes(2))}
                />
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <CheckboxGroup
                form={form}
                name="viewer_devices"
                label="Viewer devices"
                options={options.viewer_devices}
                showError={shouldShowError(form, "viewer_devices", attemptedSteps.includes(3))}
              />
              <div className="space-y-4">
                <FieldSelect
                  form={form}
                  name="delivery_mode"
                  label="Delivery mode"
                  options={options.delivery_modes}
                  showError={shouldShowError(form, "delivery_mode", attemptedSteps.includes(3))}
                />
                <FieldSelect form={form} name="output_type" label="Output type" options={options.output_types} showError={shouldShowError(form, "output_type", attemptedSteps.includes(3))} />
                <FieldCheckbox
                  form={form}
                  name="adaptive_bitrate_required"
                  label="Adaptive bitrate required"
                  showError={shouldShowError(form, "adaptive_bitrate_required", attemptedSteps.includes(3))}
                />
                {hotelSmartTvFlow ? (
                  <>
                    <FieldInput form={form} name="hotel_tv_brand" label="Hotel TV brand" showError={shouldShowError(form, "hotel_tv_brand", attemptedSteps.includes(3))} />
                    <FieldInput form={form} name="hotel_tv_model" label="Hotel TV model or series" showError={shouldShowError(form, "hotel_tv_model", attemptedSteps.includes(3))} />
                    <FieldSelect
                      form={form}
                      name="in_property_network_type"
                      label="Room-TV delivery method"
                      options={[...inPropertyNetworkOptions]}
                      showError={shouldShowError(form, "in_property_network_type", attemptedSteps.includes(3))}
                    />
                    <FieldCheckbox
                      form={form}
                      name="hotel_tv_hospitality_grade"
                      label="Hospitality/commercial TVs confirmed"
                      showError={shouldShowError(form, "hotel_tv_hospitality_grade", attemptedSteps.includes(3))}
                    />
                    <FieldInput form={form} name="hotel_tv_os" label="TV operating system" showError={shouldShowError(form, "hotel_tv_os", attemptedSteps.includes(3))} />
                    {String(values.hotel_tv_brand ?? "").trim().toLowerCase() === "lg" ? (
                      <FieldCheckbox
                        form={form}
                        name="lg_procentric_direct_confirmed"
                        label="LG Pro:Centric Direct confirmed"
                        showError={shouldShowError(form, "lg_procentric_direct_confirmed", attemptedSteps.includes(3))}
                      />
                    ) : null}
                  </>
                ) : null}
                {mobileSelected ? (
                  <FieldSelect
                    form={form}
                    name="mobile_viewing_scope"
                    label="Mobile / web delivery"
                    options={[...mobileViewingScopeOptions]}
                    showError={shouldShowError(form, "mobile_viewing_scope", attemptedSteps.includes(3))}
                  />
                ) : null}
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <FieldInput
                form={form}
                name="expected_concurrent_viewers"
                label="Expected concurrent viewers"
                type="number"
                showError={shouldShowError(form, "expected_concurrent_viewers", attemptedSteps.includes(4))}
              />
              <FieldInput
                form={form}
                name="average_channel_bitrate_mbps"
                label="Average channel bitrate (Mbps)"
                type="number"
                showError={shouldShowError(form, "average_channel_bitrate_mbps", attemptedSteps.includes(4))}
              />
              <FieldInput form={form} name="available_storage_tb" label="Available storage (TB)" type="number" showError={shouldShowError(form, "available_storage_tb", attemptedSteps.includes(4))} />
              <FieldInput
                form={form}
                name="existing_network_bandwidth_mbps"
                label="Existing network bandwidth (Mbps)"
                type="number"
                showError={shouldShowError(form, "existing_network_bandwidth_mbps", attemptedSteps.includes(4))}
              />
              <FieldCheckbox form={form} name="redundancy_required" label="Redundancy required" showError={shouldShowError(form, "redundancy_required", attemptedSteps.includes(4))} />
              {archiveRequired ? (
                <FieldInput
                  form={form}
                  name="channels_to_record"
                  label="Channels to record for Catch-up"
                  type="number"
                  helperText="Leave blank if all channels should be evaluated, but note that storage will stay unresolved until recording scope is confirmed."
                  showError={shouldShowError(form, "channels_to_record", attemptedSteps.includes(4))}
                />
              ) : null}
              {values.delivery_mode === "internet_ott" || values.delivery_mode === "both" ? (
                <FieldCheckbox
                  form={form}
                  name="content_protection_required"
                  label="Content protection required"
                  showError={shouldShowError(form, "content_protection_required", attemptedSteps.includes(4))}
                />
              ) : null}
              {values.project_type === "hotel" ? (
                <FieldCheckbox
                  form={form}
                  name="pms_integration_required"
                  label="PMS integration required"
                  showError={shouldShowError(form, "pms_integration_required", attemptedSteps.includes(4))}
                />
              ) : null}
              <FieldInput
                form={form}
                name="target_launch_date"
                label="Target launch date"
                type="date"
                showError={shouldShowError(form, "target_launch_date", attemptedSteps.includes(4))}
              />
              <FieldInput form={form} name="budget_range" label="Budget range" showError={shouldShowError(form, "budget_range", attemptedSteps.includes(4))} />
              <FieldTextArea form={form} name="existing_equipment" label="Existing equipment" showError={shouldShowError(form, "existing_equipment", attemptedSteps.includes(4))} />
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FieldInput form={form} name="contact_name" label="Contact name" showError={shouldShowError(form, "contact_name", attemptedSteps.includes(5))} />
                <FieldInput form={form} name="email" label="Work email" showError={shouldShowError(form, "email", attemptedSteps.includes(5))} />
                <FieldInput form={form} name="company" label="Company" showError={shouldShowError(form, "company", attemptedSteps.includes(5))} />
                <FieldInput form={form} name="phone" label="Phone" showError={shouldShowError(form, "phone", attemptedSteps.includes(5))} />
              </div>
              <FieldTextArea
                form={form}
                name="additional_project_notes"
                label="Additional project notes"
                showError={shouldShowError(form, "additional_project_notes", attemptedSteps.includes(5))}
              />
              <div className="rounded-3xl border border-slate-200 bg-paper p-5">
                <FieldCheckbox
                  form={form}
                  name="consent_given"
                  label="I consent to submitting this presales request."
                  showError={shouldShowError(form, "consent_given", attemptedSteps.includes(5))}
                  fullWidth
                />
              </div>
              <div className="rounded-3xl border border-blue/20 bg-blue-50 p-5 text-sm text-slate-700">
                Your configuration will be processed using validated recommendation rules.
              </div>
            </div>
          ) : null}
        </div>

        <div aria-live="assertive" className="mt-4 print:hidden">
          {submitError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p>{submitError}</p>
              {!loading && step === 5 ? (
                <button type="button" onClick={() => void handleGenerateRecommendation()} className="mt-3 rounded-full border border-red-200 px-4 py-2 font-semibold text-red-700">
                  Retry
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <button
            type="button"
            onClick={() => {
              if (step === 0) {
                handleStartOver();
                return;
              }
              setStep((current) => Math.max(0, current - 1));
            }}
            disabled={loading}
            className="min-h-12 rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-ink transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
          >
            Back
          </button>
          <div className="flex flex-col gap-3 sm:flex-row">
            {step < 5 ? (
              <button
                type="button"
                onClick={() => void goToNextStep()}
                className="min-h-12 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
              >
                Next
              </button>
            ) : null}
            {step === 5 ? (
              <button
                type="submit"
                disabled={loading}
                className="min-h-12 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Spinner label="Generating preliminary recommendation..." /> : "Generate preliminary recommendation"}
              </button>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  );
}

function shouldShowError<TFieldName extends FieldPath<WizardFormValues>>(
  form: UseFormReturn<WizardFormValues>,
  name: TFieldName,
  stepAttempted: boolean,
) {
  const touchedMap = form.formState.touchedFields as Record<string, unknown>;
  return Boolean(touchedMap[name] || stepAttempted);
}

function getFieldErrorMessage(form: UseFormReturn<WizardFormValues>, name: FieldPath<WizardFormValues>, showError: boolean) {
  if (!showError) return undefined;
  const errorMap = form.formState.errors as Record<string, { message?: string } | undefined>;
  return errorMap[name]?.message;
}

function FieldInput({
  form,
  name,
  label,
  type = "text",
  helperText,
  showError,
}: {
  form: UseFormReturn<WizardFormValues>;
  name: FieldPath<WizardFormValues>;
  label: string;
  type?: string;
  helperText?: string;
  showError: boolean;
}) {
  const inputId = `field-${name}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const error = getFieldErrorMessage(form, name, showError);

  return (
    <label htmlFor={inputId} className="space-y-2 text-sm text-slate-700">
      <span className="font-medium text-ink">{label}</span>
      <input
        id={inputId}
        type={type}
        {...form.register(name)}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        className={clsx(
          "min-h-12 w-full rounded-2xl border px-4 py-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2",
          error ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-white",
        )}
      />
      {helperText ? (
        <span id={helperId} className="block text-xs text-slate-500">
          {helperText}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className="block text-sm text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function FieldTextArea({
  form,
  name,
  label,
  showError,
}: {
  form: UseFormReturn<WizardFormValues>;
  name: FieldPath<WizardFormValues>;
  label: string;
  showError: boolean;
}) {
  const inputId = `field-${name}`;
  const errorId = `${inputId}-error`;
  const error = getFieldErrorMessage(form, name, showError);

  return (
    <label htmlFor={inputId} className="space-y-2 text-sm text-slate-700 md:col-span-2">
      <span className="font-medium text-ink">{label}</span>
      <textarea
        id={inputId}
        {...form.register(name)}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? errorId : undefined}
        className={clsx(
          "min-h-32 w-full rounded-2xl border px-4 py-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2",
          error ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-white",
        )}
      />
      {error ? (
        <span id={errorId} className="block text-sm text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function FieldSelect({
  form,
  name,
  label,
  options,
  showError,
}: {
  form: UseFormReturn<WizardFormValues>;
  name: FieldPath<WizardFormValues>;
  label: string;
  options: { value: string; label: string }[];
  showError: boolean;
}) {
  const inputId = `field-${name}`;
  const errorId = `${inputId}-error`;
  const error = getFieldErrorMessage(form, name, showError);

  return (
    <label htmlFor={inputId} className="space-y-2 text-sm text-slate-700">
      <span className="font-medium text-ink">{label}</span>
      <select
        id={inputId}
        {...form.register(name)}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? errorId : undefined}
        className={clsx(
          "min-h-12 w-full rounded-2xl border px-4 py-3 text-sm text-ink outline-none transition focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2",
          error ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-white",
        )}
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <span id={errorId} className="block text-sm text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function FieldCheckbox({
  form,
  name,
  label,
  showError,
  fullWidth = false,
}: {
  form: UseFormReturn<WizardFormValues>;
  name: FieldPath<WizardFormValues>;
  label: string;
  showError: boolean;
  fullWidth?: boolean;
}) {
  const inputId = `field-${name}`;
  const errorId = `${inputId}-error`;
  const error = getFieldErrorMessage(form, name, showError);

  return (
    <div className={clsx(fullWidth ? "w-full" : "", "space-y-2")}>
      <label
        htmlFor={inputId}
        className={clsx(
          "flex min-h-12 items-start gap-3 rounded-2xl border px-4 py-3 text-sm text-slate-700 transition focus-within:ring-2 focus-within:ring-blue focus-within:ring-offset-2",
          error ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-white",
        )}
      >
        <input
          id={inputId}
          type="checkbox"
          {...form.register(name)}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? errorId : undefined}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue focus:ring-blue"
        />
        <span className="font-medium text-ink">{label}</span>
      </label>
      {error ? (
        <span id={errorId} className="block text-sm text-red-600">
          {error}
        </span>
      ) : null}
    </div>
  );
}

function CheckboxGroup({
  form,
  name,
  label,
  options,
  showError,
}: {
  form: UseFormReturn<WizardFormValues>;
  name: FieldPath<WizardFormValues>;
  label: string;
  options: { value: string; label: string }[];
  showError: boolean;
}) {
  const fieldsetId = `field-${name}`;
  const errorId = `${fieldsetId}-error`;
  const selected = (form.watch(name) as string[] | undefined) ?? [];
  const error = getFieldErrorMessage(form, name, showError);

  return (
    <fieldset aria-invalid={error ? "true" : "false"} aria-describedby={error ? errorId : undefined} className="space-y-3">
      <legend className="text-sm font-medium text-ink">{label}</legend>
      <div className="grid gap-2">
        {options.map((option) => {
          const inputId = `${fieldsetId}-${option.value}`;
          const checked = selected.includes(option.value);

          return (
            <label
              key={option.value}
              htmlFor={inputId}
              className={clsx(
                "flex min-h-12 items-start gap-3 rounded-2xl border px-4 py-3 text-sm text-slate-700 transition focus-within:ring-2 focus-within:ring-blue focus-within:ring-offset-2",
                checked ? "border-blue/40 bg-blue-50/70 text-ink" : "border-slate-200 bg-white",
              )}
            >
              <input
                id={inputId}
                type="checkbox"
                checked={checked}
                onChange={(event) => {
                  const next = event.target.checked ? [...selected, option.value] : selected.filter((item) => item !== option.value);
                  form.setValue(name, next as never, { shouldValidate: true, shouldTouch: true, shouldDirty: true });
                }}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue focus:ring-blue"
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
      {error ? (
        <span id={errorId} className="block text-sm text-red-600">
          {error}
        </span>
      ) : null}
    </fieldset>
  );
}
