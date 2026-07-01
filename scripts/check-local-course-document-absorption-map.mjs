import fs from "node:fs";

const auditPath = "docs/LOCAL_COURSE_DOCUMENT_ABSORPTION_MAP.json";
const auditMdPath = "docs/LOCAL_COURSE_DOCUMENT_ABSORPTION_MAP.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const audit = readJson(auditPath);
if (!fs.existsSync(auditMdPath)) fail(`missing ${auditMdPath}`);

if (audit.educationOnly !== true) fail("document absorption map must keep educationOnly:true");
if (audit.productionReady !== false) fail("document absorption map must keep productionReady:false");
if (audit.learnerFacingRelease !== false) fail("document absorption map must keep learnerFacingRelease:false");
if (audit.approvalStatus !== "not_approved") fail("document absorption map must remain not_approved");
if (audit.auditStatus !== "all_unique_pdfs_mapped_to_knowledge_nodes_release_blocked") {
  fail(`unexpected auditStatus: ${audit.auditStatus}`);
}
if (audit.auditMode !== "reverse_pdf_to_knowledge_node_absorption_map") fail("unexpected auditMode");
if (audit.physicalPdfFiles !== 302) fail(`expected 302 physical PDFs, got ${audit.physicalPdfFiles}`);
if (audit.duplicatePdfFiles !== 4) fail(`expected 4 duplicate PDFs, got ${audit.duplicatePdfFiles}`);
if (audit.uniquePdfFiles !== 298) fail(`expected 298 unique PDFs, got ${audit.uniquePdfFiles}`);
if (audit.localPrivateCourseCorpusDocs !== 298) fail("expected 298 local private corpus docs for current hashes");
if (audit.mappedUniquePdfFiles !== 298) fail(`expected all 298 unique PDFs mapped, got ${audit.mappedUniquePdfFiles}`);
if (audit.unmappedUniquePdfFiles !== 0) fail("unique PDFs must not be unmapped");
if (audit.totalDocumentNodeMatches < 360) fail("document-node matches too small");
if (audit.maxNodeMatchesPerDocument < 1) fail("max document-node matches missing");
if (audit.lowOrThinExtractionMappedDocs < 1) fail("expected low/thin extraction mapped docs to remain visible");
if (audit.lowExtractionDocs !== 5) fail("low extraction docs drifted");
if (audit.manualTranscriptionPages !== 19) fail("manual transcription page count drifted");
if (audit.sourceReplacementCandidates !== 3) fail("source replacement candidate count drifted");
if (audit.learnerFacingAllowedDocs !== 0) fail("private PDF docs must not be learner-facing allowed");
if (audit.productionReadyDocs !== 0) fail("private PDF docs must not be production-ready");
if (audit.writeAllowedNow !== false) fail("document absorption map must not allow writes");
if (audit.manualAuthorizationRequired !== true) fail("manual authorization must be required");

if (!Array.isArray(audit.documentRows) || audit.documentRows.length !== 298) fail("documentRows must contain 298 unique PDFs");
for (const row of audit.documentRows) {
  if (!row.documentId || !row.sourceId || !row.sourceRelativePath || !row.sha256) fail("document row missing identity fields");
  if (row.sha256.length !== 64) fail(`${row.documentId} sha256 must be full hash`);
  if (row.matchedNodeCount < 1) fail(`${row.documentId} is not mapped to any knowledge node`);
  if (!Array.isArray(row.matchedModules) || row.matchedModules.length < 1) fail(`${row.documentId} missing matched modules`);
  if (!Array.isArray(row.topNodeMatches) || row.topNodeMatches.length < 1) fail(`${row.documentId} missing top node matches`);
  if (row.learnerFacingAllowed !== false) fail(`${row.documentId} must not be learner-facing allowed`);
  if (row.productionReady !== false) fail(`${row.documentId} must not be production-ready`);
  if (!/private_research|extraction_review/.test(row.absorptionStatus || "")) fail(`${row.documentId} absorption status missing private/review boundary`);
}

if (!Array.isArray(audit.unmappedRows) || audit.unmappedRows.length !== 0) fail("unmappedRows must be empty");
if (!Array.isArray(audit.moduleRows) || audit.moduleRows.length < 4) fail("moduleRows too small");
if (!audit.moduleRows.every((row) => row.documents > 0 && row.nodeMatches > 0)) fail("every module row must have docs and node matches");
if (!Array.isArray(audit.extractionAttentionRows) || audit.extractionAttentionRows.length < 1) fail("extraction attention rows must be visible");
if (!Array.isArray(audit.topMappedDocumentRows) || audit.topMappedDocumentRows.length < 10) fail("top mapped rows too small");
if (!Array.isArray(audit.commands) || !audit.commands.some((item) => item.includes("check:local-course-document-absorption-map"))) {
  fail("commands missing document absorption check");
}

const boundaryText = `${audit.boundary || ""} ${audit.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "does not make private pdfs public citations",
  "reviewer distillation",
  "public grounding",
  "source-fit review",
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
  uniquePdfFiles: audit.uniquePdfFiles,
  mappedUniquePdfFiles: audit.mappedUniquePdfFiles,
  unmappedUniquePdfFiles: audit.unmappedUniquePdfFiles,
  totalDocumentNodeMatches: audit.totalDocumentNodeMatches,
  lowOrThinExtractionMappedDocs: audit.lowOrThinExtractionMappedDocs,
  writeAllowedNow: audit.writeAllowedNow,
}, null, 2));
