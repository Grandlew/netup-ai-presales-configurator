# Dataset Card — NRIM IPTV Reliability Benchmark

## Dataset Name

NRIM Model-Ready Temporal Reliability Graphs

## Initial Version

0.1.0

## Domain

IPTV and hotel television reliability.

The shared benchmark infrastructure is designed for future Internet service-provider support, but this dataset version contains IPTV scenarios only.

## Intended Uses

- model-pipeline development;
- root-cause-ranking research;
- temporal incident forecasting;
- graph-learning baselines;
- leakage testing;
- robustness testing;
- controlled ablation studies.

## Prohibited Claims

Results on this dataset must not be presented as:

- validated NetUP production accuracy;
- real-hotel incident performance;
- certified root-cause diagnosis;
- validated ISP performance;
- evidence that synthetic-to-real transfer is solved.

## Data Source

The benchmark is derived from synthetic, controlled simulations.

It does not contain real NetUP customer telemetry.

## Scenario Families

- healthy controls;
- storage-capacity saturation;
- storage I/O degradation;
- cleanup-job failure;
- CatchUP worker failure.

## Graph Structure

Node types may include:

- signal source;
- gateway;
- streamer;
- middleware;
- database;
- CatchUP service;
- CatchUP storage;
- EPG service;
- core switch;
- distribution switch;
- SmartTV cohort.

Edge types may include:

- depends_on;
- sends_to;
- authenticates_with;
- stores_on;
- serves;
- connected_to.

## Temporal Structure

Default observation window:

- 6 hours.

Default prediction horizon:

- 6 hours.

Default stride:

- 2 hours.

## Dataset Partitions

- training;
- validation;
- test;
- out-of-distribution test.

Counterfactual pairs and topology clones remain within one partition.

## Sensitive Information

The synthetic dataset contains no real customer, guest, employee, or subscriber information.

Future real-world data governance must address:

- customer confidentiality;
- deployment identifiers;
- IP addresses;
- device identifiers;
- subscriber identifiers;
- log contents;
- retention policy;
- access control;
- data minimization.

## Known Limitations

- synthetic fault mechanisms;
- simplified workload patterns;
- incomplete IPTV architecture coverage;
- provisional thresholds;
- simplified storage and service dynamics;
- limited failure catalogue;
- no real engineer-confirmed incidents;
- no ISP access-network scenarios;
- no validated synthetic-to-real transfer.

## Required Reporting Language

Use:

"Synthetic benchmark result."

Do not use:

"NetUP production performance."