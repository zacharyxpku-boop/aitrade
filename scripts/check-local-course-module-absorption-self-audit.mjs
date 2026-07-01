import fs from "node:fs";

const auditPath = "docs/LOCAL_COURSE_MODULE_ABSORPTION_SELF_AUDIT.json";
const auditMdPath = "docs/LOCAL_COURSE_MODULE_ABSORPTION_SELF_AUDIT.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const audit = readJson(auditPath);
if (!fs.existsSync(auditMdPath)) fail(`missing ${auditMdPath}`);

if (audit.educationOnly !== true) fail("module absorption audit must keep educationOnly:true");
if (audit.productionReady !== false) fail("module absorption audit must keep productionReady:false");
if (audit.learnerFacingRelease !== false) fail("module absorption audit must keep learnerFacingRelease:false");
if (audit.approvalStatus !== "not_approved") fail("module absorption audit must remain not_approved");
if (audit.auditStatus !== "module_research_layer_absorbed_release_blocked") fail(`unexpected auditStatus: ${audit.auditStatus}`);
if (audit.courseUsabilityStatus !== "usable_for_internal_reviewer_navigation_not_learner_release") fail("unexpected course usability status");

if (audit.modules !== 12) fail(`expected 12 modules, got ${audit.modules}`);
if (audit.researchLayerReadyModules !== 12) fail(`expected 12 research-layer-ready modules, got ${audit.researchLayerReadyModules}`);
if (audit.localResearchReadyModules !== 12) fail(`expected 12 local-ready modules, got ${audit.localResearchReadyModules}`);
if (audit.publicReferenceReadyModules !== 12) fail(`expected 12 public-reference-ready modules, got ${audit.publicReferenceReadyModules}`);
if (audit.rewriteDraftReadyModules !== 12) fail(`expected 12 rewrite-draft-ready modules, got ${audit.rewriteDraftReadyModules}`);

if (audit.importedUniquePdfFiles !== 298 || audit.uniquePdfFiles !== 298) {
  fail(`expected 298/298 imported PDFs, got ${audit.importedUniquePdfFiles}/${audit.uniquePdfFiles}`);
}
if (audit.localCourseDocuments !== 298 || audit.localCourseChunks < 3000) fail("local course corpus totals drifted");
if (audit.matchedKnowledgeNodes !== 360 || audit.readyForRewriteReviewNodes !== 360) fail("knowledge-node local coverage drifted");
if (audit.publicCorpusDocuments < 1000 || audit.wikipediaDocuments < 90 || audit.officialLikeDocuments < 200) {
  fail("public corpus totals below expected thresholds");
}
if (audit.rewriteDrafts !== 120 || audit.rewriteCandidatesReadyForSeparateReview !== 120) fail("rewrite review totals drifted");
if (audit.copyRiskIssues !== 0 || audit.safetyIssues !== 0) fail("rewrite review should have zero copy and safety issues");
if (audit.manualTranscriptionPages !== 19) fail("manual transcription page count drifted");
if (audit.sourceReplacementCandidates !== 3) fail("source replacement candidate count drifted");
if (audit.acceptedTranscriptPages !== 0) fail("accepted transcript page count should remain zero");
if (audit.p0ReviewEntries !== 22 || audit.p0ValidationBlockedEntries !== 22) fail("P0 review entry block count drifted");
if (audit.realHumanInputEntries !== 0) fail("real human input must still be zero unless reviewer input has actually arrived");
if (audit.highRiskLessonCount !== 12 || audit.highRiskLessonsWithPublicGrounding !== 12) fail("high-risk public grounding totals drifted");
if (audit.highRiskReleaseBlockingLessons !== 12) fail("high-risk lessons must still be release-blocking");
if (audit.highRiskCodexSelfReviewNotes !== 72 || audit.highRiskExpectedSelfReviewNotes !== 72) fail("high-risk self-review note totals drifted");
if (audit.directSourceCandidateResolutions !== 5) fail("direct source candidate resolution count drifted");
if (audit.writeAllowedNow !== false) fail("module absorption audit must not allow writes");
if (audit.manualAuthorizationRequired !== true) fail("manual authorization must be required");

if (!Array.isArray(audit.moduleRows) || audit.moduleRows.length !== 12) fail("moduleRows must contain 12 rows");
for (const row of audit.moduleRows) {
  if (row.localResearchReady !== true) fail(`module ${row.module} is not localResearchReady`);
  if (row.publicReferenceReady !== true) fail(`module ${row.module} is not publicReferenceReady`);
  if (row.rewriteDraftReady !== true) fail(`module ${row.module} is not rewriteDraftReady`);
  if (row.researchLayerStatus !== "research_layer_absorbed_pending_review") fail(`module ${row.module} has unexpected researchLayerStatus`);
  if (row.releaseGateStatus !== "blocked_pending_human_review_and_separate_approval") fail(`module ${row.module} must remain release-blocked`);
  if (row.readyForRewriteReview !== row.learnerFacingNodes) fail(`module ${row.module} local node coverage is incomplete`);
  if (row.wikipediaEvidenceDocs < 2) fail(`module ${row.module} should have Wikipedia grounding`);
  if (row.rewriteDrafts < 10) fail(`module ${row.module} should have at least 10 rewrite drafts`);
}

const blockerById = new Map((audit.releaseBlockers || []).map((row) => [row.id, row]));
if (blockerById.get("p0_real_human_review_missing")?.count !== 22) fail("P0 real human review blocker count drift");
if (blockerById.get("manual_transcription_pages")?.count !== 19) fail("manual transcription blocker count drift");
if (blockerById.get("source_replacement_candidates")?.count !== 3) fail("source replacement blocker count drift");
if (blockerById.get("high_risk_release_blocking_lessons")?.count !== 12) fail("high-risk release blocker count drift");
if (blockerById.get("reviewer_refinement_candidates")?.count !== 120) fail("reviewer refinement blocker count drift");

const boundaryText = `${audit.boundary || ""} ${audit.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "does not approve learner-facing release",
  "private pdfs",
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
  educationOnly: audit.educationOnly,
  productionReady: audit.productionReady,
  learnerFacingRelease: audit.learnerFacingRelease,
  approvalStatus: audit.approvalStatus,
  auditStatus: audit.auditStatus,
  modules: audit.modules,
  researchLayerReadyModules: audit.researchLayerReadyModules,
  publicReferenceReadyModules: audit.publicReferenceReadyModules,
  realHumanInputEntries: audit.realHumanInputEntries,
  writeAllowedNow: audit.writeAllowedNow,
}, null, 2));
