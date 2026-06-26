import React from "react";

import { render, screen, waitFor } from "@testing-library/react";
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
import { getResultsPayload, getReviewPayload, setResultsPayload, setReviewPayload } from "@/lib/flow-storage";
import type { ConfigOptionsResponse, Recommendation } from "@/lib/types";

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

const recommendationResponse = {
  project_summary: "180-room hotel IPTV deployment",
  recommendations: [
    {
      product: "NetUP IPTV Combine 8x",
      category: "Core",
      reason: "Fits project scope.",
      rule_id: "hotel-core-01",
      validation_status: "Requires NetUP validation",
      warning: "Validate firmware compatibility for final deployment.",
    },
  ],
  capacity: {
    unicast_bandwidth_formula: "100 viewers x 6 Mbps x safety factor",
    base_bandwidth_mbps: 600,
    safety_adjusted_bandwidth_mbps: 806.4,
    estimated_archive_storage_tb: 38.56,
    safety_adjusted_archive_storage_tb: 48.81,
    assumptions: ["Assumes standard HD channel mix."],
  },
  warnings: ["Confirm final Smart TV firmware compatibility during engineering review."],
  missing_information: [],
  assumptions: ["Archive retention will be confirmed with the customer."],
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
  });

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
    expect(screen.getByRole("heading", { name: "Missing information" })).toBeInTheDocument();
    expect(screen.getByText("NetUP IPTV Combine 8x")).toBeInTheDocument();
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

    expect(screen.getByText("Internet / OTT")).toBeInTheDocument();
    expect(screen.getByText("Live TV")).toBeInTheDocument();
    expect(screen.getByText("Smart TV, Set-top box")).toBeInTheDocument();
    expect(screen.getByText("Existing IP streams")).toBeInTheDocument();
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

    expect(screen.getByText("Matched rule conditions")).toBeInTheDocument();
    expect(screen.getByText("Project type: Hotel")).toBeInTheDocument();
    expect(screen.getByText("Delivery mode: Local network")).toBeInTheDocument();
    expect(screen.getByText("Matched rule reference: hotel-core-01")).toBeInTheDocument();
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
      extracted_requirements: {
        project_type: "hotel",
        subscribers_or_rooms: 180,
        number_of_channels: 85,
        signal_sources: ["satellite", "ip_streams"],
        services: ["catchup_tv"],
        viewer_devices: ["smart_tv", "mobile"],
      },
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

  it("lets the user edit extracted fields on the review page and unlocks the recommendation shortcut", async () => {
    const user = userEvent.setup();
    setReviewPayload({
      response: {
        extracted_requirements: {
          project_type: "hotel",
          subscribers_or_rooms: 180,
          number_of_channels: 85,
          signal_sources: ["satellite", "ip_streams"],
          services: ["catchup_tv"],
          viewer_devices: ["smart_tv", "mobile"],
          delivery_mode: "local_network",
        },
        missing_required_fields: [],
        next_question: null,
        ready_for_recommendation: true,
        ai_available: true,
        extraction_succeeded: true,
        error_code: null,
        message: null,
      },
      originalMessage: "We have a 180-room hotel project",
    });

    render(<ReviewPage />);

    expect(await screen.findByRole("heading", { name: "Customer confirmation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue to recommendation" })).toBeInTheDocument();

    await user.clear(screen.getByRole("spinbutton", { name: /Rooms or subscribers/i }));
    await user.type(screen.getByRole("spinbutton", { name: /Rooms or subscribers/i }), "220");
    await user.click(screen.getByRole("button", { name: "Continue to recommendation" }));

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/");
    });
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
