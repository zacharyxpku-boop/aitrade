import fs from "node:fs";

const readinessPath = "docs/LOCAL_COURSE_ORIGINAL_FOLDER_DELETION_READINESS.json";
const readinessMdPath = "docs/LOCAL_COURSE_ORIGINAL_FOLDER_DELETION_READINESS.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const readiness = readJson(readinessPath);
if (!fs.existsSync(readinessMdPath)) fail(`missing ${readinessMdPath}`);

if (readiness.educationOnly !== true) fail("readiness must keep educationOnly:true");
if (readiness.productionReady !== false) fail("readiness must keep productionReady:false");
if (readiness.learnerFacingRelease !== false) fail("readiness must keep learnerFacingRelease:false");
if (readiness.approvalStatus !== "not_approved") fail("readiness must remain not_approved");
if (readiness.readinessStatus !== "desktop_original_folders_may_be_removed_after_absorption_snapshot_verified") fail("unexpected readinessStatus");
if (readiness.readinessMode !== "static_absorption_snapshot_allows_disk_cleanup_without_learner_release") fail("unexpected readinessMode");
if (readiness.originalDesktopFoldersRequiredForVerify !== false) fail("Desktop originals must not be required for verify");
if (readiness.localOriginalFoldersMayBeRemovedFromDesktop !== true) fail("deletion readiness must be explicit");
if (readiness.knowledgeBaseArtifactsRetainRequiredEvidence !== true) fail("knowledge-base artifact evidence must be retained");

const proof = readiness.absorptionProof || {};
if (proof.investmentPhysicalPdfFiles !== 302) fail("investment physical PDF count drift");
if (proof.investmentUniquePdfHashes !== 298) fail("investment unique hash count drift");
if (proof.combinedPhysicalPdfFiles !== 313) fail("combined physical PDF count drift");
if (proof.combinedUniquePdfHashes !== 298) fail("combined unique hash count drift");
if (proof.contentCoveredPhysicalPdfFiles !== 313) fail("all physical PDFs must be covered");
if (proof.contentCoveredUniquePdfHashes !== 298) fail("all unique hashes must be covered");
if (proof.unmappedPhysicalPdfFiles !== 0) fail("unmapped physical PDFs must be zero");
if (proof.totalDocumentNodeMatches !== 2375) fail("document-node match count drift");

const gates = readiness.gates || {};
if (
  gates.writeAllowedNow !== false ||
  gates.manualAuthorizationRequired !== true ||
  gates.learnerFacingReleaseReady !== false ||
  gates.humanReviewStillRequiredBeforeLearnerRelease !== true
) {
  fail("release/write gates must remain locked");
}

if (!Array.isArray(readiness.folders) || readiness.folders.length !== 2) fail("expected two deletion readiness folder rows");
if (!readiness.folders.every((row) =>
  row.rootId &&
  row.rootPath &&
  row.physicalPdfFiles > 0 &&
  row.contentCoveredPhysicalPdfFiles === row.physicalPdfFiles &&
  row.unmappedPhysicalPdfFiles === 0 &&
  row.deletionReadiness === "may_remove_from_desktop_after_user_confirms"
)) {
  fail("folder deletion readiness rows drift");
}
if (!readiness.folders.some((row) => row.rootId === "advanced_trading" && row.duplicatePhysicalPdfFilesAcrossAudit === 11)) {
  fail("advanced trading duplicate coverage proof missing");
}
if (!Array.isArray(readiness.commands) || !readiness.commands.some((command) => /check:local-course-original-folder-deletion-readiness/.test(command))) {
  fail("commands must include deletion readiness check");
}

const boundaryText = `${readiness.boundary || ""} ${readiness.caveat || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "does not approve learner-facing release",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
  "production readiness",
  "future re-ocr",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary/caveat missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  readinessStatus: readiness.readinessStatus,
  originalDesktopFoldersRequiredForVerify: readiness.originalDesktopFoldersRequiredForVerify,
  localOriginalFoldersMayBeRemovedFromDesktop: readiness.localOriginalFoldersMayBeRemovedFromDesktop,
  combinedPhysicalPdfFiles: proof.combinedPhysicalPdfFiles,
  contentCoveredPhysicalPdfFiles: proof.contentCoveredPhysicalPdfFiles,
  unmappedPhysicalPdfFiles: proof.unmappedPhysicalPdfFiles,
  writeAllowedNow: gates.writeAllowedNow,
}, null, 2));
