import fs from "node:fs";

const artifactPrefix = process.env.TRADEGYM_VIDEO_COURSE_ARTIFACT_PREFIX || "LOCAL_VIDEO_COURSE";
const inventoryPath = process.env.TRADEGYM_VIDEO_COURSE_SOURCE_INVENTORY_JSON || `docs/${artifactPrefix}_SOURCE_INVENTORY.json`;
const inventoryMdPath = process.env.TRADEGYM_VIDEO_COURSE_SOURCE_INVENTORY_MD || `docs/${artifactPrefix}_SOURCE_INVENTORY.md`;
const isDefaultCourse = artifactPrefix === "LOCAL_VIDEO_COURSE";
const expectedVideoCount = Number.parseInt(process.env.TRADEGYM_VIDEO_COURSE_EXPECTED_COUNT || "62", 10);

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const inventory = readJson(inventoryPath);
if (!fs.existsSync(inventoryMdPath)) fail(`missing ${inventoryMdPath}`);

if (inventory.educationOnly !== true) fail("inventory must keep educationOnly:true");
if (inventory.productionReady !== false) fail("inventory must keep productionReady:false");
if (inventory.learnerFacingRelease !== false) fail("inventory must keep learnerFacingRelease:false");
if (inventory.approvalStatus !== "not_approved") fail("inventory must remain not_approved");
if (inventory.inventoryStatus !== "local_video_course_source_inventory_complete_transcription_required") fail("unexpected inventoryStatus");
if (inventory.inventoryMode !== "desktop_video_course_file_hash_manifest_for_knowledge_intake") fail("unexpected inventoryMode");
if (inventory.physicalFiles !== expectedVideoCount) fail(`expected ${expectedVideoCount} files, got ${inventory.physicalFiles}`);
if (inventory.physicalVideoFiles !== expectedVideoCount) fail(`expected ${expectedVideoCount} MP4 videos`);
if (inventory.nonVideoFiles !== 0) fail("non-video files must be zero for this source folder");
if (isDefaultCourse && inventory.totalMb < 27000) fail("video source total size drift");
if (!isDefaultCourse && inventory.totalMb <= 1000) fail("video source total size drift");
if (inventory.uniqueVideoHashes !== expectedVideoCount) fail(`expected ${expectedVideoCount} unique video hashes`);
if (inventory.duplicateVideoFiles !== 0) fail("expected no duplicate video files");
if (isDefaultCourse && (inventory.minLessonNumber !== 5 || inventory.maxLessonNumber !== 36)) fail("lesson number range drift");
if (!isDefaultCourse && (!Number.isFinite(inventory.minLessonNumber) || !Number.isFinite(inventory.maxLessonNumber) || inventory.minLessonNumber < 1 || inventory.maxLessonNumber <= inventory.minLessonNumber)) {
  fail("lesson number range drift");
}
if (inventory.adjacentTranscriptFiles !== 0 || inventory.adjacentSubtitleFiles !== 0) fail("transcript/subtitle counts drift");
if (inventory.contentExtractionStatus !== "video_audio_text_not_transcribed_yet") fail("content extraction status drift");
if (inventory.writeAllowedNow !== false || inventory.manualAuthorizationRequired !== true) fail("write gate must stay locked");

if (!Array.isArray(inventory.extensionRows) || inventory.extensionRows.length !== 1) fail("expected one extension row");
if (
  inventory.extensionRows[0].extension !== ".mp4" ||
  inventory.extensionRows[0].files !== expectedVideoCount ||
  inventory.extensionRows[0].uniqueHashes !== expectedVideoCount ||
  inventory.extensionRows[0].inventoryStatus !== "video_source_registered_transcription_required"
) {
  fail("extension row drift");
}

if (!Array.isArray(inventory.videoRows) || inventory.videoRows.length !== expectedVideoCount) fail("videoRows drift");
if (!inventory.videoRows.every((row) =>
  row.sourceId &&
  row.relativePath &&
  row.fileName &&
  row.extension === ".mp4" &&
  row.bytes > 0 &&
  row.sha256 &&
  row.lessonCode &&
  Number.isFinite(row.lessonNumber) &&
  row.lessonTitle &&
  row.hasAdjacentTranscript === false &&
  row.hasAdjacentSubtitle === false &&
  row.learnerFacingRelease === false &&
  row.productionReady === false
)) {
  fail("video row identity or boundary drift");
}
if (!inventory.videoRows.some((row) => row.lessonCode === "Video 05" && /Program Trading/.test(row.lessonTitle))) {
  if (isDefaultCourse) fail("Video 05 must be registered");
}
if (!inventory.videoRows.some((row) => row.lessonCode === "Video 36B" && /Trade Management/.test(row.lessonTitle))) {
  if (isDefaultCourse) fail("Video 36B must be registered");
}
if (!Array.isArray(inventory.duplicateRows) || inventory.duplicateRows.length !== 0) fail("duplicate rows must be empty");
if (!Array.isArray(inventory.commands) || !inventory.commands.some((command) => /check:local-video-course-source-inventory/.test(command))) {
  fail("commands must include inventory check");
}

const boundaryText = `${inventory.boundary || ""} ${inventory.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "does not claim transcript-level semantic absorption",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
  "learner release",
  "production readiness",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary/completion missing phrase: ${phrase}`);
}

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
