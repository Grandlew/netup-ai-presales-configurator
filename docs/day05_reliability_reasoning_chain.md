# Day 5 — First Reliability Reasoning Chain

## Objective

Implement the first complete evidence-to-action reasoning workflow for NetUP ReliabilityGraph AI.

The initial workflow focuses on CatchUP storage-path degradation in an operating hotel IPTV deployment.

The reasoning chain must:

1. accept validated observations;
2. create candidate failure hypotheses;
3. connect evidence to hypotheses;
4. distinguish supporting from contradicting evidence;
5. rank hypotheses without inventing probabilities;
6. select high-information diagnostic tests;
7. recommend safe and reversible interventions;
8. record engineer decisions;
9. record verified outcomes;
10. produce a reusable reliability lesson.

## Strategic Principle

A generic monitoring system raises alerts.

A generic chatbot lists possible causes.

NetUP ReliabilityGraph AI must produce an auditable engineering argument:

- what is happening;
- what may be causing it;
- what evidence supports that conclusion;
- what evidence weakens it;
- what remains unknown;
- what should be tested next;
- what action is safe;
- what outcome would confirm or reject the hypothesis.