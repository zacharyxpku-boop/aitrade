import fs from "node:fs";

const artifactPrefix = process.env.TRADEGYM_VIDEO_COURSE_ARTIFACT_PREFIX || "LOCAL_VIDEO_COURSE";
const jsonPath = process.env.TRADEGYM_VIDEO_COURSE_VISUAL_FRAME_INDEX_JSON || `docs/${artifactPrefix}_VISUAL_FRAME_INDEX.json`;
const mdPath = process.env.TRADEGYM_VIDEO_COURSE_VISUAL_FRAME_INDEX_MD || `docs/${artifactPrefix}_VISUAL_FRAME_INDEX.md`;

function fail(message) { throw new Error(message); }
function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const artifact = readJson(jsonPath);
const expectedVideoCount = Number.parseInt(process.env.TRADEGYM_VIDEO_COURSE_EXPECTED_COUNT || String(artifact.sourceVideos || 62), 10);
if (!fs.existsSync(mdPath)) fail(`missing ${mdPath}`);
if (artifact.educationOnly !== true) fail("visual frame index must keep educationOnly:true");
if (artifact.productionReady !== false) fail("visual frame index must keep productionReady:false");
if (artifact.learnerFacingRelease !== false) fail("visual frame index must keep learnerFacingRelease:false");
if (artifact.approvalStatus !== "not_approved") fail("visual frame index must remain not_approved");
if (!["local_video_course_visual_frame_index_in_progress_release_blocked", "local_video_course_visual_frame_index_complete_release_blocked"].includes(artifact.visualFrameIndexStatus)) fail("unexpected visual frame index status");
if (artifact.sourceVideos !== expectedVideoCount) fail(`expected ${expectedVideoCount} source videos`);
if (!Number.isInteger(artifact.indexedVideos) || artifact.indexedVideos < 1 || artifact.indexedVideos > expectedVideoCount) fail("indexed video count drift");
if (!Number.isInteger(artifact.frameRows) || artifact.frameRows < artifact.indexedVideos) fail("frame row count must cover indexed videos");
if (artifact.learnerFacingReadyRows !== 0) fail("learner-facing rows must stay zero");
if (artifact.writeAllowedNow !== false || artifact.manualAuthorizationRequired !== true) fail("write gate must stay locked");
if (!Array.isArray(artifact.videoRows) || artifact.videoRows.length !== artifact.indexedVideos) fail("video rows drift");
if (!Array.isArray(artifact.frames) || artifact.frames.length !== artifact.frameRows) fail("frame rows drift");
for (const row of artifact.videoRows) {
  if (!row.intakeId || !row.lessonCode) fail("video row missing identity");
  if (row.learnerFacingRelease !== false || row.writeAllowedNow !== false) fail("video row boundary drift");
}
for (const frame of artifact.frames) {
  if (!frame.frameId || !frame.intakeId || !frame.imagePath || !frame.imageSha256 || !frame.sourceVideoSha256) fail("frame row missing identity or hashes");
  if (!fs.existsSync(frame.imagePath)) fail(`missing frame image ${frame.imagePath}`);
  if (!Array.isArray(frame.visualTags) || frame.visualTags.length === 0) fail("frame row missing visual tags");
  if (!Array.isArray(frame.transcriptWindow)) fail("frame row missing transcript window");
  if (frame.learnerFacingRelease !== false || frame.writeAllowedNow !== false) fail("frame row boundary drift");
}
if (artifact.indexedVideos === expectedVideoCount && artifact.videosWithFrames !== expectedVideoCount) fail("complete index must have frames for all videos");
const boundaryText = `${artifact.boundary || ""}`.toLowerCase();
for (const phrase of ["reviewer-facing education-only", "private videos", "stock recommendations", "live signals", "return promises", "broker workflows", "automation", "real-money guidance", "learner release", "production readiness"]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}
console.log(JSON.stringify({
  ok: true,
  visualFrameIndexStatus: artifact.visualFrameIndexStatus,
  indexedVideos: artifact.indexedVideos,
  frameRows: artifact.frameRows,
  videosWithFrames: artifact.videosWithFrames,
  videosBlockedNoFrames: artifact.videosBlockedNoFrames,
  ocrEngineAvailable: artifact.ocrEngineAvailable,
  ocrBlockedRows: artifact.ocrBlockedRows,
  writeAllowedNow: artifact.writeAllowedNow,
}, null, 2));
