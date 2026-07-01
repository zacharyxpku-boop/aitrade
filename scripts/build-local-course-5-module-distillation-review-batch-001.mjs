import fs from "node:fs";

const distillationPath = "docs/LOCAL_COURSE_5_TEACHING_MODULE_DISTILLATION.json";
const reviewerTemplatePath = "docs/reviewer-inputs/LOCAL_COURSE_5_FOLLOWUP_REAL_REVIEWER_INPUT_TEMPLATE.json";
const outputJson = "docs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_001.json";
const outputMd = "docs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_001.md";
const inputCopyJson = "docs/reviewer-inputs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_001_INPUT_COPY_TEMPLATE.json";
const inputCopyMd = "docs/reviewer-inputs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_001_INPUT_COPY_TEMPLATE.md";

const boundary = "Course 5 module distillation review batch 001 is private reviewer-facing education operations material. It selects a bounded first set of visual/OCR cards and connects them to lesson seeds, evidence anchors, and reviewer input fields. It does not generate reviewer conclusions, accept machine drafts as human review, delete files, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

const modulePriority = [
  "chart_pattern_encyclopedia",
  "course_slides_alignment",
  "terminology_glossary",
  "reversals",
  "trends_and_channels",
  "trading_ranges",
  "bar_by_bar_reading",
  "breakouts_and_pullbacks",
  "price_action_foundations",
  "trade_management",
  "unclassified_supplement",
];

const targetByModule = {
  chart_pattern_encyclopedia: 10,
  course_slides_alignment: 6,
  terminology_glossary: 4,
  reversals: 4,
  trends_and_channels: 4,
  trading_ranges: 3,
  bar_by_bar_reading: 3,
  breakouts_and_pullbacks: 2,
  price_action_foundations: 2,
  trade_management: 1,
  unclassified_supplement: 1,
};

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

function moduleRank(moduleId) {
  const index = modulePriority.indexOf(moduleId);
  return index === -1 ? 999 : index;
}

function firstModule(row) {
  const tags = row.moduleTags || [];
  return [...tags].sort((left, right) => moduleRank(left) - moduleRank(right))[0] || "unclassified_supplement";
}

const distillation = readJson(distillationPath);
const reviewerTemplate = readJson(reviewerTemplatePath);
assertBoundary("distillation", distillation);
assertBoundary("reviewerTemplate", reviewerTemplate);

if (distillation.modules !== 13 || distillation.totalLessonSeeds < 52) fail("Course 5 teaching distillation must exist before batching");
if (reviewerTemplate.inputRows !== 386 || !Array.isArray(reviewerTemplate.rows)) fail("reviewer template must contain all 386 rows");

const modules = new Map((distillation.moduleRows || []).map((row) => [row.moduleId, row]));
const rows = reviewerTemplate.rows
  .map((row) => ({ ...row, primaryModuleId: firstModule(row) }))
  .filter((row) => modules.has(row.primaryModuleId));

const selected = [];
const selectedIds = new Set();
for (const moduleId of modulePriority) {
  const quota = targetByModule[moduleId] || 0;
  const moduleRows = rows
    .filter((row) => row.primaryModuleId === moduleId)
    .sort((left, right) =>
      Number(right.sourceTier === "P0") - Number(left.sourceTier === "P0") ||
      String(left.sampleKind || "").localeCompare(String(right.sampleKind || "")) ||
      String(left.inputId).localeCompare(String(right.inputId)));
  for (const row of moduleRows.slice(0, quota)) {
    selected.push(row);
    selectedIds.add(row.inputId);
  }
}

for (const row of rows) {
  if (selected.length >= 40) break;
  if (selectedIds.has(row.inputId)) continue;
  selected.push(row);
  selectedIds.add(row.inputId);
}

if (selected.length !== 40) fail(`expected 40 selected rows, got ${selected.length}`);

const batchRows = selected.map((row, index) => {
  const module = modules.get(row.primaryModuleId);
  return {
    batchRowId: `course5_module_distillation_batch_001_row_${String(index + 1).padStart(3, "0")}`,
    batchId: "course5-module-distillation-review-batch-001",
    batchPriority: index + 1,
    inputId: row.inputId,
    sourceTier: row.sourceTier,
    draftId: row.draftId,
    cardId: row.cardId,
    recordId: row.recordId,
    sourceRelativePath: row.sourceRelativePath,
    sampleImagePath: row.sampleImagePath,
    sampleKind: row.sampleKind,
    primaryModuleId: row.primaryModuleId,
    moduleTags: row.moduleTags,
    lessonSeedTargets: (module.lessonSeedRows || []).slice(0, 4),
    evidenceAnchors: (module.evidenceAnchors || []).slice(0, 3),
    candidateConcepts: row.candidateConcepts,
    candidateSummaryForOrientationOnly: row.candidateSummaryForOrientationOnly,
    reviewerQuestions: row.reviewerQuestions,
    riskFlags: row.riskFlags,
    requiredReviewerOutcome: "fill_visible_elements_visual_semantic_note_disposition_grounding_rewrite_and_retention_decision",
    editableReviewerInput: row.editableReviewerInput,
    allowedModuleDispositionValues: row.allowedModuleDispositionValues,
    allowedSourceRetentionDecisionValues: row.allowedSourceRetentionDecisionValues,
    validationStatus: "blocked_missing_real_reviewer_input",
    acceptedForModuleDistillation: false,
    acceptedForDeletionReadiness: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    productionReady: false,
    writeAllowedNow: false,
  };
});

const moduleRows = modulePriority
  .map((moduleId) => {
    const moduleBatchRows = batchRows.filter((row) => row.primaryModuleId === moduleId);
    if (!moduleBatchRows.length) return null;
    const module = modules.get(moduleId);
    return {
      moduleId,
      moduleLabel: module?.moduleLabel || moduleId,
      batchRows: moduleBatchRows.length,
      sourceTierCounts: moduleBatchRows.reduce((acc, row) => {
        acc[row.sourceTier] = (acc[row.sourceTier] || 0) + 1;
        return acc;
      }, {}),
      lessonSeedTargets: (module?.lessonSeedRows || []).slice(0, 4).map((row) => row.lessonTitle),
      reviewerNextGate: "complete_real_reviewer_input_then_validate_and_route_to_distillation_or_archive",
    };
  })
  .filter(Boolean);

const artifact = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  batchStatus: "course_5_module_distillation_review_batch_001_ready_blocked_missing_real_input",
  batchId: "course5-module-distillation-review-batch-001",
  batchPurpose: "first_bounded_visual_ocr_review_pack_for_teaching_module_distillation",
  sourceDistillation: distillationPath,
  sourceReviewerTemplate: reviewerTemplatePath,
  totalTemplateRows: reviewerTemplate.inputRows,
  selectedRows: batchRows.length,
  moduleRows,
  modulesCovered: moduleRows.length,
  p0Rows: batchRows.filter((row) => row.sourceTier === "P0").length,
  nonP0Rows: batchRows.filter((row) => row.sourceTier !== "P0").length,
  readyRows: 0,
  blockedRows: batchRows.length,
  acceptedForModuleDistillationRows: 0,
  acceptedForDeletionReadinessRows: 0,
  sourceFolderMayBeDeleted: false,
  learnerReadyModules: 0,
  batchRows,
  inputCopyTemplate: inputCopyJson,
  commands: [
    "npm.cmd run build:local-course-5-module-distillation-review-batch-001",
    "npm.cmd run check:local-course-5-module-distillation-review-batch-001",
    "npm.cmd run verify",
  ],
  completionRule: "Batch 001 is ready when it selects 40 Course 5 follow-up visual/OCR reviewer rows, maps each row to lesson seeds and evidence anchors, and keeps all release/delete fields blocked until real reviewer input is supplied and validated.",
  boundary,
};

const inputCopy = {
  generatedAt: artifact.generatedAt,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  inputCopyStatus: "course_5_module_distillation_review_batch_001_input_copy_ready_blank",
  batchId: artifact.batchId,
  sourceBatch: outputJson,
  inputRows: batchRows.length,
  readyRows: 0,
  blockedRows: batchRows.length,
  acceptedForModuleDistillationRows: 0,
  acceptedForDeletionReadinessRows: 0,
  sourceFolderMayBeDeleted: false,
  rows: batchRows,
  boundary,
};

fs.writeFileSync(outputJson, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
fs.writeFileSync(inputCopyJson, `${JSON.stringify(inputCopy, null, 2)}\n`, "utf8");

fs.writeFileSync(outputMd, [
  "# Local Course 5 Module Distillation Review Batch 001",
  "",
  `- Batch status: ${artifact.batchStatus}`,
  `- Selected rows: ${artifact.selectedRows}/${artifact.totalTemplateRows}`,
  `- Modules covered: ${artifact.modulesCovered}`,
  `- P0 rows: ${artifact.p0Rows}`,
  `- Non-P0 rows: ${artifact.nonP0Rows}`,
  `- Ready rows: ${artifact.readyRows}`,
  `- Blocked rows: ${artifact.blockedRows}`,
  `- Source folder may be deleted: ${artifact.sourceFolderMayBeDeleted}`,
  "",
  "## Module Coverage",
  "",
  "| Module | Rows | Reviewer next gate |",
  "|---|---:|---|",
  ...moduleRows.map((row) => `| ${row.moduleLabel} | ${row.batchRows} | ${row.reviewerNextGate} |`),
  "",
  "## Boundary",
  "",
  boundary,
  "",
].join("\n"), "utf8");

fs.writeFileSync(inputCopyMd, [
  "# Local Course 5 Module Distillation Review Batch 001 Input Copy Template",
  "",
  `- Input copy status: ${inputCopy.inputCopyStatus}`,
  `- Rows: ${inputCopy.inputRows}`,
  `- Ready rows: ${inputCopy.readyRows}`,
  `- Blocked rows: ${inputCopy.blockedRows}`,
  "",
  "Fill a copy of the JSON template, not this source template.",
  "",
  "## Boundary",
  "",
  boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  batchStatus: artifact.batchStatus,
  selectedRows: artifact.selectedRows,
  modulesCovered: artifact.modulesCovered,
  p0Rows: artifact.p0Rows,
  nonP0Rows: artifact.nonP0Rows,
  readyRows: artifact.readyRows,
  blockedRows: artifact.blockedRows,
  sourceFolderMayBeDeleted: artifact.sourceFolderMayBeDeleted,
}, null, 2));
