import fs from "node:fs";

const auditPath = "docs/LOCAL_COURSE_5_WAVE_3_ZIP_AI_VISUAL_REVIEW_COVERAGE_AUDIT.json";
const auditMdPath = "docs/LOCAL_COURSE_5_WAVE_3_ZIP_AI_VISUAL_REVIEW_COVERAGE_AUDIT.md";

function fail(message) {
  throw new Error(message);
}

function readJson(path) {
  if (!fs.existsSync(path)) fail(`missing ${path}`);
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function assertBoundary(name, artifact) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${name} must keep approvalStatus:not_approved`);
  if (artifact.writeAllowedNow !== false) fail(`${name} must keep writeAllowedNow:false`);
}

const audit = readJson(auditPath);
assertBoundary("coverage audit", audit);
if (!fs.existsSync(auditMdPath)) fail(`missing ${auditMdPath}`);
if (audit.auditStatus !== "course_5_wave_3_zip_ai_visual_review_all_samples_covered_release_and_deletion_blocked") fail("unexpected audit status");
if (audit.batchCount !== 5) fail(`expected 5 batches, got ${audit.batchCount}`);
if (audit.templateRows !== 61) fail(`expected 61 template rows, got ${audit.templateRows}`);
if (audit.coveredRows !== 61) fail(`expected 61 covered rows, got ${audit.coveredRows}`);
if (audit.missingRows !== 0) fail(`expected 0 missing rows, got ${audit.missingRows}`);
if (audit.duplicateCoverageRows !== 0) fail(`expected 0 duplicate coverage rows, got ${audit.duplicateCoverageRows}`);
if (audit.readyForHumanConfirmationRows !== 61) fail(`expected 61 ready rows, got ${audit.readyForHumanConfirmationRows}`);
if (audit.moduleMergeAllowedNow !== false) fail("module merge must remain blocked");
if (audit.acceptedForModuleDistillationRows !== 0) fail("module distillation acceptances must remain 0");
if (audit.acceptedForDeletionReadinessRows !== 0) fail("deletion-readiness acceptances must remain 0");
if (audit.learnerReadyModules !== 0) fail("learner-ready modules must remain 0");
if (audit.sourceFolderMayBeDeleted !== false) fail("source folder deletion must remain blocked");
if (!Array.isArray(audit.coverageRows) || audit.coverageRows.length !== 61) fail("coverage rows must contain 61 rows");
for (const row of audit.coverageRows) {
  if (row.coverageCount !== 1) fail(`${row.reviewRowId} should be covered exactly once`);
  if (row.coveredExactlyOnce !== true) fail(`${row.reviewRowId} should be marked covered exactly once`);
  if (!fs.existsSync(row.sampleImagePath)) fail(`${row.reviewRowId} sample image missing`);
}

console.log(JSON.stringify({
  ok: true,
  auditStatus: audit.auditStatus,
  batchCount: audit.batchCount,
  templateRows: audit.templateRows,
  coveredRows: audit.coveredRows,
  missingRows: audit.missingRows,
  duplicateCoverageRows: audit.duplicateCoverageRows,
  sourceFolderMayBeDeleted: audit.sourceFolderMayBeDeleted,
}, null, 2));
