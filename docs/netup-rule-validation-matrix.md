# NetUP Rule Validation Matrix

All current rule thresholds and triggers below remain provisional until NetUP validates them.

| Rule ID | Product family | Current threshold or trigger | Current source or evidence | Provisional status | NetUP-approved value | Validation owner | Validation date | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `core-combine-mini` | NetUP IPTV Combine Mini | `subscribers_or_rooms <= 50`, `number_of_channels <= 50`, `delivery_mode = local_network` | `config/product_rules.yaml` | Pending NetUP validation | Pending NetUP validation | TBD | TBD | Compact local deployment threshold only. |
| `core-combine-8x` | NetUP IPTV Combine 8x | `subscribers_or_rooms <= 1000`, `number_of_channels <= 100` | `config/product_rules.yaml` | Pending NetUP validation | Pending NetUP validation | TBD | TBD | Covers current all-in-one hotel and SMB sizing boundary. |
| `core-combine-16x` | NetUP IPTV Combine 16x | `subscribers_or_rooms <= 1000`, `number_of_channels >= 101` | `config/product_rules.yaml` | Pending NetUP validation | Pending NetUP validation | TBD | TBD | Triggered when channel count exceeds provisional Combine 8x boundary. |
| `core-complex` | NetUP IPTV/OTT Complex | `subscribers_or_rooms >= 1001` | `config/product_rules.yaml` | Pending NetUP validation | Pending NetUP validation | TBD | TBD | Current operator-scale trigger. |
| `headend-dvb-ip` | NetUP DVB-IP Streamer | Any signal source overlaps `satellite`, `terrestrial`, `cable` | `config/product_rules.yaml` | Pending NetUP validation | Pending NetUP validation | TBD | TBD | DVB ingest trigger only, no approved source matrix yet. |
| `headend-asi` | NetUP Streamer ASI 8x | Any signal source overlaps `asi` | `config/product_rules.yaml` | Pending NetUP validation | Pending NetUP validation | TBD | TBD | ASI ingest trigger. |
| `encoding-hdmi-sdi` | NetUP Encoder family | Any signal source overlaps `hdmi_sdi` | `config/product_rules.yaml` | Pending NetUP validation | Pending NetUP validation | TBD | TBD | Encoding trigger for HDMI / SDI contribution sources. |
| `processing-stream-processor` | NetUP Stream Processor | `delivery_mode in internet_ott, both` | `config/product_rules.yaml` | Pending NetUP validation | Pending NetUP validation | TBD | TBD | OTT packaging and processing trigger. |
| `processing-adaptive` | NetUP Stream Processor | `adaptive_bitrate_required = true` | `config/product_rules.yaml` | Pending NetUP validation | Pending NetUP validation | TBD | TBD | Adaptive bitrate trigger. |
| `processing-mobile-web` | NetUP Stream Processor | Viewer devices overlap `mobile`, `web_browser` | `config/product_rules.yaml` | Pending NetUP validation | Pending NetUP validation | TBD | TBD | Device-driven processing trigger. |
| `processing-catchup` | NetUP Stream Processor | Services overlap `catchup_tv`, `time_shift` | `config/product_rules.yaml` | Pending NetUP validation | Pending NetUP validation | TBD | TBD | Catch-up and time-shift workflow trigger. |
| `qam-output` | NetUP Streamer xC | `output_type = dvb_c_qam` | `config/product_rules.yaml` | Pending NetUP validation | Pending NetUP validation | TBD | TBD | IP-to-QAM modulation trigger. |
| `vod` | NetUP VoD capability | Services overlap `video_on_demand` | `config/product_rules.yaml` | Pending NetUP validation | Pending NetUP validation | TBD | TBD | VoD feature trigger only, no approved capacity threshold yet. |
| `billing-service` | NetUP Middleware and Billing | Services overlap `billing` | `config/product_rules.yaml` | Pending NetUP validation | Pending NetUP validation | TBD | TBD | Explicit billing-service trigger. |
| `billing-operator` | NetUP Middleware and Billing | `project_type in small_provider, large_operator, cable_operator` | `config/product_rules.yaml` | Pending NetUP validation | Pending NetUP validation | TBD | TBD | Operator-project subscriber management assumption. |
| `redundancy-required` | Redundant architecture review | `redundancy_required = true` warning path | `app/services/recommendation.py` | Pending NetUP validation | Pending NetUP validation | TBD | TBD | Warning exists, but no approved product mapping or failover scope thresholds yet. |
