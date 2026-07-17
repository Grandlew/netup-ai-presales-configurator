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