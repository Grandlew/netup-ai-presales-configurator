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
