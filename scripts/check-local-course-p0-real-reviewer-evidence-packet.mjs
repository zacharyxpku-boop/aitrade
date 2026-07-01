import fs from "node:fs";

const packetPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_EVIDENCE_PACKET.json";
const packetMdPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_EVIDENCE_PACKET.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const packet = readJson(packetPath);
if (!fs.existsSync(packetMdPath)) fail(`missing ${packetMdPath}`);

if (packet.educationOnly !== true) fail("evidence packet must keep educationOnly:true");
if (packet.productionReady !== false) fail("evidence packet must keep productionReady:false");
if (packet.learnerFacingRelease !== false) fail("evidence packet must keep learnerFacingRelease:false");
if (packet.approvalStatus !== "not_approved") fail("evidence packet must remain not_approved");
if (packet.packetStatus !== "p0_real_reviewer_evidence_packet_ready_not_reviewed") fail(`unexpected packetStatus: ${packet.packetStatus}`);
if (packet.packetMode !== "public_grounding_suggestions_for_p0_reviewer_tasks") fail("unexpected packetMode");
if (packet.sourceTaskBoard !== "docs/LOCAL_COURSE_P0_REAL_REVIEWER_TASK_BOARD.json") fail("unexpected source task board");
if (packet.sourcePublicGapAudit !== "docs/PUBLIC_SOURCE_GAP_AUDIT.json") fail("unexpected public gap audit source");
if (packet.totalTasks !== 22) fail(`expected 22 tasks, got ${packet.totalTasks}`);
if (packet.tasksWithSuggestedRefs !== 22) fail("all 22 tasks must have suggested refs");
if (packet.tasksWithWikipediaRefs !== 22) fail("all 22 tasks must have at least one Wikipedia/share-alike ref");
if (packet.tasksWithPublicContextRefs !== 22) fail("all 22 tasks must have at least one public context ref");
if (packet.totalSuggestedRefs < 66) fail("packet must provide at least 3 refs per task");
if (packet.learnerCitationApprovedTasks !== 0) fail("packet must not approve learner citations");
if (packet.realHumanInputEntries !== 0) fail("packet must not claim real human input");
if (packet.writeAllowedNow !== false) fail("packet must not allow writes");
if (packet.manualAuthorizationRequired !== true) fail("manual authorization must be required");
if (!Array.isArray(packet.commands) || packet.commands.length < 4) fail("packet must include command rows");
if (!Array.isArray(packet.taskRows) || packet.taskRows.length !== 22) fail("taskRows must contain 22 rows");

for (const row of packet.taskRows) {
  if (!row.id || !row.taskId || !row.category) fail("task row missing task identity");
  if (!Array.isArray(row.suggestedPublicRefs) || row.suggestedPublicRefs.length < 3) fail(`${row.id} needs at least 3 suggested refs`);
  if (row.wikipediaRefCount < 1) fail(`${row.id} needs at least one Wikipedia/share-alike ref`);
  if (row.publicContextRefCount < 1) fail(`${row.id} needs at least one public context ref`);
  if (row.learnerCitationApproved !== false) fail(`${row.id} must not approve learner citation`);
  if (row.approvalStatus !== "not_approved") fail(`${row.id} must remain not_approved`);
  if (row.learnerFacingRelease !== false) fail(`${row.id} must not be learner-facing release ready`);
  if (row.nextGate !== "real_reviewer_source_fit_note_then_validation") fail(`${row.id} has unexpected nextGate`);
  if (!/Reviewer:/i.test(row.sourceFitPrompt || "")) fail(`${row.id} missing sourceFitPrompt`);
  if (!/publicReferenceNotes/i.test(row.publicReferenceNotesPrompt || "")) fail(`${row.id} missing publicReferenceNotesPrompt`);
  const claimBoundary = (row.claimBoundary || "").toLowerCase();
  for (const phrase of ["setup", "signal", "future outcome", "strategy edge", "real-money action"]) {
    if (!claimBoundary.includes(phrase)) fail(`${row.id} claim boundary missing ${phrase}`);
  }
  if (!row.suggestedPublicRefs.every((ref) =>
    ref.reviewerUseOnly === true &&
    ref.learnerCitationApproved === false &&
    ref.documentId &&
    ref.name &&
    ref.url &&
    ref.excerptPolicy
  )) fail(`${row.id} suggested refs must be reviewer-only with source metadata`);
  if (!row.suggestedPublicRefs.some((ref) => ref.tier === "share_alike" || ref.family === "Wikipedia")) {
    fail(`${row.id} missing Wikipedia/share-alike ref`);
  }
  if (!row.suggestedPublicRefs.some((ref) => ref.tier !== "share_alike" && ref.family !== "Wikipedia")) {
    fail(`${row.id} missing public context ref`);
  }
}

const boundaryText = `${packet.boundary || ""} ${packet.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "public and wikipedia refs",
  "does not fill sourcefitnote",
  "does not create real reviewer judgment",
  "does not approve learner-facing citations",
  "does not authorize overlay writes",
  "stock recommendation",
  "live signal",
  "return promise",
  "broker workflow",
  "real-money action",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: packet.educationOnly,
  productionReady: packet.productionReady,
  learnerFacingRelease: packet.learnerFacingRelease,
  approvalStatus: packet.approvalStatus,
  packetStatus: packet.packetStatus,
  totalTasks: packet.totalTasks,
  tasksWithSuggestedRefs: packet.tasksWithSuggestedRefs,
  tasksWithWikipediaRefs: packet.tasksWithWikipediaRefs,
  tasksWithPublicContextRefs: packet.tasksWithPublicContextRefs,
  totalSuggestedRefs: packet.totalSuggestedRefs,
  learnerCitationApprovedTasks: packet.learnerCitationApprovedTasks,
  realHumanInputEntries: packet.realHumanInputEntries,
  writeAllowedNow: packet.writeAllowedNow,
}, null, 2));
