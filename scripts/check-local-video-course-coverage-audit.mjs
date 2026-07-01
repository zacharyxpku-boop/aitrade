import fs from "node:fs";

const artifactPrefix = process.env.TRADEGYM_VIDEO_COURSE_ARTIFACT_PREFIX || "LOCAL_VIDEO_COURSE";
const auditPath = process.env.TRADEGYM_VIDEO_COURSE_COVERAGE_JSON || `docs/${artifactPrefix}_COVERAGE_AUDIT.json`;
const mdPath = process.env.TRADEGYM_VIDEO_COURSE_COVERAGE_MD || `docs/${artifactPrefix}_COVERAGE_AUDIT.md`;

function fail(message) { throw new Error(message); }
function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
const audit = readJson(auditPath);
const expectedVideoCount = Number.parseInt(process.env.TRADEGYM_VIDEO_COURSE_EXPECTED_COUNT || String(audit.sourceVideos || 62), 10);
if (!fs.existsSync(mdPath)) fail(`missing ${mdPath}`);
if (audit.educationOnly !== true) fail("audit must keep educationOnly:true");
if (audit.productionReady !== false) fail("audit must keep productionReady:false");
if (audit.learnerFacingRelease !== false) fail("audit must keep learnerFacingRelease:false");
if (audit.approvalStatus !== "not_approved") fail("audit must remain not_approved");
if (!["local_video_course_coverage_in_progress_release_blocked", "local_video_course_coverage_all_semantic_rows_absorbed_release_blocked"].includes(audit.auditStatus)) fail("unexpected auditStatus");
if (audit.auditMode !== "video_source_to_transcript_semantic_candidate_review_coverage") fail("unexpected auditMode");
if (audit.sourceVideos !== expectedVideoCount) fail(`expected ${expectedVideoCount} source videos`);
if (audit.sourceRegisteredRows !== expectedVideoCount || audit.titleMappedRows !== expectedVideoCount || audit.reviewQueuedRows !== expectedVideoCount) fail("source/title/review queue coverage drift");
if (audit.fullTranscriptRows !== audit.semanticAbsorbedRows) fail("full transcript and semantic absorbed rows must match");
if (audit.candidateCoveredRows !== audit.semanticAbsorbedRows) fail("candidate coverage must match semantic absorbed rows");
if (audit.blockedRows !== expectedVideoCount - audit.semanticAbsorbedRows) fail("blocked row drift");
if (audit.learnerFacingReadyRows !== 0) fail("learner-facing rows must stay zero");
if (audit.writeAllowedNow !== false || audit.manualAuthorizationRequired !== true) fail("write gate must stay locked");
if (!Array.isArray(audit.coverageRows) || audit.coverageRows.length !== expectedVideoCount) fail("coverage rows drift");
if (!audit.coverageRows.every((row) => row.intakeId && row.lessonCode && row.sourceRegistered === true && row.titleMapped === true && row.reviewQueued === true && row.learnerFacingRelease === false && row.writeAllowedNow === false)) fail("coverage row identity or boundary drift");
const boundaryText = `${audit.boundary || ""}`.toLowerCase();
for (const phrase of ["reviewer-facing education-only", "source-to-transcript-to-semantic-to-review", "stock recommendations", "live signals", "return promises", "broker workflows", "automation", "real-money guidance", "learner release", "production readiness"]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}
console.log(JSON.stringify({
  ok: true,
  auditStatus: audit.auditStatus,
  sourceVideos: audit.sourceVideos,
  fullTranscriptRows: audit.fullTranscriptRows,
  semanticAbsorbedRows: audit.semanticAbsorbedRows,
  candidateCoveredRows: audit.candidateCoveredRows,
  reviewQueuedRows: audit.reviewQueuedRows,
  blockedRows: audit.blockedRows,
  writeAllowedNow: audit.writeAllowedNow,
}, null, 2));
