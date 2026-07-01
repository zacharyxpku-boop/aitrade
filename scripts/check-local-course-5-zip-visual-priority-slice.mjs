import fs from "node:fs";

const slicePath = "docs/LOCAL_COURSE_5_ZIP_VISUAL_PRIORITY_SLICE.json";
const sliceMdPath = "docs/LOCAL_COURSE_5_ZIP_VISUAL_PRIORITY_SLICE.md";
const sliceHtmlPath = "docs/local-course-5-zip-visual-priority-slice.html";
const inputJsonPath = "docs/reviewer-inputs/LOCAL_COURSE_5_ZIP_VISUAL_PRIORITY_SLICE_INPUT_TEMPLATE.json";
const inputMdPath = "docs/reviewer-inputs/LOCAL_COURSE_5_ZIP_VISUAL_PRIORITY_SLICE_INPUT_TEMPLATE.md";

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

if (slice.sliceStatus !== "course_5_zip_visual_priority_slice_ready_blocked_on_real_visual_reviewer_input") fail(`unexpected sliceStatus: ${slice.sliceStatus}`);
if (slice.sliceMode !== "all_locally_resolvable_zip_image_packages") fail("unexpected slice mode");
if (slice.totalZipFollowupRows !== 8 || slice.totalZipImageEntries !== 10569 || slice.totalZipSampleRows !== 85) fail("total ZIP counts drift");
if (slice.selectedSourceRows !== 8 || slice.selectedSampleRows !== 85 || slice.selectedInputRows !== 85) fail("selected ZIP counts drift");
if (slice.selectedP0SourceRows !== 1 || slice.selectedP1SourceRows !== 1 || slice.selectedP2SourceRows !== 6) fail("priority source split drift");
if (slice.selectedImageEntries !== 10569) fail("selected image entries drift");
if (slice.canFullyResolveWithLocalToolsNowRows !== 8) fail("all ZIP rows should be locally resolvable with visual review");
if (slice.readyInputRows !== 0 || slice.blockedInputRows !== 85) fail("ZIP visual priority inputs should start fully blocked");
if (slice.acceptedForModuleDistillationRows !== 0 || slice.acceptedForDeletionReadinessRows !== 0) fail("ZIP priority slice must not accept rows");
if (slice.learnerReadyModules !== 0) fail("no learner-ready modules from ZIP priority slice");
if (slice.sourceFolderMayBeDeleted !== false || slice.currentKnowledgeArtifactsCanReplaceSourceFolder !== false) fail("source deletion boundary drift");
if (!Array.isArray(slice.sourceRows) || slice.sourceRows.length !== 8) fail("sourceRows length drift");
if (!Array.isArray(slice.sampleRows) || slice.sampleRows.length !== 85) fail("sampleRows length drift");

const sourceIds = new Set(slice.sourceRows.map((row) => row.recordId));
if (sourceIds.size !== 8) fail("source rows should be unique by recordId");
const sampleIds = new Set(slice.sampleRows.map((row) => row.reviewRowId));
if (sampleIds.size !== 85) fail("sample rows should be unique by reviewRowId");

for (const source of slice.sourceRows) {
  if (!source.recordId || !source.relativePath || !source.sourceLocalPath) fail(`invalid source row: ${JSON.stringify(source)}`);
  if (source.canFullyResolveWithLocalToolsNow !== true) fail(`source should be locally visual-resolvable: ${source.recordId}`);
  if (source.sourceFolderMayBeDeleted !== false) fail(`source deletion drift: ${source.recordId}`);
}

for (const sample of slice.sampleRows) {
  if (!sourceIds.has(sample.recordId)) fail(`sample references unselected source: ${sample.reviewRowId}`);
  if (!sample.sampleImageExists || !fs.existsSync(sample.sampleImagePath)) fail(`missing sample image: ${sample.sampleImagePath}`);
  if (!Array.isArray(sample.candidateConcepts) || sample.candidateConcepts.length === 0) fail(`sample missing candidate concepts: ${sample.reviewRowId}`);
  if (!Array.isArray(sample.reviewerQuestions) || sample.reviewerQuestions.length < 4) fail(`sample missing reviewer questions: ${sample.reviewRowId}`);
  if (sample.reviewStatus !== "blocked_missing_real_visual_reviewer_input") fail(`sample should be blocked: ${sample.reviewRowId}`);
  if (sample.acceptedForZipSemanticReview !== false || sample.acceptedForModuleDistillation !== false || sample.acceptedForDeletionReadiness !== false) fail(`sample acceptance drift: ${sample.reviewRowId}`);
  assertBoundary(`sample ${sample.reviewRowId}`, sample);
}

if (input.inputTemplateStatus !== "course_5_zip_visual_priority_slice_input_template_ready_blocked_missing_input") fail("unexpected input template status");
if (input.sourceSlice !== slicePath) fail("input sourceSlice mismatch");
if (input.inputRows !== 85 || input.readyRows !== 0 || input.blockedRows !== 85) fail("input template row counts drift");
if (!Array.isArray(input.rows) || input.rows.length !== 85) fail("input rows length drift");
for (const row of input.rows) {
  if (!sampleIds.has(row.reviewRowId)) fail(`input row missing sample reference: ${row.reviewRowId}`);
  for (const field of [
    "reviewerOwnedVisualObservation",
    "reviewerVisibleTextOrLabelCheck",
    "paraphrasedTeachingConcept",
    "modulePlacement",
    "representativenessNote",
    "evidenceLimitations",
    "reviewerNameOrInitials",
    "reviewedAt",
  ]) {
    if (row[field] !== "") fail(`blank input template field should be empty: ${row.reviewRowId}.${field}`);
  }
  if (row.publicGroundingNeeded !== true) fail(`public grounding should remain required: ${row.reviewRowId}`);
  if (row.acceptedForZipSemanticReview !== false || row.acceptedForModuleDistillation !== false || row.acceptedForDeletionReadiness !== false) fail(`input acceptance drift: ${row.reviewRowId}`);
  assertBoundary(`input ${row.reviewRowId}`, row);
}

for (const artifactPath of [
  slice.sourceExecutionPack,
  slice.sourceMachineDrafts,
  slice.sourceValidation,
  slice.sourceClosureCockpit,
  slice.inputTemplate.json,
  slice.inputTemplate.markdown,
]) {
  if (!fs.existsSync(artifactPath)) fail(`missing linked artifact: ${artifactPath}`);
}

for (const needle of [
  "Course 5 ZIP Visual Priority Slice",
  "selected source rows",
  "selected sample rows",
  "P0/P1/P2 sources",
  "selected image entries",
  "blocked input rows",
  "source folder may be deleted",
]) {
  if (!html.includes(needle)) fail(`HTML missing: ${needle}`);
}

const boundaryText = `${slice.boundary || ""} ${slice.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education operations",
  "locally resolvable zip image packages",
  "representative image samples",
  "machine orientation drafts",
  "reviewer-owned visual input fields",
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
  sliceStatus: slice.sliceStatus,
  selectedSourceRows: slice.selectedSourceRows,
  selectedSampleRows: slice.selectedSampleRows,
  selectedP0SourceRows: slice.selectedP0SourceRows,
  selectedP1SourceRows: slice.selectedP1SourceRows,
  selectedP2SourceRows: slice.selectedP2SourceRows,
  canFullyResolveWithLocalToolsNowRows: slice.canFullyResolveWithLocalToolsNowRows,
  blockedInputRows: slice.blockedInputRows,
  sourceFolderMayBeDeleted: slice.sourceFolderMayBeDeleted,
}, null, 2));
