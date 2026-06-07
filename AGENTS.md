# TradeGym Agent Instructions

This repository is a local AI trading education SaaS prototype. Treat it as an education/training product, not a trading, brokerage, signal, or auto-trading system.

## Product Guardrails

Keep these true in every code change, UI label, API response, export, document, and test:

- `educationOnly:true` for education/customer-success artifacts.
- `productionReady:false` for system, launch, customer-trial, provider, audit, and commercial readiness artifacts.
- No stock recommendations.
- No live buy/sell signals.
- No return, win-rate, or profitability promises.
- No broker integration.
- No auto-trading.
- No real-money trading instruction.
- Demo/local/mock/rule-based providers must stay clearly labeled.

If a request asks for real trading advice, signals, broker workflows, order automation, performance promises, or production trading readiness, refuse that part and keep the implementation inside education/customer-success operations.

## Primary Commands

Use Windows `npm.cmd` commands:

```powershell
npm.cmd run verify
npm.cmd run check:completion
npm.cmd run smoke:trial-room
npm.cmd run start
```

For isolated verification, use a temporary SQLite path and clean it afterward:

```powershell
$stamp = Get-Date -Format 'yyyyMMddHHmmss'
$env:TRADEGYM_SQLITE_PATH="./data/verify-$stamp.sqlite"
npm.cmd run verify
$code=$LASTEXITCODE
Get-ChildItem -Path data -Filter "verify-$stamp.sqlite*" -ErrorAction SilentlyContinue | Remove-Item -Force
exit $code
```

## Important Files

- `README.md`: repo entrypoint and quick start.
- `PRODUCT_MVP.md`: implemented capability map.
- `CUSTOMER_TRIAL_OPERATOR_RUNBOOK.md`: bounded education trial operating guide.
- `CODE_SIDE_COMPLETION_AUDIT.md`: code-side completion audit and residual non-code risks.
- `scripts/verify-api.mjs`: main API verification.
- `scripts/smoke-customer-trial-room.mjs`: customer trial room end-to-end smoke.
- `server.js`: backend and admin/customer-success APIs.
- `app.js` and `index.html`: browser UI.
- `storage.js`: SQLite persistence mapping; update it when adding new app_state keys.

## Implementation Rules

- Preserve unrelated local changes.
- Prefer existing local patterns over new abstractions.
- Use `apply_patch` for manual edits.
- Do not add production providers, broker SDKs, trading APIs, or auto-trading code.
- Do not persist new top-level app state without updating `storage.js`.
- Do not present local simulated delivery as real email delivery.
- Do not mark production readiness true.
- After behavior changes, run `npm.cmd run verify`.
- After customer trial room changes, also run `npm.cmd run smoke:trial-room`.

## Completion Language

Use precise wording:

- Good: "bounded education customer-trial prototype", "local simulated provider", "customer-success follow-up", "productionReady remains false".
- Bad: "production-ready", "trading signal", "strategy works", "improves win rate", "broker workflow ready", "auto-trading enabled", "real-money ready".
