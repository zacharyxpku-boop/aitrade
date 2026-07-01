import fs from "node:fs";

const intakePath = "docs/LOCAL_COURSE_LOW_EXTRACTION_TRANSCRIPT_INTAKE.json";
const manualJsonPath = "docs/LOCAL_COURSE_LOW_EXTRACTION_MANUAL_TRANSCRIPTION_PACK.json";
const manualMdPath = "docs/LOCAL_COURSE_LOW_EXTRACTION_MANUAL_TRANSCRIPTION_PACK.md";
const replacementJsonPath = "docs/LOCAL_COURSE_LOW_EXTRACTION_SOURCE_REPLACEMENT_PACK.json";
const replacementMdPath = "docs/LOCAL_COURSE_LOW_EXTRACTION_SOURCE_REPLACEMENT_PACK.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function groupByDocument(rows) {
  const byDoc = new Map();
  for (const row of rows) {
    if (!byDoc.has(row.documentId)) {
      byDoc.set(row.documentId, {
        documentId: row.documentId,
        sourceId: row.sourceId,
        sourceRelativePath: row.sourceRelativePath,
        sourceModule: row.sourceModule,
        pages: [],
      });
    }
    byDoc.get(row.documentId).pages.push(row);
  }
  return [...byDoc.values()].map((doc) => ({
    ...doc,
    pageCount: doc.pages.length,
    pageNumbers: doc.pages.map((page) => page.pageNumber),
  }));
}

const intake = readJson(intakePath);
if (intake.educationOnly !== true) fail("intake must keep educationOnly true");
if (intake.productionReady !== false) fail("intake productionReady drift");
if (intake.learnerFacingRelease !== false) fail("intake learnerFacingRelease drift");
if (intake.approvalStatus !== "not_approved") fail("intake approval drift");

const pageRows = intake.pageRows || [];
const manualRows = pageRows.filter((row) => row.intakeStatus === "manual_transcription_candidate");
const blankRows = pageRows.filter((row) => row.intakeStatus === "blank_preview_needs_source_replacement");
const manualDocuments = groupByDocument(manualRows);
const replacementDocuments = groupByDocument(blankRows);

const manualPack = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  packStatus: "manual_transcription_ready",
  sourceIntake: intakePath,
  lowExtractionDocs: intake.lowExtractionDocs,
  manualTranscriptionDocuments: manualDocuments.length,
  manualTranscriptionPages: manualRows.length,
  acceptedTranscriptPages: 0,
  transcriptionCards: manualRows.map((row) => ({
    id: row.id,
    documentId: row.documentId,
    sourceId: row.sourceId,
    sourceRelativePath: row.sourceRelativePath,
    sourceModule: row.sourceModule,
    pageNumber: row.pageNumber,
    previewPath: row.previewPath,
    previewBytes: row.previewBytes,
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    intakeStatus: row.intakeStatus,
    humanTranscription: "",
    humanSummary: "",
    uncertainWords: [],
    qualityChecklist: {
      visualTextCaptured: "not_started",
      chartLabelsCaptured: "not_started",
      unclearAreasFlagged: "not_started",
      noTradingAdviceAdded: "not_started",
      publicSourceGroundingReady: "not_started",
      originalRewriteReady: "not_started",
    },
    nextGate: "human_transcription_then_source_fit_public_grounding_originality_review",
  })),
  documentRows: manualDocuments.map((doc) => ({
    documentId: doc.documentId,
    sourceId: doc.sourceId,
    sourceRelativePath: doc.sourceRelativePath,
    sourceModule: doc.sourceModule,
    pageCount: doc.pageCount,
    pageNumbers: doc.pageNumbers,
    nextAction: "fill_human_transcription_and_summary_then_run_source_fit_review",
  })),
  boundary: "Manual transcription pack for visible low-extraction private local course PDF pages. It only prepares human review fields; it does not perform OCR, generate transcription, approve learner-facing release, copy source text into lessons, provide trading advice, or replace public-source grounding and originality review.",
};

const sourceReplacementPack = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  packStatus: "source_replacement_required",
  sourceIntake: intakePath,
  replacementDocuments: replacementDocuments.length,
  replacementCandidates: blankRows.length,
  blankPreviewPages: blankRows.length,
  acceptedTranscriptPages: 0,
  replacementCards: blankRows.map((row) => ({
    id: row.id,
    documentId: row.documentId,
    sourceId: row.sourceId,
    sourceRelativePath: row.sourceRelativePath,
    sourceModule: row.sourceModule,
    pageNumber: row.pageNumber,
    previewPath: row.previewPath,
    previewBytes: row.previewBytes,
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    intakeStatus: row.intakeStatus,
    replacementStatus: "source_replacement_required",
    requiredAction: "locate_original_pdf_or_reexport_source_then_rerun_harvest_quality_visual_review_and_transcript_intake",
    nextGate: "replace_or_reexport_source_pdf_before_absorption",
  })),
  documentRows: replacementDocuments.map((doc) => ({
    documentId: doc.documentId,
    sourceId: doc.sourceId,
    sourceRelativePath: doc.sourceRelativePath,
    sourceModule: doc.sourceModule,
    pageCount: doc.pageCount,
    pageNumbers: doc.pageNumbers,
    nextAction: "replace_or_reexport_source_pdf_before_absorption",
  })),
  actions: [
    "Locate the original PDF or a cleaner export for each blank preview document.",
    "Replace or re-export the source file outside learner-facing release paths.",
    "Rerun harvest:local-investment-course and local-course source quality audit.",
    "Regenerate low-extraction visual review previews and transcript intake.",
    "Only move pages into manual transcription or source-fit review after previews contain readable evidence.",
  ],
  boundary: "Source replacement pack for blank-preview low-extraction private local course PDFs. It blocks absorption until the source PDF is replaced or re-exported and rechecked; it does not infer missing content, approve learner-facing release, provide trading advice, or bypass public-source grounding.",
};

fs.writeFileSync(manualJsonPath, `${JSON.stringify(manualPack, null, 2)}\n`, "utf8");
fs.writeFileSync(manualMdPath, [
  "# Low-Extraction Manual Transcription Pack",
  "",
  "Human execution pack for visible low-extraction pages.",
  "",
  `- Pack status: ${manualPack.packStatus}`,
  `- Manual transcription documents: ${manualPack.manualTranscriptionDocuments}`,
  `- Manual transcription pages: ${manualPack.manualTranscriptionPages}`,
  `- Accepted transcript pages: ${manualPack.acceptedTranscriptPages}`,
  `- Approval status: ${manualPack.approvalStatus}`,
  "",
  "## Documents",
  "",
  "| Document | Pages | Next action |",
  "| --- | ---: | --- |",
  ...manualPack.documentRows.map((row) => `| ${row.sourceRelativePath} | ${row.pageNumbers.join(", ")} | ${row.nextAction} |`),
  "",
  "## Boundary",
  "",
  manualPack.boundary,
  "",
].join("\n"), "utf8");

fs.writeFileSync(replacementJsonPath, `${JSON.stringify(sourceReplacementPack, null, 2)}\n`, "utf8");
fs.writeFileSync(replacementMdPath, [
  "# Low-Extraction Source Replacement Pack",
  "",
  "Blocking pack for blank-preview source files.",
  "",
  `- Pack status: ${sourceReplacementPack.packStatus}`,
  `- Replacement documents: ${sourceReplacementPack.replacementDocuments}`,
  `- Replacement candidates: ${sourceReplacementPack.replacementCandidates}`,
  `- Blank preview pages: ${sourceReplacementPack.blankPreviewPages}`,
  `- Approval status: ${sourceReplacementPack.approvalStatus}`,
  "",
  "## Documents",
  "",
  "| Document | Pages | Next action |",
  "| --- | ---: | --- |",
  ...sourceReplacementPack.documentRows.map((row) => `| ${row.sourceRelativePath} | ${row.pageNumbers.join(", ")} | ${row.nextAction} |`),
  "",
  "## Required Actions",
  "",
  ...sourceReplacementPack.actions.map((action) => `- ${action}`),
  "",
  "## Boundary",
  "",
  sourceReplacementPack.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  manualTranscriptionPages: manualPack.manualTranscriptionPages,
  acceptedTranscriptPages: manualPack.acceptedTranscriptPages,
  replacementCandidates: sourceReplacementPack.replacementCandidates,
  blankPreviewPages: sourceReplacementPack.blankPreviewPages,
  manualOutputJson: manualJsonPath,
  replacementOutputJson: replacementJsonPath,
}, null, 2));
