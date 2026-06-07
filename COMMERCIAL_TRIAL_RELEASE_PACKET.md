# Commercial Trial Release Packet

Date: 2026-06-07

Scope: bounded local customer-trial release for an AI trading education and practice SaaS prototype.

## Release Verdict

Code-side status: closed for bounded education customer trial.

The bounded education trial workflow is complete enough for a controlled friend/customer review, but this is not a production launch certificate.

This release packet is the handoff boundary for the current prototype. Further feature additions have low marginal value compared with running a real bounded customer trial, collecting buyer feedback, and completing the non-code production blockers listed below.

This packet does not certify production launch, investment advice, signal quality, profitability, broker connectivity, auto-trading, or real-money trading readiness.

## What Is Ready For Trial

- Learner education workflow: scenario practice, replay notes, paper-practice journaling, completion evidence, and coach follow-up.
- Admin/customer-success workflow: product readiness, launch ops, customer trial packet, kickoff plan, trial room, service SLA, audit review, and follow-up actions.
- Customer trial room workflow: room export, local simulated room share, buyer review package, buyer evidence request, feedback action creation, action closure propagation, and room progress export.
- Commercial evidence workflow: scorecard, kickoff plan, launch board, trial packet, room progress, audit logs, and JSON/CSV/Markdown exports.
- Guardrail workflow: `educationOnly:true`, `productionReady:false`, no stock recommendations, no live buy/sell signals, no return or win-rate promises, no broker integration, no auto-trading, and no real-money trading instruction.

## Trial Operator Path

1. Run `npm.cmd run check:completion`.
2. Run `npm.cmd run verify`.
3. Run `npm.cmd run smoke:trial-room`.
4. Start locally with `npm.cmd run start`.
5. Log in as `admin@tradegym.local` with `admin123`.
6. Open Education Trial Readiness.
7. Export Scorecard, Kickoff, Launch, Trial, Room, and Room Progress artifacts.
8. Send the local simulated trial room.
9. Open Buyer review, log an education evidence request, create or reuse the follow-up action, mark it done, and export Room Progress.
10. Review audit logs before any customer follow-up meeting.

## Required Verification Evidence

Expected `npm.cmd run check:completion` shape:

```json
{
  "ok": true,
  "productionReady": false,
  "educationOnly": true
}
```

Expected `npm.cmd run smoke:trial-room` shape:

```json
{
  "productionReady": false,
  "roomSections": 6,
  "roomCsv": 200,
  "roomMd": 200,
  "shares": 1,
  "feedback": "needs_more_evidence",
  "buyerReview": "needs_more_evidence",
  "buyerReviewRollup": 1,
  "action": 201,
  "actionDone": "done",
  "shareProgressMd": 200,
  "reused": true
}
```

## Open-Source Design References

The prototype borrows architecture ideas from open-source trading research systems, but deliberately excludes execution and signal use:

- LEAN-style separation of research evidence from execution.
- Qlib-style data and experiment organization, translated into education evidence and provider-governance checks.
- FinRL-style simulation and learning-loop inspiration, translated into paper-practice and coach-review workflows.
- FinGPT-style text/context structuring, translated into market-context literacy and misconception drills.

Forbidden translations:

- No broker routing.
- No auto-trading.
- No live order workflow.
- No stock recommendation.
- No return prediction.
- No signal-quality or strategy-performance marketing claim.

## Non-Code Production Blockers

These are intentionally outside this code-side customer-trial release:

- Production legal review and jurisdiction-specific disclosures.
- Licensed market data and news contracts.
- Production email provider and delivery proof.
- Production payment provider, invoices, tax, refunds, and reconciliation.
- Append-only audit storage, retention policy, access logging, and backup policy.
- Security review, monitoring, incident response, and role/access review.
- Customer contract, procurement approval, support staffing, and operating SLA.
- Any broker integration or auto-trading remains out of scope and should stay disabled.

## Stop Rule

Do not add more prototype features before a customer trial unless the trial exposes a concrete blocker. The next work should be customer trial operation, buyer feedback collection, and non-code launch readiness, not additional trading functionality.
