"use client";

import type { WizardFormValues } from "@/lib/schema";
import type { Recommendation } from "@/lib/types";

const ENUM_LABELS: Record<string, string> = {
  hotel: "Hotel",
  hospital: "Hospital",
  university: "University",
  residential_complex: "Residential complex",
  small_provider: "Small IPTV / OTT provider",
  large_operator: "Large IPTV / OTT operator",
  cable_operator: "Cable operator",
  transport: "Transport",
  other: "Other",
  both: "Local network and Internet / OTT",
  local_network: "Local network",
  internet_ott: "Internet / OTT",
  live_tv: "Live TV",
  epg: "EPG",
  catchup_tv: "Catch-up TV",
  time_shift: "Time-shift",
  video_on_demand: "Video on demand",
  billing: "Billing",
  advertising: "Advertising",
  own_tv_channel: "Own TV channel",
  smart_tv: "Smart TV",
  set_top_box: "Set-top box",
  mobile: "Mobile",
  web_browser: "Web browser",
  ip_streams: "Existing IP streams",
  satellite: "Satellite",
  terrestrial: "Terrestrial",
  cable: "Cable",
  asi: "ASI",
  hdmi_sdi: "HDMI / SDI",
  ip: "IP",
  dvb_c_qam: "DVB-C / QAM",
  hotel_wifi_only: "Hotel Wi-Fi only",
  off_property_access: "Outside the property",
  staff_internal_only: "Staff/internal only",
  ethernet: "Ethernet",
  wifi: "Wi-Fi",
  coaxial: "Coaxial cable",
  hybrid: "Hybrid network",
  confirmed: "Confirmed",
  calculated: "Calculated",
  inferred: "Inferred",
  conditional: "Conditional",
  unknown: "Unknown",
  provisional: "Provisional",
};

export type ArchitectureStage = {
  id: string;
  kind: "sources" | "headend" | "core" | "processing" | "output" | "delivery" | "devices";
  label: string;
  items: string[];
};

export function formatEnumLabel(value: string | null | undefined) {
  if (!value) return "Not specified";
  if (ENUM_LABELS[value]) return ENUM_LABELS[value];
  return value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function formatValue(value: unknown) {
  if (Array.isArray(value)) return value.length ? value.map((item) => formatEnumLabel(String(item))).join(", ") : "Not specified";
  if (typeof value === "string") return value ? formatEnumLabel(value) : "Not specified";
  if (typeof value === "number") return formatNumber(value);
  if (value === null || value === undefined || value === "") return "Not specified";
  return String(value);
}

export function formatNumber(value: number, maximumFractionDigits = 2) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return String(value);
  const minimumFractionDigits = maximumFractionDigits === 0 ? 0 : Number.isInteger(numericValue) ? 0 : 1;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numericValue);
}

export function formatGeneratedDate() {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

export function formatRuleVersion(ruleVersion: string) {
  const match = ruleVersion.match(/\d{4}\.\d{2}/);
  return match ? match[0] : ruleVersion;
}

export function buildReferenceNumber(recommendation: Recommendation, submittedValues?: WizardFormValues | null) {
  const source = [recommendation.rule_version, recommendation.project_summary, submittedValues?.project_type, submittedValues?.subscribers_or_rooms].filter(Boolean).join("|");
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) % 100000;
  }
  const datePart = new Intl.DateTimeFormat("en-CA").format(new Date()).replaceAll("-", "");
  return `REC-${datePart}-${String(hash).padStart(5, "0")}`;
}

export function buildReportFileName(referenceNumber: string) {
  return `netup-preliminary-recommendation-${referenceNumber}`;
}

export function buildProjectTitle(submittedValues: WizardFormValues | null | undefined, recommendation: Recommendation) {
  if (!submittedValues?.project_type || !submittedValues.subscribers_or_rooms) {
    return recommendation.project_summary;
  }

  const parts = [
    `${formatEnumLabel(submittedValues.project_type)} solution for ${formatNumber(submittedValues.subscribers_or_rooms, 0)} ${submittedValues.project_type === "hotel" ? "rooms" : submittedValues.project_type === "hospital" ? "rooms / screens" : "subscribers"}`,
  ];

  if (submittedValues.number_of_channels) {
    parts.push(`${formatNumber(submittedValues.number_of_channels, 0)} channels`);
  }

  if (submittedValues.delivery_mode) {
    parts.push(`with ${formatEnumLabel(submittedValues.delivery_mode)} delivery`);
  }

  return parts.join(", ");
}

export function getMatchedConditions(item: Recommendation["recommendations"][number], submittedValues?: WizardFormValues | null) {
  if (!submittedValues) {
    return [];
  }

  const conditions = [
    submittedValues.project_type ? { label: "Project type", value: formatEnumLabel(submittedValues.project_type) } : null,
    submittedValues.subscribers_or_rooms
      ? { label: "Project scale", value: `${formatNumber(submittedValues.subscribers_or_rooms, 0)} ${submittedValues.project_type === "hotel" ? "rooms" : "subscribers"}` }
      : null,
    submittedValues.number_of_channels ? { label: "Channel count", value: `${formatNumber(submittedValues.number_of_channels, 0)} TV channels` } : null,
    submittedValues.delivery_mode ? { label: "Delivery mode", value: formatEnumLabel(submittedValues.delivery_mode) } : null,
    submittedValues.services?.length ? { label: submittedValues.services.length > 1 ? "Selected services" : "Selected service", value: submittedValues.services.map(formatEnumLabel).join(", ") } : null,
    submittedValues.viewer_devices?.length ? { label: "Selected devices", value: submittedValues.viewer_devices.map(formatEnumLabel).join(", ") } : null,
    submittedValues.signal_sources?.length ? { label: "Signal sources", value: submittedValues.signal_sources.map(formatEnumLabel).join(", ") } : null,
    submittedValues.output_type && submittedValues.output_type !== "ip" ? { label: "Output type", value: formatEnumLabel(submittedValues.output_type) } : null,
    submittedValues.adaptive_bitrate_required ? { label: "Adaptive bitrate", value: "Required" } : null,
    submittedValues.hotel_tv_brand ? { label: "Hotel TV brand", value: submittedValues.hotel_tv_brand } : null,
    submittedValues.hotel_tv_model ? { label: "Hotel TV model", value: submittedValues.hotel_tv_model } : null,
    submittedValues.mobile_viewing_scope ? { label: "Mobile scope", value: formatEnumLabel(submittedValues.mobile_viewing_scope) } : null,
  ];

  return conditions.filter((condition): condition is { label: string; value: string } => Boolean(condition));
}

export function getDistinctItems(items: string[]) {
  return Array.from(new Set(items));
}

export function getArchitectureStages(recommendation: Recommendation, submittedValues?: WizardFormValues | null): ArchitectureStage[] {
  if (recommendation.recommended_architecture?.branches?.length) {
    return recommendation.recommended_architecture.branches.flatMap((branch) =>
      branch.nodes.map((node) => ({
        id: `${branch.name}-${node.id}`,
        kind: node.kind.includes("source")
          ? "sources"
          : node.kind.includes("client")
            ? "devices"
            : node.kind.includes("network")
              ? "delivery"
              : node.kind.includes("software") || node.kind.includes("hardware")
                ? "core"
                : "core",
        label: branch.name,
        items: [node.label],
      })),
    );
  }
  if (!submittedValues) return [];

  const stages: ArchitectureStage[] = [];
  const sourceItems = getDistinctItems((submittedValues.signal_sources ?? []).map(formatEnumLabel));
  if (sourceItems.length) {
    stages.push({ id: "sources", kind: "sources", label: "Signal sources", items: sourceItems });
  }

  const productGroups = [
    { kind: "headend" as const, label: "Headend", matcher: (item: Recommendation["recommendations"][number]) => item.category.toLowerCase() === "headend" || item.product.toLowerCase().includes("streamer") || item.category.toLowerCase() === "encoding" },
    { kind: "core" as const, label: "Core platform", matcher: (item: Recommendation["recommendations"][number]) => item.category.toLowerCase().includes("core") },
    { kind: "processing" as const, label: "Media processing", matcher: (item: Recommendation["recommendations"][number]) => item.category.toLowerCase().includes("media processing") || item.product.toLowerCase().includes("processor") },
    { kind: "output" as const, label: "Output layer", matcher: (item: Recommendation["recommendations"][number]) => item.category.toLowerCase().includes("qam output") || item.product.toLowerCase().includes("qam") },
  ];

  for (const group of productGroups) {
    const items = getDistinctItems(
      recommendation.recommendations.filter(group.matcher).map((item) => item.product),
    );
    if (items.length) {
      stages.push({ id: group.kind, kind: group.kind, label: group.label, items });
    }
  }

  const deliveryItems =
    submittedValues.delivery_mode === "both"
      ? ["Local network distribution", "Internet / OTT delivery"]
      : submittedValues.delivery_mode
        ? [submittedValues.delivery_mode === "internet_ott" ? "Internet / OTT delivery" : "Local network distribution"]
        : [];
  if (deliveryItems.length) {
    stages.push({ id: "delivery", kind: "delivery", label: "Delivery", items: deliveryItems });
  }

  const deviceItems = getDistinctItems((submittedValues.viewer_devices ?? []).map(formatEnumLabel));
  if (deviceItems.length) {
    stages.push({ id: "devices", kind: "devices", label: "Viewer devices", items: deviceItems });
  }

  return stages;
}

export function getArchitectureText(stages: ArchitectureStage[]) {
  return stages.map((stage) => `${stage.label}: ${stage.items.join(", ")}`).join(" -> ");
}

export function getVisibleProductWarning(item: Recommendation["recommendations"][number]) {
  if (!item.warning) return null;
  const normalized = item.warning.trim().toLowerCase();
  if (normalized === "requires netup validation.") return null;
  if (normalized === "requires netup validation") return null;
  return item.warning;
}

export function formatMissingInformation(items: string[]) {
  return items.map((item) => formatEnumLabel(item.replace(/\s+/g, "_").toLowerCase()));
}

export function parseBandwidthFormula(formula: string, finalBandwidth: number) {
  const segments = formula.split(/\s+x\s+/i).map((segment) => segment.trim()).filter(Boolean);
  return [...segments, `= ${formatNumber(finalBandwidth)} Mbps`];
}
