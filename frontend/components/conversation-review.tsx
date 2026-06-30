"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";

import { setReviewAuditTrace } from "@/lib/flow-storage";
import type { ConfigOptionsResponse, ExtractResponse } from "@/lib/types";

const ENUM_LABELS: Record<string, string> = {
  both: "Both",
  catchup_tv: "Catch-up TV",
  coaxial_dvb_c: "Coaxial / DVB-C",
  epg: "EPG",
  hotel_wifi_only: "Hotel Wi-Fi only",
  hybrid: "Hybrid",
  in_room_tv_delivery: "Room-TV delivery",
  internet_ott: "Internet / OTT outside the property",
  ip_streams: "Existing IP streams",
  live_tv: "Live TV",
  local_network: "Local network",
  managed_lan_multicast: "Managed LAN multicast",
  managed_lan_unicast: "Managed LAN unicast",
  mobile: "Mobile",
  mobile_web_delivery: "Mobile / web delivery",
  off_property_access: "Internet / OTT outside the property",
  set_top_box: "Set-top box",
  smart_tv: "Smart TV",
  unknown: "Unknown",
  video_on_demand: "Video on demand",
};

const FIELD_LABELS: Record<string, string> = {
  additional_project_notes: "Additional notes",
  archive_days: "Retention period",
  average_channel_bitrate_mbps: "Average bitrate",
  channels_to_record: "Channels to record",
  company_name: "Company name",
  country: "Country",
  delivery_mode: "Delivery mode",
  hotel_tv_brand: "TV manufacturer",
  hotel_tv_hospitality_grade: "TV type",
  hotel_tv_model: "TV model or series",
  in_property_network_type: "Room-TV delivery",
  mobile_viewing_scope: "Mobile / web delivery",
  number_of_channels: "Channels",
  pms_integration_required: "PMS integration",
  project_type: "Project type",
  redundancy_required: "Redundancy",
  services: "Required services",
  signal_sources: "Signal sources",
  subscribers_or_rooms: "Rooms or subscribers",
  viewer_devices: "Viewer devices",
};

const ROOM_TV_DELIVERY_OPTIONS = [
  { value: "managed_lan_multicast", label: "Managed LAN multicast" },
  { value: "managed_lan_unicast", label: "Managed LAN unicast" },
  { value: "coaxial_dvb_c", label: "Coaxial / DVB-C" },
  { value: "hybrid", label: "Hybrid" },
  { value: "unknown", label: "Unknown" },
] as const;

const MOBILE_DELIVERY_OPTIONS = [
  { value: "hotel_wifi_only", label: "Hotel Wi-Fi only" },
  { value: "off_property_access", label: "Internet / OTT outside the property" },
  { value: "both", label: "Both" },
  { value: "unknown", label: "Unknown" },
] as const;

const FOLLOW_UP_PRIORITY = [
  "hotel_tv_model",
  "hotel_tv_hospitality_grade",
  "in_property_network_type",
  "mobile_viewing_scope",
  "archive_days",
  "channels_to_record",
  "pms_integration_required",
  "redundancy_required",
] as const;

const FIELD_REASONS: Record<string, string> = {
  archive_days: "Needed to calculate recording storage.",
  channels_to_record: "Needed to size the recording scope for Catch-up TV.",
  hotel_tv_hospitality_grade: "Needed to confirm whether native hotel TV features are available or an external device may be required.",
  hotel_tv_model: "Needed to assess native Smart TV compatibility and whether an external set-top box may be required.",
  in_property_network_type: "Needed to select the correct room-TV delivery architecture.",
  mobile_viewing_scope: "Needed to distinguish hotel Wi-Fi delivery from off-property OTT delivery.",
  pms_integration_required: "Needed to understand hotel-system integration scope.",
  redundancy_required: "Needed to validate resilience expectations and sizing assumptions.",
};

const CATEGORY_LABELS = ["Compatibility", "Delivery", "Capacity", "Commercial / integration"] as const;

type ReviewValues = Record<string, unknown>;
type InferenceDecision = "accepted" | "rejected" | null;
type InferenceKey = "live_tv" | "epg";
type FollowUpFieldKey = (typeof FOLLOW_UP_PRIORITY)[number];
type ChecklistCategory = (typeof CATEGORY_LABELS)[number];
type TraceStatus = "confirmed_from_text" | "inferred_requires_confirmation" | "missing_required" | "missing_optional" | "not_applicable";

type InferenceItem = {
  key: InferenceKey;
  label: string;
  reason: string;
  sourceText?: string | null;
  confidence?: "high" | "medium" | "low";
};

type FollowUpItem = {
  field: FollowUpFieldKey;
  question: string;
  reason: string;
  category: ChecklistCategory;
  reviewed: boolean;
  complete: boolean;
};

type TraceEntry = {
  field: string;
  value: unknown;
  status: TraceStatus;
  source_phrase: string | null;
  user_confirmed_value?: unknown;
  user_edited_value?: unknown;
};

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

function isKnownSelection(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0 && value !== "unknown";
}

function toNumberOrBlank(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value);
  return "";
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function formatValue(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => humanize(String(item))).join(", ");
  if (typeof value === "number") return new Intl.NumberFormat("en-US").format(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return humanize(value);
  return "Not provided";
}

function deriveTvBrand(originalMessage: string) {
  const match = originalMessage.match(/\b(LG|Samsung|Philips|Sony)\b/i);
  return match ? match[1].toUpperCase().replace("SAMSUNG", "Samsung").replace("PHILIPS", "Philips").replace("SONY", "Sony").replace("LG", "LG") : "";
}

function deriveSourcePhrase(field: string, originalMessage: string) {
  const patterns: Record<string, RegExp> = {
    catchup_tv: /catch-?up tv/i,
    epg: /catch-?up tv/i,
    hotel_tv_brand: /\b(LG|Samsung|Philips|Sony)\b[^.?!]*smart tv/i,
    live_tv: /\b\d+\s+(satellite\s+and\s+ip\s+)?channels\b/i,
    mobile: /mobile viewing/i,
    number_of_channels: /\b\d+\s+(satellite\s+and\s+ip\s+)?channels\b/i,
    project_type: /\b\d+-room hotel\b|\bhotel\b/i,
    satellite: /satellite/i,
    smart_tv: /smart tvs?/i,
    subscribers_or_rooms: /\b\d+-room hotel\b|\b\d+\s+rooms?\b/i,
  };

  const match = originalMessage.match(patterns[field] ?? /.^/);
  return match ? match[0] : null;
}

function createInitialValues(extracted: ReviewValues, originalMessage: string) {
  const signalSources = normalizeStringArray(extracted.signal_sources);
  const services = normalizeStringArray(extracted.services);
  const viewerDevices = normalizeStringArray(extracted.viewer_devices);
  const derivedBrand = typeof extracted.hotel_tv_brand === "string" && extracted.hotel_tv_brand.trim() ? String(extracted.hotel_tv_brand) : deriveTvBrand(originalMessage);

  return {
    project_type: extracted.project_type ?? "",
    subscribers_or_rooms: extracted.subscribers_or_rooms ?? "",
    number_of_channels: extracted.number_of_channels ?? "",
    signal_sources: signalSources,
    services,
    viewer_devices: viewerDevices,
    delivery_mode: extracted.delivery_mode ?? "",
    country: extracted.country ?? "",
    company_name: extracted.company_name ?? "",
    additional_project_notes:
      typeof extracted.additional_project_notes === "string" && extracted.additional_project_notes.trim()
        ? extracted.additional_project_notes
        : `Customer request: ${originalMessage}`,
    hotel_tv_brand: derivedBrand,
    hotel_tv_model: extracted.hotel_tv_model ?? "",
    hotel_tv_hospitality_grade: typeof extracted.hotel_tv_hospitality_grade === "boolean" ? extracted.hotel_tv_hospitality_grade : undefined,
    in_property_network_type: extracted.in_property_network_type ?? "",
    mobile_viewing_scope: extracted.mobile_viewing_scope ?? "",
    archive_days: extracted.archive_days ?? "",
    channels_to_record: extracted.channels_to_record ?? "",
    average_channel_bitrate_mbps: extracted.average_channel_bitrate_mbps ?? 6,
    redundancy_required: typeof extracted.redundancy_required === "boolean" ? extracted.redundancy_required : undefined,
    pms_integration_required: typeof extracted.pms_integration_required === "boolean" ? extracted.pms_integration_required : undefined,
    content_protection_required: typeof extracted.content_protection_required === "boolean" ? extracted.content_protection_required : undefined,
    target_launch_date: extracted.target_launch_date ?? "",
    budget_range: extracted.budget_range ?? "",
    existing_equipment: extracted.existing_equipment ?? "",
  };
}

function getOptionLabel(options: ConfigOptionsResponse, fieldKey: string, value: string) {
  const optionSets: Record<string, { value: string; label: string }[]> = {
    delivery_mode: options.delivery_modes,
    project_type: options.project_types,
    services: options.services,
    signal_sources: options.signal_sources,
    viewer_devices: options.viewer_devices,
  };

  return optionSets[fieldKey]?.find((option) => option.value === value)?.label ?? humanize(value);
}

function buildTrace(values: ReviewValues, originalMessage: string, inferenceDecisions: Record<InferenceKey, InferenceDecision>) {
  const trace: TraceEntry[] = [];
  const services = normalizeStringArray(values.services);
  const signalSources = normalizeStringArray(values.signal_sources);
  const devices = normalizeStringArray(values.viewer_devices);

  const pushEntry = (field: string, value: unknown, status: TraceStatus, sourceField = field) => {
    trace.push({
      field,
      value,
      status,
      source_phrase: deriveSourcePhrase(sourceField, originalMessage),
      user_confirmed_value: inferenceDecisions[field as InferenceKey] === "accepted" ? value : undefined,
      user_edited_value: value,
    });
  };

  pushEntry("project_type", values.project_type, hasValue(values.project_type) ? "confirmed_from_text" : "missing_required");
  pushEntry("subscribers_or_rooms", values.subscribers_or_rooms, hasValue(values.subscribers_or_rooms) ? "confirmed_from_text" : "missing_required");
  pushEntry("number_of_channels", values.number_of_channels, hasValue(values.number_of_channels) ? "confirmed_from_text" : "missing_required");
  pushEntry("hotel_tv_brand", values.hotel_tv_brand, hasValue(values.hotel_tv_brand) ? "confirmed_from_text" : "missing_required");
  pushEntry("hotel_tv_model", values.hotel_tv_model, hasValue(values.hotel_tv_model) ? "confirmed_from_text" : "missing_required");
  pushEntry("mobile_viewing_scope", values.mobile_viewing_scope, hasValue(values.mobile_viewing_scope) ? "confirmed_from_text" : "missing_required");
  pushEntry("in_property_network_type", values.in_property_network_type, hasValue(values.in_property_network_type) ? "confirmed_from_text" : "missing_required");
  pushEntry("archive_days", values.archive_days, hasValue(values.archive_days) ? "confirmed_from_text" : "missing_required");
  pushEntry("channels_to_record", values.channels_to_record, hasValue(values.channels_to_record) ? "confirmed_from_text" : "missing_required");
  pushEntry("redundancy_required", values.redundancy_required, values.redundancy_required === undefined ? "missing_required" : "confirmed_from_text");
  pushEntry("pms_integration_required", values.pms_integration_required, values.pms_integration_required === undefined ? "missing_required" : "confirmed_from_text");

  signalSources.forEach((value) => pushEntry(value, value, "confirmed_from_text", value));
  devices.forEach((value) => pushEntry(value, value, "confirmed_from_text", value));
  services
    .filter((value) => value !== "live_tv" && value !== "epg")
    .forEach((value) => pushEntry(value, value, "confirmed_from_text", value));

  if (services.includes("live_tv") || inferenceDecisions.live_tv) {
    pushEntry("live_tv", "live_tv", inferenceDecisions.live_tv === "accepted" ? "inferred_requires_confirmation" : "confirmed_from_text", "live_tv");
  }
  if (services.includes("epg") || inferenceDecisions.epg) {
    pushEntry("epg", "epg", inferenceDecisions.epg === "accepted" ? "inferred_requires_confirmation" : "confirmed_from_text", "epg");
  }

  return trace;
}

function buildTraceFromBackend(
  values: ReviewValues,
  backendTrace: ExtractResponse["extraction_trace"],
  inferenceDecisions: Record<InferenceKey, InferenceDecision>,
) {
  return backendTrace.map((entry) => ({
    field: entry.field,
    value: entry.value,
    status:
      entry.state === "inferred"
        ? "inferred_requires_confirmation"
        : entry.state === "missing"
          ? "missing_required"
          : "confirmed_from_text",
    source_phrase: entry.source_text ?? null,
    user_confirmed_value: inferenceDecisions[entry.field as InferenceKey] === "accepted" ? values[entry.field] : undefined,
    user_edited_value: values[entry.field] ?? entry.value,
  })) satisfies TraceEntry[];
}

function determineGenericDelivery(values: ReviewValues) {
  const mobileScope = String(values.mobile_viewing_scope ?? "");
  if (mobileScope === "both" || mobileScope === "off_property_access") return "both";
  if (isKnownSelection(values.in_property_network_type) || mobileScope === "hotel_wifi_only") return "local_network";
  return String(values.delivery_mode ?? "");
}

function getWizardStepForField(field: string) {
  const stepMap: Record<string, number> = {
    archive_days: 4,
    average_channel_bitrate_mbps: 4,
    channels_to_record: 4,
    delivery_mode: 3,
    hotel_tv_brand: 3,
    hotel_tv_hospitality_grade: 3,
    hotel_tv_model: 3,
    in_property_network_type: 3,
    mobile_viewing_scope: 3,
    number_of_channels: 1,
    pms_integration_required: 4,
    project_type: 0,
    redundancy_required: 4,
    services: 2,
    signal_sources: 1,
    subscribers_or_rooms: 0,
    viewer_devices: 3,
  };

  return stepMap[field] ?? 0;
}

function inferredServiceLabel(value: InferenceKey) {
  return value === "live_tv" ? "Live TV" : "EPG";
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
  const [inferenceDecisions, setInferenceDecisions] = useState<Record<InferenceKey, InferenceDecision>>({ live_tv: null, epg: null });
  const [recordAllChannels, setRecordAllChannels] = useState<boolean | null>(null);
  const [advancedDetailsOpen, setAdvancedDetailsOpen] = useState(false);

  useEffect(() => {
    setFormValues(createInitialValues(response.extracted_requirements ?? {}, originalMessage));
    setInferenceDecisions({ live_tv: null, epg: null });
    setAdvancedDetailsOpen(false);
  }, [response, originalMessage]);

  useEffect(() => {
    const channelsToRecord = Number(formValues.channels_to_record ?? 0);
    const totalChannels = Number(formValues.number_of_channels ?? 0);
    if (!channelsToRecord) {
      setRecordAllChannels(null);
      return;
    }
    setRecordAllChannels(totalChannels > 0 && channelsToRecord === totalChannels);
  }, [formValues.channels_to_record, formValues.number_of_channels]);

  const projectType = String(formValues.project_type ?? "");
  const selectedServices = normalizeStringArray(formValues.services);
  const selectedSources = normalizeStringArray(formValues.signal_sources);
  const selectedDevices = normalizeStringArray(formValues.viewer_devices);
  const hotelSmartTvFlow = projectType === "hotel" && selectedDevices.includes("smart_tv");
  const mobileSelected = selectedDevices.includes("mobile");
  const catchupSelected = selectedServices.includes("catchup_tv");
  const liveTvSelected = selectedServices.includes("live_tv");
  const epgSelected = selectedServices.includes("epg");
  const backendTrace = response.extraction_trace ?? [];

  const inferenceItems = useMemo(() => {
    if (backendTrace.length) {
      return backendTrace
        .filter((entry): entry is ExtractResponse["extraction_trace"][number] & { field: InferenceKey } => (
          entry.state === "inferred" && (entry.field === "live_tv" || entry.field === "epg")
        ))
        .map((entry) => ({
          key: entry.field,
          label: inferredServiceLabel(entry.field),
          reason: entry.reasoning ?? "This item needs explicit confirmation before it is treated as customer-confirmed.",
          sourceText: entry.source_text,
          confidence: entry.confidence,
        }));
    }

    const items: InferenceItem[] = [];

    if (Number(formValues.number_of_channels ?? 0) > 0 && !liveTvSelected) {
      items.push({
        key: "live_tv",
        label: inferredServiceLabel("live_tv"),
        reason: "Inferred from the request for 85 channels. Please confirm whether linear channel distribution is part of the project.",
      });
    }

    if (catchupSelected && !epgSelected) {
      items.push({
        key: "epg",
        label: inferredServiceLabel("epg"),
        reason: "EPG is typically needed so viewers can browse programme schedules for Catch-up TV.",
      });
    }

    return items;
  }, [backendTrace, catchupSelected, epgSelected, formValues.number_of_channels, liveTvSelected]);

  useEffect(() => {
    setInferenceDecisions((current) => {
      const next: Record<InferenceKey, InferenceDecision> = { live_tv: null, epg: null };
      inferenceItems.forEach((item) => {
        next[item.key] = current[item.key];
      });

      if (current.live_tv === next.live_tv && current.epg === next.epg) {
        return current;
      }

      return next;
    });
  }, [inferenceItems]);

  useEffect(() => {
    setReviewAuditTrace(
      backendTrace.length
        ? buildTraceFromBackend(formValues, backendTrace, inferenceDecisions)
        : buildTrace(formValues, originalMessage, inferenceDecisions),
    );
  }, [backendTrace, formValues, inferenceDecisions, originalMessage]);

  const confirmedSummary = useMemo(
    () => {
      if (backendTrace.length) {
        return backendTrace
          .filter((entry) => entry.state === "explicit" || entry.state === "carried_forward")
          .filter((entry) => !["live_tv", "epg"].includes(entry.field))
          .filter((entry) => entry.field !== "hotel_tv_brand" || hotelSmartTvFlow)
          .filter((entry) => hasValue(entry.value))
          .map((entry) => ({
            field: entry.field,
            value: entry.field === "services" && Array.isArray(entry.value) ? entry.value.filter((service) => service !== "live_tv" && service !== "epg") : entry.value,
            sourceText: entry.source_text,
            state: entry.state,
          }))
          .filter((entry) => hasValue(entry.value));
      }

      return (
        [
          ["project_type", formValues.project_type],
          ["subscribers_or_rooms", formValues.subscribers_or_rooms],
          ["number_of_channels", formValues.number_of_channels],
          ["signal_sources", selectedSources],
          ["services", selectedServices.filter((service) => service !== "live_tv" && service !== "epg")],
          ["viewer_devices", selectedDevices],
          ["hotel_tv_brand", hotelSmartTvFlow ? formValues.hotel_tv_brand : ""],
        ] as Array<[string, unknown]>
      )
        .filter(([, value]) => hasValue(value))
        .map(([field, value]) => ({ field, value, sourceText: deriveSourcePhrase(field, originalMessage), state: "explicit" as const }));
    },
    [backendTrace, formValues, hotelSmartTvFlow, originalMessage, selectedDevices, selectedServices, selectedSources],
  );

  const followUpItems = useMemo(() => {
    const items: FollowUpItem[] = [];
    const addFollowUp = (field: FollowUpFieldKey, question: string, category: ChecklistCategory, reviewed: boolean, complete: boolean) => {
      items.push({
        field,
        question,
        reason: FIELD_REASONS[field],
        category,
        reviewed,
        complete,
      });
    };

    if (hotelSmartTvFlow) {
      const brandReviewed = hasValue(formValues.hotel_tv_brand);
      const modelReviewed = hasValue(formValues.hotel_tv_model);
      addFollowUp(
        "hotel_tv_model",
        "What TV manufacturer and exact model or series will be installed in the hotel rooms?",
        "Compatibility",
        brandReviewed && modelReviewed,
        brandReviewed && modelReviewed,
      );
      addFollowUp(
        "hotel_tv_hospitality_grade",
        "Are the room TVs hospitality/commercial models or standard retail TVs?",
        "Compatibility",
        typeof formValues.hotel_tv_hospitality_grade === "boolean",
        formValues.hotel_tv_hospitality_grade === true,
      );
      addFollowUp(
        "in_property_network_type",
        "How will the in-room TVs receive the service inside the property?",
        "Delivery",
        hasValue(formValues.in_property_network_type),
        isKnownSelection(formValues.in_property_network_type),
      );
    }

    if (mobileSelected) {
      addFollowUp(
        "mobile_viewing_scope",
        "Will mobile viewing stay on hotel Wi-Fi, go outside the property, or both?",
        "Delivery",
        hasValue(formValues.mobile_viewing_scope),
        isKnownSelection(formValues.mobile_viewing_scope),
      );
    }

    if (catchupSelected) {
      addFollowUp(
        "archive_days",
        "How many days of Catch-up retention are required?",
        "Capacity",
        Number(formValues.archive_days ?? 0) > 0,
        Number(formValues.archive_days ?? 0) > 0,
      );
      addFollowUp(
        "channels_to_record",
        "Should Catch-up record all selected channels, or only a subset?",
        "Capacity",
        recordAllChannels !== null || Number(formValues.channels_to_record ?? 0) > 0,
        recordAllChannels === true || Number(formValues.channels_to_record ?? 0) > 0,
      );
    }

    if (projectType === "hotel") {
      addFollowUp(
        "pms_integration_required",
        "Will the project need PMS integration?",
        "Commercial / integration",
        typeof formValues.pms_integration_required === "boolean",
        typeof formValues.pms_integration_required === "boolean",
      );
    }

    addFollowUp(
      "redundancy_required",
      "Is platform redundancy required for this deployment?",
      "Capacity",
      typeof formValues.redundancy_required === "boolean",
      typeof formValues.redundancy_required === "boolean",
    );

    return items;
  }, [catchupSelected, formValues, hotelSmartTvFlow, mobileSelected, projectType, recordAllChannels]);

  const currentFollowUp = followUpItems.find((item) => !item.reviewed) ?? null;

  const checklistByCategory = useMemo(() => {
    const grouped = CATEGORY_LABELS.reduce(
      (accumulator, category) => ({
        ...accumulator,
        [category]: followUpItems.filter((item) => item.category === category && !item.complete),
      }),
      {} as Record<ChecklistCategory, FollowUpItem[]>,
    );

    return grouped;
  }, [followUpItems]);

  const pendingInferences = inferenceItems.filter((item) => inferenceDecisions[item.key] === null);
  const baseIntakeComplete =
    hasValue(formValues.project_type) &&
    hasValue(formValues.subscribers_or_rooms) &&
    hasValue(formValues.number_of_channels) &&
    selectedSources.length > 0 &&
    selectedDevices.length > 0 &&
    selectedServices.length > 0;
  const compatibilityComplete = !hotelSmartTvFlow || (hasValue(formValues.hotel_tv_brand) && hasValue(formValues.hotel_tv_model) && formValues.hotel_tv_hospitality_grade === true);
  const deliveryComplete =
    projectType !== "hotel"
      ? hasValue(determineGenericDelivery(formValues))
      : isKnownSelection(formValues.in_property_network_type) && (!mobileSelected || isKnownSelection(formValues.mobile_viewing_scope));
  const storageComplete =
    !catchupSelected ||
    (Number(formValues.archive_days ?? 0) > 0 &&
      (recordAllChannels === true || Number(formValues.channels_to_record ?? 0) > 0) &&
      typeof formValues.redundancy_required === "boolean");
  const preliminaryReady =
    baseIntakeComplete &&
    compatibilityComplete &&
    deliveryComplete &&
    storageComplete &&
    pendingInferences.length === 0 &&
    !currentFollowUp;

  const firstUnresolvedField = currentFollowUp?.field ?? (pendingInferences.length ? "services" : "average_channel_bitrate_mbps");
  const firstUnresolvedStep = getWizardStepForField(firstUnresolvedField);

  const storageStatusMessage =
    catchupSelected && Number(formValues.archive_days ?? 0) <= 0
      ? "Storage sizing pending"
      : catchupSelected
        ? `${formatValue(formValues.archive_days)} days retained`
        : "Catch-up not selected";

  function setFieldValue(field: string, value: unknown) {
    setFormValues((previous) => ({ ...previous, [field]: value }));
  }

  function updateArrayField(fieldKey: "signal_sources" | "services" | "viewer_devices", optionValue: string, pressed: boolean) {
    const current = normalizeStringArray(formValues[fieldKey]);
    const next = pressed ? [...current, optionValue] : current.filter((item) => item !== optionValue);
    setFieldValue(fieldKey, next);
  }

  function toggleInference(item: InferenceItem, decision: Exclude<InferenceDecision, null>) {
    const currentServices = normalizeStringArray(formValues.services);
    const hasService = currentServices.includes(item.key);
    const nextServices =
      decision === "accepted" ? (hasService ? currentServices : [...currentServices, item.key]) : currentServices.filter((service) => service !== item.key);

    setFormValues((previous) => ({ ...previous, services: nextServices }));
    setInferenceDecisions((previous) => ({ ...previous, [item.key]: decision }));
  }

  function handleRecordAllSelection(value: boolean) {
    setRecordAllChannels(value);
    if (value) {
      setFieldValue("channels_to_record", Number(formValues.number_of_channels ?? 0) || "");
      return;
    }
    setFieldValue("channels_to_record", "");
  }

  function openGuidedConfiguration(targetStep = firstUnresolvedStep) {
    const seedValues = {
      ...formValues,
      delivery_mode: determineGenericDelivery(formValues),
    };

    onUseGuidedConfigurator(seedValues, targetStep);
  }

  return (
    <div className="mx-auto max-w-[1080px] space-y-6">
      <section className="panel p-6 md:p-7">
        <p className="text-sm uppercase tracking-[0.24em] text-blue">Natural-language intake</p>
        <h2 className="mt-2 text-[1.9rem] font-semibold text-ink md:text-[2.3rem]">Customer confirmation</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-600">
          Review the extracted project picture, confirm any suggested interpretations, and answer the next highest-priority question before continuing.
        </p>
      </section>

      <section className="panel p-6 md:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-ink">Readiness snapshot</h3>
            <p className="mt-2 text-sm text-slate-600">The intake is not treated as complete until compatibility, delivery, and storage questions are resolved.</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {preliminaryReady ? "Preliminary recommendation inputs look ready." : "Preliminary recommendation not yet ready."}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <ReadinessCard label="Basic intake complete" ready={baseIntakeComplete} />
          <ReadinessCard label="Compatibility information" ready={compatibilityComplete} readyText="Complete" pendingText="Incomplete" />
          <ReadinessCard label="Delivery design" ready={deliveryComplete} readyText="Complete" pendingText="Incomplete" />
          <ReadinessCard label="Storage sizing" ready={storageComplete} readyText="Complete" pendingText="Incomplete" detail={storageStatusMessage} />
          <ReadinessCard label="Preliminary recommendation" ready={preliminaryReady} readyText="Ready" pendingText="Not yet ready" />
        </div>
      </section>

      <section className="panel p-6 md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-ink">Extracted project summary</h3>
            <p className="mt-2 text-sm text-slate-600">Only confirmed facts from the customer text are shown here.</p>
          </div>
        </div>

        <dl className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {confirmedSummary.map((entry) => (
            <div key={entry.field} className="rounded-3xl border border-slate-200 bg-white px-5 py-4">
              <dt className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <span>{humanize(entry.field)}</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] tracking-[0.14em] text-emerald-700">
                  {entry.state === "carried_forward" ? "Previously confirmed" : "Confirmed"}
                </span>
              </dt>
              <dd className="mt-2 text-base text-ink">
                {Array.isArray(entry.value) ? (
                  <div className="flex flex-wrap gap-2">
                    {entry.value.map((item) => (
                      <span key={item} className="rounded-full border border-slate-200 bg-paper px-3 py-1 text-sm text-ink">
                        {getOptionLabel(options, entry.field, String(item))}
                      </span>
                    ))}
                  </div>
                ) : (
                  formatValue(entry.value)
                )}
              </dd>
              {entry.sourceText ? <p className="mt-2 text-xs text-slate-500">Source: "{entry.sourceText}"</p> : null}
            </div>
          ))}
        </dl>
      </section>

      <section className="panel p-6 md:p-7">
        <h3 className="text-lg font-semibold text-ink">Suggested interpretations</h3>
        <p className="mt-2 text-sm text-slate-600">These items are inferred from the description and need an explicit accept or reject decision.</p>

        <div className="mt-5 space-y-4">
          {inferenceItems.length ? (
            inferenceItems.map((item) => (
              <div key={item.key} className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-semibold text-ink">{item.label}</h4>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-900">
                        Inferred - please confirm
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{item.reason}</p>
                    {item.confidence ? <p className="mt-2 text-xs text-slate-500">Confidence: {item.confidence}</p> : null}
                    {item.sourceText ? <p className="mt-2 text-xs text-slate-500">Source: "{item.sourceText}"</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ToggleButton label="Accept" pressed={inferenceDecisions[item.key] === "accepted"} onClick={() => toggleInference(item, "accepted")} />
                    <ToggleButton label="Reject" pressed={inferenceDecisions[item.key] === "rejected"} onClick={() => toggleInference(item, "rejected")} secondary />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600">No inferred fields are waiting for confirmation.</div>
          )}
        </div>
      </section>

      <section className="panel p-6 md:p-7">
        <h3 className="text-lg font-semibold text-ink">Required follow-up</h3>
        <p className="mt-2 text-sm text-slate-600">One focused question is shown at a time so the matching control is always visible.</p>

        <div className="mt-5 rounded-3xl border border-blue/20 bg-blue-50 p-5">
          {currentFollowUp ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue">Current highest-priority question</p>
                <h4 className="mt-2 text-xl font-semibold text-ink">{currentFollowUp.question}</h4>
                <p className="mt-2 text-sm text-slate-600">{currentFollowUp.reason}</p>
              </div>
              {currentFollowUp.field === "hotel_tv_model" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <FieldInput label="TV manufacturer" value={String(formValues.hotel_tv_brand ?? "")} onChange={(value) => setFieldValue("hotel_tv_brand", value)} />
                  <FieldInput label="TV model or series" value={String(formValues.hotel_tv_model ?? "")} onChange={(value) => setFieldValue("hotel_tv_model", value)} />
                </div>
              ) : null}
              {currentFollowUp.field === "hotel_tv_hospitality_grade" ? (
                <BooleanChoice
                  label="TV type"
                  value={formValues.hotel_tv_hospitality_grade as boolean | undefined}
                  trueLabel="Hospitality / commercial"
                  falseLabel="Retail"
                  onChange={(value) => setFieldValue("hotel_tv_hospitality_grade", value)}
                />
              ) : null}
              {currentFollowUp.field === "in_property_network_type" ? (
                <FieldSelect
                  label="Room-TV delivery"
                  value={String(formValues.in_property_network_type ?? "")}
                  options={ROOM_TV_DELIVERY_OPTIONS}
                  onChange={(value) => setFieldValue("in_property_network_type", value)}
                />
              ) : null}
              {currentFollowUp.field === "mobile_viewing_scope" ? (
                <FieldSelect
                  label="Mobile / web delivery"
                  value={String(formValues.mobile_viewing_scope ?? "")}
                  options={MOBILE_DELIVERY_OPTIONS}
                  onChange={(value) => setFieldValue("mobile_viewing_scope", value)}
                />
              ) : null}
              {currentFollowUp.field === "archive_days" ? (
                <FieldInput
                  label="Retention period in days"
                  value={String(formValues.archive_days ?? "")}
                  type="number"
                  onChange={(value) => setFieldValue("archive_days", value ? Number(value) : "")}
                />
              ) : null}
              {currentFollowUp.field === "channels_to_record" ? (
                <div className="space-y-4">
                  <BooleanChoice
                    label="Record all selected channels?"
                    value={recordAllChannels}
                    trueLabel="Yes"
                    falseLabel="No"
                    onChange={handleRecordAllSelection}
                  />
                  {recordAllChannels === false ? (
                    <FieldInput
                      label="Number of channels to record"
                      value={String(formValues.channels_to_record ?? "")}
                      type="number"
                      onChange={(value) => setFieldValue("channels_to_record", value ? Number(value) : "")}
                    />
                  ) : null}
                  <FieldInput
                    label="Average bitrate (Mbps)"
                    value={String(formValues.average_channel_bitrate_mbps ?? 6)}
                    type="number"
                    helperText="Assumption: 6 Mbps per channel is used until the customer confirms a different bitrate."
                    onChange={(value) => setFieldValue("average_channel_bitrate_mbps", value ? Number(value) : 6)}
                  />
                </div>
              ) : null}
              {currentFollowUp.field === "pms_integration_required" ? (
                <BooleanChoice
                  label="PMS integration required"
                  value={formValues.pms_integration_required as boolean | undefined}
                  trueLabel="Yes"
                  falseLabel="No"
                  onChange={(value) => setFieldValue("pms_integration_required", value)}
                />
              ) : null}
              {currentFollowUp.field === "redundancy_required" ? (
                <BooleanChoice
                  label="Redundancy required"
                  value={formValues.redundancy_required as boolean | undefined}
                  trueLabel="Yes"
                  falseLabel="No"
                  onChange={(value) => setFieldValue("redundancy_required", value)}
                />
              ) : null}
            </div>
          ) : (
            <div className="rounded-3xl border border-emerald-200 bg-white px-5 py-4 text-sm text-slate-700">
              All current extraction follow-up questions have been reviewed. You can continue with guided configuration to finish the remaining project details.
            </div>
          )}
        </div>
      </section>

      <section className="panel p-6 md:p-7">
        <h3 className="text-lg font-semibold text-ink">Remaining required information</h3>
        <p className="mt-2 text-sm text-slate-600">The remaining checklist is grouped by why the information matters.</p>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {CATEGORY_LABELS.map((category) => (
            <div key={category} className="rounded-3xl border border-slate-200 bg-white p-5">
              <h4 className="text-base font-semibold text-ink">{category}</h4>
              {checklistByCategory[category].length ? (
                <ul className="mt-3 space-y-3 text-sm text-slate-600">
                  {checklistByCategory[category].map((item) => (
                    <li key={item.field} className="rounded-2xl bg-paper px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-ink">{humanize(item.field)}</span>
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-900">
                          {item.reviewed ? "Incomplete" : "Missing"}
                        </span>
                      </div>
                      <p className="mt-2">{item.reason}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-600">No open items in this category.</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-6 md:p-7">
        <button
          type="button"
          aria-expanded={advancedDetailsOpen}
          onClick={() => setAdvancedDetailsOpen((current) => !current)}
          className="inline-flex items-center gap-2 text-left text-lg font-semibold text-ink"
        >
          <span>Optional advanced details</span>
          <span className="rounded-full bg-paper px-3 py-1 text-xs font-medium text-slate-600">Collapsed by default</span>
        </button>
        {advancedDetailsOpen ? (
          <div className="mt-5 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FieldSelect
                label="Project type"
                value={String(formValues.project_type ?? "")}
                options={options.project_types}
                onChange={(value) => setFieldValue("project_type", value)}
              />
              <FieldInput
                label={projectType === "hotel" ? "Rooms" : "Rooms or subscribers"}
                value={String(formValues.subscribers_or_rooms ?? "")}
                type="number"
                onChange={(value) => setFieldValue("subscribers_or_rooms", value ? Number(value) : "")}
              />
              <FieldInput
                label="Number of channels"
                value={String(formValues.number_of_channels ?? "")}
                type="number"
                onChange={(value) => setFieldValue("number_of_channels", value ? Number(value) : "")}
              />
              <FieldInput label="Country" value={String(formValues.country ?? "")} onChange={(value) => setFieldValue("country", value)} />
              <FieldInput label="Company name" value={String(formValues.company_name ?? "")} onChange={(value) => setFieldValue("company_name", value)} />
              {!hotelSmartTvFlow && projectType ? (
                <FieldSelect
                  label="Delivery mode"
                  value={String(formValues.delivery_mode ?? "")}
                  options={options.delivery_modes}
                  onChange={(value) => setFieldValue("delivery_mode", value)}
                />
              ) : null}
            </div>

            <ChipGroup
              label="Signal sources"
              options={options.signal_sources}
              values={selectedSources}
              onToggle={(value, pressed) => updateArrayField("signal_sources", value, pressed)}
            />
            <ChipGroup
              label="Required services"
              options={options.services}
              values={selectedServices}
              onToggle={(value, pressed) => updateArrayField("services", value, pressed)}
            />
            <ChipGroup
              label="Viewer devices"
              options={options.viewer_devices}
              values={selectedDevices}
              onToggle={(value, pressed) => updateArrayField("viewer_devices", value, pressed)}
            />

            {hotelSmartTvFlow ? (
              <div className="grid gap-4 md:grid-cols-2">
                <FieldSelect
                  label="Room-TV delivery"
                  value={String(formValues.in_property_network_type ?? "")}
                  options={ROOM_TV_DELIVERY_OPTIONS}
                  onChange={(value) => setFieldValue("in_property_network_type", value)}
                />
                {mobileSelected ? (
                  <FieldSelect
                    label="Mobile / web delivery"
                    value={String(formValues.mobile_viewing_scope ?? "")}
                    options={MOBILE_DELIVERY_OPTIONS}
                    onChange={(value) => setFieldValue("mobile_viewing_scope", value)}
                  />
                ) : null}
              </div>
            ) : null}

            {catchupSelected ? (
              <div className="grid gap-4 md:grid-cols-2">
                <FieldInput
                  label="Retention period in days"
                  type="number"
                  value={String(formValues.archive_days ?? "")}
                  onChange={(value) => setFieldValue("archive_days", value ? Number(value) : "")}
                />
                <FieldInput
                  label="Number of channels to record"
                  type="number"
                  value={String(formValues.channels_to_record ?? "")}
                  onChange={(value) => setFieldValue("channels_to_record", value ? Number(value) : "")}
                />
                <FieldInput
                  label="Average bitrate (Mbps)"
                  type="number"
                  value={String(formValues.average_channel_bitrate_mbps ?? 6)}
                  helperText="Assumption: 6 Mbps per channel."
                  onChange={(value) => setFieldValue("average_channel_bitrate_mbps", value ? Number(value) : 6)}
                />
                <BooleanChoice
                  label="Redundancy required"
                  value={formValues.redundancy_required as boolean | undefined}
                  trueLabel="Yes"
                  falseLabel="No"
                  onChange={(value) => setFieldValue("redundancy_required", value)}
                />
              </div>
            ) : null}

            <FieldTextArea
              label="Additional notes"
              value={String(formValues.additional_project_notes ?? "")}
              onChange={(value) => setFieldValue("additional_project_notes", value)}
            />
          </div>
        ) : null}
      </section>

      <section className="panel p-6 md:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {pendingInferences.length === 0 ? (
            <button
              type="button"
              onClick={() => openGuidedConfiguration(preliminaryReady ? 4 : firstUnresolvedStep)}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
            >
              Confirm extracted details
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => openGuidedConfiguration()}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-ink transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
          >
            Continue with guided configuration
          </button>

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

function ReadinessCard({
  label,
  ready,
  readyText = "Complete",
  pendingText = "Incomplete",
  detail,
}: {
  label: string;
  ready: boolean;
  readyText?: string;
  pendingText?: string;
  detail?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
      <p className="text-sm font-semibold text-ink">{label}</p>
      <p className={clsx("mt-2 text-sm", ready ? "text-emerald-700" : "text-amber-900")}>{ready ? readyText : pendingText}</p>
      {detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}
    </div>
  );
}

function ToggleButton({
  label,
  pressed,
  onClick,
  secondary = false,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
  secondary?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={clsx(
        "min-h-11 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2",
        pressed
          ? secondary
            ? "border border-slate-300 bg-white text-ink"
            : "bg-ink text-white"
          : "border border-slate-300 bg-white text-ink hover:border-slate-400",
      )}
    >
      {label}
    </button>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
  helperText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  helperText?: string;
}) {
  const inputId = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const helperId = `${inputId}-helper`;

  return (
    <div className="space-y-2 text-sm text-slate-700">
      <label htmlFor={inputId} className="block font-medium text-ink">
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={helperText ? helperId : undefined}
        className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
      />
      {helperText ? (
        <span id={helperId} className="block text-xs text-slate-500">
          {helperText}
        </span>
      ) : null}
    </div>
  );
}

function FieldTextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2 text-sm text-slate-700">
      <span className="font-medium text-ink">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
      />
    </label>
  );
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[] | { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2 text-sm text-slate-700">
      <span className="font-medium text-ink">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function BooleanChoice({
  label,
  value,
  trueLabel,
  falseLabel,
  onChange,
}: {
  label: string;
  value: boolean | null | undefined;
  trueLabel: string;
  falseLabel: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="space-y-2 text-sm text-slate-700">
      <p className="font-medium text-ink">{label}</p>
      <div className="flex flex-wrap gap-2">
        <ToggleButton label={trueLabel} pressed={value === true} onClick={() => onChange(true)} />
        <ToggleButton label={falseLabel} pressed={value === false} onClick={() => onChange(false)} secondary />
      </div>
    </div>
  );
}

function ChipGroup({
  label,
  options,
  values,
  onToggle,
}: {
  label: string;
  options: { value: string; label: string }[];
  values: string[];
  onToggle: (value: string, pressed: boolean) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-ink">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => {
          const selected = values.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onToggle(option.value, !selected)}
              className={clsx(
                "min-h-11 rounded-2xl border px-4 py-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2",
                selected ? "border-blue/30 bg-blue-50 text-ink" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
              )}
            >
              {selected ? `Selected: ${option.label}` : option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
