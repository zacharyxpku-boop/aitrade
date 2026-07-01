import fs from "node:fs";

const artifactPrefix = process.env.TRADEGYM_VIDEO_COURSE_ARTIFACT_PREFIX || "LOCAL_VIDEO_COURSE";
const semanticMapPath = process.env.TRADEGYM_VIDEO_COURSE_SEMANTIC_JSON || `docs/${artifactPrefix}_SEMANTIC_ABSORPTION_MAP.json`;
const outputJsonPath = process.env.TRADEGYM_VIDEO_COURSE_CANDIDATES_JSON || `docs/${artifactPrefix}_KNOWLEDGE_NODE_CANDIDATES.json`;
const outputMdPath = process.env.TRADEGYM_VIDEO_COURSE_CANDIDATES_MD || `docs/${artifactPrefix}_KNOWLEDGE_NODE_CANDIDATES.md`;

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function nodeTypeFor(concept) {
  if (/risk|stop|position|probability|orders|execution|management|scaling|styles/.test(concept)) return "risk_execution_concept";
  if (/reversal|patterns|breakouts|pullbacks|ranges|structure|channels|cycle|support|resistance/.test(concept)) return "price_action_concept";
  if (/psychology|discipline|foundation|learning/.test(concept)) return "learning_process_concept";
  return "video_course_concept";
}

const semanticMap = readJson(semanticMapPath);
if (semanticMap.educationOnly !== true) fail("semantic map must keep educationOnly:true");
if (semanticMap.productionReady !== false) fail("semantic map must keep productionReady:false");
const expectedVideoCount = semanticMap.sourceVideos || semanticMap.semanticRows?.length || Number.parseInt(process.env.TRADEGYM_VIDEO_COURSE_EXPECTED_COUNT || "62", 10);
if (!Array.isArray(semanticMap.semanticRows) || semanticMap.semanticRows.length !== expectedVideoCount) fail("semantic rows drift");

const candidates = [];
for (const row of semanticMap.semanticRows) {
  if (row.semanticAbsorptionStatus !== "semantic_absorbed_private_research_only") continue;
  for (const concept of row.conceptCandidates || []) {
    candidates.push({
      candidateId: `video_node_${row.intakeId}_${concept}`.replace(/[^a-z0-9_]+/gi, "_").toLowerCase(),
      intakeId: row.intakeId,
      semanticId: row.semanticId,
      sourceId: row.sourceId,
      lessonCode: row.lessonCode,
      lessonTitle: row.lessonTitle,
      concept,
      nodeType: nodeTypeFor(concept),
      moduleTags: row.moduleTags,
      evidenceAnchorCount: row.evidenceAnchors.length,
      evidenceAnchors: row.evidenceAnchors.slice(0, 3),
      privateResearchSummary: row.privateResearchSummary,
      learnerFacingRelease: false,
      productionReady: false,
      reviewStatus: row.reviewRisk === "p0_human_review_required" ? "p0_human_review_required" : "needs_reviewer_distillation",
      nextGate: "human_reviewer_distillation_public_grounding_and_source_fit_review",
    });
  }
}

const conceptCounts = new Map();
for (const candidate of candidates) {
  conceptCounts.set(candidate.concept, (conceptCounts.get(candidate.concept) || 0) + 1);
}
const conceptRows = [...conceptCounts.entries()]
  .map(([concept, candidateRows]) => ({ concept, candidateRows }))
  .sort((left, right) => right.candidateRows - left.candidateRows || left.concept.localeCompare(right.concept));

const artifact = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  candidateStatus: semanticMap.semanticAbsorbedRows === expectedVideoCount
    ? "local_video_course_node_candidates_complete_release_blocked"
    : "local_video_course_node_candidates_in_progress_release_blocked",
  candidateMode: "private_video_semantic_rows_to_reviewer_knowledge_node_candidates",
  sourceVideos: semanticMap.sourceVideos,
  semanticAbsorbedRows: semanticMap.semanticAbsorbedRows,
  blockedMissingFullTranscriptRows: semanticMap.blockedMissingFullTranscriptRows,
  candidateRows: candidates.length,
  uniqueConcepts: conceptRows.length,
  p0CandidateRows: candidates.filter((row) => row.reviewStatus === "p0_human_review_required").length,
  learnerFacingReadyRows: 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  conceptRows,
  candidates,
  commands: [
    "npm.cmd run build:local-video-course-knowledge-node-candidates",
    "npm.cmd run check:local-video-course-knowledge-node-candidates",
    "npm.cmd run verify",
  ],
  boundary: "Local video course knowledge node candidates are reviewer-facing education-only private research scaffolding. They do not publish copied course material, approve learner-facing citations, generate trading advice, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Video Course Knowledge Node Candidates",
  "",
  `- Candidate status: ${artifact.candidateStatus}`,
  `- Semantic absorbed rows: ${artifact.semanticAbsorbedRows}`,
  `- Candidate rows: ${artifact.candidateRows}`,
  `- Unique concepts: ${artifact.uniqueConcepts}`,
  `- P0 candidate rows: ${artifact.p0CandidateRows}`,
  `- Write allowed now: ${artifact.writeAllowedNow}`,
  "",
  "## Concepts",
  "",
  "| Concept | Candidate rows |",
  "| --- | ---: |",
  ...artifact.conceptRows.map((row) => `| ${row.concept} | ${row.candidateRows} |`),
  "",
  "## Boundary",
  "",
  artifact.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  candidateStatus: artifact.candidateStatus,
  semanticAbsorbedRows: artifact.semanticAbsorbedRows,
  candidateRows: artifact.candidateRows,
  uniqueConcepts: artifact.uniqueConcepts,
  p0CandidateRows: artifact.p0CandidateRows,
  writeAllowedNow: artifact.writeAllowedNow,
}, null, 2));
