import fs from "node:fs";

const artifactPrefix = process.env.TRADEGYM_VIDEO_COURSE_ARTIFACT_PREFIX || "LOCAL_VIDEO_COURSE";
const statusPath = process.env.TRADEGYM_VIDEO_COURSE_STATUS_JSON || `docs/${artifactPrefix}_TRANSCRIPT_STATUS.json`;
const statusMdPath = process.env.TRADEGYM_VIDEO_COURSE_STATUS_MD || `docs/${artifactPrefix}_TRANSCRIPT_STATUS.md`;

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const status = readJson(statusPath);
const expectedVideoCount = Number.parseInt(process.env.TRADEGYM_VIDEO_COURSE_EXPECTED_COUNT || String(status.sourceVideos || 62), 10);
if (!fs.existsSync(statusMdPath)) fail(`missing ${statusMdPath}`);

if (status.educationOnly !== true) fail("status must keep educationOnly:true");
if (status.productionReady !== false) fail("status must keep productionReady:false");
if (status.learnerFacingRelease !== false) fail("status must keep learnerFacingRelease:false");
if (status.approvalStatus !== "not_approved") fail("status must remain not_approved");
if (!["local_video_course_transcription_in_progress_release_blocked", "local_video_course_semantic_absorption_complete_release_blocked"].includes(status.transcriptStatus)) {
  fail(`unexpected transcriptStatus: ${status.transcriptStatus}`);
}
if (status.transcriptionMode !== "faster_whisper_local_cpu_resumable_batch") fail("unexpected transcriptionMode");
if (status.sourceVideos !== expectedVideoCount) fail(`expected ${expectedVideoCount} source videos`);
if (status.transcribedRows < 0 || status.transcribedRows > expectedVideoCount) fail("transcribedRows out of range");
if (status.fullTranscriptRows < 0 || status.fullTranscriptRows > expectedVideoCount) fail("fullTranscriptRows out of range");
if (status.partialTranscriptRows < 0 || status.partialTranscriptRows > expectedVideoCount) fail("partialTranscriptRows out of range");
if (status.notStartedRows !== expectedVideoCount - status.transcribedRows) fail("notStartedRows drift");
if (status.semanticAbsorptionCompleteRows < 0 || status.semanticAbsorptionCompleteRows > expectedVideoCount) fail("semantic rows out of range");
if (status.semanticAbsorptionBlockedRows !== expectedVideoCount - status.semanticAbsorptionCompleteRows) fail("semantic blocked rows drift");
if (status.writeAllowedNow !== false || status.manualAuthorizationRequired !== true) fail("write gate must stay locked");

if (!Array.isArray(status.statusRows) || status.statusRows.length !== expectedVideoCount) fail("statusRows drift");
if (!status.statusRows.every((row) =>
  row.intakeId &&
  row.lessonCode &&
  row.lessonTitle &&
  row.sourceId &&
  row.relativePath &&
  row.transcriptStatus &&
  row.semanticAbsorptionStatus &&
  Number.isFinite(row.segments) &&
  Number.isFinite(row.charCount)
)) {
  fail("status row identity drift");
}
if (status.transcribedRows > 0 && !status.statusRows.some((row) => row.transcriptStatus === "partial_transcript_created" || row.transcriptStatus === "full_transcript_created")) {
  fail("transcribed row count lacks matching row");
}
if (!Array.isArray(status.commands) || !status.commands.some((command) => /check:local-video-course-transcript-status/.test(command))) {
  fail("commands must include transcript status check");
}

const boundaryText = `${status.boundary || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "private transcript",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
  "learner release",
  "production readiness",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  transcriptStatus: status.transcriptStatus,
  sourceVideos: status.sourceVideos,
  transcribedRows: status.transcribedRows,
  fullTranscriptRows: status.fullTranscriptRows,
  partialTranscriptRows: status.partialTranscriptRows,
  notStartedRows: status.notStartedRows,
  semanticAbsorptionCompleteRows: status.semanticAbsorptionCompleteRows,
  writeAllowedNow: status.writeAllowedNow,
}, null, 2));
