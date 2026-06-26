# Capacity Methodology

The configurator now separates bandwidth scopes instead of labeling every number simply as "estimated bandwidth".

## Current outputs

- source-ingest bandwidth
- core-network multicast estimate
- OTT/mobile unicast egress estimate
- per-viewer bitrate
- archive-storage estimate or pending status

## Storage logic

If Catch-up TV or Time-shift is selected, storage is not treated as complete until the system knows:

- retention period
- recording scope
- bitrate

When retention is missing, the report shows `Pending input` rather than `Not required`.

## Caveats shown to the user

- multicast does not scale linearly with viewers the way unicast does;
- Wi-Fi design needs a separate RF/concurrency review;
- adaptive bitrate can increase packaging, origin, and storage needs.
