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

## Change-Event Reasoning Policy

A configuration change may become relevant when:

- it occurred before the degradation;
- it affected the same component or service;
- the timing is plausible;
- the failure mechanism is technically plausible;
- no stronger alternative explanation exists.

Change proximity initially creates contextual evidence.

It becomes supporting causal evidence only when:

- behaviour changed after the modification;
- rollback reverses the degradation;
- the effect is reproducible;
- an engineer confirms the mechanism.

Example:

Retention increased from three days to seven days.

Valid conclusion:

"The retention change is a relevant preceding event that may have increased storage demand."

Invalid conclusion:

"The retention change caused the CatchUP failure."
## Failure Signature FS-CATCHUP-STORAGE-001

### Name

CatchUP storage-path degradation

### Trigger Signals

- high or rapidly increasing storage utilisation;
- elevated storage-write latency;
- CatchUP recording failures;
- cleanup-job failure;
- retention-policy increase;
- I/O errors.

### Affected Services

- CatchUP;
- TimeShift;
- VoD, when shared storage is used.

### Candidate Causes

- capacity saturation;
- storage I/O degradation;
- retention cleanup failure;
- filesystem error;
- hardware degradation;
- application-worker failure.

### High-Information Tests

1. inspect free capacity and growth;
2. inspect write latency and queue depth;
3. inspect filesystem and disk errors;
4. inspect cleanup-job status;
5. inspect recording-worker health;
6. compare failures across channels;
7. test after an approved reversible intervention.

### Confirmation Conditions

The signature may be confirmed when:

- direct storage errors are observed;
- capacity or I/O limits are verified;
- remediation restores recording;
- an engineer verifies the cause.

### Rejection Conditions

The signature is weakened when:

- storage health is normal;
- recording failures are isolated to one channel;
- application exceptions explain the failure;
- storage remediation does not change outcomes.

## Day 5 Study Notes

### Hypotheses Compete

The system should maintain multiple plausible explanations until evidence separates them.

### Ranking Is Not Confirmation

A hypothesis may rank first and still be wrong.

Confirmation requires direct evidence, successful intervention, reproducibility, or engineer verification.

### Contradictory Evidence Matters

A trustworthy system must actively search for evidence that weakens its preferred explanation.

### Diagnostic Questions Should Maximize Information

The best next question is the safest question that most clearly separates the leading hypotheses.

### Interventions Must Be Controlled

Observation should come before modification.

Reversible actions should come before irreversible actions.

Engineer approval is mandatory for production changes during early product versions.

## Day 5 Moat Statement

NetUP ReliabilityGraph AI will not merely detect anomalies or list possible causes.

Its proprietary reasoning layer will preserve:

- candidate hypotheses;
- supporting evidence;
- contradicting evidence;
- evidence quality;
- topology scope;
- missing evidence;
- diagnostic-test utility;
- intervention safety;
- engineer decisions;
- verified outcomes;
- reusable failure signatures.

Every resolved case improves the system’s future diagnostic pathways.

The defensible asset is not a prompt that generates troubleshooting advice.

It is an accumulating library of evidence-linked, engineer-validated, outcome-confirmed reliability reasoning.