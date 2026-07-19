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

