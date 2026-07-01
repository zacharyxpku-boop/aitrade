import fs from "node:fs";

const intakePath = "docs/LOCAL_COURSE_LOW_EXTRACTION_TRANSCRIPT_INTAKE.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const intake = readJson(intakePath);
const pageRows = intake.pageRows || [];
const documentRows = intake.documentRows || [];

if (intake.educationOnly !== true) fail("transcript intake must keep educationOnly:true");
if (intake.productionReady !== false) fail("transcript intake must keep productionReady:false");
if (intake.learnerFacingRelease !== false) fail("transcript intake must keep learnerFacingRelease:false");
if (intake.approvalStatus !== "not_approved") fail("transcript intake must remain not_approved");
if (intake.intakeStatus !== "waiting_for_human_transcription") fail(`unexpected intakeStatus: ${intake.intakeStatus}`);
if (intake.lowExtractionDocs !== 5 || documentRows.length !== 5) fail(`expected 5 low-extraction docs, got ${intake.lowExtractionDocs}/${documentRows.length}`);
if (intake.totalPages !== 22 || pageRows.length !== 22) fail(`expected 22 pages, got ${intake.totalPages}/${pageRows.length}`);
if (intake.manualTranscriptionCandidatePages !== 19) fail(`expected 19 manual transcription candidate pages, got ${intake.manualTranscriptionCandidatePages}`);
if (intake.blankPreviewPages !== 3) fail(`expected 3 blank preview pages, got ${intake.blankPreviewPages}`);
if (intake.sourceReplacementCandidatePages !== 3) fail(`expected 3 source replacement candidate pages, got ${intake.sourceReplacementCandidatePages}`);
if (intake.acceptedTranscriptPages !== 0 || intake.transcriptCandidatePages !== 0) {
  fail(`generated intake must not auto-accept transcripts, got accepted:${intake.acceptedTranscriptPages} candidates:${intake.transcriptCandidatePages}`);
}

for (const row of pageRows) {
  if (row.educationOnly !== true || row.productionReady !== false) fail(`${row.id} boundary drift`);
  if (row.learnerFacingRelease !== false || row.approvalStatus !== "not_approved") fail(`${row.id} release gate drift`);
  if (!row.previewPath || !fs.existsSync(row.previewPath)) fail(`${row.id} preview missing`);
  if (row.transcriptAcceptedForReview !== false) fail(`${row.id} must not auto-accept transcript`);
  if (row.reviewerTranscriptionChars !== 0) fail(`${row.id} must not include generated transcription`);
  if (row.previewBytes <= intake.blankPreviewByteThreshold) {
    if (row.intakeStatus !== "blank_preview_needs_source_replacement") fail(`${row.id} low-byte preview not classified as blank`);
    if (row.nextGate !== "replace_or_reexport_source_pdf_before_absorption") fail(`${row.id} blank page next gate drift`);
  } else {
    if (row.intakeStatus !== "manual_transcription_candidate") fail(`${row.id} visible preview not classified as manual candidate`);
    if (row.nextGate !== "human_visual_transcription_required") fail(`${row.id} manual page next gate drift`);
  }
}

const blankDocs = documentRows.filter((row) => row.blankPreviewPages > 0);
if (blankDocs.length !== 3) fail(`expected 3 documents with blank previews, got ${blankDocs.length}`);

if (!/does not perform OCR/i.test(intake.boundary || "")) fail("intake boundary must state no OCR is performed");

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
}, null, 2));
