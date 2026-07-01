import fs from "node:fs";

const priorityPlanPath = "docs/LOCAL_COURSE_5_BLOCKER_RESOLUTION_PRIORITY_PLAN.json";
const pdfSlicePath = "docs/LOCAL_COURSE_5_PDF_OCR_PRIORITY_SLICE.json";
const workPacksPath = "docs/LOCAL_COURSE_5_FOLLOWUP_WORK_PACKS.json";
const deletionPath = "docs/LOCAL_COURSE_5_DELETION_READINESS.json";

const outputJson = "docs/LOCAL_COURSE_5_WAVE_4_PDF_EXECUTION_PACK.json";
const outputMd = "docs/LOCAL_COURSE_5_WAVE_4_PDF_EXECUTION_PACK.md";
const outputHtml = "docs/local-course-5-wave-4-pdf-execution-pack.html";

const boundary = "Course 5 Wave 4 PDF execution pack is private reviewer-facing education operations material. It isolates the nine course-core PDF OCR blockers and their available representative page samples for future OCR or reviewer-owned visual/text input, semantic merge preview, public grounding, and deletion-readiness recomputation. It does not perform OCR, generate reviewer conclusions, accept machine drafts as human review, merge content into learner-facing modules, delete files, approve source-folder deletion, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

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

const priorityPlan = readJson(priorityPlanPath);
const pdfSlice = readJson(pdfSlicePath);
const workPacks = readJson(workPacksPath);
const deletion = readJson(deletionPath);
for (const [name, artifact] of Object.entries({ priorityPlan, pdfSlice, workPacks, deletion })) {
  assertBoundary(name, artifact);
}

const waveId = "wave_4_course_core_pdf_ocr_blockers";
const waveRows = priorityPlan.priorityRows.filter((row) => row.resolutionWave === waveId);
const waveRecordIds = new Set(waveRows.map((row) => row.recordId));
const prioritySamples = pdfSlice.sampleRows.filter((row) => waveRecordIds.has(row.recordId));
const prioritySampleIds = new Set(prioritySamples.map((row) => row.reviewRowId));
const workItemByRecordId = new Map((workPacks.workItems || []).map((row) => [row.recordId, row]));
const supplementalSamples = [];
for (const row of waveRows) {
  const existing = prioritySamples.filter((sample) => sample.recordId === row.recordId);
  if (existing.length > 0) continue;
  const workItem = workItemByRecordId.get(row.recordId);
  for (const sample of workItem?.sampleImages || []) {
    supplementalSamples.push({
      reviewRowId: `course5_wave_4_pdf_supplemental_review_${String(supplementalSamples.length + 1).padStart(3, "0")}`,
      sourceType: "pdf",
      recordId: row.recordId,
      relativePath: row.relativePath,
      pageNumber: sample.pageNumber,
      sampleImagePath: sample.imagePath,
      sampleImageHref: sample.imagePath.replace(/^docs[\\/]/, "").replace(/\\/g, "/"),
      sampleImageExists: fs.existsSync(sample.imagePath),
      priorityBand: row.priorityBand,
      moduleTags: row.moduleIds,
      candidateConcepts: row.moduleIds.includes("trends_and_channels")
        ? ["trend_chart_reading", "pdf_ocr_priority_slice", "representative_page_review"]
        : ["reversal_chart_reading", "pdf_ocr_priority_slice", "representative_page_review"],
      sampleSource: "followup_work_pack_existing_representative_sample",
    });
  }
}
const pdfSamples = [...prioritySamples.map((row) => ({ ...row, sampleSource: prioritySampleIds.has(row.reviewRowId) ? "pdf_ocr_priority_slice" : "unknown" })), ...supplementalSamples];

const sourceRows = waveRows.map((row) => {
  const samples = pdfSamples.filter((sample) => sample.recordId === row.recordId);
  return {
    resolutionOrder: row.resolutionOrder,
    recordId: row.recordId,
    relativePath: row.relativePath,
    extension: row.extension,
    sizeMb: row.sizeMb,
    moduleIds: row.moduleIds,
    moduleCount: row.moduleCount,
    priorityBand: row.priorityBand,
    priorityScore: row.priorityScore,
    canFullyResolveWithLocalToolsNow: row.canFullyResolveWithLocalToolsNow,
    immediateAction: row.immediateAction,
    finalResolutionGate: row.finalResolutionGate,
    sampleRows: samples.length,
    requiredReviewerMode: "pdf_ocr_or_visual_reviewer_owned_observation",
    nextValidationArtifact: "docs/LOCAL_COURSE_5_PDF_OCR_PRIORITY_SLICE_INPUT_VALIDATION.json",
    nextRouteMapArtifact: "docs/LOCAL_COURSE_5_PDF_OCR_PRIORITY_SLICE_ROUTE_MAP.json",
    acceptedForModuleDistillation: false,
    acceptedForDeletionReadiness: false,
    learnerModuleMergeAllowedNow: false,
    deletionEvidenceAllowedNow: false,
    sourceFolderMayBeDeleted: false,
    educationOnly: true,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    productionReady: false,
    writeAllowedNow: false,
  };
});

const sourceOrderByRecordId = new Map(waveRows.map((row) => [row.recordId, row.resolutionOrder]));
const sampleRows = pdfSamples
  .map((sample) => ({
    reviewRowId: sample.reviewRowId,
    sourceType: "pdf",
    recordId: sample.recordId,
    pageNumber: sample.pageNumber,
    sampleImagePath: sample.sampleImagePath,
    sampleImageExists: sample.sampleImageExists,
    priorityBand: sample.priorityBand,
    moduleTags: sample.moduleTags,
    candidateConcepts: sample.candidateConcepts,
    reviewerPrompt: "Capture OCR/manual visible text needs and chart/page semantics in reviewer-owned words; do not copy private source prose or infer a trading signal.",
    requiredFields: [
      "reviewerOwnedOcrTextExcerpt",
      "reviewerOwnedVisualObservation",
      "paraphrasedTeachingConcept",
      "modulePlacement",
      "evidenceLimitations",
      "reviewerNameOrInitials",
      "reviewedAt",
    ],
    readyNow: false,
    nextGate: "fill_pdf_ocr_priority_slice_input_then_validate",
    sourceFolderMayBeDeleted: false,
    educationOnly: true,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    productionReady: false,
    writeAllowedNow: false,
  }))
  .sort((a, b) => {
    const sourceOrderA = sourceOrderByRecordId.get(a.recordId) || 99;
    const sourceOrderB = sourceOrderByRecordId.get(b.recordId) || 99;
    return sourceOrderA - sourceOrderB || a.reviewRowId.localeCompare(b.reviewRowId);
  })
  .map((row, index) => ({ executionSampleNo: index + 1, ...row }));

const executionPack = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  executionPackStatus: "course_5_wave_4_pdf_execution_pack_ready_blocked_on_ocr_or_real_reviewer_input",
  waveId,
  sourceRoot: priorityPlan.sourceRoot,
  sourceFolderMayBeDeleted: false,
  currentKnowledgeArtifactsCanReplaceSourceFolder: false,
  sourcePriorityPlan: priorityPlanPath,
  sourcePdfPrioritySlice: pdfSlicePath,
  sourceFollowupWorkPacks: workPacksPath,
  sourceDeletionReadiness: deletionPath,
  sourceRows: sourceRows.length,
  pdfSourceRows: sourceRows.length,
  zipSourceRows: 0,
  sampleRows: sampleRows.length,
  pdfSampleRows: sampleRows.length,
  zipSampleRows: 0,
  sourceRowsWithSamples: sourceRows.filter((row) => row.sampleRows > 0).length,
  sourceRowsMissingRepresentativeSamples: sourceRows.filter((row) => row.sampleRows === 0).length,
  prioritySliceSampleRows: prioritySamples.length,
  supplementalSampleRows: supplementalSamples.length,
  affectedModules: [...new Set(sourceRows.flatMap((row) => row.moduleIds))].sort(),
  localToolResolvableSourceRows: sourceRows.filter((row) => row.canFullyResolveWithLocalToolsNow).length,
  ocrBlockedSourceRows: sourceRows.length,
  readyReviewerInputRows: 0,
  blockedReviewerInputRows: sampleRows.length,
  acceptedForModuleDistillationRows: 0,
  acceptedForDeletionReadinessRows: 0,
  learnerReadyModules: 0,
  deletionReadinessStatus: deletion.readinessStatus,
  sourceRowsDetail: sourceRows,
  sampleRowsDetail: sampleRows,
  nextOperationalGates: [
    "Provide OCR or reviewer-owned visual/text notes for the 27 available representative pages and re-run PDF priority validation.",
    "Only route validation-ready rows into semantic merge preview.",
    "Run public grounding and originality review before module distillation.",
    "Keep Course 5 source-folder deletion blocked until accepted replacement evidence exists for every follow-up row.",
  ],
  commands: [
    "npm.cmd run build:local-course-5-wave-4-pdf-execution-pack",
    "npm.cmd run check:local-course-5-wave-4-pdf-execution-pack",
    "npm.cmd run verify",
  ],
  completionRule: "This Wave 4 pack is complete when the 9 course-core PDF OCR blocker source rows and their 27 representative page samples are isolated with OCR/reviewer-owned input requirements, validation routes, and release/deletion gates closed.",
  boundary,
};

fs.writeFileSync(outputJson, `${JSON.stringify(executionPack, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Course 5 Wave 4 PDF Execution Pack",
  "",
  `- Execution pack status: ${executionPack.executionPackStatus}`,
  `- Source rows: ${executionPack.sourceRows}`,
  `- PDF source rows: ${executionPack.pdfSourceRows}`,
  `- Sample rows: ${executionPack.sampleRows}`,
  `- Source rows with samples: ${executionPack.sourceRowsWithSamples}`,
  `- Source rows missing representative samples: ${executionPack.sourceRowsMissingRepresentativeSamples}`,
  `- Priority slice sample rows: ${executionPack.prioritySliceSampleRows}`,
  `- Supplemental sample rows: ${executionPack.supplementalSampleRows}`,
  `- Affected modules: ${executionPack.affectedModules.join(", ")}`,
  `- Source folder may be deleted: ${executionPack.sourceFolderMayBeDeleted}`,
  "",
  "## Source Rows",
  "",
  "| Order | Samples | Modules | Relative path |",
  "|---:|---:|---|---|",
  ...sourceRows.map((row) => `| ${row.resolutionOrder} | ${row.sampleRows} | ${row.moduleIds.join(", ")} | ${row.relativePath} |`),
  "",
  "## Boundary",
  "",
  boundary,
  "",
].join("\n"), "utf8");

const rowHtml = sourceRows.map((row) => `
        <tr>
          <td>${row.resolutionOrder}</td>
          <td>${row.sampleRows}</td>
          <td>${htmlEscape(row.moduleIds.join(", "))}</td>
          <td>${htmlEscape(row.relativePath)}</td>
        </tr>`).join("");

fs.writeFileSync(outputHtml, `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Course 5 Wave 4 PDF Execution Pack</title>
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
    <h1>Course 5 Wave 4 PDF Execution Pack</h1>
    <div class="status">${htmlEscape(executionPack.executionPackStatus)}</div>
  </header>
  <section class="metrics">
    <div class="metric"><b>${executionPack.sourceRows}</b><span>source rows</span></div>
    <div class="metric"><b>${executionPack.pdfSourceRows}</b><span>PDF source rows</span></div>
    <div class="metric"><b>${executionPack.sampleRows}</b><span>sample rows</span></div>
    <div class="metric"><b>${executionPack.sourceRowsWithSamples}</b><span>source rows with samples</span></div>
    <div class="metric"><b>${executionPack.sourceRowsMissingRepresentativeSamples}</b><span>missing representative samples</span></div>
    <div class="metric"><b>${executionPack.sourceFolderMayBeDeleted}</b><span>source folder may be deleted</span></div>
  </section>
  <main>
    <table>
      <thead><tr><th>Order</th><th>Samples</th><th>Modules</th><th>Relative Path</th></tr></thead>
      <tbody>${rowHtml}</tbody>
    </table>
  </main>
  <footer>${htmlEscape(boundary)}</footer>
</body>
</html>
`, "utf8");

console.log(JSON.stringify({
  ok: true,
  executionPackStatus: executionPack.executionPackStatus,
  sourceRows: executionPack.sourceRows,
  pdfSourceRows: executionPack.pdfSourceRows,
  sampleRows: executionPack.sampleRows,
  sourceRowsMissingRepresentativeSamples: executionPack.sourceRowsMissingRepresentativeSamples,
  blockedReviewerInputRows: executionPack.blockedReviewerInputRows,
  sourceFolderMayBeDeleted: executionPack.sourceFolderMayBeDeleted,
}, null, 2));
