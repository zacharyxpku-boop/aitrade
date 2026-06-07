# AI Trading Learning Gym Top-Down Redesign

## Core thesis

The product should sell **trading judgment training**, not trading outcomes.

It is an education system with four layers:

1. Market replay and backtest classroom
2. Learner drills and misconception detection
3. AI coach and human review
4. Ops/admin workflow for activation, follow-up, and curriculum packaging

Anything that looks like execution, signals, or profitability claims stays out.

## What open source is useful for

Reviewed GitHub patterns:

- `backtesting.py` and `backtrader`
  - Useful for historical replay structure, event timelines, and metric conventions.
  - Not useful as a product template for live signal delivery.
- `vectorbt`
  - Useful for fast metric comparison and batch evaluation.
- `FinRL`
  - Useful for the separation between environment, agent, and evaluation.
- `Qlib`
  - Useful for research-grade data/experiment organization.
- `Lean`
  - Useful for mature backtest architecture and modular runtime boundaries.
- `OpenBB`
  - Useful for connector abstraction, source labeling, and data provenance.

Product translation:

- Copy the **layering**, not the trading automation.
- Copy the **metrics and audit structure**, not the order execution.
- Copy the **research workflow**, not the broker plumbing.

## Backtest Literacy Brief

The backtest classroom now has a learner/coach brief layer:

- `GET /api/backtest/literacy-brief`
- `GET /api/backtest/literacy-brief/export?format=json|csv|md`

This translates win rate, expectancy, drawdown, sample size, setup grouping, execution-friction gaps, and news/sentiment boundaries into education-language. It is designed to prevent the most common misuse: treating a tiny paper-trade journal as proof of a strategy.

The brief explicitly says that:

- win rate is a description of saved classroom journals only
- expectancy and drawdown are learning diagnostics only
- missing fees, spread, slippage, partial fills, and broker execution must stay visible
- news and sentiment are context boundaries, not trade permission
- setup diagnostics are for repeated mistake review, not strategy scoring

It can be exported for learner review or coach preparation, but it is not a signal report, stock recommendation, return claim, broker-readiness check, auto-trading approval, or real-money readiness certificate.

## Better product shape

The best commercial version is not a chart viewer.

It is a loop:

1. Show a real market scenario.
2. Ask the learner for a decision.
3. Reveal the consequence with replay/backtest.
4. Diagnose the mistake.
5. Assign the next drill or course package.
6. Track activation, follow-up, and completion.

That loop is what a school, tutor, or internal training team pays for.

## Current product wedge

The strongest wedge is:

- first lesson completed
- first mistake corrected
- first coach follow-up created
- first curriculum package assigned
- first completion report issued

Those are better commercial metrics than win rate.

## Recommended next slice

Build a **personalized next-step recommender** that turns:

- activation queue
- mistake profile
- completion report
- backtest misconception results

into one of these actions:

- assign a course package
- create a coach follow-up
- assign a targeted drill
- defer until prerequisites are done

This is the most commercial next step because it connects education evidence to an upsell or retention action without crossing into trading advice.

Implemented learner-facing slice:

- `GET /api/next-step-plan`

The learner next-step plan combines onboarding status, open assignments, inbox items, completion-report next learning products, backtest literacy sample quality, and the next chart drill into one primary action plus a short action queue. It is shown in the Start Here panel so the learner does not have to stitch together multiple dashboards.

The plan is deliberately a workflow recommender, not an investment recommender. It can route the learner to trainer, replay, coach, or dashboard views, but it never routes to broker execution, stock selection, live signals, auto-trading, or return claims.

The recommendation loop now records learner follow-through as education operations data:

- `POST /api/next-step-plan/events`
- `GET /api/admin/next-step-engagement-report`
- `GET /api/admin/next-step-engagement-report/export?format=json|csv|md`

This follows the same product logic as open LMS and learning-record systems: turn learning recommendations into auditable learner events, then let coaches and operators review whether learners opened or completed the suggested education workflow. It is not a trading performance score, win-rate report, return report, market-prediction report, broker-readiness check, signal log, or auto-trading approval.

## Cohort delivery reports

The admin cohort workflow now has a customer/coach-facing report export:

- `GET /api/admin/cohort-education-report`
- `GET /api/admin/cohort-education-report/export?cohortId=...&format=json|csv|md`

This lets an education provider send a cohort-level learning progress brief: member progress, course-package progress, common mistake tags, risk-discipline gaps, and next teaching actions. It supports the SaaS service layer without crossing into trading advice. The report is explicitly not a trading-skill certification, win-rate claim, return claim, stock recommendation, live signal, broker-readiness check, auto-trading approval, or real-money trading instruction.

## Education completion certificates

Issued completion reports now have a certificate-style export:

- `GET /api/completion-certificate/export?reportId=...&format=json|csv|md`

Learners can export their own issued course-package completion certificate, and admins can export certificates for customer-success or coach delivery. The certificate is a learning workflow proof: course package, learner, completed education items, training attempts, risk-discipline summary, and a deterministic verification code. It is deliberately not a trading-skill certification, win-rate claim, return claim, stock recommendation, live signal, broker-readiness check, auto-trading approval, or real-money trading instruction.

## Hard boundaries

- No stock picks
- No live buy/sell signals
- No return promises
- No broker integration
- No auto-trading
- No disguised investment advice

## Source links

- https://github.com/kernc/backtesting.py
- https://github.com/mementum/backtrader
- https://github.com/polakowo/vectorbt
- https://github.com/microsoft/qlib
- https://github.com/AI4Finance-Foundation/FinRL
- https://github.com/QuantConnect/Lean
- https://github.com/OpenBB-finance/OpenBB
