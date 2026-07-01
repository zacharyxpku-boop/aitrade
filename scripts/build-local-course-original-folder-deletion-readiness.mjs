import fs from "node:fs";

const ledgerPath = "docs/LOCAL_COURSE_FOLDER_ABSORPTION_LEDGER.json";
const auditPath = "docs/LOCAL_COURSE_MULTI_FOLDER_ABSORPTION_AUDIT.json";
const outputJsonPath = "docs/LOCAL_COURSE_ORIGINAL_FOLDER_DELETION_READINESS.json";
const outputMdPath = "docs/LOCAL_COURSE_ORIGINAL_FOLDER_DELETION_READINESS.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const ledger = readJson(ledgerPath);
const audit = readJson(auditPath);

if (ledger.educationOnly !== true || audit.educationOnly !== true) fail("local course artifacts must remain education-only");
if (ledger.productionReady !== false || audit.productionReady !== false) fail("local course artifacts must remain productionReady:false");
if (ledger.learnerFacingRelease !== false || audit.learnerFacingRelease !== false) fail("local course artifacts must remain learnerFacingRelease:false");
if (ledger.approvalStatus !== "not_approved" || audit.approvalStatus !== "not_approved") fail("local course artifacts must remain not approved");
if (ledger.writeAllowedNow !== false || audit.writeAllowedNow !== false) fail("local course artifacts must keep write gates locked");

if (ledger.physicalPdfFiles !== 302) fail("investment folder PDF count drift");
if (ledger.uniquePdfHashes !== 298) fail("investment unique hash count drift");
if (ledger.mappedUniquePdfFiles !== 298 || ledger.unmappedUniquePdfFiles !== 0) fail("investment folder is not fully mapped");
if (ledger.totalDocumentNodeMatches !== 2375) fail("investment document-node match count drift");

if (audit.auditedRoots !== 2) fail("multi-folder audit must cover two roots");
if (audit.physicalPdfFiles !== 313) fail("multi-folder physical PDF count drift");
if (audit.uniquePdfHashes !== 298) fail("multi-folder unique hash count drift");
if (audit.contentCoveredPhysicalPdfFiles !== 313) fail("not every physical PDF is content-covered");
if (audit.contentCoveredUniquePdfHashes !== 298) fail("not every unique PDF hash is content-covered");
if (audit.unmappedPhysicalPdfFiles !== 0 || audit.unmappedUniquePdfHashes !== 0) fail("uncovered local PDFs remain");
if (!Array.isArray(audit.coveredRows) || audit.coveredRows.length !== 313) fail("covered row manifest drift");
if (!Array.isArray(audit.uncoveredRows) || audit.uncoveredRows.length !== 0) fail("uncovered rows must be empty");

const investment = audit.rootRows?.find((row) => row.rootId === "investment_main");
const advanced = audit.rootRows?.find((row) => row.rootId === "advanced_trading");
if (!investment || !advanced) fail("missing root rows");
if (investment.physicalPdfFiles !== 302 || investment.contentCoveredPhysicalPdfFiles !== 302) fail("investment root coverage drift");
if (advanced.physicalPdfFiles !== 11 || advanced.contentCoveredPhysicalPdfFiles !== 11) fail("advanced root coverage drift");
if (advanced.duplicatePhysicalPdfFilesAcrossAudit !== 11) fail("advanced folder should be duplicate content already covered");

const readiness = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  readinessStatus: "desktop_original_folders_may_be_removed_after_absorption_snapshot_verified",
  readinessMode: "static_absorption_snapshot_allows_disk_cleanup_without_learner_release",
  originalDesktopFoldersRequiredForVerify: false,
  localOriginalFoldersMayBeRemovedFromDesktop: true,
  knowledgeBaseArtifactsRetainRequiredEvidence: true,
  caveat: "Deleting the Desktop source folders frees disk space and does not remove the current knowledge-base mappings, but it removes the convenient local originals for future re-OCR, re-extraction, or copyright/source re-inspection unless the user restores them from backup.",
  folders: [
    {
      rootId: "investment_main",
      rootPath: investment.rootPath,
      physicalPdfFiles: investment.physicalPdfFiles,
      uniquePdfHashes: investment.uniquePdfHashes,
      contentCoveredPhysicalPdfFiles: investment.contentCoveredPhysicalPdfFiles,
      contentCoveredUniquePdfHashes: investment.contentCoveredUniquePdfHashes,
      unmappedPhysicalPdfFiles: investment.unmappedPhysicalPdfFiles,
      deletionReadiness: "may_remove_from_desktop_after_user_confirms",
    },
    {
      rootId: "advanced_trading",
      rootPath: advanced.rootPath,
      physicalPdfFiles: advanced.physicalPdfFiles,
      uniquePdfHashes: advanced.uniquePdfHashes,
      contentCoveredPhysicalPdfFiles: advanced.contentCoveredPhysicalPdfFiles,
      contentCoveredUniquePdfHashes: advanced.contentCoveredUniquePdfHashes,
      duplicatePhysicalPdfFilesAcrossAudit: advanced.duplicatePhysicalPdfFilesAcrossAudit,
      unmappedPhysicalPdfFiles: advanced.unmappedPhysicalPdfFiles,
      deletionReadiness: "may_remove_from_desktop_after_user_confirms",
    },
  ],
  absorptionProof: {
    investmentPhysicalPdfFiles: ledger.physicalPdfFiles,
    investmentUniquePdfHashes: ledger.uniquePdfHashes,
    combinedPhysicalPdfFiles: audit.physicalPdfFiles,
    combinedUniquePdfHashes: audit.uniquePdfHashes,
    contentCoveredPhysicalPdfFiles: audit.contentCoveredPhysicalPdfFiles,
    contentCoveredUniquePdfHashes: audit.contentCoveredUniquePdfHashes,
    unmappedPhysicalPdfFiles: audit.unmappedPhysicalPdfFiles,
    totalDocumentNodeMatches: audit.totalDocumentNodeMatches,
  },
  gates: {
    writeAllowedNow: false,
    manualAuthorizationRequired: true,
    learnerFacingReleaseReady: false,
    humanReviewStillRequiredBeforeLearnerRelease: true,
  },
  commands: [
    "npm.cmd run build:local-course-original-folder-deletion-readiness",
    "npm.cmd run check:local-course-original-folder-deletion-readiness",
    "npm.cmd run verify",
  ],
  boundary: "This deletion-readiness artifact only confirms that the current local PDF source folders have been absorbed into reviewer-facing education-only knowledge artifacts. It does not approve learner-facing release, copied citations, stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(readiness, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course Original Folder Deletion Readiness",
  "",
  `- Readiness status: ${readiness.readinessStatus}`,
  `- Original Desktop folders required for verify: ${readiness.originalDesktopFoldersRequiredForVerify}`,
  `- Local original folders may be removed from Desktop: ${readiness.localOriginalFoldersMayBeRemovedFromDesktop}`,
  `- Combined physical PDFs covered: ${readiness.absorptionProof.contentCoveredPhysicalPdfFiles}/${readiness.absorptionProof.combinedPhysicalPdfFiles}`,
  `- Combined unique hashes covered: ${readiness.absorptionProof.contentCoveredUniquePdfHashes}/${readiness.absorptionProof.combinedUniquePdfHashes}`,
  `- Unmapped physical PDFs: ${readiness.absorptionProof.unmappedPhysicalPdfFiles}`,
  `- Write allowed now: ${readiness.gates.writeAllowedNow}`,
  "",
  "## Folders",
  "",
  "| Root | PDFs | Unique hashes | Covered PDFs | Unmapped | Deletion readiness |",
  "| --- | ---: | ---: | ---: | ---: | --- |",
  ...readiness.folders.map((row) => `| ${row.rootPath} | ${row.physicalPdfFiles} | ${row.uniquePdfHashes} | ${row.contentCoveredPhysicalPdfFiles} | ${row.unmappedPhysicalPdfFiles} | ${row.deletionReadiness} |`),
  "",
  "## Caveat",
  "",
  readiness.caveat,
  "",
  "## Boundary",
  "",
  readiness.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  readinessStatus: readiness.readinessStatus,
  originalDesktopFoldersRequiredForVerify: readiness.originalDesktopFoldersRequiredForVerify,
  localOriginalFoldersMayBeRemovedFromDesktop: readiness.localOriginalFoldersMayBeRemovedFromDesktop,
  combinedPhysicalPdfFiles: readiness.absorptionProof.combinedPhysicalPdfFiles,
  contentCoveredPhysicalPdfFiles: readiness.absorptionProof.contentCoveredPhysicalPdfFiles,
  unmappedPhysicalPdfFiles: readiness.absorptionProof.unmappedPhysicalPdfFiles,
  writeAllowedNow: readiness.gates.writeAllowedNow,
}, null, 2));
