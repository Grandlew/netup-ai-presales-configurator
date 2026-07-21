# Day 11 — Root-Cause Ranking Baselines

## Objective

Implement deterministic and topology-aware baselines for node-level root-cause ranking on the frozen NRIM IPTV Reliability Benchmark.

The baselines establish the minimum performance that future learned models must exceed.

## Scientific Principle

A graph neural network is not automatically useful because it processes a graph.

It must outperform:

- random ranking;
- component-priority heuristics;
- telemetry anomaly ranking;
- error-signal ranking;
- explicit topology propagation;
- engineering-rule combinations.

## Primary Task

For every faulty temporal graph window:

1. assign one root-cause score to every node;
2. rank nodes from highest to lowest;
3. locate the true root-cause node;
4. calculate ranking metrics.

## Healthy Windows

Healthy windows contain no root-cause node.

The system must support abstention rather than always selecting one component.

## Benchmark Discipline

- training data may define static feature conventions;
- validation data selects abstention thresholds;
- test data evaluates frozen configurations;
- OOD data is reported separately;
- no test or OOD labels may influence threshold selection.

## Day 11 Baselines

### B0 — Random Ranking

Assign reproducible random scores to nodes.

Purpose:

- establish chance-level ranking;
- verify metric implementation;
- detect suspiciously easy datasets.

### B1 — Static Criticality

Rank components using fixed domain-neutral node-type priorities.

Possible high-criticality components:

- storage;
- middleware;
- database;
- core network;
- service processes.

Purpose:

- test whether topology roles alone reveal the answer.

### B2 — Maximum Anomaly Evidence

Rank nodes using the strongest observed telemetry deviation.

Candidate evidence:

- high storage utilization;
- high I/O latency;
- I/O errors;
- recording failures;
- restart count;
- signal slopes.

Purpose:

- test whether one-node telemetry already solves diagnosis.

### B3 — Error Evidence

Rank nodes using explicit error and failure signals.

Candidate features:

- disk I/O errors;
- recording failures;
- restart count;
- related missingness.

Purpose:

- create a strong operational heuristic.

### B4 — Reverse-Dependency Propagation

Begin with local anomaly scores and propagate evidence from symptomatic dependent nodes toward their dependencies.

Example:

CatchUPService → STORES_ON → CatchUPStorage


---

# Part 3 — Define success criteria

Add:

```md
## Day 11 Success Criteria

The baseline suite must report:

- Mean Reciprocal Rank;
- Hits@1;
- Hits@3;
- mean root-cause rank;
- median root-cause rank;
- healthy false-selection rate;
- healthy abstention rate;
- faulty-window coverage;
- selective MRR;
- runtime per window.

The test and OOD results must remain separate.

A future GNN is not accepted merely because it improves one metric by a negligible amount.

It should improve root-cause ranking while preserving:

- healthy abstention;
- runtime practicality;
- OOD robustness;
- engineering interpretability.