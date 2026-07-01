import fs from "node:fs";
import path from "node:path";

const manifestPath = "docs/LOCAL_INVESTMENT_COURSE_SOURCE_MANIFEST.json";
const reportPath = "docs/LOCAL_INVESTMENT_COURSE_HARVEST_REPORT.json";
const corpusDir = "data/corpus";
const outputJsonPath = "docs/LOCAL_COURSE_SOURCE_QUALITY_AUDIT.json";
const outputMdPath = "docs/LOCAL_COURSE_SOURCE_QUALITY_AUDIT.md";

const forbiddenTerms = [
  "推荐买入",
  "推荐卖出",
  "保证收益",
  "胜率承诺",
  "实盘信号",
  "自动下单",
  "接入券商",
  "真实资金建议",
];

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function walkFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function extensionOf(file) {
  return (path.extname(file).toLowerCase() || "[no extension]");
}

const manifest = readJson(manifestPath);
const report = readJson(reportPath);
if (manifest.educationOnly !== true || report.educationOnly !== true) fail("local course manifest/report must be education-only");
if (manifest.productionReady !== false || report.productionReady !== false) fail("local course manifest/report productionReady drift");
if (!manifest.root || !fs.existsSync(manifest.root)) fail("local course root missing");

const folderFiles = walkFiles(manifest.root);
const extensionCounts = folderFiles.reduce((counts, file) => {
  const ext = extensionOf(file);
  counts[ext] = (counts[ext] || 0) + 1;
  return counts;
}, {});

const corpusDocs = fs.readdirSync(corpusDir)
  .filter((file) => /^corpus_\d+\.json$/.test(file))
  .map((file) => readJson(path.join(corpusDir, file)))
  .filter((doc) => doc.tier === "local_private_course");
const corpusBySourceId = new Map(corpusDocs.map((doc) => [doc.sourceId, doc]));
const uniqueManifestFiles = (manifest.files || []).filter((file) => !file.duplicateOf);
const duplicateFiles = (manifest.files || []).filter((file) => file.duplicateOf);
const missingUniqueFiles = uniqueManifestFiles.filter((file) => !corpusBySourceId.has(file.sourceId));
const importedUniqueFiles = uniqueManifestFiles.filter((file) => corpusBySourceId.has(file.sourceId));

const extractionCounts = {};
const lowExtractionDocs = [];
const forbiddenDocs = [];
for (const doc of corpusDocs) {
  const extraction = doc.textExtraction || "unknown";
  extractionCounts[extraction] = (extractionCounts[extraction] || 0) + 1;
  if ((doc.charCount || 0) < 500 || extraction !== "full") {
    lowExtractionDocs.push({
      id: doc.id,
      sourceId: doc.sourceId,
      sourceRelativePath: doc.sourceRelativePath,
      sourceModule: doc.sourceModule,
      charCount: doc.charCount || 0,
      textExtraction: extraction,
      reviewerGate: "manual_ocr_or_visual_review_required_before_lesson_use",
    });
  }
  const hits = forbiddenTerms.filter((term) => String(doc.text || "").includes(term));
  if (hits.length) {
    forbiddenDocs.push({
      id: doc.id,
      sourceId: doc.sourceId,
      sourceRelativePath: doc.sourceRelativePath,
      sourceModule: doc.sourceModule,
      forbiddenHits: hits,
      reviewerGate: "keep_reviewer_only_and_rewrite_without_actionable_trading_language",
    });
  }
}

lowExtractionDocs.sort((left, right) => (left.charCount - right.charCount) || left.sourceRelativePath.localeCompare(right.sourceRelativePath, "zh-Hans-CN"));

const audit = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  sourceRoot: manifest.root,
  folderFiles: folderFiles.length,
  extensionCounts,
  pdfOnlyFolder: Object.keys(extensionCounts).length === 1 && extensionCounts[".pdf"] === folderFiles.length,
  manifestPdfFiles: manifest.totalPdfFiles || manifest.files?.length || 0,
  uniquePdfFiles: uniqueManifestFiles.length,
  duplicatePdfFiles: duplicateFiles.length,
  importedUniquePdfFiles: importedUniqueFiles.length,
  missingUniquePdfFiles: missingUniqueFiles.length,
  localPrivateCourseCorpusDocs: corpusDocs.length,
  extractionCounts,
  fullExtractionDocs: extractionCounts.full || 0,
  lowExtractionDocs: lowExtractionDocs.length,
  forbiddenLanguageDocs: forbiddenDocs.length,
  sourceQualityReviewRequired: lowExtractionDocs.length > 0 || forbiddenDocs.length > 0,
  absorptionStatus: missingUniqueFiles.length === 0
    ? "all_unique_pdfs_imported_with_quality_flags"
    : "missing_unique_pdfs_require_harvest",
  lowExtractionList: lowExtractionDocs,
  forbiddenLanguageList: forbiddenDocs,
  duplicateList: duplicateFiles.map((file) => ({
    sourceId: file.sourceId,
    relativePath: file.relativePath,
    duplicateOf: file.duplicateOf,
    sha256: file.sha256,
  })),
  missingUniqueList: missingUniqueFiles.map((file) => ({
    sourceId: file.sourceId,
    relativePath: file.relativePath,
    sha256: file.sha256,
  })),
  boundary: "All local course PDFs are private reviewer-only source material. Import coverage does not approve learner-facing release; low-extraction and risky-language PDFs require manual review, OCR/visual inspection, and original education-only rewriting.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course Source Quality Audit",
  "",
  "Coverage and quality gate for the local investment course folder.",
  "",
  `- Source root: ${audit.sourceRoot}`,
  `- Folder files: ${audit.folderFiles}`,
  `- PDF-only folder: ${audit.pdfOnlyFolder}`,
  `- Manifest PDF files: ${audit.manifestPdfFiles}`,
  `- Unique PDF files: ${audit.uniquePdfFiles}`,
  `- Imported unique PDF files: ${audit.importedUniquePdfFiles}`,
  `- Missing unique PDF files: ${audit.missingUniquePdfFiles}`,
  `- Duplicate PDF files: ${audit.duplicatePdfFiles}`,
  `- Full extraction docs: ${audit.fullExtractionDocs}`,
  `- Low extraction docs: ${audit.lowExtractionDocs}`,
  `- Forbidden-language docs: ${audit.forbiddenLanguageDocs}`,
  `- Absorption status: ${audit.absorptionStatus}`,
  `- Source quality review required: ${audit.sourceQualityReviewRequired}`,
  `- Approval status: ${audit.approvalStatus}`,
  "",
  "## Low Extraction Docs",
  "",
  ...audit.lowExtractionList.map((item) => `- ${item.sourceRelativePath}: ${item.charCount} chars / ${item.textExtraction} / ${item.reviewerGate}`),
  "",
  "## Forbidden-Language Docs",
  "",
  ...audit.forbiddenLanguageList.map((item) => `- ${item.sourceRelativePath}: ${item.forbiddenHits.join(", ")} / ${item.reviewerGate}`),
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
  folderFiles: audit.folderFiles,
  pdfOnlyFolder: audit.pdfOnlyFolder,
  uniquePdfFiles: audit.uniquePdfFiles,
  importedUniquePdfFiles: audit.importedUniquePdfFiles,
  missingUniquePdfFiles: audit.missingUniquePdfFiles,
  lowExtractionDocs: audit.lowExtractionDocs,
  forbiddenLanguageDocs: audit.forbiddenLanguageDocs,
  absorptionStatus: audit.absorptionStatus,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
