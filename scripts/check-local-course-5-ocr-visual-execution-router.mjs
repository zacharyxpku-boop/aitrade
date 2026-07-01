import fs from "node:fs";

const routerPath = "docs/LOCAL_COURSE_5_OCR_VISUAL_EXECUTION_ROUTER.json";
const routerMdPath = "docs/LOCAL_COURSE_5_OCR_VISUAL_EXECUTION_ROUTER.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const router = readJson(routerPath);
if (!fs.existsSync(routerMdPath)) fail(`missing ${routerMdPath}`);

if (router.educationOnly !== true) fail("router must keep educationOnly:true");
if (router.productionReady !== false) fail("router must keep productionReady:false");
if (router.learnerFacingRelease !== false) fail("router must keep learnerFacingRelease:false");
if (router.approvalStatus !== "not_approved") fail("router must keep approvalStatus:not_approved");
if (router.writeAllowedNow !== false) fail("router must keep writeAllowedNow:false");
if (router.routerStatus !== "course_5_ocr_visual_execution_router_ready_folder_deletion_blocked") fail(`unexpected routerStatus: ${router.routerStatus}`);
if (router.sourceFolderMayBeDeleted !== false || router.currentKnowledgeArtifactsCanReplaceSourceFolder !== false) fail("source deletion boundary drift");

if (!router.capabilities || typeof router.capabilities.ocrTextEngineAvailable !== "boolean") fail("missing OCR capability declaration");
if (router.capabilities.pdfRenderAvailable !== true) fail("PDF render capability should be available through PyMuPDF");
if (router.capabilities.pdfTextProbeAvailable !== true) fail("PDF text probe capability should be available");
if (router.capabilities.imageAnalysisAvailable !== true) fail("image analysis capability should be available");

if (!Array.isArray(router.routeRows) || router.routeRows.length !== 49) fail("routeRows must cover all 49 unresolved sources");
if (router.unresolvedSourceRows !== 49) fail("unresolved source row count drift");
if (router.pdfRows !== 41 || router.zipRows !== 8) fail("PDF/ZIP route counts drift");
if (router.rowsWithRepresentativeSamples !== 49) fail("all unresolved rows should have representative samples");
if (router.canAdvanceWithVisualReviewNowRows !== 49) fail("all unresolved rows should be visually reviewable now");
if (router.fullTextOcrRequiredRows !== 41) fail("all 41 PDF follow-up rows should require OCR/full text path");
if (router.capabilities.ocrTextEngineAvailable === false && router.ocrUnavailableBlockingRows !== 41) fail("OCR-unavailable blocker count drift");
if (router.capabilities.ocrTextEngineAvailable === true && router.ocrUnavailableBlockingRows !== 0) fail("OCR available should clear OCR-unavailable blocker count");
if (!Array.isArray(router.firstExecutionSlice) || router.firstExecutionSlice.length !== 12) fail("first execution slice must include 12 rows");

const ids = new Set();
for (const row of router.routeRows) {
  if (!row.routerRowId || ids.has(row.routerRowId)) fail(`duplicate or missing routerRowId: ${row.routerRowId}`);
  ids.add(row.routerRowId);
  if (!row.recordId || !row.relativePath || !row.extension) fail(`missing route identity: ${row.routerRowId}`);
  if (row.hasRepresentativeSamples !== true || row.sampleImageCount <= 0) fail(`route row lacks representative samples: ${row.routerRowId}`);
  if (row.canAdvanceWithVisualReviewNow !== true) fail(`route row should be visually actionable now: ${row.routerRowId}`);
  if (row.extension === ".pdf" && row.fullTextOcrRequired !== true) fail(`PDF row missing OCR requirement: ${row.routerRowId}`);
  if (row.extension === ".zip" && row.finalResolutionGate !== "zip_image_package_semantic_review_or_documented_future_loss_acceptance") fail(`ZIP row has wrong final gate: ${row.routerRowId}`);
  if (!Array.isArray(row.reviewerSafetyRules) || row.reviewerSafetyRules.length < 4) fail(`missing safety rules: ${row.routerRowId}`);
}

const boundaryText = `${router.boundary || ""} ${router.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education operations",
  "ocr",
  "visual semantic review",
  "zip image-package review",
  "deletion-readiness",
  "does not perform irreversible deletion",
  "learner-facing release",
  "accept machine drafts as human review",
  "copy private source wording",
  "stock recommendations",
  "live signals",
  "return promises",
  "real-money guidance",
  "production readiness",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

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
