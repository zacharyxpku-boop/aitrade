import fs from "node:fs";

const planPath = "docs/LOCAL_COURSE_5_BLOCKER_RESOLUTION_PRIORITY_PLAN.json";
const planMdPath = "docs/LOCAL_COURSE_5_BLOCKER_RESOLUTION_PRIORITY_PLAN.md";
const planHtmlPath = "docs/local-course-5-blocker-resolution-priority-plan.html";
const matrixPath = "docs/LOCAL_COURSE_5_SOURCE_TO_MODULE_COVERAGE_MATRIX.json";
const routerPath = "docs/LOCAL_COURSE_5_OCR_VISUAL_EXECUTION_ROUTER.json";

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

const plan = readJson(planPath);
const matrix = readJson(matrixPath);
const router = readJson(routerPath);
if (!fs.existsSync(planMdPath)) fail(`missing ${planMdPath}`);
if (!fs.existsSync(planHtmlPath)) fail(`missing ${planHtmlPath}`);
const html = fs.readFileSync(planHtmlPath, "utf8");

assertBoundary("plan", plan);
assertBoundary("matrix", matrix);
assertBoundary("router", router);

if (plan.planStatus !== "course_5_blocker_resolution_priority_plan_ready_release_and_deletion_blocked") fail(`unexpected planStatus: ${plan.planStatus}`);
if (plan.followupRows !== 49 || plan.pdfFollowupRows !== 41 || plan.zipFollowupRows !== 8) fail("follow-up row counts drift");
if (plan.p0Rows !== 3 || plan.p1Rows !== 2 || plan.p2Rows !== 44) fail("priority band counts drift");
if (plan.localToolResolvableRows !== 8) fail("local-tool ZIP resolvable row count drift");
if (plan.ocrUnavailableBlockingRows !== 41) fail("OCR blocking row count drift");
if (plan.modulesWithFollowupBlockers !== 11) fail("module blocker count drift");
if (plan.acceptedForModuleDistillationRows !== 0 || plan.acceptedForDeletionReadinessRows !== 0) fail("plan must not accept rows");
if (plan.learnerReadyModules !== 0) fail("no learner-ready modules allowed");
if (plan.sourceFolderMayBeDeleted !== false || plan.currentKnowledgeArtifactsCanReplaceSourceFolder !== false) fail("source deletion boundary drift");
if (plan.deletionReadinessStatus !== "course_5_source_folder_not_deletable_absorption_incomplete") fail("deletion readiness status drift");

if (!Array.isArray(plan.priorityRows) || plan.priorityRows.length !== 49) fail("priorityRows must cover 49 unresolved rows");
if (!Array.isArray(plan.resolutionWaves) || plan.resolutionWaves.length !== 5) fail("resolution waves must cover 5 waves");

const seenOrders = new Set();
const seenRecords = new Set();
let previousOrder = 0;
for (const row of plan.priorityRows) {
  if (row.resolutionOrder <= previousOrder) fail("resolution order must be ascending");
  previousOrder = row.resolutionOrder;
  if (seenOrders.has(row.resolutionOrder)) fail(`duplicate resolution order: ${row.resolutionOrder}`);
  seenOrders.add(row.resolutionOrder);
  if (seenRecords.has(row.recordId)) fail(`duplicate priority record: ${row.recordId}`);
  seenRecords.add(row.recordId);
  if (row.absorptionClass !== "followup_required_visual_or_ocr_blocked") fail(`priority row must be unresolved: ${row.recordId}`);
  if (row.extension !== ".pdf" && row.extension !== ".zip") fail(`priority row must be PDF or ZIP: ${row.recordId}`);
  if (!row.priorityBand || !row.resolutionWave || !row.nextGate) fail(`priority row missing route metadata: ${row.recordId}`);
  if (row.acceptedForModuleDistillation !== false || row.acceptedForDeletionReadiness !== false) fail(`priority row acceptance boundary drift: ${row.recordId}`);
  if (row.learnerModuleMergeAllowedNow !== false || row.deletionEvidenceAllowedNow !== false) fail(`merge/deletion gate drift: ${row.recordId}`);
  if (row.sourceFolderMayBeDeleted !== false) fail(`source folder deletion drift: ${row.recordId}`);
  assertBoundary(`priority row ${row.recordId}`, row);
}

const waveRowTotal = plan.resolutionWaves.reduce((sum, row) => sum + row.rowCount, 0);
const wavePdfTotal = plan.resolutionWaves.reduce((sum, row) => sum + row.pdfRows, 0);
const waveZipTotal = plan.resolutionWaves.reduce((sum, row) => sum + row.zipRows, 0);
if (waveRowTotal !== 49 || wavePdfTotal !== 41 || waveZipTotal !== 8) fail("wave totals must match follow-up totals");
if (plan.resolutionWaves[0].waveId !== "wave_1_p0_space_and_curriculum_blockers" || plan.resolutionWaves[0].rowCount !== 3) fail("wave 1 must isolate 3 P0 blockers");
if (plan.resolutionWaves[1].waveId !== "wave_2_p1_high_value_blockers" || plan.resolutionWaves[1].rowCount !== 2) fail("wave 2 must isolate 2 P1 blockers");
for (const wave of plan.resolutionWaves) {
  assertBoundary(`wave ${wave.waveId}`, wave);
  if (wave.sourceFolderMayBeDeleted !== false) fail(`wave deletion boundary drift: ${wave.waveId}`);
}

for (const artifactPath of [
  plan.sourceCoverageMatrix,
  plan.sourceRouter,
  plan.sourceWorkPacks,
  plan.sourceDeletionReadiness,
]) {
  if (!fs.existsSync(artifactPath)) fail(`missing linked artifact: ${artifactPath}`);
}

for (const needle of [
  "Course 5 Blocker Resolution Priority Plan",
  "follow-up rows",
  "PDF rows",
  "ZIP rows",
  "local-tool resolvable rows",
  "OCR unavailable rows",
  "source folder may be deleted",
]) {
  if (!html.includes(needle)) fail(`HTML missing: ${needle}`);
}

const boundaryText = `${plan.boundary || ""} ${plan.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education operations",
  "unresolved visual",
  "ocr",
  "zip source blockers",
  "module impact",
  "local resolvability",
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
  planStatus: plan.planStatus,
  followupRows: plan.followupRows,
  pdfFollowupRows: plan.pdfFollowupRows,
  zipFollowupRows: plan.zipFollowupRows,
  p0Rows: plan.p0Rows,
  p1Rows: plan.p1Rows,
  p2Rows: plan.p2Rows,
  localToolResolvableRows: plan.localToolResolvableRows,
  sourceFolderMayBeDeleted: plan.sourceFolderMayBeDeleted,
}, null, 2));
