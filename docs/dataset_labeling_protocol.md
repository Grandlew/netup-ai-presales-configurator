# Dataset Labeling Protocol

## Labeling Objective

Create labels suitable for:

1. node-level root-cause ranking;
2. failure-type classification;
3. graph-level incident detection;
4. service-impact prediction;
5. future-risk prediction;
6. propagation-path evaluation.

## Label Types

### Root-Cause Node Label

For every architecture node:

- `1` if it is the primary injected root cause;
- `0` otherwise.

Single-fault Day 7 scenarios must contain exactly one positive root-cause node.

### Failure-Type Label

Examples:

- healthy;
- storage_capacity_saturation;
- storage_io_degradation;
- cleanup_job_failure;
- catchup_worker_failure.

### Incident Label

For every time step:

- `0`: no active service incident;
- `1`: incident active.

### Precursor Label

For every forecast horizon:

- `1` if the target incident begins within that horizon;
- `0` otherwise.

Initial horizons:

- 6 hours;
- 12 hours;
- 24 hours.

### Affected-Service Label

For each service node:

- `1` if the service is affected;
- `0` otherwise.

### Propagation-Path Label

For every edge:

- `1` if the hidden fault effect propagated across the edge;
- `0` otherwise.

### Time-to-Incident Label

Continuous value representing hours until incident onset.

Use a sentinel or mask when no incident occurs within the observation window.

## Label Provenance

Every label must record:

- simulator version;
- scenario ID;
- random seed;
- injected fault ID;
- injection timestamp;
- labeling function version;
- hidden-state reference.

## Label Integrity Rules

1. labels derive only from hidden simulator state;
2. observable features must not contain raw label values;
3. root-cause names must not appear in model-visible log messages;
4. fault-specific identifiers must be removed from model inputs;
5. scenario IDs must not encode the failure class;
6. timestamps must not trivially reveal the class;
7. training and test sets must not share cloned scenario variants.

## Dataset Export Boundary

### Hidden Export

Contains:

- exact injected fault;
- hidden component states;
- propagation path;
- simulator internals;
- full ground truth.

This file is restricted to labeling and evaluation.

### Observable Export

Contains:

- topology;
- telemetry;
- change events;
- logs;
- alarms;
- timestamps;
- data quality;
- approved labels in a separate target object.

It must not contain:

- fault parameters;
- hidden health multipliers;
- root-cause name in logs;
- simulator branch identifiers;
- future telemetry outside the prediction cut-off.

## Synthetic Label Leakage Threats

### Scenario-Name Leakage

Bad:
scenario_storage_failure_001

Better:
scenario_83f14c

### Log-Message Leakage
Bad:
Root cause: storage I/O degradation
Better: 
Write request exceeded configured timeout.

### Fault-Timing Leakage
Bad:
Every storage fault begins exactly at hour 12.
Better:
Sample injection time from a valid range.

### Topology Leakage
Bad:
All worker failures occur only in small hotels.
Better:
Every fault class appears across multiple topology families.

### Severity Leakage
Bad:
Every capacity fault has severity 1.0.
Better:
Sample severity across overlapping ranges.

### Missingness Leakage
Bad:
Only faulty scenarios contain missing telemetry.
Better:
Generate collection loss independently of fault class, while allowing some faults to affect collector health only when causally justified

### Seed Leakage
Bad:
Seeds 1–100 are healthy and 101–200 are faulty.
Better:
Randomize seeds independently of labels and store them only in hidden metadata.


---

# Part 22 — Define dataset splits

This is essential for the future GNN.

Random scenario splitting is not enough.

Add:

```md
## Dataset Splitting Protocol

### Training Split

Contains selected deployment instances and scenario seeds.

### Validation Split

Contains different deployment instances and scenario seeds.

### Test Split

Contains:

- unseen deployment instances;
- unseen topology parameter combinations;
- unseen scenario seeds;
- counterfactual pairs not represented in training.

### Out-of-Distribution Test

May contain:

- larger hotels;
- additional floors;
- redundant architectures;
- stronger missingness;
- unseen workload regimes;
- fault severities outside the training range.

## Grouping Rule

All scenarios generated from the same base topology instance must remain in one split.

A healthy/faulty counterfactual pair must remain in one split.

Cloned variants of one scenario must remain in one split.

## Temporal Rule

For scenarios derived from real deployments later:

- earlier incidents belong to training;
- later incidents belong to validation or test;
- future incidents must not leak backward.

## Future GNN Sample Contract

Each scenario window will eventually produce:

### Node Features

- component-type encoding;
- current telemetry;
- rolling means;
- rolling slopes;
- baseline deviations;
- recent-change flags;
- missingness indicators;
- component criticality;
- structural degree features.

### Edge Features

- dependency type;
- propagation direction;
- service relation;
- propagation delay;
- edge criticality.

### Node Targets

- root-cause node label;
- affected-node label.

### Graph Targets

- incident class;
- failure type;
- future-incident label.

### Edge Targets

- propagation-path label.

### Temporal Context

- window start;
- observation cut-off;
- prediction horizon;
- incident onset;
- feature mask;


