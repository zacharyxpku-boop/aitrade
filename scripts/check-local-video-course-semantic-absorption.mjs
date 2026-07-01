import fs from "node:fs";

const artifactPrefix = process.env.TRADEGYM_VIDEO_COURSE_ARTIFACT_PREFIX || "LOCAL_VIDEO_COURSE";
const mapPath = process.env.TRADEGYM_VIDEO_COURSE_SEMANTIC_JSON || `docs/${artifactPrefix}_SEMANTIC_ABSORPTION_MAP.json`;
const mdPath = process.env.TRADEGYM_VIDEO_COURSE_SEMANTIC_MD || `docs/${artifactPrefix}_SEMANTIC_ABSORPTION_MAP.md`;

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const map = readJson(mapPath);
const expectedVideoCount = Number.parseInt(process.env.TRADEGYM_VIDEO_COURSE_EXPECTED_COUNT || String(map.sourceVideos || 62), 10);
if (!fs.existsSync(mdPath)) fail(`missing ${mdPath}`);

if (map.educationOnly !== true) fail("map must keep educationOnly:true");
if (map.productionReady !== false) fail("map must keep productionReady:false");
if (map.learnerFacingRelease !== false) fail("map must keep learnerFacingRelease:false");
if (map.approvalStatus !== "not_approved") fail("map must remain not_approved");
if (!["local_video_course_semantic_absorption_in_progress_release_blocked", "local_video_course_semantic_absorption_complete_release_blocked"].includes(map.absorptionStatus)) {
  fail(`unexpected absorptionStatus: ${map.absorptionStatus}`);
}
if (map.absorptionMode !== "private_transcript_to_reviewer_knowledge_semantic_index") fail("unexpected absorptionMode");
if (map.sourceVideos !== expectedVideoCount) fail(`expected ${expectedVideoCount} source videos`);
if (map.fullTranscriptRows < 0 || map.fullTranscriptRows > expectedVideoCount) fail("fullTranscriptRows out of range");
if (map.semanticAbsorbedRows !== map.fullTranscriptRows) fail("semantic rows must track full transcript rows");
if (map.blockedMissingFullTranscriptRows !== expectedVideoCount - map.fullTranscriptRows) fail("blocked row count drift");
if (map.p0HumanReviewRows < 10) fail("expected P0 human review rows");
if (map.learnerFacingReadyRows !== 0) fail("learner-facing rows must stay zero");
if (map.writeAllowedNow !== false || map.manualAuthorizationRequired !== true) fail("write gate must stay locked");

if (!Array.isArray(map.moduleRows) || map.moduleRows.length < 10) fail("moduleRows too small");
if (!Array.isArray(map.semanticRows) || map.semanticRows.length !== expectedVideoCount) fail("semanticRows drift");
if (!map.semanticRows.every((row) =>
  row.semanticId &&
  row.intakeId &&
  row.sourceId &&
  row.lessonCode &&
  row.lessonTitle &&
  Array.isArray(row.moduleTags) &&
  Array.isArray(row.conceptCandidates) &&
  row.conceptCandidates.length >= 1 &&
  row.reviewRisk &&
  row.transcriptStatus &&
  typeof row.hasFullTranscript === "boolean" &&
  Array.isArray(row.evidenceAnchors) &&
  row.learnerFacingRelease === false &&
  row.writeAllowedNow === false
)) {
  fail("semantic row identity or boundary drift");
}
if (map.fullTranscriptRows > 0 && !map.semanticRows.some((row) => row.semanticAbsorptionStatus === "semantic_absorbed_private_research_only" && row.evidenceAnchors.length > 0)) {
  fail("absorbed full transcript rows must include evidence anchors");
}
if (!Array.isArray(map.commands) || !map.commands.some((command) => /check:local-video-course-semantic-absorption/.test(command))) {
  fail("commands must include semantic absorption check");
}

const boundaryText = `${map.boundary || ""} ${map.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "private research",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
  "learner release",
  "production readiness",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary/completion missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  absorptionStatus: map.absorptionStatus,
  sourceVideos: map.sourceVideos,
  fullTranscriptRows: map.fullTranscriptRows,
  semanticAbsorbedRows: map.semanticAbsorbedRows,
  blockedMissingFullTranscriptRows: map.blockedMissingFullTranscriptRows,
  p0HumanReviewRows: map.p0HumanReviewRows,
  writeAllowedNow: map.writeAllowedNow,
}, null, 2));
