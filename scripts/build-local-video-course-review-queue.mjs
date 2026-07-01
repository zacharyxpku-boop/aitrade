import fs from "node:fs";

const artifactPrefix = process.env.TRADEGYM_VIDEO_COURSE_ARTIFACT_PREFIX || "LOCAL_VIDEO_COURSE";
const semanticMapPath = process.env.TRADEGYM_VIDEO_COURSE_SEMANTIC_JSON || `docs/${artifactPrefix}_SEMANTIC_ABSORPTION_MAP.json`;
const candidatesPath = process.env.TRADEGYM_VIDEO_COURSE_CANDIDATES_JSON || `docs/${artifactPrefix}_KNOWLEDGE_NODE_CANDIDATES.json`;
const outputJsonPath = process.env.TRADEGYM_VIDEO_COURSE_REVIEW_QUEUE_JSON || `docs/${artifactPrefix}_REVIEW_QUEUE.json`;
const outputMdPath = process.env.TRADEGYM_VIDEO_COURSE_REVIEW_QUEUE_MD || `docs/${artifactPrefix}_REVIEW_QUEUE.md`;

function fail(message) { throw new Error(message); }
function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const semanticMap = readJson(semanticMapPath);
const candidates = readJson(candidatesPath);
if (semanticMap.educationOnly !== true || candidates.educationOnly !== true) fail("inputs must keep educationOnly:true");
if (semanticMap.productionReady !== false || candidates.productionReady !== false) fail("inputs must keep productionReady:false");

const queueRows = semanticMap.semanticRows.map((row) => {
  const candidateCount = candidates.candidates.filter((candidate) => candidate.intakeId === row.intakeId).length;
  const needsP0 = row.reviewRisk === "p0_human_review_required";
  return {
    queueId: `video_review_${row.intakeId}`,
    intakeId: row.intakeId,
    lessonCode: row.lessonCode,
    lessonTitle: row.lessonTitle,
    reviewPriority: needsP0 ? "p0" : (row.hasFullTranscript ? "p1" : "blocked"),
    reviewStatus: row.hasFullTranscript
      ? (needsP0 ? "ready_for_p0_human_review" : "ready_for_standard_reviewer_distillation")
      : "blocked_missing_full_transcript",
    candidateCount,
    evidenceAnchorCount: row.evidenceAnchors.length,
    requiredChecks: needsP0
      ? ["transcript_quality_check", "risk_language_check", "public_grounding_check", "no_trading_advice_check", "source_fit_review"]
      : ["transcript_quality_check", "public_grounding_check", "no_trading_advice_check", "source_fit_review"],
    learnerFacingRelease: false,
    writeAllowedNow: false,
    nextGate: row.hasFullTranscript
      ? "human_review_notes_then_public_grounding_source_fit"
      : "finish_full_transcript_then_queue_review",
  };
});

const readyRows = queueRows.filter((row) => row.reviewStatus.startsWith("ready_"));
const p0Rows = queueRows.filter((row) => row.reviewPriority === "p0");
const blockedRows = queueRows.filter((row) => row.reviewStatus === "blocked_missing_full_transcript");

const queue = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  queueStatus: blockedRows.length === 0
    ? "local_video_course_review_queue_all_transcripts_ready_release_blocked"
    : "local_video_course_review_queue_in_progress_release_blocked",
  queueMode: "video_semantic_absorption_to_human_review_queue",
  sourceVideos: semanticMap.sourceVideos,
  queueRows: queueRows.length,
  readyRows: readyRows.length,
  p0Rows: p0Rows.length,
  blockedRows: blockedRows.length,
  learnerFacingReadyRows: 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  rows: queueRows,
  commands: [
    "npm.cmd run build:local-video-course-review-queue",
    "npm.cmd run check:local-video-course-review-queue",
    "npm.cmd run verify",
  ],
  boundary: "Local video course review queue is reviewer-facing education-only operations material. It queues private transcript-derived semantic rows for human review and public grounding; it does not publish copied course material, approve learner-facing citations, generate trading advice, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(queue, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Video Course Review Queue",
  "",
  `- Queue status: ${queue.queueStatus}`,
  `- Source videos: ${queue.sourceVideos}`,
  `- Ready rows: ${queue.readyRows}`,
  `- P0 rows: ${queue.p0Rows}`,
  `- Blocked rows: ${queue.blockedRows}`,
  `- Write allowed now: ${queue.writeAllowedNow}`,
  "",
  "## Rows",
  "",
  "| Queue ID | Lesson | Priority | Status | Candidates | Anchors |",
  "| --- | --- | --- | --- | ---: | ---: |",
  ...queue.rows.map((row) => `| ${row.queueId} | ${row.lessonCode} | ${row.reviewPriority} | ${row.reviewStatus} | ${row.candidateCount} | ${row.evidenceAnchorCount} |`),
  "",
  "## Boundary",
  "",
  queue.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  queueStatus: queue.queueStatus,
  sourceVideos: queue.sourceVideos,
  readyRows: queue.readyRows,
  p0Rows: queue.p0Rows,
  blockedRows: queue.blockedRows,
  writeAllowedNow: queue.writeAllowedNow,
}, null, 2));
