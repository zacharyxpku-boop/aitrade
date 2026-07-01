import fs from "node:fs";

const cockpitPath = "docs/LOCAL_COURSE_HIGH_RISK_REVIEW_COCKPIT.json";
const cockpitMdPath = "docs/LOCAL_COURSE_HIGH_RISK_REVIEW_COCKPIT.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const cockpit = readJson(cockpitPath);
if (!fs.existsSync(cockpitMdPath)) fail(`missing ${cockpitMdPath}`);

if (cockpit.educationOnly !== true) fail("cockpit must keep educationOnly:true");
if (cockpit.productionReady !== false) fail("cockpit must keep productionReady:false");
if (cockpit.learnerFacingRelease !== false) fail("cockpit must keep learnerFacingRelease:false");
if (cockpit.approvalStatus !== "not_approved") fail("cockpit must remain not_approved");
if (cockpit.cockpitStatus !== "high_risk_review_cockpit_ready_blocked_on_real_input") {
  fail(`unexpected cockpitStatus: ${cockpit.cockpitStatus}`);
}
if (cockpit.cockpitMode !== "codex_self_review_public_grounding_real_reviewer_queue") {
  fail("unexpected cockpitMode");
}
if (cockpit.lessonCount !== 12) fail("cockpit must cover 12 high-risk lessons");
if (cockpit.modules !== 4) fail("cockpit should cover 4 high-risk modules");
if (cockpit.lessonsWithCodexSelfReview !== 12) fail("all high-risk lessons must have Codex self-review");
if (cockpit.lessonsWithPublicGrounding !== 12 || cockpit.lessonsMissingPublicGrounding !== 0) {
  fail("all high-risk lessons must have public grounding mapped");
}
if (cockpit.expectedReviewerNotes !== 72 || cockpit.codexSelfReviewNotes !== 72) {
  fail("cockpit must expose 72 Codex self-review notes and 72 expected real reviewer notes");
}
if (cockpit.readyReviewerNotes !== 0 || cockpit.blockedReviewerNotes !== 72) {
  fail("blank real reviewer notes must remain 0 ready / 72 blocked");
}
if (
  cockpit.directSourceDecisionCount !== 5 ||
  cockpit.readyDirectSourceDecisions !== 0 ||
  cockpit.blockedDirectSourceDecisions !== 5
) {
  fail("direct-source decision counts drift");
}
if (cockpit.readyLessons !== 0 || cockpit.blockedLessons !== 12) fail("lesson readiness counts drift");
if (cockpit.realHumanInputEntries !== 0) fail("cockpit must not claim real human input");
if (cockpit.learnerCitationApprovedLessons !== 0 || cockpit.learnerCitationApprovedDirectSources !== 0) {
  fail("cockpit must not approve learner citations");
}
if (cockpit.writeAllowedNow !== false || cockpit.manualAuthorizationRequired !== true || cockpit.approvalGatePassed !== false) {
  fail("write and approval gates must remain locked");
}

const moduleRows = cockpit.moduleRows || [];
const lessonRows = cockpit.lessonRows || [];
const directSourceRows = cockpit.directSourceRows || [];
const reviewerQueue = cockpit.reviewerQueue || [];

if (!Array.isArray(moduleRows) || moduleRows.length !== 4) fail("expected 4 module rows");
if (!Array.isArray(lessonRows) || lessonRows.length !== 12) fail("expected 12 lesson rows");
if (!Array.isArray(directSourceRows) || directSourceRows.length !== 5) fail("expected 5 direct-source rows");
if (!Array.isArray(reviewerQueue) || reviewerQueue.length !== 17) fail("expected 17 reviewer queue items");

if (moduleRows.reduce((sum, row) => sum + row.lessons, 0) !== 12) fail("module lessons must sum to 12");
if (moduleRows.reduce((sum, row) => sum + row.requiredReviewerNotes, 0) !== 72) fail("module notes must sum to 72");
if (moduleRows.some((row) =>
  row.status !== "blocked_missing_real_reviewer_input" ||
  row.readyReviewerNotes !== 0 ||
  row.blockedReviewerNotes !== row.requiredReviewerNotes ||
  row.nextGate !== "fill_real_reviewer_notes_and_direct_source_decisions_then_revalidate"
)) {
  fail("module row gate drift");
}

for (const row of lessonRows) {
  if (!row.candidateId || !row.nodeId || !row.lessonId || !row.module || !row.topic) fail("lesson row missing identity");
  if (row.codexSelfReviewStatus !== "codex_self_review_complete_not_approved") fail(`${row.candidateId} self-review status drift`);
  if (row.codexSelfReviewNotes !== 6) fail(`${row.candidateId} must expose 6 Codex self-review notes`);
  if (row.publicGroundingStatus !== "mapped_for_reviewer_not_release_approved") fail(`${row.candidateId} public grounding status drift`);
  if (row.wikipediaRefCount < 3 || row.selectedPublicRefCount < 3) fail(`${row.candidateId} must expose public reference context`);
  if (row.validationStatus !== "blocked_missing_real_reviewer_input") fail(`${row.candidateId} must remain blocked on real reviewer input`);
  if (row.realReviewerNotesReady !== 0 || row.realReviewerNotesRequired !== 6 || row.blockedReviewerNotes !== 6) {
    fail(`${row.candidateId} reviewer note readiness drift`);
  }
  if (row.releaseBlocker !== true || row.learnerFacingRelease !== false || row.approvalStatus !== "not_approved") {
    fail(`${row.candidateId} release gate drift`);
  }
  if (!Array.isArray(row.publicRefSamples) || row.publicRefSamples.length < 3) fail(`${row.candidateId} public sample refs missing`);
}

for (const row of directSourceRows) {
  if (!row.sourceResolutionId || !row.candidateId || !row.module || !row.topic) fail("direct-source row missing identity");
  if (row.codexSelfReviewDecision !== "keep_reviewer_only_background") fail(`${row.sourceResolutionId} self-review decision drift`);
  if (row.publicReplacementRefCount < 3) fail(`${row.sourceResolutionId} must expose public replacement refs`);
  if (row.validationStatus !== "blocked_missing_real_reviewer_input") fail(`${row.sourceResolutionId} validation status drift`);
  if (row.learnerCitationApproved !== false || row.releaseBlocker !== true || row.approvalStatus !== "not_approved") {
    fail(`${row.sourceResolutionId} release/citation drift`);
  }
}

const boundaryText = `${cockpit.boundary || ""} ${cockpit.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "does not generate real reviewer notes",
  "approve learner-facing release",
  "private pdfs",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
  "production readiness",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  cockpitStatus: cockpit.cockpitStatus,
  lessonCount: cockpit.lessonCount,
  modules: cockpit.modules,
  expectedReviewerNotes: cockpit.expectedReviewerNotes,
  readyReviewerNotes: cockpit.readyReviewerNotes,
  blockedReviewerNotes: cockpit.blockedReviewerNotes,
  directSourceDecisionCount: cockpit.directSourceDecisionCount,
  realHumanInputEntries: cockpit.realHumanInputEntries,
  writeAllowedNow: cockpit.writeAllowedNow,
}, null, 2));
