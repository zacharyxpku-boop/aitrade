import fs from "node:fs";

const routeMapPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_POST_INPUT_ROUTE_MAP.json";
const routeMapMdPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_POST_INPUT_ROUTE_MAP.md";
const routeMapHtmlPath = "docs/local-course-5-wave-5-pdf-post-input-route-map.html";
const validationPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_REVIEWER_INPUT_VALIDATION.json";
const packPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_EXECUTION_PACK.json";

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

const routeMap = readJson(routeMapPath);
const validation = readJson(validationPath);
const pack = readJson(packPath);
if (!fs.existsSync(routeMapMdPath)) fail(`missing ${routeMapMdPath}`);
if (!fs.existsSync(routeMapHtmlPath)) fail(`missing ${routeMapHtmlPath}`);
const html = fs.readFileSync(routeMapHtmlPath, "utf8");

assertBoundary("routeMap", routeMap);
assertBoundary("validation", validation);
assertBoundary("pack", pack);

if (routeMap.routeMapStatus !== "course_5_wave_5_pdf_post_input_route_map_ready_all_rows_blocked") fail(`unexpected routeMapStatus: ${routeMap.routeMapStatus}`);
if (routeMap.routeMode !== "post_input_route_map_for_wave_5_pdf_reviewer_or_future_loss_rows") fail("unexpected route mode");
if (routeMap.waveId !== "wave_5_remaining_pdf_ocr_or_future_loss_decisions") fail("unexpected wave id");
if (routeMap.routeRows !== 85 || routeMap.pdfRouteRows !== 85 || routeMap.zipRouteRows !== 0) fail("route counts drift");
if (routeMap.readyRows !== 0 || routeMap.blockedRows !== 85 || routeMap.semanticMergePreviewReadyRows !== 0 || routeMap.futureLossAccountingReadyRows !== 0) fail("blank Wave 5 PDF route rows should be blocked");
if (routeMap.moduleMergeAllowedNow !== false || routeMap.deletionEvidenceAllowedNow !== false) fail("merge/deletion gates must stay closed");
if (routeMap.acceptedForWave5PdfSemanticReviewRows !== 0 || routeMap.acceptedForModuleDistillationRows !== 0 || routeMap.acceptedForDeletionReadinessRows !== 0) fail("route map must not accept rows");
if (routeMap.learnerReadyModules !== 0) fail("no learner-ready modules allowed");
if (routeMap.sourceFolderMayBeDeleted !== false || routeMap.currentKnowledgeArtifactsCanReplaceSourceFolder !== false) fail("source deletion boundary drift");
if (routeMap.deletionReadinessStatus !== "course_5_source_folder_not_deletable_absorption_incomplete") fail("deletion readiness status drift");

if (!Array.isArray(routeMap.routeRowsDetail) || routeMap.routeRowsDetail.length !== 85) fail("routeRowsDetail must cover 85 rows");
const validationIds = new Set(validation.validationRows.map((row) => row.reviewRowId));
const sampleIds = new Set(pack.sampleRowsDetail.map((row) => row.reviewRowId));
for (const row of routeMap.routeRowsDetail) {
  if (!validationIds.has(row.reviewRowId)) fail(`route row missing validation row: ${row.reviewRowId}`);
  if (!sampleIds.has(row.reviewRowId)) fail(`route row missing pack sample row: ${row.reviewRowId}`);
  if (row.sourceType !== "pdf") fail(`route row must be PDF: ${row.reviewRowId}`);
  if (row.readyForWave5PdfSemanticOrFutureLossGate !== false) fail(`route row should not be ready: ${row.reviewRowId}`);
  if (row.routeStatus !== "blocked_before_wave_5_pdf_semantic_or_future_loss_route") fail(`route row should be blocked: ${row.reviewRowId}`);
  if (row.semanticMergePreviewAllowedNow !== false) fail(`semantic merge should be closed: ${row.reviewRowId}`);
  if (row.futureLossAccountingAllowedNow !== false) fail(`future-loss accounting should be closed: ${row.reviewRowId}`);
  if (row.moduleDistillationAllowedNow !== false) fail(`module distillation should be closed: ${row.reviewRowId}`);
  if (row.deletionEvidenceAllowedNow !== false) fail(`deletion evidence should be closed: ${row.reviewRowId}`);
  if (row.downstreamRouteMap !== routeMap.sourcePdfRouteMap) fail(`PDF downstream route drift: ${row.reviewRowId}`);
  if (row.sourceFolderMayBeDeleted !== false) fail(`source deletion drift: ${row.reviewRowId}`);
  assertBoundary(`route row ${row.reviewRowId}`, row);
}

for (const artifactPath of [
  routeMap.sourceValidation,
  routeMap.sourceExecutionPack,
  routeMap.sourcePdfRouteMap,
  routeMap.sourceDeletionReadiness,
]) {
  if (!fs.existsSync(artifactPath)) fail(`missing linked artifact: ${artifactPath}`);
}

for (const needle of [
  "Course 5 Wave 5 PDF Post-Input Route Map",
  "route rows",
  "PDF route rows",
  "future-loss ready rows",
  "ready rows",
  "blocked rows",
  "source folder may be deleted",
]) {
  if (!html.includes(needle)) fail(`HTML missing: ${needle}`);
}

const boundaryText = `${routeMap.boundary || ""} ${routeMap.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education operations",
  "validation-ready wave 5 pdf reviewer or future-loss decision rows",
  "pdf semantic merge preview",
  "public grounding",
  "teaching-module distillation",
  "future-loss accounting",
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
  routeMapStatus: routeMap.routeMapStatus,
  routeRows: routeMap.routeRows,
  pdfRouteRows: routeMap.pdfRouteRows,
  zipRouteRows: routeMap.zipRouteRows,
  readyRows: routeMap.readyRows,
  blockedRows: routeMap.blockedRows,
  futureLossAccountingReadyRows: routeMap.futureLossAccountingReadyRows,
  sourceFolderMayBeDeleted: routeMap.sourceFolderMayBeDeleted,
}, null, 2));
