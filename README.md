# TradeGym AI Trading Learning Gym

Local commercial SaaS prototype for an AI trading education and practice product.

This project is an education-only customer-trial prototype. It is not investment advice, stock recommendation, live signal evidence, return evidence, broker readiness, auto-trading approval, or real-money trading readiness.

## Quick Start

```powershell
npm.cmd run verify
npm.cmd run check:completion
npm.cmd run smoke:trial-room
npm.cmd run seed:public-preview
npm.cmd run start
```

Open the app locally, then use the demo admin account:

```text
admin@tradegym.local
admin123
```

For the no-login user trial, open:

```text
http://localhost:4273/friend-trial
```

The route renders the same education-only training flow as the home app and keeps `productionReady:false`.

## API Key Configuration

Do not paste API keys into chat. For local development, create `C:\Users\86136\Desktop\ai-trading-learning-gym\.env`; this file is ignored by git and is loaded by `config.js`.

OpenAI example:

```env
AI_COACH_PROVIDER=openai
AI_COACH_API_KEY=sk-your-key
AI_COACH_MODEL=gpt-4o-mini
```

Anthropic example:

```env
AI_COACH_PROVIDER=anthropic
AI_COACH_API_KEY=sk-ant-your-key
AI_COACH_MODEL=claude-3-5-haiku-latest
```

DeepSeek example:

```env
AI_COACH_PROVIDER=deepseek
AI_COACH_API_KEY=sk-your-deepseek-key
AI_COACH_MODEL=deepseek-chat
```

Optional public/API preview data:

```env
MARKET_DATA_PROVIDER=alpha_vantage
MARKET_DATA_API_KEY=your-alpha-vantage-key
NEWS_PROVIDER=alpha_vantage
NEWS_API_KEY=your-alpha-vantage-key
SEC_EDGAR_USER_AGENT=TradeGym education-only public data preview contact your-email@example.com
```

For Vercel, add the same names in Project Settings -> Environment Variables. Do not commit secrets into `vercel.json`. Even with a real LLM key, the product must stay education-only: no stock recommendations, no live buy/sell signals, no return promises, no broker connection, no real-money instruction.

## Public Preview Data Seed

The public preview seed command expands the demo question bank with education-only historical-context scenarios:

```powershell
npm.cmd run seed:public-preview
```

Current seed behavior:

- Tries Stooq public CSV first, but does not bypass browser verification if blocked.
- Falls back to Yahoo chart public-preview OHLC data for ingestion testing.
- Uses SEC EDGAR official public filing metadata as historical event context.
- Tries GDELT event metadata when available; rate limits are recorded instead of fabricated around.
- Marks generated scenarios as `educationOnly:true` and `productionReady:false`.

This is enough for bounded education trials and data-pipeline testing. It is not licensed commercial market/news/sentiment data.

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
