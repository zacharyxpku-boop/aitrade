import fs from "node:fs";

const artifactPrefix = process.env.TRADEGYM_VIDEO_COURSE_ARTIFACT_PREFIX || "LOCAL_VIDEO_COURSE";
const visualMapPath = process.env.TRADEGYM_VIDEO_COURSE_VISUAL_SEMANTIC_JSON || `docs/${artifactPrefix}_VISUAL_SEMANTIC_MAP.json`;
const outputJsonPath = process.env.TRADEGYM_VIDEO_COURSE_VISUAL_REVIEW_QUEUE_JSON || `docs/${artifactPrefix}_VISUAL_REVIEW_QUEUE.json`;
const outputMdPath = process.env.TRADEGYM_VIDEO_COURSE_VISUAL_REVIEW_QUEUE_MD || `docs/${artifactPrefix}_VISUAL_REVIEW_QUEUE.md`;

function fail(message) { throw new Error(message); }
function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const visualMap = readJson(visualMapPath);
if (visualMap.educationOnly !== true) fail("visual map must keep educationOnly:true");
if (visualMap.productionReady !== false) fail("visual map must keep productionReady:false");
if (visualMap.learnerFacingRelease !== false) fail("visual map must keep learnerFacingRelease:false");

const expectedVideoCount = visualMap.sourceVideos || visualMap.rows?.length || Number.parseInt(process.env.TRADEGYM_VIDEO_COURSE_EXPECTED_COUNT || "62", 10);
const rows = visualMap.rows.map((row) => {
  const blocked = row.visualFrameCount === 0;
  const priority = blocked ? "blocked" : (row.highRiskVisual ? "p0" : "p1");
  return {
    queueId: `visual_review_${row.intakeId}`,
    intakeId: row.intakeId,
    lessonCode: row.lessonCode,
    lessonTitle: row.lessonTitle,
    reviewPriority: priority,
    reviewStatus: blocked
      ? "blocked_missing_visual_frames"
      : (row.highRiskVisual ? "ready_for_p0_visual_human_review" : "ready_for_standard_visual_review"),
    visualFrameCount: row.visualFrameCount,
    visualTags: row.visualTags,
    ocrStatus: row.ocrStatus,
    requiredChecks: row.highRiskVisual
      ? ["chart_context_check", "risk_language_check", "manual_ocr_or_visual_note_check", "no_trading_advice_check", "public_grounding_check"]
      : ["chart_context_check", "manual_ocr_or_visual_note_check", "no_trading_advice_check", "public_grounding_check"],
    learnerFacingRelease: false,
    writeAllowedNow: false,
    nextGate: blocked
      ? "extract_visual_frames_then_requeue"
      : "human_visual_notes_then_public_grounding_source_fit",
  };
});

const artifact = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  queueStatus: rows.length === expectedVideoCount && rows.every((row) => row.reviewStatus !== "blocked_missing_visual_frames")
    ? "local_video_course_visual_review_queue_all_frames_ready_release_blocked"
    : "local_video_course_visual_review_queue_in_progress_release_blocked",
  queueMode: "visual_semantic_rows_to_human_visual_review_queue",
  sourceVideos: expectedVideoCount,
  queueRows: rows.length,
  readyRows: rows.filter((row) => row.reviewStatus.startsWith("ready_")).length,
  p0Rows: rows.filter((row) => row.reviewPriority === "p0").length,
  blockedRows: rows.filter((row) => row.reviewPriority === "blocked").length,
  ocrBlockedRows: rows.filter((row) => row.ocrStatus !== "ocr_completed_for_some_frames").length,
  learnerFacingReadyRows: 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  rows,
  commands: [
    "npm.cmd run build:local-video-course-visual-review-queue",
    "npm.cmd run check:local-video-course-visual-review-queue",
    "npm.cmd run verify",
  ],
  boundary: "Local video course visual review queue is reviewer-facing education-only operations material. It queues private course screenshots for human visual review and public grounding; it does not publish copied frames, approve learner-facing citations, generate trading advice, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Video Course Visual Review Queue",
  "",
  `- Queue status: ${artifact.queueStatus}`,
  `- Ready rows: ${artifact.readyRows}`,
  `- P0 rows: ${artifact.p0Rows}`,
  `- Blocked rows: ${artifact.blockedRows}`,
  `- OCR blocked rows: ${artifact.ocrBlockedRows}`,
  `- Write allowed now: ${artifact.writeAllowedNow}`,
  "",
  "## Rows",
  "",
  "| Queue ID | Lesson | Priority | Status | Frames | OCR |",
  "| --- | --- | --- | --- | ---: | --- |",
  ...artifact.rows.map((row) => `| ${row.queueId} | ${row.lessonCode} | ${row.reviewPriority} | ${row.reviewStatus} | ${row.visualFrameCount} | ${row.ocrStatus} |`),
  "",
  "## Boundary",
  "",
  artifact.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  queueStatus: artifact.queueStatus,
  queueRows: artifact.queueRows,
  readyRows: artifact.readyRows,
  p0Rows: artifact.p0Rows,
  blockedRows: artifact.blockedRows,
  ocrBlockedRows: artifact.ocrBlockedRows,
  writeAllowedNow: artifact.writeAllowedNow,
}, null, 2));
