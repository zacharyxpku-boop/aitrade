import fs from "node:fs";

const artifactPrefix = process.env.TRADEGYM_VIDEO_COURSE_ARTIFACT_PREFIX || "LOCAL_VIDEO_COURSE";
const jsonPath = process.env.TRADEGYM_VIDEO_COURSE_DELETE_READINESS_JSON || `docs/${artifactPrefix}_DELETE_READINESS_AFTER_VISUAL_AUDIT.json`;
const mdPath = process.env.TRADEGYM_VIDEO_COURSE_DELETE_READINESS_MD || `docs/${artifactPrefix}_DELETE_READINESS_AFTER_VISUAL_AUDIT.md`;

function fail(message) { throw new Error(message); }
function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const artifact = readJson(jsonPath);
const expectedVideoCount = Number.parseInt(process.env.TRADEGYM_VIDEO_COURSE_EXPECTED_COUNT || String(artifact.sourceVideos || 62), 10);
if (!fs.existsSync(mdPath)) fail(`missing ${mdPath}`);
if (artifact.educationOnly !== true) fail("delete readiness must keep educationOnly:true");
if (artifact.productionReady !== false) fail("delete readiness must keep productionReady:false");
if (artifact.learnerFacingRelease !== false) fail("delete readiness must keep learnerFacingRelease:false");
if (artifact.approvalStatus !== "not_approved") fail("delete readiness must remain not_approved");
if (!["local_video_course_original_videos_retain_until_visual_audit_complete", "local_video_course_original_videos_may_be_removed_after_visual_audit_verified_manual_only"].includes(artifact.readinessStatus)) fail("unexpected readiness status");
if (artifact.sourceVideos !== expectedVideoCount) fail(`expected ${expectedVideoCount} source videos`);
if (artifact.deleteExecutedNow !== false || artifact.manualDeletionOnly !== true) fail("delete readiness must not delete files automatically");
if (artifact.learnerFacingReadyRows !== 0) fail("learner-facing rows must stay zero");
if (artifact.writeAllowedNow !== false || artifact.manualAuthorizationRequired !== true) fail("write gate must stay locked");
if (!Array.isArray(artifact.deletionWouldLose) || artifact.deletionWouldLose.length < 4) fail("deletion loss list incomplete");
if (artifact.visualComplete === true && artifact.visualIndexedVideos !== expectedVideoCount) fail(`visual complete requires ${expectedVideoCount} indexed videos`);
if (artifact.readinessStatus.includes("may_be_removed") && artifact.visualComplete !== true) fail("removal readiness requires visual completion");
const boundaryText = `${artifact.boundary || ""}`.toLowerCase();
for (const phrase of ["reviewer-facing education-only", "never deletes files automatically", "stock recommendations", "live signals", "return promises", "broker workflows", "automation", "real-money guidance", "learner release", "production readiness"]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}
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
