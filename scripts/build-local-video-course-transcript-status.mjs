import fs from "node:fs";
import path from "node:path";

const artifactPrefix = process.env.TRADEGYM_VIDEO_COURSE_ARTIFACT_PREFIX || "LOCAL_VIDEO_COURSE";
const intakePath = process.env.TRADEGYM_VIDEO_COURSE_INTAKE_JSON || `docs/${artifactPrefix}_KNOWLEDGE_INTAKE.json`;
const transcriptDir = process.env.TRADEGYM_VIDEO_COURSE_TRANSCRIPT_DIR || "docs/local-video-course-transcripts";
const outputJsonPath = process.env.TRADEGYM_VIDEO_COURSE_STATUS_JSON || `docs/${artifactPrefix}_TRANSCRIPT_STATUS.json`;
const outputMdPath = process.env.TRADEGYM_VIDEO_COURSE_STATUS_MD || `docs/${artifactPrefix}_TRANSCRIPT_STATUS.md`;

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const intake = readJson(intakePath);
if (intake.educationOnly !== true) fail("intake must keep educationOnly:true");
if (intake.productionReady !== false) fail("intake must keep productionReady:false");
const expectedVideoCount = intake.videoRows?.length || Number.parseInt(process.env.TRADEGYM_VIDEO_COURSE_EXPECTED_COUNT || "62", 10);
if (!Array.isArray(intake.videoRows) || intake.videoRows.length !== expectedVideoCount) fail(`expected ${expectedVideoCount} intake video rows`);

const transcriptFiles = fs.existsSync(transcriptDir)
  ? fs.readdirSync(transcriptDir).filter((file) => file.endsWith(".transcript.json"))
  : [];
const transcripts = transcriptFiles.map((file) => readJson(path.join(transcriptDir, file)));
const transcriptById = new Map(transcripts.map((row) => [row.intakeId, row]));

const statusRows = intake.videoRows.map((row) => {
  const transcript = transcriptById.get(row.intakeId);
  return {
    intakeId: row.intakeId,
    lessonCode: row.lessonCode,
    lessonTitle: row.lessonTitle,
    sourceId: row.sourceId,
    relativePath: row.relativePath,
    transcriptStatus: transcript?.transcriptStatus || "not_started",
    transcriptPath: transcript ? `${transcriptDir}/${row.intakeId}.transcript.json` : "",
    semanticAbsorptionStatus: transcript?.semanticAbsorptionStatus || "blocked_missing_transcript",
    isPartialTranscript: transcript?.isPartialTranscript || false,
    segments: Array.isArray(transcript?.segments) ? transcript.segments.length : 0,
    charCount: String(transcript?.text || "").length,
  };
});

const transcribedRows = statusRows.filter((row) => row.transcriptStatus === "partial_transcript_created" || row.transcriptStatus === "full_transcript_created");
const fullRows = statusRows.filter((row) => row.transcriptStatus === "full_transcript_created");
const partialRows = statusRows.filter((row) => row.transcriptStatus === "partial_transcript_created");
const semanticRows = statusRows.filter((row) => row.semanticAbsorptionStatus === "semantic_absorbed_private_research_only");

const status = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  transcriptStatus: fullRows.length === expectedVideoCount && semanticRows.length === expectedVideoCount
    ? "local_video_course_semantic_absorption_complete_release_blocked"
    : "local_video_course_transcription_in_progress_release_blocked",
  transcriptionMode: "faster_whisper_local_cpu_resumable_batch",
  sourceVideos: intake.videoRows.length,
  transcribedRows: transcribedRows.length,
  fullTranscriptRows: fullRows.length,
  partialTranscriptRows: partialRows.length,
  notStartedRows: intake.videoRows.length - transcribedRows.length,
  semanticAbsorptionCompleteRows: semanticRows.length,
  semanticAbsorptionBlockedRows: intake.videoRows.length - semanticRows.length,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  statusRows,
  commands: [
    "npm.cmd run transcribe:local-video-course:smoke",
    "npm.cmd run build:local-video-course-transcript-status",
    "npm.cmd run check:local-video-course-transcript-status",
    "npm.cmd run verify",
  ],
  boundary: "Local video course transcript status is reviewer-facing education-only operations material. It tracks private transcript and semantic absorption progress; it does not publish copied course material, approve learner-facing citations, generate trading advice, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(status, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Video Course Transcript Status",
  "",
  `- Transcript status: ${status.transcriptStatus}`,
  `- Source videos: ${status.sourceVideos}`,
  `- Transcribed rows: ${status.transcribedRows}`,
  `- Full transcript rows: ${status.fullTranscriptRows}`,
  `- Partial transcript rows: ${status.partialTranscriptRows}`,
  `- Not started rows: ${status.notStartedRows}`,
  `- Semantic absorption complete rows: ${status.semanticAbsorptionCompleteRows}`,
  `- Write allowed now: ${status.writeAllowedNow}`,
  "",
  "## Rows",
  "",
  "| Intake ID | Lesson | Transcript status | Partial | Segments | Chars |",
  "| --- | --- | --- | --- | ---: | ---: |",
  ...statusRows.map((row) => `| ${row.intakeId} | ${row.lessonCode} | ${row.transcriptStatus} | ${row.isPartialTranscript} | ${row.segments} | ${row.charCount} |`),
  "",
  "## Boundary",
  "",
  status.boundary,
  "",
].join("\n"), "utf8");

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
