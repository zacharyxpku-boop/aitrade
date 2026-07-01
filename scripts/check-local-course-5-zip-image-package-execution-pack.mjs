import fs from "node:fs";

const packPath = "docs/LOCAL_COURSE_5_ZIP_IMAGE_PACKAGE_EXECUTION_PACK.json";
const packMdPath = "docs/LOCAL_COURSE_5_ZIP_IMAGE_PACKAGE_EXECUTION_PACK.md";
const packHtmlPath = "docs/local-course-5-zip-image-package-execution-pack.html";
const inputPath = "docs/reviewer-inputs/LOCAL_COURSE_5_ZIP_IMAGE_PACKAGE_REVIEW_INPUT_TEMPLATE.json";
const inputMdPath = "docs/reviewer-inputs/LOCAL_COURSE_5_ZIP_IMAGE_PACKAGE_REVIEW_INPUT_TEMPLATE.md";

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

if (pack.executionStatus !== "course_5_zip_image_package_execution_pack_ready_blocked_on_real_visual_review") fail(`unexpected executionStatus: ${pack.executionStatus}`);
if (input.inputTemplateStatus !== "course_5_zip_image_package_review_input_template_ready_blocked_missing_input") fail(`unexpected input template status: ${input.inputTemplateStatus}`);
if (pack.sourceFolderMayBeDeleted !== false || pack.currentKnowledgeArtifactsCanReplaceSourceFolder !== false) fail("source deletion boundary drift");
if (pack.zipRows !== 8) fail("expected 8 ZIP packages");
if (pack.totalImageEntries !== 10569) fail("expected 10569 ZIP image entries");
if (pack.sampleRowCount !== 85 || pack.inputRowCount !== 85) fail("expected 85 sample/input rows");
if (pack.readyInputRows !== 0 || pack.blockedInputRows !== 85) fail("ZIP input rows must remain blocked");
if (pack.canFullyResolveWithLocalToolsNowRows !== 8) fail("all ZIP rows should be locally visually actionable");
if (!Array.isArray(pack.sourceRows) || pack.sourceRows.length !== 8) fail("sourceRows must cover 8 ZIP packages");
if (!Array.isArray(pack.sampleRows) || pack.sampleRows.length !== 85) fail("sampleRows detail must cover 85 samples");
if (!Array.isArray(input.rows) || input.rows.length !== 85) fail("input template must cover 85 rows");

const sampleIds = new Set();
for (const row of pack.sampleRows) {
  if (!row.reviewRowId || sampleIds.has(row.reviewRowId)) fail(`duplicate reviewRowId: ${row.reviewRowId}`);
  sampleIds.add(row.reviewRowId);
  if (!fs.existsSync(row.sampleImagePath)) fail(`missing sample image: ${row.sampleImagePath}`);
  if (!html.includes(row.sampleImageHref)) fail(`HTML missing sample image href: ${row.sampleImageHref}`);
  if (row.reviewStatus !== "blocked_missing_real_visual_reviewer_input") fail(`sample row should remain blocked: ${row.reviewRowId}`);
}

for (const row of input.rows) {
  if (row.acceptForZipSemanticReview !== false || row.acceptForDeletionReadiness !== false) fail(`input row must not be pre-accepted: ${row.reviewRowId}`);
  if (row.reviewStatus !== "blocked_missing_real_visual_reviewer_input") fail(`input row should remain blocked: ${row.reviewRowId}`);
}

const boundaryText = `${pack.boundary || ""} ${pack.completionRule || ""} ${input.boundary || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education operations",
  "zip image-package",
  "visual semantic review",
  "deletion-readiness",
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
  zipRows: pack.zipRows,
  totalImageEntries: pack.totalImageEntries,
  sampleRows: pack.sampleRows.length,
  readyInputRows: pack.readyInputRows,
  blockedInputRows: pack.blockedInputRows,
  sourceFolderMayBeDeleted: pack.sourceFolderMayBeDeleted,
}, null, 2));
