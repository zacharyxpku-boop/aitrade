import fs from "node:fs";

const packetPath = "docs/LOCAL_COURSE_LOW_EXTRACTION_HIGH_RES_REVIEW_PACKET.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const packet = readJson(packetPath);
const documentRows = packet.documentRows || [];
const pageRows = packet.pageRows || [];

if (packet.educationOnly !== true) fail("high-res packet must keep educationOnly:true");
if (packet.productionReady !== false) fail("high-res packet must keep productionReady:false");
if (packet.learnerFacingRelease !== false) fail("high-res packet must keep learnerFacingRelease:false");
if (packet.approvalStatus !== "not_approved") fail("high-res packet must remain not_approved");
if (packet.packetStatus !== "high_res_visual_review_packet_ready") fail(`unexpected packetStatus: ${packet.packetStatus}`);
if (packet.screenshotScale < 1.2) fail(`expected screenshotScale >= 1.2, got ${packet.screenshotScale}`);
if (packet.lowExtractionDocs !== 5 || documentRows.length !== 5) fail(`expected 5 document rows, got ${packet.lowExtractionDocs}/${documentRows.length}`);
if (packet.totalPages !== 22 || packet.highResPreviewPages !== 22 || pageRows.length !== 22) {
  fail(`expected 22 high-res pages, got ${packet.totalPages}/${packet.highResPreviewPages}/${pageRows.length}`);
}
if (packet.manualTranscriptionHighResPages !== 19) fail(`expected 19 manual transcription high-res pages, got ${packet.manualTranscriptionHighResPages}`);
if (packet.sourceReplacementHighResPages !== 3) fail(`expected 3 source replacement high-res pages, got ${packet.sourceReplacementHighResPages}`);
if (packet.minHighResPreviewBytes <= 1000) fail(`high-res preview too small: ${packet.minHighResPreviewBytes}`);

const ids = new Set();
for (const row of pageRows) {
  if (!row.id || ids.has(row.id)) fail(`duplicate or missing page row id: ${row.id}`);
  ids.add(row.id);
  if (row.educationOnly !== true || row.productionReady !== false) fail(`${row.id} boundary drift`);
  if (row.learnerFacingRelease !== false || row.approvalStatus !== "not_approved") fail(`${row.id} release gate drift`);
  if (!row.highResPreviewPath || !fs.existsSync(row.highResPreviewPath)) fail(`${row.id} high-res preview missing`);
  if (!row.lowResPreviewPath || !fs.existsSync(row.lowResPreviewPath)) fail(`${row.id} low-res preview missing`);
  if ((row.highResPreviewBytes || 0) <= (row.lowResPreviewBytes || 0)) fail(`${row.id} high-res preview did not grow`);
  if ((row.width || 0) < 450 || (row.height || 0) < 250) fail(`${row.id} high-res dimensions too small: ${row.width}x${row.height}`);
  if (row.transcriptionStatus !== "not_started") fail(`${row.id} transcription status must start not_started`);
  if (!["high_res_preview_ready_for_manual_transcription", "still_source_replacement_required"].includes(row.visualEvidenceStatus)) {
    fail(`${row.id} invalid visualEvidenceStatus: ${row.visualEvidenceStatus}`);
  }
  if (row.visualEvidenceStatus === "high_res_preview_ready_for_manual_transcription") {
    if (row.intakeStatus !== "manual_transcription_candidate") fail(`${row.id} manual high-res row must come from manual intake`);
    if (row.reviewerUse !== "manual_transcription_evidence_only") fail(`${row.id} reviewer use drift`);
    if (row.nextGate !== "manual_transcription_then_source_fit_public_grounding_originality_review") fail(`${row.id} manual next gate drift`);
  }
  if (row.visualEvidenceStatus === "still_source_replacement_required") {
    if (row.intakeStatus !== "blank_preview_needs_source_replacement") fail(`${row.id} replacement high-res row must come from blank intake`);
    if (row.reviewerUse !== "source_replacement_decision_evidence_only") fail(`${row.id} replacement reviewer use drift`);
    if (row.nextGate !== "source_replacement_decision_then_rerun_visual_review") fail(`${row.id} replacement next gate drift`);
  }
}

for (const row of documentRows) {
  if (row.educationOnly !== true || row.productionReady !== false) fail(`${row.id} document boundary drift`);
  if (row.learnerFacingRelease !== false || row.approvalStatus !== "not_approved") fail(`${row.id} document release gate drift`);
  if (row.highResPreviewPages !== row.pageCount) fail(`${row.id} page count mismatch`);
  if (row.manualTranscriptionPages + row.sourceReplacementPages !== row.highResPreviewPages) fail(`${row.id} page split mismatch`);
  if (row.totalHighResPreviewBytes <= 0) fail(`${row.id} missing high-res bytes`);
}

const boundaryText = `${packet.boundary || ""} ${packet.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-only visual evidence",
  "do not perform ocr",
  "infer missing content",
  "replace source files",
  "approve learner-facing release",
  "copy private course wording",
  "trading advice",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
]) {
  if (!boundaryText.includes(phrase)) fail(`high-res packet boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: packet.educationOnly,
  productionReady: packet.productionReady,
  learnerFacingRelease: packet.learnerFacingRelease,
  approvalStatus: packet.approvalStatus,
  packetStatus: packet.packetStatus,
  lowExtractionDocs: packet.lowExtractionDocs,
  highResPreviewPages: packet.highResPreviewPages,
  manualTranscriptionHighResPages: packet.manualTranscriptionHighResPages,
  sourceReplacementHighResPages: packet.sourceReplacementHighResPages,
  minHighResPreviewBytes: packet.minHighResPreviewBytes,
  maxHighResPreviewBytes: packet.maxHighResPreviewBytes,
}, null, 2));
