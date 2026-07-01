import fs from "node:fs";
import path from "node:path";

const distillationPath = "docs/LOCAL_COURSE_5_TEACHING_MODULE_DISTILLATION.json";
const reviewerTemplatePath = "docs/reviewer-inputs/LOCAL_COURSE_5_FOLLOWUP_REAL_REVIEWER_INPUT_TEMPLATE.json";
const indexJson = "docs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_INDEX.json";
const indexMd = "docs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_INDEX.md";

const batchSize = 40;
const boundary = "Course 5 module distillation review batch suite is private reviewer-facing education operations material. It partitions visual/OCR cards into bounded review batches with input templates, readonly visual workbenches, and blank-input validation reports. It does not generate reviewer conclusions, accept machine drafts as human review, delete files, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

const modulePriority = [
  "chart_pattern_encyclopedia",
  "course_slides_alignment",
  "reversals",
  "trends_and_channels",
  "trading_ranges",
  "bar_by_bar_reading",
  "trade_management",
  "unclassified_supplement",
  "terminology_glossary",
  "breakouts_and_pullbacks",
  "price_action_foundations",
];

const requiredFields = [
  "reviewerName",
  "reviewedAt",
  "visibleElements",
  "visualSemanticNote",
  "ocrOrManualText",
  "uncertaintyNotes",
  "moduleDisposition",
  "publicGroundingNeeded",
  "originalRewriteGuidance",
  "sourceRetentionDecision",
];

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

function htmlEscape(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function relFromDocs(filePath) {
  return path.relative("docs", filePath).replace(/\\/g, "/");
}

function moduleRank(moduleId) {
  const index = modulePriority.indexOf(moduleId);
  return index === -1 ? 999 : index;
}

function firstModule(row) {
  return [...(row.moduleTags || [])].sort((left, right) => moduleRank(left) - moduleRank(right))[0] || "unclassified_supplement";
}

function batchNumberString(index) {
  return String(index).padStart(3, "0");
}

function forbiddenHits(value) {
  const blob = String(value || "").toLowerCase();
  return [
    "buy signal",
    "sell signal",
    "must buy",
    "must sell",
    "recommended buy",
    "recommended sell",
    "guaranteed return",
    "win rate",
    "profit target",
    "stop loss instruction",
    "real money",
    "broker",
    "auto trading",
    "approved for release",
    "learner-facing approved",
    "write allowed",
    "delete source",
  ].filter((phrase) => blob.includes(phrase.toLowerCase()));
}

function validateBlankInput(inputCopy, batch, batchNo) {
  const batchIds = new Set(batch.batchRows.map((row) => row.inputId));
  const inputIds = new Set(inputCopy.rows.map((row) => row.inputId));
  if (inputIds.size !== inputCopy.rows.length) fail(`batch ${batchNo} input contains duplicate rows`);
  for (const id of batchIds) {
    if (!inputIds.has(id)) fail(`batch ${batchNo} input missing row ${id}`);
  }

  const validationRows = inputCopy.rows.map((row) => {
    const editable = row.editableReviewerInput || {};
    const missingFields = requiredFields.filter((field) => !String(editable[field] || "").trim());
    const joinedInput = Object.values(editable).map((value) => String(value || "").trim()).join("\n");
    const hits = forbiddenHits(joinedInput);
    return {
      inputId: row.inputId,
      batchRowId: row.batchRowId,
      primaryModuleId: row.primaryModuleId,
      sourceTier: row.sourceTier,
      validationStatus: "blocked_missing_or_invalid_real_input",
      readyForModuleDistillationReviewGate: false,
      missingFields,
      qualityIssues: [
        "invalid_moduleDisposition",
        "invalid_sourceRetentionDecision",
      ],
      forbiddenHits: hits,
      nextGate: "fill_real_reviewer_or_ocr_fields_then_revalidate",
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    writeAllowedNow: false,
    validationStatus: `course_5_module_distillation_batch_${batchNo}_input_blocked_missing_or_invalid_real_input`,
    validationMode: `batch_${batchNo}_visual_ocr_reviewer_input_gate`,
    inputPath: inputCopy.sourcePath,
    batchPath: batch.sourcePath,
    inputRows: validationRows.length,
    readyRows: 0,
    blockedRows: validationRows.length,
    missingFieldRows: validationRows.length,
    qualityIssueRows: validationRows.length,
    forbiddenHitRows: validationRows.filter((row) => row.forbiddenHits.length).length,
    acceptedForModuleDistillationRows: 0,
    acceptedForDeletionReadinessRows: 0,
    sourceFolderMayBeDeleted: false,
    learnerReadyModules: 0,
    validationRows,
    completionRule: `Batch ${Number(batchNo)} input validation passes only when all rows contain real reviewer/OCR-owned fields, valid disposition and retention decisions, no copied machine summaries, no forbidden trading advice language, and no release/delete boundary drift. Passing validation still does not approve learner-facing release or source deletion.`,
    boundary: `Course 5 module distillation batch ${Number(batchNo)} input validation is private reviewer-facing education operations material. It validates human/OCR-owned visual notes, module disposition, public grounding needs, rewrite guidance, and source-retention decisions; it does not generate reviewer conclusions, accept machine drafts as human review, delete files, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.`,
  };
}

const distillation = readJson(distillationPath);
const reviewerTemplate = readJson(reviewerTemplatePath);
assertBoundary("distillation", distillation);
assertBoundary("reviewerTemplate", reviewerTemplate);

const modules = new Map((distillation.moduleRows || []).map((row) => [row.moduleId, row]));
const sortedRows = reviewerTemplate.rows
  .map((row) => ({ ...row, primaryModuleId: firstModule(row) }))
  .filter((row) => modules.has(row.primaryModuleId))
  .sort((left, right) =>
    moduleRank(left.primaryModuleId) - moduleRank(right.primaryModuleId) ||
    Number(right.sourceTier === "P0") - Number(left.sourceTier === "P0") ||
    String(left.sampleKind || "").localeCompare(String(right.sampleKind || "")) ||
    String(left.inputId).localeCompare(String(right.inputId)));

if (sortedRows.length !== 386) fail(`expected 386 rows, got ${sortedRows.length}`);

const batchArtifacts = [];
const seenIds = new Set();

for (let start = 0, batchIndex = 1; start < sortedRows.length; start += batchSize, batchIndex += 1) {
  const batchNo = batchNumberString(batchIndex);
  const slice = sortedRows.slice(start, start + batchSize);
  const batchId = `course5-module-distillation-review-batch-${batchNo}`;
  const outputJson = `docs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_${batchNo}.json`;
  const outputMd = `docs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_${batchNo}.md`;
  const inputCopyJson = `docs/reviewer-inputs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_${batchNo}_INPUT_COPY_TEMPLATE.json`;
  const inputCopyMd = `docs/reviewer-inputs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_${batchNo}_INPUT_COPY_TEMPLATE.md`;
  const validationJson = `docs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_${batchNo}_INPUT_VALIDATION.json`;
  const validationMd = `docs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_${batchNo}_INPUT_VALIDATION.md`;
  const workbenchJson = `docs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_${batchNo}_WORKBENCH.json`;
  const workbenchHtml = `docs/local-course-5-module-distillation-review-batch-${batchNo}-workbench.html`;

  const batchRows = slice.map((row, index) => {
    if (seenIds.has(row.inputId)) fail(`duplicate batch inputId: ${row.inputId}`);
    seenIds.add(row.inputId);
    if (!fs.existsSync(row.sampleImagePath)) fail(`missing sample image: ${row.sampleImagePath}`);
    const module = modules.get(row.primaryModuleId);
    return {
      batchRowId: `course5_module_distillation_batch_${batchNo}_row_${String(index + 1).padStart(3, "0")}`,
      batchId,
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

  const moduleRows = [...new Set(batchRows.map((row) => row.primaryModuleId))].map((moduleId) => {
    const rows = batchRows.filter((row) => row.primaryModuleId === moduleId);
    return {
      moduleId,
      moduleLabel: modules.get(moduleId)?.moduleLabel || moduleId,
      batchRows: rows.length,
      sourceTierCounts: rows.reduce((acc, row) => {
        acc[row.sourceTier] = (acc[row.sourceTier] || 0) + 1;
        return acc;
      }, {}),
      reviewerNextGate: "complete_real_reviewer_input_then_validate_and_route_to_distillation_or_archive",
    };
  });

  const batch = {
    generatedAt: new Date().toISOString(),
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    writeAllowedNow: false,
    sourcePath: outputJson,
    batchStatus: `course_5_module_distillation_review_batch_${batchNo}_ready_blocked_missing_real_input`,
    batchId,
    batchPurpose: "bounded_visual_ocr_review_pack_for_teaching_module_distillation",
    sourceDistillation: distillationPath,
    sourceReviewerTemplate: reviewerTemplatePath,
    totalTemplateRows: reviewerTemplate.inputRows,
    selectedRows: batchRows.length,
    cumulativeSelectedRows: seenIds.size,
    remainingRowsAfterBatch: sortedRows.length - seenIds.size,
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
    workbenchHtml,
    validationJson,
    commands: [
      "npm.cmd run build:local-course-5-module-distillation-review-batch-suite",
      "npm.cmd run check:local-course-5-module-distillation-review-batch-index",
      "npm.cmd run verify",
    ],
    completionRule: `Batch ${Number(batchNo)} is ready when it selects a bounded Course 5 follow-up visual/OCR reviewer row set, maps each row to lesson seeds and evidence anchors, and keeps all release/delete fields blocked until real reviewer input is supplied and validated.`,
    boundary,
  };

  const inputCopy = {
    generatedAt: batch.generatedAt,
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    writeAllowedNow: false,
    sourcePath: inputCopyJson,
    inputCopyStatus: `course_5_module_distillation_review_batch_${batchNo}_input_copy_ready_blank`,
    batchId,
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

  const workbenchRows = batchRows.map((row) => ({
    batchRowId: row.batchRowId,
    batchPriority: row.batchPriority,
    inputId: row.inputId,
    sourceTier: row.sourceTier,
    primaryModuleId: row.primaryModuleId,
    sourceRelativePath: row.sourceRelativePath,
    sampleImagePath: row.sampleImagePath,
    htmlImageSrc: relFromDocs(row.sampleImagePath),
    sampleKind: row.sampleKind,
    lessonSeedTitles: (row.lessonSeedTargets || []).map((lesson) => lesson.lessonTitle),
    reviewerQuestions: row.reviewerQuestions || [],
    riskFlags: row.riskFlags || [],
    validationStatus: row.validationStatus,
    acceptedForModuleDistillation: false,
    acceptedForDeletionReadiness: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    productionReady: false,
    writeAllowedNow: false,
  }));

  const workbench = {
    generatedAt: batch.generatedAt,
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    writeAllowedNow: false,
    workbenchStatus: `course_5_module_distillation_review_batch_${batchNo}_visual_workbench_ready_readonly_blocked`,
    workbenchMode: "readonly_local_html_visual_review_navigation",
    sourceBatch: outputJson,
    htmlPath: workbenchHtml,
    selectedRows: workbenchRows.length,
    modulesCovered: moduleRows.length,
    p0Rows: batch.p0Rows,
    nonP0Rows: batch.nonP0Rows,
    readyRows: 0,
    blockedRows: workbenchRows.length,
    missingImageRows: 0,
    sourceFolderMayBeDeleted: false,
    learnerReadyModules: 0,
    rows: workbenchRows,
    boundary,
  };

  const validation = validateBlankInput(inputCopy, batch, batchNo);
  validation.inputPath = inputCopyJson;
  validation.batchPath = outputJson;

  fs.writeFileSync(outputJson, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
  fs.writeFileSync(inputCopyJson, `${JSON.stringify(inputCopy, null, 2)}\n`, "utf8");
  fs.writeFileSync(workbenchJson, `${JSON.stringify(workbench, null, 2)}\n`, "utf8");
  fs.writeFileSync(validationJson, `${JSON.stringify(validation, null, 2)}\n`, "utf8");

  fs.writeFileSync(outputMd, [
    `# Local Course 5 Module Distillation Review Batch ${batchNo}`,
    "",
    `- Batch status: ${batch.batchStatus}`,
    `- Selected rows: ${batch.selectedRows}`,
    `- Cumulative selected rows: ${batch.cumulativeSelectedRows}/${sortedRows.length}`,
    `- Remaining rows after batch: ${batch.remainingRowsAfterBatch}`,
    `- Modules covered: ${batch.modulesCovered}`,
    `- P0 rows: ${batch.p0Rows}`,
    `- Non-P0 rows: ${batch.nonP0Rows}`,
    `- Source folder may be deleted: ${batch.sourceFolderMayBeDeleted}`,
    "",
    "## Boundary",
    "",
    boundary,
    "",
  ].join("\n"), "utf8");

  fs.writeFileSync(inputCopyMd, [
    `# Local Course 5 Module Distillation Review Batch ${batchNo} Input Copy Template`,
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

  fs.writeFileSync(validationMd, [
    `# Course 5 Module Distillation Batch ${batchNo} Input Validation`,
    "",
    `- Validation status: ${validation.validationStatus}`,
    `- Input rows: ${validation.inputRows}`,
    `- Ready rows: ${validation.readyRows}`,
    `- Blocked rows: ${validation.blockedRows}`,
    `- Missing-field rows: ${validation.missingFieldRows}`,
    `- Source folder may be deleted: ${validation.sourceFolderMayBeDeleted}`,
    "",
    "## Boundary",
    "",
    validation.boundary,
    "",
  ].join("\n"), "utf8");

  const cards = workbenchRows.map((row) => `
      <article class="card">
        <div class="meta"><span>#${row.batchPriority}</span><span>${htmlEscape(row.sourceTier)}</span><span>${htmlEscape(row.primaryModuleId)}</span><span>${htmlEscape(row.validationStatus)}</span></div>
        <img src="${htmlEscape(row.htmlImageSrc)}" alt="${htmlEscape(row.batchRowId)} sample image" loading="lazy" />
        <h2>${htmlEscape(row.primaryModuleId)}</h2>
        <p class="source">${htmlEscape(row.sourceRelativePath)}</p>
        <h3>Lesson Seeds</h3>
        <ul>${row.lessonSeedTitles.map((item) => `<li>${htmlEscape(item)}</li>`).join("")}</ul>
        <h3>Reviewer Questions</h3>
        <ul>${row.reviewerQuestions.slice(0, 4).map((item) => `<li>${htmlEscape(item)}</li>`).join("")}</ul>
        <p class="chips">${row.riskFlags.map((item) => `<span>${htmlEscape(item)}</span>`).join("")}</p>
      </article>`).join("\n");

  fs.writeFileSync(workbenchHtml, `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Course 5 Batch ${batchNo} Visual Workbench</title>
<style>
:root{font-family:Arial,Helvetica,sans-serif;background:#f6f7f4;color:#20211f}body{margin:0}header{position:sticky;top:0;background:#fff;border-bottom:1px solid #d8d8d0;padding:16px 24px;z-index:2}h1{margin:0 0 8px;font-size:22px;letter-spacing:0}.summary,.meta,.chips{display:flex;flex-wrap:wrap;gap:6px}.summary span,.meta span,.chips span{border:1px solid #c9ccc3;border-radius:999px;padding:4px 8px;background:#fff;font-size:12px}main{padding:20px;display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px}.card{background:#fff;border:1px solid #d5d7cf;border-radius:8px;overflow:hidden;min-width:0}.meta{padding:10px}img{width:100%;height:260px;object-fit:contain;background:#eceee8;border-top:1px solid #e0e1dc;border-bottom:1px solid #e0e1dc}h2{font-size:18px;margin:12px 12px 4px;letter-spacing:0}h3{font-size:13px;margin:12px 12px 6px;color:#55584f;letter-spacing:0}.source{margin:0 12px;font-size:12px;line-height:1.4;color:#666960;word-break:break-word}ul{margin:0 12px 4px 28px;padding:0;font-size:13px;line-height:1.45}.chips{margin:12px}footer{padding:20px 24px 32px;color:#55584f;font-size:12px;line-height:1.5}
</style></head><body>
<header><h1>Course 5 Batch ${batchNo} Visual Workbench</h1><div class="summary"><span>${workbench.selectedRows} rows</span><span>${workbench.modulesCovered} modules</span><span>${workbench.p0Rows} P0</span><span>${workbench.nonP0Rows} non-P0</span><span>readonly</span></div></header>
<main>${cards}</main><footer>${htmlEscape(boundary)}</footer></body></html>
`, "utf8");

  batchArtifacts.push({
    batchNo,
    batchId,
    batchJson: outputJson,
    inputCopyJson,
    workbenchJson,
    workbenchHtml,
    validationJson,
    selectedRows: batch.selectedRows,
    cumulativeSelectedRows: batch.cumulativeSelectedRows,
    remainingRowsAfterBatch: batch.remainingRowsAfterBatch,
    modulesCovered: batch.modulesCovered,
    p0Rows: batch.p0Rows,
    nonP0Rows: batch.nonP0Rows,
    readyRows: 0,
    blockedRows: batch.blockedRows,
  });
}

const index = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  indexStatus: "course_5_module_distillation_review_batch_index_all_cards_batched_release_blocked",
  totalReviewerRows: sortedRows.length,
  batchSize,
  totalBatches: batchArtifacts.length,
  coveredRows: seenIds.size,
  remainingRows: sortedRows.length - seenIds.size,
  duplicateInputIds: 0,
  missingImageRows: 0,
  readyRows: 0,
  blockedRows: sortedRows.length,
  sourceFolderMayBeDeleted: false,
  learnerReadyModules: 0,
  batchRows: batchArtifacts,
  commands: [
    "npm.cmd run build:local-course-5-module-distillation-review-batch-suite",
    "npm.cmd run check:local-course-5-module-distillation-review-batch-index",
    "npm.cmd run verify",
  ],
  completionRule: "The Course 5 batch index is complete when all 386 visual/OCR reviewer cards are assigned to non-overlapping batches with input copy templates, readonly visual workbenches, blank-input validation reports, and locked release/delete status.",
  boundary,
};

fs.writeFileSync(indexJson, `${JSON.stringify(index, null, 2)}\n`, "utf8");
fs.writeFileSync(indexMd, [
  "# Course 5 Module Distillation Review Batch Index",
  "",
  `- Index status: ${index.indexStatus}`,
  `- Total reviewer rows: ${index.totalReviewerRows}`,
  `- Total batches: ${index.totalBatches}`,
  `- Covered rows: ${index.coveredRows}`,
  `- Remaining rows: ${index.remainingRows}`,
  `- Missing image rows: ${index.missingImageRows}`,
  `- Source folder may be deleted: ${index.sourceFolderMayBeDeleted}`,
  "",
  "| Batch | Rows | Cumulative | Remaining | Modules | P0 | Non-P0 |",
  "|---|---:|---:|---:|---:|---:|---:|",
  ...batchArtifacts.map((row) => `| ${row.batchNo} | ${row.selectedRows} | ${row.cumulativeSelectedRows} | ${row.remainingRowsAfterBatch} | ${row.modulesCovered} | ${row.p0Rows} | ${row.nonP0Rows} |`),
  "",
  "## Boundary",
  "",
  boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  indexStatus: index.indexStatus,
  totalReviewerRows: index.totalReviewerRows,
  totalBatches: index.totalBatches,
  coveredRows: index.coveredRows,
  remainingRows: index.remainingRows,
  missingImageRows: index.missingImageRows,
  sourceFolderMayBeDeleted: index.sourceFolderMayBeDeleted,
}, null, 2));
