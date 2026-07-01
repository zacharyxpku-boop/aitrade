import { spawnSync } from "node:child_process";
import fs from "node:fs";

const routerPath = "docs/LOCAL_COURSE_5_OCR_VISUAL_EXECUTION_ROUTER.json";
const pdfExecutionPath = "docs/LOCAL_COURSE_5_PDF_OCR_VISUAL_EXECUTION_PACK.json";
const pdfValidationPath = "docs/LOCAL_COURSE_5_PDF_OCR_VISUAL_REVIEW_INPUT_VALIDATION.json";
const closurePath = "docs/LOCAL_COURSE_5_FOLLOWUP_CLOSURE_COCKPIT.json";

const outputJson = "docs/LOCAL_COURSE_5_OCR_CAPABILITY_PREFLIGHT.json";
const outputMd = "docs/LOCAL_COURSE_5_OCR_CAPABILITY_PREFLIGHT.md";
const outputHtml = "docs/local-course-5-ocr-capability-preflight.html";

const boundary = "Course 5 OCR capability preflight is private reviewer-facing education operations material. It detects local OCR, PDF rendering, and image-analysis capabilities, compares them with Course 5 unresolved PDF/visual gates, and routes the next execution step. It does not install software, perform OCR, generate reviewer conclusions, accept machine drafts as human review, delete files, approve source-folder deletion, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

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

function commandAvailable(command, args = ["--version"]) {
  const result = spawnSync(command, args, { encoding: "utf8", shell: false, timeout: 5000 });
  return {
    available: result.status === 0,
    status: result.status,
    stdoutFirstLine: String(result.stdout || "").split(/\r?\n/).find(Boolean) || "",
    stderrFirstLine: String(result.stderr || "").split(/\r?\n/).find(Boolean) || "",
  };
}

function pythonModuleAvailable(moduleName) {
  const code = `import importlib.util; print("1" if importlib.util.find_spec(${JSON.stringify(moduleName)}) else "0")`;
  const result = spawnSync("python", ["-c", code], { encoding: "utf8", shell: false, timeout: 5000 });
  return {
    available: result.status === 0 && String(result.stdout || "").trim() === "1",
    pythonAvailable: result.status === 0,
    status: result.status,
    stderrFirstLine: String(result.stderr || "").split(/\r?\n/).find(Boolean) || "",
  };
}

function htmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const router = readJson(routerPath);
const pdfExecution = readJson(pdfExecutionPath);
const pdfValidation = readJson(pdfValidationPath);
const closure = readJson(closurePath);

for (const [name, artifact] of Object.entries({ router, pdfExecution, pdfValidation, closure })) {
  assertBoundary(name, artifact);
}

const tesseract = commandAvailable("tesseract", ["--version"]);
const pythonVersion = commandAvailable("python", ["--version"]);
const modules = {
  pytesseract: pythonModuleAvailable("pytesseract"),
  easyocr: pythonModuleAvailable("easyocr"),
  paddleocr: pythonModuleAvailable("paddleocr"),
  fitz: pythonModuleAvailable("fitz"),
  pdfplumber: pythonModuleAvailable("pdfplumber"),
  cv2: pythonModuleAvailable("cv2"),
  PIL: pythonModuleAvailable("PIL"),
};

const pythonAvailable = pythonVersion.available || Object.values(modules).some((item) => item.pythonAvailable);
const commandLineTesseractUsable = tesseract.available;
const pythonTesseractUsable = tesseract.available && modules.pytesseract.available;
const neuralOcrUsable = modules.easyocr.available || modules.paddleocr.available;
const ocrTextEngineAvailable = commandLineTesseractUsable || pythonTesseractUsable || neuralOcrUsable;
const pdfRenderAvailable = modules.fitz.available;
const pdfTextProbeAvailable = modules.pdfplumber.available || modules.fitz.available;
const imageAnalysisAvailable = modules.cv2.available || modules.PIL.available;
const executionArtifactsStale =
  pdfExecution.localOcrAvailable !== ocrTextEngineAvailable ||
  router.capabilities?.ocrTextEngineAvailable !== ocrTextEngineAvailable;

const preflightStatus = ocrTextEngineAvailable
  ? executionArtifactsStale
    ? "course_5_ocr_capability_available_rebuild_pdf_execution_artifacts"
    : "course_5_ocr_capability_available_ready_for_controlled_pdf_ocr_slice"
  : "course_5_ocr_capability_missing_pdf_full_text_absorption_blocked";

const preflight = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  preflightStatus,
  sourceRoot: closure.sourceRoot,
  sourceFolderMayBeDeleted: false,
  currentKnowledgeArtifactsCanReplaceSourceFolder: false,
  unresolvedSourceRows: router.unresolvedSourceRows,
  pdfFollowupRows: router.pdfRows,
  zipFollowupRows: router.zipRows,
  fullTextOcrRequiredRows: router.fullTextOcrRequiredRows,
  ocrUnavailableBlockingRows: ocrTextEngineAvailable ? 0 : router.ocrUnavailableBlockingRows,
  pdfSampleRows: pdfExecution.sampleRowCount,
  pdfReviewerInputRows: pdfValidation.inputRows,
  pdfReadyInputRows: pdfValidation.readyRows,
  pdfBlockedInputRows: pdfValidation.blockedRows,
  capabilities: {
    pythonAvailable,
    pythonVersion: pythonVersion.stdoutFirstLine || pythonVersion.stderrFirstLine,
    tesseractAvailable: tesseract.available,
    tesseractVersion: tesseract.stdoutFirstLine || tesseract.stderrFirstLine,
    pytesseractAvailable: modules.pytesseract.available,
    easyocrAvailable: modules.easyocr.available,
    paddleocrAvailable: modules.paddleocr.available,
    pdfRenderAvailable,
    pdfTextProbeAvailable,
    imageAnalysisAvailable,
    commandLineTesseractUsable,
    pythonTesseractUsable,
    neuralOcrUsable,
    ocrTextEngineAvailable,
  },
  moduleChecks: Object.fromEntries(Object.entries(modules).map(([name, value]) => [name, {
    available: value.available,
    pythonAvailable: value.pythonAvailable,
    status: value.status,
    stderrFirstLine: value.stderrFirstLine,
  }])),
  executionArtifactsStale,
  nextGate: ocrTextEngineAvailable
    ? executionArtifactsStale
      ? "rebuild_course_5_pdf_ocr_visual_execution_pack_and_preflight_before_ocr_slice"
      : "run_controlled_pdf_ocr_slice_against_first_priority_rows_then_validate_reviewer_inputs"
    : "install_or_provide_trusted_ocr_engine_then_rebuild_course_5_pdf_execution_artifacts",
  controlledExecutionPlan: [
    {
      step: "preflight",
      command: "npm.cmd run build:local-course-5-ocr-capability-preflight && npm.cmd run check:local-course-5-ocr-capability-preflight",
      requiredBeforeNextStep: true,
    },
    {
      step: "if_ocr_missing",
      command: "Install a trusted local OCR engine such as Tesseract plus language data, then rerun the preflight.",
      requiredBeforeNextStep: !ocrTextEngineAvailable,
    },
    {
      step: "if_ocr_available",
      command: "Rebuild PDF execution artifacts, run a small priority OCR slice, and validate filled reviewer-owned OCR fields before any module merge.",
      requiredBeforeNextStep: ocrTextEngineAvailable,
    },
  ],
  blockedUntil: [
    "OCR text engine is available or the user explicitly accepts cold-storage/future-loss handling for the 41 PDF rows.",
    "121 PDF reviewer input rows contain real OCR/visual reviewer-owned fields.",
    "PDF input validation reports ready rows without forbidden trading-advice language.",
    "Accepted rows are merged only as paraphrased teaching-module evidence, not copied source wording.",
    "Deletion readiness is recomputed and still requires explicit user confirmation.",
  ],
  sourceArtifacts: {
    router: routerPath,
    pdfExecution: pdfExecutionPath,
    pdfValidation: pdfValidationPath,
    closure: closurePath,
  },
  commands: [
    "npm.cmd run build:local-course-5-ocr-capability-preflight",
    "npm.cmd run check:local-course-5-ocr-capability-preflight",
    "npm.cmd run verify",
  ],
  completionRule: "This OCR preflight is complete when it detects local OCR/PDF/image capabilities, ties the result to all 41 Course 5 PDF follow-up rows and 121 PDF reviewer input rows, and keeps source-folder deletion blocked until real OCR or reviewer evidence is accepted.",
  boundary,
};

fs.writeFileSync(outputJson, `${JSON.stringify(preflight, null, 2)}\n`, "utf8");

fs.writeFileSync(outputMd, [
  "# Course 5 OCR Capability Preflight",
  "",
  `- Preflight status: ${preflight.preflightStatus}`,
  `- Source root: ${preflight.sourceRoot}`,
  `- OCR text engine available: ${preflight.capabilities.ocrTextEngineAvailable}`,
  `- Tesseract available: ${preflight.capabilities.tesseractAvailable}`,
  `- pytesseract available: ${preflight.capabilities.pytesseractAvailable}`,
  `- easyocr available: ${preflight.capabilities.easyocrAvailable}`,
  `- paddleocr available: ${preflight.capabilities.paddleocrAvailable}`,
  `- PDF render available: ${preflight.capabilities.pdfRenderAvailable}`,
  `- PDF text probe available: ${preflight.capabilities.pdfTextProbeAvailable}`,
  `- Image analysis available: ${preflight.capabilities.imageAnalysisAvailable}`,
  `- PDF follow-up rows: ${preflight.pdfFollowupRows}`,
  `- Full-text OCR required rows: ${preflight.fullTextOcrRequiredRows}`,
  `- PDF sample rows: ${preflight.pdfSampleRows}`,
  `- PDF blocked reviewer input rows: ${preflight.pdfBlockedInputRows}`,
  `- Source folder may be deleted: ${preflight.sourceFolderMayBeDeleted}`,
  `- Next gate: ${preflight.nextGate}`,
  "",
  "## Blocked Until",
  "",
  ...preflight.blockedUntil.map((item) => `- ${item}`),
  "",
  "## Boundary",
  "",
  boundary,
  "",
].join("\n"), "utf8");

const capabilityRows = Object.entries(preflight.capabilities).map(([key, value]) => `
        <tr><td>${htmlEscape(key)}</td><td>${htmlEscape(value)}</td></tr>`).join("");

fs.writeFileSync(outputHtml, `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Course 5 OCR Capability Preflight</title>
  <style>
    :root { font-family: Arial, Helvetica, sans-serif; background: #f7f7f3; color: #20211f; }
    body { margin: 0; }
    header { background: #fff; border-bottom: 1px solid #d9d9d2; padding: 18px 24px; }
    h1 { margin: 0 0 8px; font-size: 24px; letter-spacing: 0; }
    .status { color: #5c625b; font-size: 13px; }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; padding: 18px 24px; }
    .metric { background: #fff; border: 1px solid #d5d8d0; border-radius: 8px; padding: 12px; }
    .metric b { display: block; font-size: 22px; margin-bottom: 5px; }
    .metric span { color: #5c625b; font-size: 12px; }
    main { padding: 0 24px 24px; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #d5d8d0; border-radius: 8px; overflow: hidden; }
    td, th { border-bottom: 1px solid #e3e5df; padding: 8px 10px; text-align: left; font-size: 13px; }
    th { background: #eef0eb; }
    footer { padding: 18px 24px 30px; color: #55584f; font-size: 12px; line-height: 1.5; }
  </style>
</head>
<body>
  <header>
    <h1>Course 5 OCR Capability Preflight</h1>
    <div class="status">${htmlEscape(preflight.preflightStatus)}</div>
  </header>
  <section class="metrics">
    <div class="metric"><b>${preflight.pdfFollowupRows}</b><span>PDF follow-up rows</span></div>
    <div class="metric"><b>${preflight.fullTextOcrRequiredRows}</b><span>full-text OCR required rows</span></div>
    <div class="metric"><b>${preflight.pdfSampleRows}</b><span>PDF sample rows</span></div>
    <div class="metric"><b>${preflight.pdfBlockedInputRows}</b><span>blocked PDF reviewer rows</span></div>
    <div class="metric"><b>${preflight.capabilities.ocrTextEngineAvailable}</b><span>OCR text engine available</span></div>
    <div class="metric"><b>${preflight.sourceFolderMayBeDeleted}</b><span>source folder may be deleted</span></div>
  </section>
  <main>
    <table>
      <thead><tr><th>Capability</th><th>Value</th></tr></thead>
      <tbody>${capabilityRows}</tbody>
    </table>
  </main>
  <footer>${htmlEscape(boundary)}</footer>
</body>
</html>
`, "utf8");

console.log(JSON.stringify({
  ok: true,
  preflightStatus: preflight.preflightStatus,
  ocrTextEngineAvailable: preflight.capabilities.ocrTextEngineAvailable,
  pdfFollowupRows: preflight.pdfFollowupRows,
  pdfSampleRows: preflight.pdfSampleRows,
  pdfBlockedInputRows: preflight.pdfBlockedInputRows,
  sourceFolderMayBeDeleted: preflight.sourceFolderMayBeDeleted,
}, null, 2));
