import fs from "node:fs";

const artifactPrefix = process.env.TRADEGYM_VIDEO_COURSE_ARTIFACT_PREFIX || "LOCAL_VIDEO_COURSE";
const jsonPath = process.env.TRADEGYM_VIDEO_COURSE_VISUAL_REVIEW_QUEUE_JSON || `docs/${artifactPrefix}_VISUAL_REVIEW_QUEUE.json`;
const mdPath = process.env.TRADEGYM_VIDEO_COURSE_VISUAL_REVIEW_QUEUE_MD || `docs/${artifactPrefix}_VISUAL_REVIEW_QUEUE.md`;

function fail(message) { throw new Error(message); }
function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const artifact = readJson(jsonPath);
const expectedVideoCount = Number.parseInt(process.env.TRADEGYM_VIDEO_COURSE_EXPECTED_COUNT || String(artifact.sourceVideos || 62), 10);
if (!fs.existsSync(mdPath)) fail(`missing ${mdPath}`);
if (artifact.educationOnly !== true) fail("visual review queue must keep educationOnly:true");
if (artifact.productionReady !== false) fail("visual review queue must keep productionReady:false");
if (artifact.learnerFacingRelease !== false) fail("visual review queue must keep learnerFacingRelease:false");
if (artifact.approvalStatus !== "not_approved") fail("visual review queue must remain not_approved");
if (!["local_video_course_visual_review_queue_in_progress_release_blocked", "local_video_course_visual_review_queue_all_frames_ready_release_blocked"].includes(artifact.queueStatus)) fail("unexpected visual queue status");
if (artifact.sourceVideos !== expectedVideoCount) fail(`expected ${expectedVideoCount} source videos`);
if (!Array.isArray(artifact.rows) || artifact.rows.length !== artifact.queueRows) fail("queue rows drift");
if (artifact.readyRows + artifact.blockedRows !== artifact.queueRows) fail("ready/blocked queue drift");
if (artifact.learnerFacingReadyRows !== 0) fail("learner-facing rows must stay zero");
if (artifact.writeAllowedNow !== false || artifact.manualAuthorizationRequired !== true) fail("write gate must stay locked");
for (const row of artifact.rows) {
  if (!row.queueId || !row.intakeId || !row.lessonCode) fail("visual queue row missing identity");
  if (!["p0", "p1", "blocked"].includes(row.reviewPriority)) fail("unexpected review priority");
  if (!Array.isArray(row.requiredChecks) || !row.requiredChecks.includes("no_trading_advice_check")) fail("required checks must include no trading advice");
  if (row.learnerFacingRelease !== false || row.writeAllowedNow !== false) fail("visual queue row boundary drift");
}
if (artifact.queueRows === expectedVideoCount && artifact.readyRows !== expectedVideoCount) fail(`complete visual queue must have ${expectedVideoCount} ready rows`);
const boundaryText = `${artifact.boundary || ""}`.toLowerCase();
for (const phrase of ["reviewer-facing education-only", "private course screenshots", "stock recommendations", "live signals", "return promises", "broker workflows", "automation", "real-money guidance", "learner release", "production readiness"]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}
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
