import fs from "node:fs";

const validationPath = "docs/LOCAL_COURSE_5_ZIP_VISUAL_PRIORITY_SLICE_INPUT_VALIDATION.json";
const slicePath = "docs/LOCAL_COURSE_5_ZIP_VISUAL_PRIORITY_SLICE.json";
const teachingPath = "docs/LOCAL_COURSE_5_TEACHING_MODULE_DISTILLATION.json";
const deletionPath = "docs/LOCAL_COURSE_5_DELETION_READINESS.json";

const outputJson = "docs/LOCAL_COURSE_5_ZIP_VISUAL_PRIORITY_SLICE_ROUTE_MAP.json";
const outputMd = "docs/LOCAL_COURSE_5_ZIP_VISUAL_PRIORITY_SLICE_ROUTE_MAP.md";
const outputHtml = "docs/local-course-5-zip-visual-priority-slice-route-map.html";

const boundary = "Course 5 ZIP visual priority slice route map is private reviewer-facing education operations material. It routes validated ZIP reviewer-owned visual rows toward semantic merge preview, teaching-module distillation review, public grounding, and deletion-readiness recomputation while keeping all release, write, and deletion gates closed until real accepted reviewer evidence exists. It does not perform OCR, generate reviewer conclusions, accept machine drafts as human review, merge content into learner-facing modules, delete files, approve source-folder deletion, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

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
const slice = readJson(slicePath);
const teaching = readJson(teachingPath);
const deletion = readJson(deletionPath);

for (const [name, artifact] of Object.entries({ validation, slice, teaching, deletion })) {
  assertBoundary(name, artifact);
}

const sampleByReviewRowId = new Map(slice.sampleRows.map((row) => [row.reviewRowId, row]));
const routeRows = validation.validationRows.map((row) => {
  const sample = sampleByReviewRowId.get(row.reviewRowId);
  const ready = row.readyForZipVisualPrioritySemanticReviewGate === true;
  return {
    reviewRowId: row.reviewRowId,
    zipSampleId: row.zipSampleId,
    recordId: row.recordId,
    archiveImageName: row.archiveImageName,
    relativePath: sample?.relativePath || "",
    priorityBand: sample?.priorityBand || "",
    densityBand: sample?.densityBand || "",
    moduleTags: sample?.moduleTags || [],
    candidateConcepts: sample?.candidateConcepts || [],
    validationStatus: row.validationStatus,
    readyForZipVisualPrioritySemanticReviewGate: ready,
    routeStatus: ready
      ? "ready_for_zip_semantic_merge_preview_public_grounding_required"
      : "blocked_before_zip_semantic_merge_preview",
    semanticMergePreviewAllowedNow: ready,
    moduleDistillationAllowedNow: false,
    deletionEvidenceAllowedNow: false,
    nextGate: ready
      ? "build_zip_priority_slice_semantic_merge_preview_then_public_grounding_review"
      : row.nextGate,
    sourceFolderMayBeDeleted: false,
    educationOnly: true,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    productionReady: false,
    writeAllowedNow: false,
  };
});

const readyRows = routeRows.filter((row) => row.readyForZipVisualPrioritySemanticReviewGate).length;
const blockedRows = routeRows.length - readyRows;

const routeMap = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  routeMapStatus: readyRows > 0
    ? "course_5_zip_visual_priority_slice_route_map_has_ready_rows_release_and_deletion_blocked"
    : "course_5_zip_visual_priority_slice_route_map_ready_all_rows_blocked",
  routeMode: "post_input_route_map_for_all_locally_resolvable_zip_visual_slice",
  sourceRoot: slice.sourceRoot,
  sourceFolderMayBeDeleted: false,
  currentKnowledgeArtifactsCanReplaceSourceFolder: false,
  sourceSlice: slicePath,
  sourceValidation: validationPath,
  sourceTeachingDistillation: teachingPath,
  sourceDeletionReadiness: deletionPath,
  routeRows: routeRows.length,
  readyRows,
  blockedRows,
  semanticMergePreviewReadyRows: readyRows,
  moduleMergeAllowedNow: false,
  deletionEvidenceAllowedNow: false,
  acceptedForModuleDistillationRows: 0,
  acceptedForDeletionReadinessRows: 0,
  learnerReadyModules: 0,
  teachingModules: teaching.modules,
  modulesBlockedByVisualOrOcr: teaching.modulesBlockedByVisualOrOcr,
  deletionReadinessStatus: deletion.readinessStatus,
  routeRowsDetail: routeRows,
  nextOperationalGates: [
    "Fill real visual reviewer-owned fields for the 85 ZIP priority slice rows.",
    "Re-run ZIP visual priority slice input validation until rows become ready.",
    "Build a ZIP semantic merge preview only for validation-ready rows.",
    "Run public grounding and originality checks before module distillation.",
    "Recompute deletion readiness only after accepted reviewer evidence exists for all required follow-up source rows.",
  ],
  commands: [
    "npm.cmd run validate:local-course-5-zip-visual-priority-slice-input",
    "npm.cmd run check:local-course-5-zip-visual-priority-slice-input-validation",
    "npm.cmd run build:local-course-5-zip-visual-priority-slice-route-map",
    "npm.cmd run check:local-course-5-zip-visual-priority-slice-route-map",
    "npm.cmd run verify",
  ],
  completionRule: "This route map is complete when all 85 ZIP priority-slice validation rows are assigned a post-input route, ready rows are isolated for future semantic merge preview, and module/deletion gates remain closed until real accepted reviewer evidence and public grounding checks pass.",
  boundary,
};

fs.writeFileSync(outputJson, `${JSON.stringify(routeMap, null, 2)}\n`, "utf8");

fs.writeFileSync(outputMd, [
  "# Course 5 ZIP Visual Priority Slice Route Map",
  "",
  `- Route map status: ${routeMap.routeMapStatus}`,
  `- Route rows: ${routeMap.routeRows}`,
  `- Ready rows: ${routeMap.readyRows}`,
  `- Blocked rows: ${routeMap.blockedRows}`,
  `- Semantic merge preview ready rows: ${routeMap.semanticMergePreviewReadyRows}`,
  `- Module merge allowed now: ${routeMap.moduleMergeAllowedNow}`,
  `- Deletion evidence allowed now: ${routeMap.deletionEvidenceAllowedNow}`,
  `- Source folder may be deleted: ${routeMap.sourceFolderMayBeDeleted}`,
  "",
  "## First Rows",
  "",
  "| Review row | Priority | Density | Status | Next gate |",
  "|---|---|---|---|---|",
  ...routeRows.slice(0, 20).map((row) => `| ${row.reviewRowId} | ${row.priorityBand} | ${row.densityBand} | ${row.routeStatus} | ${row.nextGate} |`),
  "",
  "## Boundary",
  "",
  boundary,
  "",
].join("\n"), "utf8");

const rowHtml = routeRows.map((row) => `
        <tr>
          <td>${htmlEscape(row.reviewRowId)}</td>
          <td>${htmlEscape(row.priorityBand)}</td>
          <td>${htmlEscape(row.densityBand)}</td>
          <td>${htmlEscape(row.routeStatus)}</td>
          <td>${htmlEscape(row.nextGate)}</td>
        </tr>`).join("");

fs.writeFileSync(outputHtml, `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Course 5 ZIP Visual Priority Slice Route Map</title>
  <style>
    :root { font-family: Arial, Helvetica, sans-serif; background: #f7f7f3; color: #20211f; }
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
    <h1>Course 5 ZIP Visual Priority Slice Route Map</h1>
    <div class="status">${htmlEscape(routeMap.routeMapStatus)}</div>
  </header>
  <section class="metrics">
    <div class="metric"><b>${routeMap.routeRows}</b><span>route rows</span></div>
    <div class="metric"><b>${routeMap.readyRows}</b><span>ready rows</span></div>
    <div class="metric"><b>${routeMap.blockedRows}</b><span>blocked rows</span></div>
    <div class="metric"><b>${routeMap.moduleMergeAllowedNow}</b><span>module merge allowed now</span></div>
    <div class="metric"><b>${routeMap.deletionEvidenceAllowedNow}</b><span>deletion evidence allowed now</span></div>
    <div class="metric"><b>${routeMap.sourceFolderMayBeDeleted}</b><span>source folder may be deleted</span></div>
  </section>
  <main>
    <table>
      <thead><tr><th>Review Row</th><th>Priority</th><th>Density</th><th>Route Status</th><th>Next Gate</th></tr></thead>
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
  readyRows: routeMap.readyRows,
  blockedRows: routeMap.blockedRows,
  moduleMergeAllowedNow: routeMap.moduleMergeAllowedNow,
  deletionEvidenceAllowedNow: routeMap.deletionEvidenceAllowedNow,
  sourceFolderMayBeDeleted: routeMap.sourceFolderMayBeDeleted,
}, null, 2));
