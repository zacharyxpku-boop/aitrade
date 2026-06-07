# Education Model Context

The learner progress report now returns `educationModelContext`, and `GET /api/education-model/context` exposes the same safe context for future tutoring-model integration.

The context includes:

- learner activity counts
- top misconception tags
- risk/context discipline summaries
- habit and milestone status
- course completion evidence blockers
- recommended education-only teaching moves

The context intentionally excludes raw K-line series, broker instructions, live signals, and real-money order data.

Allowed uses:

- tutoring explanations
- education-only practice sequencing
- human-coach summaries
- course package or coach follow-up routing

Prohibited uses:

- stock recommendations
- live buy/sell signals
- return promises or estimates
- broker or real-money trading actions
- treating demo/OCR/news/sentiment/source labels as trade signals
