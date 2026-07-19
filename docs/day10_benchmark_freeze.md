# Day 10 — Benchmark Freeze

## Objective

Audit and freeze the first model-ready IPTV reliability benchmark before training classical models or graph neural networks.

The benchmark freeze must preserve:

- source dataset identity;
- model-ready dataset identity;
- feature schema;
- target schema;
- split assignment;
- graph-window hashes;
- class distributions;
- leakage-audit results;
- shortcut-audit results;
- benchmark metrics;
- acceptance criteria;
- known limitations.

## Scientific Rule

The benchmark configuration must be defined before model comparison.

Changing any of the following creates a new benchmark version:

- scenario-generation logic;
- feature schema;
- sanitization rules;
- observation window;
- prediction horizon;
- split assignment;
- target definition;
- label-generation logic;
- evaluation metric;
- inclusion or exclusion criteria.

A changed benchmark must not silently reuse results from an earlier version.

## Benchmark Statuses

### Draft

The dataset is still being inspected or corrected.

### Rejected

The dataset contains leakage, integrity failures, invalid labels, unusable imbalance, or other critical defects.

### Frozen

All mandatory audits pass and the benchmark configuration is immutable for the current experiment series.

### Superseded

A newer benchmark version replaces the frozen version.

### Production-Validated

Real operational data and engineer-reviewed outcomes have validated the benchmark assumptions.

Synthetic benchmarks cannot receive this status.

## Benchmark Tasks

### Task A — Root-Cause Node Ranking

Input:

- graph topology;
- node features available by the observation cutoff;
- edge features.

Output:

- one root-cause score for every node.

Faulty windows contain one positive root-cause node.

Healthy windows contain no positive root-cause node and must be evaluated separately.

### Task B — Future-Incident Prediction

Input:

- graph and temporal features at the observation cutoff.

Output:

- probability that the target incident begins within the prediction horizon.

Initial horizon:

- 6 hours.

### Task C — Current-Incident Detection

Output:

- whether an incident is already active at the cutoff.

This task must not be confused with forecasting.

### Task D — Failure-Type Classification

Output classes:

- healthy;
- storage capacity saturation;
- storage I/O degradation;
- cleanup-job failure;
- CatchUP worker failure.

### Task E — Affected-Service Prediction

Output:

- one affected-state score per service node.

### Task F — Time-to-Incident Estimation

Output:

- estimated hours to incident onset.

This task is evaluated only where the time-to-incident mask is active.

## Benchmark Non-Negotiables

1. No future event may appear in model features.
2. No hidden simulator state may appear in model features.
3. No scenario identifier may encode a target class.
4. No counterfactual pair may cross dataset splits.
5. No topology clone may cross dataset splits.
6. OOD data must remain isolated from model selection.
7. Test and OOD labels must not influence hyperparameter selection.
8. Feature normalization must be fitted using training data only.
9. Missing-value imputation must be fitted using training data only.
10. Threshold selection must use validation data only.
11. Test evaluation must occur only after the model configuration is frozen.
12. Every reported result must identify the benchmark fingerprint.

## Benchmark Versioning

Use semantic benchmark versions:

MAJOR.MINOR.PATCH

###Patch Increment
Use when correcting:

documentation;
report formatting;
non-semantic metadata;
code that does not change exported samples.

Example:
0.1.0 → 0.1.1
Minor Increment

Use when changing:

feature schema;
target schema;
scenario count;
split membership;
observation window;
prediction horizon;
supported failure class;
sanitization logic.

Example:
0.1.0 → 0.2.0
Major Increment

Use when changing:

core task definition;
simulation-generation philosophy;
single-fault to multi-fault assumptions;
IPTV-only to multi-domain benchmark;
label semantics in a non-compatible way.

Example:
Major Increment

Use when changing:

core task definition;
simulation-generation philosophy;
single-fault to multi-fault assumptions;
IPTV-only to multi-domain benchmark;
label semantics in a non-compatible way.

Example:
0.2.0 → 1.0.0
Result Compatibility

Results from different benchmark fingerprints must not be placed in one comparison table without explicitly identifying the dataset difference.

## Day 10 Study Notes

### A Dataset Must Be Audited Before It Is Modeled

Strong model performance cannot rescue a contaminated benchmark.

### The Test Split Is Not a Development Tool

It must not guide architecture or hyperparameter decisions.

### Trivial Baselines Are Scientific Instruments

A simple shortcut model can expose leakage that a complex GNN would hide.

### Ranking Tasks Need Ranking Metrics

Root-cause localization should not be judged primarily by node accuracy.

### Healthy Systems Require Abstention

A diagnosis system must learn when no root cause is present.

### OOD Results Must Be Separate

Good in-distribution performance does not imply deployment generalization.

### Fingerprints Create Experimental Identity

A benchmark result is meaningful only when the exact dataset version can be reconstructed.

### Synthetic Evidence Has a Boundary

Synthetic benchmarks can validate software and reject weak approaches.

They cannot validate production reliability.

## Day 10 Moat Statement

NetUP ReliabilityGraph AI will not compare models on an undocumented, mutable synthetic dataset.

Its benchmark governance will preserve:

- dataset cards;
- immutable benchmark versions;
- feature and target contracts;
- temporal cutoffs;
- group-safe splits;
- file-level fingerprints;
- automated leakage audits;
- shortcut baselines;
- root-cause ranking metrics;
- abstention metrics;
- early-warning lead time;
- OOD evaluation;
- reproducible reports.

The immediate moat is not model complexity.

It is the ability to prove that a reported improvement came from learning useful operational structure rather than exploiting dataset contamination.