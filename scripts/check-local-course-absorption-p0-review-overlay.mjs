import fs from "node:fs";

const overlayPath = "docs/LOCAL_COURSE_ABSORPTION_P0_REVIEW_OVERLAY.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const overlay = readJson(overlayPath);
const entries = overlay.reviewEntries || [];

if (overlay.educationOnly !== true) fail("P0 review overlay must keep educationOnly:true");
if (overlay.productionReady !== false) fail("P0 review overlay must keep productionReady:false");
if (overlay.learnerFacingRelease !== false) fail("P0 review overlay must keep learnerFacingRelease:false");
if (overlay.approvalStatus !== "not_approved") fail("P0 review overlay must remain not_approved");
if (overlay.overlayStatus !== "p0_review_not_started") fail(`unexpected overlayStatus: ${overlay.overlayStatus}`);
if (overlay.totalP0Tasks !== 22 || entries.length !== 22) fail(`expected 22 entries, got ${overlay.totalP0Tasks}/${entries.length}`);
if (overlay.manualTranscriptionTasks !== 19) fail(`expected 19 manual entries, got ${overlay.manualTranscriptionTasks}`);
if (overlay.sourceReplacementTasks !== 3) fail(`expected 3 replacement entries, got ${overlay.sourceReplacementTasks}`);
if (overlay.notStartedTasks !== 22) fail(`expected 22 not started entries, got ${overlay.notStartedTasks}`);
if (overlay.inProgressTasks !== 0 || overlay.readyForValidationTasks !== 0 || overlay.acceptedForNextGateTasks !== 0) {
  fail("initial overlay must not mark tasks in progress, ready, or accepted");
}
if (overlay.blockedTasks !== 22) fail(`expected 22 blocked tasks, got ${overlay.blockedTasks}`);

const ids = new Set();
for (const entry of entries) {
  if (!entry.id || ids.has(entry.id)) fail(`duplicate or missing entry id: ${entry.id}`);
  ids.add(entry.id);
  if (entry.educationOnly !== true || entry.productionReady !== false) fail(`${entry.id} boundary drift`);
  if (entry.learnerFacingRelease !== false || entry.approvalStatus !== "not_approved") fail(`${entry.id} release gate drift`);
  if (entry.priority !== "P0" || entry.reviewStatus !== "not_started") fail(`${entry.id} must start as not_started P0`);
  if (entry.reviewerName !== "" || entry.reviewedAt !== "") fail(`${entry.id} reviewer fields must start blank`);
  if (entry.validationStatus !== "not_ready") fail(`${entry.id} validationStatus must start not_ready`);
  if (!entry.previewPath || !fs.existsSync(entry.previewPath)) fail(`${entry.id} preview missing`);
  if (!entry.previewUrl?.startsWith("/docs/local-course-low-extraction-previews/")) fail(`${entry.id} previewUrl missing`);
  if (!Array.isArray(entry.acceptanceCriteria) || entry.acceptanceCriteria.length < 4) fail(`${entry.id} missing acceptance criteria`);
  if (!Array.isArray(entry.nextCommandHints) || entry.nextCommandHints.length < 4) fail(`${entry.id} missing command hints`);
  if (entry.fieldCompletion?.requiredFieldsFilled !== 0 || entry.fieldCompletion?.complete !== false) fail(`${entry.id} field completion drift`);
}

for (const entry of entries.filter((item) => item.category === "manual_transcription")) {
  if (entry.humanTranscription !== "" || entry.humanSummary !== "") fail(`${entry.id} transcription fields must start blank`);
  if (!Array.isArray(entry.uncertainWords) || entry.uncertainWords.length !== 0) fail(`${entry.id} uncertainWords must start empty`);
  if (entry.replacementSourcePath !== null || entry.replacementNote !== null || entry.rerunEvidence !== null) fail(`${entry.id} replacement fields must be null for manual entries`);
  if (!Object.values(entry.checklist || {}).every((value) => value === "not_started")) fail(`${entry.id} checklist must start not_started`);
  if (entry.nextGate !== "fill_human_transcription_then_source_fit_public_grounding_originality_review") fail(`${entry.id} next gate drift`);
}

for (const entry of entries.filter((item) => item.category === "source_replacement")) {
  if (entry.humanTranscription !== null || entry.humanSummary !== null || entry.uncertainWords !== null) fail(`${entry.id} manual fields must be null for replacement entries`);
  if (entry.replacementSourcePath !== "" || entry.replacementNote !== "" || entry.rerunEvidence !== "") fail(`${entry.id} replacement fields must start blank`);
  if (!Object.values(entry.checklist || {}).every((value) => value === "not_started")) fail(`${entry.id} replacement checklist must start not_started`);
  if (entry.nextGate !== "replace_or_reexport_source_pdf_before_absorption") fail(`${entry.id} next gate drift`);
}

const boundaryText = `${overlay.boundary || ""} ${overlay.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "does not perform ocr",
  "infer missing content",
  "copy private course wording",
  "approve learner-facing release",
  "trading advice",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
]) {
  if (!boundaryText.includes(phrase)) fail(`overlay boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: overlay.educationOnly,
  productionReady: overlay.productionReady,
  learnerFacingRelease: overlay.learnerFacingRelease,
  approvalStatus: overlay.approvalStatus,
  overlayStatus: overlay.overlayStatus,
  totalP0Tasks: overlay.totalP0Tasks,
  manualTranscriptionTasks: overlay.manualTranscriptionTasks,
  sourceReplacementTasks: overlay.sourceReplacementTasks,
  notStartedTasks: overlay.notStartedTasks,
  readyForValidationTasks: overlay.readyForValidationTasks,
  acceptedForNextGateTasks: overlay.acceptedForNextGateTasks,
}, null, 2));
