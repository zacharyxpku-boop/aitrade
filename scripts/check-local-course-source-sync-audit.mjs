import fs from "node:fs";

const auditPath = "docs/LOCAL_COURSE_SOURCE_SYNC_AUDIT.json";
const auditMdPath = "docs/LOCAL_COURSE_SOURCE_SYNC_AUDIT.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const audit = readJson(auditPath);
if (!fs.existsSync(auditMdPath)) fail(`missing ${auditMdPath}`);

if (audit.educationOnly !== true) fail("sync audit must keep educationOnly:true");
if (audit.productionReady !== false) fail("sync audit must keep productionReady:false");
if (audit.learnerFacingRelease !== false) fail("sync audit must keep learnerFacingRelease:false");
if (audit.approvalStatus !== "not_approved") fail("sync audit must remain not_approved");
if (audit.syncStatus !== "source_folder_synced_to_private_research_corpus_release_blocked") {
  fail(`unexpected syncStatus: ${audit.syncStatus}`);
}
if (audit.syncMode !== "current_folder_to_manifest_and_private_corpus_hash_audit") fail("unexpected syncMode");
if (!audit.sourceRoot || audit.sourceRootAvailable !== true) fail("source root must be available");
if (audit.currentPdfFiles !== 302) fail(`expected 302 current PDFs, got ${audit.currentPdfFiles}`);
if (audit.currentUniquePdfHashes !== 298) fail(`expected 298 unique hashes, got ${audit.currentUniquePdfHashes}`);
if (audit.currentDuplicatePdfFiles !== 4) fail(`expected 4 duplicate PDFs, got ${audit.currentDuplicatePdfFiles}`);
if (audit.manifestPdfFiles !== 302) fail("manifest PDF count drifted");
if (audit.manifestUniquePdfFiles !== 298) fail("manifest unique PDF count drifted");
if (audit.harvestReportTotalPdfFiles !== 302) fail("harvest report total PDF count drifted");
if (audit.harvestReportUniquePdfFiles !== 298) fail("harvest report unique PDF count drifted");
if (audit.localPrivateCourseCorpusDocs < 298) fail("local private course corpus docs below expected unique files");
if (audit.corpusDocsForCurrentUniqueHashes !== 298) fail("current unique hashes must all map to corpus docs");
if (audit.missingCurrentFilesFromManifest !== 0) fail("current files missing from manifest");
if (audit.staleManifestFiles !== 0) fail("stale manifest files detected");
if (audit.missingCurrentUniqueHashesFromCorpus !== 0) fail("current unique files missing from corpus");
if (audit.corpusDocsMissingSourceFile !== 0) fail("corpus docs point to missing source files");
if (audit.learnerFacingAllowedDocs !== 0) fail("local private docs must not be learner-facing allowed");
if (audit.productionReadyDocs !== 0) fail("local private docs must not be production ready");
if (audit.writeAllowedNow !== false) fail("sync audit must not allow writes");
if (audit.manualAuthorizationRequired !== true) fail("manual authorization must be required");

if (!Array.isArray(audit.duplicateRows) || audit.duplicateRows.length !== 4) fail("audit must list 4 duplicate rows");
for (const row of audit.duplicateRows) {
  if (!row.relativePath || !row.duplicateOf || !row.sha256 || row.sha256.length !== 64) {
    fail("duplicate row missing fields");
  }
}

if (!Array.isArray(audit.corpusDocSamples) || audit.corpusDocSamples.length < 8) fail("audit must expose corpus doc samples");
for (const sample of audit.corpusDocSamples) {
  if (!sample.id || !sample.sourceId || !sample.sourceRelativePath) fail("corpus sample missing identity fields");
  if (sample.learnerFacingAllowed !== false) fail(`${sample.id} must not be learner-facing allowed`);
}

if (!Array.isArray(audit.commands) || audit.commands.length < 4) fail("audit must include verification commands");
for (const command of [
  "check:local-course-source-sync-audit",
  "check:local-investment-course",
  "check:local-course-coverage",
  "check:local-course-module-review-dossier",
]) {
  if (!audit.commands.some((item) => item.includes(command))) fail(`commands missing ${command}`);
}

const boundaryText = `${audit.boundary || ""} ${audit.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "current pdfs remain private internal research sources",
  "does not make private pdfs public citations",
  "approve learner-facing lessons",
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
  syncStatus: audit.syncStatus,
  currentPdfFiles: audit.currentPdfFiles,
  currentUniquePdfHashes: audit.currentUniquePdfHashes,
  currentDuplicatePdfFiles: audit.currentDuplicatePdfFiles,
  corpusDocsForCurrentUniqueHashes: audit.corpusDocsForCurrentUniqueHashes,
  missingCurrentUniqueHashesFromCorpus: audit.missingCurrentUniqueHashesFromCorpus,
  writeAllowedNow: audit.writeAllowedNow,
}, null, 2));
