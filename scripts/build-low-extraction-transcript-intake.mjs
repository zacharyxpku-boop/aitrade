import fs from "node:fs";

const overlayPath = "docs/LOCAL_COURSE_LOW_EXTRACTION_TRANSCRIPTION_OVERLAY.json";
const outputJsonPath = "docs/LOCAL_COURSE_LOW_EXTRACTION_TRANSCRIPT_INTAKE.json";
const outputMdPath = "docs/LOCAL_COURSE_LOW_EXTRACTION_TRANSCRIPT_INTAKE.md";
const blankPreviewByteThreshold = 5000;
const minTranscriptChars = 80;

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function classifyPage(entry) {
  if ((entry.previewBytes || 0) <= blankPreviewByteThreshold) return "blank_preview_needs_source_replacement";
  if (entry.transcriptionStatus === "transcribed_pending_review") {
    return String(entry.reviewerTranscription || "").trim().length >= minTranscriptChars
      ? "transcript_candidate_pending_source_fit"
      : "transcript_too_short_rework_required";
  }
  if (entry.transcriptionStatus === "unusable") return "marked_unusable_pending_reviewer_reason";
  if (entry.transcriptionStatus === "needs_source_replacement") return "source_replacement_requested";
  return "manual_transcription_candidate";
}

const overlay = readJson(overlayPath);
if (overlay.educationOnly !== true) fail("overlay must keep educationOnly true");
if (overlay.productionReady !== false) fail("overlay productionReady drift");
if (overlay.approvalStatus !== "not_approved") fail("overlay approval drift");

const pageRows = (overlay.pageEntries || []).map((entry) => {
  const intakeStatus = classifyPage(entry);
  return {
    id: entry.id,
    documentId: entry.documentId,
    sourceId: entry.sourceId,
    sourceRelativePath: entry.sourceRelativePath,
    sourceModule: entry.sourceModule,
    pageNumber: entry.pageNumber,
    previewPath: entry.previewPath,
    previewBytes: entry.previewBytes,
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    transcriptionStatus: entry.transcriptionStatus,
    visualDecision: entry.visualDecision,
    intakeStatus,
    reviewerTranscriptionChars: String(entry.reviewerTranscription || "").trim().length,
    transcriptAcceptedForReview: intakeStatus === "transcript_candidate_pending_source_fit",
    nextGate: intakeStatus === "blank_preview_needs_source_replacement"
      ? "replace_or_reexport_source_pdf_before_absorption"
      : intakeStatus === "manual_transcription_candidate"
        ? "human_visual_transcription_required"
        : "source_fit_public_grounding_originality_review",
  };
});

const documentRows = (overlay.documentRows || []).map((doc) => {
  const rows = pageRows.filter((row) => row.documentId === doc.documentId);
  return {
    documentId: doc.documentId,
    sourceId: doc.sourceId,
    sourceRelativePath: doc.sourceRelativePath,
    sourceModule: doc.sourceModule,
    pageCount: doc.pageCount,
    manualTranscriptionCandidatePages: rows.filter((row) => row.intakeStatus === "manual_transcription_candidate").length,
    blankPreviewPages: rows.filter((row) => row.intakeStatus === "blank_preview_needs_source_replacement").length,
    transcriptCandidatePages: rows.filter((row) => row.intakeStatus === "transcript_candidate_pending_source_fit").length,
    nextAction: rows.some((row) => row.intakeStatus === "blank_preview_needs_source_replacement")
      ? "source_replacement_or_reexport_required_for_blank_pages"
      : "manual_transcription_required",
  };
});

const intake = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  intakeStatus: "waiting_for_human_transcription",
  sourceOverlay: overlayPath,
  lowExtractionDocs: overlay.lowExtractionDocs,
  totalPages: overlay.transcriptionPages,
  blankPreviewByteThreshold,
  minTranscriptChars,
  manualTranscriptionCandidatePages: pageRows.filter((row) => row.intakeStatus === "manual_transcription_candidate").length,
  blankPreviewPages: pageRows.filter((row) => row.intakeStatus === "blank_preview_needs_source_replacement").length,
  transcriptCandidatePages: pageRows.filter((row) => row.intakeStatus === "transcript_candidate_pending_source_fit").length,
  acceptedTranscriptPages: pageRows.filter((row) => row.transcriptAcceptedForReview).length,
  sourceReplacementCandidatePages: pageRows.filter((row) => row.intakeStatus === "blank_preview_needs_source_replacement").length,
  documentRows,
  pageRows,
  boundary: "Transcript intake for low-extraction private local course PDFs. It does not perform OCR, fill human transcription, approve learner-facing release, copy source text into lessons, provide trading advice, or replace public-source grounding and originality review.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(intake, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course Low-Extraction Transcript Intake",
  "",
  "Machine triage for low-extraction pages after visual preview generation.",
  "",
  `- Intake status: ${intake.intakeStatus}`,
  `- Low-extraction docs: ${intake.lowExtractionDocs}`,
  `- Total pages: ${intake.totalPages}`,
  `- Manual transcription candidate pages: ${intake.manualTranscriptionCandidatePages}`,
  `- Blank preview pages: ${intake.blankPreviewPages}`,
  `- Transcript candidate pages: ${intake.transcriptCandidatePages}`,
  `- Accepted transcript pages: ${intake.acceptedTranscriptPages}`,
  `- Source replacement candidate pages: ${intake.sourceReplacementCandidatePages}`,
  `- Approval status: ${intake.approvalStatus}`,
  "",
  "## Documents",
  "",
  "| Document | Manual transcription | Blank preview | Transcript candidates | Next action |",
  "| --- | ---: | ---: | ---: | --- |",
  ...documentRows.map((row) => `| ${row.sourceRelativePath} | ${row.manualTranscriptionCandidatePages} | ${row.blankPreviewPages} | ${row.transcriptCandidatePages} | ${row.nextAction} |`),
  "",
  "## Boundary",
  "",
  intake.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: intake.educationOnly,
  productionReady: intake.productionReady,
  learnerFacingRelease: intake.learnerFacingRelease,
  approvalStatus: intake.approvalStatus,
  intakeStatus: intake.intakeStatus,
  lowExtractionDocs: intake.lowExtractionDocs,
  totalPages: intake.totalPages,
  manualTranscriptionCandidatePages: intake.manualTranscriptionCandidatePages,
  blankPreviewPages: intake.blankPreviewPages,
  acceptedTranscriptPages: intake.acceptedTranscriptPages,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
