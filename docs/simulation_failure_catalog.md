# Simulation Failure Catalog

| Fault ID | Failure Type | Target | Hidden Mechanism | Primary Signals | Common Confounder |
|---|---|---|---|---|---|
| SIM-F001 | Storage capacity saturation | CatchUPStorage | Effective capacity decreases or growth accelerates | Utilisation, growth, cleanup failures | Legitimate evening growth |
| SIM-F002 | Storage I/O degradation | CatchUPStorage | Write latency and error rate increase | I/O latency, I/O errors, recording failures | High workload |
| SIM-F003 | Cleanup-job failure | CatchUPService | Expired recordings are not deleted | Cleanup errors, storage growth | Retention increase |
| SIM-F004 | CatchUP worker failure | CatchUPService | Worker availability decreases | Restarts, application errors, recording failures | Storage degradation |

## Confounder Policy

Each fault should be simulated alongside conditions that could produce similar observations without the same root cause.

Examples:

- high workload without fault;
- retention increase with healthy cleanup;
- temporary latency spike without incident;
- harmless worker restart;
- telemetry loss without service degradation.

A diagnostic model must learn to distinguish faults from confounders.