import fs from "node:fs";

const packetPath = "docs/LOCAL_COURSE_REFINEMENT_PACKET.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const hardForbiddenPatterns = [
  /\u63a8\u8350\u4e70\u5165/,
  /\u63a8\u8350\u5356\u51fa/,
  /\u4fdd\u8bc1\u6536\u76ca/,
  /\u80dc\u7387\u627f\u8bfa/,
  /\u5b9e\u76d8\u4fe1\u53f7/,
  /\u81ea\u52a8\u4e0b\u5355/,
  /\u63a5\u5165\u5238\u5546/,
  /\u771f\u5b9e\u8d44\u91d1\u5efa\u8bae/,
  /\bstock recommendation\b/i,
  /\blive trading signal\b/i,
  /\bauto-?trading\b/i,
  /\bguaranteed return\b/i,
];

const packet = readJson(packetPath);
const candidates = packet.candidateCardsList || [];
const overlayLessons = packet.highRiskOverlay?.lessons || [];
const directSourceResolutions = packet.directSourceCandidateResolutions || [];
const serialized = JSON.stringify(packet);

if (packet.educationOnly !== true) fail("packet must be educationOnly:true");
if (packet.productionReady !== false) fail("packet must keep productionReady:false");
if (packet.learnerFacingRelease !== false) fail("packet must keep learnerFacingRelease:false");
if (packet.approvalStatus !== "not_approved") fail("packet must remain not_approved");
if (packet.packetStatus !== "ready_for_reviewer_refinement") fail("unexpected packetStatus");
if ((packet.batches || 0) < 5) fail(`expected at least 5 batches, got ${packet.batches}`);
if ((packet.modules || 0) < 12) fail(`expected at least 12 modules, got ${packet.modules}`);
if ((packet.draftsReviewed || 0) < 120) fail(`expected at least 120 drafts reviewed, got ${packet.draftsReviewed}`);
if ((packet.readyForSeparateReviewCandidates || 0) < 120) {
  fail(`expected 120 ready candidates, got ${packet.readyForSeparateReviewCandidates}`);
}
if (packet.candidateCards !== candidates.length) fail("candidateCards total does not match candidateCardsList length");
if (candidates.length < 120) fail(`expected at least 120 candidate cards, got ${candidates.length}`);
if (packet.copyRiskIssues !== 0) fail(`copy risk issues detected: ${packet.copyRiskIssues}`);
if (packet.safetyIssues !== 0) fail(`safety issues detected: ${packet.safetyIssues}`);
if (packet.structureIssues !== 0) fail(`structure issues detected: ${packet.structureIssues}`);
if (packet.maxSourceOverlap > 0.18) fail(`max source overlap too high: ${packet.maxSourceOverlap}`);
if (overlayLessons.length !== 12) fail(`expected 12 high-risk overlay lessons, got ${overlayLessons.length}`);
if (packet.highRiskOverlay?.reviewerNoteCount !== 72) {
  fail(`expected 72 overlay reviewer notes, got ${packet.highRiskOverlay?.reviewerNoteCount}`);
}
if (directSourceResolutions.length < 5) {
  fail(`expected at least 5 direct source candidate resolutions, got ${directSourceResolutions.length}`);
}

for (const [index, candidate] of candidates.entries()) {
  if (candidate.educationOnly !== true || candidate.productionReady !== false) {
    fail(`candidate ${candidate.id || index} boundary drift`);
  }
  if (candidate.learnerFacingRelease !== false || candidate.approvalStatus !== "not_approved") {
    fail(`candidate ${candidate.id || index} release gate drift`);
  }
  if (!Array.isArray(candidate.localCourseEvidence) || candidate.localCourseEvidence.length < 2) {
    fail(`candidate ${candidate.id || index} missing local evidence`);
  }
  if (!Array.isArray(candidate.reviewerChecklist) || candidate.reviewerChecklist.length < 4) {
    fail(`candidate ${candidate.id || index} missing reviewer checklist`);
  }
  if (candidate.reviewerChecklist.some((item) => item.status !== "pending_human_review" || item.required !== true)) {
    fail(`candidate ${candidate.id || index} checklist must remain pending and required`);
  }
}

for (const lesson of overlayLessons) {
  if (lesson.approvalStatus !== "not_approved" || lesson.learnerFacingRelease !== false) {
    fail(`overlay lesson ${lesson.overlayId} release gate drift`);
  }
  if (!Array.isArray(lesson.reviewerNotes) || lesson.reviewerNotes.length !== 6) {
    fail(`overlay lesson ${lesson.overlayId} must have 6 reviewer notes`);
  }
  if (lesson.reviewerNotes.some((note) => note.status !== "pending_human_review")) {
    fail(`overlay lesson ${lesson.overlayId} note status drift`);
  }
}

for (const resolution of directSourceResolutions) {
  if (resolution.status !== "resolved_to_reviewer_only_background") {
    fail(`direct source resolution ${resolution.id} status drift`);
  }
  if (resolution.approvalStatus !== "not_approved") {
    fail(`direct source resolution ${resolution.id} approval drift`);
  }
}

for (const pattern of hardForbiddenPatterns) {
  if (pattern.test(serialized)) fail(`hard forbidden term detected: ${pattern}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: packet.educationOnly,
  productionReady: packet.productionReady,
  learnerFacingRelease: packet.learnerFacingRelease,
  approvalStatus: packet.approvalStatus,
  packetStatus: packet.packetStatus,
  candidateCards: candidates.length,
  highRiskOverlayLessons: overlayLessons.length,
  reviewerNotes: packet.highRiskOverlay.reviewerNoteCount,
  directSourceCandidateResolutions: directSourceResolutions.length,
  maxSourceOverlap: packet.maxSourceOverlap,
}, null, 2));
