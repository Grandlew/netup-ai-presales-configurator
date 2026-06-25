import React from "react";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import HomePage from "@/app/page";
import { ConversationPanel } from "@/components/conversation-panel";
import { Wizard } from "@/components/wizard";
import { api } from "@/lib/api";
import type { ConfigOptionsResponse } from "@/lib/types";

vi.mock("@/lib/api", () => ({
  api: {
    options: vi.fn(),
    recommend: vi.fn(),
    createLead: vi.fn(),
    createReport: vi.fn(),
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
  recommendations: [{ product: "NetUP IPTV Combine 8x", category: "Core", reason: "Fits project scope." }],
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

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.options).mockResolvedValue(options);
  vi.mocked(api.recommend).mockResolvedValue(recommendationResponse);
  vi.mocked(api.createLead).mockResolvedValue({ id: "lead-1" });
  vi.mocked(api.createReport).mockResolvedValue({ id: "report-1", generated_content: "<html><body>Report</body></html>" });
  vi.mocked(api.extract).mockResolvedValue({
    extracted_requirements: {},
    missing_required_fields: ["Project type"],
    next_question: "What type of project is this?",
    ready_for_recommendation: false,
    ai_available: false,
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

    expect(screen.getByRole("button", { name: /^Required services$/i })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /^Project profile$/i }));

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

  it("shows a loading state while generating the recommendation and then opens Step 7", async () => {
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
      expect(screen.getByRole("heading", { name: recommendationResponse.project_summary })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Request engineering review" })).toBeInTheDocument();
    });
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

  it("supports start over confirmation and resets the wizard", async () => {
    const user = userEvent.setup();
    render(<Wizard options={options} />);

    await goToContactStep(user);
    await fillContactDetails(user);
    await user.click(screen.getByRole("button", { name: "Generate preliminary recommendation" }));

    await screen.findByRole("heading", { name: recommendationResponse.project_summary });
    await user.click(screen.getAllByRole("button", { name: "Start over" })[0]);
    await user.click(screen.getByRole("button", { name: "Confirm start over" }));

    expect(screen.getByRole("heading", { name: "Project profile" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /Project type/i })).toHaveValue("");
    expect(screen.getByText("Step 1 of 7")).toBeInTheDocument();
  });

  it("renders compact mobile progress text", () => {
    render(<Wizard options={options} />);

    expect(screen.getByText("Step 1 of 7")).toBeInTheDocument();
    expect(screen.getAllByText("Project profile").length).toBeGreaterThan(0);
  }, 10000);

  it("renders all seven progress steps without repeating the long disclaimer", () => {
    const { container } = render(<Wizard options={options} />);

    expect(screen.getByTestId("desktop-progress")).toHaveClass("xl:grid-cols-7");
    expect(screen.getByTestId("desktop-progress-compact")).toHaveClass("lg:grid", "xl:hidden");
    expect(container.firstChild).toHaveClass("space-y-6");
    expect(screen.getByTestId("desktop-progress").parentElement).toHaveClass("overflow-hidden");
    expect(screen.getAllByRole("button", { name: /Profile|Sources|Services|Delivery|Capacity|Contact|Results/i })).toHaveLength(14);
    expect(screen.queryByText(options.disclaimer)).not.toBeInTheDocument();
  }, 10000);

  it("renders recommendation cards, capacity cards, and missing information on the results page", async () => {
    const user = userEvent.setup();
    render(<Wizard options={options} />);

    await goToContactStep(user);
    await fillContactDetails(user);
    await user.click(screen.getByRole("button", { name: "Generate preliminary recommendation" }));

    expect(await screen.findByRole("heading", { name: "Recommended product families" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Capacity estimates" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Missing information" })).toBeInTheDocument();
    expect(screen.getByText("NetUP IPTV Combine 8x")).toBeInTheDocument();
    expect(screen.getByText("806.4 Mbps")).toBeInTheDocument();
  });

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

    expect(await screen.findByRole("heading", { name: recommendationResponse.project_summary })).toBeInTheDocument();
    expect(api.recommend).toHaveBeenCalledTimes(2);
  });
});

describe("ConversationPanel", () => {
  it("shows the AI unavailable fallback and keeps the guided path visible", async () => {
    const user = userEvent.setup();
    render(<ConversationPanel />);

    await user.type(screen.getByPlaceholderText(/We have a 180-room hotel/i), "Hotel project");
    await user.click(screen.getByRole("button", { name: "Extract requirements" }));

    await waitFor(() => {
      expect(screen.getByText("Natural-language intake is currently unavailable because the AI service is not configured.")).toBeInTheDocument();
    });

    expect(screen.getByText("You can continue with the guided configurator.")).toBeInTheDocument();
    expect(screen.getByText("Extracted fields")).toBeInTheDocument();
    expect(screen.getByText("Follow-up question")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Use guided configurator" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Extract requirements" })).toBeDisabled();
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
});
