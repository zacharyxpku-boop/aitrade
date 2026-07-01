import fs from "node:fs";

const manifestPath = "docs/LOCAL_COURSE_5_SOURCE_RETENTION_MANIFEST.json";
const manifestMdPath = "docs/LOCAL_COURSE_5_SOURCE_RETENTION_MANIFEST.md";
const intakePath = "docs/LOCAL_COURSE_5_DOCUMENT_INTAKE.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const manifest = readJson(manifestPath);
const intake = readJson(intakePath);
if (!fs.existsSync(manifestMdPath)) fail(`missing ${manifestMdPath}`);

if (manifest.educationOnly !== true) fail("manifest must keep educationOnly:true");
if (manifest.productionReady !== false) fail("manifest must keep productionReady:false");
if (manifest.learnerFacingRelease !== false) fail("manifest must keep learnerFacingRelease:false");
if (manifest.approvalStatus !== "not_approved") fail("manifest must keep approvalStatus:not_approved");
if (manifest.writeAllowedNow !== false) fail("manifest must keep writeAllowedNow:false");
if (manifest.manifestStatus !== "course_5_source_retention_manifest_ready_folder_deletion_blocked") fail(`unexpected manifestStatus: ${manifest.manifestStatus}`);
if (manifest.sourceFolderMayBeDeleted !== false || manifest.currentKnowledgeArtifactsCanReplaceSourceFolder !== false) fail("source deletion boundary drift");
if (manifest.totalFiles !== 134 || manifest.uniquePrimaryRows !== 131) fail("source counts drift");
if (!Array.isArray(manifest.retentionRows) || manifest.retentionRows.length !== 134) fail("retentionRows must cover all 134 source files");

const retentionIds = new Set();
for (const row of manifest.retentionRows) {
  if (!row.retentionId || retentionIds.has(row.retentionId)) fail(`duplicate or missing retentionId: ${row.retentionId}`);
  retentionIds.add(row.retentionId);
  if (!row.recordId || !row.relativePath || !row.sha256) fail(`missing file identity for ${row.retentionId}`);
  if (!row.retentionClass) fail(`missing retentionClass for ${row.recordId}`);
  if (typeof row.mustKeepOriginalForKnowledge !== "boolean") fail(`missing mustKeepOriginalForKnowledge for ${row.recordId}`);
  if (typeof row.mayRemoveAfterSeparateUserConfirmation !== "boolean") fail(`missing mayRemoveAfterSeparateUserConfirmation for ${row.recordId}`);
  if (!row.reason || !row.nextGate) fail(`missing reason/nextGate for ${row.recordId}`);
  if (row.retentionClass === "must_retain_source_until_visual_or_ocr_resolved" && row.mayRemoveAfterSeparateUserConfirmation !== false) fail(`must-retain row cannot be cleanup eligible: ${row.recordId}`);
}

const intakeRetentionIds = new Set((intake.rows || []).map((row) => `${row.sha256}:${row.relativePath}`));
for (const id of intakeRetentionIds) {
  if (!retentionIds.has(id)) fail(`manifest missing intake file row ${id}`);
}

const followupIds = new Set((intake.followupQueue || []).map((row) => row.recordId));
const mustRetainFollowupIds = new Set(
  manifest.retentionRows
    .filter((row) => row.retentionClass === "must_retain_source_until_visual_or_ocr_resolved")
    .map((row) => row.recordId)
);
for (const id of followupIds) {
  if (!mustRetainFollowupIds.has(id)) fail(`follow-up row not marked must-retain: ${id}`);
}

if (manifest.followupRequiredRows !== 49 || manifest.mustRetainSourceRows !== 49) fail("all 49 follow-up rows must remain must-retain blockers");
if (manifest.duplicateRows !== 3) fail("expected 3 duplicate rows");
if (manifest.textAbsorbedColdStorageCandidateRows !== 82) fail("expected 82 text-absorbed cold-storage candidate rows");
if (manifest.manualAuditRows !== 0) fail("manual audit row count should be zero");
if (manifest.visualOcrBlockedRows !== 386 || manifest.visualOcrReadyRows !== 0) fail("visual/OCR reviewer gate should remain fully blocked");
if (manifest.ocrEngineAvailable !== false) fail("OCR engine availability drift");
if (manifest.blockerSummary?.blockingFollowupRows !== 49) fail("blocker summary drift");

const boundaryText = `${manifest.boundary || ""} ${manifest.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education operations",
  "retention",
  "source intake",
  "visual/ocr review",
  "deletion-readiness",
  "does not delete files",
  "approve folder deletion",
  "learner-facing release",
  "accept machine drafts as human review",
  "copy private source wording",
  "stock recommendations",
  "live signals",
  "return promises",
  "real-money guidance",
  "production readiness",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  manifestStatus: manifest.manifestStatus,
  totalFiles: manifest.totalFiles,
  duplicateRows: manifest.duplicateRows,
  textAbsorbedColdStorageCandidateRows: manifest.textAbsorbedColdStorageCandidateRows,
  mustRetainSourceRows: manifest.mustRetainSourceRows,
  followupRequiredRows: manifest.followupRequiredRows,
  visualOcrBlockedRows: manifest.visualOcrBlockedRows,
  sourceFolderMayBeDeleted: manifest.sourceFolderMayBeDeleted,
}, null, 2));
