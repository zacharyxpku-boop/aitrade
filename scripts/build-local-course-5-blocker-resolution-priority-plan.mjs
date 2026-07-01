import fs from "node:fs";

const matrixPath = "docs/LOCAL_COURSE_5_SOURCE_TO_MODULE_COVERAGE_MATRIX.json";
const routerPath = "docs/LOCAL_COURSE_5_OCR_VISUAL_EXECUTION_ROUTER.json";
const workPacksPath = "docs/LOCAL_COURSE_5_FOLLOWUP_WORK_PACKS.json";
const deletionPath = "docs/LOCAL_COURSE_5_DELETION_READINESS.json";

const outputJson = "docs/LOCAL_COURSE_5_BLOCKER_RESOLUTION_PRIORITY_PLAN.json";
const outputMd = "docs/LOCAL_COURSE_5_BLOCKER_RESOLUTION_PRIORITY_PLAN.md";
const outputHtml = "docs/local-course-5-blocker-resolution-priority-plan.html";

const boundary = "Course 5 blocker resolution priority plan is private reviewer-facing education operations material. It ranks unresolved visual, OCR, and ZIP source blockers by module impact, priority band, local resolvability, evidence value, and deletion-readiness impact. It does not perform OCR, generate reviewer conclusions, accept machine drafts as human review, merge content into learner-facing modules, delete files, approve source-folder deletion, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

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

function priorityRank(priorityBand) {
  if (priorityBand === "P0_space_and_curriculum_blocker") return 0;
  if (priorityBand === "P1_high_value_blocker") return 1;
  return 2;
}

function priorityScore(row) {
  const band = row.priorityBand || "P2_followup_blocker";
  const bandScore = band === "P0_space_and_curriculum_blocker" ? 1000 : band === "P1_high_value_blocker" ? 700 : 400;
  const localScore = row.canFullyResolveWithLocalToolsNow ? 120 : 0;
  const moduleScore = (row.moduleIds?.length || 0) * 60;
  const sizeScore = Math.min(160, Math.round((row.sizeMb || 0) / 30));
  const pagesScore = Math.min(120, Math.round((row.pageCount || 0) / 100));
  const zipScore = row.extension === ".zip" ? 80 : 0;
  return bandScore + localScore + moduleScore + sizeScore + pagesScore + zipScore;
}

function recommendedWave(row) {
  if (row.priorityBand === "P0_space_and_curriculum_blocker") return "wave_1_p0_space_and_curriculum_blockers";
  if (row.priorityBand === "P1_high_value_blocker") return "wave_2_p1_high_value_blockers";
  if (row.canFullyResolveWithLocalToolsNow) return "wave_3_locally_resolvable_zip_visuals";
  if ((row.moduleIds || []).some((moduleId) => ["reversals", "trading_ranges", "trends_and_channels", "breakouts_and_pullbacks"].includes(moduleId))) {
    return "wave_4_course_core_pdf_ocr_blockers";
  }
  return "wave_5_remaining_pdf_ocr_or_future_loss_decisions";
}

const matrix = readJson(matrixPath);
const router = readJson(routerPath);
const workPacks = readJson(workPacksPath);
const deletion = readJson(deletionPath);

for (const [name, artifact] of Object.entries({ matrix, router, workPacks, deletion })) {
  assertBoundary(name, artifact);
}

const routerByRecordId = new Map(router.firstExecutionSlice.map((row) => [row.recordId, row]));
for (const row of router.firstExecutionSlice) {
  routerByRecordId.set(row.recordId, row);
}

const followupRows = matrix.sourceRowsDetail
  .filter((row) => row.absorptionClass === "followup_required_visual_or_ocr_blocked")
  .map((row) => {
    const route = routerByRecordId.get(row.recordId);
    const priorityBand = route?.priorityBand || "P2_followup_blocker";
    const canFullyResolveWithLocalToolsNow = route?.extension === ".zip" || row.extension === ".zip";
    const enriched = {
      recordId: row.recordId,
      relativePath: row.relativePath,
      extension: row.extension,
      sizeMb: row.sizeMb,
      moduleIds: row.moduleIds,
      moduleCount: row.moduleCount,
      absorptionClass: row.absorptionClass,
      extractionBucket: row.extractionBucket,
      priorityBand,
      priorityRank: priorityRank(priorityBand),
      canFullyResolveWithLocalToolsNow,
      immediateAction: route?.immediateVisualAction || row.nextGate,
      finalResolutionGate: route?.finalResolutionGate || row.nextGate,
      sourceFolderMayBeDeleted: false,
      educationOnly: true,
      learnerFacingRelease: false,
      approvalStatus: "not_approved",
      productionReady: false,
      writeAllowedNow: false,
    };
    return {
      ...enriched,
      priorityScore: priorityScore(enriched),
      resolutionWave: recommendedWave(enriched),
      acceptedForModuleDistillation: false,
      acceptedForDeletionReadiness: false,
      learnerModuleMergeAllowedNow: false,
      deletionEvidenceAllowedNow: false,
      nextGate: canFullyResolveWithLocalToolsNow
        ? "complete_real_zip_visual_reviewer_input_then_revalidate_and_route"
        : "install_or_provide_ocr_or_complete_real_pdf_visual_reviewer_input_then_revalidate_and_route",
    };
  })
  .sort((a, b) =>
    a.priorityRank - b.priorityRank ||
    b.priorityScore - a.priorityScore ||
    b.moduleCount - a.moduleCount ||
    b.sizeMb - a.sizeMb ||
    a.recordId.localeCompare(b.recordId),
  )
  .map((row, index) => ({ resolutionOrder: index + 1, ...row }));

const waveOrder = [
  "wave_1_p0_space_and_curriculum_blockers",
  "wave_2_p1_high_value_blockers",
  "wave_3_locally_resolvable_zip_visuals",
  "wave_4_course_core_pdf_ocr_blockers",
  "wave_5_remaining_pdf_ocr_or_future_loss_decisions",
];

const waveRows = waveOrder.map((waveId) => {
  const rows = followupRows.filter((row) => row.resolutionWave === waveId);
  const moduleIds = new Set(rows.flatMap((row) => row.moduleIds));
  return {
    waveId,
    rowCount: rows.length,
    pdfRows: rows.filter((row) => row.extension === ".pdf").length,
    zipRows: rows.filter((row) => row.extension === ".zip").length,
    affectedModules: [...moduleIds].sort(),
    localToolRows: rows.filter((row) => row.canFullyResolveWithLocalToolsNow).length,
    blockedOnOcrRows: rows.filter((row) => row.extension === ".pdf").length,
    sourceFolderMayBeDeleted: false,
    educationOnly: true,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    productionReady: false,
    writeAllowedNow: false,
  };
});

const plan = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  planStatus: "course_5_blocker_resolution_priority_plan_ready_release_and_deletion_blocked",
  sourceRoot: matrix.sourceRoot,
  sourceFolderMayBeDeleted: false,
  currentKnowledgeArtifactsCanReplaceSourceFolder: false,
  sourceCoverageMatrix: matrixPath,
  sourceRouter: routerPath,
  sourceWorkPacks: workPacksPath,
  sourceDeletionReadiness: deletionPath,
  followupRows: followupRows.length,
  pdfFollowupRows: followupRows.filter((row) => row.extension === ".pdf").length,
  zipFollowupRows: followupRows.filter((row) => row.extension === ".zip").length,
  p0Rows: followupRows.filter((row) => row.priorityBand === "P0_space_and_curriculum_blocker").length,
  p1Rows: followupRows.filter((row) => row.priorityBand === "P1_high_value_blocker").length,
  p2Rows: followupRows.filter((row) => row.priorityBand === "P2_followup_blocker").length,
  localToolResolvableRows: followupRows.filter((row) => row.canFullyResolveWithLocalToolsNow).length,
  ocrUnavailableBlockingRows: router.ocrUnavailableBlockingRows,
  modulesWithFollowupBlockers: matrix.modulesWithFollowupBlockers,
  acceptedForModuleDistillationRows: 0,
  acceptedForDeletionReadinessRows: 0,
  learnerReadyModules: 0,
  deletionReadinessStatus: deletion.readinessStatus,
  resolutionWaves: waveRows,
  priorityRows: followupRows,
  nextOperationalGates: [
    "Start with wave 1 because those rows combine space risk and curriculum blocker risk.",
    "Use ZIP rows in wave 3 for the fastest local visual-review progress while OCR is unavailable.",
    "Keep PDF OCR rows in explicit blocked status until OCR or real visual reviewer notes exist.",
    "After any row becomes ready, re-run its input validation, route map, module distillation, and deletion readiness checks.",
    "Do not delete the Course 5 source folder until all follow-up rows have accepted replacement evidence or explicit future-loss acceptance.",
  ],
  commands: [
    "npm.cmd run build:local-course-5-blocker-resolution-priority-plan",
    "npm.cmd run check:local-course-5-blocker-resolution-priority-plan",
    "npm.cmd run verify",
  ],
  completionRule: "This priority plan is complete when all 49 unresolved Course 5 follow-up source rows are ranked into resolution waves with module impact, local-resolvability, OCR dependency, and deletion-readiness boundaries preserved.",
  boundary,
};

fs.writeFileSync(outputJson, `${JSON.stringify(plan, null, 2)}\n`, "utf8");

fs.writeFileSync(outputMd, [
  "# Course 5 Blocker Resolution Priority Plan",
  "",
  `- Plan status: ${plan.planStatus}`,
  `- Follow-up rows: ${plan.followupRows}`,
  `- PDF follow-up rows: ${plan.pdfFollowupRows}`,
  `- ZIP follow-up rows: ${plan.zipFollowupRows}`,
  `- P0/P1/P2 rows: ${plan.p0Rows}/${plan.p1Rows}/${plan.p2Rows}`,
  `- Local-tool resolvable rows: ${plan.localToolResolvableRows}`,
  `- OCR unavailable blocking rows: ${plan.ocrUnavailableBlockingRows}`,
  `- Source folder may be deleted: ${plan.sourceFolderMayBeDeleted}`,
  "",
  "## Resolution Waves",
  "",
  "| Wave | Rows | PDF | ZIP | Local tool rows | OCR blocked rows |",
  "|---|---:|---:|---:|---:|---:|",
  ...waveRows.map((row) => `| ${row.waveId} | ${row.rowCount} | ${row.pdfRows} | ${row.zipRows} | ${row.localToolRows} | ${row.blockedOnOcrRows} |`),
  "",
  "## Top Priority Rows",
  "",
  "| Order | Priority | Type | Modules | Size MB | Next gate |",
  "|---:|---|---|---:|---:|---|",
  ...followupRows.slice(0, 15).map((row) => `| ${row.resolutionOrder} | ${row.priorityBand} | ${row.extension} | ${row.moduleCount} | ${row.sizeMb} | ${row.nextGate} |`),
  "",
  "## Boundary",
  "",
  boundary,
  "",
].join("\n"), "utf8");

const waveHtml = waveRows.map((row) => `
        <tr>
          <td>${htmlEscape(row.waveId)}</td>
          <td>${row.rowCount}</td>
          <td>${row.pdfRows}</td>
          <td>${row.zipRows}</td>
          <td>${row.localToolRows}</td>
          <td>${row.blockedOnOcrRows}</td>
        </tr>`).join("");

fs.writeFileSync(outputHtml, `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Course 5 Blocker Resolution Priority Plan</title>
  <style>
    :root { font-family: Arial, Helvetica, sans-serif; background: #f8f7f2; color: #20211f; }
    body { margin: 0; }
    header { background: #fff; border-bottom: 1px solid #d9d9d2; padding: 18px 24px; }
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
    <h1>Course 5 Blocker Resolution Priority Plan</h1>
    <div class="status">${htmlEscape(plan.planStatus)}</div>
  </header>
  <section class="metrics">
    <div class="metric"><b>${plan.followupRows}</b><span>follow-up rows</span></div>
    <div class="metric"><b>${plan.pdfFollowupRows}</b><span>PDF rows</span></div>
    <div class="metric"><b>${plan.zipFollowupRows}</b><span>ZIP rows</span></div>
    <div class="metric"><b>${plan.localToolResolvableRows}</b><span>local-tool resolvable rows</span></div>
    <div class="metric"><b>${plan.ocrUnavailableBlockingRows}</b><span>OCR unavailable rows</span></div>
    <div class="metric"><b>${plan.sourceFolderMayBeDeleted}</b><span>source folder may be deleted</span></div>
  </section>
  <main>
    <table>
      <thead><tr><th>Wave</th><th>Rows</th><th>PDF</th><th>ZIP</th><th>Local tool rows</th><th>OCR blocked rows</th></tr></thead>
      <tbody>${waveHtml}</tbody>
    </table>
  </main>
  <footer>${htmlEscape(boundary)}</footer>
</body>
</html>
`, "utf8");

console.log(JSON.stringify({
  ok: true,
  planStatus: plan.planStatus,
  followupRows: plan.followupRows,
  pdfFollowupRows: plan.pdfFollowupRows,
  zipFollowupRows: plan.zipFollowupRows,
  p0Rows: plan.p0Rows,
  p1Rows: plan.p1Rows,
  p2Rows: plan.p2Rows,
  localToolResolvableRows: plan.localToolResolvableRows,
  sourceFolderMayBeDeleted: plan.sourceFolderMayBeDeleted,
}, null, 2));
