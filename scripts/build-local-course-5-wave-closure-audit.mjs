import fs from "node:fs";

const outputJson = "docs/LOCAL_COURSE_5_WAVE_CLOSURE_AUDIT.json";
const outputMd = "docs/LOCAL_COURSE_5_WAVE_CLOSURE_AUDIT.md";
const outputHtml = "docs/local-course-5-wave-closure-audit.html";

const deletionPath = "docs/LOCAL_COURSE_5_DELETION_READINESS.json";
const priorityPlanPath = "docs/LOCAL_COURSE_5_BLOCKER_RESOLUTION_PRIORITY_PLAN.json";

const waves = [
  {
    waveNo: 1,
    waveKey: "wave_1_p0_space_and_curriculum_blockers",
    label: "Wave 1 P0 space and curriculum blockers",
    expectedSourceRows: 3,
    expectedSampleRows: 18,
    executionPath: "docs/LOCAL_COURSE_5_WAVE_1_P0_EXECUTION_PACK.json",
    validationPath: "docs/LOCAL_COURSE_5_WAVE_1_P0_REVIEWER_INPUT_VALIDATION.json",
    routePath: "docs/LOCAL_COURSE_5_WAVE_1_P0_POST_INPUT_ROUTE_MAP.json",
  },
  {
    waveNo: 2,
    waveKey: "wave_2_p1_high_value_blockers",
    label: "Wave 2 P1 high-value blockers",
    expectedSourceRows: 2,
    expectedSampleRows: 15,
    executionPath: "docs/LOCAL_COURSE_5_WAVE_2_P1_EXECUTION_PACK.json",
    validationPath: "docs/LOCAL_COURSE_5_WAVE_2_P1_REVIEWER_INPUT_VALIDATION.json",
    routePath: "docs/LOCAL_COURSE_5_WAVE_2_P1_POST_INPUT_ROUTE_MAP.json",
  },
  {
    waveNo: 3,
    waveKey: "wave_3_locally_resolvable_zip_visuals",
    label: "Wave 3 locally resolvable ZIP visuals",
    expectedSourceRows: 6,
    expectedSampleRows: 61,
    executionPath: "docs/LOCAL_COURSE_5_WAVE_3_ZIP_EXECUTION_PACK.json",
    validationPath: "docs/LOCAL_COURSE_5_WAVE_3_ZIP_REVIEWER_INPUT_VALIDATION.json",
    routePath: "docs/LOCAL_COURSE_5_WAVE_3_ZIP_POST_INPUT_ROUTE_MAP.json",
  },
  {
    waveNo: 4,
    waveKey: "wave_4_course_core_pdf_ocr_blockers",
    label: "Wave 4 course-core PDF OCR blockers",
    expectedSourceRows: 9,
    expectedSampleRows: 27,
    executionPath: "docs/LOCAL_COURSE_5_WAVE_4_PDF_EXECUTION_PACK.json",
    validationPath: "docs/LOCAL_COURSE_5_WAVE_4_PDF_REVIEWER_INPUT_VALIDATION.json",
    routePath: "docs/LOCAL_COURSE_5_WAVE_4_PDF_POST_INPUT_ROUTE_MAP.json",
  },
  {
    waveNo: 5,
    waveKey: "wave_5_remaining_pdf_ocr_or_future_loss_decisions",
    label: "Wave 5 remaining PDF OCR or future-loss decisions",
    expectedSourceRows: 29,
    expectedSampleRows: 85,
    executionPath: "docs/LOCAL_COURSE_5_WAVE_5_PDF_EXECUTION_PACK.json",
    validationPath: "docs/LOCAL_COURSE_5_WAVE_5_PDF_REVIEWER_INPUT_VALIDATION.json",
    routePath: "docs/LOCAL_COURSE_5_WAVE_5_PDF_POST_INPUT_ROUTE_MAP.json",
  },
];

const boundary = "Course 5 wave closure audit is private reviewer-facing education operations material. It proves that Wave 1 through Wave 5 cover every current Course 5 follow-up source row and representative sample row with execution-pack, reviewer-input validation, and post-input route-map gates while keeping all release, write, module-merge, and deletion gates closed until real accepted reviewer evidence, public grounding, originality review, and explicit approval exist. It does not perform OCR, generate reviewer conclusions, accept machine drafts as human review, merge content into learner-facing modules, delete files, approve source-folder deletion, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

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
  if (artifact.sourceFolderMayBeDeleted !== false) fail(`${name} must keep sourceFolderMayBeDeleted:false`);
}

function htmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const deletion = readJson(deletionPath);
const priorityPlan = readJson(priorityPlanPath);
assertBoundary("deletion readiness", deletion);
assertBoundary("priority plan", priorityPlan);

const sourceRecordIds = new Set();
const sampleReviewRowIds = new Set();

const waveSummaries = waves.map((wave) => {
  const execution = readJson(wave.executionPath);
  const validation = readJson(wave.validationPath);
  const route = readJson(wave.routePath);

  assertBoundary(`${wave.label} execution pack`, execution);
  assertBoundary(`${wave.label} validation`, validation);
  assertBoundary(`${wave.label} route map`, route);

  const executionSourceRows = execution.sourceRowsDetail || [];
  const executionSampleRows = execution.sampleRowsDetail || [];
  const validationRows = validation.validationRows || [];
  const routeRows = route.routeRowsDetail || [];

  for (const row of executionSourceRows) {
    const key = row.recordId || row.sourceRowId || row.relativePath;
    if (!key) fail(`${wave.label} has source row without stable key`);
    if (sourceRecordIds.has(key)) fail(`duplicate source row across waves: ${key}`);
    sourceRecordIds.add(key);
  }

  for (const row of executionSampleRows) {
    if (!row.reviewRowId) fail(`${wave.label} has sample row without reviewRowId`);
    if (sampleReviewRowIds.has(row.reviewRowId)) fail(`duplicate sample row across waves: ${row.reviewRowId}`);
    sampleReviewRowIds.add(row.reviewRowId);
  }

  return {
    waveNo: wave.waveNo,
    waveKey: wave.waveKey,
    label: wave.label,
    executionPath: wave.executionPath,
    validationPath: wave.validationPath,
    routePath: wave.routePath,
    sourceRows: execution.sourceRows,
    expectedSourceRows: wave.expectedSourceRows,
    executionSourceRows: executionSourceRows.length,
    sampleRows: execution.sampleRows,
    expectedSampleRows: wave.expectedSampleRows,
    executionSampleRows: executionSampleRows.length,
    validationInputRows: validation.inputRows,
    validationRows: validationRows.length,
    routeRows: route.routeRows,
    routeRowsDetail: routeRows.length,
    pdfSourceRows: execution.pdfSourceRows || 0,
    zipSourceRows: execution.zipSourceRows || 0,
    pdfSampleRows: execution.pdfSampleRows || 0,
    zipSampleRows: execution.zipSampleRows || 0,
    validationReadyRows: validation.readyRows,
    validationBlockedRows: validation.blockedRows,
    routeReadyRows: route.readyRows,
    routeBlockedRows: route.blockedRows,
    acceptedForModuleDistillationRows: route.acceptedForModuleDistillationRows || 0,
    acceptedForDeletionReadinessRows: route.acceptedForDeletionReadinessRows || 0,
    learnerReadyModules: route.learnerReadyModules || 0,
    sourceFolderMayBeDeleted: route.sourceFolderMayBeDeleted,
    currentKnowledgeArtifactsCanReplaceSourceFolder: route.currentKnowledgeArtifactsCanReplaceSourceFolder,
  };
});

const totals = waveSummaries.reduce((acc, wave) => {
  acc.expectedSourceRows += wave.expectedSourceRows;
  acc.executionSourceRows += wave.executionSourceRows;
  acc.expectedSampleRows += wave.expectedSampleRows;
  acc.executionSampleRows += wave.executionSampleRows;
  acc.validationInputRows += wave.validationInputRows;
  acc.validationRows += wave.validationRows;
  acc.routeRows += wave.routeRows;
  acc.routeRowsDetail += wave.routeRowsDetail;
  acc.pdfSourceRows += wave.pdfSourceRows;
  acc.zipSourceRows += wave.zipSourceRows;
  acc.pdfSampleRows += wave.pdfSampleRows;
  acc.zipSampleRows += wave.zipSampleRows;
  acc.validationReadyRows += wave.validationReadyRows;
  acc.validationBlockedRows += wave.validationBlockedRows;
  acc.routeReadyRows += wave.routeReadyRows;
  acc.routeBlockedRows += wave.routeBlockedRows;
  acc.acceptedForModuleDistillationRows += wave.acceptedForModuleDistillationRows;
  acc.acceptedForDeletionReadinessRows += wave.acceptedForDeletionReadinessRows;
  acc.learnerReadyModules += wave.learnerReadyModules;
  return acc;
}, {
  expectedSourceRows: 0,
  executionSourceRows: 0,
  expectedSampleRows: 0,
  executionSampleRows: 0,
  validationInputRows: 0,
  validationRows: 0,
  routeRows: 0,
  routeRowsDetail: 0,
  pdfSourceRows: 0,
  zipSourceRows: 0,
  pdfSampleRows: 0,
  zipSampleRows: 0,
  validationReadyRows: 0,
  validationBlockedRows: 0,
  routeReadyRows: 0,
  routeBlockedRows: 0,
  acceptedForModuleDistillationRows: 0,
  acceptedForDeletionReadinessRows: 0,
  learnerReadyModules: 0,
});

const audit = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  auditStatus: "course_5_wave_closure_audit_all_followup_rows_covered_but_blocked_on_real_input",
  auditMode: "course_5_wave_1_to_5_global_coverage_and_deletion_gate",
  sourceRoot: deletion.sourceRoot,
  sourceFolderMayBeDeleted: false,
  currentKnowledgeArtifactsCanReplaceSourceFolder: false,
  sourceDeletionReadiness: deletionPath,
  sourcePriorityPlan: priorityPlanPath,
  deletionReadinessStatus: deletion.readinessStatus,
  blockerFollowupRowsFromDeletionReadiness: deletion.blockerEvidence?.blockingFollowupRows,
  totalSampleImagesFromDeletionReadiness: deletion.visualEvidence?.totalSampleImages,
  learnerReadyModulesFromDeletionReadiness: deletion.moduleEvidence?.learnerReadyModules,
  expectedTotals: {
    followupRows: 49,
    sampleRows: 206,
    pdfSourceRows: 41,
    zipSourceRows: 8,
    pdfSampleRows: 121,
    zipSampleRows: 85,
  },
  totals,
  uniqueSourceRowsCovered: sourceRecordIds.size,
  uniqueSampleRowsCovered: sampleReviewRowIds.size,
  waveSummaries,
  closureGates: {
    allFollowupRowsCoveredByWaves: sourceRecordIds.size === 49,
    allRepresentativeSamplesCoveredByWaves: sampleReviewRowIds.size === 206,
    executionValidationAndRouteCountsAligned: totals.executionSampleRows === totals.validationInputRows && totals.validationInputRows === totals.routeRows && totals.routeRows === totals.routeRowsDetail,
    realReviewerInputAccepted: totals.validationReadyRows > 0,
    moduleDistillationAllowedNow: false,
    deletionEvidenceAllowedNow: false,
    sourceFolderMayBeDeleted: false,
    learnerFacingRelease: false,
  },
  remainingBlockers: [
    "All 206 Wave 1-5 reviewer-input rows are still blocked because real OCR, visual semantic reviewer notes, or accepted future-loss decisions have not been supplied.",
    "No Wave 1-5 row is accepted for module distillation or deletion readiness.",
    "Course 5 learner-ready modules remain 0.",
    "Deletion readiness remains course_5_source_folder_not_deletable_absorption_incomplete.",
  ],
  nextOperationalGates: [
    "Fill real reviewer-owned OCR, visual-semantic, or future-loss decision fields for the 206 Wave 1-5 sample rows.",
    "Re-run the five Wave reviewer-input validators and post-input route maps.",
    "Only then run semantic merge preview, public grounding, originality review, and teaching-module distillation.",
    "Recompute Course 5 deletion readiness after every follow-up source row has accepted replacement evidence or documented future-loss acceptance.",
  ],
  commands: [
    "npm.cmd run build:local-course-5-wave-closure-audit",
    "npm.cmd run check:local-course-5-wave-closure-audit",
    "npm.cmd run verify",
  ],
  completionRule: "This closure audit is complete when all 49 Course 5 follow-up source rows and all 206 representative sample rows are covered by Wave 1-5 execution packs, reviewer-input validations, and post-input route maps, while all release, module merge, and source-deletion gates remain closed until real accepted reviewer evidence exists.",
  boundary,
};

fs.writeFileSync(outputJson, `${JSON.stringify(audit, null, 2)}\n`, "utf8");

fs.writeFileSync(outputMd, [
  "# Course 5 Wave Closure Audit",
  "",
  `- Audit status: ${audit.auditStatus}`,
  `- Follow-up rows covered: ${audit.uniqueSourceRowsCovered} / ${audit.expectedTotals.followupRows}`,
  `- Sample rows covered: ${audit.uniqueSampleRowsCovered} / ${audit.expectedTotals.sampleRows}`,
  `- Validation input rows: ${audit.totals.validationInputRows}`,
  `- Route rows: ${audit.totals.routeRows}`,
  `- Ready rows: ${audit.totals.validationReadyRows}`,
  `- Blocked rows: ${audit.totals.validationBlockedRows}`,
  `- Accepted for module distillation: ${audit.totals.acceptedForModuleDistillationRows}`,
  `- Accepted for deletion readiness: ${audit.totals.acceptedForDeletionReadinessRows}`,
  `- Learner-ready modules: ${audit.totals.learnerReadyModules}`,
  `- Source folder may be deleted: ${audit.sourceFolderMayBeDeleted}`,
  "",
  "## Wave Coverage",
  "",
  "| Wave | Source rows | Sample rows | Validation rows | Route rows | Ready | Blocked |",
  "|---|---:|---:|---:|---:|---:|---:|",
  ...waveSummaries.map((wave) => `| ${wave.label} | ${wave.executionSourceRows} | ${wave.executionSampleRows} | ${wave.validationRows} | ${wave.routeRows} | ${wave.validationReadyRows} | ${wave.validationBlockedRows} |`),
  "",
  "## Remaining Blockers",
  "",
  ...audit.remainingBlockers.map((item) => `- ${item}`),
  "",
  "## Boundary",
  "",
  boundary,
  "",
].join("\n"), "utf8");

const rowHtml = waveSummaries.map((wave) => `
        <tr>
          <td>${htmlEscape(wave.label)}</td>
          <td>${wave.executionSourceRows}</td>
          <td>${wave.executionSampleRows}</td>
          <td>${wave.validationRows}</td>
          <td>${wave.routeRows}</td>
          <td>${wave.validationReadyRows}</td>
          <td>${wave.validationBlockedRows}</td>
        </tr>`).join("");

fs.writeFileSync(outputHtml, `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Course 5 Wave Closure Audit</title>
  <style>
    :root { font-family: Arial, Helvetica, sans-serif; background: #f6f7f2; color: #20211f; }
    body { margin: 0; }
    header { background: #fff; border-bottom: 1px solid #d9dcd2; padding: 18px 24px; }
    h1 { margin: 0 0 8px; font-size: 24px; letter-spacing: 0; }
    .status { color: #5c625b; font-size: 13px; }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; padding: 18px 24px; }
    .metric { background: #fff; border: 1px solid #d5d8d0; border-radius: 8px; padding: 12px; }
    .metric b { display: block; font-size: 22px; margin-bottom: 5px; }
    .metric span { color: #5c625b; font-size: 12px; }
    main { padding: 0 24px 24px; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #d5d8d0; border-radius: 8px; overflow: hidden; }
    th, td { border-bottom: 1px solid #e3e5df; padding: 8px 10px; text-align: left; font-size: 13px; vertical-align: top; }
    th { background: #eef0eb; }
    footer { padding: 18px 24px 30px; color: #55584f; font-size: 12px; line-height: 1.5; }
  </style>
</head>
<body>
  <header>
    <h1>Course 5 Wave Closure Audit</h1>
    <div class="status">${htmlEscape(audit.auditStatus)}</div>
  </header>
  <section class="metrics">
    <div class="metric"><b>${audit.uniqueSourceRowsCovered}</b><span>follow-up source rows covered</span></div>
    <div class="metric"><b>${audit.uniqueSampleRowsCovered}</b><span>sample rows covered</span></div>
    <div class="metric"><b>${audit.totals.validationInputRows}</b><span>validation input rows</span></div>
    <div class="metric"><b>${audit.totals.routeRows}</b><span>route rows</span></div>
    <div class="metric"><b>${audit.totals.validationReadyRows}</b><span>ready rows</span></div>
    <div class="metric"><b>${audit.sourceFolderMayBeDeleted}</b><span>source folder may be deleted</span></div>
  </section>
  <main>
    <table>
      <thead><tr><th>Wave</th><th>Source rows</th><th>Sample rows</th><th>Validation rows</th><th>Route rows</th><th>Ready</th><th>Blocked</th></tr></thead>
      <tbody>${rowHtml}</tbody>
    </table>
  </main>
  <footer>${htmlEscape(boundary)}</footer>
</body>
</html>
`, "utf8");

console.log(JSON.stringify({
  ok: true,
  auditStatus: audit.auditStatus,
  followupRowsCovered: audit.uniqueSourceRowsCovered,
  sampleRowsCovered: audit.uniqueSampleRowsCovered,
  validationInputRows: audit.totals.validationInputRows,
  routeRows: audit.totals.routeRows,
  readyRows: audit.totals.validationReadyRows,
  blockedRows: audit.totals.validationBlockedRows,
  sourceFolderMayBeDeleted: audit.sourceFolderMayBeDeleted,
}, null, 2));
