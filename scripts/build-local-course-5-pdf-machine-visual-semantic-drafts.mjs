import fs from "node:fs";

const executionPackPath = "docs/LOCAL_COURSE_5_PDF_OCR_VISUAL_EXECUTION_PACK.json";
const outputJson = "docs/LOCAL_COURSE_5_PDF_MACHINE_VISUAL_SEMANTIC_DRAFTS.json";
const outputMd = "docs/LOCAL_COURSE_5_PDF_MACHINE_VISUAL_SEMANTIC_DRAFTS.md";

const boundary = "Course 5 PDF machine visual semantic drafts are private reviewer-facing education operations material. They provide heuristic orientation from PDF metadata, page samples, module tags, OCR routes, and file context only. They do not perform OCR, read or transcribe source text, fill reviewer conclusions, delete files, approve folder deletion, approve learner-facing release, accept machine drafts as human review, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(name, artifact) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${name} must keep approvalStatus:not_approved`);
  if (artifact.writeAllowedNow !== false) fail(`${name} must keep writeAllowedNow:false`);
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function haystack(row) {
  return [row.relativePath, row.ocrExecutionRoute, row.extractionBucket, ...(row.moduleTags || [])].join(" ").toLowerCase();
}

function candidateConcepts(row) {
  const tags = new Set(row.moduleTags || []);
  const text = haystack(row);
  const concepts = [];
  if (tags.has("chart_pattern_encyclopedia") || text.includes("encyclopedia")) concepts.push("chart_pattern_taxonomy");
  if (tags.has("terminology_glossary") || text.includes("机翻") || text.includes("glossary")) concepts.push("terminology_or_translation_review");
  if (tags.has("trends_and_channels") || text.includes("trend")) concepts.push("trend_or_channel_chart_reading");
  if (tags.has("trading_ranges") || text.includes("range")) concepts.push("trading_range_chart_reading");
  if (tags.has("reversals") || text.includes("reversal") || text.includes("反转")) concepts.push("reversal_chart_reading");
  if (tags.has("breakouts_and_pullbacks") || text.includes("breakout") || text.includes("pullback")) concepts.push("breakout_or_pullback_chart_reading");
  if (tags.has("bar_by_bar_reading") || text.includes("bar")) concepts.push("bar_by_bar_chart_reading");
  if (tags.has("trade_management")) concepts.push("trade_management_education_case_review");
  if (tags.has("price_action_foundations")) concepts.push("price_action_foundation_review");
  if (row.extractionBucket === "large_file_deferred_for_dedicated_visual_or_ocr_pass") concepts.push("large_pdf_stratified_page_sample");
  if (row.extractionBucket === "very_low_text_likely_scanned_or_visual") concepts.push("low_text_pdf_manual_or_ocr_check");
  concepts.push("pdf_representative_page_visual_review");
  return uniq(concepts.length ? concepts : ["generic_pdf_visual_review"]);
}

function draftSummary(row) {
  const modules = (row.moduleTags || []).join(", ") || "unclassified";
  const concepts = candidateConcepts(row);
  return [
    `Machine-assisted PDF page orientation for page ${row.pageNumber} of ${row.relativePath}.`,
    `Treat as a ${row.priorityBand} ${row.extractionBucket} sample for ${modules}.`,
    `Likely reviewer concepts: ${concepts.join(", ")}.`,
    "Reviewer must inspect the page image and verify visible labels/text manually or with OCR before any module or deletion decision.",
  ].join(" ");
}

function reviewerQuestions(row) {
  const concepts = new Set(candidateConcepts(row));
  const questions = [
    "What visible chart, table, slide, or page elements can be described without copying source prose?",
    "What OCR/manual text is necessary before this page can support a teaching module?",
    "Which module should this page support, and what paraphrased concept would be safe?",
    "Is this representative page enough, or does the source need broader OCR/page sampling before deletion readiness?",
  ];
  if (concepts.has("terminology_or_translation_review")) questions.push("Are there translated terms or labels that require terminology review before teaching use?");
  if (concepts.has("large_pdf_stratified_page_sample")) questions.push("Which additional page bands should be sampled before treating this large PDF as covered?");
  if (concepts.has("reversal_chart_reading")) questions.push("Does the page visibly support a reversal pattern, failed breakout, climax, or top/bottom structure?");
  return questions;
}

function riskFlags(row) {
  const flags = ["private_source_not_public_grounded", "not_ocr_verified", "not_human_reviewed", "pdf_page_sample_not_full_document"];
  if (row.priorityBand === "P0_space_and_curriculum_blocker") flags.push("p0_large_pdf_space_and_curriculum_blocker");
  if (row.extractionBucket === "large_file_deferred_for_dedicated_visual_or_ocr_pass") flags.push("large_pdf_stratified_sample_not_exhaustive");
  if (row.extractionBucket === "very_low_text_likely_scanned_or_visual") flags.push("low_text_pdf_requires_ocr_or_manual_transcription");
  if ((row.moduleTags || []).includes("terminology_glossary")) flags.push("translation_or_terminology_quality_risk");
  return uniq(flags);
}

const executionPack = readJson(executionPackPath);
assertBoundary("executionPack", executionPack);
if (executionPack.executionStatus !== "course_5_pdf_ocr_visual_execution_pack_ready_blocked_on_ocr_or_real_visual_review") fail("PDF execution pack not ready");

const draftRows = (executionPack.sampleRows || []).map((row) => ({
  draftId: `course5_pdf_machine_visual_draft_${row.reviewRowId}`,
  reviewRowId: row.reviewRowId,
  recordId: row.recordId,
  relativePath: row.relativePath,
  pageNumber: row.pageNumber,
  sampleImagePath: row.sampleImagePath,
  sampleImageHref: row.sampleImageHref,
  moduleTags: row.moduleTags || [],
  courseAlignment: row.courseAlignment || [],
  extractionBucket: row.extractionBucket,
  priorityBand: row.priorityBand,
  ocrExecutionRoute: row.ocrExecutionRoute,
  candidateConcepts: candidateConcepts(row),
  candidateSummary: draftSummary(row),
  reviewerQuestions: reviewerQuestions(row),
  riskFlags: riskFlags(row),
  acceptanceRequiredBeforeUse: [
    "real_ocr_or_manual_text_verification",
    "real_visual_reviewer_note",
    "module_placement_confirmation",
    "public_grounding_check",
    "original_paraphrased_teaching_rewrite",
    "explicit_release_or_deletion_readiness_approval",
  ],
  draftStatus: "pdf_machine_visual_semantic_draft_needs_ocr_or_real_reviewer_validation",
  acceptedForPdfVisualSemanticReview: false,
  acceptedForModuleDistillation: false,
  acceptedForDeletionReadiness: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  productionReady: false,
  writeAllowedNow: false,
}));

const moduleMap = new Map();
for (const row of draftRows) {
  for (const moduleId of row.moduleTags.length ? row.moduleTags : ["unclassified_supplement"]) {
    if (!moduleMap.has(moduleId)) moduleMap.set(moduleId, []);
    moduleMap.get(moduleId).push(row);
  }
}

const moduleRows = [...moduleMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([moduleId, rows]) => {
  const conceptCounts = {};
  for (const row of rows) for (const concept of row.candidateConcepts) conceptCounts[concept] = (conceptCounts[concept] || 0) + 1;
  return {
    moduleId,
    draftRows: rows.length,
    sourcePdfRows: new Set(rows.map((row) => row.recordId)).size,
    dominantCandidateConcepts: Object.entries(conceptCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8).map(([concept, count]) => ({ concept, count })),
    reviewerNextAction: "validate_pdf_machine_drafts_then_fill_ocr_or_visual_review_input",
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    productionReady: false,
    writeAllowedNow: false,
  };
});

const priorityCounts = {};
const extractionBucketCounts = {};
for (const row of draftRows) {
  priorityCounts[row.priorityBand] = (priorityCounts[row.priorityBand] || 0) + 1;
  extractionBucketCounts[row.extractionBucket] = (extractionBucketCounts[row.extractionBucket] || 0) + 1;
}

const artifact = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  sourceExecutionPack: executionPackPath,
  draftStatus: "course_5_pdf_machine_visual_semantic_drafts_ready_blocked_on_ocr_or_real_visual_review",
  draftMode: "heuristic_pdf_page_orientation_not_ocr_not_human_review",
  pdfDraftRows: draftRows.length,
  sourcePdfRows: executionPack.pdfRows,
  sourcePdfPages: executionPack.totalPages,
  sourceSampleRows: executionPack.sampleRowCount,
  moduleRowCount: moduleRows.length,
  readyReviewerNotes: 0,
  acceptedForPdfVisualSemanticReviewRows: 0,
  acceptedForModuleDistillationRows: 0,
  acceptedForDeletionReadinessRows: 0,
  sourceFolderMayBeDeleted: false,
  priorityCounts,
  extractionBucketCounts,
  moduleRows,
  draftRows,
  commands: [
    "npm.cmd run build:local-course-5-pdf-machine-visual-semantic-drafts",
    "npm.cmd run check:local-course-5-pdf-machine-visual-semantic-drafts",
    "npm.cmd run verify",
  ],
  completionRule: "Course 5 PDF machine visual semantic drafts are complete when all 121 representative PDF page samples have heuristic candidate concepts, reviewer questions, risk flags, and explicit blocked status. They do not count as OCR, human review, module acceptance, deletion readiness, or learner-facing release.",
  boundary,
};

fs.writeFileSync(outputJson, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Course 5 PDF Machine Visual Semantic Drafts",
  "",
  `- Draft status: ${artifact.draftStatus}`,
  `- Draft mode: ${artifact.draftMode}`,
  `- PDF draft rows: ${artifact.pdfDraftRows}`,
  `- Source PDF rows: ${artifact.sourcePdfRows}`,
  `- Source PDF pages: ${artifact.sourcePdfPages}`,
  `- Module rows: ${artifact.moduleRowCount}`,
  `- Ready reviewer notes: ${artifact.readyReviewerNotes}`,
  `- Accepted for PDF visual semantic review: ${artifact.acceptedForPdfVisualSemanticReviewRows}`,
  `- Accepted for deletion readiness: ${artifact.acceptedForDeletionReadinessRows}`,
  `- Source folder may be deleted: ${artifact.sourceFolderMayBeDeleted}`,
  "",
  "## Module Coverage",
  "",
  "| Module | Draft rows | PDF sources | Dominant concepts |",
  "|---|---:|---:|---|",
  ...moduleRows.map((row) => `| ${row.moduleId} | ${row.draftRows} | ${row.sourcePdfRows} | ${row.dominantCandidateConcepts.map((item) => `${item.concept}:${item.count}`).join(", ")} |`),
  "",
  "## First Drafts",
  "",
  ...draftRows.slice(0, 12).map((row) => `- ${row.draftId}: ${row.candidateSummary}`),
  "",
  "## Boundary",
  "",
  boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  draftStatus: artifact.draftStatus,
  pdfDraftRows: artifact.pdfDraftRows,
  sourcePdfRows: artifact.sourcePdfRows,
  sourcePdfPages: artifact.sourcePdfPages,
  moduleRowCount: artifact.moduleRowCount,
  readyReviewerNotes: artifact.readyReviewerNotes,
  acceptedForPdfVisualSemanticReviewRows: artifact.acceptedForPdfVisualSemanticReviewRows,
  acceptedForDeletionReadinessRows: artifact.acceptedForDeletionReadinessRows,
  sourceFolderMayBeDeleted: artifact.sourceFolderMayBeDeleted,
}, null, 2));
