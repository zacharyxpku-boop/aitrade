# Chart Screenshot Evidence Loop

This slice turns the chart screenshot OCR/fallback pipeline into an education-service loop.

## Product Boundary

- Education and training only.
- No stock recommendations.
- No live buy/sell signals.
- No return promises, win-rate claims, broker actions, or real-money instructions.
- Demo chart screenshots, OCR text, fallback notes, and learner attempts remain prototype evidence.
- `/api/system/readiness.productionReady` must remain `false`.

## Why This Matters

Open-source trading projects such as LEAN, QSTrader, hftbacktest, and AI trading-agent tools are useful references for backtesting, execution realism, and strategy workflows. They are not the product center here.

The product center is:

1. A human-reviewed chart screenshot becomes a drill.
2. The drill becomes a reviewed course package.
3. The package is published and assigned to a learner.
4. The learner completes the chart scenario.
5. The system creates a coach evidence follow-up only after real learner practice evidence exists.
6. The learner reads and responds to the follow-up.
7. The coach queue can apply the next education action.
8. The coach completes the chart evidence follow-up.
9. The completed coach note flows back into the learning evidence packet, education model context, and tutoring plan.

This creates a learning loop instead of a trading-signal loop.

## Implemented API

- `POST /api/admin/chart-screenshot-intakes/create-evidence-followup`

Required state:

- linked chart screenshot intake exists
- chart course package has been assigned
- assigned learner is active
- learner has completed the assigned chart scenario
- course progress contains the chart scenario completion

The endpoint creates or reuses a `learning_evidence_followup` coach task with `chartScreenshotEvidence` metadata:

- `contentSourceId`
- `coursePackageId`
- `scenarioId`
- `attemptId`
- `courseProgressId`
- `screenshotRef`
- `symbol`
- `timeframe`

## Verification Coverage

`scripts/verify-api.mjs` now verifies:

- chart screenshot intake
- OCR/fallback processing warning
- human alignment review
- scenario draft submission
- scenario approval
- chart course package draft creation
- chart course package publish and assignment
- learner completion of the assigned chart scenario
- chart evidence follow-up creation
- coach task queue visibility
- learning evidence packet visibility
- audit log creation
- learner read and response flow
- ready-to-apply evidence queue status
- coach completion of the chart evidence follow-up
- completed chart evidence summary in the learning evidence packet
- completed chart evidence signal in the education model context
- chart evidence coach note focus in the tutoring plan
