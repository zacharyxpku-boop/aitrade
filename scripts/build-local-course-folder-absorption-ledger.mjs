import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const sourceSyncPath = "docs/LOCAL_COURSE_SOURCE_SYNC_AUDIT.json";
const documentMapPath = "docs/LOCAL_COURSE_DOCUMENT_ABSORPTION_MAP.json";
const readinessPath = "docs/LOCAL_COURSE_ABSORPTION_READINESS_AUDIT.json";
const manifestPath = "docs/LOCAL_INVESTMENT_COURSE_SOURCE_MANIFEST.json";
const outputJsonPath = "docs/LOCAL_COURSE_FOLDER_ABSORPTION_LEDGER.json";
const outputMdPath = "docs/LOCAL_COURSE_FOLDER_ABSORPTION_LEDGER.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(name, artifact) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${name} must remain not_approved`);
}

function assertSourceManifestBoundary(name, artifact) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
}

function walkFiles(dir) {
  const rows = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) rows.push(...walkFiles(fullPath));
    else if (entry.isFile()) rows.push(fullPath);
  }
  return rows;
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function sourceIdForHash(hash) {
  return `local-investment-course:${hash.slice(0, 24)}`;
}

function rel(root, filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

function directoryOf(relativePath) {
  const dir = path.dirname(relativePath).replace(/\\/g, "/");
  return dir === "." ? "根目录PDF" : dir;
}

function groupBy(rows, keyFn) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return groups;
}

const sourceSync = readJson(sourceSyncPath);
const documentMap = readJson(documentMapPath);
const readiness = readJson(readinessPath);
const manifest = readJson(manifestPath);

for (const [name, artifact] of Object.entries({ sourceSync, documentMap, readiness })) {
  assertBoundary(name, artifact);
}
assertSourceManifestBoundary("manifest", manifest);

if (!manifest.root || !fs.existsSync(manifest.root)) fail("manifest root missing or unavailable");
if (sourceSync.syncStatus !== "source_folder_synced_to_private_research_corpus_release_blocked") {
  fail("source sync must be clean before folder ledger");
}
if (documentMap.auditStatus !== "all_unique_pdfs_mapped_to_knowledge_nodes_release_blocked") {
  fail("document absorption map must be clean before folder ledger");
}

const allFiles = walkFiles(manifest.root).sort((left, right) => rel(manifest.root, left).localeCompare(rel(manifest.root, right), "zh-Hans-CN"));
const physicalRows = allFiles.map((filePath) => {
  const stat = fs.statSync(filePath);
  const extension = path.extname(filePath).toLowerCase() || "(none)";
  const relativePath = rel(manifest.root, filePath);
  const hash = sha256(filePath);
  return {
    relativePath,
    directory: directoryOf(relativePath),
    extension,
    bytes: stat.size,
    mb: Number((stat.size / 1024 / 1024).toFixed(3)),
    sha256: hash,
    sourceId: sourceIdForHash(hash),
    lastModified: stat.mtime.toISOString(),
  };
});

const firstPathByHash = new Map();
for (const row of physicalRows) {
  if (!firstPathByHash.has(row.sha256)) firstPathByHash.set(row.sha256, row.relativePath);
}

const uniquePhysicalRows = physicalRows.filter((row) => firstPathByHash.get(row.sha256) === row.relativePath);
const duplicateRows = physicalRows
  .filter((row) => firstPathByHash.get(row.sha256) !== row.relativePath)
  .map((row) => ({
    relativePath: row.relativePath,
    duplicateOf: firstPathByHash.get(row.sha256),
    sha256: row.sha256,
    bytes: row.bytes,
  }));

const docsBySha = new Map((documentMap.documentRows || []).map((row) => [row.sha256, row]));
const mappedUniqueRows = uniquePhysicalRows.filter((row) => docsBySha.has(row.sha256));
const unmappedUniqueRows = uniquePhysicalRows.filter((row) => !docsBySha.has(row.sha256));
const lowOrThinRows = mappedUniqueRows
  .map((row) => ({ ...row, document: docsBySha.get(row.sha256) }))
  .filter((row) => row.document?.extractionBucket !== "usable_private_research_text");

const extensionRows = [...groupBy(physicalRows, (row) => row.extension).entries()]
  .map(([extension, rows]) => ({
    extension,
    files: rows.length,
    uniqueHashes: new Set(rows.map((row) => row.sha256)).size,
    totalMb: Number((rows.reduce((sum, row) => sum + row.bytes, 0) / 1024 / 1024).toFixed(2)),
    absorptionStatus: extension === ".pdf" ? "covered_by_pdf_private_research_pipeline" : "not_supported_by_current_pipeline",
  }))
  .sort((left, right) => right.files - left.files || left.extension.localeCompare(right.extension));

const directoryRows = [...groupBy(physicalRows, (row) => row.directory).entries()]
  .map(([directory, rows]) => {
    const uniqueHashes = new Set(rows.map((row) => row.sha256));
    const representativeRowsByHash = new Map();
    for (const row of rows) {
      if (!representativeRowsByHash.has(row.sha256)) representativeRowsByHash.set(row.sha256, row);
    }
    const uniqueRows = [...representativeRowsByHash.values()];
    const mappedRows = uniqueRows.filter((row) => docsBySha.has(row.sha256));
    const lowRows = mappedRows.filter((row) => docsBySha.get(row.sha256)?.extractionBucket !== "usable_private_research_text");
    const moduleMatches = new Set();
    let nodeMatches = 0;
    for (const row of mappedRows) {
      const doc = docsBySha.get(row.sha256);
      nodeMatches += doc?.matchedNodeCount || 0;
      for (const module of doc?.matchedModules || []) moduleMatches.add(module);
    }
    return {
      directory,
      physicalFiles: rows.length,
      uniqueHashes: uniqueHashes.size,
      duplicateFiles: rows.length - uniqueHashes.size,
      mappedUniqueFiles: mappedRows.length,
      unmappedUniqueFiles: uniqueRows.length - mappedRows.length,
      lowOrThinExtractionFiles: lowRows.length,
      totalMb: Number((rows.reduce((sum, row) => sum + row.bytes, 0) / 1024 / 1024).toFixed(2)),
      matchedModules: [...moduleMatches].sort((left, right) => left.localeCompare(right, "zh-Hans-CN")).slice(0, 10),
      nodeMatches,
      absorptionStatus: uniqueRows.length === mappedRows.length
        ? "all_unique_files_mapped_private_research_only"
        : "unmapped_unique_files_need_attention",
      nextGate: lowRows.length > 0
        ? "manual_transcription_or_source_replacement_for_low_extraction_rows"
        : "reviewer_distillation_and_public_grounding_before_any_learner_facing_use",
      sampleFiles: rows.slice(0, 5).map((row) => row.relativePath),
    };
  })
  .sort((left, right) => right.physicalFiles - left.physicalFiles || left.directory.localeCompare(right.directory, "zh-Hans-CN"));

const topPhysicalFiles = [...physicalRows]
  .sort((left, right) => right.bytes - left.bytes)
  .slice(0, 20)
  .map((row) => ({
    relativePath: row.relativePath,
    mb: row.mb,
    directory: row.directory,
    mappedToCorpus: docsBySha.has(row.sha256),
    duplicateOf: firstPathByHash.get(row.sha256) === row.relativePath ? "" : firstPathByHash.get(row.sha256),
  }));

const ledgerStatus = allFiles.length === sourceSync.currentPdfFiles &&
  extensionRows.length === 1 &&
  extensionRows[0]?.extension === ".pdf" &&
  uniquePhysicalRows.length === sourceSync.currentUniquePdfHashes &&
  duplicateRows.length === sourceSync.currentDuplicatePdfFiles &&
  mappedUniqueRows.length === documentMap.mappedUniquePdfFiles &&
  unmappedUniqueRows.length === 0 &&
  sourceSync.missingCurrentFilesFromManifest === 0 &&
  sourceSync.missingCurrentUniqueHashesFromCorpus === 0 &&
  documentMap.learnerFacingAllowedDocs === 0 &&
  documentMap.productionReadyDocs === 0
  ? "folder_absorption_ledger_all_current_pdfs_accounted_release_blocked"
  : "folder_absorption_ledger_attention_required";

const ledger = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  ledgerStatus,
  ledgerMode: "physical_folder_to_manifest_corpus_node_absorption_ledger",
  sourceRoot: manifest.root,
  sourceRootAvailable: true,
  physicalFiles: physicalRows.length,
  physicalPdfFiles: physicalRows.filter((row) => row.extension === ".pdf").length,
  nonPdfFiles: physicalRows.filter((row) => row.extension !== ".pdf").length,
  totalMb: Number((physicalRows.reduce((sum, row) => sum + row.bytes, 0) / 1024 / 1024).toFixed(2)),
  directories: directoryRows.length,
  uniquePdfHashes: uniquePhysicalRows.length,
  duplicatePdfFiles: duplicateRows.length,
  manifestPdfFiles: sourceSync.manifestPdfFiles,
  manifestUniquePdfFiles: sourceSync.manifestUniquePdfFiles,
  corpusDocsForCurrentUniqueHashes: sourceSync.corpusDocsForCurrentUniqueHashes,
  mappedUniquePdfFiles: mappedUniqueRows.length,
  unmappedUniquePdfFiles: unmappedUniqueRows.length,
  totalDocumentNodeMatches: documentMap.totalDocumentNodeMatches,
  matchedKnowledgeNodes: readiness.matchedKnowledgeNodes,
  readyForRewriteReviewNodes: readiness.readyForRewriteReviewNodes,
  lowOrThinExtractionMappedDocs: documentMap.lowOrThinExtractionMappedDocs,
  lowExtractionDocs: documentMap.lowExtractionDocs,
  manualTranscriptionPages: documentMap.manualTranscriptionPages,
  sourceReplacementCandidates: documentMap.sourceReplacementCandidates,
  publicReferenceReadyModules: readiness.publicReferenceReadyModules,
  modules: readiness.modules,
  learnerFacingAllowedDocs: documentMap.learnerFacingAllowedDocs,
  productionReadyDocs: documentMap.productionReadyDocs,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  extensionRows,
  directoryRows,
  duplicateRows,
  unmappedUniqueRows: unmappedUniqueRows.map((row) => ({
    relativePath: row.relativePath,
    sha256: row.sha256,
    sourceId: row.sourceId,
  })),
  extractionAttentionRows: lowOrThinRows.slice(0, 20).map((row) => ({
    relativePath: row.relativePath,
    documentId: row.document.documentId,
    extractionBucket: row.document.extractionBucket,
    charCount: row.document.charCount,
    textExtraction: row.document.textExtraction,
    nextGate: row.document.nextGate,
  })),
  topPhysicalFiles,
  commands: [
    "npm.cmd run build:local-course-folder-absorption-ledger",
    "npm.cmd run check:local-course-folder-absorption-ledger",
    "npm.cmd run check:local-course-source-sync-audit",
    "npm.cmd run check:local-course-document-absorption-map",
  ],
  completionRule: "This ledger is complete when every current file in the local investment course folder is accounted for by extension, duplicate hash, manifest row, private corpus document, and knowledge-node mapping. It does not approve learner-facing release or replace human review.",
  boundary: "Local course folder absorption ledger for reviewer-facing education-only governance. It proves current private PDFs are accounted for in the private research layer, but it does not make private PDFs learner-facing citations, approve lessons, generate reviewer notes, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(ledger, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course Folder Absorption Ledger",
  "",
  `- Ledger status: ${ledger.ledgerStatus}`,
  `- Source root: ${ledger.sourceRoot}`,
  `- Physical files: ${ledger.physicalFiles}`,
  `- PDFs: ${ledger.physicalPdfFiles}`,
  `- Non-PDF files: ${ledger.nonPdfFiles}`,
  `- Unique PDF hashes: ${ledger.uniquePdfHashes}`,
  `- Duplicate PDF files: ${ledger.duplicatePdfFiles}`,
  `- Corpus docs for current unique hashes: ${ledger.corpusDocsForCurrentUniqueHashes}`,
  `- Mapped unique PDFs: ${ledger.mappedUniquePdfFiles}/${ledger.uniquePdfHashes}`,
  `- Node matches: ${ledger.totalDocumentNodeMatches}`,
  `- Write allowed now: ${ledger.writeAllowedNow}`,
  "",
  "## Directory Rows",
  "",
  "| Directory | Files | Unique | Mapped | Low/thin | Node matches | Status |",
  "| --- | ---: | ---: | ---: | ---: | ---: | --- |",
  ...ledger.directoryRows.map((row) => `| ${row.directory} | ${row.physicalFiles} | ${row.uniqueHashes} | ${row.mappedUniqueFiles} | ${row.lowOrThinExtractionFiles} | ${row.nodeMatches} | ${row.absorptionStatus} |`),
  "",
  "## Duplicate Rows",
  "",
  ...ledger.duplicateRows.map((row) => `- ${row.relativePath} -> duplicate of ${row.duplicateOf}`),
  "",
  "## Boundary",
  "",
  ledger.boundary,
  "",
].join("\n"), "utf8");

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
