# Product Capability Registry

`config/product_capabilities.yaml` is the source of truth for product-role coverage, overlap checks, and official evidence references.

## Purpose

- Separate product facts from recommendation thresholds.
- Track which capabilities are confirmed by official NetUP sources and which remain provisional.
- Support overlap detection before multiple products are stacked into one architecture.

## Evidence policy

- Prefer official NetUP product pages.
- Use repository rules only as provisional fallback evidence.
- Do not promote provisional rule entries to confirmed product facts without official NetUP backing.

## Current registry behavior

- `NetUP IPTV Combine 8x` and `NetUP IPTV Combine 16x` are modeled as all-in-one headend plus core IPTV platforms with built-in DVB/IP reception.
- `NetUP DVB IP Streamer` is modeled as a separate modular headend and therefore checked for functional overlap with IPTV Combine.
- `NetUP Stream Processor` is modeled as a media-processing component with confirmed transcoding and protocol-output functions, while broader OTT-service assumptions remain conditional.
- `NetUP Combine Hotel` and `NetUP.tv Hotel Software` are treated as hospitality-specific options rather than generic equivalents of all IPTV products.

## Review workflow

Update the registry when:

- NetUP publishes new product pages or hospitality compatibility guidance.
- engineering confirms or rejects provisional capability mappings;
- a recommendation conflict reveals an unmodeled overlap or conditional dependency.
