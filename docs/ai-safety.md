# AI Safety

The AI layer is limited to structured requirement extraction.

Allowed AI tasks:

- identify supplied requirements
- normalize terminology into supported enum values
- keep uncertain fields empty
- summarize missing fields through a single follow-up question

Forbidden AI tasks:

- selecting NetUP products
- calculating bandwidth or storage
- inventing product specifications
- producing pricing or compatibility claims
- overriding deterministic rules

Operational safeguards:

- `OPENAI_API_KEY` is read only on the server
- the frontend gracefully falls back when no key is configured
- oversized conversational input is rejected
- extracted JSON is validated through Pydantic before acceptance
- user text is treated as untrusted input and never executed
