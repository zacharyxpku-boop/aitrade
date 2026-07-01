import fs from "node:fs";

const auditPath = "docs/LOCAL_COURSE_5_WAVE_CLOSURE_AUDIT.json";
const auditMdPath = "docs/LOCAL_COURSE_5_WAVE_CLOSURE_AUDIT.md";
const auditHtmlPath = "docs/local-course-5-wave-closure-audit.html";

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
  if (artifact.sourceFolderMayBeDeleted !== false) fail(`${name} must keep sourceFolderMayBeDeleted:false`);
}

const audit = readJson(auditPath);
if (!fs.existsSync(auditMdPath)) fail(`missing ${auditMdPath}`);
if (!fs.existsSync(auditHtmlPath)) fail(`missing ${auditHtmlPath}`);
const html = fs.readFileSync(auditHtmlPath, "utf8");

assertBoundary("closure audit", audit);

if (audit.auditStatus !== "course_5_wave_closure_audit_all_followup_rows_covered_but_blocked_on_real_input") fail(`unexpected auditStatus: ${audit.auditStatus}`);
if (audit.auditMode !== "course_5_wave_1_to_5_global_coverage_and_deletion_gate") fail("unexpected audit mode");
if (audit.currentKnowledgeArtifactsCanReplaceSourceFolder !== false) fail("knowledge artifacts must not replace source folder yet");
if (audit.deletionReadinessStatus !== "course_5_source_folder_not_deletable_absorption_incomplete") fail("deletion readiness drift");
if (audit.blockerFollowupRowsFromDeletionReadiness !== 49) fail("deletion readiness blocker follow-up count drift");
if (audit.totalSampleImagesFromDeletionReadiness !== 206) fail("deletion readiness sample image count drift");
if (audit.learnerReadyModulesFromDeletionReadiness !== 0) fail("learner-ready module drift");

const expectedTotals = {
  followupRows: 49,
  sampleRows: 206,
  pdfSourceRows: 41,
  zipSourceRows: 8,
  pdfSampleRows: 121,
  zipSampleRows: 85,
};

for (const [key, value] of Object.entries(expectedTotals)) {
  if (audit.expectedTotals?.[key] !== value) fail(`expectedTotals.${key} drift`);
}

const totals = audit.totals || {};
for (const [key, value] of Object.entries({
  expectedSourceRows: 49,
  executionSourceRows: 49,
  expectedSampleRows: 206,
  executionSampleRows: 206,
  validationInputRows: 206,
  validationRows: 206,
  routeRows: 206,
  routeRowsDetail: 206,
  pdfSourceRows: 41,
  zipSourceRows: 8,
  pdfSampleRows: 121,
  zipSampleRows: 85,
  validationReadyRows: 0,
  validationBlockedRows: 206,
  routeReadyRows: 0,
  routeBlockedRows: 206,
  acceptedForModuleDistillationRows: 0,
  acceptedForDeletionReadinessRows: 0,
  learnerReadyModules: 0,
})) {
  if (totals[key] !== value) fail(`totals.${key} expected ${value}, got ${totals[key]}`);
}

if (audit.uniqueSourceRowsCovered !== 49) fail("unique source coverage must be 49");
if (audit.uniqueSampleRowsCovered !== 206) fail("unique sample coverage must be 206");

const gates = audit.closureGates || {};
if (gates.allFollowupRowsCoveredByWaves !== true) fail("all follow-up rows should be covered by waves");
if (gates.allRepresentativeSamplesCoveredByWaves !== true) fail("all representative samples should be covered by waves");
if (gates.executionValidationAndRouteCountsAligned !== true) fail("execution, validation, and route counts must align");
if (gates.realReviewerInputAccepted !== false) fail("real reviewer input must not be marked accepted");
if (gates.moduleDistillationAllowedNow !== false || gates.deletionEvidenceAllowedNow !== false) fail("module/deletion gates must stay closed");
if (gates.sourceFolderMayBeDeleted !== false || gates.learnerFacingRelease !== false) fail("source deletion/release gates must stay closed");

if (!Array.isArray(audit.waveSummaries) || audit.waveSummaries.length !== 5) fail("waveSummaries must cover 5 waves");
const expectedWaveRows = [3, 2, 6, 9, 29];
const expectedWaveSamples = [18, 15, 61, 27, 85];
for (const [index, wave] of audit.waveSummaries.entries()) {
  if (wave.executionSourceRows !== expectedWaveRows[index]) fail(`wave ${index + 1} source row drift`);
  if (wave.executionSampleRows !== expectedWaveSamples[index]) fail(`wave ${index + 1} sample row drift`);
  if (wave.validationRows !== expectedWaveSamples[index]) fail(`wave ${index + 1} validation row drift`);
  if (wave.routeRows !== expectedWaveSamples[index]) fail(`wave ${index + 1} route row drift`);
  if (wave.validationReadyRows !== 0 || wave.routeReadyRows !== 0) fail(`wave ${index + 1} must have zero ready rows`);
  if (wave.validationBlockedRows !== expectedWaveSamples[index] || wave.routeBlockedRows !== expectedWaveSamples[index]) fail(`wave ${index + 1} blocked rows drift`);
  if (wave.acceptedForModuleDistillationRows !== 0 || wave.acceptedForDeletionReadinessRows !== 0) fail(`wave ${index + 1} must not accept rows`);
  if (wave.learnerReadyModules !== 0) fail(`wave ${index + 1} learner-ready module drift`);
  if (wave.sourceFolderMayBeDeleted !== false || wave.currentKnowledgeArtifactsCanReplaceSourceFolder !== false) fail(`wave ${index + 1} deletion boundary drift`);
  for (const artifactPath of [wave.executionPath, wave.validationPath, wave.routePath]) {
    if (!fs.existsSync(artifactPath)) fail(`missing linked wave artifact: ${artifactPath}`);
  }
}

for (const artifactPath of [audit.sourceDeletionReadiness, audit.sourcePriorityPlan]) {
  if (!fs.existsSync(artifactPath)) fail(`missing linked audit artifact: ${artifactPath}`);
}

for (const needle of [
  "Course 5 Wave Closure Audit",
  "follow-up source rows covered",
  "sample rows covered",
  "validation input rows",
  "route rows",
  "ready rows",
  "source folder may be deleted",
]) {
  if (!html.includes(needle)) fail(`HTML missing: ${needle}`);
}

const boundaryText = `${audit.boundary || ""} ${audit.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education operations",
  "wave 1 through wave 5",
  "every current course 5 follow-up source row",
  "representative sample row",
  "execution-pack",
  "reviewer-input validation",
  "post-input route-map",
  "real accepted reviewer evidence",
  "public grounding",
  "originality review",
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
  auditStatus: audit.auditStatus,
  followupRowsCovered: audit.uniqueSourceRowsCovered,
  sampleRowsCovered: audit.uniqueSampleRowsCovered,
  validationInputRows: totals.validationInputRows,
  routeRows: totals.routeRows,
  readyRows: totals.validationReadyRows,
  blockedRows: totals.validationBlockedRows,
  sourceFolderMayBeDeleted: audit.sourceFolderMayBeDeleted,
}, null, 2));
