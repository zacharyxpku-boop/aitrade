# TradeGym AI Trading Learning Gym

Local commercial SaaS prototype for an AI trading education and practice product.

This project is an education-only customer-trial prototype. It is not investment advice, stock recommendation, live signal evidence, return evidence, broker readiness, auto-trading approval, or real-money trading readiness.

## Quick Start

```powershell
npm.cmd run verify
npm.cmd run check:completion
npm.cmd run smoke:trial-room
npm.cmd run start
```

Open the app locally, then use the demo admin account:

```text
admin@tradegym.local
admin123
```

## Core Trial Workflow

1. Log in as admin.
2. Open the Product Readiness area.
3. Click `Refresh product readiness`.
4. Review:
   - Customer Trial Room
   - Commercial Prototype Scorecard
   - Customer Trial Kickoff Plan
   - Launch Ops Board
   - Customer Trial Packet
5. Export Room, Scorecard, Kickoff, Launch, and Trial briefs.
6. Click `Create kickoff actions`.
7. Click `Send room` to create a local simulated customer trial room share.
8. Open `Buyer review` or record a structured buyer evidence request with `Log objection`.
9. Record buyer feedback from the room row.
10. Create or reuse the feedback follow-up action.
11. Mark the follow-up action done when customer-success closes the education evidence request.
12. Export `Room Progress` for customer-success or buyer follow-through review.
13. Check audit logs.

## Verification

Full API verification:

```powershell
npm.cmd run verify
```

Code-side completion audit check:

```powershell
npm.cmd run check:completion
```

Customer trial room smoke:

```powershell
npm.cmd run smoke:trial-room
```

Expected smoke shape:

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

## Key Documents

- `PRODUCT_MVP.md`: implemented product capability map.
- `AGENTS.md`: repo-specific guardrails for future Codex/Claude agents.
- `CUSTOMER_TRIAL_OPERATOR_RUNBOOK.md`: step-by-step customer trial operating guide.
- `CODE_SIDE_COMPLETION_AUDIT.md`: code-side completion audit and residual non-code risks.
- `COMMERCIAL_TRIAL_RELEASE_PACKET.md`: closed commercial-trial handoff packet and stop rule.
- `PRODUCT_TOP_DOWN_REDESIGN.md`: product strategy and top-down redesign notes.

## Important Boundaries

Keep these true in code, UI, exports, docs, and customer conversations:

- `productionReady:false`
- `educationOnly:true`
- no stock recommendations
- no live buy/sell signals
- no return, win-rate, or profitability promises
- no broker connection
- no auto-trading
- no real-money trading instruction
- no claim that local/demo/mock/rule-based providers are production provider readiness

## Production Blockers

The local prototype can support a bounded education customer trial. It is not production-ready.

Production still requires:

- legal review and jurisdiction-specific disclosures
- licensed production market data/news contracts
- production email provider proof
- payment, invoice, tax, refund, and reconciliation controls
- append-only audit storage
- security review, access logging, backup, retention, and monitoring
- customer contract and support staffing

Broker integration and auto-trading are intentionally out of scope.
