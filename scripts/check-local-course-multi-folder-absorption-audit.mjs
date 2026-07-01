import fs from "node:fs";

const auditPath = "docs/LOCAL_COURSE_MULTI_FOLDER_ABSORPTION_AUDIT.json";
const auditMdPath = "docs/LOCAL_COURSE_MULTI_FOLDER_ABSORPTION_AUDIT.md";

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
if (audit.auditStatus !== "multi_folder_absorption_audit_all_current_pdfs_content_covered_release_blocked") fail("unexpected auditStatus");
if (audit.auditMode !== "dual_local_folder_physical_pdf_to_existing_knowledge_document_hash_coverage") fail("unexpected auditMode");
if (audit.auditedRoots !== 2) fail("expected two audited roots");
if (audit.physicalPdfFiles !== 313) fail("expected 313 physical PDFs across both folders");
if (audit.uniquePdfHashes !== 298) fail("expected 298 unique hashes across both folders");
if (audit.duplicatePhysicalPdfFilesAcrossAudit !== 15) fail("expected 15 duplicate physical PDFs across audit");
if (audit.contentCoveredPhysicalPdfFiles !== 313) fail("all physical PDFs must be content covered");
if (audit.contentCoveredUniquePdfHashes !== 298) fail("all unique hashes must be content covered");
if (audit.unmappedPhysicalPdfFiles !== 0 || audit.unmappedUniquePdfHashes !== 0) fail("no uncovered PDFs allowed");
if (audit.documentMapUniquePdfFiles !== 298 || audit.documentMapMappedUniquePdfFiles !== 298) fail("document map totals drift");
if (audit.totalDocumentNodeMatches !== 2375) fail("document node match total drift");
if (
  audit.realHumanInputEntries !== 0 ||
  audit.learnerCitationApprovedRows !== 0 ||
  audit.learnerFacingReleaseReady !== false ||
  audit.writeAllowedNow !== false ||
  audit.manualAuthorizationRequired !== true
) {
  fail("audit must keep review/release/write gates locked");
}

if (!Array.isArray(audit.rootRows) || audit.rootRows.length !== 2) fail("rootRows drift");
const investment = audit.rootRows.find((row) => row.rootId === "investment_main");
const advanced = audit.rootRows.find((row) => row.rootId === "advanced_trading");
if (!investment || !advanced) fail("expected investment and advanced roots");
if (!/\\Desktop\\投资$/.test(investment.rootPath || "")) fail("investment root path drift");
if (!/\\Desktop\\交易进阶$/.test(advanced.rootPath || "")) fail("advanced root path drift");
if (
  investment.physicalPdfFiles !== 302 ||
  investment.uniquePdfHashes !== 298 ||
  investment.contentCoveredPhysicalPdfFiles !== 302 ||
  investment.contentCoveredUniquePdfHashes !== 298 ||
  investment.unmappedPhysicalPdfFiles !== 0
) {
  fail("investment root coverage drift");
}
if (
  advanced.physicalPdfFiles !== 11 ||
  advanced.uniquePdfHashes !== 11 ||
  advanced.contentCoveredPhysicalPdfFiles !== 11 ||
  advanced.contentCoveredUniquePdfHashes !== 11 ||
  advanced.unmappedPhysicalPdfFiles !== 0 ||
  advanced.duplicatePhysicalPdfFilesAcrossAudit !== 11
) {
  fail("advanced root coverage drift");
}
if (!audit.rootRows.every((row) =>
  row.sourceRootAvailable === true &&
  row.absorptionStatus === "all_pdfs_content_covered_by_current_knowledge_base" &&
  Array.isArray(row.sampleFiles) &&
  row.sampleFiles.length >= 1
)) {
  fail("root status rows drift");
}

if (!Array.isArray(audit.duplicateRows) || audit.duplicateRows.length !== 15) fail("duplicate rows drift");
if (audit.duplicateRows.filter((row) => row.rootId === "advanced_trading").length !== 11) fail("advanced duplicate coverage drift");
if (!Array.isArray(audit.uncoveredRows) || audit.uncoveredRows.length !== 0) fail("uncovered rows must be empty");
if (!Array.isArray(audit.coveredRows) || audit.coveredRows.length !== 313) fail("covered rows drift");
if (!audit.coveredRows.every((row) =>
  row.rootId &&
  row.relativePath &&
  row.fileName &&
  row.sha256 &&
  row.documentId &&
  row.sourceRelativePath &&
  row.matchedNodeCount >= 1 &&
  row.contentCoveredByKnowledgeBase === true
)) {
  fail("covered row identity drift");
}
if (!audit.coveredRows.some((row) => row.rootId === "advanced_trading" && row.fileName === "VWAP.pdf" && row.documentId)) {
  fail("advanced folder VWAP must be content covered");
}
if (!audit.coveredRows.some((row) => row.rootId === "advanced_trading" && /Fabio/.test(row.fileName || "") && row.documentId)) {
  fail("advanced folder Fabio PDF must be content covered");
}
if (!Array.isArray(audit.commands) || !audit.commands.some((command) => /check:local-course-multi-folder-absorption-audit/.test(command))) {
  fail("commands must include multi-folder check");
}

const boundaryText = `${audit.boundary || ""} ${audit.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "content coverage",
  "does not make private pdfs learner-facing citations",
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
  auditedRoots: audit.auditedRoots,
  physicalPdfFiles: audit.physicalPdfFiles,
  uniquePdfHashes: audit.uniquePdfHashes,
  contentCoveredPhysicalPdfFiles: audit.contentCoveredPhysicalPdfFiles,
  contentCoveredUniquePdfHashes: audit.contentCoveredUniquePdfHashes,
  unmappedPhysicalPdfFiles: audit.unmappedPhysicalPdfFiles,
  writeAllowedNow: audit.writeAllowedNow,
}, null, 2));
