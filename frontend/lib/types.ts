export type Option = { value: string; label: string };

export type ConfigOptionsResponse = {
  project_types: Option[];
  signal_sources: Option[];
  services: Option[];
  viewer_devices: Option[];
  delivery_modes: Option[];
  output_types: Option[];
  disclaimer: string;
  data_retention_note: string;
};

export type Recommendation = {
  project_summary: string;
  recommendations: { product: string; category: string; reason: string; warning?: string | null }[];
  capacity: {
    unicast_bandwidth_formula: string;
    base_bandwidth_mbps: number;
    safety_adjusted_bandwidth_mbps: number;
    estimated_archive_storage_tb: number;
    safety_adjusted_archive_storage_tb: number;
    assumptions: string[];
  };
  warnings: string[];
  missing_information: string[];
  assumptions: string[];
  rule_version: string;
  requires_engineer_review: boolean;
};

export type ExtractResponse = {
  extracted_requirements: Record<string, unknown>;
  missing_required_fields: string[];
  next_question: string | null;
  ready_for_recommendation: boolean;
  ai_available: boolean;
};
