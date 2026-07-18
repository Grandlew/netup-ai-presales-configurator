# Day 9 Feature and Target Contract

## Forbidden Model Inputs

The following must never appear in model inputs:

- `simulation_metadata`;
- `environment_id`;
- `pair_id`;
- `confounder_type`;
- `model_visible`;
- `simulated_transient`;
- topology seed;
- workload seed;
- observation seed;
- fault seed;
- injected fault identifier;
- hidden node health;
- latent capacity factor;
- latent latency factor;
- latent error factor;
- propagation ground truth;
- root-cause name;
- future incident time;
- future telemetry;
- scenario filename tokens encoding class.

## Conditionally Allowed Context

A valid operational event may remain after its simulator explanation is removed.

Forbidden:

```json
{
  "confounder_type": "temporary_latency_spike",
  "model_visible": true
}
Potentially valid after sanitization:
{
  "signal_name": "system.disk.io_latency",
  "observed_at": "2026-07-18T12:00:00Z",
  "statement": "A temporary increase in storage latency was observed."
}
## Node Feature Contract

Each node receives a fixed-length feature vector.

### Structural Features

- node-type one-hot encoding;
- in-degree;
- out-degree;
- total degree;
- critical-service indicator.

### Telemetry Features

For each supported signal:

- latest value;
- mean;
- minimum;
- maximum;
- standard deviation;
- slope;
- observation count;
- missing indicator;
- low-quality fraction.

### Initial Signals

- `system.disk.utilization`;
- `system.disk.io_latency`;
- `system.disk.io_errors`;
- `iptv.catchup.recording_failures`;
- `system.process.restart_count`;
- `iptv.session.active_count`.

### Temporal Features

- hours since latest observation;
- observation coverage fraction;
- recent change-event count.

### Missingness

Missing values must not be silently replaced without a mask.

For each signal:

- normalized numeric value;
- missing indicator.

Zero and missing are not equivalent.

## Edge Feature Contract

Each edge receives:

- edge-type one-hot encoding;
- propagation direction indicator;
- propagation delay;
- propagation strength.

Initial edge types:

- depends_on;
- sends_to;
- authenticates_with;
- stores_on;
- serves;
- connected_to.

The graph initially remains homogeneous.

Node and edge types are represented as features.

A heterogeneous GNN will be introduced only after the homogeneous baseline is established.
## Target Contract

### Root-Cause Node Target

For each node:

- `1` if the node is the hidden primary root cause;
- `0` otherwise.

Healthy windows contain no positive root-cause node.

### Current-Incident Target

Graph-level target:

- `1` if an incident is active at the observation cutoff;
- `0` otherwise.

### Future-Incident Target

Graph-level target:

- `1` if the target incident begins after the cutoff and within the prediction horizon;
- `0` otherwise.

### Failure-Type Target

Examples:

- healthy;
- storage_capacity_saturation;
- storage_io_degradation;
- cleanup_job_failure;
- catchup_worker_failure.

### Affected-Service Target

For every service node:

- `1` if affected;
- `0` otherwise.

### Time-to-Incident Target

Hours from the cutoff to incident onset.

Use:

- numeric value when incident begins after cutoff;
- `0` when incident is already active;
- mask when no incident occurs in the target horizon.

