# Day 5 — First Reliability Reasoning Chain

## Objective

Implement the first complete evidence-to-action reasoning workflow for NetUP ReliabilityGraph AI.

The initial workflow focuses on CatchUP storage-path degradation in an operating hotel IPTV deployment.

The reasoning chain must:

1. accept validated observations;
2. create candidate failure hypotheses;
3. connect evidence to hypotheses;
4. distinguish supporting from contradicting evidence;
5. rank hypotheses without inventing probabilities;
6. select high-information diagnostic tests;
7. recommend safe and reversible interventions;
8. record engineer decisions;
9. record verified outcomes;
10. produce a reusable reliability lesson.

## Strategic Principle

A generic monitoring system raises alerts.

A generic chatbot lists possible causes.

NetUP ReliabilityGraph AI must produce an auditable engineering argument:

- what is happening;
- what may be causing it;
- what evidence supports that conclusion;
- what evidence weakens it;
- what remains unknown;
- what should be tested next;
- what action is safe;
- what outcome would confirm or reject the hypothesis.

## Hypothesis Lifecycle

Every root-cause hypothesis moves through controlled states.

### Candidate

The cause is technically possible but has little case-specific evidence.

### Supported

One or more observations support the hypothesis.

### Leading

The hypothesis currently has the strongest evidence among the candidates.

### Confirmed

An engineer, diagnostic test, intervention result, or reproducible observation verifies the cause.

### Weakened

Contradictory evidence reduces confidence in the hypothesis.

### Rejected

Evidence or testing demonstrates that the hypothesis is not the cause.

### Unresolved

Available evidence is insufficient to classify the hypothesis confidently.

## Critical Rule

Only the following may establish a confirmed root cause:

- direct diagnostic evidence;
- successful and specific intervention;
- reproducible failure behaviour;
- engineer verification;
- authoritative component error evidence.

A high score alone must never confirm a root cause.

## First Failure Scenario — CatchUP Storage-Path Degradation

### Observed Conditions

- CatchUP recording failures are increasing;
- storage utilisation is high;
- storage-write latency has increased;
- retention was recently changed from three days to seven days.

### Candidate Hypotheses

1. Storage capacity saturation
2. Storage I/O degradation
3. CatchUP application failure
4. Retention cleanup failure
5. Filesystem or hardware error
6. Channel-specific recording configuration problem

### Important Distinction

These conditions do not automatically prove that storage saturation is the root cause.

For example:

- high storage utilisation may be normal;
- recording failures may be caused by an application bug;
- the retention-policy change may be temporally related but not causal;
- storage latency may be caused by hardware errors rather than capacity.

## Evidence Roles

Every evidence item must have one role relative to a hypothesis.

### Supports

The observation increases the plausibility of the hypothesis.

### Contradicts

The observation decreases the plausibility of the hypothesis.

### Required

The evidence must exist before the hypothesis may be confirmed.

### Context

The evidence provides useful background but does not strongly distinguish between hypotheses.

### Unknown

The system cannot determine the evidence relationship.

## Example

Hypothesis:

Storage capacity saturation causes CatchUP recording failures.

Supporting evidence:

- storage utilisation is 94%;
- free capacity is rapidly decreasing;
- failures occur when storage crosses a threshold;
- reducing retention restores recording.

Contradicting evidence:

- storage has significant free capacity;
- failures continue after storage is expanded;
- write latency and disk health are normal;
- failures affect only one channel.

Required confirmation evidence:

- storage capacity or allocation limit is reached;
- freeing capacity or expanding storage removes the failure.

## Hypothesis Scoring

The first version uses deterministic evidence scores.

The score is not a probability.

It is an internal ranking value used to compare candidate hypotheses.

### Initial Evidence Weights

| Evidence Strength | Weight |
|---|---:|
| Weak support | +1 |
| Moderate support | +2 |
| Strong support | +4 |
| Weak contradiction | -1 |
| Moderate contradiction | -2 |
| Strong contradiction | -4 |
| Engineer confirmation | +10 |
| Verified intervention outcome | +12 |
| Definitive rejection | -20 |

### Quality Multiplier

Evidence weight is multiplied by data-quality strength:

| Quality | Multiplier |
|---|---:|
| Verified | 1.00 |
| High | 0.85 |
| Medium | 0.60 |
| Low | 0.30 |
| Quarantined | 0.00 |

### Score Interpretation

Scores are interpreted relatively.

- highest score: current leading hypothesis;
- close scores: unresolved competition;
- low evidence coverage: insufficient evidence;
- strong contradiction: weakened or rejected;
- confirmation requires direct verification, not score threshold.

### Critical Limitation

The system must not display a ranking score as a failure probability.

## Evidence Coverage

A high score from one observation is weaker than agreement across independent signals.

Evidence coverage should consider:

- number of independent sources;
- number of golden signals represented;
- topology agreement;
- temporal persistence;
- change proximity;
- service impact;
- direct diagnostic evidence.

### Example

Weak coverage:

- storage utilisation is high.

Stronger coverage:

- storage utilisation is high;
- write latency is high;
- recording failures are rising;
- cleanup jobs are failing;
- storage growth increased after a retention change.

The system should report both:

- hypothesis ranking;
- evidence coverage.

## Diagnostic-Test Ranking

The system should not ask every possible diagnostic question.

Each test receives a utility score based on:

- expected information gain;
- number of leading hypotheses distinguished;
- operational safety;
- reversibility;
- execution time;
- cost;
- required expertise;
- evidence quality expected.

### Initial Utility Formula

```text
diagnostic_utility =
    0.40 × information_gain
  + 0.20 × hypothesis_separation
  + 0.15 × safety
  + 0.10 × reversibility
  + 0.10 × speed
  + 0.05 × low_cost

  ## Intervention Safety Gates

The early system must not automatically execute operational changes.

Each intervention must contain:

- target component;
- intended effect;
- supporting hypothesis;
- expected benefit;
- operational risk;
- reversibility;
- rollback plan;
- engineer approval requirement;
- verification test.

### Intervention Classes

#### Observe

No system modification.

Examples:

- inspect storage metrics;
- inspect logs;
- compare channel groups;
- check cleanup-job state.

#### Low-Risk Reversible

Small, controlled action.

Examples:

- trigger an external playback test;
- temporarily lower retention in a test environment;
- restart a non-critical probe.

#### Engineer-Approved Change

Operational modification requiring approval.

Examples:

- change retention policy;
- expand storage;
- modify service configuration;
- alter VLAN settings.

#### Prohibited Autonomous Action

The system must not perform these autonomously in early versions:

- delete customer recordings;
- modify production VLANs;
- restart critical production services;
- change billing or authorization policies;
- roll out firmware;
- alter content-protection settings.

