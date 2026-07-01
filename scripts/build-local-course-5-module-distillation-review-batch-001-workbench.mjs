import fs from "node:fs";
import path from "node:path";

const batchPath = "docs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_001.json";
const outputJson = "docs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_001_WORKBENCH.json";
const outputHtml = "docs/local-course-5-module-distillation-review-batch-001-workbench.html";

const boundary = "Course 5 module distillation review batch 001 visual workbench is readonly private reviewer-facing education operations material. It displays extracted sample images, module targets, lesson seeds, reviewer questions, and blank-input status for human/OCR review. It does not generate reviewer conclusions, accept machine drafts as human review, delete files, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

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
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function relFromDocs(filePath) {
  return path.relative("docs", filePath).replace(/\\/g, "/");
}

const batch = readJson(batchPath);
assertBoundary("batch", batch);
if (batch.selectedRows !== 40 || !Array.isArray(batch.batchRows)) fail("batch 001 must have 40 rows");

const workbenchRows = batch.batchRows.map((row) => {
  if (!fs.existsSync(row.sampleImagePath)) fail(`missing sample image: ${row.sampleImagePath}`);
  return {
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
    evidenceAnchorPaths: (row.evidenceAnchors || []).map((anchor) => anchor.relativePath),
    candidateConcepts: row.candidateConcepts || [],
    reviewerQuestions: row.reviewerQuestions || [],
    riskFlags: row.riskFlags || [],
    validationStatus: row.validationStatus,
    acceptedForModuleDistillation: false,
    acceptedForDeletionReadiness: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    productionReady: false,
    writeAllowedNow: false,
  };
});

const moduleRows = [...new Map(workbenchRows.map((row) => [row.primaryModuleId, null])).keys()].map((moduleId) => {
  const rows = workbenchRows.filter((row) => row.primaryModuleId === moduleId);
  return {
    moduleId,
    rows: rows.length,
    p0Rows: rows.filter((row) => row.sourceTier === "P0").length,
    nonP0Rows: rows.filter((row) => row.sourceTier !== "P0").length,
    sampleKinds: [...new Set(rows.map((row) => row.sampleKind))].sort(),
  };
});

const artifact = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  workbenchStatus: "course_5_module_distillation_review_batch_001_visual_workbench_ready_readonly_blocked",
  workbenchMode: "readonly_local_html_visual_review_navigation",
  sourceBatch: batchPath,
  htmlPath: outputHtml,
  selectedRows: workbenchRows.length,
  modulesCovered: moduleRows.length,
  p0Rows: workbenchRows.filter((row) => row.sourceTier === "P0").length,
  nonP0Rows: workbenchRows.filter((row) => row.sourceTier !== "P0").length,
  readyRows: 0,
  blockedRows: workbenchRows.length,
  missingImageRows: 0,
  sourceFolderMayBeDeleted: false,
  learnerReadyModules: 0,
  moduleRows,
  rows: workbenchRows,
  commands: [
    "npm.cmd run build:local-course-5-module-distillation-review-batch-001-workbench",
    "npm.cmd run check:local-course-5-module-distillation-review-batch-001-workbench",
    "npm.cmd run verify",
  ],
  completionRule: "The visual workbench is ready when all 40 batch rows render as local image cards with module targets, lesson seeds, reviewer questions, risk flags, and locked blocked status. It does not replace OCR, human review, public grounding, release approval, or deletion readiness.",
  boundary,
};

fs.writeFileSync(outputJson, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");

const cards = workbenchRows.map((row) => `
      <article class="card" data-module="${htmlEscape(row.primaryModuleId)}">
        <div class="meta">
          <span>#${row.batchPriority}</span>
          <span>${htmlEscape(row.sourceTier)}</span>
          <span>${htmlEscape(row.primaryModuleId)}</span>
          <span>${htmlEscape(row.validationStatus)}</span>
        </div>
        <img src="${htmlEscape(row.htmlImageSrc)}" alt="${htmlEscape(row.batchRowId)} sample image" loading="lazy" />
        <h2>${htmlEscape(row.primaryModuleId)}</h2>
        <p class="source">${htmlEscape(row.sourceRelativePath)}</p>
        <section>
          <h3>Lesson Seeds</h3>
          <ul>${row.lessonSeedTitles.map((item) => `<li>${htmlEscape(item)}</li>`).join("")}</ul>
        </section>
        <section>
          <h3>Reviewer Questions</h3>
          <ul>${row.reviewerQuestions.slice(0, 4).map((item) => `<li>${htmlEscape(item)}</li>`).join("")}</ul>
        </section>
        <section>
          <h3>Risk Flags</h3>
          <p class="chips">${row.riskFlags.map((item) => `<span>${htmlEscape(item)}</span>`).join("")}</p>
        </section>
      </article>`).join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Course 5 Batch 001 Visual Workbench</title>
  <style>
    :root { color-scheme: light; font-family: Arial, Helvetica, sans-serif; background: #f7f7f4; color: #20211f; }
    body { margin: 0; }
    header { position: sticky; top: 0; z-index: 2; background: #ffffff; border-bottom: 1px solid #d8d8d0; padding: 16px 24px; }
    h1 { margin: 0 0 8px; font-size: 22px; letter-spacing: 0; }
    .summary { display: flex; flex-wrap: wrap; gap: 8px; color: #484a45; font-size: 13px; }
    .summary span, .meta span, .chips span { border: 1px solid #c9ccc3; border-radius: 999px; padding: 4px 8px; background: #fff; }
    main { padding: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }
    .card { background: #ffffff; border: 1px solid #d5d7cf; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; min-width: 0; }
    .meta { display: flex; gap: 6px; flex-wrap: wrap; padding: 10px; font-size: 12px; }
    img { width: 100%; height: 260px; object-fit: contain; background: #eceee8; border-top: 1px solid #e0e1dc; border-bottom: 1px solid #e0e1dc; }
    h2 { font-size: 18px; margin: 12px 12px 4px; letter-spacing: 0; }
    h3 { font-size: 13px; margin: 12px 12px 6px; color: #55584f; letter-spacing: 0; }
    .source { margin: 0 12px; font-size: 12px; line-height: 1.4; color: #666960; word-break: break-word; }
    ul { margin: 0 12px 4px 28px; padding: 0; font-size: 13px; line-height: 1.45; }
    .chips { margin: 0 12px 14px; display: flex; flex-wrap: wrap; gap: 6px; font-size: 12px; }
    footer { padding: 20px 24px 32px; color: #55584f; font-size: 12px; line-height: 1.5; }
  </style>
</head>
<body>
  <header>
    <h1>Course 5 Batch 001 Visual Workbench</h1>
    <div class="summary">
      <span>${artifact.selectedRows} rows</span>
      <span>${artifact.modulesCovered} modules</span>
      <span>${artifact.p0Rows} P0</span>
      <span>${artifact.nonP0Rows} non-P0</span>
      <span>${artifact.blockedRows} blocked</span>
      <span>readonly</span>
    </div>
  </header>
  <main>
${cards}
  </main>
  <footer>${htmlEscape(boundary)}</footer>
</body>
</html>
`;

fs.writeFileSync(outputHtml, html, "utf8");

console.log(JSON.stringify({
  ok: true,
  workbenchStatus: artifact.workbenchStatus,
  htmlPath: artifact.htmlPath,
  selectedRows: artifact.selectedRows,
  modulesCovered: artifact.modulesCovered,
  p0Rows: artifact.p0Rows,
  nonP0Rows: artifact.nonP0Rows,
  missingImageRows: artifact.missingImageRows,
  sourceFolderMayBeDeleted: artifact.sourceFolderMayBeDeleted,
}, null, 2));
