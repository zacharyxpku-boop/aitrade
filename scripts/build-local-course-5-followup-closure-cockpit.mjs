import fs from "node:fs";
import path from "node:path";

const paths = {
  retention: "docs/LOCAL_COURSE_5_SOURCE_RETENTION_MANIFEST.json",
  router: "docs/LOCAL_COURSE_5_OCR_VISUAL_EXECUTION_ROUTER.json",
  teaching: "docs/LOCAL_COURSE_5_TEACHING_MODULE_DISTILLATION.json",
  zipExecution: "docs/LOCAL_COURSE_5_ZIP_IMAGE_PACKAGE_EXECUTION_PACK.json",
  zipDrafts: "docs/LOCAL_COURSE_5_ZIP_MACHINE_VISUAL_SEMANTIC_DRAFTS.json",
  zipValidation: "docs/LOCAL_COURSE_5_ZIP_IMAGE_PACKAGE_REVIEW_INPUT_VALIDATION.json",
  pdfExecution: "docs/LOCAL_COURSE_5_PDF_OCR_VISUAL_EXECUTION_PACK.json",
  pdfDrafts: "docs/LOCAL_COURSE_5_PDF_MACHINE_VISUAL_SEMANTIC_DRAFTS.json",
  pdfValidation: "docs/LOCAL_COURSE_5_PDF_OCR_VISUAL_REVIEW_INPUT_VALIDATION.json",
  deletion: "docs/LOCAL_COURSE_5_DELETION_READINESS.json",
};

const outputJson = "docs/LOCAL_COURSE_5_FOLLOWUP_CLOSURE_COCKPIT.json";
const outputMd = "docs/LOCAL_COURSE_5_FOLLOWUP_CLOSURE_COCKPIT.md";
const outputHtml = "docs/local-course-5-followup-closure-cockpit.html";

const boundary = "Course 5 follow-up closure cockpit is private reviewer-facing education operations material. It unifies source-retention, OCR/visual routing, PDF and ZIP execution packs, machine semantic drafts, reviewer-input validations, teaching-module distillation, and deletion-readiness gates. It does not perform OCR, generate reviewer conclusions, accept machine drafts as human review, delete files, approve source-folder deletion, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

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

function docsHref(filePath) {
  return path.relative("docs", filePath).replace(/\\/g, "/");
}

const artifacts = Object.fromEntries(Object.entries(paths).map(([key, file]) => [key, readJson(file)]));
for (const [name, artifact] of Object.entries(artifacts)) {
  assertBoundary(name, artifact);
}

const sampleRows = artifacts.zipExecution.sampleRowCount + artifacts.pdfExecution.sampleRowCount;
const machineDraftRows = artifacts.zipDrafts.zipDraftRows + artifacts.pdfDrafts.pdfDraftRows;
const validationInputRows = artifacts.zipValidation.inputRows + artifacts.pdfValidation.inputRows;
const readyInputRows = artifacts.zipValidation.readyRows + artifacts.pdfValidation.readyRows;
const blockedInputRows = artifacts.zipValidation.blockedRows + artifacts.pdfValidation.blockedRows;
const missingFieldRows = artifacts.zipValidation.missingFieldRows + artifacts.pdfValidation.missingFieldRows;
const acceptedForModuleDistillationRows =
  artifacts.zipValidation.acceptedForModuleDistillationRows +
  artifacts.pdfValidation.acceptedForModuleDistillationRows;
const acceptedForDeletionReadinessRows =
  artifacts.zipValidation.acceptedForDeletionReadinessRows +
  artifacts.pdfValidation.acceptedForDeletionReadinessRows;

const workstreams = [
  {
    workstream: "pdf_ocr_visual_review",
    sourceRows: artifacts.pdfExecution.pdfRows,
    sourcePages: artifacts.pdfExecution.totalPages,
    sampleRows: artifacts.pdfExecution.sampleRowCount,
    machineDraftRows: artifacts.pdfDrafts.pdfDraftRows,
    inputRows: artifacts.pdfValidation.inputRows,
    readyRows: artifacts.pdfValidation.readyRows,
    blockedRows: artifacts.pdfValidation.blockedRows,
    missingFieldRows: artifacts.pdfValidation.missingFieldRows,
    localOcrAvailable: artifacts.pdfExecution.localOcrAvailable,
    canFullyResolveWithLocalToolsNowRows: artifacts.pdfExecution.canFullyResolveWithLocalToolsNowRows,
    status: artifacts.pdfValidation.validationStatus,
    executionPack: paths.pdfExecution,
    machineDrafts: paths.pdfDrafts,
    validation: paths.pdfValidation,
  },
  {
    workstream: "zip_image_package_review",
    sourceRows: artifacts.zipExecution.zipRows,
    sourceImageEntries: artifacts.zipExecution.totalImageEntries,
    sampleRows: artifacts.zipExecution.sampleRowCount,
    machineDraftRows: artifacts.zipDrafts.zipDraftRows,
    inputRows: artifacts.zipValidation.inputRows,
    readyRows: artifacts.zipValidation.readyRows,
    blockedRows: artifacts.zipValidation.blockedRows,
    missingFieldRows: artifacts.zipValidation.missingFieldRows,
    localOcrAvailable: false,
    canFullyResolveWithLocalToolsNowRows: artifacts.zipExecution.canFullyResolveWithLocalToolsNowRows,
    status: artifacts.zipValidation.validationStatus,
    executionPack: paths.zipExecution,
    machineDrafts: paths.zipDrafts,
    validation: paths.zipValidation,
  },
];

const closure = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  cockpitStatus: "course_5_followup_closure_cockpit_ready_folder_deletion_blocked",
  sourceRoot: artifacts.retention.sourceRoot,
  sourceFolderMayBeDeleted: false,
  currentKnowledgeArtifactsCanReplaceSourceFolder: false,
  totalFiles: artifacts.retention.totalFiles,
  uniquePrimaryRows: artifacts.retention.uniquePrimaryRows,
  textAbsorbedRows: artifacts.teaching.textAbsorbedRows,
  totalExtractedChars: artifacts.teaching.totalExtractedChars,
  followupRequiredRows: artifacts.retention.followupRequiredRows,
  unresolvedSourceRows: artifacts.router.unresolvedSourceRows,
  pdfFollowupRows: artifacts.router.pdfRows,
  zipFollowupRows: artifacts.router.zipRows,
  fullTextOcrRequiredRows: artifacts.router.fullTextOcrRequiredRows,
  ocrUnavailableBlockingRows: artifacts.router.ocrUnavailableBlockingRows,
  canAdvanceWithVisualReviewNowRows: artifacts.router.canAdvanceWithVisualReviewNowRows,
  canFullyResolveWithLocalToolsNowRows: artifacts.router.canFullyResolveWithLocalToolsNowRows,
  teachingModules: artifacts.teaching.modules,
  lessonSeeds: artifacts.teaching.totalLessonSeeds,
  evidenceAnchors: artifacts.teaching.totalEvidenceAnchors,
  modulesBlockedByVisualOrOcr: artifacts.teaching.modulesBlockedByVisualOrOcr,
  learnerReadyModules: 0,
  sampleRows,
  machineDraftRows,
  validationInputRows,
  readyInputRows,
  blockedInputRows,
  missingFieldRows,
  acceptedForModuleDistillationRows,
  acceptedForDeletionReadinessRows,
  zipImageEntries: artifacts.zipExecution.totalImageEntries,
  pdfPages: artifacts.pdfExecution.totalPages,
  deletionGate: {
    readinessStatus: artifacts.deletion.readinessStatus,
    sourceFolderStillPresentAtBuild: artifacts.deletion.sourceFolderStillPresentAtBuild,
    deleteExecutedNow: artifacts.deletion.deleteExecutedNow,
    deletionRequiresExplicitUserConfirmation: artifacts.deletion.deletionRequiresExplicitUserConfirmation,
    reason: artifacts.deletion.reason,
  },
  closureBlockers: [
    {
      blocker: "pdf_ocr_or_real_visual_review_missing",
      count: artifacts.pdfValidation.blockedRows,
      evidence: paths.pdfValidation,
    },
    {
      blocker: "zip_real_visual_review_missing",
      count: artifacts.zipValidation.blockedRows,
      evidence: paths.zipValidation,
    },
    {
      blocker: "ocr_engine_unavailable_for_full_text_pdf_resolution",
      count: artifacts.router.ocrUnavailableBlockingRows,
      evidence: paths.router,
    },
    {
      blocker: "no_rows_accepted_for_module_distillation_or_deletion_readiness",
      count: validationInputRows,
      evidence: paths.teaching,
    },
  ],
  workstreams,
  nextOperationalGates: [
    "Install or provide a trusted OCR path for the 41 PDF follow-up rows, or keep those source files in cold storage.",
    "Fill real OCR/visual reviewer fields for 121 PDF sample rows and re-run PDF input validation.",
    "Fill real visual reviewer fields for 85 ZIP image-package sample rows and re-run ZIP input validation.",
    "Only after validation has ready rows, merge accepted paraphrased concepts into teaching-module distillation.",
    "Recompute deletion readiness after all 49 follow-up source rows have accepted replacement evidence or explicit future-loss acceptance.",
  ],
  commands: [
    "npm.cmd run build:local-course-5-followup-closure-cockpit",
    "npm.cmd run check:local-course-5-followup-closure-cockpit",
    "npm.cmd run verify",
  ],
  sourceArtifacts: paths,
  completionRule: "This closure cockpit is complete when it proves every Course 5 follow-up source row is represented in PDF/ZIP execution, machine-draft orientation, reviewer-input validation, teaching-module status, and deletion-readiness gates, while keeping deletion and learner-facing release blocked until real OCR/reviewer evidence is accepted.",
  boundary,
};

fs.writeFileSync(outputJson, `${JSON.stringify(closure, null, 2)}\n`, "utf8");

fs.writeFileSync(outputMd, [
  "# Course 5 Follow-up Closure Cockpit",
  "",
  `- Cockpit status: ${closure.cockpitStatus}`,
  `- Source root: ${closure.sourceRoot}`,
  `- Source folder may be deleted: ${closure.sourceFolderMayBeDeleted}`,
  `- Current knowledge artifacts can replace source folder: ${closure.currentKnowledgeArtifactsCanReplaceSourceFolder}`,
  `- Total files: ${closure.totalFiles}`,
  `- Text absorbed rows: ${closure.textAbsorbedRows}/${closure.uniquePrimaryRows}`,
  `- Follow-up required rows: ${closure.followupRequiredRows}`,
  `- Unresolved source rows: ${closure.unresolvedSourceRows}`,
  `- PDF follow-up rows: ${closure.pdfFollowupRows}`,
  `- ZIP follow-up rows: ${closure.zipFollowupRows}`,
  `- PDF pages requiring OCR/visual route: ${closure.pdfPages}`,
  `- ZIP image entries requiring visual route: ${closure.zipImageEntries}`,
  `- Sample rows: ${closure.sampleRows}`,
  `- Machine draft rows: ${closure.machineDraftRows}`,
  `- Reviewer input rows: ${closure.validationInputRows}`,
  `- Ready input rows: ${closure.readyInputRows}`,
  `- Blocked input rows: ${closure.blockedInputRows}`,
  `- Accepted for module distillation rows: ${closure.acceptedForModuleDistillationRows}`,
  `- Accepted for deletion readiness rows: ${closure.acceptedForDeletionReadinessRows}`,
  `- Learner-ready modules: ${closure.learnerReadyModules}`,
  "",
  "## Workstreams",
  "",
  "| Workstream | Sources | Samples | Drafts | Ready | Blocked | Status |",
  "|---|---:|---:|---:|---:|---:|---|",
  ...workstreams.map((row) => `| ${row.workstream} | ${row.sourceRows} | ${row.sampleRows} | ${row.machineDraftRows} | ${row.readyRows} | ${row.blockedRows} | ${row.status} |`),
  "",
  "## Closure Blockers",
  "",
  ...closure.closureBlockers.map((row) => `- ${row.blocker}: ${row.count} (${row.evidence})`),
  "",
  "## Boundary",
  "",
  boundary,
  "",
].join("\n"), "utf8");

const metricRows = [
  ["Follow-up source rows", closure.followupRequiredRows],
  ["PDF sample rows", artifacts.pdfExecution.sampleRowCount],
  ["ZIP sample rows", artifacts.zipExecution.sampleRowCount],
  ["Machine draft rows", closure.machineDraftRows],
  ["Ready reviewer input rows", closure.readyInputRows],
  ["Blocked reviewer input rows", closure.blockedInputRows],
  ["Learner-ready modules", closure.learnerReadyModules],
  ["Source folder may be deleted", closure.sourceFolderMayBeDeleted],
];

const metricHtml = metricRows.map(([label, value]) => `
      <div class="metric"><b>${htmlEscape(value)}</b><span>${htmlEscape(label)}</span></div>`).join("");

const workstreamHtml = workstreams.map((row) => `
        <tr>
          <td>${htmlEscape(row.workstream)}</td>
          <td>${row.sourceRows}</td>
          <td>${row.sampleRows}</td>
          <td>${row.machineDraftRows}</td>
          <td>${row.readyRows}</td>
          <td>${row.blockedRows}</td>
          <td><a href="${htmlEscape(docsHref(row.executionPack))}">execution</a></td>
          <td><a href="${htmlEscape(docsHref(row.machineDrafts))}">drafts</a></td>
          <td><a href="${htmlEscape(docsHref(row.validation))}">validation</a></td>
        </tr>`).join("");

fs.writeFileSync(outputHtml, `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Course 5 Follow-up Closure Cockpit</title>
  <style>
    :root { font-family: Arial, Helvetica, sans-serif; background: #f7f7f3; color: #20211f; }
    body { margin: 0; }
    header { background: #ffffff; border-bottom: 1px solid #d9d9d2; padding: 18px 24px; }
    h1 { margin: 0 0 8px; font-size: 24px; letter-spacing: 0; }
    .subtle { color: #5c625b; font-size: 13px; }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; padding: 18px 24px; }
    .metric { background: #ffffff; border: 1px solid #d5d8d0; border-radius: 8px; padding: 12px; }
    .metric b { display: block; font-size: 22px; margin-bottom: 5px; }
    .metric span { color: #5c625b; font-size: 12px; }
    main { padding: 0 24px 24px; }
    table { width: 100%; border-collapse: collapse; background: #ffffff; border: 1px solid #d5d8d0; border-radius: 8px; overflow: hidden; }
    th, td { border-bottom: 1px solid #e3e5df; padding: 8px 10px; text-align: left; font-size: 13px; vertical-align: top; }
    th { background: #eef0eb; }
    a { color: #285f7a; }
    footer { padding: 18px 24px 30px; color: #55584f; font-size: 12px; line-height: 1.5; }
  </style>
</head>
<body>
  <header>
    <h1>Course 5 Follow-up Closure Cockpit</h1>
    <div class="subtle">${htmlEscape(closure.cockpitStatus)}</div>
  </header>
  <section class="metrics">${metricHtml}
  </section>
  <main>
    <table>
      <thead><tr><th>Workstream</th><th>Sources</th><th>Samples</th><th>Drafts</th><th>Ready</th><th>Blocked</th><th>Execution</th><th>Drafts</th><th>Validation</th></tr></thead>
      <tbody>${workstreamHtml}</tbody>
    </table>
  </main>
  <footer>${htmlEscape(boundary)}</footer>
</body>
</html>
`, "utf8");

console.log(JSON.stringify({
  ok: true,
  cockpitStatus: closure.cockpitStatus,
  followupRequiredRows: closure.followupRequiredRows,
  sampleRows: closure.sampleRows,
  machineDraftRows: closure.machineDraftRows,
  readyInputRows: closure.readyInputRows,
  blockedInputRows: closure.blockedInputRows,
  sourceFolderMayBeDeleted: closure.sourceFolderMayBeDeleted,
}, null, 2));
