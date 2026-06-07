# Learner-Facing Source Transparency Slice

This slice makes source and data-mode labels visible to learners, not only to admins.

Implemented:

- `publicScenarios()` now attaches `sourceTransparency` to every learner-available scenario.
- The training UI shows a `Source` row beside technical, news, and sentiment context.
- `/api/training/next` returns the same transparency object for the recommended scenario.
- Verification checks bootstrap scenarios and next-training scenarios for `sourceTransparency.notSignal=true`.

`sourceTransparency` includes:

- data mode: demo/historical teaching versus licensed historical teaching
- market data provider and license
- news provider and license
- source provider/mode
- demo-data flag
- education-only flag
- learner-facing disclosure text
- constraints blocking live signals, recommendations, return promises, broker workflows, and real-money trading instructions

Boundary:

- These labels improve learner comprehension and compliance transparency.
- They do not make demo data production licensed.
- They do not provide stock recommendations, live buy/sell signals, return promises, broker connectivity, auto-trading, or real-money trading instructions.
