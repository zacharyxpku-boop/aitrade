# Source Rights Review Slice

This slice adds a content-source governance step for the AI Trading Learning Gym prototype.

Implemented API:

- `POST /api/admin/content-sources/review`
- Supported actions: `approve_demo`, `approve_licensed`, `request_changes`, `reject`
- Stored checklist: source rights, transcript/OCR alignment, chart context, compliance, pedagogy
- Audit event: `content_source_reviewed`

Admin UI:

- Content source rows now show review status and source-rights review notes.
- Admins can approve a source for internal demo use or request changes from the content-source list.

Boundary:

- `approve_demo` means internal education prototype use only.
- `approve_licensed` records source-level review intent, but does not replace real provider contracts, legal review, attribution, retention policy, or access controls.
- This feature does not provide stock recommendations, live buy/sell signals, return promises, broker connectivity, or real-money trading instructions.
- `/api/system/readiness` must remain `productionReady:false` until production providers, legal review, payment controls, and data governance are complete.
