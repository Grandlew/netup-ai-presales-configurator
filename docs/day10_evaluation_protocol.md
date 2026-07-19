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
## Root-Cause Ranking Protocol

For every faulty window:

1. produce one score per node;
2. rank nodes from highest to lowest;
3. locate the positive root-cause node;
4. compute its rank.

### Mean Reciprocal Rank

For positive-node rank `r`:

reciprocal rank = 1 / r
Mean Reciprocal Rank averages this across faulty windows.

Hits@1

Fraction of faulty windows where the true root cause ranks first.

Hits@3

Fraction of faulty windows where the true root cause appears among the top three nodes.

Healthy Windows

Healthy windows contain no root cause.

They require a separate abstention or no-root-cause evaluation.

Do not assign an arbitrary node as the root cause in healthy windows.


---

# Part 24 — Define healthy-window abstention

This is critical.

A model that always selects a node may appear effective on faulty scenarios but create false diagnoses in healthy systems.

Add:

```md
## Healthy-Window Abstention

The root-cause system must support:

- no root cause detected;
- insufficient evidence;
- incident absent.

Evaluate:

### False Root-Cause Selection Rate

Fraction of healthy windows where the system incorrectly selects a root-cause node.

### Coverage

Fraction of windows where the system chooses to make a diagnosis.

### Selective Accuracy

Accuracy on windows where the system does not abstain.

### Risk–Coverage Curve

Shows how diagnosis error changes as the model abstains more often.

A safe system may prefer abstention over unsupported diagnosis.

## Lead-Time Evaluation

Future-incident prediction must be evaluated as an early-warning problem.

For every true incident:

- identify the first qualifying warning;
- calculate time between warning and incident onset;
- determine whether that lead time was operationally useful.

Report:

- median lead time;
- mean lead time;
- percentage of incidents warned at least 6 hours early;
- percentage warned at least 12 hours early;
- false warnings per deployment-day.

A classifier that detects the incident only after symptoms begin is not predictive.

## Probability Calibration

A score of 0.8 should eventually correspond to approximately 80% observed frequency among comparable predictions.

Report:

- Brier score;
- reliability diagram;
- expected calibration error;
- calibration by failure class;
- calibration by topology family;
- calibration on OOD data.

Calibration methods must be fitted on validation data only.

Do not calibrate using the test split.

## Statistical Uncertainty

Every serious model comparison must report variation across random seeds.

Preferred reporting:


mean ± standard deviation
For benchmark-level estimates, use confidence intervals where appropriate.

Do not claim superiority when:

metric differences are tiny;
seed variance is larger than the difference;
one model wins only on one seed;
improvements disappear on OOD data.

The benchmark report must distinguish:

deterministic dataset audit results;
stochastic model-training results.

## Model Comparison Ladder

Models must be introduced in this order.

### Level 0 — Non-Learning Baselines

- majority class;
- random ranking;
- node criticality;
- highest anomaly score;
- highest error count;
- highest missingness.

### Level 1 — Classical Models

- logistic regression;
- decision tree;
- random forest or gradient boosting;
- per-node MLP.

### Level 2 — Topology-Aware Heuristics

- anomaly score propagated over dependencies;
- graph-distance weighting;
- rule-engine ranking.

### Level 3 — GNN Baseline

- GraphSAGE.

### Level 4 — GNN Challengers
-Edgeconv
- GATv2;
- edge-aware message passing;
- heterogeneous GNN;
- temporal GNN.

A complex model earns its place only by outperforming simpler baselines under the frozen protocol.