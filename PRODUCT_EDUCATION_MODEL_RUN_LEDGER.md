# Education Model Run Ledger

Education tutoring-plan dry runs can be archived through `POST /api/education-model/tutoring-plan/runs`.

Archived runs are stored in `educationModelRuns`, not only in the short audit-log window. Each run keeps:

- learner reference
- provider and moderation status
- context schema version
- tutoring-plan schema version
- context summary
- tutoring plan snapshot
- education-only constraints

Admins can inspect runs through `GET /api/admin/education-model-runs`.

Admin review workflow:

- New archived runs start as `reviewStatus: "needs_review"`.
- Admins can `approve`, `request_changes`, or `reject` through `POST /api/admin/education-model-runs/review`.
- Review actions store `reviewNote`, `reviewedBy`, and `reviewedAt`.
- Review actions write `education_model_run_reviewed` audit events.

Learner and admin progress reports expose only the latest approved education model run as `approvedEducationModelRun`. Runs that are still pending, rejected, or marked changes requested are not treated as reviewed teaching evidence.

Admins can export the run ledger through `GET /api/admin/education-model-runs/export`.

- `format=json` returns run snapshots, review metadata, filters, and education-only constraints.
- `format=csv` returns review and schema metadata for QA review.
- `userId` and `reviewStatus` filters can scope the export.

These runs are for tutoring audit and human review only. They are not stock recommendations, live signals, return evidence, broker actions, or real-money trading instructions.
