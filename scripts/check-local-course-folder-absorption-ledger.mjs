import fs from "node:fs";

const ledgerPath = "docs/LOCAL_COURSE_FOLDER_ABSORPTION_LEDGER.json";
const ledgerMdPath = "docs/LOCAL_COURSE_FOLDER_ABSORPTION_LEDGER.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const ledger = readJson(ledgerPath);
if (!fs.existsSync(ledgerMdPath)) fail(`missing ${ledgerMdPath}`);

if (ledger.educationOnly !== true) fail("ledger must keep educationOnly:true");
if (ledger.productionReady !== false) fail("ledger must keep productionReady:false");
if (ledger.learnerFacingRelease !== false) fail("ledger must keep learnerFacingRelease:false");
if (ledger.approvalStatus !== "not_approved") fail("ledger must remain not_approved");
if (ledger.ledgerStatus !== "folder_absorption_ledger_all_current_pdfs_accounted_release_blocked") {
  fail(`unexpected ledgerStatus: ${ledger.ledgerStatus}`);
}
if (ledger.ledgerMode !== "physical_folder_to_manifest_corpus_node_absorption_ledger") fail("unexpected ledgerMode");
if (!/\\Desktop\\投资$/.test(ledger.sourceRoot || "")) fail("sourceRoot must point to Desktop investment folder");
if (ledger.sourceRootAvailable !== true) fail("sourceRoot must be available");
if (ledger.physicalFiles !== 302) fail(`expected 302 physical files, got ${ledger.physicalFiles}`);
if (ledger.physicalPdfFiles !== 302) fail("all physical files should currently be PDFs");
if (ledger.nonPdfFiles !== 0) fail("non-PDF count should be 0 for the current source folder");
if (ledger.directories !== 19) fail(`expected 19 directory buckets including root, got ${ledger.directories}`);
if (ledger.uniquePdfHashes !== 298) fail("expected 298 unique PDF hashes");
if (ledger.duplicatePdfFiles !== 4) fail("expected 4 duplicate PDF files");
if (ledger.manifestPdfFiles !== 302 || ledger.manifestUniquePdfFiles !== 298) fail("manifest counts drift");
if (ledger.corpusDocsForCurrentUniqueHashes !== 298) fail("all unique hashes must have private corpus docs");
if (ledger.mappedUniquePdfFiles !== 298 || ledger.unmappedUniquePdfFiles !== 0) fail("all unique PDFs must map to knowledge nodes");
if (ledger.totalDocumentNodeMatches !== 2375) fail("document-node match count drift");
if (ledger.matchedKnowledgeNodes !== 360 || ledger.readyForRewriteReviewNodes !== 360) fail("knowledge node coverage drift");
if (ledger.publicReferenceReadyModules !== 12 || ledger.modules !== 12) fail("public reference module readiness drift");
if (ledger.learnerFacingAllowedDocs !== 0 || ledger.productionReadyDocs !== 0) fail("private docs must not be learner-facing or production-ready");
if (ledger.writeAllowedNow !== false || ledger.manualAuthorizationRequired !== true) fail("write gate must remain locked");

if (!Array.isArray(ledger.extensionRows) || ledger.extensionRows.length !== 1) fail("expected exactly one extension row");
if (
  ledger.extensionRows[0].extension !== ".pdf" ||
  ledger.extensionRows[0].files !== 302 ||
  ledger.extensionRows[0].uniqueHashes !== 298 ||
  ledger.extensionRows[0].absorptionStatus !== "covered_by_pdf_private_research_pipeline"
) {
  fail("extension row does not prove PDF-only coverage");
}

if (!Array.isArray(ledger.directoryRows) || ledger.directoryRows.length !== 19) fail("expected 19 directory rows");
if (ledger.directoryRows.reduce((sum, row) => sum + row.physicalFiles, 0) !== 302) fail("directory files must sum to 302");
if (ledger.directoryRows.reduce((sum, row) => sum + row.unmappedUniqueFiles, 0) !== 0) fail("directory unmapped unique files must sum to 0");
if (!ledger.directoryRows.every((row) =>
  row.physicalFiles > 0 &&
  row.uniqueHashes > 0 &&
  row.mappedUniqueFiles + row.unmappedUniqueFiles === row.uniqueHashes &&
  row.absorptionStatus === "all_unique_files_mapped_private_research_only" &&
  Array.isArray(row.sampleFiles) &&
  row.sampleFiles.length > 0
)) {
  fail("directory row coverage drift");
}

if (!Array.isArray(ledger.duplicateRows) || ledger.duplicateRows.length !== 4) fail("expected 4 duplicate rows");
if (!ledger.duplicateRows.every((row) => row.relativePath && row.duplicateOf && row.sha256)) fail("duplicate rows missing identity");
if (!Array.isArray(ledger.unmappedUniqueRows) || ledger.unmappedUniqueRows.length !== 0) fail("unmapped unique rows must be empty");
if (!Array.isArray(ledger.extractionAttentionRows)) fail("extraction attention rows must be present");
if (ledger.extractionAttentionRows.length !== Math.min(20, ledger.lowOrThinExtractionMappedDocs || 0)) {
  fail("extraction attention sample count drift");
}
if (!Array.isArray(ledger.topPhysicalFiles) || ledger.topPhysicalFiles.length !== 20) fail("expected top 20 physical files");
if (!ledger.topPhysicalFiles.every((row) => row.relativePath && row.mb > 0 && row.mappedToCorpus === true)) {
  fail("top physical file rows must be mapped to corpus");
}
if (!Array.isArray(ledger.commands) || !ledger.commands.some((command) => /check:local-course-folder-absorption-ledger/.test(command))) {
  fail("ledger commands must include its check command");
}

const boundaryText = `${ledger.boundary || ""} ${ledger.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "private research layer",
  "does not make private pdfs learner-facing citations",
  "approve lessons",
  "generate reviewer notes",
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
  ledgerStatus: ledger.ledgerStatus,
  physicalFiles: ledger.physicalFiles,
  physicalPdfFiles: ledger.physicalPdfFiles,
  nonPdfFiles: ledger.nonPdfFiles,
  uniquePdfHashes: ledger.uniquePdfHashes,
  duplicatePdfFiles: ledger.duplicatePdfFiles,
  mappedUniquePdfFiles: ledger.mappedUniquePdfFiles,
  unmappedUniquePdfFiles: ledger.unmappedUniquePdfFiles,
  totalDocumentNodeMatches: ledger.totalDocumentNodeMatches,
  writeAllowedNow: ledger.writeAllowedNow,
}, null, 2));
