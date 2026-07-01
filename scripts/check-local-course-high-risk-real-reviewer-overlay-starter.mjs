import fs from "node:fs";

const starterPath = "docs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_STARTER.json";
const draftPath = "docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const starter = readJson(starterPath);
const draft = readJson(draftPath);

for (const [name, artifact] of Object.entries({ starter, draft })) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${name} must remain not_approved`);
}

if (starter.starterStatus !== "high_risk_real_reviewer_overlay_starter_ready_blank") {
  fail(`unexpected starterStatus: ${starter.starterStatus}`);
}
if (starter.starterMode !== "blank_real_reviewer_overlay_draft_for_12_high_risk_lessons") {
  fail(`unexpected starterMode: ${starter.starterMode}`);
}
if (draft.draftStatus !== "blank_waiting_real_reviewer") fail(`unexpected draftStatus: ${draft.draftStatus}`);
if (draft.draftMode !== "human_owned_edit_copy_do_not_use_fixtures") fail(`unexpected draftMode: ${draft.draftMode}`);
if (starter.draftInputPath !== draftPath || draft.sourceStarter !== starterPath) fail("starter/draft path linkage drift");

if (starter.lessonCount !== 12) fail(`expected 12 lessons, got ${starter.lessonCount}`);
if (starter.directSourceDecisionCount !== 5) fail(`expected 5 direct-source decisions, got ${starter.directSourceDecisionCount}`);
if (starter.expectedReviewerNotes !== 72 || starter.totalReviewerNotes !== 72) fail("expected 72 required reviewer notes");
if (starter.blankReviewerNotes !== 72 || starter.readyReviewerNotes !== 0) fail("reviewer note blank/readiness drift");
if (starter.blankDirectSourceDecisions !== 5 || starter.readyDirectSourceDecisions !== 0) {
  fail("direct-source decision blank/readiness drift");
}
if (starter.codexSelfReviewNotes !== 72) fail("Codex self-review context drift");
if (starter.realHumanInputEntries !== 0) fail("starter must not fabricate real human input");
if (starter.writeAllowedNow !== false || starter.manualAuthorizationRequired !== true) {
  fail("starter must keep write gate locked");
}

const lessonRows = starter.lessonRows || [];
const draftLessonRows = draft.lessonRows || [];
const directRows = starter.directSourceDecisionRows || [];
const draftDirectRows = draft.directSourceDecisionRows || [];

if (!Array.isArray(lessonRows) || lessonRows.length !== 12) fail("starter lesson rows must be 12");
if (!Array.isArray(draftLessonRows) || draftLessonRows.length !== 12) fail("draft lesson rows must be 12");
if (!Array.isArray(directRows) || directRows.length !== 5) fail("starter direct-source rows must be 5");
if (!Array.isArray(draftDirectRows) || draftDirectRows.length !== 5) fail("draft direct-source rows must be 5");

for (const [index, row] of lessonRows.entries()) {
  const draftRow = draftLessonRows[index];
  if (!row.candidateId || !row.nodeId || !row.lessonId || !row.module || !row.topic) {
    fail(`lesson row ${index + 1} missing identity`);
  }
  if (draftRow.candidateId !== row.candidateId) fail(`draft lesson row ${index + 1} linkage drift`);
  if (row.publicGroundingStatus !== "mapped_for_reviewer_not_release_approved") {
    fail(`lesson ${row.lessonId} public grounding status drift`);
  }
  if (row.wikipediaRefCount < 3 || row.publicContextRefCount < 2 || row.selectedPublicRefCount < 5) {
    fail(`lesson ${row.lessonId} public refs not sufficient for reviewer context`);
  }
  if (!Array.isArray(row.publicRefSamples) || row.publicRefSamples.length < 3) {
    fail(`lesson ${row.lessonId} missing public ref samples`);
  }
  if (row.codexSelfReviewNotes !== 6) fail(`lesson ${row.lessonId} must show 6 Codex context notes`);
  if (row.realReviewerNotesRequired !== 6 || row.realReviewerNotesReady !== 0) {
    fail(`lesson ${row.lessonId} real reviewer note counts drift`);
  }
  if (row.releaseBlocker !== true || row.learnerFacingRelease !== false || row.approvalStatus !== "not_approved") {
    fail(`lesson ${row.lessonId} release gate drift`);
  }
  if (!/fill_6_real_reviewer_notes/.test(row.nextGate || "")) fail(`lesson ${row.lessonId} next gate drift`);
  if (!Array.isArray(row.realReviewerNotes) || row.realReviewerNotes.length !== 6) {
    fail(`lesson ${row.lessonId} must have 6 real note slots`);
  }
  for (const note of row.realReviewerNotes) {
    if (!note.id || !note.sourceNoteId || !note.dimension || !note.prompt) {
      fail(`lesson ${row.lessonId} note slot missing identity`);
    }
    if (!Array.isArray(note.requiredReviewerFields) || note.requiredReviewerFields.length !== 5) {
      fail(`lesson ${row.lessonId} note ${note.id} field requirements drift`);
    }
    for (const field of ["reviewerName", "reviewedAt", "decision", "evidenceChecked", "reviewerNote"]) {
      if (!note.requiredReviewerFields.includes(field)) fail(`note ${note.id} missing required field ${field}`);
    }
    if (!Array.isArray(note.allowedDecisionValues) || note.allowedDecisionValues.length !== 5) {
      fail(`note ${note.id} allowed decisions drift`);
    }
    if (note.reviewerName !== "" || note.reviewedAt !== "" || note.decision !== "" || note.reviewerNote !== "") {
      fail(`note ${note.id} must remain blank`);
    }
    if (!Array.isArray(note.evidenceChecked) || note.evidenceChecked.length !== 0) fail(`note ${note.id} evidence must remain blank`);
    if (note.readyForApprovalGate !== false || note.learnerFacingRelease !== false || note.approvalStatus !== "not_approved") {
      fail(`note ${note.id} must not be approval-ready`);
    }
    if (note.noteStatus !== "blank_waiting_real_reviewer") fail(`note ${note.id} blank status drift`);
  }
}

for (const [index, row] of directRows.entries()) {
  const draftRow = draftDirectRows[index];
  if (!row.id || !row.sourceResolutionId || !row.candidateId || !row.module || !row.topic) {
    fail(`direct-source row ${index + 1} missing identity`);
  }
  if (draftRow.id !== row.id || draftRow.candidateId !== row.candidateId) {
    fail(`draft direct-source row ${index + 1} linkage drift`);
  }
  if (!row.privateOrDirectCandidateSource) fail(`direct-source row ${row.id} missing private/direct source`);
  if (row.publicReplacementRefCount < 3) fail(`direct-source row ${row.id} needs public replacement samples`);
  if (!Array.isArray(row.publicReplacementRefSamples) || row.publicReplacementRefSamples.length < 3) {
    fail(`direct-source row ${row.id} missing public replacement ref samples`);
  }
  if (!Array.isArray(row.allowedDecisionValues) || row.allowedDecisionValues.length !== 4) {
    fail(`direct-source row ${row.id} allowed decisions drift`);
  }
  if (row.reviewerName !== "" || row.reviewedAt !== "" || row.decision !== "" || row.reviewerNote !== "") {
    fail(`direct-source row ${row.id} must remain blank`);
  }
  if (!Array.isArray(row.evidenceChecked) || row.evidenceChecked.length !== 0) {
    fail(`direct-source row ${row.id} evidence must remain blank`);
  }
  if (row.learnerCitationApproved !== false || row.learnerFacingRelease !== false || row.approvalStatus !== "not_approved") {
    fail(`direct-source row ${row.id} must not be release-approved`);
  }
  if (row.decisionStatus !== "blank_waiting_real_reviewer" || row.readyForApprovalGate !== false) {
    fail(`direct-source row ${row.id} readiness drift`);
  }
}

const validation = starter.validationSummary || {};
if (
  validation.validationStatus !== "blocked_missing_real_reviewer_overlay_input" ||
  validation.readyLessons !== 0 ||
  validation.blockedLessons !== 12 ||
  validation.readyReviewerNotes !== 0 ||
  validation.blockedReviewerNotes !== 72 ||
  validation.readyDirectSourceDecisions !== 0 ||
  validation.blockedDirectSourceDecisions !== 5 ||
  validation.forbiddenHitRows !== 0
) {
  fail("starter validation summary drift");
}

const boundaryText = `${starter.completionRule || ""} ${starter.boundary || ""} ${draft.boundary || ""}`.toLowerCase();
for (const phrase of [
  "blank reviewer-owned draft",
  "does not complete human review",
  "real reviewer fills",
  "separate approval gate",
  "reviewer-facing education-only",
  "must not copy generated self-review into real notes",
  "approve learner-facing citations",
  "write course overlays",
  "publish private pdfs",
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
  educationOnly: starter.educationOnly,
  productionReady: starter.productionReady,
  learnerFacingRelease: starter.learnerFacingRelease,
  approvalStatus: starter.approvalStatus,
  starterStatus: starter.starterStatus,
  lessonCount: starter.lessonCount,
  totalReviewerNotes: starter.totalReviewerNotes,
  directSourceDecisionCount: starter.directSourceDecisionCount,
  realHumanInputEntries: starter.realHumanInputEntries,
  writeAllowedNow: starter.writeAllowedNow,
}, null, 2));
