import fs from "node:fs";
import { spawnSync } from "node:child_process";

const workPacksPath = "docs/LOCAL_COURSE_5_FOLLOWUP_WORK_PACKS.json";
const retentionPath = "docs/LOCAL_COURSE_5_SOURCE_RETENTION_MANIFEST.json";
const cockpitPath = "docs/LOCAL_COURSE_5_ABSORPTION_COCKPIT.json";
const outputJson = "docs/LOCAL_COURSE_5_OCR_VISUAL_EXECUTION_ROUTER.json";
const outputMd = "docs/LOCAL_COURSE_5_OCR_VISUAL_EXECUTION_ROUTER.md";

const boundary = "Course 5 OCR and visual execution router is private reviewer-facing education operations material. It routes unresolved local supplemental sources into OCR, visual semantic review, ZIP image-package review, and cold-storage decision work after source intake and deletion-readiness checks. It does not perform irreversible deletion, approve learner-facing release, accept machine drafts as human review, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

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

function detectTesseract() {
  const result = spawnSync("tesseract", ["--version"], { encoding: "utf8", timeout: 5000 });
  return {
    available: result.status === 0,
    versionLine: result.status === 0 ? String(result.stdout || "").split(/\r?\n/)[0] : null,
  };
}

function detectPythonModules() {
  const code = [
    "import json",
    "mods=['fitz','pypdf','pdfplumber','PIL','pytesseract','easyocr','cv2']",
    "out={}",
    "for m in mods:",
    "    try:",
    "        __import__(m)",
    "        out[m]=True",
    "    except Exception:",
    "        out[m]=False",
    "print(json.dumps(out, sort_keys=True))",
  ].join("\n");
  const result = spawnSync("python", ["-c", code], { encoding: "utf8", timeout: 10000 });
  if (result.status !== 0) {
    return { pythonAvailable: false, modules: {} };
  }
  return { pythonAvailable: true, modules: JSON.parse(result.stdout) };
}

function routeForItem(item, capabilities) {
  const sampleCount = (item.sampleImages || []).length;
  const hasSamples = sampleCount > 0;
  const isZip = item.extension === ".zip";
  const isLargePdf = item.extractionBucket === "large_file_deferred_for_dedicated_visual_or_ocr_pass";
  const fullTextOcrRequired = item.extension === ".pdf";
  const ocrUnavailableBlocksFullResolution = fullTextOcrRequired && !capabilities.ocrTextEngineAvailable;
  const immediateVisualAction = isZip
    ? "review_zip_representative_images_and_select_cluster_expansion"
    : isLargePdf
      ? "review_selected_large_pdf_pages_before_full_split_ocr"
      : "review_pdf_sample_pages_for_chart_semantics_before_full_ocr";
  const finalResolutionGate = isZip
    ? "zip_image_package_semantic_review_or_documented_future_loss_acceptance"
    : capabilities.ocrTextEngineAvailable
      ? "run_full_ocr_then_merge_validated_reviewer_notes"
      : "install_or_use_external_ocr_then_merge_validated_reviewer_notes";
  const priorityScore =
    Math.round((item.sizeMb || 0) * 10) +
    (isZip ? 5000 : 0) +
    (isLargePdf ? 4000 : 0) +
    ((item.moduleTags || []).includes("chart_pattern_encyclopedia") ? 3000 : 0) +
    ((item.moduleTags || []).includes("reversals") ? 1200 : 0) +
    sampleCount * 20;

  return {
    routerRowId: `course5_ocr_visual_route_${item.recordId}`,
    workItemId: item.workItemId,
    recordId: item.recordId,
    relativePath: item.relativePath,
    extension: item.extension,
    sizeMb: item.sizeMb,
    bytes: item.bytes,
    moduleTags: item.moduleTags || [],
    courseAlignment: item.courseAlignment || [],
    extractionBucket: item.extractionBucket,
    pageCount: item.pageCount,
    imageEntryCount: item.imageEntryCount || 0,
    sampleImageCount: sampleCount,
    hasRepresentativeSamples: hasSamples,
    fullTextOcrRequired,
    ocrUnavailableBlocksFullResolution,
    canAdvanceWithVisualReviewNow: hasSamples,
    canFullyResolveWithLocalToolsNow: isZip ? hasSamples : capabilities.ocrTextEngineAvailable && hasSamples,
    immediateVisualAction,
    finalResolutionGate,
    priorityScore,
    priorityBand: priorityScore >= 30000 ? "P0_space_and_curriculum_blocker" : priorityScore >= 8000 ? "P1_high_value_blocker" : "P2_followup_blocker",
    reviewerSafetyRules: [
      "Use notes only for private reviewer distillation.",
      "Do not copy private source wording into learner-facing lessons.",
      "Treat chart semantics as educational pattern-reading material, not signals or trading advice.",
      "Keep deletion blocked until validated OCR or documented future-loss acceptance exists.",
    ],
  };
}

const workPacks = readJson(workPacksPath);
const retention = readJson(retentionPath);
const cockpit = readJson(cockpitPath);
for (const [name, artifact] of Object.entries({ workPacks, retention, cockpit })) {
  assertBoundary(name, artifact);
}

const tesseract = detectTesseract();
const python = detectPythonModules();
const capabilities = {
  tesseractAvailable: tesseract.available,
  tesseractVersionLine: tesseract.versionLine,
  pythonAvailable: python.pythonAvailable,
  pythonModules: python.modules,
  pdfRenderAvailable: python.modules.fitz === true,
  pdfTextProbeAvailable: python.modules.pypdf === true || python.modules.pdfplumber === true,
  imageAnalysisAvailable: python.modules.PIL === true && python.modules.cv2 === true,
  ocrTextEngineAvailable: tesseract.available === true || python.modules.pytesseract === true || python.modules.easyocr === true,
};

const routeRows = (workPacks.workItems || [])
  .map((item) => routeForItem(item, capabilities))
  .sort((a, b) => b.priorityScore - a.priorityScore || String(a.relativePath).localeCompare(String(b.relativePath)));

const router = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  routerStatus: "course_5_ocr_visual_execution_router_ready_folder_deletion_blocked",
  sourceRoot: workPacks.sourceIntake?.sourceRoot || retention.sourceRoot,
  sourceFolderMayBeDeleted: false,
  currentKnowledgeArtifactsCanReplaceSourceFolder: false,
  capabilities,
  unresolvedSourceRows: routeRows.length,
  pdfRows: routeRows.filter((row) => row.extension === ".pdf").length,
  zipRows: routeRows.filter((row) => row.extension === ".zip").length,
  rowsWithRepresentativeSamples: routeRows.filter((row) => row.hasRepresentativeSamples).length,
  canAdvanceWithVisualReviewNowRows: routeRows.filter((row) => row.canAdvanceWithVisualReviewNow).length,
  fullTextOcrRequiredRows: routeRows.filter((row) => row.fullTextOcrRequired).length,
  ocrUnavailableBlockingRows: routeRows.filter((row) => row.ocrUnavailableBlocksFullResolution).length,
  canFullyResolveWithLocalToolsNowRows: routeRows.filter((row) => row.canFullyResolveWithLocalToolsNow).length,
  p0Rows: routeRows.filter((row) => row.priorityBand === "P0_space_and_curriculum_blocker").length,
  p1Rows: routeRows.filter((row) => row.priorityBand === "P1_high_value_blocker").length,
  p2Rows: routeRows.filter((row) => row.priorityBand === "P2_followup_blocker").length,
  firstExecutionSlice: routeRows.slice(0, 12).map((row, index) => ({
    order: index + 1,
    routerRowId: row.routerRowId,
    recordId: row.recordId,
    relativePath: row.relativePath,
    sizeMb: row.sizeMb,
    extension: row.extension,
    moduleTags: row.moduleTags,
    immediateVisualAction: row.immediateVisualAction,
    finalResolutionGate: row.finalResolutionGate,
    priorityBand: row.priorityBand,
  })),
  routeRows,
  commands: [
    "npm.cmd run build:local-course-5-ocr-visual-execution-router",
    "npm.cmd run check:local-course-5-ocr-visual-execution-router",
    "npm.cmd run verify",
  ],
  completionRule: "This router is complete when all 49 Course 5 must-retain follow-up sources are assigned an OCR/visual execution route, representative sample coverage is explicit, local OCR capability is declared, and source-folder deletion remains blocked until validated OCR, visual semantic review, or documented future-loss acceptance resolves every row.",
  boundary,
};

fs.writeFileSync(outputJson, `${JSON.stringify(router, null, 2)}\n`, "utf8");

fs.writeFileSync(outputMd, [
  "# Course 5 OCR And Visual Execution Router",
  "",
  `- Router status: ${router.routerStatus}`,
  `- Unresolved source rows: ${router.unresolvedSourceRows}`,
  `- PDF rows requiring full-text OCR path: ${router.fullTextOcrRequiredRows}`,
  `- ZIP image-package rows: ${router.zipRows}`,
  `- Rows with representative samples: ${router.rowsWithRepresentativeSamples}`,
  `- Can advance with visual review now: ${router.canAdvanceWithVisualReviewNowRows}`,
  `- OCR unavailable blocking rows: ${router.ocrUnavailableBlockingRows}`,
  `- Can fully resolve with local tools now: ${router.canFullyResolveWithLocalToolsNowRows}`,
  `- Source folder may be deleted: ${router.sourceFolderMayBeDeleted}`,
  "",
  "## Local Capability Probe",
  "",
  `- Tesseract available: ${router.capabilities.tesseractAvailable}`,
  `- Python available: ${router.capabilities.pythonAvailable}`,
  `- PDF render available: ${router.capabilities.pdfRenderAvailable}`,
  `- PDF text probe available: ${router.capabilities.pdfTextProbeAvailable}`,
  `- Image analysis available: ${router.capabilities.imageAnalysisAvailable}`,
  `- OCR text engine available: ${router.capabilities.ocrTextEngineAvailable}`,
  "",
  "## First Execution Slice",
  "",
  "| Order | Size MB | Extension | Priority | Module Tags | Immediate Action | Final Gate | Relative Path |",
  "|---:|---:|---|---|---|---|---|---|",
  ...router.firstExecutionSlice.map((row) => `| ${row.order} | ${row.sizeMb} | ${row.extension} | ${row.priorityBand} | ${row.moduleTags.join(", ")} | ${row.immediateVisualAction} | ${row.finalResolutionGate} | ${row.relativePath} |`),
  "",
  "## Boundary",
  "",
  boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  routerStatus: router.routerStatus,
  unresolvedSourceRows: router.unresolvedSourceRows,
  rowsWithRepresentativeSamples: router.rowsWithRepresentativeSamples,
  canAdvanceWithVisualReviewNowRows: router.canAdvanceWithVisualReviewNowRows,
  fullTextOcrRequiredRows: router.fullTextOcrRequiredRows,
  ocrUnavailableBlockingRows: router.ocrUnavailableBlockingRows,
  canFullyResolveWithLocalToolsNowRows: router.canFullyResolveWithLocalToolsNowRows,
  sourceFolderMayBeDeleted: router.sourceFolderMayBeDeleted,
}, null, 2));
