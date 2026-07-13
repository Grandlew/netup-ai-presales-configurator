# Day 2 — IPTV/OTT Reliability Ontology

## Goal

Define the core components, services, dependency edges, risk categories, required inputs, and output objects for NetUP ReliabilityGraph AI.

The ontology is the foundation of the system. Without it, the project becomes a loose chatbot. With it, the system can generate graphs, apply rules, detect risks, and produce engineer-ready reports.

## Why Ontology Matters

A NetUP-style IPTV/OTT deployment is not a single product recommendation. It is a connected system of signal sources, headend components, middleware, storage, network distribution, devices, and integrations.

The ontology gives the system a controlled language for reasoning about that deployment.

## Component Types

| Component Type | Description | Example |
|---|---|---|
| Site | Customer deployment location | Hotel, university, hospital, ISP |
| SignalSource | Source of TV/IP content | DVB-S/S2, DVB-T/T2, DVB-C, IP stream |
| Streamer | Receives and broadcasts TV streams | IPTV streamer/headend |
| DvbGateway | Converts DVB input into IP streams | DVB-to-IP gateway |
| Transcoder | Converts streams into required formats/bitrates | HD to adaptive bitrate |
| Middleware | Controls IPTV services and user experience | Channel list, apps, services |
| Billing | Manages users, tariffs, packages, authorization | Subscriber access control |
| VoDServer | Stores and serves video-on-demand | Movie library |
| CatchUPServer | Records live TV for later playback | 7-day CatchUP |
| TimeShiftService | Allows pause/rewind live TV | Time-shifted TV |
| EPGService | Provides program guide data | Channel schedule |
| CDN | Distributes streams at scale | Edge delivery |
| CAS_DRM | Protects content access | Conditional access / DRM |
| CoreSwitch | Main network switch | Hotel core switch |
| FloorSwitch | Distribution switch for rooms/floors | Floor 3 switch |
| VLAN | Logical network separation | IPTV VLAN |
| SmartTV | TV with native app | LG webOS TV |
| STB | Set-top box client | IPTV STB |
| MobileClient | Phone/tablet app | Guest mobile viewing |
| WebClient | Browser-based client | Web TV |
| PMS | Hotel property-management system | Opera PMS, Fidelio, etc. |
| Engineer | Human reviewer | NetUP/integrator engineer |
| Report | Generated handover output | PDF/HTML validation report |

## Service Types

| Service Type | Description | Required Components |
|---|---|---|
| LiveTV | Real-time TV channel playback | SignalSource, Streamer/Gateway, Middleware, Network, Client |
| Radio | Radio channel playback | SignalSource, Streamer/Gateway, Middleware, Client |
| VoD | Video-on-demand playback | VoDServer, Storage, Middleware, Network, Client |
| CatchUP | Playback of previously aired TV | CatchUPServer, Storage, EPG, Middleware |
| TimeShift | Pause/rewind live TV | TimeShiftService, Storage, Middleware |
| EPG | Program guide | EPGService, Middleware, Client |
| MobileViewing | TV access on mobile devices | Middleware, CDN/OTT output, MobileClient |
| WebViewing | TV access in browser | Middleware, CDN/OTT output, WebClient |
| PMSIntegration | Hotel room/guest synchronization | PMS, Middleware/Billing |
| AccessControl | User/package authorization | Billing, Middleware, CAS/DRM if needed |
| ContentProtection | Protects premium content | CAS_DRM, Middleware, Client |

## Dependency Edge Types

| Edge Type | Meaning | Example |
|---|---|---|
| receives_signal_from | Component receives content from a source | Streamer receives_signal_from DVB-S2 |
| converts_to_ip | Converts signal into IP stream | DvbGateway converts_to_ip ChannelPackage |
| transcodes_for | Converts stream format for target client | Transcoder transcodes_for MobileClient |
| authenticates_with | Checks access rights | SmartTV authenticates_with Middleware |
| authorized_by | Service access controlled by billing/access layer | ChannelPackage authorized_by Billing |
| stores_content_for | Storage supports service | Storage stores_content_for CatchUP |
| provides_metadata_to | Metadata service feeds another component | EPGService provides_metadata_to Middleware |
| delivers_stream_to | Network/component delivers video stream | CoreSwitch delivers_stream_to FloorSwitch |
| depends_on | Generic dependency | CatchUP depends_on Storage |
| integrates_with | External system integration | Middleware integrates_with PMS |
| shares_switch | Devices share physical network switch | Rooms 301–320 shares_switch FloorSwitch_3 |
| belongs_to_vlan | Device/component belongs to VLAN | SmartTVGroup belongs_to_vlan IPTV_VLAN |
| serves_client | Middleware/service serves end client | Middleware serves_client SmartTV |
| reviewed_by | Output requires human approval | Report reviewed_by Engineer |

## Risk Categories

| Risk Code | Risk Name | Trigger Example | Severity |
|---|---|---|---|
| SIGNAL_SOURCE_UNKNOWN | Signal source not specified | Channel count given but no DVB/IP source | High |
| INPUT_CAPACITY_UNKNOWN | Input capacity unclear | Many channels but tuner/input count missing | High |
| MIDDLEWARE_REQUIRED | Middleware required but not specified | Guest services or channel control requested | High |
| BILLING_ACCESS_UNKNOWN | Access control unclear | Subscriber/guest packages requested | Medium |
| STORAGE_SIZING_UNKNOWN | Storage sizing unclear | CatchUP requested but retention days missing | High |
| CATCHUP_MAPPING_RISK | CatchUP assumptions incomplete | CatchUP requested but EPG/channel mapping missing | Medium |
| EPG_SOURCE_UNKNOWN | EPG source unclear | EPG requested but source not specified | Medium |
| MULTICAST_NETWORK_RISK | Network multicast unclear | IPTV over LAN but VLAN/IGMP unknown | High |
| BANDWIDTH_UNKNOWN | Bandwidth unclear | Room count and channel mix known, bitrate unknown | High |
| DEVICE_COMPATIBILITY_UNKNOWN | Device compatibility unclear | SmartTV requested but model/firmware missing | High |
| PMS_INTEGRATION_UNKNOWN | PMS integration unclear | PMS requested but protocol/vendor missing | Medium |
| REDUNDANCY_UNKNOWN | Redundancy expectation unclear | Large deployment but failover not specified | High |
| CDN_REQUIRED_UNKNOWN | CDN/OTT delivery unclear | Mobile/web viewing requested but CDN not specified | Medium |
| CONTENT_PROTECTION_UNKNOWN | CAS/DRM unclear | Premium content requested but protection unspecified | Medium |
| ENGINEER_REVIEW_REQUIRED | Human review needed | Any high-risk architecture assumption | High |

## Required Inputs

### Customer / Site Inputs

- project type;
- room count or subscriber count;
- number of buildings/floors;
- deployment country/region;
- existing infrastructure;
- budget sensitivity;
- redundancy expectation.

### Content Inputs

- number of TV channels;
- SD/HD/4K channel mix;
- signal source type;
- satellite/cable/IP input details;
- radio requirements;
- premium content requirements.

### Service Inputs

- Live TV required;
- VoD required;
- CatchUP required;
- CatchUP retention days;
- TimeShift required;
- EPG required;
- mobile viewing required;
- web viewing required;
- PMS integration required.

### Network Inputs

- LAN topology;
- switch models;
- VLAN plan;
- IGMP/multicast support;
- estimated bandwidth;
- Wi-Fi usage;
- internet uplink;
- CDN/OTT requirement.

### Device Inputs

- SmartTV brand;
- SmartTV model;
- SmartTV operating system;
- firmware version;
- STB model;
- mobile client requirements;
- browser/web client requirements.

### Integration Inputs

- PMS vendor;
- PMS protocol/API;
- billing/access-control requirements;
- CAS/DRM requirements;
- third-party systems.

### Operational Inputs

- expected concurrency;
- peak usage time;
- support team availability;
- monitoring tools;
- SLA/SLO expectations;
- maintenance constraints.

## Output Objects

### ExtractedRequirements

Structured version of the customer’s input.

### DeploymentGraph

Nodes and edges representing the IPTV/OTT architecture.

### MissingInputs

List of required information not yet provided.

### RiskRegister

List of architecture, capacity, compatibility, and operational risks.

### RecommendationSet

Recommended components and services with reasoning.

### ReadinessScore

Score showing whether enough information exists for a reliable recommendation.

### ArchitectureConfidenceScore

Score showing how safe/confident the proposed architecture is.

### EngineerChecklist

Validation questions and tests for NetUP/integrator engineers.

### FailureModeWarnings

Potential failure modes based on the selected architecture.

### HandoverReport

Professional report summarizing requirements, architecture, risks, assumptions, and next steps.

## First Machine-Readable Ontology Draft

```json
{
  "component_types": [
    "Site",
    "SignalSource",
    "Streamer",
    "DvbGateway",
    "Transcoder",
    "Middleware",
    "Billing",
    "VoDServer",
    "CatchUPServer",
    "TimeShiftService",
    "EPGService",
    "CDN",
    "CAS_DRM",
    "CoreSwitch",
    "FloorSwitch",
    "VLAN",
    "SmartTV",
    "STB",
    "MobileClient",
    "WebClient",
    "PMS",
    "Engineer",
    "Report"
  ],
  "service_types": [
    "LiveTV",
    "Radio",
    "VoD",
    "CatchUP",
    "TimeShift",
    "EPG",
    "MobileViewing",
    "WebViewing",
    "PMSIntegration",
    "AccessControl",
    "ContentProtection"
  ],
  "edge_types": [
    "receives_signal_from",
    "converts_to_ip",
    "transcodes_for",
    "authenticates_with",
    "authorized_by",
    "stores_content_for",
    "provides_metadata_to",
    "delivers_stream_to",
    "depends_on",
    "integrates_with",
    "shares_switch",
    "belongs_to_vlan",
    "serves_client",
    "reviewed_by"
  ],
  "risk_categories": [
    "SIGNAL_SOURCE_UNKNOWN",
    "INPUT_CAPACITY_UNKNOWN",
    "MIDDLEWARE_REQUIRED",
    "BILLING_ACCESS_UNKNOWN",
    "STORAGE_SIZING_UNKNOWN",
    "CATCHUP_MAPPING_RISK",
    "EPG_SOURCE_UNKNOWN",
    "MULTICAST_NETWORK_RISK",
    "BANDWIDTH_UNKNOWN",
    "DEVICE_COMPATIBILITY_UNKNOWN",
    "PMS_INTEGRATION_UNKNOWN",
    "REDUNDANCY_UNKNOWN",
    "CDN_REQUIRED_UNKNOWN",
    "CONTENT_PROTECTION_UNKNOWN",
    "ENGINEER_REVIEW_REQUIRED"
  ]
}
```
 
## Four Golden Signals For IPTV/OTT Monitoring

The four golden signals are latency, traffic, errors, and saturation. For NetUP ReliabilityGraph AI, these signals help translate IPTV/OTT system behavior into measurable reliability indicators.

### 1. Latency

Latency measures how long an operation takes.

IPTV/OTT examples:
- channel startup time;
- time to load EPG;
- time to start CatchUP playback;
- time to authenticate a SmartTV/STB;
- PMS synchronization delay.

Example SLI:
- average channel startup time;
- p95 channel startup time;
- p95 EPG load time.

### 2. Traffic

Traffic measures demand on the system.

IPTV/OTT examples:
- active viewers;
- concurrent streams;
- requests to middleware;
- CatchUP playback sessions;
- VoD sessions;
- bandwidth through core switch;
- mobile viewing sessions.

Example SLI:
- number of concurrent streams;
- Mbps through IPTV VLAN;
- middleware requests per minute.

### 3. Errors

Errors measure failed operations.

IPTV/OTT examples:
- failed channel startup;
- failed authentication;
- failed CatchUP playback;
- EPG import failure;
- PMS sync failure;
- SmartTV app crash;
- stream unavailable error.

Example SLI:
- channel startup failure rate;
- CatchUP playback error rate;
- PMS sync error rate.

### 4. Saturation

Saturation measures how close the system is to its limits.

IPTV/OTT examples:
- CPU usage on middleware/headend server;
- storage usage for CatchUP/VoD;
- network bandwidth utilization;
- tuner/input capacity usage;
- maximum concurrent sessions;
- switch port utilization.

Example SLI:
- storage utilization percentage;
- IPTV VLAN bandwidth utilization;
- middleware CPU/memory utilization;
- concurrent streams as percentage of expected capacity.

### Why This Matters

The current V1 system does not perform live monitoring yet. However, the ontology should prepare the system for future monitoring by identifying which components and services will eventually need latency, traffic, error, and saturation metrics.

In V1, these signals are used as design-time questions.

In later versions, they become live monitoring inputs for failure detection and root-cause diagnosis.


## Day 2 Study Notes

### SLI Examples For IPTV/OTT

- channel startup success rate;
- p95 channel startup latency;
- stream freeze rate;
- EPG availability;
- EPG load latency;
- CatchUP playback success rate;
- PMS sync success rate;
- device app crash rate;
- concurrent stream count;
- IPTV VLAN bandwidth utilization;
- storage utilization for CatchUP/VoD;
- diagnosis accuracy.

### SLO Examples For IPTV/OTT

- 99.5% successful channel startup;
- p95 channel startup time below target threshold;
- less than 1% failed playback sessions;
- EPG available for at least 99% of channels;
- PMS sync completed within acceptable delay;
- high-severity incident diagnosis within target time.

### Key Lesson

The system should not only recommend architecture. It should eventually help define and protect reliability targets using latency, traffic, errors, and saturation.