import fs from "node:fs";

const dossierPath = "docs/LOCAL_COURSE_MODULE_REVIEW_DOSSIER.json";
const dossierMdPath = "docs/LOCAL_COURSE_MODULE_REVIEW_DOSSIER.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const dossier = readJson(dossierPath);
if (!fs.existsSync(dossierMdPath)) fail(`missing ${dossierMdPath}`);

if (dossier.educationOnly !== true) fail("dossier must keep educationOnly:true");
if (dossier.productionReady !== false) fail("dossier must keep productionReady:false");
if (dossier.learnerFacingRelease !== false) fail("dossier must keep learnerFacingRelease:false");
if (dossier.approvalStatus !== "not_approved") fail("dossier must remain not_approved");
if (dossier.dossierStatus !== "module_review_dossier_ready_for_internal_navigation_release_blocked") fail(`unexpected dossierStatus: ${dossier.dossierStatus}`);
if (dossier.dossierMode !== "module_browser_packet_for_local_course_absorption_review") fail("unexpected dossierMode");
if (dossier.modules !== 12) fail(`expected 12 modules, got ${dossier.modules}`);
if (dossier.researchLayerReadyModules !== 12) fail("all modules must remain research-layer ready");
if (dossier.rowsWithCoursePath !== 12) fail("each module must have a curriculum path");
if (dossier.rowsWithPublicEvidenceSamples !== 12) fail("each module must expose public evidence samples");
if (dossier.rowsWithEntryNodes !== 12) fail("each module must expose browser entry nodes");
if (dossier.rowsWithHighRiskBlockers !== 4) fail("expected 4 modules with high-risk blockers");
if (dossier.highRiskPreviewRows !== 12) fail("expected 12 high-risk lesson previews");
if (dossier.highRiskPreviewReleaseBlockers !== 12) fail("all high-risk previews must remain release blockers");
if (dossier.highRiskPreviewLearnerCitationApproved !== 0) fail("high-risk previews must not approve learner citations");
if (dossier.learnerReleaseReadyModules !== 0) fail("no modules should be learner-release ready");
if (dossier.localCourseDocuments !== 298 || dossier.localCourseChunks < 3000) fail("local course corpus totals drifted");
if (dossier.matchedKnowledgeNodes !== 360 || dossier.readyForRewriteReviewNodes !== 360) fail("knowledge-node local coverage drifted");
if (dossier.publicCorpusDocuments < 1000 || dossier.wikipediaDocuments < 90 || dossier.officialLikeDocuments < 200) {
  fail("public corpus totals below expected thresholds");
}
if (dossier.curriculumPaths !== 12 || dossier.totalPathLessons !== 360) fail("curriculum path coverage drifted");
if (dossier.p0SourceFitHandoffStatus !== "p0_real_reviewer_source_fit_handoff_ready_blocked_on_real_input") {
  fail("unexpected P0 source-fit handoff status");
}
if (dossier.p0SourceFitRealReadyRows !== 0 || dossier.p0SourceFitRealBlockedRows !== 22) {
  fail("real source-fit rows must remain 0 ready / 22 blocked");
}
if (dossier.p0SourceFitFixtureReadyRows !== 22) fail("fixture control must remain 22 ready rows");
if (dossier.writeAuthorizationStatus !== "write_authorization_preview_ready_manual_required") fail("unexpected write authorization status");
if (dossier.writeAllowedNow !== false) fail("dossier must not allow writes");
if (dossier.realHumanInputEntries !== 0) fail("dossier must not claim real human input");
if (dossier.manualAuthorizationRequired !== true) fail("manual authorization must be required");

if (!Array.isArray(dossier.globalReleaseBlockers) || dossier.globalReleaseBlockers.length < 5) {
  fail("dossier must include global release blockers");
}
if (!Array.isArray(dossier.moduleRows) || dossier.moduleRows.length !== 12) fail("moduleRows must contain 12 rows");
for (const row of dossier.moduleRows) {
  if (!row.moduleId || !row.browserModuleId || !row.module) fail("module row missing identity fields");
  if (!Array.isArray(row.topics) || row.topics.length === 0) fail(`${row.module} must expose topics`);
  if (!Array.isArray(row.entryNodeIds) || row.entryNodeIds.length === 0) fail(`${row.module} must expose entry nodes`);
  if (row.readyForRewriteReview !== row.learnerFacingNodes) fail(`${row.module} local node coverage is incomplete`);
  if (row.localResearchReady !== true || row.publicReferenceReady !== true || row.rewriteDraftReady !== true) {
    fail(`${row.module} must remain local/public/rewrite ready`);
  }
  if (row.researchLayerStatus !== "research_layer_absorbed_pending_review") fail(`${row.module} has unexpected researchLayerStatus`);
  if (!row.coursePath?.pathId || row.coursePath.lessonCount !== 30 || row.coursePath.unitCount !== 3) {
    fail(`${row.module} must expose a 30-lesson / 3-unit course path`);
  }
  if (!Array.isArray(row.publicEvidenceSamples) || row.publicEvidenceSamples.length < 3) {
    fail(`${row.module} must include public evidence samples`);
  }
  if (row.wikipediaEvidenceDocs < 2 || row.publicEvidenceDocs < row.publicEvidenceSamples.length) {
    fail(`${row.module} public grounding is too thin`);
  }
  if (row.learnerReleaseReady !== false) fail(`${row.module} must not be learner-release ready`);
  if (!/^module_review_ready_/.test(row.reviewStatus || "")) fail(`${row.module} has unexpected reviewStatus`);
  if (!/Reviewer-facing module dossier only/i.test(row.boundary || "")) fail(`${row.module} missing row boundary`);
  if (!Array.isArray(row.highRiskLessonPreview)) fail(`${row.module} highRiskLessonPreview must be an array`);
  if (row.highRiskReleaseBlockers > 0 && row.highRiskLessonPreview.length === 0) {
    fail(`${row.module} must expose high-risk lesson preview rows`);
  }
  for (const lesson of row.highRiskLessonPreview) {
    if (!lesson.lessonId || !lesson.nodeId || !lesson.topic) fail(`${row.module} high-risk preview missing identity fields`);
    if (lesson.publicGroundingStatus !== "mapped_for_reviewer_not_release_approved") {
      fail(`${lesson.lessonId} has unexpected publicGroundingStatus`);
    }
    if (lesson.wikipediaRefCount < 3 || lesson.publicContextRefCount < 2) {
      fail(`${lesson.lessonId} must expose public grounding counts`);
    }
    if (lesson.learnerCitationApproved !== false || lesson.learnerFacingRelease !== false) {
      fail(`${lesson.lessonId} must not be learner-approved or learner-facing`);
    }
    if (lesson.approvalStatus !== "not_approved" || lesson.releaseBlocker !== true) {
      fail(`${lesson.lessonId} must remain not approved and release-blocking`);
    }
    if (!Array.isArray(lesson.firstWikipediaRefs) || lesson.firstWikipediaRefs.length < 2) {
      fail(`${lesson.lessonId} must include Wikipedia ref previews`);
    }
    if (!lesson.firstWikipediaRefs.every((ref) => ref.name && ref.url && ref.excerptPolicy)) {
      fail(`${lesson.lessonId} Wikipedia ref previews missing fields`);
    }
    if (!/human_public_grounding_review/i.test(lesson.nextGate || "")) {
      fail(`${lesson.lessonId} has unexpected nextGate`);
    }
  }
}

if (!Array.isArray(dossier.commands) || dossier.commands.length < 4) fail("dossier must include verification commands");
for (const command of [
  "check:local-course-module-review-dossier",
  "check:local-course-module-absorption-self-audit",
  "check:local-course-p0-real-reviewer-source-fit-handoff",
  "check:local-course-p0-write-authorization-preview",
]) {
  if (!dossier.commands.some((item) => item.includes(command))) fail(`commands missing ${command}`);
}

const boundaryText = `${dossier.boundary || ""} ${dossier.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "local private course coverage",
  "public/wikipedia grounding candidates",
  "curriculum paths",
  "does not make private pdfs public citations",
  "approve learner-facing release",
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
  educationOnly: dossier.educationOnly,
  productionReady: dossier.productionReady,
  learnerFacingRelease: dossier.learnerFacingRelease,
  approvalStatus: dossier.approvalStatus,
  dossierStatus: dossier.dossierStatus,
  modules: dossier.modules,
  rowsWithCoursePath: dossier.rowsWithCoursePath,
  rowsWithPublicEvidenceSamples: dossier.rowsWithPublicEvidenceSamples,
  highRiskPreviewRows: dossier.highRiskPreviewRows,
  learnerReleaseReadyModules: dossier.learnerReleaseReadyModules,
  p0SourceFitRealReadyRows: dossier.p0SourceFitRealReadyRows,
  p0SourceFitRealBlockedRows: dossier.p0SourceFitRealBlockedRows,
  writeAllowedNow: dossier.writeAllowedNow,
}, null, 2));
