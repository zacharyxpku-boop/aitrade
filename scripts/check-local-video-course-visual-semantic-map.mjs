import fs from "node:fs";

const artifactPrefix = process.env.TRADEGYM_VIDEO_COURSE_ARTIFACT_PREFIX || "LOCAL_VIDEO_COURSE";
const jsonPath = process.env.TRADEGYM_VIDEO_COURSE_VISUAL_SEMANTIC_JSON || `docs/${artifactPrefix}_VISUAL_SEMANTIC_MAP.json`;
const mdPath = process.env.TRADEGYM_VIDEO_COURSE_VISUAL_SEMANTIC_MD || `docs/${artifactPrefix}_VISUAL_SEMANTIC_MAP.md`;

function fail(message) { throw new Error(message); }
function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const artifact = readJson(jsonPath);
const expectedVideoCount = Number.parseInt(process.env.TRADEGYM_VIDEO_COURSE_EXPECTED_COUNT || String(artifact.sourceVideos || 62), 10);
if (!fs.existsSync(mdPath)) fail(`missing ${mdPath}`);
if (artifact.educationOnly !== true) fail("visual semantic map must keep educationOnly:true");
if (artifact.productionReady !== false) fail("visual semantic map must keep productionReady:false");
if (artifact.learnerFacingRelease !== false) fail("visual semantic map must keep learnerFacingRelease:false");
if (artifact.approvalStatus !== "not_approved") fail("visual semantic map must remain not_approved");
if (!["local_video_course_visual_semantic_map_in_progress_release_blocked", "local_video_course_visual_semantic_map_complete_release_blocked"].includes(artifact.visualSemanticStatus)) fail("unexpected visual semantic status");
if (artifact.sourceVideos !== expectedVideoCount) fail(`expected ${expectedVideoCount} source videos`);
if (!Array.isArray(artifact.rows) || artifact.rows.length !== artifact.visualSemanticRows) fail("visual semantic rows drift");
if (artifact.rowsWithFrames + artifact.blockedRows !== artifact.visualSemanticRows) fail("visual row coverage drift");
if (artifact.learnerFacingReadyRows !== 0) fail("learner-facing rows must stay zero");
if (artifact.writeAllowedNow !== false || artifact.manualAuthorizationRequired !== true) fail("write gate must stay locked");
for (const row of artifact.rows) {
  if (!row.visualSemanticId || !row.intakeId || !row.lessonCode) fail("visual semantic row missing identity");
  if (!Array.isArray(row.moduleTags) || !Array.isArray(row.conceptCandidates)) fail("visual semantic row missing knowledge links");
  if (!Array.isArray(row.sampleFrameRefs)) fail("visual semantic row missing frame refs");
  if (row.visualFrameCount > 0 && row.sampleFrameRefs.length === 0) fail("visual semantic row with frames must expose sample refs");
  if (row.learnerFacingRelease !== false || row.writeAllowedNow !== false) fail("visual semantic row boundary drift");
}
if (artifact.visualSemanticRows === expectedVideoCount && artifact.rowsWithFrames !== expectedVideoCount) fail("complete visual semantic map must have frame coverage for all videos");
const boundaryText = `${artifact.boundary || ""}`.toLowerCase();
for (const phrase of ["reviewer-facing education-only", "transcript windows", "knowledge candidates", "stock recommendations", "live signals", "return promises", "broker workflows", "automation", "real-money guidance", "learner release", "production readiness"]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}
console.log(JSON.stringify({
  ok: true,
  visualSemanticStatus: artifact.visualSemanticStatus,
  visualSemanticRows: artifact.visualSemanticRows,
  rowsWithFrames: artifact.rowsWithFrames,
  blockedRows: artifact.blockedRows,
  highRiskVisualRows: artifact.highRiskVisualRows,
  ocrBlockedRows: artifact.ocrBlockedRows,
  writeAllowedNow: artifact.writeAllowedNow,
}, null, 2));
