import fs from "node:fs";

const auditPath = "docs/KNOWLEDGE_RELEASE_BLOCKER_AUDIT.json";
const auditMdPath = "docs/KNOWLEDGE_RELEASE_BLOCKER_AUDIT.md";

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
if (audit.auditStatus !== "knowledge_release_blocker_audit_ready_release_blocked") fail("unexpected auditStatus");
if (audit.auditMode !== "end_to_end_absorption_review_release_blocker_chain") fail("unexpected auditMode");
if (audit.knowledgeBaseUsefulnessStatus !== "usable_as_internal_reviewer_knowledge_base_not_learner_course") fail("usefulness status drift");
if (audit.internalUseStatus !== "usable_as_internal_reviewer_workbench") fail("internal use status drift");
if (audit.learnerUseStatus !== "blocked_not_learner_course") fail("learner use status drift");
if (audit.localCourseAbsorbed !== true || audit.publicSourcesAbsorbed !== true || audit.internalWorkbenchReady !== true) {
  fail("absorbed/internal readiness booleans drift");
}
if (audit.learnerReleaseBlocked !== true) fail("learner release must remain blocked");
if (audit.physicalPdfFiles !== 302 || audit.uniquePdfHashes !== 298 || audit.mappedUniquePdfFiles !== 298) fail("local course counts drift");
if (audit.publicCorpusDocuments !== 1196 || audit.wikipediaDocuments !== 96 || audit.officialLikeDocuments !== 202) fail("public source counts drift");
if (audit.mappedPublicDocuments !== 1196 || audit.moduleGroundedNodes !== 360) fail("public source mapping counts drift");
if (audit.modules !== 12 || audit.internalNavigationReadyModules !== 12 || audit.learnerReleaseReadyModules !== 0) fail("module readiness counts drift");
if (audit.reviewerActionRows !== 52 || audit.reviewerBlockedWorkItems !== 1715 || audit.reviewerReadyWorkItems !== 0) fail("reviewer queue counts drift");
if (audit.firstHandoffActionRows !== 20 || audit.firstHandoffRequiredWorkItems !== 257 || audit.firstHandoffReadyWorkItems !== 0 || audit.firstHandoffBlockedWorkItems !== 257) {
  fail("first handoff counts drift");
}
if (audit.sourceFitReviewRows !== 1638 || audit.readySourceFitReviewRows !== 0 || audit.blockedSourceFitReviewRows !== 1638) fail("source-fit counts drift");
if (audit.realHumanInputEntries !== 0 || audit.learnerCitationApprovedRows !== 0) fail("audit must not claim human input or citation approval");
if (audit.writeAllowedNow !== false || audit.manualAuthorizationRequired !== true) fail("write gate drift");

if (!Array.isArray(audit.stageRows) || audit.stageRows.length !== 7) fail("expected 7 stage rows");
if (!Array.isArray(audit.releaseBlockerRows) || audit.releaseBlockerRows.length !== 4) fail("expected 4 release blocker rows");
if (!audit.stageRows.some((row) => row.stageId === "local_course_folder_absorption" && row.ready === true && row.blockedItems === 0)) fail("missing local absorption ready row");
if (!audit.stageRows.some((row) => row.stageId === "public_source_coverage" && row.ready === true && row.blockedItems === 0)) fail("missing public source ready row");
if (!audit.stageRows.some((row) => row.stageId === "reviewer_action_queue" && row.blockedItems === 1715)) fail("missing reviewer queue blocker row");
if (!audit.stageRows.some((row) => row.stageId === "first_reviewer_field_execution" && row.blockedItems === 257)) fail("missing first reviewer blocker row");
if (!audit.stageRows.some((row) => row.stageId === "all_source_fit_rows" && row.blockedItems === 1638)) fail("missing source-fit blocker row");
if (!audit.releaseBlockerRows.some((row) => row.blockerId === "missing_real_human_review" && row.blockedItems === 1715)) fail("missing human review blocker");
if (!audit.releaseBlockerRows.some((row) => row.blockerId === "source_fit_rows_not_reviewed" && row.blockedItems === 1638)) fail("missing source-fit blocker");
if (!audit.releaseBlockerRows.some((row) => row.blockerId === "first_reviewer_completion_gate_blocked" && row.blockedItems === 257)) fail("missing first completion blocker");
if (!audit.releaseBlockerRows.some((row) => row.blockerId === "learner_release_modules_zero" && row.blockedItems === 12)) fail("missing module release blocker");
if (!Array.isArray(audit.nextBestActions) || audit.nextBestActions.length < 4) fail("next best actions too thin");
if (!Array.isArray(audit.commands) || !audit.commands.some((command) => /check:knowledge-release-blocker-audit/.test(command))) {
  fail("commands must include release blocker audit check");
}

const boundaryText = `${audit.boundary || ""} ${audit.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "absorbed local investment course pdfs",
  "public/wikipedia/official source coverage",
  "first reviewer gates",
  "source-fit review blockers",
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
  internalUseStatus: audit.internalUseStatus,
  learnerUseStatus: audit.learnerUseStatus,
  localCourseAbsorbed: audit.localCourseAbsorbed,
  publicSourcesAbsorbed: audit.publicSourcesAbsorbed,
  internalWorkbenchReady: audit.internalWorkbenchReady,
  learnerReleaseBlocked: audit.learnerReleaseBlocked,
  reviewerBlockedWorkItems: audit.reviewerBlockedWorkItems,
  firstHandoffBlockedWorkItems: audit.firstHandoffBlockedWorkItems,
  blockedSourceFitReviewRows: audit.blockedSourceFitReviewRows,
  realHumanInputEntries: audit.realHumanInputEntries,
  writeAllowedNow: audit.writeAllowedNow,
}, null, 2));
