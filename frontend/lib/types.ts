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

export type ClaimStatus = "confirmed" | "calculated" | "inferred" | "conditional" | "unknown" | "provisional";

export type ValidationStatus =
  | "validated_rule"
  | "detected"
  | "confirmed"
  | "missing"
  | "needs_review"
  | "assumption"
  | "needs_engineer_review"
  | "missing_data";

export type WorkflowStepDescriptor = {
  id: string;
  title: string;
  description: string;
};

export type RequirementCardData = {
  id: string;
  title: string;
  value: string;
  status: ValidationStatus;
  detail?: string | null;
  fieldKey?: string;
};

export type ReadinessDiagnosis = {
  score: number;
  completeCount: number;
  totalCount: number;
  missingItems: string[];
  cards: RequirementCardData[];
  nextQuestion?: string | null;
};

export type ReportSectionDescriptor = {
  id: string;
  title: string;
  summary?: string;
};

export type ArchitecturePreviewBlock = {
  id: string;
  label: string;
  items: string[];
  emphasized?: boolean;
};

export type EvidenceReference = {
  id: string;
  title: string;
  url: string;
  publication_date?: string | null;
  extracted_capability: string;
  confidence: ClaimStatus;
  reviewed_status: string;
};

export type ClaimStatement = {
  claim: string;
  status: ClaimStatus;
  conditions: string[];
  evidence_ids: string[];
  notes?: string | null;
};

export type MissingInformationItem = {
  code: string;
  label: string;
  category: string;
  status: ClaimStatus;
  reason: string;
  question: string;
};

export type ArchitectureNode = {
  id: string;
  label: string;
  kind: string;
  status: ClaimStatus;
  details: string[];
};

export type ArchitectureBranch = {
  name: string;
  status: ClaimStatus;
  nodes: ArchitectureNode[];
  note?: string | null;
};

export type ArchitectureOption = {
  name: string;
  status: ClaimStatus;
  preference: string;
  reason: string;
  tradeoffs: string[];
  information_required: string[];
  branches: ArchitectureBranch[];
};

export type Recommendation = {
  project_summary: string;
  recommendations: {
    canonical_product_id: string;
    product: string;
    category: string;
    object_type: string;
    role_summary: string;
    reason: string;
    rule_id?: string;
    claim_status: ClaimStatus;
    provided_capabilities: string[];
    conditions: string[];
    evidence_ids: string[];
    validation_status?: string;
    warning?: string | null;
  }[];
  capacity: {
    assumed_concurrent_viewers: number;
    delivery_assumption: string;
    unicast_bandwidth_formula: string;
    base_bandwidth_mbps: number;
    safety_adjusted_bandwidth_mbps: number;
    source_ingest_bandwidth_mbps?: number | null;
    core_network_multicast_bandwidth_mbps?: number | null;
    local_unicast_access_bandwidth_mbps?: number | null;
    ott_origin_egress_bandwidth_mbps?: number | null;
    per_viewer_bandwidth_mbps: number;
    storage_ingest_bandwidth_mbps?: number | null;
    estimated_archive_storage_tb: number;
    safety_adjusted_archive_storage_tb: number;
    storage_status: ClaimStatus;
    storage_status_message?: string | null;
    archive_scope_summary?: string | null;
    assumptions: string[];
  };
  warnings: string[];
  missing_information: string[];
  missing_information_items: MissingInformationItem[];
  assumptions: string[];
  readiness: {
    intake_complete: boolean;
    preliminary_recommendation_ready: boolean;
    capacity_estimate_ready: boolean;
    compatibility_review_ready: boolean;
    engineering_review_required: boolean;
    quotation_ready: boolean;
  };
  claim_statements: ClaimStatement[];
  official_references: EvidenceReference[];
  recommended_architecture?: ArchitectureOption | null;
  alternative_architectures: ArchitectureOption[];
  next_question?: string | null;
  audit_trace: Record<string, unknown>;
  rule_version: string;
  requires_engineer_review: boolean;
};

export type ExtractResponse = {
  extracted_requirements: Record<string, unknown>;
  extraction_trace: {
    field: string;
    value: unknown;
    source_text?: string | null;
    confidence: "high" | "medium" | "low";
    state: "explicit" | "inferred" | "carried_forward" | "missing";
    requires_confirmation: boolean;
    reasoning?: string | null;
  }[];
  missing_required_fields: string[];
  next_question: string | null;
  ready_for_recommendation: boolean;
  ai_available: boolean;
  extraction_succeeded: boolean;
  error_code?: string | null;
  message?: string | null;
};
