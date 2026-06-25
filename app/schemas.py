from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ProjectType(str, Enum):
    HOTEL = "hotel"
    HOSPITAL = "hospital"
    UNIVERSITY = "university"
    RESIDENTIAL = "residential_complex"
    SMALL_PROVIDER = "small_provider"
    LARGE_OPERATOR = "large_operator"
    CABLE_OPERATOR = "cable_operator"
    TRANSPORT = "transport"
    OTHER = "other"


class SignalSource(str, Enum):
    SATELLITE = "satellite"
    TERRESTRIAL = "terrestrial"
    CABLE = "cable"
    IP = "ip_streams"
    ASI = "asi"
    HDMI_SDI = "hdmi_sdi"


class Service(str, Enum):
    LIVE_TV = "live_tv"
    EPG = "epg"
    CATCHUP = "catchup_tv"
    TIMESHIFT = "time_shift"
    VOD = "video_on_demand"
    BILLING = "billing"
    ADVERTISING = "advertising"
    OWN_CHANNEL = "own_tv_channel"


class ViewerDevice(str, Enum):
    SMART_TV = "smart_tv"
    SET_TOP_BOX = "set_top_box"
    MOBILE = "mobile"
    WEB = "web_browser"


class DeliveryMode(str, Enum):
    LOCAL = "local_network"
    OTT = "internet_ott"
    BOTH = "both"


class OutputType(str, Enum):
    IP = "ip"
    QAM = "dvb_c_qam"


class CustomerRequirements(BaseModel):
    project_type: ProjectType
    country: str | None = None
    company_name: str | None = None

    subscribers_or_rooms: int = Field(gt=0, le=10_000_000)
    expected_concurrent_viewers: int | None = Field(default=None, gt=0)
    number_of_channels: int = Field(gt=0, le=20_000)

    signal_sources: list[SignalSource] = Field(min_length=1)
    signal_source_details: dict[str, str] = Field(default_factory=dict)
    services: list[Service] = Field(min_length=1)
    viewer_devices: list[ViewerDevice] = Field(min_length=1)
    delivery_mode: DeliveryMode
    output_type: OutputType = OutputType.IP

    adaptive_bitrate_required: bool = False
    redundancy_required: bool = False
    available_storage_tb: float | None = Field(default=None, ge=0)
    archive_days: int = Field(default=0, ge=0, le=3650)
    average_channel_bitrate_mbps: float = Field(default=6.0, gt=0, le=100)
    estimated_vod_library_size_tb: float | None = Field(default=None, ge=0)
    need_subscriber_packages: bool = False
    need_local_advertising: bool = False
    existing_network_bandwidth_mbps: float | None = Field(default=None, ge=0)
    existing_equipment: str | None = Field(default=None, max_length=2000)
    budget_range: str | None = None
    target_launch_date: str | None = None

    contact_name: str | None = None
    company: str | None = None
    email: str | None = None
    phone: str | None = None
    additional_project_notes: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def validate_concurrency(self):
        if (
            self.expected_concurrent_viewers is not None
            and self.expected_concurrent_viewers > self.subscribers_or_rooms
        ):
            raise ValueError("expected_concurrent_viewers cannot exceed subscribers_or_rooms")
        return self


class PartialCustomerRequirements(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    project_type: ProjectType | None = None
    country: str | None = None
    company_name: str | None = None
    subscribers_or_rooms: int | None = Field(default=None, gt=0, le=10_000_000)
    expected_concurrent_viewers: int | None = Field(default=None, gt=0)
    number_of_channels: int | None = Field(default=None, gt=0, le=20_000)
    signal_sources: list[SignalSource] = Field(default_factory=list)
    signal_source_details: dict[str, str] = Field(default_factory=dict)
    services: list[Service] = Field(default_factory=list)
    viewer_devices: list[ViewerDevice] = Field(default_factory=list)
    delivery_mode: DeliveryMode | None = None
    output_type: OutputType | None = None
    adaptive_bitrate_required: bool | None = None
    redundancy_required: bool | None = None
    available_storage_tb: float | None = Field(default=None, ge=0)
    archive_days: int | None = Field(default=None, ge=0, le=3650)
    average_channel_bitrate_mbps: float | None = Field(default=None, gt=0, le=100)
    estimated_vod_library_size_tb: float | None = Field(default=None, ge=0)
    need_subscriber_packages: bool | None = None
    need_local_advertising: bool | None = None
    existing_network_bandwidth_mbps: float | None = Field(default=None, ge=0)
    existing_equipment: str | None = None
    budget_range: str | None = None
    target_launch_date: str | None = None
    contact_name: str | None = None
    company: str | None = None
    email: str | None = None
    phone: str | None = None
    additional_project_notes: str | None = None


class ProductRecommendation(BaseModel):
    product: str
    category: str
    reason: str
    rule_id: str
    validation_status: str = "Requires NetUP validation"
    warning: str | None = None


class RuleTraceEntry(BaseModel):
    rule_id: str
    product_family: str
    matched: bool
    passed_conditions: list[str]
    failed_conditions: list[str]
    version: str


class CapacityEstimate(BaseModel):
    assumed_concurrent_viewers: int
    delivery_assumption: str
    unicast_bandwidth_formula: str
    base_bandwidth_mbps: float
    safety_adjusted_bandwidth_mbps: float
    estimated_archive_storage_tb: float
    safety_adjusted_archive_storage_tb: float
    assumptions: list[str]


class RecommendationResponse(BaseModel):
    project_summary: str
    recommendations: list[ProductRecommendation]
    capacity: CapacityEstimate
    warnings: list[str]
    missing_information: list[str]
    assumptions: list[str]
    requires_engineer_review: bool = True
    rule_version: str


class HealthResponse(BaseModel):
    status: str
    database: str
    ai_extraction: str


class ConversationExtractRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    current_requirements: PartialCustomerRequirements | None = None


class ConversationExtractResponse(BaseModel):
    extracted_requirements: PartialCustomerRequirements
    missing_required_fields: list[str]
    next_question: str | None
    ready_for_recommendation: bool
    ai_available: bool
    ai_unavailable_reason: str | None = None


class LeadCreateRequest(BaseModel):
    contact_name: str
    email: str
    company: str | None = None
    phone: str | None = None
    country: str | None = None
    project_type: ProjectType | None = None
    requirements: CustomerRequirements
    recommendation: RecommendationResponse
    source: str = "wizard"
    consent_given: bool

    @model_validator(mode="after")
    def validate_consent(self):
        if not self.consent_given:
            raise ValueError("Consent is required before submitting a lead.")
        return self


class LeadResponse(BaseModel):
    id: str
    created_at: datetime
    updated_at: datetime
    status: str
    contact_name: str | None
    email: str
    phone: str | None
    company: str | None
    country: str | None
    project_type: str | None
    source: str
    consent_given: bool
    requirements: dict[str, Any]
    recommendation: dict[str, Any]

    model_config = ConfigDict(from_attributes=True)


class ReportCreateRequest(BaseModel):
    lead_id: str
    requirements: CustomerRequirements
    recommendation: RecommendationResponse


class ReportResponse(BaseModel):
    id: str
    lead_id: str
    created_at: datetime
    generated_content: str
    version: str

    model_config = ConfigDict(from_attributes=True)


class ProductCatalogItem(BaseModel):
    product_family: str
    category: str
    validation_status: str
    source_reference: str | None = None


class ConfigOption(BaseModel):
    value: str
    label: str


class ConfigOptionsResponse(BaseModel):
    project_types: list[ConfigOption]
    signal_sources: list[ConfigOption]
    services: list[ConfigOption]
    viewer_devices: list[ConfigOption]
    delivery_modes: list[ConfigOption]
    output_types: list[ConfigOption]
    disclaimer: str
    data_retention_note: str
