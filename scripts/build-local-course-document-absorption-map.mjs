import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { localCourseCoverageIndex } = require("../education-local-course-coverage");
const { knowledgeBrowserIndex } = require("../education-knowledge-browser-index");

const outputJson = "docs/LOCAL_COURSE_DOCUMENT_ABSORPTION_MAP.json";
const outputMd = "docs/LOCAL_COURSE_DOCUMENT_ABSORPTION_MAP.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function corpusDocuments() {
  return fs.readdirSync("data/corpus")
    .filter((file) => /^corpus_\d+\.json$/.test(file))
    .map((file) => {
      try {
        return JSON.parse(fs.readFileSync(path.join("data/corpus", file), "utf8"));
      } catch {
        return null;
      }
    })
    .filter((doc) => doc?.tier === "local_private_course");
}

function extractionBucket(doc) {
  const charCount = Number(doc.charCount || 0);
  if (doc.textExtraction !== "full" || charCount < 500) return "needs_manual_transcription_or_replacement_review";
  if (charCount < 1500) return "thin_extraction_reviewer_attention";
  return "usable_private_research_text";
}

function tokensFor(value) {
  const text = String(value || "").toLowerCase();
  const latin = text.match(/[a-z0-9]{3,}/g) || [];
  const chinese = text.match(/[\u4e00-\u9fff]{2,}/g) || [];
  const chinesePairs = [];
  for (const word of chinese) {
    for (let index = 0; index < word.length - 1; index += 1) {
      chinesePairs.push(word.slice(index, index + 2));
    }
  }
  return [...new Set([...latin, ...chinese, ...chinesePairs])].filter((token) => token.length >= 2);
}

function docTextFor(doc) {
  return `${doc.sourceRelativePath || ""} ${doc.sourceModule || ""} ${doc.name || ""} ${doc.text || ""}`.toLowerCase();
}

function scoreDocForNode(doc, node) {
  const haystack = docTextFor(doc);
  const query = tokensFor([
    node.title,
    node.module,
    node.topic,
    node.definition,
    node.principle,
    node.practicePrompt,
  ].join(" "));
  let score = 0;
  for (const token of query.slice(0, 80)) {
    if (haystack.includes(token)) score += token.length > 2 ? 2 : 1;
  }
  if (doc.sourceModule && String(node.module || "").includes(doc.sourceModule)) score += 6;
  return score;
}

function fallbackModulesForDoc(doc) {
  const text = `${doc.sourceRelativePath || ""} ${doc.name || ""}`.toLowerCase();
  const modules = [];
  if (/k线|k绾|持仓|金k|价格行为|蜡烛|图表/.test(text)) modules.push("K线与价格行为", "图表阅读基础", "风险管理");
  if (/系统|进阶|总结|展望|集训|计划/.test(text)) modules.push("回测误区", "风险管理", "交易心理");
  if (/心理|纪律|情绪/.test(text)) modules.push("交易心理", "风险管理");
  if (/风险|仓位|止损/.test(text)) modules.push("风险管理", "回测误区");
  return [...new Set(modules)];
}

const sourceSync = readJson("docs/LOCAL_COURSE_SOURCE_SYNC_AUDIT.json");
const sourceQuality = readJson("docs/LOCAL_COURSE_SOURCE_QUALITY_AUDIT.json");
const readiness = readJson("docs/LOCAL_COURSE_ABSORPTION_READINESS_AUDIT.json");

if (localCourseCoverageIndex.educationOnly !== true) fail("coverage must keep educationOnly:true");
if (localCourseCoverageIndex.productionReady !== false) fail("coverage must keep productionReady:false");
if (sourceSync.syncStatus !== "source_folder_synced_to_private_research_corpus_release_blocked") {
  fail("source sync must be clean before building document absorption map");
}

const docs = corpusDocuments().sort((left, right) =>
  String(left.sourceRelativePath || "").localeCompare(String(right.sourceRelativePath || ""), "zh-Hans-CN"));
const nodeRows = knowledgeBrowserIndex.learnerFacingNodes || [];
const docRowsById = new Map(docs.map((doc) => [doc.id, {
  documentId: doc.id,
  sourceId: doc.sourceId,
  sourceRelativePath: doc.sourceRelativePath,
  sourceModule: doc.sourceModule,
  name: doc.name,
  sha256: doc.sha256,
  charCount: doc.charCount || 0,
  textExtraction: doc.textExtraction || "unknown",
  extractionBucket: extractionBucket(doc),
  learnerFacingAllowed: doc.learnerFacingAllowed,
  productionReady: doc.productionReady,
  matchedNodeCount: 0,
  matchedModules: new Set(),
  matchedTopics: new Set(),
  topNodeMatches: [],
  coverageTopMatchCount: 0,
  reverseScoredMatchCount: 0,
  absorptionStatus: "not_mapped_to_knowledge_node",
  nextGate: "map_to_module_or_mark_duplicate_unusable_then_rerun_coverage",
}]));

for (const node of localCourseCoverageIndex.nodeMatches || []) {
  for (const match of node.topMatches || []) {
    const row = docRowsById.get(match.documentId);
    if (!row) continue;
    row.coverageTopMatchCount += 1;
    row.matchedModules.add(node.module);
    row.matchedTopics.add(node.topic);
    if (row.topNodeMatches.length < 8) {
      row.topNodeMatches.push({
        nodeId: node.nodeId,
        title: node.title,
        module: node.module,
        topic: node.topic,
        score: match.score,
        matchSource: "coverage_top_match",
      });
    }
  }
}

for (const doc of docs) {
  const row = docRowsById.get(doc.id);
  if (!row) continue;
  const reverseMatches = nodeRows
    .map((node) => ({
      node,
      score: scoreDocForNode(doc, node),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || String(left.node.id).localeCompare(String(right.node.id)))
    .slice(0, 8);
  row.reverseScoredMatchCount = reverseMatches.length;
  for (const { node, score } of reverseMatches) {
    row.matchedModules.add(node.module);
    row.matchedTopics.add(node.topic);
    if (!row.topNodeMatches.some((match) => match.nodeId === node.id) && row.topNodeMatches.length < 8) {
      row.topNodeMatches.push({
        nodeId: node.id,
        title: node.title,
        module: node.module,
        topic: node.topic,
        score,
        matchSource: "document_reverse_score",
      });
    }
  }
  if (row.topNodeMatches.length === 0 && row.extractionBucket !== "usable_private_research_text") {
    const fallbackModules = fallbackModulesForDoc(doc);
    const fallbackNodes = nodeRows
      .filter((node) => fallbackModules.includes(node.module))
      .slice(0, 5);
    for (const node of fallbackNodes) {
      row.matchedModules.add(node.module);
      row.matchedTopics.add(node.topic);
      row.topNodeMatches.push({
        nodeId: node.id,
        title: node.title,
        module: node.module,
        topic: node.topic,
        score: 1,
        matchSource: "filename_fallback_extraction_blocked",
      });
    }
  }
  row.matchedNodeCount = new Set(row.topNodeMatches.map((match) => match.nodeId)).size;
}

const documentRows = [...docRowsById.values()].map((row) => {
  const matchedModules = [...row.matchedModules].sort((left, right) => left.localeCompare(right, "zh-Hans-CN"));
  const matchedTopics = [...row.matchedTopics].sort((left, right) => left.localeCompare(right, "zh-Hans-CN"));
  const mapped = row.matchedNodeCount > 0;
  const needsExtractionReview = row.extractionBucket !== "usable_private_research_text";
  return {
    ...row,
    matchedModules,
    matchedTopics: matchedTopics.slice(0, 12),
    topNodeMatches: row.topNodeMatches.sort((left, right) => (right.score || 0) - (left.score || 0)),
    absorptionStatus: mapped
      ? (needsExtractionReview ? "mapped_but_extraction_review_required" : "mapped_to_knowledge_nodes_private_research_only")
      : "not_mapped_to_knowledge_node",
    nextGate: mapped
      ? (needsExtractionReview
        ? "manual_transcription_or_source_replacement_before_rewrite_use"
        : "reviewer_distillation_and_public_grounding_before_any_learner_facing_use")
      : "add_domain_mapping_or_mark_unusable_duplicate_then_rerun_coverage",
  };
});

const unmappedRows = documentRows.filter((row) => row.matchedNodeCount === 0);
const extractionAttentionRows = documentRows.filter((row) => row.extractionBucket !== "usable_private_research_text");
const learnerFacingAllowedRows = documentRows.filter((row) => row.learnerFacingAllowed !== false);
const productionReadyRows = documentRows.filter((row) => row.productionReady !== false);
const modules = new Map();
for (const row of documentRows) {
  for (const module of row.matchedModules) {
    const moduleRow = modules.get(module) || {
      module,
      documents: 0,
      thinOrLowExtractionDocuments: 0,
      nodeMatches: 0,
      sampleDocuments: [],
    };
    moduleRow.documents += 1;
    moduleRow.nodeMatches += row.matchedNodeCount;
    if (row.extractionBucket !== "usable_private_research_text") moduleRow.thinOrLowExtractionDocuments += 1;
    if (moduleRow.sampleDocuments.length < 5) {
      moduleRow.sampleDocuments.push({
        documentId: row.documentId,
        sourceRelativePath: row.sourceRelativePath,
        matchedNodeCount: row.matchedNodeCount,
      });
    }
    modules.set(module, moduleRow);
  }
}

const auditStatus = sourceSync.corpusDocsForCurrentUniqueHashes === sourceSync.currentUniquePdfHashes &&
  documentRows.length === sourceSync.currentUniquePdfHashes &&
  unmappedRows.length === 0 &&
  learnerFacingAllowedRows.length === 0 &&
  productionReadyRows.length === 0
  ? "all_unique_pdfs_mapped_to_knowledge_nodes_release_blocked"
  : "document_absorption_attention_required";

const audit = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  auditStatus,
  auditMode: "reverse_pdf_to_knowledge_node_absorption_map",
  sourceRoot: sourceSync.sourceRoot,
  physicalPdfFiles: sourceSync.currentPdfFiles,
  duplicatePdfFiles: sourceSync.currentDuplicatePdfFiles,
  uniquePdfFiles: sourceSync.currentUniquePdfHashes,
  localPrivateCourseCorpusDocs: sourceSync.corpusDocsForCurrentUniqueHashes,
  mappedUniquePdfFiles: documentRows.filter((row) => row.matchedNodeCount > 0).length,
  unmappedUniquePdfFiles: unmappedRows.length,
  mappedToMultipleModules: documentRows.filter((row) => row.matchedModules.length > 1).length,
  totalDocumentNodeMatches: documentRows.reduce((sum, row) => sum + row.matchedNodeCount, 0),
  coverageTopMatchedPdfFiles: documentRows.filter((row) => row.coverageTopMatchCount > 0).length,
  reverseScoredMatchedPdfFiles: documentRows.filter((row) => row.reverseScoredMatchCount > 0).length,
  maxNodeMatchesPerDocument: Math.max(...documentRows.map((row) => row.matchedNodeCount)),
  lowOrThinExtractionMappedDocs: extractionAttentionRows.length,
  lowExtractionDocs: sourceQuality.lowExtractionDocs,
  manualTranscriptionPages: readiness.manualTranscriptionPages,
  sourceReplacementCandidates: readiness.sourceReplacementCandidates,
  learnerFacingAllowedDocs: learnerFacingAllowedRows.length,
  productionReadyDocs: productionReadyRows.length,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  moduleRows: [...modules.values()].sort((left, right) => right.documents - left.documents || left.module.localeCompare(right.module, "zh-Hans-CN")),
  documentRows,
  unmappedRows,
  extractionAttentionRows: extractionAttentionRows.slice(0, 30),
  topMappedDocumentRows: documentRows
    .slice()
    .sort((left, right) => right.matchedNodeCount - left.matchedNodeCount || (right.charCount || 0) - (left.charCount || 0))
    .slice(0, 20)
    .map((row) => ({
      documentId: row.documentId,
      sourceRelativePath: row.sourceRelativePath,
      matchedNodeCount: row.matchedNodeCount,
      coverageTopMatchCount: row.coverageTopMatchCount,
      reverseScoredMatchCount: row.reverseScoredMatchCount,
      matchedModules: row.matchedModules,
      extractionBucket: row.extractionBucket,
    })),
  commands: [
    "npm.cmd run check:local-course-document-absorption-map",
    "npm.cmd run check:local-course-source-sync-audit",
    "npm.cmd run check:local-course-coverage",
    "npm.cmd run verify",
  ],
  completionRule: "Every unique local PDF is considered absorbed only for the internal research layer when it is represented by hash in the private corpus and mapped to at least one knowledge node. Learner-facing use still requires reviewer distillation, public grounding, source-fit review, originality checks, and explicit approval.",
  boundary: "Local course document absorption map is reviewer-facing education-only governance. It does not make private PDFs public citations, does not approve learner-facing lessons, does not provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Local Course Document Absorption Map",
  "",
  "Reverse audit from each unique private PDF into the knowledge-node graph.",
  "",
  `- Audit status: ${audit.auditStatus}`,
  `- Physical PDFs: ${audit.physicalPdfFiles}`,
  `- Unique PDFs: ${audit.uniquePdfFiles}`,
  `- Duplicate PDFs: ${audit.duplicatePdfFiles}`,
  `- Unique PDFs mapped to knowledge nodes: ${audit.mappedUniquePdfFiles}/${audit.uniquePdfFiles}`,
  `- Unmapped unique PDFs: ${audit.unmappedUniquePdfFiles}`,
  `- Total document-node matches: ${audit.totalDocumentNodeMatches}`,
  `- Low/thin extraction mapped docs: ${audit.lowOrThinExtractionMappedDocs}`,
  `- Write allowed now: ${audit.writeAllowedNow}`,
  "",
  "## Module Rows",
  "",
  "| Module | Documents | Node matches | Thin/low extraction docs |",
  "|---|---:|---:|---:|",
  ...audit.moduleRows.map((row) => `| ${row.module} | ${row.documents} | ${row.nodeMatches} | ${row.thinOrLowExtractionDocuments} |`),
  "",
  "## Extraction Attention",
  "",
  ...audit.extractionAttentionRows.map((row) => `- ${row.sourceRelativePath}: ${row.extractionBucket}, matches ${row.matchedNodeCount}`),
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
  auditStatus: audit.auditStatus,
  uniquePdfFiles: audit.uniquePdfFiles,
  mappedUniquePdfFiles: audit.mappedUniquePdfFiles,
  unmappedUniquePdfFiles: audit.unmappedUniquePdfFiles,
  lowOrThinExtractionMappedDocs: audit.lowOrThinExtractionMappedDocs,
  writeAllowedNow: audit.writeAllowedNow,
  outputJson,
  outputMd,
}, null, 2));
