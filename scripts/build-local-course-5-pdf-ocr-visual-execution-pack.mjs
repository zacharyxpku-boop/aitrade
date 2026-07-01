import fs from "node:fs";
import path from "node:path";

const workPacksPath = "docs/LOCAL_COURSE_5_FOLLOWUP_WORK_PACKS.json";
const routerPath = "docs/LOCAL_COURSE_5_OCR_VISUAL_EXECUTION_ROUTER.json";
const outputJson = "docs/LOCAL_COURSE_5_PDF_OCR_VISUAL_EXECUTION_PACK.json";
const outputMd = "docs/LOCAL_COURSE_5_PDF_OCR_VISUAL_EXECUTION_PACK.md";
const outputHtml = "docs/local-course-5-pdf-ocr-visual-execution-pack.html";
const inputJson = "docs/reviewer-inputs/LOCAL_COURSE_5_PDF_OCR_VISUAL_REVIEW_INPUT_TEMPLATE.json";
const inputMd = "docs/reviewer-inputs/LOCAL_COURSE_5_PDF_OCR_VISUAL_REVIEW_INPUT_TEMPLATE.md";

const boundary = "Course 5 PDF OCR and visual execution pack is private reviewer-facing education operations material. It organizes scanned, low-text, and large PDF sources into OCR and representative-page visual review work. It does not perform OCR, delete files, approve folder deletion, approve learner-facing release, accept machine drafts as human review, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

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

function ocrRoute(row) {
  if (row.extractionBucket === "large_file_deferred_for_dedicated_visual_or_ocr_pass") {
    return "split_large_pdf_then_ocr_or_external_ocr_pages";
  }
  if (row.extractionBucket === "very_low_text_likely_scanned_or_visual") {
    return "ocr_low_text_pdf_then_compare_against_visual_samples";
  }
  return "ocr_scanned_pdf_then_validate_representative_visual_samples";
}

const workPacks = readJson(workPacksPath);
const router = readJson(routerPath);
assertBoundary("workPacks", workPacks);
assertBoundary("router", router);

const routeByRecord = new Map((router.routeRows || []).filter((row) => row.extension === ".pdf").map((row) => [row.recordId, row]));
const pdfWorkItems = (workPacks.workItems || []).filter((row) => row.extension === ".pdf");

const sourceRows = pdfWorkItems.map((row) => {
  const route = routeByRecord.get(row.recordId);
  if (!route) fail(`missing router row for PDF ${row.recordId}`);
  return {
    recordId: row.recordId,
    workItemId: row.workItemId,
    relativePath: row.relativePath,
    sourceLocalPath: row.sourceLocalPath,
    sizeMb: row.sizeMb,
    sha256: row.sha256,
    moduleTags: row.moduleTags || [],
    courseAlignment: row.courseAlignment || [],
    extractionBucket: row.extractionBucket,
    textExtraction: row.textExtraction,
    charCount: row.charCount || 0,
    pageCount: row.pageCount || 0,
    sampleCount: (row.sampleImages || []).length,
    priorityBand: route.priorityBand,
    ocrStatus: row.ocrStatus || "ocr_engine_missing_not_text_complete",
    localOcrAvailable: router.capabilities?.ocrTextEngineAvailable === true,
    canAdvanceWithVisualReviewNow: route.canAdvanceWithVisualReviewNow === true,
    canFullyResolveWithLocalToolsNow: route.canFullyResolveWithLocalToolsNow === true,
    ocrExecutionRoute: ocrRoute(row),
    immediateVisualAction: route.immediateVisualAction,
    finalResolutionGate: route.finalResolutionGate,
    sourceFolderMayBeDeleted: false,
  };
}).sort((a, b) => b.sizeMb - a.sizeMb);

const sampleRows = [];
for (const source of sourceRows) {
  const original = pdfWorkItems.find((row) => row.recordId === source.recordId);
  for (const sample of original.sampleImages || []) {
    sampleRows.push({
      reviewRowId: `course5_pdf_ocr_visual_review_${String(sampleRows.length + 1).padStart(3, "0")}`,
      recordId: source.recordId,
      workItemId: source.workItemId,
      relativePath: source.relativePath,
      pageNumber: sample.pageNumber,
      sampleImagePath: sample.imagePath,
      sampleImageHref: docsHref(sample.imagePath),
      moduleTags: source.moduleTags,
      courseAlignment: source.courseAlignment,
      extractionBucket: source.extractionBucket,
      priorityBand: source.priorityBand,
      ocrExecutionRoute: source.ocrExecutionRoute,
      reviewStatus: "blocked_missing_real_ocr_or_visual_reviewer_input",
      learnerFacingRelease: false,
      approvalStatus: "not_approved",
      productionReady: false,
      writeAllowedNow: false,
    });
  }
}

const inputRows = sampleRows.map((row) => ({
  reviewRowId: row.reviewRowId,
  recordId: row.recordId,
  sampleImagePath: row.sampleImagePath,
  pageNumber: row.pageNumber,
  reviewerObservedPageElements: "",
  reviewerOcrOrManualText: "",
  reviewerTeachingModulePlacement: "",
  reviewerParaphrasedConceptNote: "",
  reviewerDeletionReadinessEvidence: "",
  acceptForPdfVisualSemanticReview: false,
  acceptForDeletionReadiness: false,
  reviewerNameOrInitials: "",
  reviewedAt: "",
  reviewStatus: "blocked_missing_real_ocr_or_visual_reviewer_input",
  safetyReminder: "Education-only private reviewer note. Do not copy source wording or produce trading advice/signals.",
}));

const executionPack = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  executionStatus: "course_5_pdf_ocr_visual_execution_pack_ready_blocked_on_ocr_or_real_visual_review",
  sourceWorkPacks: workPacksPath,
  sourceRouter: routerPath,
  sourceFolderMayBeDeleted: false,
  currentKnowledgeArtifactsCanReplaceSourceFolder: false,
  pdfRows: sourceRows.length,
  totalPages: sourceRows.reduce((sum, row) => sum + row.pageCount, 0),
  sampleRowCount: sampleRows.length,
  inputRowCount: inputRows.length,
  readyInputRows: 0,
  blockedInputRows: inputRows.length,
  largePdfRows: sourceRows.filter((row) => row.extractionBucket === "large_file_deferred_for_dedicated_visual_or_ocr_pass").length,
  scannedOrLowTextPdfRows: sourceRows.filter((row) => row.extractionBucket !== "large_file_deferred_for_dedicated_visual_or_ocr_pass").length,
  localOcrAvailable: router.capabilities?.ocrTextEngineAvailable === true,
  canAdvanceWithVisualReviewNowRows: sourceRows.filter((row) => row.canAdvanceWithVisualReviewNow).length,
  canFullyResolveWithLocalToolsNowRows: sourceRows.filter((row) => row.canFullyResolveWithLocalToolsNow).length,
  priorityCounts: sourceRows.reduce((acc, row) => {
    acc[row.priorityBand] = (acc[row.priorityBand] || 0) + 1;
    return acc;
  }, {}),
  sourceRows,
  sampleRows,
  commands: [
    "npm.cmd run build:local-course-5-pdf-ocr-visual-execution-pack",
    "npm.cmd run check:local-course-5-pdf-ocr-visual-execution-pack",
    "npm.cmd run verify",
  ],
  completionRule: "This PDF OCR and visual execution pack is ready when all 41 PDF follow-up sources and 121 representative page samples are organized for OCR or real visual reviewer input, blank input rows remain blocked, and folder deletion remains false until validated OCR/reviewer evidence resolves every row.",
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
  inputTemplateStatus: "course_5_pdf_ocr_visual_review_input_template_ready_blocked_missing_input",
  sourceExecutionPack: outputJson,
  inputRows: inputRows.length,
  readyInputRows: 0,
  blockedInputRows: inputRows.length,
  rows: inputRows,
  boundary,
}, null, 2)}\n`, "utf8");

fs.writeFileSync(outputMd, [
  "# Course 5 PDF OCR And Visual Execution Pack",
  "",
  `- Execution status: ${executionPack.executionStatus}`,
  `- PDF rows: ${executionPack.pdfRows}`,
  `- Total pages: ${executionPack.totalPages}`,
  `- Representative sample rows: ${executionPack.sampleRowCount}`,
  `- Large PDF rows: ${executionPack.largePdfRows}`,
  `- Scanned/low-text PDF rows: ${executionPack.scannedOrLowTextPdfRows}`,
  `- Local OCR available: ${executionPack.localOcrAvailable}`,
  `- Can advance with visual review now: ${executionPack.canAdvanceWithVisualReviewNowRows}`,
  `- Can fully resolve with local tools now: ${executionPack.canFullyResolveWithLocalToolsNowRows}`,
  `- Source folder may be deleted: ${executionPack.sourceFolderMayBeDeleted}`,
  "",
  "## Largest PDF Sources",
  "",
  "| Size MB | Pages | Samples | Priority | OCR Route | Module Tags | Relative Path |",
  "|---:|---:|---:|---|---|---|---|",
  ...sourceRows.slice(0, 20).map((row) => `| ${row.sizeMb} | ${row.pageCount} | ${row.sampleCount} | ${row.priorityBand} | ${row.ocrExecutionRoute} | ${row.moduleTags.join(", ")} | ${row.relativePath} |`),
  "",
  "## Boundary",
  "",
  boundary,
  "",
].join("\n"), "utf8");

fs.writeFileSync(inputMd, [
  "# Course 5 PDF OCR And Visual Review Input Template",
  "",
  `- Input rows: ${inputRows.length}`,
  "- Fill only after OCR or real visual page review.",
  "- Keep acceptForPdfVisualSemanticReview and acceptForDeletionReadiness false until evidence is ready.",
  "",
  "## Fields",
  "",
  "- reviewerObservedPageElements",
  "- reviewerOcrOrManualText",
  "- reviewerTeachingModulePlacement",
  "- reviewerParaphrasedConceptNote",
  "- reviewerDeletionReadinessEvidence",
  "",
  "## Boundary",
  "",
  boundary,
  "",
].join("\n"), "utf8");

const cards = sampleRows.map((row) => `
      <article class="card">
        <img src="${htmlEscape(row.sampleImageHref)}" alt="${htmlEscape(row.reviewRowId)}" />
        <div class="meta">
          <b>${htmlEscape(row.reviewRowId)}</b>
          <span>page ${htmlEscape(row.pageNumber)}</span>
          <span>${htmlEscape(row.priorityBand)}</span>
          <span>${htmlEscape(row.moduleTags.join(", "))}</span>
        </div>
      </article>`).join("\n");

fs.writeFileSync(outputHtml, `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Course 5 PDF OCR And Visual Execution Pack</title>
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
    img { width: 100%; aspect-ratio: 4 / 3; object-fit: contain; background: #e9ece5; display: block; }
    .meta { display: grid; gap: 4px; padding: 10px; font-size: 12px; color: #4d514a; }
    .meta b { color: #20221f; }
    footer { padding: 18px 22px 30px; color: #555a51; font-size: 12px; line-height: 1.5; }
  </style>
</head>
<body>
  <header>
    <h1>Course 5 PDF OCR And Visual Execution Pack</h1>
    <div>${htmlEscape(executionPack.executionStatus)}</div>
  </header>
  <section class="metrics">
    <div class="metric"><b>${executionPack.pdfRows}</b><span>PDF rows</span></div>
    <div class="metric"><b>${executionPack.totalPages}</b><span>pages</span></div>
    <div class="metric"><b>${executionPack.sampleRowCount}</b><span>sample rows</span></div>
    <div class="metric"><b>${executionPack.localOcrAvailable}</b><span>local OCR available</span></div>
    <div class="metric"><b>${executionPack.blockedInputRows}</b><span>blocked rows</span></div>
  </section>
  <main>${cards}</main>
  <footer>${htmlEscape(boundary)}</footer>
</body>
</html>
`, "utf8");

console.log(JSON.stringify({
  ok: true,
  executionStatus: executionPack.executionStatus,
  pdfRows: executionPack.pdfRows,
  totalPages: executionPack.totalPages,
  sampleRowCount: executionPack.sampleRowCount,
  readyInputRows: executionPack.readyInputRows,
  blockedInputRows: executionPack.blockedInputRows,
  localOcrAvailable: executionPack.localOcrAvailable,
  sourceFolderMayBeDeleted: executionPack.sourceFolderMayBeDeleted,
}, null, 2));
