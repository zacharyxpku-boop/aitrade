import fs from "node:fs";

const auditPath = "docs/WIKIPEDIA_GROUNDING_AUDIT.json";
const auditMdPath = "docs/WIKIPEDIA_GROUNDING_AUDIT.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const audit = readJson(auditPath);
if (!fs.existsSync(auditMdPath)) fail(`missing ${auditMdPath}`);

if (audit.educationOnly !== true) fail("Wikipedia audit must keep educationOnly:true");
if (audit.productionReady !== false) fail("Wikipedia audit must keep productionReady:false");
if (audit.learnerFacingRelease !== false) fail("Wikipedia audit must keep learnerFacingRelease:false");
if (audit.approvalStatus !== "not_approved") fail("Wikipedia audit must remain not_approved");
if (audit.auditStatus !== "wikipedia_grounding_ready_for_reviewer_not_release") fail(`unexpected auditStatus: ${audit.auditStatus}`);
if (audit.auditMode !== "public_wikipedia_research_layer_grounding_audit") fail("unexpected auditMode");
if (audit.wikipediaDocuments !== 96) fail(`expected 96 Wikipedia docs, got ${audit.wikipediaDocuments}`);
if (audit.wikipediaDocumentsFromPublicGap !== 96) fail("public gap Wikipedia count drifted");
if (audit.publicCorpusDocuments < 1100) fail("public corpus count too low");
if (audit.recentHarvestArticlesAttempted !== 20) fail("recent Wikipedia harvest attempted count drifted");
if (audit.recentHarvestArticlesStored !== 6) fail("recent Wikipedia harvest stored count drifted");
if (audit.modules !== 12) fail("expected 12 modules");
if (audit.modulesWithWikipediaGrounding !== 12) fail("all modules must have Wikipedia grounding");
if (audit.modulesWithTwoWikipediaGroundingDocs !== 12) fail("all modules must have 2+ Wikipedia grounding docs");
if (audit.modulesWithWikipediaSamples !== 12) fail("all modules must expose Wikipedia samples");
if (!Array.isArray(audit.wikipediaThinModules) || audit.wikipediaThinModules.length !== 0) fail("no Wikipedia-thin modules expected");
if (audit.highRiskLessonRows.length !== 12) fail("expected 12 high-risk lesson rows");
if (audit.highRiskLessonsWithAtLeastThreeWikipediaRefs !== 12) fail("all high-risk lessons need 3+ Wikipedia refs");
if (audit.highRiskWikipediaRefCount < 48) fail("high-risk Wikipedia ref count too low");
if (audit.highRiskLearnerCitationApprovedLessons !== 0) fail("high-risk learner citations must not be approved");
if (audit.learnerCitationApprovedModules !== 0) fail("module learner citation approval must remain zero");
if (audit.writeAllowedNow !== false) fail("Wikipedia audit must not allow writes");
if (audit.manualAuthorizationRequired !== true) fail("manual authorization must be required");

if (!Array.isArray(audit.moduleRows) || audit.moduleRows.length !== 12) fail("moduleRows must contain 12 rows");
for (const row of audit.moduleRows) {
  if (!row.moduleId || !row.module) fail("module row missing identity fields");
  if (row.wikipediaEvidenceDocs < 2) fail(`${row.module} needs 2+ Wikipedia evidence docs`);
  if (!Array.isArray(row.wikipediaSamples) || row.wikipediaSamples.length < 1) fail(`${row.module} needs Wikipedia samples`);
  if (!row.wikipediaSamples.every((sample) =>
    sample.documentId &&
    sample.name &&
    /^https:\/\/en\.wikipedia\.org\/wiki\//.test(sample.url || "") &&
    sample.excerptPolicy === "attribution_and_share_alike_required")) {
    fail(`${row.module} Wikipedia samples missing attribution metadata`);
  }
  if (row.learnerCitationApproved !== false || row.learnerFacingRelease !== false) {
    fail(`${row.module} must not be learner-approved or learner-facing`);
  }
  if (row.nextGate !== "human_source_fit_public_grounding_originality_and_separate_release_approval") {
    fail(`${row.module} nextGate drifted`);
  }
}

for (const row of audit.highRiskLessonRows) {
  if (!row.lessonId || !row.nodeId || !row.module || !row.topic) fail("high-risk lesson row missing identity fields");
  if (row.wikipediaRefCount < 3 || row.publicContextRefCount < 2) fail(`${row.lessonId} grounding counts too low`);
  if (row.publicGroundingStatus !== "mapped_for_reviewer_not_release_approved") fail(`${row.lessonId} public grounding status drift`);
  if (row.learnerCitationApproved !== false || row.learnerFacingRelease !== false) fail(`${row.lessonId} must not be learner-approved`);
  if (row.approvalStatus !== "not_approved" || row.releaseBlocker !== true) fail(`${row.lessonId} approval gate drift`);
  if (!Array.isArray(row.firstWikipediaRefs) || row.firstWikipediaRefs.length < 2) fail(`${row.lessonId} missing Wikipedia ref previews`);
}

if (!Array.isArray(audit.wikipediaDocSamples) || audit.wikipediaDocSamples.length < 8) fail("Wikipedia doc samples missing");
for (const sample of audit.wikipediaDocSamples) {
  if (!sample.id || !sample.sourceId || !sample.name || !sample.url) fail("Wikipedia doc sample missing fields");
  if (sample.excerptPolicy !== "attribution_and_share_alike_required") fail(`${sample.id} excerpt policy drift`);
  if (sample.learnerFacingApproved !== false) fail(`${sample.id} must not be learner-facing approved`);
}

if (!Array.isArray(audit.commands) || audit.commands.length < 4) fail("audit must include verification commands");
for (const command of [
  "check:wikipedia-grounding-audit",
  "check:public-source-gap-audit",
  "check:local-course-high-risk-public-grounding-matrix",
  "check:local-course-module-review-dossier",
]) {
  if (!audit.commands.some((item) => item.includes(command))) fail(`commands missing ${command}`);
}

const boundaryText = `${audit.boundary || ""} ${audit.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "cc by-sa/share-alike",
  "terminology",
  "taxonomy",
  "does not approve learner-facing citations",
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
  educationOnly: audit.educationOnly,
  productionReady: audit.productionReady,
  learnerFacingRelease: audit.learnerFacingRelease,
  approvalStatus: audit.approvalStatus,
  auditStatus: audit.auditStatus,
  wikipediaDocuments: audit.wikipediaDocuments,
  modulesWithWikipediaGrounding: audit.modulesWithWikipediaGrounding,
  highRiskLessonsWithAtLeastThreeWikipediaRefs: audit.highRiskLessonsWithAtLeastThreeWikipediaRefs,
  writeAllowedNow: audit.writeAllowedNow,
}, null, 2));
