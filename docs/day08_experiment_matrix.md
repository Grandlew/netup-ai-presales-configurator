# Day 8 Experiment Matrix

## Topology Dimensions

| Dimension | Initial Values |
|---|---|
| Room count | 50, 80, 120, 180, 250 |
| Floor count | 2–10 |
| Middleware redundancy | false, true |
| Shared storage | false, true |
| Deployment family | small, medium |
| Device cohorts | LG webOS A/B, Samsung Tizen A |

## Operating Dimensions

| Dimension | Initial Range |
|---|---|
| Base occupancy | 35%–90% |
| Evening multiplier | 1.05–1.60 |
| Weekend multiplier | 0.90–1.25 |
| CatchUP channels | 10–70 |
| Average bitrate | 2.5–8.0 Mbps |
| Retention | 2–14 days |
| Sampling interval | 5, 10, 15, 30 minutes |
| Scenario duration | 24–72 hours |

## Fault Dimensions

| Dimension | Initial Values |
|---|---|
| Failure type | capacity, I/O, cleanup, worker |
| Severity | 0.25–1.00 |
| Injection time | 25%–70% of scenario |
| Root-cause target | valid component selected by type |
| Incident occurrence | not guaranteed for weak faults |

## Confounders

- evening workload peak;
- high occupancy without fault;
- retention increase with healthy cleanup;
- temporary latency spike;
- harmless worker restart;
- scheduled maintenance;
- telemetry collector outage;
- short network burst;
- one-channel recording error;
- storage growth without service degradation.

## Missingness

- independent random loss;
- source-specific loss;
- short contiguous outage;
- delayed ingestion;
- low-quality observations;
- no missingness.

## Split Environments

### Training

Small and medium hotels using common operating ranges.

### Validation

Unseen topology instances and random seeds.

### Test

Unseen topology instances, random seeds, and counterfactual pairs.

### Out-of-Distribution Test

Examples:

- room counts outside the main training range;
- unseen retention values;
- stronger telemetry loss;
- redundant middleware combinations not used in training;
- altered workload patterns.