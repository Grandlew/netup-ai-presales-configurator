# Day 4 — Operational Telemetry Contract

## Objective

Define the normalized operational-data contract used by NetUP ReliabilityGraph AI to represent metrics, logs, alarms, configuration changes, external probes, maintenance actions, and user-reported symptoms from running IPTV/OTT deployments.

The contract must preserve:

- deployment identity;
- component identity;
- service impact;
- event time;
- ingestion time;
- semantic signal name;
- measurement unit;
- collection source;
- data quality;
- topology mapping;
- baseline context;
- change proximity;
- evidence lineage.

## Core Rule

No observation may influence causal diagnosis or predictive forecasting unless it can be linked to:

1. a known deployment;
2. a known NRIM architecture component;
3. a valid timestamp;
4. a known signal definition;
5. an explicit data-quality level.

Unmapped or invalid telemetry may be stored temporarily, but it must be quarantined from diagnostic reasoning.

## Operational Telemetry Pipeline

The telemetry pipeline contains eight stages:

1. Collect
2. Normalize
3. Validate
4. Resolve component identity
5. Map to topology
6. Enrich with operational context
7. Detect abnormal behaviour
8. Attach evidence to a Reliability Case

### Stage 1 — Collect

Potential sources include:

- NetUP application logs;
- NetUP APIs, if available;
- Linux system metrics;
- database metrics;
- storage metrics;
- network switch telemetry;
- SNMP;
- syslog;
- SmartTV or STB events;
- PMS integration logs;
- external playback probes;
- engineer observations;
- hotel staff reports.

### Stage 2 — Normalize

Convert supported source records into one canonical telemetry format.

### Stage 3 — Validate

Reject or quarantine records with:

- invalid timestamps;
- missing deployment identity;
- missing component identity;
- invalid signal names;
- impossible values;
- invalid units;
- duplicated identifiers;
- malformed attributes.

### Stage 4 — Resolve Component Identity

Map external identifiers such as IP addresses, hostnames, switch ports, service names, or device cohorts to NRIM architecture nodes.

### Stage 5 — Map to Topology

Connect each observation to:

- the component that produced it;
- the service it may affect;
- the deployment topology;
- the affected scope.

### Stage 6 — Enrich With Context

Add:

- four-golden-signal classification;
- baseline comparison;
- recent changes;
- component criticality;
- service impact;
- related incident;
- related Reliability Case.

### Stage 7 — Detect Abnormal Behaviour

Evaluate:

- deterministic limits;
- rate of change;
- persistence;
- baseline deviation;
- cross-signal agreement;
- topology scope;
- change proximity.

### Stage 8 — Attach Evidence to a Reliability Case

Important observations become evidence for:

- operational-health cases;
- root-cause cases;
- predictive-reliability cases.

## Telemetry Signal Classes

### Metric

A numeric measurement sampled over time.

Examples:

- CPU utilization;
- memory utilization;
- storage utilization;
- disk-write latency;
- network throughput;
- packet errors;
- active streams;
- channel-start latency.

### Log

A structured or unstructured record produced by an application, operating system, device, or integration.

Examples:

- middleware exception;
- authentication failure;
- EPG ingestion error;
- CatchUP recording failure;
- PMS synchronization failure.

### Alarm

A warning or fault state emitted by an existing monitoring system.

Examples:

- storage threshold exceeded;
- service unavailable;
- switch port down;
- database unavailable.

### Service Event

A domain-specific event representing an IPTV or hotel-service action.

Examples:

- channel start requested;
- channel start failed;
- user authenticated;
- recording job completed;
- EPG import completed;
- PMS synchronization completed.

### Configuration Change

A modification to system configuration.

Examples:

- VLAN changed;
- retention period changed;
- channel remapped;
- middleware setting changed;
- authorization package changed.

### Software Update

A software release or deployment.

### Firmware Update

A firmware change applied to SmartTVs, STBs, switches, storage, or other equipment.

### Maintenance Action

A human or automated operational action.

Examples:

- service restart;
- switch replacement;
- storage expansion;
- configuration rollback.

### External Probe

A synthetic test performed outside the target component.

Examples:

- start a test channel;
- load EPG;
- authenticate a test user;
- play a CatchUP sample;
- measure startup latency.

### User-Reported Symptom

An observation reported by hotel staff, guests, engineers, or support personnel.

Examples:

- channels freeze on floor three;
- CatchUP is unavailable;
- EPG is empty;
- some LG TVs cannot log in.

## Canonical Telemetry Event

Every normalized observation must contain:

| Field | Purpose |
|---|---|
| `schema_version` | Telemetry-contract version |
| `event_id` | Globally unique event identifier |
| `deployment_id` | Operating deployment |
| `component_node_id` | NRIM architecture component |
| `service_node_ids` | Potentially affected services |
| `observed_at` | Time the event occurred |
| `ingested_at` | Time the platform received it |
| `timezone_source` | Original timezone information |
| `clock_skew_ms` | Known source-clock difference |
| `signal_type` | Metric, log, alarm, change, probe, etc. |
| `signal_name` | Controlled semantic name |
| `value` | Observed value |
| `unit` | Canonical unit |
| `attributes` | Structured dimensions |
| `collection_source` | Agent, API, SNMP, parser, manual input, etc. |
| `source_record_id` | Original source identifier |
| `quality` | Data-quality classification |
| `golden_signal` | Latency, traffic, errors, saturation, or null |
| `baseline_status` | Baseline assessment |
| `baseline_value` | Expected value when available |
| `deviation_score` | Difference from expected behaviour |
| `case_id` | Related Reliability Case |
| `evidence_ids` | Supporting evidence references |

## Time Semantics

The system must preserve two timestamps.

### Observed Time

The time when the behaviour actually occurred.

### Ingested Time

The time when the platform received the record.

These may differ because of:

- batch log delivery;
- disconnected collectors;
- delayed network transmission;
- manual incident reporting;
- clock drift;
- timezone differences.

All timestamps must be normalized to UTC.

The original timezone or UTC offset should be preserved when available.

The system must never assume that ingestion order is identical to event order.

## Telemetry Data Quality

Every observation must receive a quality level.

### Verified

The source, component mapping, timestamp, and value have been independently verified.

### High

The source is trusted and component mapping is reliable.

### Medium

The source is plausible, but one or more weaknesses exist:

- incomplete mapping;
- uncertain clock accuracy;
- imperfect parsing;
- missing samples;
- limited source verification.

### Low

The record is incomplete, manually entered, weakly mapped, or otherwise uncertain.

### Quarantined

The record failed validation and must not influence diagnosis or forecasting.

## Quality Dimensions

Quality should eventually consider:

- source authenticity;
- component mapping confidence;
- timestamp reliability;
- completeness;
- unit validity;
- sampling consistency;
- duplication;
- parser confidence;
- source health;
- missing intervals.

## Critical Rule

Low-quality evidence may support investigation.

It must not independently establish a root cause.

## Four Golden Signals

### Latency

Measures how long an operation takes.

Examples:

- channel-start time;
- middleware response time;
- CatchUP playback-start time;
- storage-write latency;
- EPG load time;
- PMS synchronization duration.

### Traffic

Measures system demand.

Examples:

- concurrent streams;
- active viewers;
- middleware request volume;
- multicast packet rate;
- network throughput;
- CatchUP sessions;
- VoD sessions.

### Errors

Measures failed operations.

Examples:

- failed channel starts;
- authentication failures;
- EPG ingestion failures;
- CatchUP recording failures;
- playback interruptions;
- PMS synchronization failures;
- packet errors;
- SmartTV application crashes.

### Saturation

Measures proximity to resource limits.

Examples:

- CPU utilization;
- memory pressure;
- disk utilization;
- storage I/O queue;
- network-link utilization;
- tuner usage;
- session limits;
- licence capacity.

## Minimum Viable Operational Signal Set

### Host Signals

- CPU utilization;
- memory utilization;
- disk utilization;
- disk read/write latency;
- disk I/O errors;
- process state;
- process restart count;
- database connection health.

### Network Signals

- interface throughput;
- interface utilization;
- packet errors;
- packet discards;
- port state;
- multicast packet rate;
- uplink utilization;
- IGMP state, when available.

### IPTV Service Signals

- channel-start attempts;
- channel-start successes;
- channel-start failures;
- channel-start latency;
- active-stream count;
- playback interruption count;
- CatchUP recording success;
- CatchUP recording failures;
- CatchUP playback success;
- VoD playback success;
- EPG freshness;
- authentication success;
- authentication failures;
- PMS synchronization success;
- PMS synchronization failures.

### Change Signals

- configuration revision;
- service restart;
- software deployment;
- firmware update;
- VLAN change;
- channel remapping;
- retention-policy change;
- storage expansion;
- component replacement.

### External Probe Signals

- test channel reachable;
- test channel startup latency;
- EPG endpoint reachable;
- CatchUP sample playable;
- middleware login successful.

### User-Reported Scope

- affected rooms;
- affected floors;
- affected channels;
- affected device models;
- affected firmware versions;
- first observed time;
- intermittent or continuous;
- full or partial outage.

## Semantic Signal Naming Convention

Signal names use:

domain.subsystem.measurement

### Naming Rules

1. Use lowercase.
2. Separate semantic levels with periods.
3. Do not embed deployment IDs in signal names.
4. Do not embed component IDs in signal names.
5. Put dimensions in structured attributes.
6. Use one canonical unit per signal.
7. Avoid meaningless names such as `error`, `status`, `value`, or `metric1`.
## Cardinality Protection

Do not add unbounded values to metric attributes.

Dangerous metric attributes include:

- guest names;
- session IDs;
- complete request IDs;
- raw URLs;
- arbitrary error messages;
- unique room IDs for every metric;
- raw document text.

Preferred bounded dimensions include:

- deployment ID;
- component type;
- service type;
- floor group;
- switch ID;
- VLAN ID;
- TV model group;
- firmware cohort;
- channel group;
- severity;
- result status.

High-cardinality details belong in logs or Reliability Case evidence, not metric labels.

## Topology Mapping

Every accepted observation must reference:

- an existing deployment;
- an existing NRIM architecture node.

It may also reference:

- affected services;
- floors;
- switches;
- VLANs;
- room groups;
- channel groups;
- device cohorts;
- incidents;
- Reliability Cases.

### Example

Observation:

```text
network.interface.packet_discards increased

## Change Proximity

Operational anomalies should be checked against recent:

- configuration changes;
- software releases;
- firmware updates;
- network changes;
- service restarts;
- maintenance actions.

Initial look-back windows may include:

- 15 minutes;
- 1 hour;
- 6 hours;
- 24 hours;
- 7 days.

Temporal proximity increases the relevance of a change.

It does not prove causality.

A change becomes a confirmed cause only after:

- diagnostic evidence;
- successful rollback;
- repeatable reproduction;
- engineer confirmation;
- verified intervention outcome.
## Anomaly Strength

One threshold breach should not automatically become an incident.

Anomaly strength should consider:

- magnitude;
- duration;
- rate of change;
- recurrence;
- baseline deviation;
- data quality;
- related signals;
- affected services;
- topology scope;
- recent changes.

Weak evidence:

```text
CPU reached 87% once.

