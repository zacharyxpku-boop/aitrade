import fs from "node:fs";

const validationPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_REVIEWER_INPUT_VALIDATION.json";
const packPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_EXECUTION_PACK.json";
const pdfRoutePath = "docs/LOCAL_COURSE_5_PDF_OCR_PRIORITY_SLICE_ROUTE_MAP.json";
const deletionPath = "docs/LOCAL_COURSE_5_DELETION_READINESS.json";

const outputJson = "docs/LOCAL_COURSE_5_WAVE_5_PDF_POST_INPUT_ROUTE_MAP.json";
const outputMd = "docs/LOCAL_COURSE_5_WAVE_5_PDF_POST_INPUT_ROUTE_MAP.md";
const outputHtml = "docs/local-course-5-wave-5-pdf-post-input-route-map.html";

const boundary = "Course 5 Wave 5 PDF post-input route map is private reviewer-facing education operations material. It routes validation-ready Wave 5 PDF reviewer or future-loss decision rows toward PDF semantic merge preview, public grounding, teaching-module distillation review, documented future-loss accounting, and deletion-readiness recomputation while keeping all release, write, merge, and deletion gates closed until real accepted reviewer evidence exists. It does not perform OCR, generate reviewer conclusions, accept machine drafts as human review, merge content into learner-facing modules, delete files, approve source-folder deletion, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

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

const validation = readJson(validationPath);
const pack = readJson(packPath);
const pdfRoute = readJson(pdfRoutePath);
const deletion = readJson(deletionPath);

for (const [name, artifact] of Object.entries({ validation, pack, pdfRoute, deletion })) {
  assertBoundary(name, artifact);
}

const sampleByReviewRowId = new Map(pack.sampleRowsDetail.map((row) => [row.reviewRowId, row]));
const sourceByRecordId = new Map(pack.sourceRowsDetail.map((row) => [row.recordId, row]));

const routeRows = validation.validationRows.map((row) => {
  const sample = sampleByReviewRowId.get(row.reviewRowId);
  const source = sourceByRecordId.get(row.recordId);
  const ready = row.readyForWave5PdfSemanticOrFutureLossGate === true;
  return {
    reviewRowId: row.reviewRowId,
    executionSampleNo: row.executionSampleNo,
    sourceType: "pdf",
    recordId: row.recordId,
    relativePath: source?.relativePath || "",
    pageNumber: sample?.pageNumber ?? null,
    moduleTags: sample?.moduleTags || [],
    validationStatus: row.validationStatus,
    readyForWave5PdfSemanticOrFutureLossGate: ready,
    downstreamRouteMap: pdfRoutePath,
    routeStatus: ready
      ? "ready_for_pdf_semantic_or_future_loss_route_public_grounding_required"
      : "blocked_before_wave_5_pdf_semantic_or_future_loss_route",
    semanticMergePreviewAllowedNow: ready,
    futureLossAccountingAllowedNow: ready,
    moduleDistillationAllowedNow: false,
    deletionEvidenceAllowedNow: false,
    nextGate: ready
      ? "route_to_pdf_ocr_priority_route_map_then_public_grounding_or_future_loss_review"
      : row.nextGate,
    sourceFolderMayBeDeleted: false,
    educationOnly: true,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    productionReady: false,
    writeAllowedNow: false,
  };
});

const readyRows = routeRows.filter((row) => row.readyForWave5PdfSemanticOrFutureLossGate).length;
const blockedRows = routeRows.length - readyRows;

const routeMap = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  routeMapStatus: readyRows > 0
    ? "course_5_wave_5_pdf_post_input_route_map_has_ready_rows_release_and_deletion_blocked"
    : "course_5_wave_5_pdf_post_input_route_map_ready_all_rows_blocked",
  routeMode: "post_input_route_map_for_wave_5_pdf_reviewer_or_future_loss_rows",
  waveId: pack.waveId,
  sourceRoot: pack.sourceRoot,
  sourceFolderMayBeDeleted: false,
  currentKnowledgeArtifactsCanReplaceSourceFolder: false,
  sourceValidation: validationPath,
  sourceExecutionPack: packPath,
  sourcePdfRouteMap: pdfRoutePath,
  sourceDeletionReadiness: deletionPath,
  routeRows: routeRows.length,
  pdfRouteRows: routeRows.length,
  zipRouteRows: 0,
  readyRows,
  blockedRows,
  semanticMergePreviewReadyRows: readyRows,
  futureLossAccountingReadyRows: readyRows,
  moduleMergeAllowedNow: false,
  deletionEvidenceAllowedNow: false,
  acceptedForWave5PdfSemanticReviewRows: 0,
  acceptedForModuleDistillationRows: 0,
  acceptedForDeletionReadinessRows: 0,
  learnerReadyModules: 0,
  deletionReadinessStatus: deletion.readinessStatus,
  routeRowsDetail: routeRows,
  nextOperationalGates: [
    "Fill real Wave 5 PDF reviewer-owned OCR, visual-semantic, and future-loss decision fields and re-run Wave 5 input validation.",
    "Route only validation-ready PDF rows to the PDF OCR priority route map.",
    "Run public grounding and originality review before module distillation.",
    "Recompute deletion readiness only after all Course 5 follow-up rows have accepted replacement evidence or documented future-loss acceptance.",
  ],
  commands: [
    "npm.cmd run validate:local-course-5-wave-5-pdf-reviewer-input",
    "npm.cmd run check:local-course-5-wave-5-pdf-reviewer-input-validation",
    "npm.cmd run build:local-course-5-wave-5-pdf-post-input-route-map",
    "npm.cmd run check:local-course-5-wave-5-pdf-post-input-route-map",
    "npm.cmd run verify",
  ],
  completionRule: "This route map is complete when all 85 Wave 5 PDF validation rows are assigned the PDF downstream route, ready rows are isolated for future semantic or future-loss review, and all module/deletion gates remain closed until real accepted reviewer evidence and public grounding checks pass.",
  boundary,
};

fs.writeFileSync(outputJson, `${JSON.stringify(routeMap, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Course 5 Wave 5 PDF Post-Input Route Map",
  "",
  `- Route map status: ${routeMap.routeMapStatus}`,
  `- Route rows: ${routeMap.routeRows}`,
  `- PDF route rows: ${routeMap.pdfRouteRows}`,
  `- Ready rows: ${routeMap.readyRows}`,
  `- Blocked rows: ${routeMap.blockedRows}`,
  `- Future-loss accounting ready rows: ${routeMap.futureLossAccountingReadyRows}`,
  `- Module merge allowed now: ${routeMap.moduleMergeAllowedNow}`,
  `- Deletion evidence allowed now: ${routeMap.deletionEvidenceAllowedNow}`,
  `- Source folder may be deleted: ${routeMap.sourceFolderMayBeDeleted}`,
  "",
  "## First Rows",
  "",
  "| Sample | Page | Status | Downstream route | Next gate |",
  "|---:|---:|---|---|---|",
  ...routeRows.map((row) => `| ${row.executionSampleNo} | ${row.pageNumber} | ${row.routeStatus} | ${row.downstreamRouteMap} | ${row.nextGate} |`),
  "",
  "## Boundary",
  "",
  boundary,
  "",
].join("\n"), "utf8");

const rowHtml = routeRows.map((row) => `
        <tr>
          <td>${row.executionSampleNo}</td>
          <td>${row.pageNumber}</td>
          <td>${htmlEscape(row.routeStatus)}</td>
          <td>${htmlEscape(row.downstreamRouteMap)}</td>
          <td>${htmlEscape(row.nextGate)}</td>
        </tr>`).join("");

fs.writeFileSync(outputHtml, `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Course 5 Wave 5 PDF Post-Input Route Map</title>
  <style>
    :root { font-family: Arial, Helvetica, sans-serif; background: #f7f8f4; color: #20211f; }
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
    <h1>Course 5 Wave 5 PDF Post-Input Route Map</h1>
    <div class="status">${htmlEscape(routeMap.routeMapStatus)}</div>
  </header>
  <section class="metrics">
    <div class="metric"><b>${routeMap.routeRows}</b><span>route rows</span></div>
    <div class="metric"><b>${routeMap.pdfRouteRows}</b><span>PDF route rows</span></div>
    <div class="metric"><b>${routeMap.readyRows}</b><span>ready rows</span></div>
    <div class="metric"><b>${routeMap.blockedRows}</b><span>blocked rows</span></div>
    <div class="metric"><b>${routeMap.futureLossAccountingReadyRows}</b><span>future-loss ready rows</span></div>
    <div class="metric"><b>${routeMap.sourceFolderMayBeDeleted}</b><span>source folder may be deleted</span></div>
  </section>
  <main>
    <table>
      <thead><tr><th>Sample</th><th>Page</th><th>Status</th><th>Downstream Route</th><th>Next Gate</th></tr></thead>
      <tbody>${rowHtml}</tbody>
    </table>
  </main>
  <footer>${htmlEscape(boundary)}</footer>
</body>
</html>
`, "utf8");

console.log(JSON.stringify({
  ok: true,
  routeMapStatus: routeMap.routeMapStatus,
  routeRows: routeMap.routeRows,
  pdfRouteRows: routeMap.pdfRouteRows,
  zipRouteRows: routeMap.zipRouteRows,
  readyRows: routeMap.readyRows,
  blockedRows: routeMap.blockedRows,
  futureLossAccountingReadyRows: routeMap.futureLossAccountingReadyRows,
  sourceFolderMayBeDeleted: routeMap.sourceFolderMayBeDeleted,
}, null, 2));
