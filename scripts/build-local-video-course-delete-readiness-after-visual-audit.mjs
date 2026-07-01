import fs from "node:fs";

const artifactPrefix = process.env.TRADEGYM_VIDEO_COURSE_ARTIFACT_PREFIX || "LOCAL_VIDEO_COURSE";
const transcriptPath = process.env.TRADEGYM_VIDEO_COURSE_STATUS_JSON || `docs/${artifactPrefix}_TRANSCRIPT_STATUS.json`;
const semanticPath = process.env.TRADEGYM_VIDEO_COURSE_SEMANTIC_JSON || `docs/${artifactPrefix}_SEMANTIC_ABSORPTION_MAP.json`;
const visualFramePath = process.env.TRADEGYM_VIDEO_COURSE_VISUAL_FRAME_INDEX_JSON || `docs/${artifactPrefix}_VISUAL_FRAME_INDEX.json`;
const visualMapPath = process.env.TRADEGYM_VIDEO_COURSE_VISUAL_SEMANTIC_JSON || `docs/${artifactPrefix}_VISUAL_SEMANTIC_MAP.json`;
const visualQueuePath = process.env.TRADEGYM_VIDEO_COURSE_VISUAL_REVIEW_QUEUE_JSON || `docs/${artifactPrefix}_VISUAL_REVIEW_QUEUE.json`;
const outputJsonPath = process.env.TRADEGYM_VIDEO_COURSE_DELETE_READINESS_JSON || `docs/${artifactPrefix}_DELETE_READINESS_AFTER_VISUAL_AUDIT.json`;
const outputMdPath = process.env.TRADEGYM_VIDEO_COURSE_DELETE_READINESS_MD || `docs/${artifactPrefix}_DELETE_READINESS_AFTER_VISUAL_AUDIT.md`;

function fail(message) { throw new Error(message); }
function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const artifacts = {
  transcript: readJson(transcriptPath),
  semantic: readJson(semanticPath),
  visualFrame: readJson(visualFramePath),
  visualMap: readJson(visualMapPath),
  visualQueue: readJson(visualQueuePath),
};
for (const [name, artifact] of Object.entries(artifacts)) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
}

const expectedVideoCount = artifacts.transcript.sourceVideos || artifacts.semantic.sourceVideos || artifacts.visualFrame.sourceVideos || Number.parseInt(process.env.TRADEGYM_VIDEO_COURSE_EXPECTED_COUNT || "62", 10);
const transcriptComplete = artifacts.transcript.fullTranscriptRows === expectedVideoCount && artifacts.transcript.partialTranscriptRows === 0 && artifacts.transcript.notStartedRows === 0;
const semanticComplete = artifacts.semantic.semanticAbsorbedRows === expectedVideoCount && artifacts.semantic.blockedMissingFullTranscriptRows === 0;
const visualComplete = artifacts.visualFrame.indexedVideos === expectedVideoCount
  && artifacts.visualFrame.videosWithFrames === expectedVideoCount
  && artifacts.visualMap.rowsWithFrames === expectedVideoCount
  && artifacts.visualQueue.readyRows === expectedVideoCount;
const ocrUnavailable = artifacts.visualFrame.ocrEngineAvailable !== true;

const readinessStatus = transcriptComplete && semanticComplete && visualComplete
  ? "local_video_course_original_videos_may_be_removed_after_visual_audit_verified_manual_only"
  : "local_video_course_original_videos_retain_until_visual_audit_complete";
const recommendation = transcriptComplete && semanticComplete && visualComplete && !ocrUnavailable
  ? "may_delete_original_videos_after_separate_user_authorization"
  : (transcriptComplete && semanticComplete && visualComplete
      ? "may_delete_if_user_accepts_ocr_unavailable_limitation_otherwise_retain_for_future_ocr"
      : "do_not_delete_yet_visual_audit_incomplete");

const artifact = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  readinessStatus,
  recommendation,
  sourceVideos: expectedVideoCount,
  transcriptComplete,
  semanticComplete,
  visualComplete,
  fullTranscriptRows: artifacts.transcript.fullTranscriptRows,
  semanticAbsorbedRows: artifacts.semantic.semanticAbsorbedRows,
  visualIndexedVideos: artifacts.visualFrame.indexedVideos,
  visualRowsWithFrames: artifacts.visualMap.rowsWithFrames,
  visualReviewReadyRows: artifacts.visualQueue.readyRows,
  ocrEngineAvailable: artifacts.visualFrame.ocrEngineAvailable,
  ocrLimitation: ocrUnavailable ? "OCR engine unavailable; visual frames and heuristic tags are retained for human review or future OCR." : "",
  deletionWouldLose: [
    "ability_to_rerun_higher_accuracy_transcription_from_original_video",
    "ability_to_extract_more_or_different_chart_frames",
    "ability_to_verify_original_private_video_provenance_or_copyright_context",
    "ability_to_run_future_ocr_or_visual_models_on_source_video",
  ],
  manualDeletionOnly: true,
  deleteExecutedNow: false,
  learnerFacingReadyRows: 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  commands: [
    "npm.cmd run build:local-video-course-delete-readiness-after-visual-audit",
    "npm.cmd run check:local-video-course-delete-readiness-after-visual-audit",
    "npm.cmd run verify",
  ],
  boundary: "Local video course delete readiness after visual audit is reviewer-facing education-only governance. It may advise manual removal of original private videos after verified transcript, semantic, and visual coverage, but it never deletes files automatically, never publishes copied frames, never approves learner-facing release, and never provides trading advice, stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Video Course Delete Readiness After Visual Audit",
  "",
  `- Readiness status: ${artifact.readinessStatus}`,
  `- Recommendation: ${artifact.recommendation}`,
  `- Transcript complete: ${artifact.transcriptComplete}`,
  `- Semantic complete: ${artifact.semanticComplete}`,
  `- Visual complete: ${artifact.visualComplete}`,
  `- Visual indexed videos: ${artifact.visualIndexedVideos}/${artifact.sourceVideos}`,
  `- OCR engine available: ${artifact.ocrEngineAvailable}`,
  `- Delete executed now: ${artifact.deleteExecutedNow}`,
  `- Manual deletion only: ${artifact.manualDeletionOnly}`,
  `- Write allowed now: ${artifact.writeAllowedNow}`,
  "",
  "## Deletion Would Lose",
  "",
  ...artifact.deletionWouldLose.map((item) => `- ${item}`),
  "",
  "## Boundary",
  "",
  artifact.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  readinessStatus: artifact.readinessStatus,
  recommendation: artifact.recommendation,
  transcriptComplete: artifact.transcriptComplete,
  semanticComplete: artifact.semanticComplete,
  visualComplete: artifact.visualComplete,
  visualIndexedVideos: artifact.visualIndexedVideos,
  visualReviewReadyRows: artifact.visualReviewReadyRows,
  ocrEngineAvailable: artifact.ocrEngineAvailable,
  deleteExecutedNow: artifact.deleteExecutedNow,
  writeAllowedNow: artifact.writeAllowedNow,
}, null, 2));
