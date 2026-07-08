import { formatEnumLabel } from "@/lib/recommendation-presentation";
import type { ExtractResponse, ReadinessDiagnosis, RequirementCardData, ValidationStatus, WorkflowStepDescriptor } from "@/lib/types";

export const HOME_WORKFLOW_STEPS: WorkflowStepDescriptor[] = [
  {
    id: "intake",
    title: "Intake",
    description: "Describe the project or upload requirements.",
  },
  {
    id: "extraction",
    title: "Requirement Extraction",
    description: "The assistant identifies scale, devices, features, and constraints.",
  },
  {
    id: "rules",
    title: "Rule-Based Recommendation",
    description: "Validated backend rules map needs to NetUP components.",
  },
  {
    id: "report",
    title: "Engineer-Ready Report",
    description: "Generate a structured preliminary report for review.",
  },
] as const;

export const EXAMPLE_PROMPTS = [
  "180-room hotel with LG Smart TVs and 85 TV channels",
  "ISP launching OTT service for 5,000 subscribers",
  "University campus IPTV with live channels and VOD",
  "Hospital TV system with patient-room TVs",
] as const;

type DiagnosisField = {
  id: string;
  title: string;
  fieldKeys: string[];
  detail: string;
};

const DIAGNOSIS_FIELDS: DiagnosisField[] = [
  { id: "project_type", title: "Project Type", fieldKeys: ["project_type"], detail: "Hotel, ISP, campus, hospital, enterprise, or other." },
  { id: "scale", title: "Scale", fieldKeys: ["subscribers_or_rooms", "expected_concurrent_viewers"], detail: "Rooms, subscribers, endpoints, or users." },
  { id: "content_sources", title: "Content Sources", fieldKeys: ["signal_sources"], detail: "Satellite, IP streams, local channels, or VOD sources." },
  { id: "client_devices", title: "Client Devices", fieldKeys: ["viewer_devices"], detail: "Smart TV, STB, mobile, browser, or mixed estate." },
  { id: "delivery_type", title: "Delivery Type", fieldKeys: ["delivery_mode"], detail: "IPTV, OTT, or hybrid delivery approach." },
  { id: "required_features", title: "Required Features", fieldKeys: ["services"], detail: "EPG, catch-up TV, VOD, CAS/DRM, billing, analytics, redundancy." },
  { id: "channel_count", title: "Channel Count", fieldKeys: ["number_of_channels"], detail: "The number of live TV channels in scope." },
  { id: "existing_infrastructure", title: "Existing Infrastructure", fieldKeys: ["existing_equipment", "existing_network_bandwidth_mbps", "available_storage_tb"], detail: "Any available infrastructure, network, or storage details." },
  { id: "redundancy", title: "Redundancy / Reliability", fieldKeys: ["redundancy_required"], detail: "Expected resilience, redundancy, or failover requirements." },
  { id: "constraints", title: "Engineer / Pricing Constraints", fieldKeys: ["budget_range", "target_launch_date", "additional_project_notes"], detail: "Commercial, launch, or engineering constraints." },
];

function hasValue(value: unknown) {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function formatRequirementValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.length ? value.map((item) => formatEnumLabel(String(item))).join(", ") : "Missing";
  }

  if (typeof value === "boolean") return value ? "Confirmed" : "Not required";
  if (typeof value === "number") return new Intl.NumberFormat("en-US").format(value);
  if (typeof value === "string") return value.trim() ? formatEnumLabel(value) : "Missing";
  return "Missing";
}

function findTraceState(trace: ExtractResponse["extraction_trace"], fieldKeys: string[]) {
  return trace.find((entry) => fieldKeys.includes(entry.field));
}

function resolveStatus(
  trace: ExtractResponse["extraction_trace"],
  fieldKeys: string[],
  value: unknown,
  missingRequiredFields: string[],
): ValidationStatus {
  const traceState = findTraceState(trace, fieldKeys);
  if (!hasValue(value)) return "missing";
  if (traceState?.state === "inferred") return "needs_review";
  if (fieldKeys.some((field) => missingRequiredFields.some((item) => item.toLowerCase().includes(field.replaceAll("_", " ").toLowerCase())))) {
    return "needs_review";
  }
  if (traceState?.state === "carried_forward") return "confirmed";
  if (traceState?.state === "explicit") return "detected";
  return "confirmed";
}

export function buildReadinessDiagnosis(
  requirements: Record<string, unknown>,
  trace: ExtractResponse["extraction_trace"] = [],
  missingRequiredFields: string[] = [],
  nextQuestion?: string | null,
): ReadinessDiagnosis {
  const cards: RequirementCardData[] = DIAGNOSIS_FIELDS.map((field) => {
    const values = field.fieldKeys.map((key) => requirements[key]).filter((value) => hasValue(value));
    const displayValue = values.length === 1 ? values[0] : values.length ? values : null;
    const status = resolveStatus(trace, field.fieldKeys, displayValue, missingRequiredFields);

    return {
      id: field.id,
      title: field.title,
      value: formatRequirementValue(displayValue),
      status,
      detail: status === "missing" ? field.detail : null,
      fieldKey: field.fieldKeys[0],
    };
  });

  const completeCount = cards.filter((card) => card.status !== "missing").length;
  const totalCount = cards.length;
  const score = Math.round((completeCount / totalCount) * 100);
  const missingItems = cards.filter((card) => card.status === "missing").map((card) => card.title);

  return {
    score,
    completeCount,
    totalCount,
    missingItems,
    cards: [
      ...cards,
      {
        id: "open_questions",
        title: "Open Questions",
        value: nextQuestion ?? (missingRequiredFields.length ? missingRequiredFields.join(", ") : "No open questions"),
        status: nextQuestion || missingRequiredFields.length ? "needs_review" : "confirmed",
        detail: nextQuestion ? "Highest-priority follow-up item before the engineer review." : null,
      },
    ],
    nextQuestion,
  };
}
