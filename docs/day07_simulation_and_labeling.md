# Day 7 — Synthetic Deployment Simulator and Ground-Truth Labeling

## Objective

Create a controlled simulation environment for generating graph-structured IPTV reliability scenarios with hidden root causes, causal propagation, temporal telemetry, and exact ground-truth labels.

The simulator will support:

- rule-engine evaluation;
- temporal-warning evaluation;
- classical machine-learning baselines;
- future GNN development;
- counterfactual testing;
- robustness testing;
- failure-signature validation.

## Scientific Principle

Synthetic data must not be treated as real operational evidence.

The simulator is used to:

1. validate software and reasoning logic;
2. test whether models can recover known hidden causes;
3. expose failure modes in evaluation;
4. define data requirements for real deployments;
5. compare algorithms under controlled conditions.

Synthetic performance cannot establish production readiness.

## Simulation Experiment Lifecycle

Every simulation scenario follows this lifecycle:

1. Generate deployment topology.
2. Validate the topology.
3. Select an operating regime.
4. Simulate a healthy warm-up period.
5. Verify the steady-state hypothesis.
6. Select one hidden fault.
7. Inject the fault at a known time.
8. Propagate effects through architecture dependencies.
9. Generate telemetry through an observation model.
10. Add measurement noise and missingness.
11. determine incident onset and affected services.
12. generate ground-truth labels.
13. optionally apply an intervention.
14. record whether the intervention solved the fault.
15. export the complete scenario and a model-visible view.

## Hidden State Versus Observable State

The simulator must preserve two separate representations.

### Hidden State

Contains:

- injected root cause;
- fault parameters;
- actual component health;
- actual propagation path;
- true incident onset;
- true affected services;
- true intervention effect.

This information is used only for ground-truth labels and evaluation.

### Observable State

Contains:

- telemetry;
- logs;
- alarms;
- configuration changes;
- topology;
- incomplete symptoms;
- collection quality;
- missing data.

This is what the future model may inspect.

The hidden state must never be accidentally added to model features.

SignalSource
    ↓
Gateway
    ↓
Streamer
    ↓
Middleware
    ↓
CoreSwitch
    ↓
DistributionSwitch
    ↓
SmartTVGroup

Middleware
    ↓
CatchUPService
    ↓
CatchUPStorage

Middleware
    ↓
Database

Middleware
    ↓
EPGService

## Simulation Invariants

Every generated deployment must satisfy:

1. every service node belongs to exactly one deployment;
2. every client-delivery path reaches a valid upstream service;
3. CatchUPService depends on exactly one or more storage nodes;
4. all edge endpoints exist;
5. no unintended self-loop exists;
6. architecture edges have valid source and target types;
7. every telemetry-producing component exists in the topology;
8. a root cause must be an architecture component or process represented in the graph;
9. every affected service must be reachable from the root cause through an allowed propagation path;
10. healthy scenarios contain no injected fault;
11. single-fault scenarios contain exactly one primary root cause;
12. labels are generated from hidden simulator state, not observations.

## Topology Diversity

The simulator should vary:

- number of rooms;
- number of floors;
- number of distribution switches;
- number of SmartTV cohorts;
- redundant or non-redundant middleware;
- shared or separate storage;
- shared or separate VoD and CatchUP storage;
- number of streamers;
- VLAN structure;
- service redundancy;
- dependency depth.

### Initial Deployment Families

#### Small Hotel

- 40–80 rooms;
- 2–4 floors;
- one middleware server;
- one CatchUP storage node;
- one core switch;
- one distribution switch per floor.

#### Medium Hotel

- 100–250 rooms;
- 4–10 floors;
- one or two middleware nodes;
- one or two storage nodes;
- multiple distribution switches;
- multiple SmartTV cohorts.

#### Large Hotel

- 300–800 rooms;
- multiple buildings or wings;
- redundant middleware;
- redundant or tiered network;
- multiple storage pools;
- multiple device cohorts.

Day 7 implements small and medium templates only.

## Propagation Model

A hidden fault changes the internal health state of one component.

Effects may then propagate across approved causal relationships.

Each propagation rule specifies:

- source component type;
- fault type;
- target component or service type;
- propagation delay;
- effect magnitude;
- probability of manifestation;
- required dependency relationship;
- observable signals produced.

Propagation is directional.

A symptom appearing on a dependent component does not reverse the root-cause direction.

## Counterfactual Scenario Pairs

Every primary fault scenario should have a matched healthy control.

The pair shares:

- topology;
- operating regime;
- workload;
- observation schedule;
- background noise parameters.

The pair differs in:

- fault injection;
- fault-driven hidden state;
- resulting propagated effects.

Counterfactual pairs help answer:

"What changed because of the fault rather than because of ordinary workload variation?"