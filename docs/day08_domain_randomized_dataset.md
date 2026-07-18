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

## Dataset Philosophy

### Domain Randomization

The simulator varies nuisance and environmental parameters so that a model cannot depend on one narrow synthetic world.

Randomization does not guarantee transfer to reality.

It reduces dependence on arbitrary simulator settings and exposes model fragility.

### Confounders

A confounder resembles part of a failure signature without containing the target root cause.

Examples:

- high storage utilisation caused by normal demand;
- high write latency during a brief workload peak;
- a worker restart without sustained recording failure;
- missing telemetry during healthy service.

### Counterfactual Pair

A faulty scenario and a healthy control share the same:

- topology;
- operating regime;
- workload parameters;
- background noise policy;
- observation schedule.

They differ in the hidden fault and its consequences.

### Environment

An environment is a combination of topology and operating conditions.

Examples:

- small hotel with low occupancy;
- medium hotel with high evening demand;
- redundant middleware deployment;
- high-retention CatchUP deployment.

Environment identity is used for analysis and splitting, not as a model feature.