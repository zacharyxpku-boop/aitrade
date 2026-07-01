import fs from "node:fs";

const templatePath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_REVIEWER_INPUT_TEMPLATE.json";
const outputJsonPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_COVERAGE_AUDIT.json";
const outputMdPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_COVERAGE_AUDIT.md";
const reviewedAt = "2026-06-25T00:00:00.000+08:00";

const batchSpecs = [
  { id: "batch_001", path: "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_001_INPUT.json", validationPath: "docs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_001_VALIDATION.json" },
  { id: "batch_002", path: "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_002_INPUT.json", validationPath: "docs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_002_VALIDATION.json" },
  { id: "batch_003", path: "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_003_INPUT.json", validationPath: "docs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_003_VALIDATION.json" },
  { id: "batch_004", path: "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_004_INPUT.json", validationPath: "docs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_004_VALIDATION.json" },
  { id: "batch_005", path: "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_005_INPUT.json", validationPath: "docs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_005_VALIDATION.json" },
  { id: "batch_006", path: "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_006_INPUT.json", validationPath: "docs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_006_VALIDATION.json" },
  { id: "batch_007", path: "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_007_INPUT.json", validationPath: "docs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_007_VALIDATION.json" },
];

const requiredFields = [
  "reviewerOwnedOcrTextExcerpt",
  "reviewerOwnedVisualObservation",
  "paraphrasedTeachingConcept",
  "modulePlacement",
  "evidenceLimitations",
  "reviewerNameOrInitials",
  "reviewedAt",
];

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

function hasText(value) {
  return String(value || "").trim().length > 0;
}

const template = readJson(templatePath);
assertBoundary("template", template);

const expectedIds = template.rows.map((row) => row.reviewRowId);
const coverageById = new Map(expectedIds.map((id) => [id, []]));
const batchSummaries = [];

for (const batch of batchSpecs) {
  const input = readJson(batch.path);
  const validation = readJson(batch.validationPath);
  assertBoundary(`${batch.id} input`, input);
  assertBoundary(`${batch.id} validation`, validation);
  if (validation.sourceFolderMayBeDeleted !== false) fail(`${batch.id} must not open source folder removal`);
  if (validation.learnerReadyModules !== 0) fail(`${batch.id} must not create learner-ready modules`);

  const readyRows = [];
  const inputRows = input.rows || [];
  for (const row of inputRows) {
    const ready = requiredFields.every((field) => hasText(row[field]));
    if (!ready) continue;
    if (!coverageById.has(row.reviewRowId)) fail(`${batch.id} has unexpected review row ${row.reviewRowId}`);
    coverageById.get(row.reviewRowId).push(batch.id);
    readyRows.push(row.reviewRowId);
  }

  batchSummaries.push({
    batchId: batch.id,
    inputRows: inputRows.length,
    readyForConfirmationRows: readyRows.length,
    firstReviewRowId: readyRows[0] || null,
    lastReviewRowId: readyRows.at(-1) || null,
    validationStatus: validation.validationStatus,
    sourceFolderMayBeDeleted: validation.sourceFolderMayBeDeleted,
  });
}

const coverageRows = expectedIds.map((id) => {
  const batches = coverageById.get(id);
  const templateRow = template.rows.find((row) => row.reviewRowId === id);
  return {
    reviewRowId: id,
    executionSampleNo: templateRow.executionSampleNo,
    relativePath: templateRow.relativePath,
    pageNumber: templateRow.pageNumber,
    sampleImagePath: templateRow.sampleImagePath,
    coveredByBatches: batches,
    coverageCount: batches.length,
    coveredExactlyOnce: batches.length === 1,
  };
});

const missingRows = coverageRows.filter((row) => row.coverageCount === 0);
const duplicateRows = coverageRows.filter((row) => row.coverageCount > 1);
const coveredRows = coverageRows.filter((row) => row.coverageCount === 1);

if (template.rows.length !== 85) fail(`expected 85 template rows, got ${template.rows.length}`);
if (coveredRows.length !== 85) fail(`expected 85 covered rows, got ${coveredRows.length}`);
if (missingRows.length !== 0) fail(`expected 0 missing rows, got ${missingRows.length}`);
if (duplicateRows.length !== 0) fail(`expected 0 duplicate rows, got ${duplicateRows.length}`);

const artifact = {
  generatedAt: reviewedAt,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  auditStatus: "course_5_wave_5_pdf_ai_visual_review_all_85_samples_covered_release_and_deletion_blocked",
  sourceTemplate: templatePath,
  batchCount: batchSpecs.length,
  templateRows: template.rows.length,
  coveredRows: coveredRows.length,
  missingRows: missingRows.length,
  duplicateCoverageRows: duplicateRows.length,
  readyForHumanConfirmationRows: coveredRows.length,
  moduleMergeAllowedNow: false,
  acceptedForModuleDistillationRows: 0,
  acceptedForDeletionReadinessRows: 0,
  learnerReadyModules: 0,
  sourceFolderMayBeDeleted: false,
  batchSummaries,
  coverageRows,
  nextOperationalGates: [
    "Use this audit as the Wave 5 PDF visual review closure proof.",
    "Keep OCR, public grounding, and originality review required before module merge.",
    "Recompute Course 5 deletion readiness only after OCR, reviewer confirmation, public grounding, originality review, and module merge gates are satisfied.",
  ],
  completionRule: "Wave 5 PDF AI visual review coverage is complete when every row in the Wave 5 PDF reviewer input template is covered exactly once by Batch 001 through Batch 007 while all release, module merge, and source-folder removal gates remain closed.",
  boundary: "Private education-operations audit for Course 5 Wave 5 PDF page sample coverage. It summarizes model-assisted visual review coverage and keeps learner release, module merge, write authorization, and source-folder removal blocked pending OCR, reviewer confirmation, public grounding, originality review, and explicit approval.",
};

assertBoundary("coverage audit", artifact);

fs.writeFileSync(outputJsonPath, `${JSON.stringify(artifact, null, 2)}\n`);

const mdRows = batchSummaries
  .map((row) => `| ${row.batchId} | ${row.readyForConfirmationRows} | ${row.firstReviewRowId} | ${row.lastReviewRowId} | ${row.sourceFolderMayBeDeleted} |`)
  .join("\n");

fs.writeFileSync(outputMdPath, `# Course 5 Wave 5 PDF AI Visual Review Coverage Audit

- Status: ${artifact.auditStatus}
- Covered rows: ${artifact.coveredRows}/${artifact.templateRows}
- Missing rows: ${artifact.missingRows}
- Duplicate coverage rows: ${artifact.duplicateCoverageRows}
- Source folder may be deleted: ${artifact.sourceFolderMayBeDeleted}
- Learner-ready modules: ${artifact.learnerReadyModules}

| Batch | Ready rows | First row | Last row | Source folder may be deleted |
|---|---:|---|---|---|
${mdRows}

${artifact.boundary}
`);

console.log(JSON.stringify({
  ok: true,
  auditStatus: artifact.auditStatus,
  batchCount: artifact.batchCount,
  templateRows: artifact.templateRows,
  coveredRows: artifact.coveredRows,
  missingRows: artifact.missingRows,
  duplicateCoverageRows: artifact.duplicateCoverageRows,
  sourceFolderMayBeDeleted: artifact.sourceFolderMayBeDeleted,
}, null, 2));
