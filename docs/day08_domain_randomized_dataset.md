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

## Shortcut Audit

Before training any model, test whether trivial predictors can recover the label from:

1. room count only;
2. floor count only;
3. topology family only;
4. event count only;
5. missing fraction only;
6. scenario duration only;
7. injection-time proxy;
8. telemetry quality only;
9. device cohort only;
10. scenario identifier characters.

If a trivial feature strongly predicts the failure class, the dataset generator is leaking information.

### Acceptance Rule

No irrelevant single feature should produce strong failure classification performance.

A model should need:

- telemetry behaviour;
- temporal relationships;
- topology;
- dependency structure;
- cross-signal evidence.

## Research Environments

The dataset represents multiple environments rather than one pooled synthetic distribution.

Examples:

- low-occupancy small hotels;
- high-occupancy small hotels;
- non-redundant medium hotels;
- redundant medium hotels;
- short-retention deployments;
- long-retention deployments;
- high-missingness deployments.

Models should eventually be evaluated:

1. overall;
2. per failure class;
3. per topology family;
4. per environment;
5. on unseen environments;
6. on the OOD split.

Average performance can hide complete failure in one environment.

## Future Heterogeneous Graph Representation

The deployment contains different node types:

- middleware;
- storage;
- service;
- database;
- network switch;
- client cohort.

It also contains different edge types:

- depends_on;
- stores_on;
- connected_to;
- serves;
- sends_to.

A future heterogeneous representation can preserve these distinctions directly.

The first GraphSAGE experiment may still use a homogeneous conversion with:

- node-type one-hot features;
- edge-type encodings;
- explicit propagation direction.

The heterogeneous representation should become a challenger, not an untested default.

## Day 8 Study Notes

### More Synthetic Data Is Not Automatically Better

A million scenarios generated from one narrow mechanism may be less useful than a smaller but carefully varied dataset.

### Randomization Must Be Meaningful

Parameters should represent plausible architectural and operational variation.

Completely arbitrary randomization can create impossible systems.

### Confounders Make Diagnosis Non-Trivial

Healthy systems must occasionally resemble faulty systems.

Faulty systems must not always contain extreme symptoms.

### Counterfactual Pairs Isolate Fault Effects

Matched healthy and faulty runs help distinguish fault-driven behaviour from normal workload variation.

### Missingness Must Not Reveal the Label

Telemetry loss must appear in healthy and faulty cases unless a fault causally affects the collector.

### Splits Must Be Group-Aware

Related scenarios and topology clones must remain in one split.

### OOD Evaluation Is Essential

A graph model must be tested on deployment structures and operating regimes not represented during training.

### Synthetic Success Is Development Evidence

Synthetic results can reject bad methods.

They cannot establish production effectiveness.

## Day 8 Moat Statement

The project will not create a synthetic benchmark designed to make one model look impressive.

Its dataset-generation system will preserve:

- environment identity;
- topology provenance;
- controlled randomization;
- hidden fault mechanisms;
- counterfactual controls;
- confounders;
- observation noise;
- missingness mechanisms;
- topology-grouped splits;
- out-of-distribution environments;
- leakage audits;
- reproducible generation manifests.

The immediate value is a defensible research benchmark.

The long-term value is a framework that can gradually replace synthetic parameter distributions with distributions estimated from real NetUP deployments.

The moat is not synthetic volume.

It is controlled, auditable, topology-aware reliability experimentation linked to future real-world evidence.