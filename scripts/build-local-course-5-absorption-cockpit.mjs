import fs from "node:fs";
import path from "node:path";

const intakePath = "docs/LOCAL_COURSE_5_DOCUMENT_INTAKE.json";
const distillationPath = "docs/LOCAL_COURSE_5_TEACHING_MODULE_DISTILLATION.json";
const batchIndexPath = "docs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_INDEX.json";
const deletionPath = "docs/LOCAL_COURSE_5_DELETION_READINESS.json";
const controlAuditPath = "docs/LOCAL_COURSE_5_FOLLOWUP_ABSORPTION_CONTROL_AUDIT.json";

const outputJson = "docs/LOCAL_COURSE_5_ABSORPTION_COCKPIT.json";
const outputMd = "docs/LOCAL_COURSE_5_ABSORPTION_COCKPIT.md";
const outputHtml = "docs/local-course-5-absorption-cockpit.html";

const boundary = "Course 5 absorption cockpit is private reviewer-facing education operations material. It summarizes source intake, teaching-module seeds, visual/OCR review batches, reviewer-input gates, and deletion readiness for local supplemental course files. It does not generate reviewer conclusions, accept machine drafts as human review, delete files, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

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

function hrefFromDocs(filePath) {
  return path.relative("docs", filePath).replace(/\\/g, "/");
}

const intake = readJson(intakePath);
const distillation = readJson(distillationPath);
const batchIndex = readJson(batchIndexPath);
const deletion = readJson(deletionPath);
const controlAudit = readJson(controlAuditPath);

for (const [name, artifact] of Object.entries({ intake, distillation, batchIndex, deletion, controlAudit })) {
  assertBoundary(name, artifact);
}

const batchRows = (batchIndex.batchRows || []).map((row) => {
  const validation = readJson(row.validationJson);
  const workbenchExists = fs.existsSync(row.workbenchHtml);
  return {
    batchNo: row.batchNo,
    batchId: row.batchId,
    selectedRows: row.selectedRows,
    modulesCovered: row.modulesCovered,
    p0Rows: row.p0Rows,
    nonP0Rows: row.nonP0Rows,
    readyRows: validation.readyRows || 0,
    blockedRows: validation.blockedRows || row.blockedRows,
    validationStatus: validation.validationStatus,
    workbenchHtml: row.workbenchHtml,
    workbenchHref: hrefFromDocs(row.workbenchHtml),
    inputCopyJson: row.inputCopyJson,
    validationJson: row.validationJson,
    workbenchExists,
    sourceFolderMayBeDeleted: false,
  };
});

const cockpit = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  cockpitStatus: "course_5_absorption_cockpit_ready_release_and_deletion_blocked",
  sourceRoot: intake.sourceRoot,
  sourceFolderMayBeDeleted: false,
  sourceFolderStillPresentAtBuild: deletion.sourceFolderStillPresentAtBuild,
  currentKnowledgeArtifactsCanReplaceSourceFolder: false,
  totalFiles: intake.totalFiles,
  uniquePrimaryRows: intake.uniquePrimaryRows,
  textAbsorbedRows: intake.textAbsorbedRows,
  followupRequiredRows: intake.followupRequiredRows,
  totalExtractedChars: intake.totalExtractedChars,
  teachingModules: distillation.modules,
  modulesWithLessonSeeds: distillation.modulesWithLessonSeeds,
  totalLessonSeeds: distillation.totalLessonSeeds,
  modulesWithEvidenceAnchors: distillation.modulesWithEvidenceAnchors,
  totalEvidenceAnchors: distillation.totalEvidenceAnchors,
  modulesBlockedByVisualOrOcr: distillation.modulesBlockedByVisualOrOcr,
  visualOcrReviewerCards: batchIndex.totalReviewerRows,
  visualOcrBatches: batchIndex.totalBatches,
  visualOcrCardsBatched: batchIndex.coveredRows,
  visualOcrCardsUnbatched: batchIndex.remainingRows,
  visualOcrMissingImages: batchIndex.missingImageRows,
  visualOcrReadyRows: batchRows.reduce((sum, row) => sum + row.readyRows, 0),
  visualOcrBlockedRows: batchRows.reduce((sum, row) => sum + row.blockedRows, 0),
  readyReviewerNotes: controlAudit.readyReviewerNotes || 0,
  acceptedForModuleDistillationRows: controlAudit.acceptedForModuleDistillationRows || 0,
  acceptedForDeletionReadinessRows: controlAudit.acceptedForDeletionReadinessRows || 0,
  learnerReadyModules: 0,
  deletionBlockers: {
    blockingFollowupRows: deletion.blockerEvidence?.blockingFollowupRows || deletion.blockingFollowupRows || 49,
    pdfFollowupRows: deletion.blockerEvidence?.pdfFollowupRows || deletion.pdfFollowupRows || 41,
    zipFollowupRows: deletion.blockerEvidence?.zipFollowupRows || deletion.zipFollowupRows || 8,
    ocrEngineAvailable: deletion.visualEvidence?.ocrEngineAvailable === true,
    currentBlockingReason: deletion.completionGate?.currentBlockingReason || deletion.reason,
  },
  nextOperationalGates: [
    "Fill real reviewer/OCR inputs for visual/OCR batches.",
    "Validate filled batch inputs and keep unsafe rows blocked.",
    "Route validated rows into paraphrased module distillation merge previews.",
    "Resolve public grounding and originality gates before learner-facing use.",
    "Recompute deletion readiness only after blocker rows are resolved or explicitly accepted as future-loss limitations.",
  ],
  batchRows,
  commands: [
    "npm.cmd run build:local-course-5-absorption-cockpit",
    "npm.cmd run check:local-course-5-absorption-cockpit",
    "npm.cmd run verify",
  ],
  completionRule: "The Course 5 absorption cockpit is ready when it summarizes all source intake, teaching-module seed, batch review, reviewer-input, and deletion-readiness gates with links to each visual workbench and keeps deletion/learner release blocked until real reviewer/OCR input and approval gates pass.",
  boundary,
};

fs.writeFileSync(outputJson, `${JSON.stringify(cockpit, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Course 5 Absorption Cockpit",
  "",
  `- Cockpit status: ${cockpit.cockpitStatus}`,
  `- Source root: ${cockpit.sourceRoot}`,
  `- Files: ${cockpit.totalFiles}`,
  `- Text absorbed rows: ${cockpit.textAbsorbedRows}/${cockpit.uniquePrimaryRows}`,
  `- Follow-up required rows: ${cockpit.followupRequiredRows}`,
  `- Teaching modules: ${cockpit.teachingModules}`,
  `- Lesson seeds: ${cockpit.totalLessonSeeds}`,
  `- Evidence anchors: ${cockpit.totalEvidenceAnchors}`,
  `- Visual/OCR cards batched: ${cockpit.visualOcrCardsBatched}/${cockpit.visualOcrReviewerCards}`,
  `- Visual/OCR batches: ${cockpit.visualOcrBatches}`,
  `- Visual/OCR ready rows: ${cockpit.visualOcrReadyRows}`,
  `- Visual/OCR blocked rows: ${cockpit.visualOcrBlockedRows}`,
  `- Source folder may be deleted: ${cockpit.sourceFolderMayBeDeleted}`,
  "",
  "## Batch Rows",
  "",
  "| Batch | Rows | Ready | Blocked | P0 | Non-P0 | Workbench |",
  "|---|---:|---:|---:|---:|---:|---|",
  ...batchRows.map((row) => `| ${row.batchNo} | ${row.selectedRows} | ${row.readyRows} | ${row.blockedRows} | ${row.p0Rows} | ${row.nonP0Rows} | ${row.workbenchHtml} |`),
  "",
  "## Boundary",
  "",
  boundary,
  "",
].join("\n"), "utf8");

const cards = batchRows.map((row) => `
        <tr>
          <td>${htmlEscape(row.batchNo)}</td>
          <td>${row.selectedRows}</td>
          <td>${row.readyRows}</td>
          <td>${row.blockedRows}</td>
          <td>${row.p0Rows}</td>
          <td>${row.nonP0Rows}</td>
          <td><a href="${htmlEscape(row.workbenchHref)}">Open</a></td>
          <td>${htmlEscape(row.validationStatus)}</td>
        </tr>`).join("\n");

fs.writeFileSync(outputHtml, `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Course 5 Absorption Cockpit</title>
  <style>
    :root { font-family: Arial, Helvetica, sans-serif; background: #f5f6f2; color: #20211f; }
    body { margin: 0; }
    header { background: #fff; border-bottom: 1px solid #d8d8d0; padding: 18px 24px; }
    h1 { margin: 0 0 10px; font-size: 24px; letter-spacing: 0; }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; padding: 18px 24px; }
    .metric { background: #fff; border: 1px solid #d5d7cf; border-radius: 8px; padding: 12px; }
    .metric b { display: block; font-size: 22px; margin-bottom: 4px; }
    .metric span { color: #5d6259; font-size: 12px; }
    main { padding: 0 24px 24px; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #d5d7cf; border-radius: 8px; overflow: hidden; }
    th, td { border-bottom: 1px solid #e4e5df; padding: 8px 10px; text-align: left; font-size: 13px; vertical-align: top; }
    th { background: #eceee8; }
    a { color: #285f7a; }
    footer { padding: 20px 24px 32px; color: #55584f; font-size: 12px; line-height: 1.5; }
  </style>
</head>
<body>
  <header>
    <h1>Course 5 Absorption Cockpit</h1>
    <div>${htmlEscape(cockpit.cockpitStatus)}</div>
  </header>
  <section class="metrics">
    <div class="metric"><b>${cockpit.textAbsorbedRows}/${cockpit.uniquePrimaryRows}</b><span>text absorbed rows</span></div>
    <div class="metric"><b>${cockpit.totalLessonSeeds}</b><span>lesson seeds</span></div>
    <div class="metric"><b>${cockpit.visualOcrCardsBatched}/${cockpit.visualOcrReviewerCards}</b><span>visual/OCR cards batched</span></div>
    <div class="metric"><b>${cockpit.visualOcrReadyRows}</b><span>ready reviewer rows</span></div>
    <div class="metric"><b>${cockpit.visualOcrBlockedRows}</b><span>blocked reviewer rows</span></div>
    <div class="metric"><b>${cockpit.sourceFolderMayBeDeleted}</b><span>source folder may be deleted</span></div>
  </section>
  <main>
    <table>
      <thead><tr><th>Batch</th><th>Rows</th><th>Ready</th><th>Blocked</th><th>P0</th><th>Non-P0</th><th>Workbench</th><th>Validation</th></tr></thead>
      <tbody>${cards}</tbody>
    </table>
  </main>
  <footer>${htmlEscape(boundary)}</footer>
</body>
</html>
`, "utf8");

console.log(JSON.stringify({
  ok: true,
  cockpitStatus: cockpit.cockpitStatus,
  totalFiles: cockpit.totalFiles,
  visualOcrCardsBatched: cockpit.visualOcrCardsBatched,
  visualOcrReviewerCards: cockpit.visualOcrReviewerCards,
  visualOcrBatches: cockpit.visualOcrBatches,
  visualOcrReadyRows: cockpit.visualOcrReadyRows,
  visualOcrBlockedRows: cockpit.visualOcrBlockedRows,
  sourceFolderMayBeDeleted: cockpit.sourceFolderMayBeDeleted,
}, null, 2));
