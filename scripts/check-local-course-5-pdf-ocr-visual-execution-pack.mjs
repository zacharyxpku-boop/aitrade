import fs from "node:fs";

const packPath = "docs/LOCAL_COURSE_5_PDF_OCR_VISUAL_EXECUTION_PACK.json";
const packMdPath = "docs/LOCAL_COURSE_5_PDF_OCR_VISUAL_EXECUTION_PACK.md";
const packHtmlPath = "docs/local-course-5-pdf-ocr-visual-execution-pack.html";
const inputPath = "docs/reviewer-inputs/LOCAL_COURSE_5_PDF_OCR_VISUAL_REVIEW_INPUT_TEMPLATE.json";
const inputMdPath = "docs/reviewer-inputs/LOCAL_COURSE_5_PDF_OCR_VISUAL_REVIEW_INPUT_TEMPLATE.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const pack = readJson(packPath);
const input = readJson(inputPath);
for (const file of [packMdPath, packHtmlPath, inputMdPath]) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
}
const html = fs.readFileSync(packHtmlPath, "utf8");

for (const [name, artifact] of Object.entries({ pack, input })) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${name} must keep approvalStatus:not_approved`);
  if (artifact.writeAllowedNow !== false) fail(`${name} must keep writeAllowedNow:false`);
}

if (pack.executionStatus !== "course_5_pdf_ocr_visual_execution_pack_ready_blocked_on_ocr_or_real_visual_review") fail(`unexpected executionStatus: ${pack.executionStatus}`);
if (input.inputTemplateStatus !== "course_5_pdf_ocr_visual_review_input_template_ready_blocked_missing_input") fail(`unexpected input status: ${input.inputTemplateStatus}`);
if (pack.sourceFolderMayBeDeleted !== false || pack.currentKnowledgeArtifactsCanReplaceSourceFolder !== false) fail("source deletion boundary drift");
if (pack.pdfRows !== 41) fail("expected 41 PDF rows");
if (pack.totalPages !== 44398) fail("expected 44398 PDF follow-up pages");
if (pack.sampleRowCount !== 121 || pack.inputRowCount !== 121) fail("expected 121 sample/input rows");
if (pack.readyInputRows !== 0 || pack.blockedInputRows !== 121) fail("PDF input rows must remain blocked");
if (pack.largePdfRows !== 3 || pack.scannedOrLowTextPdfRows !== 38) fail("PDF blocker category counts drift");
if (pack.localOcrAvailable !== false) fail("local OCR availability drift");
if (pack.canAdvanceWithVisualReviewNowRows !== 41) fail("all PDF rows should be visually actionable now");
if (pack.canFullyResolveWithLocalToolsNowRows !== 0) fail("PDF rows should not be fully resolvable without OCR");
if (!Array.isArray(pack.sourceRows) || pack.sourceRows.length !== 41) fail("sourceRows must cover 41 PDFs");
if (!Array.isArray(pack.sampleRows) || pack.sampleRows.length !== 121) fail("sampleRows must cover 121 PDF samples");
if (!Array.isArray(input.rows) || input.rows.length !== 121) fail("input rows must cover 121 PDF samples");

const ids = new Set();
for (const row of pack.sampleRows) {
  if (!row.reviewRowId || ids.has(row.reviewRowId)) fail(`duplicate reviewRowId: ${row.reviewRowId}`);
  ids.add(row.reviewRowId);
  if (!fs.existsSync(row.sampleImagePath)) fail(`missing sample image: ${row.sampleImagePath}`);
  if (!html.includes(row.sampleImageHref)) fail(`HTML missing sample image href: ${row.sampleImageHref}`);
  if (row.reviewStatus !== "blocked_missing_real_ocr_or_visual_reviewer_input") fail(`sample row should remain blocked: ${row.reviewRowId}`);
}

for (const row of input.rows) {
  if (row.acceptForPdfVisualSemanticReview !== false || row.acceptForDeletionReadiness !== false) fail(`input row must not be pre-accepted: ${row.reviewRowId}`);
  if (row.reviewStatus !== "blocked_missing_real_ocr_or_visual_reviewer_input") fail(`input row should remain blocked: ${row.reviewRowId}`);
}

const boundaryText = `${pack.boundary || ""} ${pack.completionRule || ""} ${input.boundary || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education operations",
  "ocr",
  "representative-page visual review",
  "does not perform ocr",
  "delete files",
  "approve folder deletion",
  "learner-facing release",
  "accept machine drafts as human review",
  "copy private source wording",
  "stock recommendations",
  "live signals",
  "return promises",
  "real-money guidance",
  "production readiness",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  executionStatus: pack.executionStatus,
  pdfRows: pack.pdfRows,
  totalPages: pack.totalPages,
  sampleRows: pack.sampleRows.length,
  readyInputRows: pack.readyInputRows,
  blockedInputRows: pack.blockedInputRows,
  localOcrAvailable: pack.localOcrAvailable,
  sourceFolderMayBeDeleted: pack.sourceFolderMayBeDeleted,
}, null, 2));
