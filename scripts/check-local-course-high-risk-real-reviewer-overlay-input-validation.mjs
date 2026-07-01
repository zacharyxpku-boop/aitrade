import fs from "node:fs";

const reportPath = "docs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_INPUT_VALIDATION.json";
const reportMdPath = "docs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_INPUT_VALIDATION.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const report = readJson(reportPath);
if (!fs.existsSync(reportMdPath)) fail(`missing ${reportMdPath}`);

if (report.educationOnly !== true) fail("validation must keep educationOnly:true");
if (report.productionReady !== false) fail("validation must keep productionReady:false");
if (report.learnerFacingRelease !== false) fail("validation must keep learnerFacingRelease:false");
if (report.approvalStatus !== "not_approved") fail("validation must remain not_approved");
if (report.validationStatus !== "blocked_missing_real_reviewer_overlay_input") {
  fail(`blank high-risk overlay input must remain blocked, got ${report.validationStatus}`);
}
if (report.validationMode !== "high_risk_real_reviewer_overlay_notes_and_direct_source_gate") {
  fail("unexpected validationMode");
}
if (report.lessonCount !== 12 || report.readyLessons !== 0 || report.blockedLessons !== 12) {
  fail("lesson validation counts drift");
}
if (report.totalReviewerNotes !== 72 || report.readyReviewerNotes !== 0 || report.blockedReviewerNotes !== 72) {
  fail("reviewer note validation counts drift");
}
if (
  report.directSourceDecisionCount !== 5 ||
  report.readyDirectSourceDecisions !== 0 ||
  report.blockedDirectSourceDecisions !== 5
) {
  fail("direct-source decision validation counts drift");
}
if (report.missingFieldRows < 89) fail("blank validation must expose missing fields across all rows");
if (report.forbiddenHitRows !== 0) fail("blank validation must have zero forbidden hits");
if (report.fixtureOnly !== false) fail("default high-risk input must not be fixtureOnly");
if (report.realHumanInputEntries !== 0) fail("blank high-risk input must not claim real human input");
if (report.generatedDecisions !== 0) fail("validation must not generate decisions");
if (report.learnerCitationApprovedLessons !== 0 || report.learnerCitationApprovedDirectSources !== 0) {
  fail("validation must not approve learner citations");
}
if (report.writeAllowedNow !== false || report.manualAuthorizationRequired !== true) {
  fail("write gate must remain locked");
}
if (!Array.isArray(report.allowedNoteDecisionValues) || report.allowedNoteDecisionValues.length !== 5) {
  fail("must expose 5 allowed note decision values");
}
if (!Array.isArray(report.allowedDirectSourceDecisionValues) || report.allowedDirectSourceDecisionValues.length !== 4) {
  fail("must expose 4 allowed direct-source decision values");
}
if (!Array.isArray(report.forbiddenPhrases) || report.forbiddenPhrases.length < 16) {
  fail("must expose forbidden phrases");
}

const lessonRows = report.lessonValidationRows || [];
const noteRows = report.noteValidationRows || [];
const directRows = report.directSourceValidationRows || [];

if (!Array.isArray(lessonRows) || lessonRows.length !== 12) fail("expected 12 lesson validation rows");
if (!Array.isArray(noteRows) || noteRows.length !== 72) fail("expected 72 note validation rows");
if (!Array.isArray(directRows) || directRows.length !== 5) fail("expected 5 direct-source validation rows");

for (const row of lessonRows) {
  if (!row.candidateId || !row.nodeId || !row.lessonId || !row.module || !row.topic) fail("lesson row missing identity");
  if (row.validationStatus !== "blocked_missing_real_reviewer_input") fail(`${row.lessonId} must remain blocked while blank`);
  if (row.realReviewerNotesReady !== 0 || row.realReviewerNotesRequired !== 6) fail(`${row.lessonId} note readiness drift`);
  if (!Array.isArray(row.missingFields) || !row.missingFields.includes("six_ready_real_reviewer_notes")) {
    fail(`${row.lessonId} must require six ready real reviewer notes`);
  }
  if (row.releaseBlocker !== true || row.learnerFacingRelease !== false || row.approvalStatus !== "not_approved") {
    fail(`${row.lessonId} release gate drift`);
  }
  if (row.nextGate !== "fill_6_real_reviewer_notes_then_revalidate") fail(`${row.lessonId} nextGate drift`);
}

for (const row of noteRows) {
  if (!row.id || !row.sourceNoteId || !row.candidateId || !row.lessonId || !row.dimension) {
    fail("note validation row missing identity");
  }
  if (row.validationStatus !== "blocked_missing_real_reviewer_input") fail(`${row.id} must remain blocked while blank`);
  if (row.readyForApprovalGate !== false) fail(`${row.id} must not be approval-ready`);
  if (!Array.isArray(row.missingFields) || row.missingFields.length < 5) fail(`${row.id} must expose all blank fields`);
  for (const field of ["reviewerName", "reviewedAt", "decision", "evidenceChecked", "reviewerNote"]) {
    if (!row.missingFields.includes(field)) fail(`${row.id} missing required missing-field ${field}`);
  }
  if (!Array.isArray(row.qualityIssues)) fail(`${row.id} qualityIssues must be an array`);
  if (!Array.isArray(row.forbiddenHits) || row.forbiddenHits.length !== 0) fail(`${row.id} blank row forbidden hit drift`);
  if (row.nextGate !== "fill_real_reviewer_note_then_revalidate") fail(`${row.id} nextGate drift`);
}

for (const row of directRows) {
  if (!row.id || !row.sourceResolutionId || !row.candidateId || !row.module || !row.topic) {
    fail("direct-source validation row missing identity");
  }
  if (row.validationStatus !== "blocked_missing_real_reviewer_input") fail(`${row.id} must remain blocked while blank`);
  if (row.readyForApprovalGate !== false) fail(`${row.id} must not be approval-ready`);
  if (!Array.isArray(row.missingFields) || row.missingFields.length < 5) fail(`${row.id} must expose all blank fields`);
  if (row.learnerCitationApproved !== false || row.releaseBlocker !== true) fail(`${row.id} release/citation drift`);
  if (!Array.isArray(row.forbiddenHits) || row.forbiddenHits.length !== 0) fail(`${row.id} blank row forbidden hit drift`);
  if (row.nextGate !== "fill_direct_source_decision_then_revalidate") fail(`${row.id} nextGate drift`);
}

const boundaryText = `${report.boundary || ""} ${report.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "validates note shape",
  "direct-source decision shape",
  "no setup/no signal/no future outcome/no strategy edge/no real-money action",
  "does not generate reviewer notes",
  "approve learner-facing citations",
  "write authorization",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "real-money guidance",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  validationStatus: report.validationStatus,
  lessonCount: report.lessonCount,
  readyLessons: report.readyLessons,
  blockedLessons: report.blockedLessons,
  readyReviewerNotes: report.readyReviewerNotes,
  blockedReviewerNotes: report.blockedReviewerNotes,
  readyDirectSourceDecisions: report.readyDirectSourceDecisions,
  blockedDirectSourceDecisions: report.blockedDirectSourceDecisions,
  realHumanInputEntries: report.realHumanInputEntries,
  writeAllowedNow: report.writeAllowedNow,
}, null, 2));
