import fs from "node:fs";

const artifactPrefix = process.env.TRADEGYM_VIDEO_COURSE_ARTIFACT_PREFIX || "LOCAL_VIDEO_COURSE";
const inventoryPath = process.env.TRADEGYM_VIDEO_COURSE_SOURCE_INVENTORY_JSON || `docs/${artifactPrefix}_SOURCE_INVENTORY.json`;
const intakePath = process.env.TRADEGYM_VIDEO_COURSE_INTAKE_JSON || `docs/${artifactPrefix}_KNOWLEDGE_INTAKE.json`;
const transcriptPath = process.env.TRADEGYM_VIDEO_COURSE_STATUS_JSON || `docs/${artifactPrefix}_TRANSCRIPT_STATUS.json`;
const semanticPath = process.env.TRADEGYM_VIDEO_COURSE_SEMANTIC_JSON || `docs/${artifactPrefix}_SEMANTIC_ABSORPTION_MAP.json`;
const candidatesPath = process.env.TRADEGYM_VIDEO_COURSE_CANDIDATES_JSON || `docs/${artifactPrefix}_KNOWLEDGE_NODE_CANDIDATES.json`;
const queuePath = process.env.TRADEGYM_VIDEO_COURSE_REVIEW_QUEUE_JSON || `docs/${artifactPrefix}_REVIEW_QUEUE.json`;
const outputJsonPath = process.env.TRADEGYM_VIDEO_COURSE_COVERAGE_JSON || `docs/${artifactPrefix}_COVERAGE_AUDIT.json`;
const outputMdPath = process.env.TRADEGYM_VIDEO_COURSE_COVERAGE_MD || `docs/${artifactPrefix}_COVERAGE_AUDIT.md`;

function fail(message) { throw new Error(message); }
function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const artifacts = {
  inventory: readJson(inventoryPath),
  intake: readJson(intakePath),
  transcript: readJson(transcriptPath),
  semantic: readJson(semanticPath),
  candidates: readJson(candidatesPath),
  queue: readJson(queuePath),
};
for (const [name, artifact] of Object.entries(artifacts)) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
}

const expectedVideoCount = artifacts.intake.videoRows?.length || artifacts.semantic.sourceVideos || Number.parseInt(process.env.TRADEGYM_VIDEO_COURSE_EXPECTED_COUNT || "62", 10);
const coverageRows = artifacts.intake.videoRows.map((row) => {
  const transcriptRow = artifacts.transcript.statusRows.find((item) => item.intakeId === row.intakeId);
  const semanticRow = artifacts.semantic.semanticRows.find((item) => item.intakeId === row.intakeId);
  const queueRow = artifacts.queue.rows.find((item) => item.intakeId === row.intakeId);
  const candidateCount = artifacts.candidates.candidates.filter((item) => item.intakeId === row.intakeId).length;
  return {
    intakeId: row.intakeId,
    lessonCode: row.lessonCode,
    sourceRegistered: true,
    titleMapped: row.mappedToKnowledgeModuleByTitle === true,
    fullTranscript: transcriptRow?.transcriptStatus === "full_transcript_created",
    semanticAbsorbed: semanticRow?.semanticAbsorptionStatus === "semantic_absorbed_private_research_only",
    candidateCount,
    reviewQueued: Boolean(queueRow),
    reviewStatus: queueRow?.reviewStatus || "",
    learnerFacingRelease: false,
    writeAllowedNow: false,
  };
});

const audit = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  auditStatus: coverageRows.every((row) => row.semanticAbsorbed)
    ? "local_video_course_coverage_all_semantic_rows_absorbed_release_blocked"
    : "local_video_course_coverage_in_progress_release_blocked",
  auditMode: "video_source_to_transcript_semantic_candidate_review_coverage",
  sourceVideos: expectedVideoCount,
  sourceRegisteredRows: coverageRows.filter((row) => row.sourceRegistered).length,
  titleMappedRows: coverageRows.filter((row) => row.titleMapped).length,
  fullTranscriptRows: coverageRows.filter((row) => row.fullTranscript).length,
  semanticAbsorbedRows: coverageRows.filter((row) => row.semanticAbsorbed).length,
  candidateCoveredRows: coverageRows.filter((row) => row.candidateCount > 0).length,
  reviewQueuedRows: coverageRows.filter((row) => row.reviewQueued).length,
  blockedRows: coverageRows.filter((row) => !row.semanticAbsorbed).length,
  learnerFacingReadyRows: 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  coverageRows,
  commands: [
    "npm.cmd run build:local-video-course-coverage-audit",
    "npm.cmd run check:local-video-course-coverage-audit",
    "npm.cmd run verify",
  ],
  boundary: "Local video course coverage audit is reviewer-facing education-only governance. It proves source-to-transcript-to-semantic-to-review coverage while blocking learner-facing release; it does not publish copied course material, approve learner-facing citations, generate trading advice, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Video Course Coverage Audit",
  "",
  `- Audit status: ${audit.auditStatus}`,
  `- Source registered rows: ${audit.sourceRegisteredRows}`,
  `- Title mapped rows: ${audit.titleMappedRows}`,
  `- Full transcript rows: ${audit.fullTranscriptRows}`,
  `- Semantic absorbed rows: ${audit.semanticAbsorbedRows}`,
  `- Candidate covered rows: ${audit.candidateCoveredRows}`,
  `- Review queued rows: ${audit.reviewQueuedRows}`,
  `- Blocked rows: ${audit.blockedRows}`,
  `- Write allowed now: ${audit.writeAllowedNow}`,
  "",
  "## Boundary",
  "",
  audit.boundary,
  "",
].join("\n"), "utf8");
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
