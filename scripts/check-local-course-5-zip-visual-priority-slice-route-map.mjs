import fs from "node:fs";

const routeMapPath = "docs/LOCAL_COURSE_5_ZIP_VISUAL_PRIORITY_SLICE_ROUTE_MAP.json";
const routeMapMdPath = "docs/LOCAL_COURSE_5_ZIP_VISUAL_PRIORITY_SLICE_ROUTE_MAP.md";
const routeMapHtmlPath = "docs/local-course-5-zip-visual-priority-slice-route-map.html";
const validationPath = "docs/LOCAL_COURSE_5_ZIP_VISUAL_PRIORITY_SLICE_INPUT_VALIDATION.json";
const slicePath = "docs/LOCAL_COURSE_5_ZIP_VISUAL_PRIORITY_SLICE.json";

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
const slice = readJson(slicePath);
if (!fs.existsSync(routeMapMdPath)) fail(`missing ${routeMapMdPath}`);
if (!fs.existsSync(routeMapHtmlPath)) fail(`missing ${routeMapHtmlPath}`);
const html = fs.readFileSync(routeMapHtmlPath, "utf8");

assertBoundary("routeMap", routeMap);
assertBoundary("validation", validation);
assertBoundary("slice", slice);

if (routeMap.routeMapStatus !== "course_5_zip_visual_priority_slice_route_map_ready_all_rows_blocked") fail(`unexpected routeMapStatus: ${routeMap.routeMapStatus}`);
if (routeMap.routeMode !== "post_input_route_map_for_all_locally_resolvable_zip_visual_slice") fail("unexpected route mode");
if (routeMap.routeRows !== 85 || routeMap.readyRows !== 0 || routeMap.blockedRows !== 85) fail("route row counts drift");
if (routeMap.semanticMergePreviewReadyRows !== 0) fail("no semantic merge preview rows should be ready yet");
if (routeMap.moduleMergeAllowedNow !== false) fail("module merge must stay closed");
if (routeMap.deletionEvidenceAllowedNow !== false) fail("deletion evidence must stay closed");
if (routeMap.acceptedForModuleDistillationRows !== 0 || routeMap.acceptedForDeletionReadinessRows !== 0) fail("route map must not accept rows");
if (routeMap.learnerReadyModules !== 0) fail("no learner-ready modules from route map");
if (routeMap.sourceFolderMayBeDeleted !== false || routeMap.currentKnowledgeArtifactsCanReplaceSourceFolder !== false) fail("source deletion boundary drift");
if (routeMap.teachingModules !== 13 || routeMap.modulesBlockedByVisualOrOcr !== 11) fail("teaching module gate counts drift");
if (routeMap.deletionReadinessStatus !== "course_5_source_folder_not_deletable_absorption_incomplete") fail("deletion readiness status drift");
if (!Array.isArray(routeMap.routeRowsDetail) || routeMap.routeRowsDetail.length !== 85) fail("routeRowsDetail must cover 85 rows");

const validationIds = new Set(validation.validationRows.map((row) => row.reviewRowId));
const sampleIds = new Set(slice.sampleRows.map((row) => row.reviewRowId));
for (const row of routeMap.routeRowsDetail) {
  if (!validationIds.has(row.reviewRowId)) fail(`route row missing validation row: ${row.reviewRowId}`);
  if (!sampleIds.has(row.reviewRowId)) fail(`route row missing slice sample row: ${row.reviewRowId}`);
  if (!row.zipSampleId) fail(`route row missing zipSampleId: ${row.reviewRowId}`);
  if (!row.archiveImageName) fail(`route row missing archiveImageName: ${row.reviewRowId}`);
  if (row.readyForZipVisualPrioritySemanticReviewGate !== false) fail(`route row should not be ready: ${row.reviewRowId}`);
  if (row.routeStatus !== "blocked_before_zip_semantic_merge_preview") fail(`route row should be blocked: ${row.reviewRowId}`);
  if (row.semanticMergePreviewAllowedNow !== false) fail(`semantic merge should be closed: ${row.reviewRowId}`);
  if (row.moduleDistillationAllowedNow !== false) fail(`module distillation should be closed: ${row.reviewRowId}`);
  if (row.deletionEvidenceAllowedNow !== false) fail(`deletion evidence should be closed: ${row.reviewRowId}`);
  if (row.sourceFolderMayBeDeleted !== false) fail(`source deletion drift: ${row.reviewRowId}`);
  assertBoundary(`route row ${row.reviewRowId}`, row);
}

for (const artifactPath of [
  routeMap.sourceSlice,
  routeMap.sourceValidation,
  routeMap.sourceTeachingDistillation,
  routeMap.sourceDeletionReadiness,
]) {
  if (!fs.existsSync(artifactPath)) fail(`missing linked artifact: ${artifactPath}`);
}

for (const needle of [
  "Course 5 ZIP Visual Priority Slice Route Map",
  "route rows",
  "ready rows",
  "blocked rows",
  "module merge allowed now",
  "deletion evidence allowed now",
  "source folder may be deleted",
]) {
  if (!html.includes(needle)) fail(`HTML missing: ${needle}`);
}

const boundaryText = `${routeMap.boundary || ""} ${routeMap.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education operations",
  "semantic merge preview",
  "teaching-module distillation",
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
  routeMapStatus: routeMap.routeMapStatus,
  routeRows: routeMap.routeRows,
  readyRows: routeMap.readyRows,
  blockedRows: routeMap.blockedRows,
  moduleMergeAllowedNow: routeMap.moduleMergeAllowedNow,
  deletionEvidenceAllowedNow: routeMap.deletionEvidenceAllowedNow,
  sourceFolderMayBeDeleted: routeMap.sourceFolderMayBeDeleted,
}, null, 2));
