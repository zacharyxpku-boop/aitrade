import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

const root = process.env.LOCAL_COURSE_ROOT || "C:\\Users\\86136\\Desktop\\投资";
const corpusDir = "data/corpus";
const docsDir = "docs";
const maxFiles = process.env.LOCAL_COURSE_MAX_FILES
  ? Math.max(0, Number.parseInt(process.env.LOCAL_COURSE_MAX_FILES, 10) || 0)
  : null;

fs.mkdirSync(corpusDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });

const forbidden = [
  "推荐买入",
  "推荐卖出",
  "保证收益",
  "胜率承诺",
  "实盘信号",
  "自动下单",
  "接入券商",
  "真实资金建议",
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")) files.push(fullPath);
  }
  return files;
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function relativeCoursePath(filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

function moduleFromRelativePath(relativePath) {
  const [first] = relativePath.split("/");
  return first && first !== path.basename(relativePath) ? first : "根目录PDF";
}

function courseUrl(hash) {
  return `local-course://investment/${hash.slice(0, 24)}`;
}

function localBoundary() {
  return "Local private course PDF imported for the internal research layer only. It is not learner-facing, not publication-cleared, and must be paraphrased into education-only review notes with no stock recommendations, signals, return promises, broker workflow, automation, or real-money guidance.";
}

function nextCorpusIndex() {
  const existing = fs.readdirSync(corpusDir).filter((file) => /^corpus_\d+\.json$/.test(file));
  return existing.reduce((max, file) => Math.max(max, Number((file.match(/^corpus_(\d+)\.json$/) || [])[1] || 0)), 0);
}

function existingSourceIds() {
  const ids = new Set();
  for (const file of fs.readdirSync(corpusDir).filter((item) => /^corpus_\d+\.json$/.test(item))) {
    try {
      const doc = JSON.parse(fs.readFileSync(path.join(corpusDir, file), "utf8"));
      if (doc.sourceId) ids.add(doc.sourceId);
    } catch {
      // Keep importing other files if one old corpus record is unreadable.
    }
  }
  return ids;
}

async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return (result.text || "").replace(/\u0000/g, " ").replace(/[ \t]+\n/g, "\n").trim();
  } finally {
    await parser.destroy();
  }
}

function containsForbidden(text) {
  return forbidden.filter((item) => text.includes(item));
}

if (!fs.existsSync(root)) {
  throw new Error(`Local course root does not exist: ${root}`);
}

const allPdfPaths = walk(root).sort((left, right) => relativeCoursePath(left).localeCompare(relativeCoursePath(right), "zh-Hans-CN"));
const allManifest = [];
let docCounter = nextCorpusIndex();
const seenSourceIds = existingSourceIds();
const imported = [];
const skipped = [];
const failed = [];
const duplicateFiles = [];
const hashToPath = new Map();

for (const filePath of allPdfPaths) {
  const stat = fs.statSync(filePath);
  const buffer = fs.readFileSync(filePath);
  const hash = sha256(buffer);
  const relativePath = relativeCoursePath(filePath);
  const sourceId = `local-investment-course:${hash.slice(0, 24)}`;
  const duplicateOf = hashToPath.get(hash) || null;
  if (!duplicateOf) hashToPath.set(hash, relativePath);
  else duplicateFiles.push({ relativePath, duplicateOf, sha256: hash });
  allManifest.push({
    sourceId,
    relativePath,
    module: moduleFromRelativePath(relativePath),
    bytes: stat.size,
    sha256: hash,
    duplicateOf,
    lastModified: stat.mtime.toISOString(),
  });
}

const pending = allManifest.filter((item) => !item.duplicateOf && !seenSourceIds.has(item.sourceId));
const targets = maxFiles == null ? pending : pending.slice(0, maxFiles);

for (const item of targets) {
  const filePath = path.join(root, item.relativePath);
  try {
    const buffer = fs.readFileSync(filePath);
    let text = "";
    let extraction = "failed";
    try {
      text = await extractPdfText(buffer);
      extraction = text.length >= 500 ? "full" : text.length > 0 ? "partial" : "empty";
    } catch (error) {
      extraction = `failed: ${error.message}`;
    }
    const forbiddenHits = containsForbidden(text);
    docCounter += 1;
    const id = `corpus_${String(docCounter).padStart(4, "0")}`;
    const record = {
      id,
      educationOnly: true,
      productionReady: false,
      sourceId: item.sourceId,
      name: `本地投资课程：${path.basename(item.relativePath, ".pdf")}`,
      url: courseUrl(item.sha256),
      tier: "local_private_course",
      contentType: "application/pdf",
      sourceLocalPath: filePath,
      sourceRelativePath: item.relativePath,
      sourceModule: item.module,
      sha256: item.sha256,
      charCount: text.length,
      textExtraction: extraction,
      text,
      localCourseUse: "internal_review_and_distillation_only",
      learnerFacingAllowed: false,
      fetchedAt: new Date().toISOString(),
      boundary: localBoundary(),
    };
    fs.writeFileSync(path.join(corpusDir, `${id}.json`), `${JSON.stringify(record, null, 2)}\n`, "utf8");
    seenSourceIds.add(item.sourceId);
    imported.push({
      id,
      sourceId: item.sourceId,
      relativePath: item.relativePath,
      module: item.module,
      charCount: text.length,
      textExtraction: extraction,
      forbiddenHits,
    });
  } catch (error) {
    failed.push({ relativePath: item.relativePath, reason: error.message });
  }
}

for (const item of pending.slice(targets.length)) {
  skipped.push({ relativePath: item.relativePath, reason: "not processed in this bounded run" });
}
for (const item of allManifest.filter((entry) => entry.duplicateOf)) {
  skipped.push({ relativePath: item.relativePath, reason: `duplicate of ${item.duplicateOf}` });
}
for (const item of allManifest.filter((entry) => seenSourceIds.has(entry.sourceId) && !targets.some((target) => target.sourceId === entry.sourceId))) {
  if (!item.duplicateOf) skipped.push({ relativePath: item.relativePath, reason: "already imported" });
}

const modules = {};
for (const item of allManifest) {
  modules[item.module] = modules[item.module] || { files: 0, importedThisRun: 0, totalBytes: 0 };
  modules[item.module].files += 1;
  modules[item.module].totalBytes += item.bytes;
}
for (const item of imported) {
  modules[item.module] = modules[item.module] || { files: 0, importedThisRun: 0, totalBytes: 0 };
  modules[item.module].importedThisRun += 1;
}

const summary = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  root,
  totalPdfFiles: allManifest.length,
  uniquePdfFiles: allManifest.length - duplicateFiles.length,
  duplicatePdfFiles: duplicateFiles.length,
  maxFilesThisRun: maxFiles,
  importedThisRun: imported.length,
  pendingAfterRun: allManifest.filter((item) => !item.duplicateOf && !seenSourceIds.has(item.sourceId)).length,
  failed: failed.length,
  modules,
  imported,
  failedList: failed,
  skipped: skipped.slice(0, 500),
  boundary: localBoundary(),
};

fs.writeFileSync(path.join(docsDir, "LOCAL_INVESTMENT_COURSE_SOURCE_MANIFEST.json"), `${JSON.stringify({
  generatedAt: summary.generatedAt,
  educationOnly: true,
  productionReady: false,
  root,
  totalPdfFiles: allManifest.length,
  duplicatePdfFiles: duplicateFiles.length,
  files: allManifest,
  boundary: localBoundary(),
}, null, 2)}\n`, "utf8");

fs.writeFileSync(path.join(docsDir, "LOCAL_INVESTMENT_COURSE_HARVEST_REPORT.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");

const md = [
  "# Local Investment Course Harvest Report",
  "",
  `- Root: ${root}`,
  `- PDF files in folder: ${summary.totalPdfFiles}`,
  `- Unique PDF files: ${summary.uniquePdfFiles}`,
  `- Imported this run: ${summary.importedThisRun}`,
  `- Pending after run: ${summary.pendingAfterRun}`,
  `- Failed this run: ${summary.failed}`,
  `- Production ready: ${summary.productionReady}`,
  "",
  "## Boundary",
  "",
  summary.boundary,
  "",
  "## Modules",
  "",
  ...Object.entries(modules).map(([name, stats]) => `- ${name}: ${stats.files} PDFs, ${stats.importedThisRun} imported this run`),
  "",
  "## Imported This Run",
  "",
  ...imported.slice(0, 80).map((item) => `- ${item.id}: ${item.relativePath} (${item.charCount} chars, ${item.textExtraction})`),
  "",
].join("\n");

fs.writeFileSync(path.join(docsDir, "LOCAL_INVESTMENT_COURSE_HARVEST_REPORT.md"), md, "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: true,
  productionReady: false,
  totalPdfFiles: summary.totalPdfFiles,
  uniquePdfFiles: summary.uniquePdfFiles,
  importedThisRun: summary.importedThisRun,
  pendingAfterRun: summary.pendingAfterRun,
  failed: summary.failed,
  outputJson: "docs/LOCAL_INVESTMENT_COURSE_HARVEST_REPORT.json",
  manifestJson: "docs/LOCAL_INVESTMENT_COURSE_SOURCE_MANIFEST.json",
}, null, 2));
