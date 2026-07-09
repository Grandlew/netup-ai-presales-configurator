# Day 1 — NetUP ReliabilityGraph AI Product Definition

## Product Name

NetUP ReliabilityGraph AI

## One-Sentence Description

NetUP ReliabilityGraph AI is a graph-based IPTV/OTT presales and reliability validator that helps engineers design, validate, de-risk, and diagnose NetUP-style deployments before and after installation.

## What It Is Not

It is not a generic chatbot.
It is not only a product recommender.
It is not a marketing toy.
It is not a replacement for NetUP engineers.

## What It Is

It is an engineering decision-support system that:
- extracts deployment requirements;
- builds a system dependency graph;
- detects missing information;
- flags architecture risks;
- ranks likely failure points;
- generates engineer-ready reports;
- learns from engineer corrections over time.
## Core Problem

IPTV/OTT deployments fail not because one product is missing, but because many dependent components must work together:

- signal source;
- streamer/gateway;
- middleware;
- billing/access control;
- transcoder;
- VoD;
- CatchUP/TimeShift;
- EPG;
- storage;
- CDN;
- CAS/DRM;
- network switches;
- VLAN/IGMP/multicast;
- SmartTVs;
- STBs;
- mobile clients;
- PMS integration.

A normal configurator recommends products.

NetUP ReliabilityGraph AI must answer a harder question:

"Will this architecture work, where can it fail, what information is missing, and what should an engineer verify next?"
## Failure Categories

| Failure Category | Example Symptom | Likely Root Cause | What The System Should Do |
|---|---|---|---|
| Signal input failure | Some channels show black screen | DVB/IP source, tuner, transponder, gateway issue | Identify shared signal dependency |
| Middleware failure | App opens but services do not load | Middleware or service control issue | Separate control-plane failure from stream failure |
| Billing/access failure | Guest cannot access subscribed services | Billing, tariff, user authorization issue | Flag access-control path |
| EPG/metadata failure | Live TV works but guide is wrong | EPG source, mapping, timezone, parser issue | Mark metadata layer as risk |
| CatchUP/TimeShift failure | CatchUP unavailable or incomplete | Storage, recording, retention, channel mapping issue | Check storage and retention assumptions |
| VoD failure | VoD slow or unavailable | Storage, server, bandwidth, session load issue | Check media delivery path |
| Network multicast failure | Some floors freeze, others work | VLAN, IGMP, switch, bandwidth issue | Detect shared network dependency |
| Device compatibility failure | Some TVs/STBs fail | Firmware, codec, app version, model mismatch | Isolate affected device group |
| PMS integration failure | Room status/billing not synced | PMS API/protocol/state sync issue | Flag integration path |
| Capacity failure | Works in test, fails at full hotel load | Undersized system, concurrency, bandwidth, storage | Produce capacity-risk warning |
## Version 1 Scope

### V1 Must Do

1. Collect structured requirements.
2. Extract deployment assumptions.
3. Generate a dependency graph.
4. Detect missing information.
5. Apply deterministic risk rules.
6. Produce readiness score.
7. Produce architecture confidence score.
8. Generate risk register.
9. Generate engineer validation checklist.
10. Generate professional report.

### V1 Must Not Do Yet

1. No GNN model yet.
2. No fake "AI certainty."
3. No live monitoring yet.
4. No automatic repair actions.
5. No unsupported product claims.
6. No pretending to replace NetUP engineers.

### Why No GNN Yet

GNNs require real historical deployment and incident data. Starting with GNNs now would be premature. The first moat is deterministic engineering logic, graph structure, and correction data. Machine learning comes later.