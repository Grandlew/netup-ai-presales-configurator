import React from "react";

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import HomePage from "@/app/page";
import ResultsPage from "@/app/results/page";
import ReviewPage from "@/app/review/page";
import { ConversationPanel } from "@/components/conversation-panel";
import { ResultsPanel } from "@/components/results-panel";
import { Wizard } from "@/components/wizard";
import type { WizardFormValues } from "@/lib/schema";
import { api } from "@/lib/api";
import { consumeHomeNavigationIntent, getResultsPayload, getReviewPayload, setResultsPayload, setReviewPayload } from "@/lib/flow-storage";
import type { ConfigOptionsResponse, ExtractResponse, Recommendation } from "@/lib/types";

const routerPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPush,
  }),
}));

vi.mock("@/lib/api", () => ({
  api: {
    options: vi.fn(),
    recommend: vi.fn(),
    createLead: vi.fn(),
    createReport: vi.fn(),
    downloadReport: vi.fn(),
    extract: vi.fn(),
  },
}));

const options: ConfigOptionsResponse = {
  project_types: [
    { value: "hotel", label: "Hotel" },
    { value: "large_operator", label: "Large IPTV / OTT Operator" },
  ],
  signal_sources: [
    { value: "satellite", label: "Satellite" },
    { value: "ip_streams", label: "Existing IP Streams" },
  ],
  services: [
    { value: "live_tv", label: "Live TV" },
    { value: "epg", label: "EPG" },
    { value: "catchup_tv", label: "Catch-up TV" },
    { value: "video_on_demand", label: "Video on demand" },
  ],
  viewer_devices: [
    { value: "smart_tv", label: "Smart TVs" },
    { value: "mobile", label: "Mobile applications" },
  ],
  delivery_modes: [
    { value: "both", label: "Both" },
    { value: "local_network", label: "Local network" },
  ],
  output_types: [{ value: "ip", label: "IP" }],
  disclaimer:
    "This configurator provides a preliminary recommendation. Final equipment, licensing, capacity, compatibility, redundancy, and pricing must be validated by a NetUP engineer.",
  data_retention_note: "Retention note",
};

const recommendationResponse: Recommendation = {
  project_summary: "180-room hotel IPTV deployment",
  recommendations: [
    {
      canonical_product_id: "iptv_combine_8x",
      product: "NetUP IPTV Combine 8x",
      category: "Core",
      object_type: "Hardware appliance",
      role_summary: "Core hotel TV and IPTV platform",
      reason: "Fits project scope.",
      rule_id: "hotel-core-01",
      claim_status: "provisional",
      provided_capabilities: ["dvb_reception", "ip_ingestion", "core_iptv_platform"],
      conditions: ["Final compatibility requires engineering review."],
      evidence_ids: ["ref_combine_page"],
      validation_status: "Requires NetUP validation",
      warning: "Validate firmware compatibility for final deployment.",
    },
  ],
  capacity: {
    assumed_concurrent_viewers: 100,
    delivery_assumption: "Local network multicast with OTT-ready sizing guardrails.",
    unicast_bandwidth_formula: "100 viewers x 6 Mbps x safety factor",
    base_bandwidth_mbps: 600,
    safety_adjusted_bandwidth_mbps: 806.4,
    source_ingest_bandwidth_mbps: 510,
    core_network_multicast_bandwidth_mbps: null,
    local_unicast_access_bandwidth_mbps: null,
    ott_origin_egress_bandwidth_mbps: 806.4,
    per_viewer_bandwidth_mbps: 6,
    storage_ingest_bandwidth_mbps: null,
    estimated_archive_storage_tb: 38.56,
    safety_adjusted_archive_storage_tb: 48.81,
    storage_status: "calculated",
    storage_status_message: null,
    archive_scope_summary: "85 channels recorded for 7 days.",
    assumptions: ["Assumes standard HD channel mix."],
  },
  warnings: ["Confirm final Smart TV firmware compatibility during engineering review."],
  missing_information: [],
  missing_information_items: [],
  assumptions: ["Archive retention will be confirmed with the customer."],
  readiness: {
    intake_complete: true,
    preliminary_recommendation_ready: true,
    capacity_estimate_ready: true,
    compatibility_review_ready: false,
    engineering_review_required: true,
    quotation_ready: false,
  },
  claim_statements: [
    {
      claim: "Native Smart TV delivery may avoid external set-top boxes.",
      status: "conditional",
      conditions: ["Supported TV platform"],
      evidence_ids: ["ref_smarttv_clients"],
      notes: "Compatibility depends on the selected TV platform.",
    },
  ],
  official_references: [
    {
      id: "ref_smarttv_clients",
      title: "NetUP SmartTV - IPTV application for smart TVs",
      url: "https://www.netup.tv/en/clients/smarttv.shtml",
      extracted_capability: "Smart TV applications for Samsung Tizen, LG WebOS, and Android TV platforms.",
      confidence: "confirmed",
      reviewed_status: "pending_netup_validation",
    },
  ],
  recommended_architecture: {
    name: "Preliminary recommended architecture",
    status: "conditional",
    preference: "recommended",
    reason: "Selected to cover the current requirements.",
    tradeoffs: [],
    information_required: [],
    branches: [
      {
        name: "In-room TV delivery",
        status: "conditional",
        note: "Managed hotel network path.",
        nodes: [
          { id: "sources", label: "Existing IP streams", kind: "customer-owned source", status: "confirmed", details: [] },
          { id: "core", label: "NetUP IPTV Combine 8x", kind: "NetUP hardware", status: "inferred", details: [] },
          { id: "devices", label: "Smart TV, Set-top box", kind: "client application/device", status: "conditional", details: [] },
        ],
      },
    ],
  },
  alternative_architectures: [],
  next_question: "What TV model or series will be installed in the hotel rooms?",
  audit_trace: {},
  rule_version: "2026.06-mvp",
  requires_engineer_review: true,
};

const submittedValues: WizardFormValues = {
  project_type: "hotel",
  country: "United States",
  company_name: "NetUP Partner",
  subscribers_or_rooms: 180,
  number_of_channels: 85,
  signal_sources: ["ip_streams"],
  services: ["live_tv"],
  archive_days: 0,
  estimated_vod_library_size_tb: 0,
  need_subscriber_packages: false,
  need_local_advertising: false,
  viewer_devices: ["smart_tv", "set_top_box"],
  delivery_mode: "local_network",
  adaptive_bitrate_required: false,
  output_type: "ip",
  expected_concurrent_viewers: 100,
  average_channel_bitrate_mbps: 6,
  available_storage_tb: 50,
  redundancy_required: false,
  existing_network_bandwidth_mbps: 1000,
  existing_equipment: "",
  target_launch_date: "2026-09-01",
  budget_range: "$50k-$100k",
  contact_name: "Jane Doe",
  email: "jane@example.com",
  company: "NetUP Partner",
  phone: "+1 555 0100",
  additional_project_notes: "",
  consent_given: true,
};

const conversationTrace: ExtractResponse["extraction_trace"] = [
  { field: "project_type", value: "hotel", source_text: "hotel", confidence: "high", state: "explicit", requires_confirmation: false, reasoning: null },
  { field: "subscribers_or_rooms", value: 180, source_text: "180-room hotel", confidence: "high", state: "explicit", requires_confirmation: false, reasoning: null },
  { field: "number_of_channels", value: 85, source_text: "85 satellite and IP channels", confidence: "high", state: "explicit", requires_confirmation: false, reasoning: null },
  { field: "signal_sources", value: ["satellite", "ip_streams"], source_text: "satellite and IP channels", confidence: "medium", state: "explicit", requires_confirmation: false, reasoning: null },
  { field: "services", value: ["catchup_tv"], source_text: "catch-up TV", confidence: "high", state: "explicit", requires_confirmation: false, reasoning: null },
  { field: "viewer_devices", value: ["smart_tv", "mobile"], source_text: "LG Smart TVs and mobile viewing", confidence: "high", state: "explicit", requires_confirmation: false, reasoning: null },
  { field: "live_tv", value: "live_tv", source_text: "85 satellite and IP channels", confidence: "medium", state: "inferred", requires_confirmation: true, reasoning: "Channel count strongly suggests linear TV delivery, but the service was not stated explicitly." },
  { field: "epg", value: "epg", source_text: "catch-up TV", confidence: "medium", state: "inferred", requires_confirmation: true, reasoning: "Catch-up TV usually depends on EPG data for programme navigation." },
];

const reviewExtractResponse: ExtractResponse = {
  extracted_requirements: {
    project_type: "hotel",
    subscribers_or_rooms: 180,
    number_of_channels: 85,
    signal_sources: ["satellite", "ip_streams"],
    services: ["catchup_tv"],
    viewer_devices: ["smart_tv", "mobile"],
  },
  extraction_trace: conversationTrace,
  missing_required_fields: ["Delivery mode"],
  next_question: "What TV model or series will be installed in the hotel rooms?",
  ready_for_recommendation: false,
  ai_available: true,
  extraction_succeeded: true,
  error_code: null,
  message: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  window.sessionStorage.clear();
  vi.mocked(api.options).mockResolvedValue(options);
  vi.mocked(api.recommend).mockResolvedValue(recommendationResponse);
  vi.mocked(api.createLead).mockResolvedValue({ id: "lead-1" });
  vi.mocked(api.createReport).mockResolvedValue({ id: "report-1", generated_content: "<html><body>Report</body></html>" });
  vi.mocked(api.downloadReport).mockResolvedValue(new Blob(["report"], { type: "application/pdf" }));
  vi.mocked(api.extract).mockResolvedValue({
    extracted_requirements: {
      project_type: "hotel",
      subscribers_or_rooms: 180,
    },
    extraction_trace: [
      { field: "project_type", value: "hotel", source_text: "hotel", confidence: "high", state: "explicit", requires_confirmation: false, reasoning: null },
      { field: "subscribers_or_rooms", value: 180, source_text: "180-room hotel", confidence: "high", state: "explicit", requires_confirmation: false, reasoning: null },
      { field: "number_of_channels", value: null, source_text: null, confidence: "low", state: "missing", requires_confirmation: true, reasoning: "Number of TV channels is still missing from the intake." },
    ],
    missing_required_fields: ["Number of channels"],
    next_question: "How many TV channels do you expect to distribute?",
    ready_for_recommendation: false,
    ai_available: true,
    extraction_succeeded: true,
    error_code: null,
    message: null,
  });
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

async function goToContactStep(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByRole("combobox", { name: /Project type/i }), "hotel");
  await user.type(screen.getByRole("spinbutton", { name: /Number of rooms/i }), "180");
  await user.click(screen.getByRole("button", { name: "Next" }));

  await user.type(screen.getByRole("spinbutton", { name: /Number of TV channels/i }), "85");
  await user.click(screen.getByRole("checkbox", { name: /Satellite/i }));
  await user.click(screen.getByRole("button", { name: "Next" }));

  await user.click(screen.getByRole("checkbox", { name: /Live TV/i }));
  await user.click(screen.getByRole("checkbox", { name: /Catch-up TV/i }));
  await user.click(screen.getByRole("checkbox", { name: /Video on demand/i }));
  await user.type(await screen.findByRole("spinbutton", { name: /Archive duration in days/i }), "7");
  await user.click(screen.getByRole("button", { name: "Next" }));

  await user.click(screen.getByRole("checkbox", { name: /Smart TVs/i }));
  await user.click(screen.getByRole("checkbox", { name: /Mobile applications/i }));
  await user.selectOptions(screen.getByRole("combobox", { name: /Delivery mode/i }), "both");
  await user.click(screen.getByRole("button", { name: "Next" }));

  await user.type(screen.getByRole("spinbutton", { name: /Expected concurrent viewers/i }), "100");
  await user.click(screen.getByRole("button", { name: "Next" }));
}

async function fillContactDetails(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole("textbox", { name: /Contact name/i }), "Jane Doe");
  await user.type(screen.getByRole("textbox", { name: /Work email/i }), "jane@example.com");
  await user.type(screen.getByRole("textbox", { name: /Company/i }), "NetUP Partner");
  await user.type(screen.getByRole("textbox", { name: /Phone/i }), "+1 555 0100");
  await user.click(screen.getByRole("checkbox", { name: /I consent to submitting this presales request/i }));
}

describe("Wizard", () => {
  it("updates the audience label by project type", async () => {
    const user = userEvent.setup();
    render(<Wizard options={options} />);

    await user.selectOptions(screen.getByRole("combobox", { name: /Project type/i }), "hotel");

    expect(screen.getByText("Number of rooms")).toBeInTheDocument();
  });

  it("keeps validation errors hidden until the user attempts to continue", () => {
    render(<Wizard options={options} />);

    expect(screen.queryByText("Select a project type.")).not.toBeInTheDocument();
    expect(screen.queryByText("Enter the number of rooms or subscribers.")).not.toBeInTheDocument();
  });

  it("shows step errors after Next is clicked, focuses the first invalid field, and clears errors when corrected", async () => {
    const user = userEvent.setup();
    render(<Wizard options={options} />);

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByText("Select a project type.")).toBeInTheDocument();
    expect(screen.getByText("Enter the number of rooms or subscribers.")).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole("combobox", { name: /Project type/i }));

    await user.selectOptions(screen.getByRole("combobox", { name: /Project type/i }), "hotel");
    await user.clear(screen.getByRole("spinbutton", { name: /Number of rooms/i }));
    await user.type(screen.getByRole("spinbutton", { name: /Number of rooms/i }), "180");
    await user.tab();

    await waitFor(() => {
      expect(screen.queryByText("Select a project type.")).not.toBeInTheDocument();
      expect(screen.queryByText("Enter the number of rooms or subscribers.")).not.toBeInTheDocument();
    });
  });

  it("allows navigation back to completed steps and blocks future-step navigation", async () => {
    const user = userEvent.setup();
    render(<Wizard options={options} />);

    await user.selectOptions(screen.getByRole("combobox", { name: /Project type/i }), "hotel");
    await user.type(screen.getByRole("spinbutton", { name: /Number of rooms/i }), "180");
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getAllByRole("button", { name: /^Services$/i })[0]).toBeDisabled();

    await user.click(screen.getAllByRole("button", { name: /^Profile(, completed)?$/i })[0]);

    expect(screen.getByRole("heading", { name: "Project profile" })).toBeInTheDocument();
  });

  it("shows a storage icon label and splits budget range into from and to inputs", async () => {
    const user = userEvent.setup();
    render(<Wizard options={options} />);

    await user.selectOptions(screen.getByRole("combobox", { name: /Project type/i }), "hotel");
    await user.type(screen.getByRole("spinbutton", { name: /Number of rooms/i }), "180");
    await user.click(screen.getByRole("button", { name: "Next" }));

    await user.type(screen.getByRole("spinbutton", { name: /Number of TV channels/i }), "85");
    await user.click(screen.getByRole("checkbox", { name: /Satellite/i }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    await user.click(screen.getByRole("checkbox", { name: /Live TV/i }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    await user.click(screen.getByRole("checkbox", { name: /Smart TVs/i }));
    await user.selectOptions(screen.getByRole("combobox", { name: /Delivery mode/i }), "both");
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByRole("spinbutton", { name: /Available storage \(TB\)/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "From" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "To" })).toBeInTheDocument();
  });

  it("keeps the consent error hidden until generate is clicked and then shows it below the consent label", async () => {
    const user = userEvent.setup();
    render(<Wizard options={options} />);

    await goToContactStep(user);

    expect(screen.queryByText("Consent is required before submitting the request.")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Generate preliminary recommendation" }));

    const error = await screen.findByText("Consent is required before submitting the request.");
    expect(error).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /I consent to submitting this presales request/i })).toHaveAttribute("aria-invalid", "true");
  });

  it("shows a loading state while generating the recommendation and then routes to the results page", async () => {
    const user = userEvent.setup();
    let resolveRecommend: (value: typeof recommendationResponse) => void = () => undefined;
    vi.mocked(api.recommend).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRecommend = resolve;
        }),
    );

    render(<Wizard options={options} />);
    await goToContactStep(user);
    await fillContactDetails(user);

    await user.click(screen.getByRole("button", { name: "Generate preliminary recommendation" }));

    expect(screen.getByRole("button", { name: /Generating preliminary recommendation/i })).toBeDisabled();

    resolveRecommend(recommendationResponse);

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/results");
    });
    expect(getResultsPayload()?.recommendation.project_summary).toBe("180-room hotel IPTV deployment");
  });

  it("preserves form data after a failed recommendation request", async () => {
    const user = userEvent.setup();
    vi.mocked(api.recommend).mockRejectedValueOnce(new Error("Backend offline"));

    render(<Wizard options={options} />);
    await goToContactStep(user);
    await fillContactDetails(user);

    await user.click(screen.getByRole("button", { name: "Generate preliminary recommendation" }));

    expect(await screen.findByText("We could not generate the recommendation. Please check that the backend is running and try again.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Contact details" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /Contact name/i })).toHaveValue("Jane Doe");
    expect(screen.getByRole("textbox", { name: /Work email/i })).toHaveValue("jane@example.com");
    expect(screen.getByRole("checkbox", { name: /I consent to submitting this presales request/i })).toBeChecked();
  }, 10000);

  it("resets the wizard when backing out from the first step", async () => {
    const user = userEvent.setup();
    const onStartOver = vi.fn();
    render(<Wizard options={options} onStartOver={onStartOver} />);

    await user.selectOptions(screen.getByRole("combobox", { name: /Project type/i }), "hotel");
    await user.type(screen.getByRole("spinbutton", { name: /Number of rooms/i }), "180");
    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(screen.getByRole("heading", { name: "Project profile" })).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 7")).toBeInTheDocument();
    expect(onStartOver).toHaveBeenCalledTimes(1);
  });

  it("renders compact mobile progress text", () => {
    render(<Wizard options={options} />);

    expect(screen.getByText("Step 1 of 7")).toBeInTheDocument();
    expect(screen.getAllByText("Project profile").length).toBeGreaterThan(0);
  }, 10000);

  it("renders all seven progress steps without repeating the long disclaimer", () => {
    const { container } = render(<Wizard options={options} />);

    expect(screen.getByTestId("desktop-progress")).toHaveClass("xl:grid-cols-7");
    expect(screen.getByTestId("desktop-progress-compact")).toHaveClass("md:grid", "xl:hidden");
    expect(container.firstChild).toHaveClass("space-y-6");
    expect(screen.getAllByRole("button", { name: /Profile|Sources|Services|Delivery|Capacity|Contact|Results/i })).toHaveLength(14);
    expect(screen.queryByText(options.disclaimer)).not.toBeInTheDocument();
  }, 10000);

  it("renders recommendation cards, capacity cards, and missing information on the results page", async () => {
    setResultsPayload({
      recommendation: recommendationResponse as Recommendation,
      submittedValues,
    });

    render(<ResultsPage />);

    expect(await screen.findByRole("heading", { name: "Recommended product families" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Capacity estimates" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Missing decision-critical information" })).toBeInTheDocument();
    expect(screen.getAllByText("NetUP IPTV Combine 8x").length).toBeGreaterThan(0);
    expect(screen.getAllByText("806.4 Mbps").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("capacity-card")).toHaveLength(3);
  }, 10000);

  it("retries recommendation generation after an API failure and preserves state", async () => {
    const user = userEvent.setup();
    vi.mocked(api.recommend)
      .mockRejectedValueOnce(new Error("Backend offline"))
      .mockResolvedValueOnce(recommendationResponse);

    render(<Wizard options={options} />);
    await goToContactStep(user);
    await fillContactDetails(user);

    await user.click(screen.getByRole("button", { name: "Generate preliminary recommendation" }));
    expect(await screen.findByRole("button", { name: "Retry" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/results");
    });
    expect(api.recommend).toHaveBeenCalledTimes(2);
  }, 10000);
});

describe("ConversationPanel", () => {
  it("passes successful extraction results to the review flow", async () => {
    const user = userEvent.setup();
    const onExtractionSuccess = vi.fn();
    render(<ConversationPanel onExtractionSuccess={onExtractionSuccess} />);

    await user.type(screen.getByPlaceholderText(/We have a 180-room hotel/i), "Hotel project");
    await user.click(screen.getByRole("button", { name: "Extract requirements" }));

    await waitFor(() => {
      expect(onExtractionSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it("keeps the guided configurator available after a failed extraction and preserves textarea content", async () => {
    const user = userEvent.setup();
    const onUseGuidedConfigurator = vi.fn();
    vi.mocked(api.extract).mockResolvedValueOnce({
      extracted_requirements: {},
      extraction_trace: [],
      missing_required_fields: [],
      next_question: null,
      ready_for_recommendation: false,
      ai_available: true,
      extraction_succeeded: false,
      error_code: "openai_request_failed",
      message: "We could not extract the project requirements. Please try again.",
    });

    render(<ConversationPanel onUseGuidedConfigurator={onUseGuidedConfigurator} />);

    await user.type(screen.getByPlaceholderText(/We have a 180-room hotel/i), "Hotel project with LG TVs");
    await user.click(screen.getByRole("button", { name: "Extract requirements" }));

    await waitFor(() => {
      expect(screen.getByText("We could not extract the project requirements. Please try again.")).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText(/We have a 180-room hotel/i)).toHaveValue("Hotel project with LG TVs");
    expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Use guided configurator" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Use guided configurator" }));
    expect(onUseGuidedConfigurator).toHaveBeenCalledTimes(1);
  });

  it("retries after a failed extraction request", async () => {
    const user = userEvent.setup();
    const onExtractionSuccess = vi.fn();
    vi.mocked(api.extract).mockResolvedValueOnce({
      extracted_requirements: {},
      extraction_trace: [],
      missing_required_fields: [],
      next_question: null,
      ready_for_recommendation: false,
      ai_available: true,
      extraction_succeeded: false,
      error_code: "openai_timeout",
      message: "The extraction request timed out. Please try again.",
    });
    vi.mocked(api.extract).mockResolvedValueOnce({
      extracted_requirements: {
        project_type: "hotel",
        signal_source_details: {
          smart_tv_brand: "LG",
        },
        signal_sources: ["ip_streams"],
        services: ["catchup_tv"],
      },
      extraction_trace: [
        { field: "project_type", value: "hotel", source_text: "hotel", confidence: "high", state: "explicit", requires_confirmation: false, reasoning: null },
        { field: "signal_sources", value: ["ip_streams"], source_text: "IP", confidence: "medium", state: "explicit", requires_confirmation: false, reasoning: null },
        { field: "services", value: ["catchup_tv"], source_text: "catch-up TV", confidence: "high", state: "explicit", requires_confirmation: false, reasoning: null },
      ],
      missing_required_fields: ["Rooms or subscribers"],
      next_question: "How many subscribers, rooms, screens, or endpoints do you plan to serve?",
      ready_for_recommendation: false,
      ai_available: true,
      extraction_succeeded: true,
      error_code: null,
      message: null,
    });

    render(<ConversationPanel onExtractionSuccess={onExtractionSuccess} />);

    await user.type(screen.getByPlaceholderText(/We have a 180-room hotel/i), "Hotel project");
    await user.click(screen.getByRole("button", { name: "Extract requirements" }));

    await waitFor(() => {
      expect(screen.getByText("The extraction request timed out. Please try again.")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(onExtractionSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it("shows AI unavailable only when the service is not configured", async () => {
    const user = userEvent.setup();
    vi.mocked(api.extract).mockResolvedValueOnce({
      extracted_requirements: {},
      extraction_trace: [],
      missing_required_fields: [],
      next_question: null,
      ready_for_recommendation: false,
      ai_available: false,
      extraction_succeeded: false,
      error_code: "ai_not_configured",
      message: "Natural-language intake is currently unavailable because the AI service is not configured.",
    });

    render(<ConversationPanel />);

    await user.type(screen.getByPlaceholderText(/We have a 180-room hotel/i), "Hotel project");
    await user.click(screen.getByRole("button", { name: "Extract requirements" }));

    await waitFor(() => {
      expect(screen.getByText("Natural-language intake is currently unavailable because the AI service is not configured.")).toBeInTheDocument();
    });

    expect(screen.getByText("You can continue with the guided configurator.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Extract requirements" })).toBeDisabled();
  });

  it("does not show AI unavailable when the AI is configured but the request fails", async () => {
    const user = userEvent.setup();
    vi.mocked(api.extract).mockResolvedValueOnce({
      extracted_requirements: {},
      extraction_trace: [],
      missing_required_fields: [],
      next_question: null,
      ready_for_recommendation: false,
      ai_available: true,
      extraction_succeeded: false,
      error_code: "openai_request_failed",
      message: "We could not extract the project requirements. Please try again.",
    });

    render(<ConversationPanel />);

    await user.type(screen.getByPlaceholderText(/We have a 180-room hotel/i), "Hotel project");
    await user.click(screen.getByRole("button", { name: "Extract requirements" }));

    await waitFor(() => {
      expect(screen.getByText("We could not extract the project requirements. Please try again.")).toBeInTheDocument();
    });

    expect(screen.queryByText("Natural-language intake is currently unavailable because the AI service is not configured.")).not.toBeInTheDocument();
    expect(screen.queryByText("You can continue with the guided configurator.")).not.toBeInTheDocument();
  });
});

describe("ResultsPanel", () => {
  it("renders human-readable enum labels throughout the results", () => {
    render(
      <ResultsPanel
        recommendation={recommendationResponse as Recommendation}
        submittedValues={{ ...submittedValues, delivery_mode: "internet_ott", services: ["live_tv"], viewer_devices: ["smart_tv", "set_top_box"], signal_sources: ["ip_streams"] }}
        reportHtml="<html><body>Report</body></html>"
        reportReady={true}
        reportFileName="netup-preliminary-recommendation-REC-20260625-12345"
        onRequestEngineeringReview={vi.fn()}
        onSaveLead={vi.fn()}
        onPrintReport={vi.fn()}
        onDownloadPdf={vi.fn()}
        onDownloadWord={vi.fn()}
        onStartOver={vi.fn()}
        onEditConfiguration={vi.fn()}
        leadSaved={false}
        loadingAction={false}
      />,
    );

    expect(screen.getAllByText("Internet / OTT").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Live TV").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Smart TV, Set-top box").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Existing IP streams").length).toBeGreaterThan(0);
  });

  it("shows a formatted generated date and recommendation reference number", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-06-25T10:30:00Z"));

      render(
      <ResultsPanel
          recommendation={recommendationResponse as Recommendation}
          submittedValues={submittedValues}
          reportReady={false}
          reportFileName="netup-preliminary-recommendation-REC-20260625-12345"
          onRequestEngineeringReview={vi.fn()}
          onSaveLead={vi.fn()}
          onPrintReport={vi.fn()}
          onDownloadPdf={vi.fn()}
          onDownloadWord={vi.fn()}
          onStartOver={vi.fn()}
          onEditConfiguration={vi.fn()}
          leadSaved={false}
          loadingAction={false}
        />,
      );

      expect(screen.getByText("June 25, 2026")).toBeInTheDocument();
      expect(screen.getByText(/^REC-20260625-\d{5}$/)).toBeInTheDocument();
      expect(screen.getByText("Recommendation rules version")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows expanded rule details instead of repeating the reason", () => {
    render(
        <ResultsPanel
          recommendation={recommendationResponse as Recommendation}
          submittedValues={submittedValues}
          reportReady={false}
          reportFileName="netup-preliminary-recommendation-REC-20260625-12345"
          onRequestEngineeringReview={vi.fn()}
          onSaveLead={vi.fn()}
          onPrintReport={vi.fn()}
          onDownloadPdf={vi.fn()}
          onDownloadWord={vi.fn()}
          onStartOver={vi.fn()}
          onEditConfiguration={vi.fn()}
          leadSaved={false}
          loadingAction={false}
      />,
    );

    expect(screen.getAllByText("Why this was selected").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Project type").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Hotel").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Delivery mode").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Local network").length).toBeGreaterThan(0);
    expect(screen.queryByText("Matched rule reference")).not.toBeInTheDocument();
    expect(screen.queryByText("hotel-core-01")).not.toBeInTheDocument();
  });

  it("renders the deterministic architecture diagram without unknown placeholder nodes", () => {
    render(
      <ResultsPanel
        recommendation={recommendationResponse as Recommendation}
        submittedValues={submittedValues}
        reportReady={false}
        reportFileName="netup-preliminary-recommendation-REC-20260625-12345"
        onRequestEngineeringReview={vi.fn()}
        onSaveLead={vi.fn()}
        onPrintReport={vi.fn()}
        onDownloadPdf={vi.fn()}
        onDownloadWord={vi.fn()}
        onStartOver={vi.fn()}
        onEditConfiguration={vi.fn()}
        leadSaved={false}
        loadingAction={false}
      />,
    );

    expect(screen.getByTestId("architecture-diagram")).toBeInTheDocument();
    expect(screen.getAllByText("Existing IP streams").length).toBeGreaterThan(0);
    expect(screen.getAllByText("NetUP IPTV Combine 8x").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Smart TV, Set-top box").length).toBeGreaterThan(0);
    expect(screen.queryByText(/unknown/i)).not.toBeInTheDocument();
  });

  it("keeps a single start-over action and orders the action buttons as specified", () => {
    render(
      <ResultsPanel
        recommendation={recommendationResponse as Recommendation}
        submittedValues={submittedValues}
        reportReady={false}
        reportFileName="netup-preliminary-recommendation-REC-20260625-12345"
        onRequestEngineeringReview={vi.fn()}
        onSaveLead={vi.fn()}
        onPrintReport={vi.fn()}
        onDownloadPdf={vi.fn()}
        onDownloadWord={vi.fn()}
        onStartOver={vi.fn()}
        onEditConfiguration={vi.fn()}
        leadSaved={false}
        loadingAction={false}
      />,
    );

    const actionButtons = screen.getByTestId("actions-card").querySelectorAll("button");
    expect(screen.getAllByRole("button", { name: "Start over" })).toHaveLength(1);
    expect(Array.from(actionButtons).map((button) => button.textContent?.trim())).toEqual([
      "Request engineering review",
      "Download preliminary report",
      "Save lead",
      "Edit configuration",
      "Start over",
    ]);
  });

  it("uses the generated report filename for the HTML preview download", () => {
    render(
      <ResultsPanel
        recommendation={recommendationResponse as Recommendation}
        submittedValues={submittedValues}
        reportHtml="<html><body>Report</body></html>"
        reportReady={true}
        reportFileName="netup-preliminary-recommendation-REC-20260625-12345"
        onRequestEngineeringReview={vi.fn()}
        onSaveLead={vi.fn()}
        onPrintReport={vi.fn()}
        onDownloadPdf={vi.fn()}
        onDownloadWord={vi.fn()}
        onStartOver={vi.fn()}
        onEditConfiguration={vi.fn()}
        leadSaved={false}
        loadingAction={false}
      />,
    );

    expect(screen.getByRole("link", { name: "Download HTML" })).toHaveAttribute(
      "download",
      "netup-preliminary-recommendation-REC-20260625-12345.html",
    );
  });

  it("marks results content as print-friendly by hiding navigation controls and duplicate renderers", () => {
    const { container } = render(
      <div>
        <div data-testid="wizard-progress" className="print:hidden" />
        <ResultsPanel
          recommendation={recommendationResponse as Recommendation}
          submittedValues={submittedValues}
          reportHtml="<html><body>Report</body></html>"
          reportReady={true}
          reportFileName="netup-preliminary-recommendation-REC-20260625-12345"
          onRequestEngineeringReview={vi.fn()}
          onSaveLead={vi.fn()}
          onPrintReport={vi.fn()}
          onDownloadPdf={vi.fn()}
          onDownloadWord={vi.fn()}
          onStartOver={vi.fn()}
          onEditConfiguration={vi.fn()}
          leadSaved={false}
          loadingAction={false}
        />
      </div>,
    );

    expect(screen.getByTestId("actions-card")).toHaveClass("print:hidden");
    expect(screen.getByTestId("report-preview")).toHaveClass("print:hidden");
    expect(screen.getByTestId("wizard-progress")).toHaveClass("print:hidden");
    expect(container.querySelector('iframe[title="Report Preview"]')).toBeInTheDocument();
  });
});

describe("HomePage layout", () => {
  it("keeps a single hero disclaimer and uses the constrained shell width", async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(api.options).toHaveBeenCalled();
    });

    expect(document.querySelector("main")).toHaveClass("shell");
    expect(screen.getAllByText(options.disclaimer)).toHaveLength(1);
  });

  it("switches to guided mode, scrolls, and focuses the first field", async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    await waitFor(() => {
      expect(api.options).toHaveBeenCalled();
    });

    await user.click(screen.getByRole("button", { name: "Use guided configurator" }));

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Natural-language intake" })).not.toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Describe my project instead" })).toBeInTheDocument();
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole("combobox", { name: /Project type/i }));
    });
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it("switches to guided mode even when the conversation textarea contains text", async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    await waitFor(() => {
      expect(api.options).toHaveBeenCalled();
    });

    await user.type(screen.getByPlaceholderText(/We have a 180-room hotel/i), "Project draft already typed here");
    await user.click(screen.getByRole("button", { name: "Use guided configurator" }));

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Natural-language intake" })).not.toBeInTheDocument();
    });

    expect(screen.getByRole("combobox", { name: /Project type/i })).toBeInTheDocument();
  });

  it("does not submit extraction when using guided mode", async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    await waitFor(() => {
      expect(api.options).toHaveBeenCalled();
    });

    await user.type(screen.getByPlaceholderText(/We have a 180-room hotel/i), "Project draft");
    await user.click(screen.getByRole("button", { name: "Use guided configurator" }));

    expect(api.extract).not.toHaveBeenCalled();
  });

  it("preserves guided wizard data when switching to conversation mode and back", async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    await waitFor(() => {
      expect(api.options).toHaveBeenCalled();
    });

    await user.click(screen.getByRole("button", { name: "Use guided configurator" }));
    await user.selectOptions(screen.getByRole("combobox", { name: /Project type/i }), "hotel");
    await user.type(screen.getByRole("spinbutton", { name: /Number of rooms/i }), "180");

    await user.click(screen.getByRole("button", { name: "Describe my project instead" }));
    expect(screen.getByRole("heading", { name: "Natural-language intake" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Use guided configurator" }));

    expect(screen.getByRole("combobox", { name: /Project type/i })).toHaveValue("hotel");
    expect(screen.getByRole("spinbutton", { name: /Number of subscribers, rooms, or endpoints/i })).toHaveValue(180);
  });

  it("routes extracted results to the separate review page", async () => {
    const user = userEvent.setup();
    vi.mocked(api.extract).mockResolvedValueOnce({
      extracted_requirements: reviewExtractResponse.extracted_requirements,
      extraction_trace: conversationTrace,
      missing_required_fields: ["Delivery mode"],
      next_question: "Will delivery stay on a local network, go over OTT/internet, or both?",
      ready_for_recommendation: false,
      ai_available: true,
      extraction_succeeded: true,
      error_code: null,
      message: null,
    });

    render(<HomePage />);

    await waitFor(() => {
      expect(api.options).toHaveBeenCalled();
    });

    await user.type(screen.getByPlaceholderText(/We have a 180-room hotel/i), "We have a 180-room hotel project");
    await user.click(screen.getByRole("button", { name: "Extract requirements" }));

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/review");
    });
    expect(getReviewPayload()?.response.next_question).toBe("Will delivery stay on a local network, go over OTT/internet, or both?");
  });

  it("renders confirmed fields separately from inferred fields on the review page", async () => {
    const user = userEvent.setup();
    setReviewPayload({
      response: {
        ...reviewExtractResponse,
      },
      originalMessage: "We have a 180-room hotel. We want 85 satellite and IP channels on LG Smart TVs. Plus catch-up TV and mobile viewing.",
    });

    render(<ReviewPage />);

    expect(await screen.findByRole("heading", { name: "Customer confirmation" })).toBeInTheDocument();
    const inferredSection = screen.getByRole("heading", { name: "Suggested interpretations" }).closest("section");
    expect(inferredSection).not.toBeNull();
    expect(within(inferredSection as HTMLElement).getByText("Live TV")).toBeInTheDocument();
    expect(within(inferredSection as HTMLElement).getByText("EPG")).toBeInTheDocument();
    expect(within(inferredSection as HTMLElement).getAllByText(/Inferred - please confirm/i)).toHaveLength(2);

    const summarySection = screen.getByRole("heading", { name: "Extracted project summary" }).closest("section");
    expect(summarySection).not.toBeNull();
    expect(within(summarySection as HTMLElement).getByText("Catch-up TV")).toBeInTheDocument();
    expect(within(summarySection as HTMLElement).queryByText("Live TV")).not.toBeInTheDocument();
    expect(within(summarySection as HTMLElement).queryByText("EPG")).not.toBeInTheDocument();

    const acceptButtons = screen.getAllByRole("button", { name: "Accept" });
    await user.click(acceptButtons[0]);
    await user.click(acceptButtons[1]);
    expect(screen.getByRole("button", { name: "Confirm extracted details" })).toBeInTheDocument();
  });

  it("shows the TV-model follow-up with the matching field and split hotel delivery controls", async () => {
    const user = userEvent.setup();
    setReviewPayload({
      response: {
        ...reviewExtractResponse,
      },
      originalMessage: "We have a 180-room hotel. We want 85 satellite and IP channels on LG Smart TVs. Plus catch-up TV and mobile viewing.",
    });

    render(<ReviewPage />);

    expect(await screen.findByDisplayValue("LG")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "TV model or series" })).toBeInTheDocument();

    const advancedSummary = screen.getByText("Optional advanced details");
    await user.click(advancedSummary);

    expect(await screen.findByRole("combobox", { name: "Room-TV delivery" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Mobile / web delivery" })).toBeInTheDocument();
  });

  it("shows catch-up fields and keeps storage sizing pending until retention is provided", async () => {
    const user = userEvent.setup();
    setReviewPayload({
      response: {
        ...reviewExtractResponse,
      },
      originalMessage: "We have a 180-room hotel. We want 85 satellite and IP channels on LG Smart TVs. Plus catch-up TV and mobile viewing.",
    });

    render(<ReviewPage />);

    expect(await screen.findByText("Storage sizing pending")).toBeInTheDocument();
    await user.click(screen.getByText("Optional advanced details"));
    expect(await screen.findByRole("spinbutton", { name: "Retention period in days" })).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Number of channels to record" })).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Average bitrate (Mbps)" })).toBeInTheDocument();
  });

  it("continues with guided configuration at the first unresolved field and preserves extracted values", async () => {
    const user = userEvent.setup();
    setReviewPayload({
      response: {
        ...reviewExtractResponse,
      },
      originalMessage: "We have a 180-room hotel. We want 85 satellite and IP channels on LG Smart TVs. Plus catch-up TV and mobile viewing.",
    });

    render(<ReviewPage />);

    await screen.findByRole("heading", { name: "Customer confirmation" });
    await user.click(screen.getByRole("button", { name: "Continue with guided configuration" }));

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/");
    });

    const intent = consumeHomeNavigationIntent();
    expect(intent?.entryMode).toBe("guided");
    expect(intent?.seedStartStep).toBe(3);
    expect(intent?.seedValues).toMatchObject({
      project_type: "hotel",
      subscribers_or_rooms: 180,
      number_of_channels: 85,
    });
  });

  it("keeps optional advanced details collapsed by default", async () => {
    setReviewPayload({
      response: {
        ...reviewExtractResponse,
      },
      originalMessage: "We have a 180-room hotel. We want 85 satellite and IP channels on LG Smart TVs. Plus catch-up TV and mobile viewing.",
    });

    render(<ReviewPage />);

    await screen.findByRole("heading", { name: "Customer confirmation" });
    expect(screen.queryByRole("spinbutton", { name: "Retention period in days" })).not.toBeInTheDocument();
  });

  it("renders all seven complete step labels without truncation in desktop navigation", async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(api.options).toHaveBeenCalled();
    });

    expect(screen.getByTestId("desktop-progress")).toHaveTextContent("Profile");
    expect(screen.getByTestId("desktop-progress")).toHaveTextContent("Sources");
    expect(screen.getByTestId("desktop-progress")).toHaveTextContent("Services");
    expect(screen.getByTestId("desktop-progress")).toHaveTextContent("Delivery");
    expect(screen.getByTestId("desktop-progress")).toHaveTextContent("Capacity");
    expect(screen.getByTestId("desktop-progress")).toHaveTextContent("Contact");
    expect(screen.getByTestId("desktop-progress")).toHaveTextContent("Results");
    expect(screen.queryByText("Sourc")).not.toBeInTheDocument();
    expect(screen.queryByText("Servic")).not.toBeInTheDocument();
    expect(screen.queryByText("Delive")).not.toBeInTheDocument();
    expect(screen.queryByText("Capaci")).not.toBeInTheDocument();
    expect(screen.queryByText("Contac")).not.toBeInTheDocument();
  });

  it("keeps compact progress for mobile while using multi-row desktop progress for tablet widths", async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(api.options).toHaveBeenCalled();
    });

    expect(screen.getByTestId("desktop-progress-compact")).toHaveClass("md:grid", "xl:hidden");
    expect(screen.getByTestId("compact-progress")).toHaveClass("md:hidden");
  });
});
