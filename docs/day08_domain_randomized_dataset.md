# Day 8 — Domain-Randomized Reliability Dataset

## Objective

Transform the Day 7 single-scenario simulator into a reproducible, domain-randomized dataset generator.

The generated dataset must vary:

- hotel topology;
- room and floor counts;
- middleware redundancy;
- storage architecture;
- workload;
- occupancy;
- retention policy;
- bitrate;
- fault type;
- fault severity;
- fault timing;
- telemetry quality;
- telemetry missingness;
- harmless confounders.

## Core Scientific Rule

The failure label must remain statistically independent of all irrelevant simulator choices.

The model should not be able to infer the target from:

- scenario identifiers;
- random seeds;
- topology family alone;
- injection timestamp alone;
- missingness alone;
- hotel size alone;
- telemetry-source names;
- fault-specific log wording.

## Dataset Goal

The dataset should support:

1. root-cause node ranking;
2. failure-type classification;
3. graph-level incident detection;
4. affected-service prediction;
5. future-failure prediction;
6. propagation-path prediction;
7. out-of-distribution evaluation.