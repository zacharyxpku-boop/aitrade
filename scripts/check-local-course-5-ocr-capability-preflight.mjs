import { spawnSync } from "node:child_process";
import fs from "node:fs";

const preflightPath = "docs/LOCAL_COURSE_5_OCR_CAPABILITY_PREFLIGHT.json";
const preflightMdPath = "docs/LOCAL_COURSE_5_OCR_CAPABILITY_PREFLIGHT.md";
const preflightHtmlPath = "docs/local-course-5-ocr-capability-preflight.html";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function commandAvailable(command, args = ["--version"]) {
  const result = spawnSync(command, args, { encoding: "utf8", shell: false, timeout: 5000 });
  return result.status === 0;
}

function pythonModuleAvailable(moduleName) {
  const code = `import importlib.util; print("1" if importlib.util.find_spec(${JSON.stringify(moduleName)}) else "0")`;
  const result = spawnSync("python", ["-c", code], { encoding: "utf8", shell: false, timeout: 5000 });
  return result.status === 0 && String(result.stdout || "").trim() === "1";
}

const preflight = readJson(preflightPath);
if (!fs.existsSync(preflightMdPath)) fail(`missing ${preflightMdPath}`);
if (!fs.existsSync(preflightHtmlPath)) fail(`missing ${preflightHtmlPath}`);
const html = fs.readFileSync(preflightHtmlPath, "utf8");

if (preflight.educationOnly !== true) fail("preflight must keep educationOnly:true");
if (preflight.productionReady !== false) fail("preflight must keep productionReady:false");
if (preflight.learnerFacingRelease !== false) fail("preflight must keep learnerFacingRelease:false");
if (preflight.approvalStatus !== "not_approved") fail("preflight must keep approvalStatus:not_approved");
if (preflight.writeAllowedNow !== false) fail("preflight must keep writeAllowedNow:false");

const liveCapabilities = {
  tesseractAvailable: commandAvailable("tesseract", ["--version"]),
  pytesseractAvailable: pythonModuleAvailable("pytesseract"),
  easyocrAvailable: pythonModuleAvailable("easyocr"),
  paddleocrAvailable: pythonModuleAvailable("paddleocr"),
  pdfRenderAvailable: pythonModuleAvailable("fitz"),
  pdfTextProbeAvailable: pythonModuleAvailable("pdfplumber") || pythonModuleAvailable("fitz"),
  imageAnalysisAvailable: pythonModuleAvailable("cv2") || pythonModuleAvailable("PIL"),
};
liveCapabilities.commandLineTesseractUsable = liveCapabilities.tesseractAvailable;
liveCapabilities.pythonTesseractUsable = liveCapabilities.tesseractAvailable && liveCapabilities.pytesseractAvailable;
liveCapabilities.neuralOcrUsable = liveCapabilities.easyocrAvailable || liveCapabilities.paddleocrAvailable;
liveCapabilities.ocrTextEngineAvailable =
  liveCapabilities.commandLineTesseractUsable ||
  liveCapabilities.pythonTesseractUsable ||
  liveCapabilities.neuralOcrUsable;

for (const [key, value] of Object.entries(liveCapabilities)) {
  if (preflight.capabilities?.[key] !== value) {
    fail(`capability drift for ${key}: preflight=${preflight.capabilities?.[key]} live=${value}; rebuild OCR capability preflight`);
  }
}

const expectedStatus = liveCapabilities.ocrTextEngineAvailable
  ? preflight.executionArtifactsStale
    ? "course_5_ocr_capability_available_rebuild_pdf_execution_artifacts"
    : "course_5_ocr_capability_available_ready_for_controlled_pdf_ocr_slice"
  : "course_5_ocr_capability_missing_pdf_full_text_absorption_blocked";
if (preflight.preflightStatus !== expectedStatus) fail(`unexpected preflightStatus: ${preflight.preflightStatus}`);

if (preflight.sourceFolderMayBeDeleted !== false) fail("source folder deletion must stay blocked");
if (preflight.currentKnowledgeArtifactsCanReplaceSourceFolder !== false) fail("knowledge artifacts must not replace source folder yet");
if (preflight.unresolvedSourceRows !== 49) fail("expected 49 unresolved Course 5 follow-up rows");
if (preflight.pdfFollowupRows !== 41 || preflight.zipFollowupRows !== 8) fail("PDF/ZIP follow-up split drift");
if (preflight.fullTextOcrRequiredRows !== 41) fail("expected 41 full-text OCR required rows");
if (liveCapabilities.ocrTextEngineAvailable) {
  if (preflight.ocrUnavailableBlockingRows !== 0) fail("OCR blocker count should be zero when OCR is live");
} else if (preflight.ocrUnavailableBlockingRows !== 41) {
  fail("expected 41 OCR-unavailable blocker rows while OCR is missing");
}
if (preflight.pdfSampleRows !== 121 || preflight.pdfReviewerInputRows !== 121) fail("PDF sample/reviewer input count drift");
if (preflight.pdfReadyInputRows !== 0 || preflight.pdfBlockedInputRows !== 121) fail("PDF reviewer inputs should remain blocked until real OCR/reviewer fields are filled");

if (!Array.isArray(preflight.controlledExecutionPlan) || preflight.controlledExecutionPlan.length !== 3) fail("controlled execution plan missing");
if (!Array.isArray(preflight.blockedUntil) || preflight.blockedUntil.length < 5) fail("blocked-until gates missing");
for (const artifactPath of Object.values(preflight.sourceArtifacts || {})) {
  if (!fs.existsSync(artifactPath)) fail(`missing source artifact: ${artifactPath}`);
}

for (const needle of [
  "Course 5 OCR Capability Preflight",
  "PDF follow-up rows",
  "full-text OCR required rows",
  "blocked PDF reviewer rows",
  "OCR text engine available",
  "source folder may be deleted",
]) {
  if (!html.includes(needle)) fail(`HTML missing: ${needle}`);
}

const boundaryText = `${preflight.boundary || ""} ${preflight.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education operations",
  "detects local ocr",
  "pdf rendering",
  "image-analysis",
  "41 course 5 pdf follow-up rows",
  "121 pdf reviewer input rows",
  "does not install software",
  "perform ocr",
  "generate reviewer conclusions",
  "accept machine drafts as human review",
  "delete files",
  "source-folder deletion",
  "learner-facing release",
  "copy private source wording",
  "stock recommendations",
  "live signals",
  "return promises",
  "real-money guidance",
  "production readiness",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary/completion missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  preflightStatus: preflight.preflightStatus,
  ocrTextEngineAvailable: preflight.capabilities.ocrTextEngineAvailable,
  pdfFollowupRows: preflight.pdfFollowupRows,
  pdfSampleRows: preflight.pdfSampleRows,
  pdfBlockedInputRows: preflight.pdfBlockedInputRows,
  sourceFolderMayBeDeleted: preflight.sourceFolderMayBeDeleted,
}, null, 2));
