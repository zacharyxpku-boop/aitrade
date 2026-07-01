import fs from "node:fs";

const overlayPath = "docs/LOCAL_COURSE_HIGH_RISK_SELF_REVIEW_OVERLAY.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const overlay = readJson(overlayPath);
const lessons = overlay.lessons || [];
const directRows = overlay.directSourceSelfReview || [];
const serialized = JSON.stringify(overlay);

if (overlay.educationOnly !== true) fail("self-review overlay must keep educationOnly:true");
if (overlay.productionReady !== false) fail("self-review overlay must keep productionReady:false");
if (overlay.learnerFacingRelease !== false) fail("self-review overlay must keep learnerFacingRelease:false");
if (overlay.approvalStatus !== "not_approved") fail("self-review overlay must remain not_approved");
if (overlay.overlayStatus !== "codex_self_review_complete_not_approved") fail(`unexpected overlayStatus: ${overlay.overlayStatus}`);
if (overlay.reviewerType !== "codex_self_review") fail("reviewerType must be codex_self_review");
if (overlay.lessonCount !== 12 || lessons.length !== 12) fail("self-review overlay must cover 12 high-risk lessons");
if (overlay.reviewerNotesReviewed !== 72) fail(`expected 72 reviewed notes, got ${overlay.reviewerNotesReviewed}`);
if (overlay.expectedReviewerNotes !== 72) fail(`expected source packet note count 72, got ${overlay.expectedReviewerNotes}`);
if (overlay.releaseBlockingNotes < 36) fail("expected at least source/originality/green/release blocking notes");
if (overlay.releaseReadyNotes !== 0) fail("self-review must not mark notes release-ready");
if (overlay.directSourceCandidateResolutionsReviewed !== 5 || directRows.length !== 5) fail("expected 5 direct source self-review rows");
if (overlay.directSourceCandidatesApprovedForLearnerCitation !== 0) fail("direct sources must not be promoted to learner-facing citations");
if (overlay.writeAllowedNow !== false) fail("writeAllowedNow must remain false");
if (overlay.approvalGatePassed !== false) fail("approval gate must not pass");
if (overlay.humanApprovalRequired !== true) fail("human approval must remain required");
if (overlay.publicGroundingRequired !== true) fail("public grounding must remain required");

for (const dimension of ["source_fit", "originality", "green_source_boundary", "education_safety", "pedagogy", "release_gate"]) {
  if (overlay.dimensionCounts?.[dimension] !== 12) fail(`dimension ${dimension} must have 12 reviewed notes`);
}

for (const lesson of lessons) {
  if (lesson.approvalStatus !== "not_approved" || lesson.learnerFacingRelease !== false) fail(`lesson ${lesson.candidateId} release gate drift`);
  if (lesson.selfReviewStatus !== "codex_self_review_complete_not_approved") fail(`lesson ${lesson.candidateId} self-review status drift`);
  if (lesson.reviewerNotesReviewed !== 6) fail(`lesson ${lesson.candidateId} must have 6 reviewed notes`);
  if (lesson.releaseReadyNotes !== 0) fail(`lesson ${lesson.candidateId} cannot have release-ready notes`);
  if (lesson.releaseBlockingNotes < 3) fail(`lesson ${lesson.candidateId} should keep blocking notes`);
  if (!Array.isArray(lesson.noteResponses) || lesson.noteResponses.length !== 6) fail(`lesson ${lesson.candidateId} note response drift`);
  const dimensions = new Set(lesson.noteResponses.map((note) => note.dimension));
  for (const dimension of ["source_fit", "originality", "green_source_boundary", "education_safety", "pedagogy", "release_gate"]) {
    if (!dimensions.has(dimension)) fail(`lesson ${lesson.candidateId} missing dimension ${dimension}`);
  }
  if (lesson.noteResponses.some((note) =>
    note.selfReviewStatus !== "codex_self_reviewed_not_human_approved" ||
    note.learnerFacingRelease !== false ||
    note.approvalStatus !== "not_approved" ||
    note.reviewerType !== "codex_self_review"
  )) {
    fail(`lesson ${lesson.candidateId} note boundary drift`);
  }
}

for (const row of directRows) {
  if (row.selfReviewDecision !== "keep_reviewer_only_background") fail(`direct source row ${row.id} decision drift`);
  if (row.approvalStatus !== "not_approved" || row.learnerFacingRelease !== false) fail(`direct source row ${row.id} release drift`);
  if (row.releaseBlocker !== true) fail(`direct source row ${row.id} must remain a release blocker`);
}

for (const phrase of [
  "does not approve learner-facing release",
  "does not make private pdfs public citations",
  "does not create real human reviewer approval",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
]) {
  if (!serialized.toLowerCase().includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: overlay.educationOnly,
  productionReady: overlay.productionReady,
  learnerFacingRelease: overlay.learnerFacingRelease,
  approvalStatus: overlay.approvalStatus,
  overlayStatus: overlay.overlayStatus,
  lessonCount: overlay.lessonCount,
  reviewerNotesReviewed: overlay.reviewerNotesReviewed,
  releaseBlockingNotes: overlay.releaseBlockingNotes,
  releaseReadyNotes: overlay.releaseReadyNotes,
  directSourceCandidateResolutionsReviewed: overlay.directSourceCandidateResolutionsReviewed,
  directSourceCandidatesApprovedForLearnerCitation: overlay.directSourceCandidatesApprovedForLearnerCitation,
  writeAllowedNow: overlay.writeAllowedNow,
}, null, 2));
