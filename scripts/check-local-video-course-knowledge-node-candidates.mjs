import fs from "node:fs";

const artifactPrefix = process.env.TRADEGYM_VIDEO_COURSE_ARTIFACT_PREFIX || "LOCAL_VIDEO_COURSE";
const artifactPath = process.env.TRADEGYM_VIDEO_COURSE_CANDIDATES_JSON || `docs/${artifactPrefix}_KNOWLEDGE_NODE_CANDIDATES.json`;
const mdPath = process.env.TRADEGYM_VIDEO_COURSE_CANDIDATES_MD || `docs/${artifactPrefix}_KNOWLEDGE_NODE_CANDIDATES.md`;

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const artifact = readJson(artifactPath);
const expectedVideoCount = Number.parseInt(process.env.TRADEGYM_VIDEO_COURSE_EXPECTED_COUNT || String(artifact.sourceVideos || 62), 10);
if (!fs.existsSync(mdPath)) fail(`missing ${mdPath}`);

if (artifact.educationOnly !== true) fail("artifact must keep educationOnly:true");
if (artifact.productionReady !== false) fail("artifact must keep productionReady:false");
if (artifact.learnerFacingRelease !== false) fail("artifact must keep learnerFacingRelease:false");
if (artifact.approvalStatus !== "not_approved") fail("artifact must remain not_approved");
if (!["local_video_course_node_candidates_in_progress_release_blocked", "local_video_course_node_candidates_complete_release_blocked"].includes(artifact.candidateStatus)) {
  fail(`unexpected candidateStatus: ${artifact.candidateStatus}`);
}
if (artifact.candidateMode !== "private_video_semantic_rows_to_reviewer_knowledge_node_candidates") fail("unexpected candidateMode");
if (artifact.sourceVideos !== expectedVideoCount) fail(`expected ${expectedVideoCount} source videos`);
if (artifact.candidateRows < artifact.semanticAbsorbedRows) fail("candidate rows should cover absorbed rows");
if (artifact.uniqueConcepts < 1 && artifact.semanticAbsorbedRows > 0) fail("unique concepts missing");
if (artifact.learnerFacingReadyRows !== 0) fail("learner-facing rows must stay zero");
if (artifact.writeAllowedNow !== false || artifact.manualAuthorizationRequired !== true) fail("write gate must stay locked");
if (!Array.isArray(artifact.candidates)) fail("candidates must be present");
if (artifact.candidates.length !== artifact.candidateRows) fail("candidate count drift");
if (!artifact.candidates.every((row) =>
  row.candidateId &&
  row.intakeId &&
  row.semanticId &&
  row.sourceId &&
  row.lessonCode &&
  row.concept &&
  row.nodeType &&
  Array.isArray(row.moduleTags) &&
  row.evidenceAnchorCount >= 1 &&
  row.learnerFacingRelease === false &&
  row.productionReady === false &&
  row.reviewStatus
)) {
  fail("candidate row identity or boundary drift");
}
if (!Array.isArray(artifact.commands) || !artifact.commands.some((command) => /check:local-video-course-knowledge-node-candidates/.test(command))) {
  fail("commands must include candidate check");
}

const boundaryText = `${artifact.boundary || ""}`.toLowerCase();
for (const phrase of ["reviewer-facing education-only", "private research", "stock recommendations", "live signals", "return promises", "broker workflows", "automation", "real-money guidance", "learner release", "production readiness"]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  candidateStatus: artifact.candidateStatus,
  semanticAbsorbedRows: artifact.semanticAbsorbedRows,
  candidateRows: artifact.candidateRows,
  uniqueConcepts: artifact.uniqueConcepts,
  p0CandidateRows: artifact.p0CandidateRows,
  writeAllowedNow: artifact.writeAllowedNow,
}, null, 2));
