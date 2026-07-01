import fs from "node:fs";

const artifactPrefix = process.env.TRADEGYM_VIDEO_COURSE_ARTIFACT_PREFIX || "LOCAL_VIDEO_COURSE";
const queuePath = process.env.TRADEGYM_VIDEO_COURSE_REVIEW_QUEUE_JSON || `docs/${artifactPrefix}_REVIEW_QUEUE.json`;
const mdPath = process.env.TRADEGYM_VIDEO_COURSE_REVIEW_QUEUE_MD || `docs/${artifactPrefix}_REVIEW_QUEUE.md`;

function fail(message) { throw new Error(message); }
function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const queue = readJson(queuePath);
const expectedVideoCount = Number.parseInt(process.env.TRADEGYM_VIDEO_COURSE_EXPECTED_COUNT || String(queue.sourceVideos || 62), 10);
if (!fs.existsSync(mdPath)) fail(`missing ${mdPath}`);
if (queue.educationOnly !== true) fail("queue must keep educationOnly:true");
if (queue.productionReady !== false) fail("queue must keep productionReady:false");
if (queue.learnerFacingRelease !== false) fail("queue must keep learnerFacingRelease:false");
if (queue.approvalStatus !== "not_approved") fail("queue must remain not_approved");
if (!["local_video_course_review_queue_in_progress_release_blocked", "local_video_course_review_queue_all_transcripts_ready_release_blocked"].includes(queue.queueStatus)) fail("unexpected queueStatus");
if (queue.queueMode !== "video_semantic_absorption_to_human_review_queue") fail("unexpected queueMode");
if (queue.sourceVideos !== expectedVideoCount || queue.queueRows !== expectedVideoCount) fail(`queue must cover ${expectedVideoCount} videos`);
if (queue.readyRows + queue.blockedRows !== expectedVideoCount) fail("ready + blocked rows drift");
if (queue.p0Rows < 10) fail("expected P0 rows");
if (queue.learnerFacingReadyRows !== 0) fail("learner-facing rows must stay zero");
if (queue.writeAllowedNow !== false || queue.manualAuthorizationRequired !== true) fail("write gate must stay locked");
if (!Array.isArray(queue.rows) || queue.rows.length !== expectedVideoCount) fail("rows drift");
if (!queue.rows.every((row) => row.queueId && row.intakeId && row.lessonCode && row.reviewPriority && row.reviewStatus && Array.isArray(row.requiredChecks) && row.learnerFacingRelease === false && row.writeAllowedNow === false)) {
  fail("review row identity or boundary drift");
}
if (!queue.rows.some((row) => row.reviewPriority === "p0" && row.requiredChecks.includes("risk_language_check"))) fail("P0 risk checks missing");
const boundaryText = `${queue.boundary || ""}`.toLowerCase();
for (const phrase of ["reviewer-facing education-only", "human review", "stock recommendations", "live signals", "return promises", "broker workflows", "automation", "real-money guidance", "learner release", "production readiness"]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}
console.log(JSON.stringify({
  ok: true,
  queueStatus: queue.queueStatus,
  sourceVideos: queue.sourceVideos,
  readyRows: queue.readyRows,
  p0Rows: queue.p0Rows,
  blockedRows: queue.blockedRows,
  writeAllowedNow: queue.writeAllowedNow,
}, null, 2));
