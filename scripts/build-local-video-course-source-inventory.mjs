import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const sourceRoot = process.env.TRADEGYM_VIDEO_COURSE_SOURCE_ROOT || "C:\\Users\\86136\\Desktop\\1";
const artifactPrefix = process.env.TRADEGYM_VIDEO_COURSE_ARTIFACT_PREFIX || "LOCAL_VIDEO_COURSE";
const expectedVideoCount = Number.parseInt(process.env.TRADEGYM_VIDEO_COURSE_EXPECTED_COUNT || "62", 10);
const outputJsonPath = process.env.TRADEGYM_VIDEO_COURSE_SOURCE_INVENTORY_JSON || `docs/${artifactPrefix}_SOURCE_INVENTORY.json`;
const outputMdPath = process.env.TRADEGYM_VIDEO_COURSE_SOURCE_INVENTORY_MD || `docs/${artifactPrefix}_SOURCE_INVENTORY.md`;

function fail(message) {
  throw new Error(message);
}

function walkFiles(root) {
  if (!fs.existsSync(root)) fail(`missing source root: ${root}`);
  const files = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(fullPath);
      else if (entry.isFile()) files.push(fullPath);
    }
  }
  return files.sort((left, right) => left.localeCompare(right, "zh-Hans-CN"));
}

function rel(root, filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

function sha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

function cleanTitle(fileName) {
  return path.basename(fileName, path.extname(fileName))
    .replace(/_new$/i, "")
    .replace(/\(\d+\)$/i, "")
    .replace(/-中文配音版.*$/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseLesson(fileName) {
  const clean = cleanTitle(fileName);
  const match = clean.match(/^Video\s+(\d+)([A-Z]?)\s*(.+)$/iu);
  return {
    lessonCode: match ? `Video ${match[1]}${match[2] || ""}` : "",
    lessonNumber: match ? Number(match[1]) : null,
    lessonPart: match?.[2] || "",
    lessonTitle: match?.[3]?.trim() || clean,
  };
}

function sourceIdForHash(hash) {
  return `${process.env.TRADEGYM_VIDEO_COURSE_SOURCE_ID_PREFIX || "local-video-course"}:${hash.slice(0, 24)}`;
}

const allFiles = walkFiles(sourceRoot);
const rows = [];
for (const filePath of allFiles) {
  const stat = fs.statSync(filePath);
  const extension = path.extname(filePath).toLowerCase();
  const hash = await sha256(filePath);
  const parsed = parseLesson(path.basename(filePath));
  rows.push({
    sourceId: sourceIdForHash(hash),
    relativePath: rel(sourceRoot, filePath),
    fileName: path.basename(filePath),
    extension,
    bytes: stat.size,
    mb: Number((stat.size / 1024 / 1024).toFixed(3)),
    sha256: hash,
    lastModified: stat.mtime.toISOString(),
    ...parsed,
    hasAdjacentTranscript: false,
    hasAdjacentSubtitle: false,
    learnerFacingRelease: false,
    productionReady: false,
  });
}

const firstRowByHash = new Map();
for (const row of rows) {
  if (!firstRowByHash.has(row.sha256)) firstRowByHash.set(row.sha256, row);
}

const duplicateRows = rows
  .filter((row) => firstRowByHash.get(row.sha256) !== row)
  .map((row) => ({
    relativePath: row.relativePath,
    duplicateOf: firstRowByHash.get(row.sha256).relativePath,
    sha256: row.sha256,
  }));

const extensionRows = [...new Map(rows.map((row) => [row.extension, rows.filter((item) => item.extension === row.extension)])).entries()]
  .map(([extension, extensionRowsForKey]) => ({
    extension,
    files: extensionRowsForKey.length,
    uniqueHashes: new Set(extensionRowsForKey.map((row) => row.sha256)).size,
    totalMb: Number((extensionRowsForKey.reduce((sum, row) => sum + row.bytes, 0) / 1024 / 1024).toFixed(2)),
    inventoryStatus: extension === ".mp4" ? "video_source_registered_transcription_required" : "unsupported_extension_attention_required",
  }))
  .sort((left, right) => right.files - left.files || left.extension.localeCompare(right.extension));

const lessonNumbers = rows.map((row) => row.lessonNumber).filter((value) => Number.isFinite(value));
const inventoryStatus = rows.length === expectedVideoCount &&
  rows.every((row) => row.extension === ".mp4") &&
  duplicateRows.length === 0
  ? "local_video_course_source_inventory_complete_transcription_required"
  : "local_video_course_source_inventory_attention_required";

const inventory = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  inventoryStatus,
  inventoryMode: "desktop_video_course_file_hash_manifest_for_knowledge_intake",
  sourceRoot,
  sourceRootAvailable: fs.existsSync(sourceRoot),
  physicalFiles: rows.length,
  physicalVideoFiles: rows.filter((row) => row.extension === ".mp4").length,
  nonVideoFiles: rows.filter((row) => row.extension !== ".mp4").length,
  totalMb: Number((rows.reduce((sum, row) => sum + row.bytes, 0) / 1024 / 1024).toFixed(2)),
  uniqueVideoHashes: new Set(rows.filter((row) => row.extension === ".mp4").map((row) => row.sha256)).size,
  duplicateVideoFiles: duplicateRows.length,
  minLessonNumber: Math.min(...lessonNumbers),
  maxLessonNumber: Math.max(...lessonNumbers),
  adjacentTranscriptFiles: 0,
  adjacentSubtitleFiles: 0,
  contentExtractionStatus: "video_audio_text_not_transcribed_yet",
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  extensionRows,
  duplicateRows,
  videoRows: rows,
  commands: [
    "npm.cmd run build:local-video-course-source-inventory",
    "npm.cmd run check:local-video-course-source-inventory",
    "npm.cmd run build:local-video-course-knowledge-intake",
    "npm.cmd run check:local-video-course-knowledge-intake",
    "npm.cmd run verify",
  ],
  completionRule: `This source inventory is complete when every current MP4 under ${sourceRoot} is hash-registered and queued for knowledge intake. It does not claim transcript-level semantic absorption until verified transcripts or subtitles exist.`,
  boundary: "Local video course source inventory is reviewer-facing education-only operations material. It registers private video files for controlled knowledge intake; it does not publish copied course material, approve learner-facing citations, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(inventory, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Video Course Source Inventory",
  "",
  `- Inventory status: ${inventory.inventoryStatus}`,
  `- Source root: ${inventory.sourceRoot}`,
  `- Physical files: ${inventory.physicalFiles}`,
  `- Physical video files: ${inventory.physicalVideoFiles}`,
  `- Unique video hashes: ${inventory.uniqueVideoHashes}`,
  `- Duplicate video files: ${inventory.duplicateVideoFiles}`,
  `- Total MB: ${inventory.totalMb}`,
  `- Content extraction status: ${inventory.contentExtractionStatus}`,
  `- Write allowed now: ${inventory.writeAllowedNow}`,
  "",
  "## Extension Rows",
  "",
  "| Extension | Files | Unique hashes | Total MB | Status |",
  "| --- | ---: | ---: | ---: | --- |",
  ...inventory.extensionRows.map((row) => `| ${row.extension} | ${row.files} | ${row.uniqueHashes} | ${row.totalMb} | ${row.inventoryStatus} |`),
  "",
  "## Video Rows",
  "",
  "| Lesson | Title | MB | Source ID |",
  "| --- | --- | ---: | --- |",
  ...inventory.videoRows.map((row) => `| ${row.lessonCode || ""} | ${row.lessonTitle.replace(/\|/g, "/")} | ${row.mb} | ${row.sourceId} |`),
  "",
  "## Boundary",
  "",
  inventory.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  inventoryStatus: inventory.inventoryStatus,
  physicalFiles: inventory.physicalFiles,
  physicalVideoFiles: inventory.physicalVideoFiles,
  uniqueVideoHashes: inventory.uniqueVideoHashes,
  duplicateVideoFiles: inventory.duplicateVideoFiles,
  totalMb: inventory.totalMb,
  contentExtractionStatus: inventory.contentExtractionStatus,
  writeAllowedNow: inventory.writeAllowedNow,
}, null, 2));
