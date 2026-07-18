# Day 9 — Leakage-Safe Temporal Graph Windows

## Objective

Convert Day 8 raw simulator scenarios into sanitized, cutoff-safe, model-ready temporal graph samples.

The exported dataset must support:

- classical machine-learning baselines;
- node-level root-cause ranking;
- graph-level incident classification;
- service-impact prediction;
- future-incident prediction;
- the first GraphSAGE model.

## Core Boundary

Day 8 raw scenarios are research artifacts.

Day 9 model-ready windows are training artifacts.

No model may train directly from Day 8 raw scenario JSON.

## Required Transformations

1. remove simulator-only metadata;
2. remove pair and environment identifiers;
3. remove confounder labels;
4. remove hidden-state fields;
5. remove events after the observation cutoff;
6. aggregate observations into node features;
7. preserve missingness indicators;
8. construct labels from approved targets;
9. generate opaque window identifiers;
10. preserve split isolation.

## Dataset Boundary

### Raw Research Dataset

Contains:

- observable scenarios;
- hidden scenarios;
- dataset manifest;
- pair identity;
- environment identity;
- random seeds;
- confounder plans;
- simulator metadata;
- full scenario duration.

Example:

day08_dataset/
├── train/
├── validation/
├── test/
├── ood_test/
├── manifest.json
└── audit.json

### Model-Ready Dataset
Contains only:

graph structure;
approved node features;
approved edge features;
temporal masks;
approved targets;
cutoff and horizon metadata;
split identity.

Example:
day09_model_ready/
├── train/
├── validation/
├── test/
├── ood_test/
├── manifest.json
└── audit.json
## Temporal Window Definition

A model-ready sample is defined by:

- scenario;
- observation-window start;
- observation cutoff;
- prediction horizon;
- graph topology;
- visible telemetry up to the cutoff;
- targets after the cutoff.

### Example

Observation window:


08:00–14:00

Prediction horizon:
next 6 hours
Input data:
events observed at or before 14:00
Target data:
whether an incident starts after 14:00 and by 20:00
Events after 14:00 must never become features.

Initial Window Configuration

Observation lookback:

3 hours;
6 hours;
12 hours.

Prediction horizons:

6 hours;
12 hours;
24 hours.

Initial Day 9 default:
6-hour observation window
6-hour prediction horizon

## Day 9 Scientific Safeguards

### Cutoff Integrity

Every feature must be computable using information available at the observation cutoff.

### Target Isolation

Ground truth may be read only by the target-building subsystem.

### Identifier Opacity

Scenario and window IDs must not contain:

- failure class;
- health state;
- topology family;
- split;
- incident state.

### Metadata Isolation

Research metadata remains in the raw dataset only.

### Feature Consistency

Every node window uses the same feature ordering.

Every edge window uses the same feature ordering.

### Missingness Preservation

Missing telemetry is represented explicitly rather than hidden through silent imputation.

### Split Preservation

A window inherits the split of its source scenario.

No Day 9 operation may reassign splits.

### Raw Dataset Immutability

The Day 8 dataset remains unchanged.

Day 9 writes to a separate output directory.