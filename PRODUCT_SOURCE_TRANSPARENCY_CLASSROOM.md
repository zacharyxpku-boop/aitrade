# Source Transparency Classroom Slice

This slice trains learners to interpret source labels correctly.

Implemented APIs:

- `GET /api/source-transparency/classroom`
- `POST /api/source-transparency/misconception-attempts`

Classroom coverage:

- learner-visible scenarios
- demo/historical teaching labels
- internal-demo-only market/news license counts
- prior source-label misconception attempts

Misconception drill:

- Blocks the mistake that demo/internal-demo labels imply a live signal, production data license, or expected return.
- Adds profile tags such as `source-label-as-signal-risk` when the learner answers unsafely.
- Writes `source_transparency_misconception_attempt` audit events.

Boundary:

- Source transparency is a learner safety label.
- It is not a stock recommendation, live signal, production data license, return promise, broker connection, auto-trading workflow, or real-money trading instruction.
