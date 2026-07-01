import fs from "node:fs";
import path from "node:path";

const zipIndexPath = "docs/LOCAL_COURSE_5_ZIP_VISUAL_SAMPLE_INDEX.json";
const routerPath = "docs/LOCAL_COURSE_5_OCR_VISUAL_EXECUTION_ROUTER.json";
const outputJson = "docs/LOCAL_COURSE_5_ZIP_IMAGE_PACKAGE_EXECUTION_PACK.json";
const outputMd = "docs/LOCAL_COURSE_5_ZIP_IMAGE_PACKAGE_EXECUTION_PACK.md";
const outputHtml = "docs/local-course-5-zip-image-package-execution-pack.html";
const inputJson = "docs/reviewer-inputs/LOCAL_COURSE_5_ZIP_IMAGE_PACKAGE_REVIEW_INPUT_TEMPLATE.json";
const inputMd = "docs/reviewer-inputs/LOCAL_COURSE_5_ZIP_IMAGE_PACKAGE_REVIEW_INPUT_TEMPLATE.md";

const boundary = "Course 5 ZIP image-package execution pack is private reviewer-facing education operations material. It organizes ZIP chart-image packages and representative samples for visual semantic review, teaching-module placement, and deletion-readiness evidence. It does not perform OCR, delete files, approve folder deletion, approve learner-facing release, accept machine drafts as human review, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

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

function docsHref(filePath) {
  return path.relative("docs", filePath).replace(/\\/g, "/");
}

function densityBand(sample) {
  const density = Number(sample.visualDensity || 0);
  const edge = Number(sample.edgeDensity || 0);
  if (density >= 0.18 || edge >= 0.07) return "dense_chart_or_annotation";
  if (density >= 0.08 || edge >= 0.035) return "moderate_chart_structure";
  return "sparse_or_low_contrast_chart";
}

const zipIndex = readJson(zipIndexPath);
const router = readJson(routerPath);
assertBoundary("zipIndex", zipIndex);
assertBoundary("router", router);

const zipRouteByRecord = new Map((router.routeRows || []).filter((row) => row.extension === ".zip").map((row) => [row.recordId, row]));
const sourceRows = (zipIndex.rows || []).map((row) => {
  const route = zipRouteByRecord.get(row.recordId);
  if (!route) fail(`missing router row for ZIP ${row.recordId}`);
  return {
    recordId: row.recordId,
    relativePath: row.relativePath,
    sourceLocalPath: row.sourceLocalPath,
    sizeMb: row.sizeMb,
    entryCount: row.entryCount,
    imageEntryCount: row.imageEntryCount,
    sampleCount: row.sampleCount,
    moduleTags: row.moduleTags || [],
    courseAlignment: row.courseAlignment || [],
    priorityBand: route.priorityBand,
    canFullyResolveWithLocalToolsNow: route.canFullyResolveWithLocalToolsNow,
    immediateVisualAction: route.immediateVisualAction,
    finalResolutionGate: route.finalResolutionGate,
    sourceFolderMayBeDeleted: false,
  };
}).sort((a, b) => b.sizeMb - a.sizeMb);

const sampleRows = (zipIndex.sampleRowsDetail || []).map((sample, index) => {
  const route = zipRouteByRecord.get(sample.recordId);
  return {
    reviewRowId: `course5_zip_image_review_${String(index + 1).padStart(3, "0")}`,
    zipSampleId: sample.zipSampleId,
    recordId: sample.recordId,
    relativePath: sample.relativePath,
    archiveImageIndex: sample.archiveImageIndex,
    archiveImageName: sample.archiveImageName,
    archiveImageBytes: sample.archiveImageBytes,
    sampleImagePath: sample.sampleImagePath,
    sampleImageHref: docsHref(sample.sampleImagePath),
    moduleTags: sample.moduleTags || [],
    courseAlignment: sample.courseAlignment || [],
    width: sample.width,
    height: sample.height,
    edgeDensity: sample.edgeDensity,
    darkPixelRatio: sample.darkPixelRatio,
    visualDensity: sample.visualDensity,
    densityBand: densityBand(sample),
    priorityBand: route?.priorityBand || "P2_followup_blocker",
    reviewStatus: "blocked_missing_real_visual_reviewer_input",
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    productionReady: false,
    writeAllowedNow: false,
  };
});

const inputRows = sampleRows.map((row) => ({
  reviewRowId: row.reviewRowId,
  zipSampleId: row.zipSampleId,
  recordId: row.recordId,
  sampleImagePath: row.sampleImagePath,
  reviewerObservedChartElements: "",
  reviewerObservedTextOrLabels: "",
  reviewerTeachingModulePlacement: "",
  reviewerParaphrasedConceptNote: "",
  reviewerDeletionReadinessEvidence: "",
  acceptForZipSemanticReview: false,
  acceptForDeletionReadiness: false,
  reviewerNameOrInitials: "",
  reviewedAt: "",
  reviewStatus: "blocked_missing_real_visual_reviewer_input",
  safetyReminder: "Education-only private reviewer note. Do not copy source wording or produce trading advice/signals.",
}));

const packageRowsByRecord = sampleRows.reduce((acc, row) => {
  if (!acc[row.recordId]) acc[row.recordId] = [];
  acc[row.recordId].push(row);
  return acc;
}, {});

const executionPack = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  executionStatus: "course_5_zip_image_package_execution_pack_ready_blocked_on_real_visual_review",
  sourceZipIndex: zipIndexPath,
  sourceRouter: routerPath,
  sourceFolderMayBeDeleted: false,
  currentKnowledgeArtifactsCanReplaceSourceFolder: false,
  zipRows: sourceRows.length,
  totalImageEntries: sourceRows.reduce((sum, row) => sum + (row.imageEntryCount || 0), 0),
  sampleRowCount: sampleRows.length,
  inputRowCount: inputRows.length,
  readyInputRows: 0,
  blockedInputRows: inputRows.length,
  canFullyResolveWithLocalToolsNowRows: sourceRows.filter((row) => row.canFullyResolveWithLocalToolsNow).length,
  densityBandCounts: sampleRows.reduce((acc, row) => {
    acc[row.densityBand] = (acc[row.densityBand] || 0) + 1;
    return acc;
  }, {}),
  sourceRows,
  sampleRows,
  commands: [
    "npm.cmd run build:local-course-5-zip-image-package-execution-pack",
    "npm.cmd run check:local-course-5-zip-image-package-execution-pack",
    "npm.cmd run verify",
  ],
  completionRule: "This ZIP execution pack is ready when all 8 ZIP image packages and 85 representative samples are organized for real visual reviewer input, blank input rows remain blocked, and folder deletion remains false until accepted reviewer evidence is validated.",
  boundary,
};

fs.mkdirSync(path.dirname(inputJson), { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(executionPack, null, 2)}\n`, "utf8");
fs.writeFileSync(inputJson, `${JSON.stringify({
  generatedAt: executionPack.generatedAt,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  inputTemplateStatus: "course_5_zip_image_package_review_input_template_ready_blocked_missing_input",
  sourceExecutionPack: outputJson,
  inputRows: inputRows.length,
  readyInputRows: 0,
  blockedInputRows: inputRows.length,
  rows: inputRows,
  boundary,
}, null, 2)}\n`, "utf8");

fs.writeFileSync(outputMd, [
  "# Course 5 ZIP Image Package Execution Pack",
  "",
  `- Execution status: ${executionPack.executionStatus}`,
  `- ZIP packages: ${executionPack.zipRows}`,
  `- Total image entries: ${executionPack.totalImageEntries}`,
  `- Representative sample rows: ${executionPack.sampleRowCount}`,
  `- Can fully resolve with local tools now: ${executionPack.canFullyResolveWithLocalToolsNowRows}`,
  `- Ready input rows: ${executionPack.readyInputRows}`,
  `- Blocked input rows: ${executionPack.blockedInputRows}`,
  `- Source folder may be deleted: ${executionPack.sourceFolderMayBeDeleted}`,
  "",
  "## ZIP Packages",
  "",
  "| Size MB | Images | Samples | Priority | Module Tags | Relative Path |",
  "|---:|---:|---:|---|---|---|",
  ...sourceRows.map((row) => `| ${row.sizeMb} | ${row.imageEntryCount} | ${row.sampleCount} | ${row.priorityBand} | ${row.moduleTags.join(", ")} | ${row.relativePath} |`),
  "",
  "## Boundary",
  "",
  boundary,
  "",
].join("\n"), "utf8");

fs.writeFileSync(inputMd, [
  "# Course 5 ZIP Image Package Review Input Template",
  "",
  `- Input rows: ${inputRows.length}`,
  "- Fill only after real visual review.",
  "- Keep acceptForZipSemanticReview and acceptForDeletionReadiness false until evidence is ready.",
  "",
  "## Fields",
  "",
  "- reviewerObservedChartElements",
  "- reviewerObservedTextOrLabels",
  "- reviewerTeachingModulePlacement",
  "- reviewerParaphrasedConceptNote",
  "- reviewerDeletionReadinessEvidence",
  "",
  "## Boundary",
  "",
  boundary,
  "",
].join("\n"), "utf8");

const sampleCards = sampleRows.map((row) => `
      <article class="card">
        <img src="${htmlEscape(row.sampleImageHref)}" alt="${htmlEscape(row.zipSampleId)}" />
        <div class="meta">
          <b>${htmlEscape(row.reviewRowId)}</b>
          <span>${htmlEscape(row.densityBand)}</span>
          <span>${htmlEscape(row.moduleTags.join(", "))}</span>
          <span>${htmlEscape(row.archiveImageName)}</span>
        </div>
      </article>`).join("\n");

fs.writeFileSync(outputHtml, `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Course 5 ZIP Image Package Execution Pack</title>
  <style>
    :root { font-family: Arial, Helvetica, sans-serif; background: #f6f7f4; color: #20221f; }
    body { margin: 0; }
    header { background: #fff; border-bottom: 1px solid #d9ddd3; padding: 18px 22px; }
    h1 { margin: 0 0 8px; font-size: 24px; letter-spacing: 0; }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; padding: 16px 22px; }
    .metric { background: #fff; border: 1px solid #d9ddd3; border-radius: 8px; padding: 12px; }
    .metric b { display: block; font-size: 22px; }
    main { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; padding: 0 22px 24px; }
    .card { background: #fff; border: 1px solid #d9ddd3; border-radius: 8px; overflow: hidden; }
    img { width: 100%; aspect-ratio: 16 / 9; object-fit: contain; background: #e9ece5; display: block; }
    .meta { display: grid; gap: 4px; padding: 10px; font-size: 12px; color: #4d514a; }
    .meta b { color: #20221f; }
    footer { padding: 18px 22px 30px; color: #555a51; font-size: 12px; line-height: 1.5; }
  </style>
</head>
<body>
  <header>
    <h1>Course 5 ZIP Image Package Execution Pack</h1>
    <div>${htmlEscape(executionPack.executionStatus)}</div>
  </header>
  <section class="metrics">
    <div class="metric"><b>${executionPack.zipRows}</b><span>ZIP packages</span></div>
    <div class="metric"><b>${executionPack.totalImageEntries}</b><span>image entries</span></div>
    <div class="metric"><b>${executionPack.sampleRowCount}</b><span>sample rows</span></div>
    <div class="metric"><b>${executionPack.readyInputRows}</b><span>ready rows</span></div>
    <div class="metric"><b>${executionPack.blockedInputRows}</b><span>blocked rows</span></div>
  </section>
  <main>${sampleCards}</main>
  <footer>${htmlEscape(boundary)}</footer>
</body>
</html>
`, "utf8");

console.log(JSON.stringify({
  ok: true,
  executionStatus: executionPack.executionStatus,
  zipRows: executionPack.zipRows,
  totalImageEntries: executionPack.totalImageEntries,
  sampleRowCount: executionPack.sampleRowCount,
  readyInputRows: executionPack.readyInputRows,
  blockedInputRows: executionPack.blockedInputRows,
  sourceFolderMayBeDeleted: executionPack.sourceFolderMayBeDeleted,
}, null, 2));
