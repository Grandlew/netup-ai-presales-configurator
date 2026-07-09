import type { WizardFormValues } from "@/lib/schema";

export type FollowUpOption = {
  value: string;
  label: string;
};

export type ResultsFollowUpDefinition =
  | {
      kind: "text";
      question: string;
      field: keyof WizardFormValues;
      label: string;
      complete: boolean;
    }
  | {
      kind: "number";
      question: string;
      field: keyof WizardFormValues;
      label: string;
      complete: boolean;
      min?: number;
    }
  | {
      kind: "boolean";
      question: string;
      field: keyof WizardFormValues;
      label: string;
      trueLabel: string;
      falseLabel: string;
      complete: boolean;
    }
  | {
      kind: "select";
      question: string;
      field: keyof WizardFormValues;
      label: string;
      options: readonly FollowUpOption[];
      complete: boolean;
    }
  | {
      kind: "multi_select";
      question: string;
      field: keyof WizardFormValues;
      label: string;
      options: readonly FollowUpOption[];
      complete: boolean;
    }
  | {
      kind: "tv_model";
      question: string;
      complete: boolean;
    }
  | {
      kind: "archive_scope";
      question: string;
      complete: boolean;
      recordAllChannels: boolean | null;
    };

export const ROOM_TV_DELIVERY_OPTIONS = [
  { value: "managed_lan_multicast", label: "Managed LAN multicast" },
  { value: "managed_lan_unicast", label: "Managed LAN unicast" },
  { value: "coaxial_dvb_c", label: "Coaxial / DVB-C" },
  { value: "hybrid", label: "Hybrid" },
  { value: "unknown", label: "Unknown" },
] as const;

export const MOBILE_DELIVERY_OPTIONS = [
  { value: "hotel_wifi_only", label: "Hotel Wi-Fi only" },
  { value: "off_property_access", label: "Internet / OTT outside the property" },
  { value: "both", label: "Both" },
  { value: "unknown", label: "Unknown" },
] as const;

export const PROJECT_TYPE_OPTIONS = [
  { value: "hotel", label: "Hotel" },
  { value: "hospital", label: "Hospital" },
  { value: "university", label: "University" },
  { value: "large_operator", label: "Large IPTV / OTT operator" },
  { value: "transport", label: "Transport" },
  { value: "other", label: "Other" },
] as const;

export const SIGNAL_SOURCE_OPTIONS = [
  { value: "satellite", label: "Satellite" },
  { value: "terrestrial", label: "Terrestrial" },
  { value: "cable", label: "Cable" },
  { value: "ip_streams", label: "Existing IP streams" },
  { value: "asi", label: "ASI" },
  { value: "hdmi_sdi", label: "HDMI / SDI" },
] as const;

export const SERVICE_OPTIONS = [
  { value: "live_tv", label: "Live TV" },
  { value: "epg", label: "EPG" },
  { value: "catchup_tv", label: "Catch-up TV" },
  { value: "time_shift", label: "Time-shift" },
  { value: "video_on_demand", label: "Video on demand" },
  { value: "billing", label: "Billing" },
  { value: "advertising", label: "Advertising" },
  { value: "own_channel", label: "Own channel" },
] as const;

export const VIEWER_DEVICE_OPTIONS = [
  { value: "smart_tv", label: "Smart TV" },
  { value: "set_top_box", label: "Set-top box" },
  { value: "mobile", label: "Mobile app" },
  { value: "web_browser", label: "Web browser" },
] as const;

export const DELIVERY_MODE_OPTIONS = [
  { value: "local_network", label: "Local network" },
  { value: "internet_ott", label: "Internet / OTT" },
  { value: "both", label: "Both" },
] as const;

function hasTextValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasPositiveNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function hasSelections(value: unknown) {
  return Array.isArray(value) && value.length > 0;
}

export function getResultsFollowUpDefinition(
  question: string | null | undefined,
  values: WizardFormValues,
): ResultsFollowUpDefinition | null {
  if (!question) {
    return null;
  }

  const channelsToRecord = Number(values.channels_to_record ?? 0);
  const totalChannels = Number(values.number_of_channels ?? 0);
  const recordAllChannels =
    totalChannels > 0 && channelsToRecord >= totalChannels ? true : values.channels_to_record === 0 || channelsToRecord > 0 ? false : null;

  switch (question) {
    case "What TV model or series will be installed in the hotel rooms?":
      return {
        kind: "tv_model",
        question,
        complete: hasTextValue(values.hotel_tv_model),
      };
    case "Are the room TVs hospitality/commercial models or standard retail TVs?":
      return {
        kind: "boolean",
        question,
        field: "hotel_tv_hospitality_grade",
        label: "TV type",
        trueLabel: "Hospitality / commercial",
        falseLabel: "Retail",
        complete: typeof values.hotel_tv_hospitality_grade === "boolean",
      };
    case "Should mobile viewing work only on hotel Wi-Fi, outside the property as well, or both?":
      return {
        kind: "select",
        question,
        field: "mobile_viewing_scope",
        label: "Mobile / web delivery",
        options: MOBILE_DELIVERY_OPTIONS,
        complete: hasTextValue(values.mobile_viewing_scope),
      };
    case "How many days of Catch-up TV should be retained, and should all channels be recorded?":
      return {
        kind: "archive_scope",
        question,
        complete: hasPositiveNumber(values.archive_days) && channelsToRecord > 0,
        recordAllChannels,
      };
    case "Will TV channels reach the rooms over Ethernet, Wi-Fi, coaxial cable, or a hybrid network?":
      return {
        kind: "select",
        question,
        field: "in_property_network_type",
        label: "Room-TV delivery",
        options: ROOM_TV_DELIVERY_OPTIONS,
        complete: hasTextValue(values.in_property_network_type),
      };
    case "Does the hotel require PMS integration for welcome screens, billing, or guest messaging?":
      return {
        kind: "boolean",
        question,
        field: "pms_integration_required",
        label: "PMS integration required",
        trueLabel: "Yes",
        falseLabel: "No",
        complete: typeof values.pms_integration_required === "boolean",
      };
    case "What type of project is this: hotel, hospital, university, operator, transport, or another environment?":
      return {
        kind: "select",
        question,
        field: "project_type",
        label: "Project type",
        options: PROJECT_TYPE_OPTIONS,
        complete: hasTextValue(values.project_type),
      };
    case "How many subscribers, rooms, screens, or endpoints do you plan to serve?":
      return {
        kind: "number",
        question,
        field: "subscribers_or_rooms",
        label: "Rooms or subscribers",
        complete: hasPositiveNumber(values.subscribers_or_rooms),
        min: 1,
      };
    case "How many TV channels do you expect to distribute?":
      return {
        kind: "number",
        question,
        field: "number_of_channels",
        label: "TV channels",
        complete: hasPositiveNumber(values.number_of_channels),
        min: 1,
      };
    case "Which signal sources will you use: satellite, terrestrial, cable, existing IP streams, ASI, or HDMI/SDI?":
      return {
        kind: "multi_select",
        question,
        field: "signal_sources",
        label: "Signal sources",
        options: SIGNAL_SOURCE_OPTIONS,
        complete: hasSelections(values.signal_sources),
      };
    case "Which services do you need, such as live TV, EPG, catch-up TV, time-shift, VoD, billing, advertising, or your own channel?":
      return {
        kind: "multi_select",
        question,
        field: "services",
        label: "Required services",
        options: SERVICE_OPTIONS,
        complete: hasSelections(values.services),
      };
    case "Which end-user devices must be supported: smart TVs, set-top boxes, mobile apps, web browsers, or a mix?":
      return {
        kind: "multi_select",
        question,
        field: "viewer_devices",
        label: "Viewer devices",
        options: VIEWER_DEVICE_OPTIONS,
        complete: hasSelections(values.viewer_devices),
      };
    case "Will delivery stay on a local network, go over OTT/internet, or both?":
      return {
        kind: "select",
        question,
        field: "delivery_mode",
        label: "Delivery mode",
        options: DELIVERY_MODE_OPTIONS,
        complete: hasTextValue(values.delivery_mode),
      };
    default:
      return null;
  }
}
