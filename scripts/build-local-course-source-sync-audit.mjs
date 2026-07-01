import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const outputJson = "docs/LOCAL_COURSE_SOURCE_SYNC_AUDIT.json";
const outputMd = "docs/LOCAL_COURSE_SOURCE_SYNC_AUDIT.md";
const manifestPath = "docs/LOCAL_INVESTMENT_COURSE_SOURCE_MANIFEST.json";
const reportPath = "docs/LOCAL_INVESTMENT_COURSE_HARVEST_REPORT.json";
const corpusDir = "data/corpus";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function walkPdfs(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkPdfs(fullPath));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")) files.push(fullPath);
  }
  return files;
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function relativeCoursePath(root, filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

function sourceIdForHash(hash) {
  return `local-investment-course:${hash.slice(0, 24)}`;
}

const manifest = readJson(manifestPath);
const harvestReport = readJson(reportPath);
if (manifest.educationOnly !== true || harvestReport.educationOnly !== true) fail("source reports must keep educationOnly:true");
if (manifest.productionReady !== false || harvestReport.productionReady !== false) fail("source reports must keep productionReady:false");
if (!manifest.root || !fs.existsSync(manifest.root)) fail("manifest root missing or unavailable");

const currentFiles = walkPdfs(manifest.root)
  .map((filePath) => {
    const stat = fs.statSync(filePath);
    const hash = sha256(filePath);
    return {
      relativePath: relativeCoursePath(manifest.root, filePath),
      bytes: stat.size,
      sha256: hash,
      sourceId: sourceIdForHash(hash),
      lastModified: stat.mtime.toISOString(),
    };
  })
  .sort((left, right) => left.relativePath.localeCompare(right.relativePath, "zh-Hans-CN"));

const firstPathByHash = new Map();
const duplicateRows = [];
for (const file of currentFiles) {
  if (!firstPathByHash.has(file.sha256)) {
    firstPathByHash.set(file.sha256, file.relativePath);
  } else {
    duplicateRows.push({
      relativePath: file.relativePath,
      duplicateOf: firstPathByHash.get(file.sha256),
      sha256: file.sha256,
    });
  }
}

const currentUniqueHashes = new Set(currentFiles.map((file) => file.sha256));
const manifestFiles = manifest.files || [];
const manifestByRelativePath = new Map(manifestFiles.map((file) => [file.relativePath, file]));
const currentByRelativePath = new Map(currentFiles.map((file) => [file.relativePath, file]));
const manifestHashes = new Set(manifestFiles.map((file) => file.sha256));

const missingFromManifest = currentFiles.filter((file) => {
  const row = manifestByRelativePath.get(file.relativePath);
  return !row || row.sha256 !== file.sha256;
});
const staleManifestFiles = manifestFiles.filter((file) => {
  const row = currentByRelativePath.get(file.relativePath);
  return !row || row.sha256 !== file.sha256;
});

const corpusDocs = fs.readdirSync(corpusDir)
  .filter((file) => /^corpus_\d+\.json$/.test(file))
  .map((file) => {
    try {
      return JSON.parse(fs.readFileSync(path.join(corpusDir, file), "utf8"));
    } catch {
      return null;
    }
  })
  .filter((doc) => doc?.tier === "local_private_course");
const corpusBySourceId = new Map(corpusDocs.map((doc) => [doc.sourceId, doc]));

const uniqueCurrentFiles = currentFiles.filter((file) => firstPathByHash.get(file.sha256) === file.relativePath);
const missingFromCorpus = uniqueCurrentFiles.filter((file) => !corpusBySourceId.has(file.sourceId));
const corpusDocsForCurrentHashes = uniqueCurrentFiles
  .map((file) => corpusBySourceId.get(file.sourceId))
  .filter(Boolean);
const corpusDocsMissingSourceFile = corpusDocs.filter((doc) => doc.sourceLocalPath && !fs.existsSync(doc.sourceLocalPath));
const learnerFacingAllowedDocs = corpusDocsForCurrentHashes.filter((doc) => doc.learnerFacingAllowed !== false);
const productionReadyDocs = corpusDocsForCurrentHashes.filter((doc) => doc.productionReady !== false);

const syncStatus = missingFromManifest.length === 0 &&
  staleManifestFiles.length === 0 &&
  missingFromCorpus.length === 0 &&
  corpusDocsMissingSourceFile.length === 0 &&
  learnerFacingAllowedDocs.length === 0 &&
  productionReadyDocs.length === 0
  ? "source_folder_synced_to_private_research_corpus_release_blocked"
  : "source_folder_sync_attention_required";

const audit = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  syncStatus,
  syncMode: "current_folder_to_manifest_and_private_corpus_hash_audit",
  sourceRoot: manifest.root,
  sourceRootAvailable: true,
  currentPdfFiles: currentFiles.length,
  currentUniquePdfHashes: currentUniqueHashes.size,
  currentDuplicatePdfFiles: duplicateRows.length,
  manifestPdfFiles: manifestFiles.length,
  manifestUniquePdfFiles: manifestHashes.size,
  harvestReportTotalPdfFiles: harvestReport.totalPdfFiles,
  harvestReportUniquePdfFiles: harvestReport.uniquePdfFiles,
  localPrivateCourseCorpusDocs: corpusDocs.length,
  corpusDocsForCurrentUniqueHashes: corpusDocsForCurrentHashes.length,
  missingCurrentFilesFromManifest: missingFromManifest.length,
  staleManifestFiles: staleManifestFiles.length,
  missingCurrentUniqueHashesFromCorpus: missingFromCorpus.length,
  corpusDocsMissingSourceFile: corpusDocsMissingSourceFile.length,
  learnerFacingAllowedDocs: learnerFacingAllowedDocs.length,
  productionReadyDocs: productionReadyDocs.length,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  duplicateRows: duplicateRows.slice(0, 20),
  missingFromManifest: missingFromManifest.slice(0, 20),
  staleManifestFileRows: staleManifestFiles.slice(0, 20),
  missingFromCorpus: missingFromCorpus.slice(0, 20).map((file) => ({
    relativePath: file.relativePath,
    sourceId: file.sourceId,
    sha256: file.sha256,
  })),
  corpusDocSamples: corpusDocsForCurrentHashes.slice(0, 12).map((doc) => ({
    id: doc.id,
    sourceId: doc.sourceId,
    sourceRelativePath: doc.sourceRelativePath,
    charCount: doc.charCount,
    textExtraction: doc.textExtraction,
    learnerFacingAllowed: doc.learnerFacingAllowed,
  })),
  commands: [
    "npm.cmd run check:local-course-source-sync-audit",
    "npm.cmd run check:local-investment-course",
    "npm.cmd run check:local-course-coverage",
    "npm.cmd run check:local-course-module-review-dossier",
  ],
  completionRule: "This sync audit proves the current local source folder is represented in the private research corpus by hash. It does not approve learner-facing release, does not fill reviewer notes, and does not authorize writes.",
  boundary: "Local course source sync audit is reviewer-facing education-only governance. Current PDFs remain private internal research sources; this audit does not make private PDFs public citations, approve learner-facing lessons, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Local Course Source Sync Audit",
  "",
  `- Sync status: ${audit.syncStatus}`,
  `- Source root: ${audit.sourceRoot}`,
  `- Current PDFs: ${audit.currentPdfFiles}`,
  `- Current unique hashes: ${audit.currentUniquePdfHashes}`,
  `- Current duplicates: ${audit.currentDuplicatePdfFiles}`,
  `- Manifest PDFs: ${audit.manifestPdfFiles}`,
  `- Corpus docs for current unique hashes: ${audit.corpusDocsForCurrentUniqueHashes}`,
  `- Missing from manifest: ${audit.missingCurrentFilesFromManifest}`,
  `- Missing from corpus: ${audit.missingCurrentUniqueHashesFromCorpus}`,
  `- Write allowed now: ${audit.writeAllowedNow}`,
  "",
  "## Duplicate Rows",
  "",
  ...audit.duplicateRows.map((row) => `- ${row.relativePath} -> duplicate of ${row.duplicateOf}`),
  "",
  "## Boundary",
  "",
  audit.boundary,
  "",
].join("\n"), "utf8");

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
  missingCurrentFilesFromManifest: audit.missingCurrentFilesFromManifest,
  missingCurrentUniqueHashesFromCorpus: audit.missingCurrentUniqueHashesFromCorpus,
  writeAllowedNow: audit.writeAllowedNow,
  outputJson,
  outputMd,
}, null, 2));
