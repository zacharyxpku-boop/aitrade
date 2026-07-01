import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const documentMapPath = "docs/LOCAL_COURSE_DOCUMENT_ABSORPTION_MAP.json";
const outputJsonPath = "docs/LOCAL_COURSE_MULTI_FOLDER_ABSORPTION_AUDIT.json";
const outputMdPath = "docs/LOCAL_COURSE_MULTI_FOLDER_ABSORPTION_AUDIT.md";

const folderRoots = [
  {
    rootId: "investment_main",
    role: "primary_absorption_root",
    path: "C:\\Users\\86136\\Desktop\\投资",
  },
  {
    rootId: "advanced_trading",
    role: "secondary_source_folder_content_coverage_check",
    path: "C:\\Users\\86136\\Desktop\\交易进阶",
  },
];

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function walkFiles(root) {
  const files = [];
  if (!fs.existsSync(root)) return files;
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(fullPath);
      else if (entry.isFile()) files.push(fullPath);
    }
  }
  return files.sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function rel(root, filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

const documentMap = readJson(documentMapPath);
if (documentMap.educationOnly !== true) fail("document map must keep educationOnly:true");
if (documentMap.productionReady !== false) fail("document map must keep productionReady:false");
if (documentMap.learnerFacingRelease !== false) fail("document map must keep learnerFacingRelease:false");
if (documentMap.approvalStatus !== "not_approved") fail("document map must remain not_approved");
if (documentMap.writeAllowedNow !== false) fail("document map must keep writeAllowedNow:false");

const docsBySha = new Map((documentMap.documentRows || []).map((row) => [String(row.sha256 || "").toLowerCase(), row]));
const allRows = [];

for (const rootConfig of folderRoots) {
  const files = walkFiles(rootConfig.path);
  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext !== ".pdf") continue;
    const hash = sha256(filePath).toLowerCase();
    const doc = docsBySha.get(hash) || null;
    allRows.push({
      rootId: rootConfig.rootId,
      rootRole: rootConfig.role,
      rootPath: rootConfig.path,
      relativePath: rel(rootConfig.path, filePath),
      fileName: path.basename(filePath),
      bytes: fs.statSync(filePath).size,
      sha256: hash,
      contentCoveredByKnowledgeBase: Boolean(doc),
      documentId: doc?.documentId || "",
      sourceRelativePath: doc?.sourceRelativePath || "",
      sourceModule: doc?.sourceModule || "",
      matchedNodeCount: doc?.matchedNodeCount || 0,
      extractionBucket: doc?.extractionBucket || "",
      learnerFacingRelease: false,
      writeAllowedNow: false,
    });
  }
}

const firstRowByHash = new Map();
for (const row of allRows) {
  if (!firstRowByHash.has(row.sha256)) firstRowByHash.set(row.sha256, row);
}

const duplicateRows = allRows
  .filter((row) => firstRowByHash.get(row.sha256) !== row)
  .map((row) => ({
    rootId: row.rootId,
    relativePath: row.relativePath,
    duplicateOfRootId: firstRowByHash.get(row.sha256).rootId,
    duplicateOfRelativePath: firstRowByHash.get(row.sha256).relativePath,
    sha256: row.sha256,
  }));

const rootRows = folderRoots.map((rootConfig) => {
  const rows = allRows.filter((row) => row.rootId === rootConfig.rootId);
  const uniqueHashes = new Set(rows.map((row) => row.sha256));
  const mappedHashes = new Set(rows.filter((row) => row.contentCoveredByKnowledgeBase).map((row) => row.sha256));
  const unmappedRows = rows.filter((row) => !row.contentCoveredByKnowledgeBase);
  return {
    rootId: rootConfig.rootId,
    rootRole: rootConfig.role,
    rootPath: rootConfig.path,
    sourceRootAvailable: fs.existsSync(rootConfig.path),
    physicalPdfFiles: rows.length,
    uniquePdfHashes: uniqueHashes.size,
    contentCoveredPhysicalPdfFiles: rows.filter((row) => row.contentCoveredByKnowledgeBase).length,
    contentCoveredUniquePdfHashes: mappedHashes.size,
    unmappedPhysicalPdfFiles: unmappedRows.length,
    unmappedUniquePdfHashes: new Set(unmappedRows.map((row) => row.sha256)).size,
    duplicatePhysicalPdfFilesAcrossAudit: rows.filter((row) => firstRowByHash.get(row.sha256) !== row).length,
    sampleFiles: rows.slice(0, 8).map((row) => row.relativePath),
    absorptionStatus: unmappedRows.length === 0
      ? "all_pdfs_content_covered_by_current_knowledge_base"
      : "has_pdfs_not_content_covered_by_current_knowledge_base",
  };
});

const uniqueHashes = new Set(allRows.map((row) => row.sha256));
const coveredUniqueHashes = new Set(allRows.filter((row) => row.contentCoveredByKnowledgeBase).map((row) => row.sha256));
const unmappedRows = allRows.filter((row) => !row.contentCoveredByKnowledgeBase);

const audit = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  auditStatus: unmappedRows.length === 0
    ? "multi_folder_absorption_audit_all_current_pdfs_content_covered_release_blocked"
    : "multi_folder_absorption_audit_has_uncovered_pdfs_release_blocked",
  auditMode: "dual_local_folder_physical_pdf_to_existing_knowledge_document_hash_coverage",
  auditedRoots: folderRoots.length,
  physicalPdfFiles: allRows.length,
  uniquePdfHashes: uniqueHashes.size,
  duplicatePhysicalPdfFilesAcrossAudit: duplicateRows.length,
  contentCoveredPhysicalPdfFiles: allRows.filter((row) => row.contentCoveredByKnowledgeBase).length,
  contentCoveredUniquePdfHashes: coveredUniqueHashes.size,
  unmappedPhysicalPdfFiles: unmappedRows.length,
  unmappedUniquePdfHashes: new Set(unmappedRows.map((row) => row.sha256)).size,
  primaryLedgerRoot: documentMap.sourceRoot,
  documentMapStatus: documentMap.auditStatus,
  documentMapUniquePdfFiles: documentMap.uniquePdfFiles,
  documentMapMappedUniquePdfFiles: documentMap.mappedUniquePdfFiles,
  totalDocumentNodeMatches: documentMap.totalDocumentNodeMatches,
  realHumanInputEntries: 0,
  learnerCitationApprovedRows: 0,
  learnerFacingReleaseReady: false,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  rootRows,
  duplicateRows,
  uncoveredRows: unmappedRows.map((row) => ({
    rootId: row.rootId,
    relativePath: row.relativePath,
    fileName: row.fileName,
    sha256: row.sha256,
    bytes: row.bytes,
  })),
  coveredRows: allRows.map((row) => ({
    rootId: row.rootId,
    relativePath: row.relativePath,
    fileName: row.fileName,
    sha256: row.sha256,
    documentId: row.documentId,
    sourceRelativePath: row.sourceRelativePath,
    matchedNodeCount: row.matchedNodeCount,
    extractionBucket: row.extractionBucket,
    contentCoveredByKnowledgeBase: row.contentCoveredByKnowledgeBase,
  })),
  commands: [
    "npm.cmd run build:local-course-multi-folder-absorption-audit",
    "npm.cmd run check:local-course-multi-folder-absorption-audit",
    "npm.cmd run check:local-course-folder-absorption-ledger",
    "npm.cmd run check:local-course-document-absorption-map",
    "npm.cmd run verify",
  ],
  completionRule: "This multi-folder absorption audit is complete when every current PDF in C:\\Users\\86136\\Desktop\\投资 and C:\\Users\\86136\\Desktop\\交易进阶 is hash-checked against the current local course document absorption map and every unique hash is covered by a mapped knowledge document. It does not approve learner-facing release or replace human review.",
  boundary: "Multi-folder absorption audit is reviewer-facing education-only operations material. It confirms content coverage for local private course PDFs only; it does not make private PDFs learner-facing citations, approve copied text, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course Multi-Folder Absorption Audit",
  "",
  `- Audit status: ${audit.auditStatus}`,
  `- Audited roots: ${audit.auditedRoots}`,
  `- Physical PDFs: ${audit.physicalPdfFiles}`,
  `- Unique PDF hashes: ${audit.uniquePdfHashes}`,
  `- Content-covered physical PDFs: ${audit.contentCoveredPhysicalPdfFiles}`,
  `- Content-covered unique hashes: ${audit.contentCoveredUniquePdfHashes}`,
  `- Uncovered physical PDFs: ${audit.unmappedPhysicalPdfFiles}`,
  `- Cross-audit duplicate physical PDFs: ${audit.duplicatePhysicalPdfFilesAcrossAudit}`,
  `- Write allowed now: ${audit.writeAllowedNow}`,
  "",
  "## Roots",
  "",
  "| Root | PDFs | Unique hashes | Covered PDFs | Covered unique | Uncovered | Status |",
  "| --- | ---: | ---: | ---: | ---: | ---: | --- |",
  ...audit.rootRows.map((row) => `| ${row.rootPath} | ${row.physicalPdfFiles} | ${row.uniquePdfHashes} | ${row.contentCoveredPhysicalPdfFiles} | ${row.contentCoveredUniquePdfHashes} | ${row.unmappedPhysicalPdfFiles} | ${row.absorptionStatus} |`),
  "",
  "## Boundary",
  "",
  audit.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  auditStatus: audit.auditStatus,
  auditedRoots: audit.auditedRoots,
  physicalPdfFiles: audit.physicalPdfFiles,
  uniquePdfHashes: audit.uniquePdfHashes,
  contentCoveredPhysicalPdfFiles: audit.contentCoveredPhysicalPdfFiles,
  contentCoveredUniquePdfHashes: audit.contentCoveredUniquePdfHashes,
  unmappedPhysicalPdfFiles: audit.unmappedPhysicalPdfFiles,
  duplicatePhysicalPdfFilesAcrossAudit: audit.duplicatePhysicalPdfFilesAcrossAudit,
  writeAllowedNow: audit.writeAllowedNow,
}, null, 2));
