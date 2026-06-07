# OCR / Video Alignment Evidence Slice

This slice adds a lightweight review record for screenshot OCR and video transcript fallback alignment.

Implemented API:

- `POST /api/admin/content-sources/alignment-evidence`

Evidence fields:

- `frameRef` or screenshot reference
- `timecode`
- `ocrText`
- `alignedText`
- `confidence`
- `reviewStatus`: `aligned_for_demo`, `needs_revision`, or `rejected`
- `reviewNote`
- reviewer and timestamp

Behavior:

- Evidence is stored on the content source under `structured.alignmentEvidence`.
- Content source summaries return `alignmentEvidence` and `alignmentEvidenceCount`.
- Adding approved demo evidence updates extraction status to `evidence_reviewed_for_demo`.
- The release checklist updates transcript accuracy and chart context to demo-reviewed values.
- Admin UI content-source rows show alignment evidence count and expose an `Add alignment` action.
- Every evidence record writes a `content_source_alignment_evidence_added` audit event.

Boundary:

- This is review evidence for education content production only.
- It does not run real OCR, video parsing, market data licensing, or broker execution.
- It does not provide stock recommendations, live signals, return promises, auto-trading, or real-money trading instructions.
- Production use still requires real media storage, OCR/video providers, source rights, retention, access control, and legal review.
