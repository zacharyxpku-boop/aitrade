import fs from "node:fs";

const slicePath = "docs/LOCAL_COURSE_5_PDF_OCR_PRIORITY_SLICE.json";
const sliceMdPath = "docs/LOCAL_COURSE_5_PDF_OCR_PRIORITY_SLICE.md";
const sliceHtmlPath = "docs/local-course-5-pdf-ocr-priority-slice.html";
const inputJsonPath = "docs/reviewer-inputs/LOCAL_COURSE_5_PDF_OCR_PRIORITY_SLICE_INPUT_TEMPLATE.json";
const inputMdPath = "docs/reviewer-inputs/LOCAL_COURSE_5_PDF_OCR_PRIORITY_SLICE_INPUT_TEMPLATE.md";

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

const slice = readJson(slicePath);
const input = readJson(inputJsonPath);
if (!fs.existsSync(sliceMdPath)) fail(`missing ${sliceMdPath}`);
if (!fs.existsSync(sliceHtmlPath)) fail(`missing ${sliceHtmlPath}`);
if (!fs.existsSync(inputMdPath)) fail(`missing ${inputMdPath}`);
const html = fs.readFileSync(sliceHtmlPath, "utf8");

assertBoundary("slice", slice);
assertBoundary("input", input);

if (slice.sliceStatus !== "course_5_pdf_ocr_priority_slice_ready_blocked_on_ocr_or_real_reviewer_input") fail(`unexpected sliceStatus: ${slice.sliceStatus}`);
if (slice.sliceMode !== "first_controlled_pdf_ocr_reviewer_batch") fail("unexpected slice mode");
if (slice.totalPdfFollowupRows !== 41 || slice.totalPdfSampleRows !== 121) fail("total PDF follow-up/sample counts drift");
if (slice.selectedSourceRows !== 12) fail("expected 12 selected source PDF rows");
if (slice.selectedSampleRows !== 36) fail("expected 36 selected representative page rows");
if (slice.selectedInputRows !== 36) fail("expected 36 selected input rows");
if (slice.selectedP0SourceRows !== 2 || slice.selectedP1SourceRows !== 1 || slice.selectedP2SourceRows !== 9) fail("priority source split drift");
if (slice.selectedPagesCoveredBySources < 25000) fail("selected slice should cover the largest PDF blockers");
if (slice.selectedSizeMb < 9000) fail("selected slice should cover high-space blockers");
if (slice.readyInputRows !== 0 || slice.blockedInputRows !== 36) fail("priority slice inputs should start fully blocked");
if (slice.acceptedForModuleDistillationRows !== 0 || slice.acceptedForDeletionReadinessRows !== 0) fail("priority slice must not accept rows");
if (slice.learnerReadyModules !== 0) fail("no learner-ready modules from priority slice");
if (slice.sourceFolderMayBeDeleted !== false || slice.currentKnowledgeArtifactsCanReplaceSourceFolder !== false) fail("source deletion boundary drift");
if (!Array.isArray(slice.sourceRows) || slice.sourceRows.length !== 12) fail("sourceRows length drift");
if (!Array.isArray(slice.sampleRows) || slice.sampleRows.length !== 36) fail("sampleRows length drift");

const sourceIds = new Set(slice.sourceRows.map((row) => row.recordId));
if (sourceIds.size !== 12) fail("source rows should be unique by recordId");
const sampleIds = new Set(slice.sampleRows.map((row) => row.reviewRowId));
if (sampleIds.size !== 36) fail("sample rows should be unique by reviewRowId");

for (const source of slice.sourceRows) {
  if (!source.recordId || !source.relativePath || !source.sourceLocalPath) fail(`invalid source row: ${JSON.stringify(source)}`);
  if (source.sourceFolderMayBeDeleted !== false) fail(`source deletion drift: ${source.recordId}`);
  if (source.sampleCount !== 3) fail(`each priority source should have 3 representative samples: ${source.recordId}`);
}

for (const sample of slice.sampleRows) {
  if (!sourceIds.has(sample.recordId)) fail(`sample references unselected source: ${sample.reviewRowId}`);
  if (!sample.sampleImageExists || !fs.existsSync(sample.sampleImagePath)) fail(`missing sample image: ${sample.sampleImagePath}`);
  if (!Array.isArray(sample.candidateConcepts) || sample.candidateConcepts.length === 0) fail(`sample missing candidate concepts: ${sample.reviewRowId}`);
  if (!Array.isArray(sample.reviewerQuestions) || sample.reviewerQuestions.length < 4) fail(`sample missing reviewer questions: ${sample.reviewRowId}`);
  if (sample.reviewStatus !== "blocked_missing_real_ocr_or_visual_reviewer_input") fail(`sample should be blocked: ${sample.reviewRowId}`);
  if (sample.acceptedForModuleDistillation !== false || sample.acceptedForDeletionReadiness !== false) fail(`sample acceptance drift: ${sample.reviewRowId}`);
  assertBoundary(`sample ${sample.reviewRowId}`, sample);
}

if (input.inputTemplateStatus !== "course_5_pdf_ocr_priority_slice_input_template_ready_blocked_missing_input") fail("unexpected input template status");
if (input.sourceSlice !== slicePath) fail("input sourceSlice mismatch");
if (input.inputRows !== 36 || input.readyRows !== 0 || input.blockedRows !== 36) fail("input template row counts drift");
if (!Array.isArray(input.rows) || input.rows.length !== 36) fail("input rows length drift");
for (const row of input.rows) {
  if (!sampleIds.has(row.reviewRowId)) fail(`input row missing sample reference: ${row.reviewRowId}`);
  for (const field of [
    "reviewerOwnedOcrTextExcerpt",
    "reviewerOwnedVisualObservation",
    "paraphrasedTeachingConcept",
    "modulePlacement",
    "evidenceLimitations",
    "reviewerNameOrInitials",
    "reviewedAt",
  ]) {
    if (row[field] !== "") fail(`blank input template field should be empty: ${row.reviewRowId}.${field}`);
  }
  if (row.publicGroundingNeeded !== true) fail(`public grounding should remain required: ${row.reviewRowId}`);
  if (row.acceptedForPdfVisualSemanticReview !== false || row.acceptedForModuleDistillation !== false || row.acceptedForDeletionReadiness !== false) fail(`input acceptance drift: ${row.reviewRowId}`);
  assertBoundary(`input ${row.reviewRowId}`, row);
}

for (const artifactPath of [
  slice.sourceExecutionPack,
  slice.sourceMachineDrafts,
  slice.sourceOcrPreflight,
  slice.sourceClosureCockpit,
  slice.inputTemplate.json,
  slice.inputTemplate.markdown,
]) {
  if (!fs.existsSync(artifactPath)) fail(`missing linked artifact: ${artifactPath}`);
}

for (const needle of [
  "Course 5 PDF OCR Priority Slice",
  "selected source rows",
  "selected sample rows",
  "P0/P1/P2 sources",
  "OCR text engine available",
  "blocked input rows",
  "source folder may be deleted",
]) {
  if (!html.includes(needle)) fail(`HTML missing: ${needle}`);
}

const boundaryText = `${slice.boundary || ""} ${slice.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education operations",
  "first controlled ocr/reviewer batch",
  "representative page samples",
  "machine orientation drafts",
  "reviewer-owned input fields",
  "does not perform ocr",
  "generate reviewer conclusions",
  "accept machine drafts as human review",
  "delete files",
  "source-folder deletion",
  "learner-facing release",
  "copy private source wording",
  "stock recommendations",
  "live signals",
  "return promises",
  "real-money guidance",
  "production readiness",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary/completion missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  sliceStatus: slice.sliceStatus,
  selectedSourceRows: slice.selectedSourceRows,
  selectedSampleRows: slice.selectedSampleRows,
  selectedP0SourceRows: slice.selectedP0SourceRows,
  selectedP1SourceRows: slice.selectedP1SourceRows,
  selectedP2SourceRows: slice.selectedP2SourceRows,
  blockedInputRows: slice.blockedInputRows,
  sourceFolderMayBeDeleted: slice.sourceFolderMayBeDeleted,
}, null, 2));
