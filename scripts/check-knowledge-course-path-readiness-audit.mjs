import fs from "node:fs";

const auditPath = "docs/KNOWLEDGE_COURSE_PATH_READINESS_AUDIT.json";
const auditMdPath = "docs/KNOWLEDGE_COURSE_PATH_READINESS_AUDIT.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const audit = readJson(auditPath);
if (!fs.existsSync(auditMdPath)) fail(`missing ${auditMdPath}`);

if (audit.educationOnly !== true) fail("audit must keep educationOnly:true");
if (audit.productionReady !== false) fail("audit must keep productionReady:false");
if (audit.learnerFacingRelease !== false) fail("audit must keep learnerFacingRelease:false");
if (audit.approvalStatus !== "not_approved") fail("audit must remain not_approved");
if (audit.auditStatus !== "course_path_readiness_audit_ready_release_blocked") fail("unexpected auditStatus");
if (audit.auditMode !== "module_course_paths_internal_ready_learner_release_blocked") fail("unexpected auditMode");
if (audit.releaseBlockerAuditStatus !== "knowledge_release_blocker_audit_ready_release_blocked") fail("release blocker audit status drift");
if (audit.knowledgeBaseUsefulnessStatus !== "usable_as_internal_reviewer_knowledge_base_not_learner_course") fail("usefulness status drift");
if (audit.modules !== 12 || audit.coursePaths !== 12) fail("expected 12 modules/course paths");
if (audit.internalReadyPaths !== 12) fail("expected 12 internally ready paths");
if (audit.learnerReleaseReadyPaths !== 0 || audit.blockedLearnerReleasePaths !== 12) fail("learner release path counts drift");
if (audit.totalLessons !== 360 || audit.totalUnits !== 36 || audit.totalEstimatedMinutes !== 2880) fail("curriculum path totals drift");
if (audit.nodesWithLocalCourseMatches !== 360 || audit.learnerFacingNodes !== 360) fail("local course node coverage drift");
if (audit.sourceFitReviewRows !== 1638 || audit.readySourceFitReviewRows !== 0 || audit.blockedSourceFitReviewRows !== 1638) fail("source-fit totals drift");
if (audit.highRiskBlockedLessons !== 12 || audit.highRiskBlockedReviewerNotes !== 72) fail("high-risk blocker totals drift");
if (audit.directSourceDecisions !== 5 || audit.readyDirectSourceDecisions !== 0) fail("direct-source decision totals drift");
if (audit.realHumanInputEntries !== 0 || audit.learnerCitationApprovedRows !== 0) fail("audit must not claim human input or citation approval");
if (audit.writeAllowedNow !== false || audit.manualAuthorizationRequired !== true) fail("write gate drift");

if (!Array.isArray(audit.pathRows) || audit.pathRows.length !== 12) fail("expected 12 path rows");
if (!audit.pathRows.every((row, index) =>
  row.order === index + 1 &&
  row.module &&
  row.pathId &&
  row.lessonCount === 30 &&
  row.unitCount === 3 &&
  row.estimatedMinutes === 240 &&
  row.localCoverageRate === 1 &&
  row.nodesWithLocalCourseMatches === row.learnerFacingNodes &&
  row.sourceFitRows > 0 &&
  row.readySourceFitRows === 0 &&
  row.blockedSourceFitRows === row.sourceFitRows &&
  row.internalPathReady === true &&
  row.learnerPathReleaseReady === false &&
  row.realHumanInputEntries === 0 &&
  row.learnerFacingRelease === false &&
  row.writeAllowedNow === false &&
  row.reviewStatus === "course_path_internal_navigation_ready_release_blocked" &&
  Array.isArray(row.blockedReasons) &&
  row.blockedReasons.includes("source_fit_review_rows_blocked") &&
  row.blockedReasons.includes("separate_learner_release_approval_missing")
)) {
  fail("path row readiness drift");
}

const sourceFitTotal = audit.pathRows.reduce((sum, row) => sum + (row.sourceFitRows || 0), 0);
const blockedSourceFitTotal = audit.pathRows.reduce((sum, row) => sum + (row.blockedSourceFitRows || 0), 0);
const highRiskLessonTotal = audit.pathRows.reduce((sum, row) => sum + (row.highRiskBlockedLessons || 0), 0);
const highRiskNoteTotal = audit.pathRows.reduce((sum, row) => sum + (row.blockedHighRiskNotes || 0), 0);
const directSourceTotal = audit.pathRows.reduce((sum, row) => sum + (row.directSourceDecisions || 0), 0);
if (sourceFitTotal !== 1638 || blockedSourceFitTotal !== 1638) fail("path row source-fit totals drift");
if (highRiskLessonTotal !== 12 || highRiskNoteTotal !== 72) fail("path row high-risk totals drift");
if (directSourceTotal !== 5) fail("path row direct-source totals drift");
if (!audit.pathRows.some((row) => row.highRiskBlockedLessons > 0 && row.blockedReasons.includes("high_risk_lessons_blocked"))) {
  fail("expected at least one high-risk path blocker");
}

if (!Array.isArray(audit.nextBestActions) || audit.nextBestActions.length < 4) fail("next best actions too thin");
if (!Array.isArray(audit.commands) || !audit.commands.some((command) => /check:knowledge-course-path-readiness-audit/.test(command))) {
  fail("commands must include course path readiness audit check");
}

const boundaryText = `${audit.boundary || ""} ${audit.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "absorbed local investment course material",
  "public/wikipedia/official source context",
  "internal course-path readiness rows",
  "all 12 course paths",
  "does not generate reviewer notes",
  "approve copied text",
  "approve learner-facing citations",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
  "write authorization",
  "learner release",
  "production readiness",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  auditStatus: audit.auditStatus,
  coursePaths: audit.coursePaths,
  internalReadyPaths: audit.internalReadyPaths,
  learnerReleaseReadyPaths: audit.learnerReleaseReadyPaths,
  totalLessons: audit.totalLessons,
  sourceFitReviewRows: audit.sourceFitReviewRows,
  blockedSourceFitReviewRows: audit.blockedSourceFitReviewRows,
  highRiskBlockedReviewerNotes: audit.highRiskBlockedReviewerNotes,
  realHumanInputEntries: audit.realHumanInputEntries,
  writeAllowedNow: audit.writeAllowedNow,
}, null, 2));
