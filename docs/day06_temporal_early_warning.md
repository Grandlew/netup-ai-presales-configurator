# Day 6 — Temporal Early Warning and Failure Forecasting

## Objective

Implement the first scientifically defensible temporal early-warning pipeline for NetUP ReliabilityGraph AI.

The initial target is CatchUP storage exhaustion and storage-path degradation.

The system must:

1. preserve temporal order;
2. prevent future-data leakage;
3. model trends and persistence;
4. estimate threshold-crossing time;
5. detect precursor combinations;
6. quantify data sufficiency;
7. expose uncertainty;
8. abstain when evidence is weak;
9. backtest using historical cut-off points;
10. record whether warnings were useful.

## Strategic Principle

A threshold alert says:

"Storage utilisation exceeded 90%."

A forecast says:

"At the observed growth rate, storage may cross the operational limit within 26–38 hours."

A precursor warning says:

"Storage growth, write latency, and CatchUP recording failures are jointly deteriorating before complete service failure."

These are different statements and must not be mixed.

## Temporal Reasoning Vocabulary

### Observation

A measured or reported value at a specific time.

### Trend

A sustained directional change across multiple observations.

### Anomaly

A value or segment that deviates from expected behaviour.

### Precursor

A pattern that may appear before an operational failure.

### Forecast

An estimate of a future value or future threshold crossing.

### Early Warning

A decision generated before the target failure condition occurs.

### Incident

A service degradation or failure that has already occurred.

### Prediction Horizon

How far into the future the system is attempting to forecast.

### Lead Time

The interval between warning issuance and incident onset.

### Threshold-Crossing Time

The estimated time when a monitored quantity will reach a defined limit.

### Abstention

A deliberate refusal to issue a forecast because evidence, history, data quality, or model validity is insufficient.

## Output Types

### Current-State Alert

Describes a condition that already exists.

Example:

"CatchUP storage utilisation is currently above 90%."

### Trend Warning

Describes a sustained deterioration.

Example:

"Storage utilisation has increased for six consecutive hours."

### Capacity Forecast

Estimates future threshold crossing.

Example:

"At the current robust growth estimate, storage may cross 95% within approximately 30 hours."

### Failure-Precursor Warning

Combines multiple signals that historically or logically precede failure.

Example:

"Storage growth, write latency, and recording failures are deteriorating together. CatchUP service-failure risk is elevated."

A system must not describe a current threshold breach as a prediction.

## First Forecast Target

### Target Name

CatchUP storage exhaustion

### Target Condition

The storage component reaches or exceeds a configured operational threshold.

Initial synthetic threshold:

```text
95% storage utilisation


---

# Part 5 — Define data requirements

Add:

```md
## Minimum Data Requirements

A storage-capacity forecast requires:

- ordered timestamps;
- storage-utilisation observations;
- consistent units;
- known deployment;
- known storage component;
- sufficient recent samples;
- acceptable data quality;
- bounded missing-data gaps;
- a configured operational threshold.

A failure-precursor warning additionally benefits from:

- storage-write latency;
- recording-failure rate;
- cleanup-job status;
- storage I/O errors;
- retention-policy changes;
- service-impact evidence.

## Initial Sufficiency Policy

The first implementation requires:

- at least 12 valid utilisation observations;
- at least 3 hours of covered time;
- no gap larger than a configured limit;
- at least 70% high-quality or verified samples;
- positive estimated growth for exhaustion forecasting;
- acceptable trend fit;
- no unresolved unit inconsistency.

These values are development defaults, not production standards.

## Forecasting Guardrails

The system must abstain when:

1. too few observations exist;
2. observations are not ordered;
3. duplicate timestamps conflict;
4. data quality is too low;
5. the recent time window contains large gaps;
6. units are inconsistent;
7. estimated growth is zero or negative;
8. the forecast horizon is excessively distant;
9. the trend is unstable;
10. a recent regime-changing intervention invalidates the old trend;
11. the component mapping is unresolved;
12. the threshold is already crossed.

If the threshold is already crossed, produce a current-state alert, not a forecast.

## Temporal Leakage Prevention

Future information must never influence an earlier forecast.

For every forecast issued at time `t`:

- features may use observations at or before `t`;
- labels may inspect observations after `t`;
- baselines must be fitted using data available at or before `t`;
- configuration changes after `t` must not affect the forecast;
- future incidents must not influence hypothesis ranking.

Random train/test splitting is inappropriate for temporal forecasting because it can place future samples in the training set.

Evaluation must use rolling or expanding time windows.

## Forecast Uncertainty

A point estimate alone is insufficient.

The forecast should include:

- central threshold-crossing estimate;
- lower plausible crossing time;
- upper plausible crossing time;
- data-sufficiency status;
- trend-fit quality;
- assumptions;
- abstention reason when applicable.

### Example

Central estimate:

31 hours

Plausible interval:

24–46 hours

Interpretation:

If recent storage growth continues under similar operating conditions, the configured threshold may be crossed within approximately one to two days.

### Required Warning

The interval is not a guarantee.

It assumes that:

- demand patterns remain similar;
- no cleanup or expansion occurs;
- no configuration change alters storage growth;
- telemetry remains valid;
- the trend model remains appropriate.

## Forecast Uncertainty

A point estimate alone is insufficient.

The forecast should include:

- central threshold-crossing estimate;
- lower plausible crossing time;
- upper plausible crossing time;
- data-sufficiency status;
- trend-fit quality;
- assumptions;
- abstention reason when applicable.

### Example

Central estimate:

31 hours

Plausible interval:

24–46 hours

Interpretation:

If recent storage growth continues under similar operating conditions, the configured threshold may be crossed within approximately one to two days.

### Required Warning

The interval is not a guarantee.

It assumes that:

- demand patterns remain similar;
- no cleanup or expansion occurs;
- no configuration change alters storage growth;
- telemetry remains valid;
- the trend model remains appropriate.

## Alert Persistence and Hysteresis

One noisy sample must not repeatedly open and close incidents.

### Persistence

An alert should require one of:

- multiple consecutive qualifying windows;
- a minimum duration;
- agreement across independent signals;
- a critical single event.

### Hysteresis

The condition for clearing an alert should be safer than the condition for opening it.

Example:

- open capacity warning at 90%;
- clear only after utilisation remains below 85% for a defined period.

### Deduplication

Repeated warnings for the same:

- deployment;
- component;
- failure signature;
- forecast horizon;

should update one active alert rather than create endless duplicates.

## Early-Warning Evaluation

Forecast accuracy alone is insufficient.

The system should eventually measure:

### Forecast Availability

How often the system produced a forecast instead of abstaining.

### Threshold-Crossing Error

Difference between forecast crossing time and actual crossing time.

### Early-Warning Recall

Fraction of observed incidents that received a warning within the target horizon.

### Warning Precision

Fraction of warnings followed by the target incident.

### Lead Time

How much useful time existed between warning and incident.

### False-Warning Burden

Number of warnings that did not lead to the target incident.

### Alert Persistence

Whether the warning survived multiple evaluation windows.

### Calibration

Whether forecast probabilities, once introduced, match observed frequencies.

### Engineer Usefulness

Whether engineers judged the warning actionable and correct.

## Critical Product Metric

The best forecast is not merely accurate.

It must provide enough lead time for a safe preventive intervention without generating intolerable false alarms.

## Regime Changes and Forecast Invalidation

A recent trend may become invalid after:

- retention-policy change;
- storage expansion;
- cleanup-job repair;
- occupancy shift;
- channel-count change;
- application deployment;
- hardware replacement;
- maintenance action.

A regime-changing event should:

1. close or invalidate forecasts based on the old regime;
2. begin a new baseline segment;
3. prevent old and new observations from being blindly combined;
4. trigger a temporary uncertainty increase;
5. require enough new observations before forecasting resumes.

### Example

A forecast created before storage expansion must not remain active after capacity is added.

The system must mark it:

```text
invalidated_by_intervention


Concept drift and regime shifts are central early-warning problems because the relationship between signals can change over time; a model that ignores such changes can become confidently wrong. :contentReference[oaicite:3]{index=3}

---

# Part 29 — Add metric semantics discipline

Add:

```md
## Counter and Gauge Semantics

Not all metrics behave the same way.

### Gauge

Represents a value that may increase or decrease.

Examples:

- storage utilisation;
- CPU utilisation;
- active streams;
- write latency.

### Monotonic Counter

Normally increases until reset.

Examples:

- total recording failures;
- total authentication failures;
- total bytes transmitted.

For counters, the system should reason over:

- rate;
- increase over a window;
- reset detection;

rather than raw cumulative values.

Example:

```text
recording_failure_total = 12,430
Prometheus defines `rate()` for calculating per-second average rates of counters over a range and recommends applying it before aggregation so counter resets can be detected correctly. :contentReference[oaicite:4]{index=4}

OpenTelemetry’s metrics data model distinguishes metric streams and aggregation temporalities, reinforcing that collection systems must preserve the semantic meaning of sums, gauges, and time windows. :contentReference[oaicite:5]{index=5}

