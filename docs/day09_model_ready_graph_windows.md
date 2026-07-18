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
