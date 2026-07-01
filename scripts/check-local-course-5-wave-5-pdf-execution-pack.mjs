import fs from "node:fs";

const packPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_EXECUTION_PACK.json";
const packMdPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_EXECUTION_PACK.md";
const packHtmlPath = "docs/local-course-5-wave-5-pdf-execution-pack.html";
const priorityPlanPath = "docs/LOCAL_COURSE_5_BLOCKER_RESOLUTION_PRIORITY_PLAN.json";

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

const pack = readJson(packPath);
const priorityPlan = readJson(priorityPlanPath);
if (!fs.existsSync(packMdPath)) fail(`missing ${packMdPath}`);
if (!fs.existsSync(packHtmlPath)) fail(`missing ${packHtmlPath}`);
const html = fs.readFileSync(packHtmlPath, "utf8");

assertBoundary("pack", pack);
assertBoundary("priorityPlan", priorityPlan);

if (pack.executionPackStatus !== "course_5_wave_5_pdf_execution_pack_ready_blocked_on_ocr_reviewer_or_future_loss_decision") fail(`unexpected executionPackStatus: ${pack.executionPackStatus}`);
if (pack.waveId !== "wave_5_remaining_pdf_ocr_or_future_loss_decisions") fail("unexpected wave id");
if (pack.sourceRows !== 29 || pack.pdfSourceRows !== 29 || pack.zipSourceRows !== 0) fail("Wave 5 source counts drift");
if (pack.sampleRows !== 85 || pack.pdfSampleRows !== 85 || pack.zipSampleRows !== 0) fail("Wave 5 sample counts drift");
if (pack.sourceRowsWithSamples !== 29 || pack.sourceRowsMissingRepresentativeSamples !== 0) fail("Wave 5 representative sample coverage drift");
if (pack.prioritySliceSampleRows !== 18 || pack.supplementalSampleRows !== 67) fail("Wave 5 supplemental sample counts drift");
if (pack.localToolResolvableSourceRows !== 0 || pack.ocrBlockedSourceRows !== 29 || pack.futureLossDecisionSourceRows !== 29) fail("Wave 5 OCR/future-loss blocker counts drift");
if (pack.readyReviewerInputRows !== 0 || pack.blockedReviewerInputRows !== 85) fail("Wave 5 reviewer input should be fully blocked");
if (pack.acceptedForModuleDistillationRows !== 0 || pack.acceptedForDeletionReadinessRows !== 0) fail("Wave 5 pack must not accept rows");
if (pack.learnerReadyModules !== 0) fail("no learner-ready modules allowed");
if (pack.sourceFolderMayBeDeleted !== false || pack.currentKnowledgeArtifactsCanReplaceSourceFolder !== false) fail("source deletion boundary drift");
if (pack.deletionReadinessStatus !== "course_5_source_folder_not_deletable_absorption_incomplete") fail("deletion readiness status drift");

const expectedModules = [
  "bar_by_bar_reading",
  "chart_pattern_encyclopedia",
  "course_slides_alignment",
  "price_action_foundations",
  "terminology_glossary",
  "trade_management",
  "unclassified_supplement",
];
if (JSON.stringify(pack.affectedModules) !== JSON.stringify(expectedModules)) fail("Wave 5 affected modules drift");

if (!Array.isArray(pack.sourceRowsDetail) || pack.sourceRowsDetail.length !== 29) fail("sourceRowsDetail must cover 29 Wave 5 rows");
if (!Array.isArray(pack.sampleRowsDetail) || pack.sampleRowsDetail.length !== 85) fail("sampleRowsDetail must cover 85 Wave 5 samples");

const expectedWaveIds = new Set(priorityPlan.priorityRows.filter((row) => row.resolutionWave === pack.waveId).map((row) => row.recordId));
for (const row of pack.sourceRowsDetail) {
  if (!expectedWaveIds.has(row.recordId)) fail(`source row not in priority plan Wave 5: ${row.recordId}`);
  if (row.extension !== ".pdf") fail(`source row must be PDF: ${row.recordId}`);
  if (row.priorityBand !== "P2_followup_blocker") fail(`source row must be P2: ${row.recordId}`);
  if (row.canFullyResolveWithLocalToolsNow !== false) fail(`Wave 5 source should require OCR/reviewer input: ${row.recordId}`);
  if (row.requiredReviewerMode !== "pdf_ocr_visual_reviewer_or_documented_future_loss_decision") fail(`future-loss reviewer mode missing: ${row.recordId}`);
  if (row.acceptedForModuleDistillation !== false || row.acceptedForDeletionReadiness !== false) fail(`source row acceptance boundary drift: ${row.recordId}`);
  if (row.learnerModuleMergeAllowedNow !== false || row.deletionEvidenceAllowedNow !== false) fail(`source row merge/delete gate drift: ${row.recordId}`);
  if (row.sourceFolderMayBeDeleted !== false) fail(`source row deletion drift: ${row.recordId}`);
  assertBoundary(`source row ${row.recordId}`, row);
}

for (const row of pack.sampleRowsDetail) {
  if (!expectedWaveIds.has(row.recordId)) fail(`sample row not in Wave 5: ${row.reviewRowId}`);
  if (row.sourceType !== "pdf") fail(`sample row must be PDF: ${row.reviewRowId}`);
  if (row.priorityBand !== "P2_followup_blocker") fail(`sample row must be P2: ${row.reviewRowId}`);
  if (!row.sampleImagePath || row.sampleImageExists !== true) fail(`sample image missing: ${row.reviewRowId}`);
  if (!Array.isArray(row.requiredFields) || !row.requiredFields.includes("futureLossDecision")) fail(`future-loss field missing: ${row.reviewRowId}`);
  if (row.readyNow !== false) fail(`sample row cannot be ready: ${row.reviewRowId}`);
  if (row.sourceFolderMayBeDeleted !== false) fail(`sample deletion boundary drift: ${row.reviewRowId}`);
  assertBoundary(`sample row ${row.reviewRowId}`, row);
}

for (const artifactPath of [
  pack.sourcePriorityPlan,
  pack.sourcePdfPrioritySlice,
  pack.sourceFollowupWorkPacks,
  pack.sourceDeletionReadiness,
]) {
  if (!fs.existsSync(artifactPath)) fail(`missing linked artifact: ${artifactPath}`);
}

for (const needle of [
  "Course 5 Wave 5 PDF Execution Pack",
  "source rows",
  "PDF source rows",
  "sample rows",
  "missing representative samples",
  "source folder may be deleted",
]) {
  if (!html.includes(needle)) fail(`HTML missing: ${needle}`);
}

const boundaryText = `${pack.boundary || ""} ${pack.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education operations",
  "29 remaining pdf ocr or future-loss decision blockers",
  "representative page samples",
  "future-loss decisions",
  "reviewer-owned visual/text input",
  "semantic merge preview",
  "public grounding",
  "deletion-readiness",
  "does not perform ocr",
  "generate reviewer conclusions",
  "accept machine drafts as human review",
  "merge content into learner-facing modules",
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
  executionPackStatus: pack.executionPackStatus,
  sourceRows: pack.sourceRows,
  pdfSourceRows: pack.pdfSourceRows,
  sampleRows: pack.sampleRows,
  sourceRowsMissingRepresentativeSamples: pack.sourceRowsMissingRepresentativeSamples,
  blockedReviewerInputRows: pack.blockedReviewerInputRows,
  sourceFolderMayBeDeleted: pack.sourceFolderMayBeDeleted,
}, null, 2));
