# Evaluation Protocol

## General Protocol

1. Train using the training split.
2. Select hyperparameters using the validation split.
3. Freeze preprocessing, architecture, threshold and checkpoint policy.
4. Evaluate once on the test split.
5. Evaluate separately on the OOD test split.
6. Report all predefined metrics.
7. Report failure-class and environment breakdowns.
8. Report uncertainty across random seeds.
9. Report the benchmark fingerprint.
10. Record all deviations from the protocol.

## Random Seeds

Initial model experiments use at least three seeds.

Preferred serious comparison:

- five or more seeds.

A single favorable run is not sufficient evidence.

## Model Selection

The final checkpoint must be selected using validation data only.

Test data must never decide:

- model architecture;
- number of layers;
- learning rate;
- threshold;
- feature set;
- early-stopping epoch;
- loss weights.

## Root-Cause Ranking Metrics

Primary:

- Mean Reciprocal Rank;
- Hits@1;
- Hits@3.

Secondary:

- mean positive-node rank;
- top-k recall;
- healthy-window abstention quality.

## Future-Incident Metrics

Primary:

- PR-AUC;
- recall at a fixed false-warning burden;
- useful lead time.

Secondary:

- ROC-AUC;
- precision;
- recall;
- F1;
- Brier score;
- expected calibration error.

## Failure-Type Metrics

Primary:

- macro F1;
- balanced accuracy.

Secondary:

- per-class precision;
- per-class recall;
- confusion matrix.

## Affected-Service Metrics

Primary:

- macro F1;
- PR-AUC.

## Time-to-Incident Metrics

Primary:

- mean absolute error;
- median absolute error.

Evaluate only where the target mask is active.

## OOD Reporting

OOD results must be reported separately.

Do not average ID and OOD results into one headline number.

## Acceptance Rule

The GNN must outperform strong non-GNN baselines on a predefined primary metric without unacceptable degradation in:

- calibration;
- false-warning burden;
- robustness;
- OOD performance;
- interpretability;
- runtime.