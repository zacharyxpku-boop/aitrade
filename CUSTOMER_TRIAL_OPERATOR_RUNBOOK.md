# Customer Trial Operator Runbook

This runbook explains how to run a bounded TradeGym education SaaS customer trial in the local prototype. It is for customer-success, sales, curriculum, and ops review. It is not investment advice, signal evidence, broker readiness, auto-trading approval, or production launch certification.

## Trial Positioning

- Product category: AI trading education and practice workspace.
- Allowed trial goal: inspect the learning workflow, coach follow-up, service operations, audit evidence, and customer-success handling.
- Not allowed: stock recommendations, live buy/sell signals, return promises, win-rate claims, broker connection, auto-trading, or real-money trading instruction.
- Provider mode: local/demo/mock/rule-based unless the UI says otherwise.
- Production state: `productionReady:false` must remain visible in system readiness, scorecard, exports, smoke output, and audit records.

## Local Start

```powershell
npm.cmd run verify
npm.cmd run smoke:trial-room
npm.cmd run start
```

Open the app, then log in as:

```text
admin@tradegym.local
admin123
```

## Trial Room Workflow

1. Open the admin billing/product readiness surface.
2. Click `Refresh product readiness`.
3. Review `Customer trial room`.
4. Export review artifacts:
   - `Room Brief`
   - `Scorecard Brief`
   - `Kickoff Brief`
   - `Launch Brief`
   - `Trial Brief`
5. Click `Create kickoff actions` to turn recommended kickoff steps into customer-success actions.
6. Click `Send room` to create a local simulated trial room share.
7. Open `Buyer review` to inspect the buyer-facing education evidence checklist.
8. If the buyer asks for clearer evidence, click `Log objection` to record the structured request and target follow-up.
9. Record buyer feedback from the room row:
   - `Objection`
   - `Evidence`
   - `Accepted`
   - `No fit`
10. If feedback is not pending, click `Create action` to create or reuse the customer-success follow-up action.
11. Mark the action done after the customer-success team closes the education evidence request.
12. Export `Room Progress` for customer-success or buyer follow-through review.
13. Refresh audit logs and confirm the trial room events are present.

## Buyer Review Script

Use this framing:

```text
This is a bounded education SaaS trial room. It shows how learners practice historical K-line scenarios, replay notes, simulated paper journals, coach reviews, support, audit evidence, and customer-success follow-up. It does not provide investment advice, live trading signals, return promises, broker connectivity, auto-trading, or real-money trading readiness.
```

Do not say:

- "This can generate trading signals."
- "This proves a strategy works."
- "This predicts profitability."
- "This can connect to brokerage workflows."
- "This is production-ready."
- "This improves win rate."

## Evidence To Show

- Commercial prototype scorecard: customer trial operating completeness only.
- Customer trial kickoff plan: agenda, roles, success criteria, and owner follow-through.
- Customer trial room: one evidence hub for packet, scorecard, kickoff, artifacts, checklist, delivery state, and actions.
- Trial room shares: local simulated handoff records only.
- Buyer review package: structured education evidence checklist and buyer-question prompts only.
- Buyer objections: evidence requests that become customer-success follow-up context.
- Buyer review rollup: scorecard and room summary counts for open education evidence requests.
- Feedback actions: customer-success follow-up tasks only.
- Action closure: completed customer-success actions update the trial room share and summary counts.
- Room progress export: JSON/CSV/Markdown follow-through evidence for customer-success meetings.
- Audit logs: local audit evidence only; production still requires append-only audit storage.

## Smoke Proof

Run:

```powershell
$env:TRADEGYM_SQLITE_PATH='./data/smoke-customer-trial-room.sqlite'
$env:SMOKE_PORT='4274'
npm.cmd run smoke:trial-room
```

Expected proof shape:

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

Clean up temporary SQLite files after smoke runs if the command is interrupted.

## Stop Conditions

Pause the trial and create an ops/legal follow-up if a buyer asks for:

- A stock pick or asset recommendation.
- A live entry/exit signal.
- Expected return, win-rate, or profitability proof.
- Broker connection or automatic order placement.
- Real market deployment.
- Production security, legal, provider, or payment certification.

The correct response is to restate the education-only boundary and route the request into a customer-success action, not to answer it as trading advice.
