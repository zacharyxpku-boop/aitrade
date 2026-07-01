import fs from "node:fs";

const artifactPrefix = process.env.TRADEGYM_VIDEO_COURSE_ARTIFACT_PREFIX || "LOCAL_VIDEO_COURSE";
const intakePath = process.env.TRADEGYM_VIDEO_COURSE_INTAKE_JSON || `docs/${artifactPrefix}_KNOWLEDGE_INTAKE.json`;
const intakeMdPath = process.env.TRADEGYM_VIDEO_COURSE_INTAKE_MD || `docs/${artifactPrefix}_KNOWLEDGE_INTAKE.md`;
const isDefaultCourse = artifactPrefix === "LOCAL_VIDEO_COURSE";
const expectedVideoCount = Number.parseInt(process.env.TRADEGYM_VIDEO_COURSE_EXPECTED_COUNT || "62", 10);

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const intake = readJson(intakePath);
if (!fs.existsSync(intakeMdPath)) fail(`missing ${intakeMdPath}`);

if (intake.educationOnly !== true) fail("intake must keep educationOnly:true");
if (intake.productionReady !== false) fail("intake must keep productionReady:false");
if (intake.learnerFacingRelease !== false) fail("intake must keep learnerFacingRelease:false");
if (intake.approvalStatus !== "not_approved") fail("intake must remain not_approved");
if (intake.intakeStatus !== "local_video_course_sources_absorbed_into_management_transcripts_required") fail("unexpected intakeStatus");
if (intake.intakeMode !== "video_course_source_to_knowledge_management_and_transcription_queue") fail("unexpected intakeMode");
if (intake.sourceFileAbsorptionComplete !== true) fail("source file absorption must be complete");
if (intake.semanticKnowledgeExtractionComplete !== false) fail("semantic extraction must remain blocked without transcripts");
if (intake.learnerReleaseReady !== false) fail("learner release must remain blocked");
if (intake.physicalVideoFiles !== expectedVideoCount) fail(`expected ${expectedVideoCount} video files`);
if (intake.uniqueVideoHashes !== expectedVideoCount) fail(`expected ${expectedVideoCount} unique video hashes`);
if (intake.intakeRows !== expectedVideoCount) fail(`expected ${expectedVideoCount} intake rows`);
if (intake.mappedTitleRows !== expectedVideoCount || intake.unclassifiedRows !== 0) fail("all videos must be title-mapped to modules");
if (intake.p0ReviewRows < 10) fail("expected a meaningful P0 risk/execution review queue");
if (intake.transcriptRequiredRows !== expectedVideoCount || intake.verifiedTranscriptRows !== 0) fail("all videos must still require transcripts");
if (intake.writeAllowedNow !== false || intake.manualAuthorizationRequired !== true) fail("write gate must stay locked");

if (!Array.isArray(intake.moduleRows) || intake.moduleRows.length < 10) fail("moduleRows too small");
if (isDefaultCourse && !intake.moduleRows.some((row) => row.module === "risk_management" && row.videos >= 3)) fail("risk management module coverage missing");
if (isDefaultCourse && !intake.moduleRows.some((row) => row.module === "trade_management" && row.videos >= 3)) fail("trade management module coverage missing");
if (isDefaultCourse && !intake.moduleRows.some((row) => row.module === "reversals" && row.videos >= 5)) fail("reversal module coverage missing");

if (!Array.isArray(intake.videoRows) || intake.videoRows.length !== expectedVideoCount) fail("videoRows drift");
if (!intake.videoRows.every((row) =>
  row.intakeId &&
  row.sourceId &&
  row.relativePath &&
  row.fileName &&
  row.lessonCode &&
  Number.isFinite(row.lessonNumber) &&
  row.lessonTitle &&
  row.sha256 &&
  row.mb > 0 &&
  Array.isArray(row.moduleTags) &&
  row.moduleTags.length >= 1 &&
  row.sourceFileAbsorbedIntoKnowledgeManagement === true &&
  row.semanticTranscriptAvailable === false &&
  row.semanticKnowledgeExtractionComplete === false &&
  row.mappedToKnowledgeModuleByTitle === true &&
  row.learnerFacingRelease === false &&
  row.writeAllowedNow === false
)) {
  fail("video intake row identity or boundary drift");
}
if (isDefaultCourse && !intake.videoRows.some((row) => row.lessonCode === "Video 32A" && row.moduleTags.includes("orders"))) fail("orders video must be queued");
if (isDefaultCourse && !intake.videoRows.some((row) => row.lessonCode === "Video 33A" && row.moduleTags.includes("protective_stops"))) fail("protective stops video must be queued");
if (isDefaultCourse && !intake.videoRows.some((row) => row.lessonCode === "Video 36B" && row.moduleTags.includes("trade_management"))) fail("trade management video must be queued");
if (!Array.isArray(intake.commands) || !intake.commands.some((command) => /check:local-video-course-knowledge-intake/.test(command))) {
  fail("commands must include intake check");
}

const boundaryText = `${intake.boundary || ""} ${intake.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "not complete at the semantic course-knowledge layer",
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
  intakeStatus: intake.intakeStatus,
  sourceFileAbsorptionComplete: intake.sourceFileAbsorptionComplete,
  semanticKnowledgeExtractionComplete: intake.semanticKnowledgeExtractionComplete,
  physicalVideoFiles: intake.physicalVideoFiles,
  uniqueVideoHashes: intake.uniqueVideoHashes,
  mappedTitleRows: intake.mappedTitleRows,
  unclassifiedRows: intake.unclassifiedRows,
  p0ReviewRows: intake.p0ReviewRows,
  transcriptRequiredRows: intake.transcriptRequiredRows,
  writeAllowedNow: intake.writeAllowedNow,
}, null, 2));
