import React from "react";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { ConversationPanel } from "@/components/conversation-panel";
import { Wizard } from "@/components/wizard";
import type { ConfigOptionsResponse } from "@/lib/types";

vi.mock("@/lib/api", () => ({
  api: {
    recommend: vi.fn().mockResolvedValue({
      project_summary: "Hotel project",
      recommendations: [{ product: "NetUP IPTV Combine 8x", category: "Core", reason: "Fits project scope." }],
      capacity: {
        unicast_bandwidth_formula: "100 x 6",
        base_bandwidth_mbps: 600,
        safety_adjusted_bandwidth_mbps: 806.4,
        estimated_archive_storage_tb: 38.56,
        safety_adjusted_archive_storage_tb: 48.81,
        assumptions: ["Assumption"],
      },
      warnings: ["Warning"],
      missing_information: [],
      assumptions: ["Assumption"],
      rule_version: "2026.06-mvp",
      requires_engineer_review: true,
    }),
    createLead: vi.fn().mockResolvedValue({ id: "lead-1" }),
    createReport: vi.fn().mockResolvedValue({ id: "report-1", generated_content: "<html><body>Report</body></html>" }),
    extract: vi.fn().mockResolvedValue({
      extracted_requirements: {},
      missing_required_fields: ["Project type"],
      next_question: "What type of project is this?",
      ready_for_recommendation: false,
      ai_available: false,
    }),
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

describe("Wizard", () => {
  it("updates the audience label by project type", async () => {
    const user = userEvent.setup();
    render(<Wizard options={options} />);
    await user.selectOptions(screen.getByLabelText("Project type"), "hotel");
    expect(screen.getByText("Number of rooms")).toBeInTheDocument();
  });

  it("submits the wizard and renders results", async () => {
    const user = userEvent.setup();
    render(<Wizard options={options} />);

    await user.selectOptions(screen.getByLabelText("Project type"), "hotel");
    await user.type(screen.getByLabelText("Number of rooms"), "180");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(screen.getByLabelText("Number of TV channels"), "85");
    await user.click(screen.getByLabelText("Satellite"));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByLabelText("Live TV"));
    await user.click(screen.getByLabelText("Catch-up TV"));
    await user.click(screen.getByLabelText("Video on demand"));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByLabelText("Smart TVs"));
    await user.click(screen.getByLabelText("Mobile applications"));
    await user.selectOptions(screen.getByLabelText("Delivery mode"), "both");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(screen.getByLabelText("Expected concurrent viewers"), "100");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(screen.getByLabelText("Contact name"), "Jane Doe");
    await user.type(screen.getByLabelText("Work email"), "jane@example.com");
    await user.click(screen.getByLabelText("I consent to submitting this presales request"));
    await user.click(screen.getByRole("button", { name: "Request engineering review" }));

    await waitFor(() => {
      expect(screen.getByText("Recommended product families")).toBeInTheDocument();
      expect(screen.getByTitle("Report Preview")).toBeInTheDocument();
    });
  });
});

describe("ConversationPanel", () => {
  it("shows a clear fallback when AI extraction is disabled", async () => {
    const user = userEvent.setup();
    render(<ConversationPanel />);
    await user.type(screen.getByPlaceholderText(/We have a 180-room hotel/i), "Hotel project");
    await user.click(screen.getByRole("button", { name: "Extract requirements" }));
    await waitFor(() => {
      expect(screen.getByText(/no OpenAI API key is configured/i)).toBeInTheDocument();
    });
  });
});
