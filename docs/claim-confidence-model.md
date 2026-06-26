# Claim Confidence Model

Every customer-facing conclusion should map to one of these statuses:

- `confirmed`
- `calculated`
- `inferred`
- `conditional`
- `unknown`
- `provisional`

## Usage guidance

- Use `confirmed` only for capabilities backed by official NetUP evidence.
- Use `calculated` only for formula-driven values.
- Use `conditional` when compatibility, topology, licensing, or hotel-device factors still need confirmation.
- Use `unknown` when the system lacks the data needed to choose responsibly.
- Use `provisional` when the current MVP rule suggests a product but NetUP has not yet approved the exact trigger.

## Example

`Native Smart TV delivery may avoid external set-top boxes`:

- `confirmed` only when the hotel TV path is explicitly validated by the submitted compatibility details;
- otherwise `conditional` or `unknown`.
