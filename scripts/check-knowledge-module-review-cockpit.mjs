import fs from "node:fs";

const cockpitPath = "docs/KNOWLEDGE_MODULE_REVIEW_COCKPIT.json";
const cockpitMdPath = "docs/KNOWLEDGE_MODULE_REVIEW_COCKPIT.md";

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
if (cockpit.cockpitStatus !== "module_review_cockpit_ready_release_blocked") fail(`unexpected cockpitStatus: ${cockpit.cockpitStatus}`);
if (cockpit.cockpitMode !== "module_to_nodes_sources_course_path_review_status_navigation") fail("unexpected cockpitMode");
if (cockpit.modules !== 12 || cockpit.internalNavigationReadyModules !== 12) fail("expected all 12 modules to be internally navigable");
if (cockpit.learnerReleaseReadyModules !== 0) fail("no module may be learner-release ready yet");
if (cockpit.localCourseDocuments !== 298 || cockpit.localCourseChunks !== 3314) fail("local course corpus counts drift");
if (cockpit.matchedKnowledgeNodes !== 360 || cockpit.readyForRewriteReviewNodes !== 360) fail("knowledge node local coverage drift");
if (cockpit.publicCorpusDocuments !== 1196 || cockpit.wikipediaDocuments !== 96 || cockpit.officialLikeDocuments !== 202) {
  fail("public source counts drift");
}
if (cockpit.sourceFitReviewRows !== 1638 || cockpit.readySourceFitReviewRows !== 0 || cockpit.blockedSourceFitReviewRows !== 1638) {
  fail("source-fit review row counts drift");
}
if (cockpit.highRiskLessons !== 12 || cockpit.highRiskReadyReviewerNotes !== 0 || cockpit.highRiskBlockedReviewerNotes !== 72) {
  fail("high-risk note counts drift");
}
if (cockpit.realHumanInputEntries !== 0) fail("cockpit must not claim real human input");
if (cockpit.writeAllowedNow !== false || cockpit.manualAuthorizationRequired !== true) fail("write gate must remain locked");
if (cockpit.readinessStatus !== "knowledge_base_internal_review_ready_release_blocked") fail("readiness gate status drift");
if (cockpit.knowledgeBaseUsefulnessStatus !== "usable_as_internal_reviewer_knowledge_base_not_learner_course") {
  fail("knowledge base usefulness status drift");
}

if (!Array.isArray(cockpit.moduleRows) || cockpit.moduleRows.length !== 12) fail("expected 12 module rows");
if (!cockpit.moduleRows.every((row) =>
  row.module &&
  row.browserModuleId &&
  row.coursePath?.lessonCount === 30 &&
  Array.isArray(row.entryNodeIds) &&
  row.entryNodeIds.length > 0 &&
  row.learnerFacingNodes === 30 &&
  row.nodesWithLocalCourseMatches === 30 &&
  row.readyForRewriteReview === 30 &&
  row.localCoverageRate === 1 &&
  row.publicEvidenceDocs > 0 &&
  row.wikipediaEvidenceDocs > 0 &&
  row.sourceFitRows >= row.readySourceFitRows &&
  row.blockedSourceFitRows >= 0 &&
  row.internalNavigationReady === true &&
  row.learnerFacingRelease === false &&
  row.writeAllowedNow === false &&
  row.realHumanInputEntries === 0 &&
  row.reviewStatus === "module_internal_navigation_ready_learner_release_blocked" &&
  /review/.test(row.nextReviewerAction || "") &&
  /Reviewer-facing module cockpit row only/i.test(row.boundary || "")
)) {
  fail("module row readiness/boundary drift");
}

const totalSourceFitRows = cockpit.moduleRows.reduce((sum, row) => sum + (row.sourceFitRows || 0), 0);
const totalReadySourceFitRows = cockpit.moduleRows.reduce((sum, row) => sum + (row.readySourceFitRows || 0), 0);
const totalBlockedSourceFitRows = cockpit.moduleRows.reduce((sum, row) => sum + (row.blockedSourceFitRows || 0), 0);
if (totalSourceFitRows !== 1638 || totalReadySourceFitRows !== 0 || totalBlockedSourceFitRows !== 1638) {
  fail("module source-fit row totals do not match cockpit totals");
}

const highRiskModules = cockpit.moduleRows.filter((row) => row.highRiskBlockedLessons > 0);
if (highRiskModules.length !== 4 || highRiskModules.reduce((sum, row) => sum + row.highRiskBlockedLessons, 0) !== 12) {
  fail("expected 4 high-risk modules and 12 blocked high-risk lessons");
}

if (!Array.isArray(cockpit.priorityModuleRows) || cockpit.priorityModuleRows.length !== 6) fail("expected 6 priority module rows");
if (!cockpit.priorityModuleRows[0]?.firstBlockedPacketId) fail("priority rows must expose first blocked packet");
if (!Array.isArray(cockpit.commands) || !cockpit.commands.some((command) => /check:knowledge-module-review-cockpit/.test(command))) {
  fail("commands must include module cockpit check");
}

const boundaryText = `${cockpit.boundary || ""} ${cockpit.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "modularizes the absorbed local investment course",
  "public/wikipedia/official materials",
  "does not generate real reviewer notes",
  "approve learner-facing citations",
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
  modules: cockpit.modules,
  internalNavigationReadyModules: cockpit.internalNavigationReadyModules,
  learnerReleaseReadyModules: cockpit.learnerReleaseReadyModules,
  sourceFitReviewRows: cockpit.sourceFitReviewRows,
  readySourceFitReviewRows: cockpit.readySourceFitReviewRows,
  highRiskReadyReviewerNotes: cockpit.highRiskReadyReviewerNotes,
  realHumanInputEntries: cockpit.realHumanInputEntries,
  writeAllowedNow: cockpit.writeAllowedNow,
}, null, 2));
