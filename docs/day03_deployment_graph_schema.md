# Day 3 — Deployment Graph Schema

## Goal

Define the machine-readable contract used to represent IPTV/OTT deployments as directed property graphs.

The deployment graph will become the common representation used by:

- requirement extraction;
- architecture validation;
- deterministic risk rules;
- missing-input detection;
- architecture visualization;
- root-cause diagnosis;
- report generation;
- future graph machine-learning models.

## Core Design Principle

The graph must separate:

1. facts explicitly supplied by the user;
2. facts extracted by AI;
3. assumptions introduced by the system;
4. recommendations produced by deterministic rules;
5. items requiring engineer validation.

No assumed component should be presented as a confirmed fact.

## Deployment Graph Object

Every deployment graph must contain:

- schema version;
- graph identifier;
- project identifier;
- graph status;
- creation metadata;
- source references;
- nodes;
- edges;
- unresolved requirements;
- validation warnings;
- summary statistics.

## Graph Status Values

- `draft`: graph is still being constructed;
- `incomplete`: required information is missing;
- `ready_for_validation`: enough information exists for rule validation;
- `engineer_review_required`: high-risk assumptions require review;
- `validated`: engineer-approved graph;
- `rejected`: architecture is invalid or unsuitable.

