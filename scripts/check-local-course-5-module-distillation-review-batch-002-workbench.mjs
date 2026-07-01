import fs from "node:fs";

const workbenchPath = "docs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_002_WORKBENCH.json";
const htmlPath = "docs/local-course-5-module-distillation-review-batch-002-workbench.html";

function fail(message) {
  throw new Error(message);
}

const artifact = JSON.parse(fs.readFileSync(workbenchPath, "utf8"));
const html = fs.readFileSync(htmlPath, "utf8");

if (artifact.educationOnly !== true || artifact.productionReady !== false || artifact.learnerFacingRelease !== false || artifact.approvalStatus !== "not_approved" || artifact.writeAllowedNow !== false) {
  fail("workbench boundary drift");
}
if (artifact.workbenchStatus !== "course_5_module_distillation_review_batch_002_visual_workbench_ready_readonly_blocked") fail(`unexpected workbenchStatus: ${artifact.workbenchStatus}`);
if (artifact.selectedRows !== 40 || artifact.blockedRows !== 40 || artifact.readyRows !== 0) fail("workbench row counts drift");
if (artifact.modulesCovered < 8) fail("workbench module coverage too thin");
if (artifact.p0Rows < 20) fail("workbench P0 priority too low");
if (artifact.missingImageRows !== 0) fail("workbench image coverage missing");
if (artifact.sourceFolderMayBeDeleted !== false || artifact.learnerReadyModules !== 0) fail("release/delete boundary drift");

for (const row of artifact.rows || []) {
  if (!fs.existsSync(row.sampleImagePath)) fail(`missing sample image: ${row.sampleImagePath}`);
  if (!html.includes(row.htmlImageSrc)) fail(`HTML missing image for ${row.batchRowId}`);
  if (!Array.isArray(row.lessonSeedTitles) || row.lessonSeedTitles.length === 0) fail(`missing lesson seeds for ${row.batchRowId}`);
  if (row.validationStatus !== "blocked_missing_real_reviewer_input") fail(`row status drift: ${row.batchRowId}`);
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
