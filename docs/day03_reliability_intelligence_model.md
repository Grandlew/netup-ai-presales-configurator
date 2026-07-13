# Day 3 — NetUP Reliability Intelligence Model

## Objective

Define the proprietary intelligence model behind NetUP ReliabilityGraph AI.

The platform must support both:

1. architecture assurance for systems being designed;
2. operational reliability intelligence for systems already running.

The system will not rely on one generic deployment graph. It will maintain structured reliability cases containing requirements, architecture, causal failure hypotheses, evidence, operational observations, interventions, and verified outcomes.

## Strategic Principle

The interface can be copied.

The prompts can be copied.

A graph visualization can be copied.

The difficult assets to copy are:

- validated requirement-to-architecture mappings;
- NetUP and hospitality IPTV compatibility knowledge;
- operating baselines for different deployment types;
- evidence-linked failure signatures;
- engineer corrections;
- diagnostic-test outcomes;
- successful and unsuccessful interventions;
- calibrated forecasts from real operating systems.

Every completed case should make future recommendations and diagnoses more accurate.

## Six Intelligence Layers

### Layer 1 — Requirement Intelligence

Represents what the customer or operating environment requires.

Examples:

- number of rooms;
- number and type of channels;
- SmartTV or STB deployment;
- CatchUP retention;
- mobile viewing;
- PMS integration;
- uptime target;
- redundancy requirement;
- support constraints.

Requirement intelligence must distinguish:

- explicit requirements;
- inferred requirements;
- assumptions;
- unresolved questions;
- conflicting requirements.

### Layer 2 — Architecture Intelligence

Represents what is installed or proposed.

Examples:

- signal sources;
- gateways;
- streamers;
- transcoders;
- middleware;
- billing;
- storage;
- EPG services;
- switches;
- VLANs;
- SmartTV groups;
- PMS integrations;
- monitoring systems.

Architecture intelligence must support two states:

- `proposed`: design-time architecture;
- `observed`: architecture verified in a running deployment.

### Layer 3 — Failure-Causality Intelligence

Represents how faults can arise and propagate.

Examples:

- storage saturation can cause CatchUP recording failure;
- VLAN misconfiguration can cause unreachable room devices;
- multicast flooding can cause packet loss and freezing;
- stale EPG ingestion can cause missing guide information;
- firmware incompatibility can cause failures in one TV cohort.

A dependency is not automatically a cause.

The model must distinguish:

- structural dependency;
- causal possibility;
- observed correlation;
- verified root cause.

### Layer 4 — Evidence and Uncertainty Intelligence

Represents why the system believes something.

Evidence can come from:

- customer statements;
- forms;
- uploaded documents;
- product documentation;
- deterministic rules;
- configuration exports;
- logs;
- metrics;
- diagnostic tests;
- engineer confirmation;
- historical cases.

Every non-trivial inference must be traceable to evidence.

### Layer 5 — Intervention and Outcome Intelligence

Represents what was recommended, approved, executed, and observed.

Examples:

- enabled IGMP snooping;
- corrected VLAN membership;
- expanded CatchUP storage;
- changed EPG mapping;
- rolled back SmartTV firmware;
- restarted or reconfigured middleware.

The system must record:

- proposed action;
- approval status;
- execution time;
- affected components;
- rollback plan;
- observed result;
- success classification;
- engineer notes.

### Layer 6 — Temporal Operational Twin

Represents how an operating deployment changes over time.

It stores:

- metric observations;
- logs;
- alarms;
- configuration changes;
- software updates;
- maintenance actions;
- incidents;
- health states;
- forecasts.

The operational twin combines:

- static architecture;
- time-dependent behaviour;
- changes;
- incident history;
- verified outcomes.

## Product Modes

### Mode 1 — Architecture Assurance

Used before deployment or major expansion.

Questions answered:

- Is the requirement set complete?
- What architecture satisfies it?
- Which assumptions remain unverified?
- Where are the single points of failure?
- Which capacity and compatibility risks exist?
- What must an engineer validate?

### Mode 2 — Operational Health

Used for an already running system.

Questions answered:

- Which components are unhealthy now?
- Which services are degrading?
- Which anomalies share a common dependency?
- Has system behaviour deviated from its normal baseline?

### Mode 3 — Root-Cause Diagnosis

Used when an incident or degradation is observed.

Questions answered:

- What are the highest-ranked root-cause hypotheses?
- Which evidence supports or contradicts each hypothesis?
- Which diagnostic test should be performed next?
- Which action is safe and reversible?

### Mode 4 — Predictive Reliability

Used only after sufficient historical operating data exists.

Questions answered:

- Which component or service has elevated failure risk?
- What is the prediction horizon?
- Which trend and dependency evidence supports the forecast?
- What preventive action should be considered?

Predictive reliability must not be presented as guaranteed failure prediction.

## Reliability Case

A Reliability Case is the main knowledge unit of NRIM.

A case contains:

- project and deployment context;
- requirements;
- architecture;
- observations;
- changes;
- failure hypotheses;
- evidence;
- diagnostic tests;
- interventions;
- outcomes;
- reusable lessons.

### Core Entities

#### Project

A commercial or engineering engagement.

#### Deployment

The proposed or operating IPTV/OTT system.

#### Incident

A specific service degradation or failure.

#### Reliability Case

The complete reasoning record connecting requirements, architecture, evidence, decisions, and outcomes.

A project may contain multiple deployments.

A deployment may contain multiple incidents.

Each architecture review or incident investigation may create a Reliability Case.

## Node Categories

### Requirement Nodes

- FunctionalRequirement
- CapacityRequirement
- AvailabilityRequirement
- CompatibilityRequirement
- IntegrationRequirement
- SecurityRequirement
- OperationalRequirement
- BudgetConstraint
- RegulatoryConstraint
- MissingRequirement
- ConflictingRequirement

### Architecture Nodes

- Site
- SignalSource
- Gateway
- Streamer
- Transcoder
- Middleware
- Billing
- Database
- Storage
- EPGService
- CatchUPService
- TimeShiftService
- VoDService
- CoreSwitch
- DistributionSwitch
- VLAN
- SmartTVGroup
- STBGroup
- MobileClient
- WebClient
- PMS
- MonitoringSystem
- ExternalProbe

### Failure Nodes

- Symptom
- FailureMode
- RootCauseHypothesis
- ContributingFactor
- Bottleneck
- SinglePointOfFailure
- CapacityViolation
- CompatibilityConflict
- ConfigurationError
- MissingDependency
- ServiceDegradation
- PredictedFailureRisk

### Reasoning Nodes

- Evidence
- Assumption
- Contradiction
- MissingInformation
- ValidationDecision
- ConfidenceAssessment
- FailureSignature
- ReusableLesson

### Action Nodes

- DiagnosticQuestion
- DiagnosticTest
- RecommendedIntervention
- ApprovedIntervention
- ExecutedIntervention
- VerificationTest
- Outcome

### Operational Nodes

- MetricObservation
- LogEvent
- Alarm
- ConfigurationChange
- SoftwareUpdate
- MaintenanceAction
- Incident
- HealthState
- Forecast
- BaselineProfile

## Relationship Types

### Requirement Relationships

- requires
- constrained_by
- conflicts_with
- satisfied_by
- partially_satisfied_by
- not_satisfied_by

### Architecture Relationships

- receives_from
- sends_to
- controls
- authenticates_with
- stores_for
- integrates_with
- serves
- shares_network_with
- belongs_to_vlan
- protected_by
- monitored_by
- depends_on

### Causal Relationships

- can_cause
- contributes_to
- propagates_to
- manifests_as
- increases_risk_of
- prevented_by
- detected_by

### Evidence Relationships

- supported_by
- contradicted_by
- derived_from
- assumed_from
- confirmed_by
- rejected_by
- observed_in
- similar_to_case

### Diagnostic Relationships

- tests_hypothesis
- distinguishes_between
- produces_evidence
- rules_out
- increases_confidence_in
- decreases_confidence_in

### Intervention Relationships

- addresses
- approved_by
- executed_on
- produced_outcome
- verified_by
- resolved_by
- learned_from

### Temporal Relationships

- observed_on
- occurred_before
- occurred_after
- preceded
- followed
- changed
- deviates_from_baseline
- predicted_to_cause

## Critical Modeling Rule

The following relationships must not be treated as equivalent:

- `depends_on`;
- `correlates_with`;
- `can_cause`;
- `confirmed_by`.

Example:

CatchUPService `depends_on` Storage.

Storage saturation `can_cause` CatchUP recording failure.

The fact that two events occur together does not prove causation.

## Knowledge States

Every important node and relationship must have one of these states:

- `confirmed`: directly supplied or verified;
- `extracted`: parsed from a source but not independently verified;
- `inferred`: derived from evidence or rules;
- `assumed`: introduced because required information is missing;
- `recommended`: proposed by the system;
- `observed`: measured in an operating deployment;
- `verified`: confirmed by an engineer or validated outcome;
- `rejected`: disproved or rejected;
- `unknown`: insufficient evidence.

### Evidence Requirement

The following states require evidence:

- extracted;
- inferred;
- assumed;
- recommended;
- observed;
- verified;
- rejected.

A system conclusion without evidence must not be treated as reliable.

## Confidence Model

Confidence must not be a decorative percentage invented by the LLM.

Confidence should eventually combine:

- evidence quality;
- evidence agreement;
- rule strength;
- historical success rate;
- similarity to validated cases;
- contradictory evidence;
- missing information;
- model calibration.

### Initial V1 Rule

During early development:

- confirmed user input: confidence 1.0;
- deterministic logical implication: confidence 1.0 for the implication itself;
- product-documentation fact: confidence depends on source quality;
- unsupported assumption: no numerical confidence;
- predicted root cause: confidence must remain provisional;
- forecast: confidence requires historical calibration.

Unknown confidence is better than fake precision.

## Failure Signature

A Failure Signature is a reusable diagnostic pattern.

It connects:

- symptoms;
- affected scope;
- shared dependencies;
- telemetry changes;
- recent configuration changes;
- likely causes;
- contradicting observations;
- diagnostic tests;
- effective interventions;
- verified outcomes.

### Failure Signature Example

#### Identifier

FS_MULTICAST_DISTRIBUTION_SCOPE_001

#### Symptoms

- video freezing across several rooms;
- multiple channels affected;
- only one floor affected;
- middleware remains accessible.

#### Shared Dependencies

- same distribution switch;
- same IPTV VLAN;
- same uplink.

#### Supporting Observations

- packet discards increased;
- multicast traffic spiked;
- switch-port errors rose;
- headend playback remained healthy.

#### Root-Cause Hypotheses

1. IGMP configuration error;
2. switch saturation;
3. VLAN membership error;
4. damaged or unstable uplink.

#### Discriminating Tests

- compare playback before and after the distribution switch;
- inspect switch port errors;
- verify IGMP snooping and querier state;
- verify VLAN membership;
- inspect uplink utilisation.

#### Possible Interventions

- correct IGMP settings;
- correct VLAN membership;
- replace or reconfigure the switch;
- repair the uplink;
- increase network capacity.

#### Outcome Values

- solved;
- partially solved;
- not solved;
- unknown.

## Diagnostic Question Selection

The assistant must not ask every possible question.

It should rank questions and tests using:

- expected information gain;
- time required;
- cost;
- invasiveness;
- operational risk;
- expertise required;
- number of hypotheses distinguished.

### Preferred Diagnostic Test

A strong test:

- distinguishes between leading hypotheses;
- is fast;
- is safe;
- is reversible;
- produces objective evidence;
- does not interrupt hotel service unnecessarily.

### Example

Competing hypotheses:

- middleware failure;
- distribution-switch failure;
- SmartTV firmware failure.

Question:

"Are all affected rooms connected to the same distribution switch?"

Why it is valuable:

- a yes result strengthens the network hypothesis;
- a no result weakens it;
- it costs almost nothing;
- it requires no outage.

## Operational Telemetry Concept

An Operational Observation must identify:

- deployment;
- component;
- timestamp;
- signal type;
- signal name;
- value;
- unit;
- collection source;
- data quality;
- sampling interval;
- baseline comparison;
- evidence reference.

### Signal Types

- metric;
- log;
- event;
- alarm;
- configuration change;
- maintenance action;
- external probe result;
- user-reported symptom.

### Four Golden Signals

#### Latency

Examples:

- channel startup time;
- middleware response time;
- CatchUP playback start time;
- EPG loading time;
- PMS synchronisation delay.

#### Traffic

Examples:

- concurrent streams;
- active viewers;
- middleware request volume;
- network throughput;
- CatchUP and VoD sessions.

#### Errors

Examples:

- playback failures;
- authentication failures;
- EPG ingestion errors;
- PMS synchronisation errors;
- SmartTV application crashes.

#### Saturation

Examples:

- CPU utilisation;
- memory utilisation;
- disk capacity;
- storage-write latency;
- network utilisation;
- tuner capacity;
- concurrent-session capacity.

### Change Events

The system must also record:

- configuration changes;
- software updates;
- firmware updates;
- channel remapping;
- VLAN changes;
- storage policy changes;
- restarts;
- maintenance actions.

Operational anomalies occurring after a change should raise the relevance of that change without automatically proving causality.

## Failure Predictability Classes

### Class A — Trend-Predictable Failures

These often provide measurable warning signals.

Examples:

- storage exhaustion;
- bandwidth saturation;
- increasing middleware latency;
- rising database load;
- growing authentication failures;
- device-cohort error increase.

### Class B — Condition-Predictable Failures

These may occur when a known condition is reached.

Examples:

- session limit reached;
- licence capacity reached;
- storage threshold exceeded;
- unsupported firmware deployed;
- redundancy removed.

### Class C — Change-Induced Failures

These often follow a deployment or configuration change.

Examples:

- VLAN misconfiguration;
- incorrect EPG mapping;
- incompatible firmware update;
- middleware configuration regression.

### Class D — Abrupt Failures

These may provide little warning.

Examples:

- sudden power loss;
- hardware destruction;
- cable disconnection;
- abrupt upstream signal loss.

The system must not claim equal predictability across all classes.

## Learning Flywheel

1. Customer submits requirements or reports a symptom.
2. The system creates a Reliability Case.
3. Requirements and architecture are structured.
4. Risks or root-cause hypotheses are generated.
5. Evidence is attached to every conclusion.
6. An engineer accepts, rejects, or corrects the result.
7. Diagnostic tests are recorded.
8. Interventions are approved and executed.
9. Outcomes are verified.
10. Failure signatures and rules are updated.
11. Confidence calibration improves.
12. Future cases benefit from the validated result.

The moat is not raw data.

The moat is structured, evidence-linked, engineer-validated, outcome-verified reliability intelligence.

