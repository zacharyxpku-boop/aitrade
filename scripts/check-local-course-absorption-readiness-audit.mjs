import fs from "node:fs";

const auditPath = "docs/LOCAL_COURSE_ABSORPTION_READINESS_AUDIT.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const audit = readJson(auditPath);
const phaseRows = audit.phaseRows || [];
const blockers = audit.blockers || [];

if (audit.educationOnly !== true) fail("absorption readiness audit must keep educationOnly:true");
if (audit.productionReady !== false) fail("absorption readiness audit must keep productionReady:false");
if (audit.learnerFacingRelease !== false) fail("absorption readiness audit must keep learnerFacingRelease:false");
if (audit.approvalStatus !== "not_approved") fail("absorption readiness audit must remain not_approved");
if (audit.readinessStatus !== "blocked_for_learner_facing_absorption") fail(`unexpected readinessStatus: ${audit.readinessStatus}`);

if (audit.importedUniquePdfFiles !== 298 || audit.uniquePdfFiles !== 298) {
  fail(`expected 298/298 imported unique PDFs, got ${audit.importedUniquePdfFiles}/${audit.uniquePdfFiles}`);
}
if (audit.localCourseDocuments !== 298 || audit.localCourseChunks < 3000) {
  fail(`unexpected local course corpus coverage: ${audit.localCourseDocuments} docs / ${audit.localCourseChunks} chunks`);
}
if (audit.readyForRewriteReviewNodes !== 360 || audit.matchedKnowledgeNodes !== 360) {
  fail(`expected 360/360 matched rewrite-ready nodes, got ${audit.readyForRewriteReviewNodes}/${audit.matchedKnowledgeNodes}`);
}
if (audit.publicReferenceReadyModules !== 12 || audit.modules !== 12) {
  fail(`expected 12/12 public-reference-ready modules, got ${audit.publicReferenceReadyModules}/${audit.modules}`);
}
if (audit.wikipediaDocuments < 90 || audit.officialLikeDocuments < 200 || audit.publicCorpusDocuments < 1000) {
  fail("public source corpus summary is below expected threshold");
}
if (audit.rewriteDrafts !== 120 || audit.reviewerCandidates !== 120) {
  fail(`expected 120 rewrite drafts and reviewer candidates, got ${audit.rewriteDrafts}/${audit.reviewerCandidates}`);
}
if (audit.lowExtractionDocs !== 5) fail(`expected 5 low-extraction docs, got ${audit.lowExtractionDocs}`);
if (audit.manualTranscriptionPages !== 19) fail(`expected 19 manual transcription pages, got ${audit.manualTranscriptionPages}`);
if (audit.sourceReplacementCandidates !== 3) fail(`expected 3 source replacement candidates, got ${audit.sourceReplacementCandidates}`);
if (audit.acceptedTranscriptPages !== 0) fail(`expected 0 accepted transcript pages, got ${audit.acceptedTranscriptPages}`);
if (audit.openBlockers < 4) fail(`expected at least 4 open blockers, got ${audit.openBlockers}`);

const phaseById = new Map(phaseRows.map((row) => [row.id, row]));
for (const requiredPhase of [
  "local_pdf_harvest",
  "knowledge_module_mapping",
  "public_grounding",
  "local_rewrite_batches",
  "low_extraction_recovery",
  "learner_facing_release",
]) {
  if (!phaseById.has(requiredPhase)) fail(`missing phase ${requiredPhase}`);
}
if (phaseById.get("local_pdf_harvest").status !== "complete_for_research_layer") fail("local PDF harvest phase should be research-layer complete");
if (phaseById.get("public_grounding").status !== "public_reference_ready_for_all_modules") fail("public grounding phase should be module-ready");
if (phaseById.get("low_extraction_recovery").status !== "blocked") fail("low-extraction recovery must remain blocked");
if (phaseById.get("learner_facing_release").status !== "not_approved") fail("learner-facing release must remain not_approved");

const blockerById = new Map(blockers.map((row) => [row.id, row]));
if (blockerById.get("manual_transcription_pages")?.count !== 19) fail("manual transcription blocker count drift");
if (blockerById.get("blank_source_replacement_pages")?.count !== 3) fail("source replacement blocker count drift");
if (blockerById.get("risky_language_docs")?.count !== 2) fail("risky-language blocker count drift");
if (blockerById.get("reviewer_refinement_candidates")?.count !== 120) fail("reviewer refinement blocker count drift");
if ([...blockerById.values()].some((row) => row.status === "cleared")) fail("current absorption blockers must not be reported as cleared");

const boundaryText = `${audit.boundary || ""} ${audit.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "research-layer ingestion",
  "learner-facing course release",
  "does not approve trading advice",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
]) {
  if (!boundaryText.includes(phrase)) fail(`audit boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: audit.educationOnly,
  productionReady: audit.productionReady,
  learnerFacingRelease: audit.learnerFacingRelease,
  approvalStatus: audit.approvalStatus,
  readinessStatus: audit.readinessStatus,
  importedUniquePdfFiles: audit.importedUniquePdfFiles,
  uniquePdfFiles: audit.uniquePdfFiles,
  publicReferenceReadyModules: audit.publicReferenceReadyModules,
  modules: audit.modules,
  manualTranscriptionPages: audit.manualTranscriptionPages,
  sourceReplacementCandidates: audit.sourceReplacementCandidates,
  openBlockers: audit.openBlockers,
}, null, 2));
