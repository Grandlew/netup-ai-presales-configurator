# NetUP Operational Telemetry Capability Matrix

## Purpose

Determine which signals are genuinely available from a real NetUP deployment.

No signal should be marked available without:

- documentation;
- sample output;
- direct testing;
- API verification;
- engineer confirmation.

| Signal | Source Component | Collection Mechanism | Availability | Frequency | Retention | Mapping Quality | Operational Value | Evidence |
|---|---|---|---|---|---|---|---|---|
| Middleware CPU | Middleware host | OS agent | Unknown | Unknown | Unknown | Unknown | High | None |
| Middleware memory | Middleware host | OS agent | Unknown | Unknown | Unknown | Unknown | High | None |
| Middleware restarts | Middleware host | Service logs | Unknown | Unknown | Unknown | Unknown | High | None |
| Authentication failures | Middleware/Billing | Logs/API | Unknown | Unknown | Unknown | Unknown | Critical | None |
| Channel-start failures | IPTV service | Logs/API/probe | Unknown | Unknown | Unknown | Unknown | Critical | None |
| CatchUP recording failures | CatchUP service | Logs/API | Unknown | Unknown | Unknown | Unknown | Critical | None |
| CatchUP storage utilization | Storage | OS/storage metrics | Unknown | Unknown | Unknown | Unknown | Critical | None |
| Storage-write latency | Storage | OS/storage metrics | Unknown | Unknown | Unknown | Unknown | Critical | None |
| EPG freshness | EPG service | API/log/probe | Unknown | Unknown | Unknown | Unknown | High | None |
| PMS sync failures | PMS integration | Logs/API | Unknown | Unknown | Unknown | Unknown | High | None |
| Switch throughput | Network switch | SNMP/API | Unknown | Unknown | Unknown | Unknown | High | None |
| Packet errors/discards | Network switch | SNMP/API | Unknown | Unknown | Unknown | Unknown | Critical | None |
| IGMP state | Network switch | SNMP/CLI/API | Unknown | Unknown | Unknown | Unknown | High | None |
| SmartTV app errors | SmartTV app | Client logs/telemetry | Unknown | Unknown | Unknown | Unknown | High | None |
| Device model/firmware | SmartTV/STB | Inventory | Unknown | Unknown | Unknown | Unknown | High | None |
