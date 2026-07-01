import fs from "node:fs";

const workbenchPath = "docs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_001_WORKBENCH.json";
const htmlPath = "docs/local-course-5-module-distillation-review-batch-001-workbench.html";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const artifact = readJson(workbenchPath);
if (!fs.existsSync(htmlPath)) fail(`missing ${htmlPath}`);
const html = fs.readFileSync(htmlPath, "utf8");

if (artifact.educationOnly !== true) fail("workbench must keep educationOnly:true");
if (artifact.productionReady !== false) fail("workbench must keep productionReady:false");
if (artifact.learnerFacingRelease !== false) fail("workbench must keep learnerFacingRelease:false");
if (artifact.approvalStatus !== "not_approved") fail("workbench must keep approvalStatus:not_approved");
if (artifact.writeAllowedNow !== false) fail("workbench must keep writeAllowedNow:false");
if (artifact.workbenchStatus !== "course_5_module_distillation_review_batch_001_visual_workbench_ready_readonly_blocked") {
  fail(`unexpected workbenchStatus: ${artifact.workbenchStatus}`);
}
if (artifact.selectedRows !== 40 || artifact.blockedRows !== 40 || artifact.readyRows !== 0) fail("workbench row counts drift");
if (artifact.modulesCovered < 9) fail("workbench should cover all batch 001 primary modules");
if (artifact.p0Rows < 20) fail("workbench should preserve P0 priority");
if (artifact.missingImageRows !== 0) fail("workbench image coverage missing");
if (artifact.sourceFolderMayBeDeleted !== false) fail("source folder deletion must remain blocked");
if (artifact.learnerReadyModules !== 0) fail("no Course 5 module may be learner-ready");
if (!Array.isArray(artifact.rows) || artifact.rows.length !== 40) fail("workbench rows missing");

for (const row of artifact.rows) {
  if (!fs.existsSync(row.sampleImagePath)) fail(`missing sample image: ${row.sampleImagePath}`);
  if (!row.htmlImageSrc || !html.includes(row.htmlImageSrc)) fail(`HTML missing image src for ${row.batchRowId}`);
  if (!Array.isArray(row.lessonSeedTitles) || row.lessonSeedTitles.length === 0) fail(`missing lesson seeds for ${row.batchRowId}`);
  if (!Array.isArray(row.reviewerQuestions) || row.reviewerQuestions.length === 0) fail(`missing reviewer questions for ${row.batchRowId}`);
  if (row.validationStatus !== "blocked_missing_real_reviewer_input") fail(`row status drift: ${row.batchRowId}`);
  if (row.acceptedForModuleDistillation !== false || row.acceptedForDeletionReadiness !== false) fail(`row acceptance drift: ${row.batchRowId}`);
  if (row.productionReady !== false || row.learnerFacingRelease !== false || row.writeAllowedNow !== false || row.approvalStatus !== "not_approved") {
    fail(`row release boundary drift: ${row.batchRowId}`);
  }
}

for (const phrase of ["Course 5 Batch 001 Visual Workbench", "readonly", "Lesson Seeds", "Reviewer Questions", "Risk Flags"]) {
  if (!html.includes(phrase)) fail(`HTML missing phrase: ${phrase}`);
}

const boundaryText = `${artifact.boundary || ""} ${artifact.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "readonly private reviewer-facing education operations",
  "extracted sample images",
  "does not generate reviewer conclusions",
  "accept machine drafts as human review",
  "delete files",
  "learner-facing release",
  "copy private source wording",
  "stock recommendations",
  "live signals",
  "return promises",
  "real-money guidance",
  "production readiness",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

if (!Array.isArray(artifact.commands) || !artifact.commands.some((command) => /check:local-course-5-module-distillation-review-batch-001-workbench/.test(command))) {
  fail("commands must include workbench check");
}

console.log(JSON.stringify({
  ok: true,
  workbenchStatus: artifact.workbenchStatus,
  selectedRows: artifact.selectedRows,
  modulesCovered: artifact.modulesCovered,
  p0Rows: artifact.p0Rows,
  nonP0Rows: artifact.nonP0Rows,
  missingImageRows: artifact.missingImageRows,
  sourceFolderMayBeDeleted: artifact.sourceFolderMayBeDeleted,
}, null, 2));
