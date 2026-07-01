import fs from "node:fs";
import path from "node:path";

const artifactPrefix = process.env.TRADEGYM_VIDEO_COURSE_ARTIFACT_PREFIX || "LOCAL_VIDEO_COURSE";
const intakePath = process.env.TRADEGYM_VIDEO_COURSE_INTAKE_JSON || `docs/${artifactPrefix}_KNOWLEDGE_INTAKE.json`;
const transcriptStatusPath = process.env.TRADEGYM_VIDEO_COURSE_STATUS_JSON || `docs/${artifactPrefix}_TRANSCRIPT_STATUS.json`;
const transcriptDir = process.env.TRADEGYM_VIDEO_COURSE_TRANSCRIPT_DIR || "docs/local-video-course-transcripts";
const outputJsonPath = process.env.TRADEGYM_VIDEO_COURSE_SEMANTIC_JSON || `docs/${artifactPrefix}_SEMANTIC_ABSORPTION_MAP.json`;
const outputMdPath = process.env.TRADEGYM_VIDEO_COURSE_SEMANTIC_MD || `docs/${artifactPrefix}_SEMANTIC_ABSORPTION_MAP.md`;

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function shortText(value, max = 180) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function conceptCandidates(row) {
  const labels = new Set([...(row.moduleTags || [])]);
  const text = `${row.lessonTitle || ""} ${(row.moduleTags || []).join(" ")}`.toLowerCase();
  const concepts = [
    ["risk_management", /risk|stop|protective|actual risk|风险|止损/],
    ["trade_management", /trade management|taking profits|scaling|获利|管理/],
    ["orders_and_execution", /orders|订单|execution/],
    ["market_structure", /market|range|cycle|support|resistance|结构|市场/],
    ["price_action_patterns", /candles|signal|bars|breakouts|pullbacks|wedges|triangles|形|突破|回调/],
    ["reversal_patterns", /reversal|double top|double bottom|head and shoulders|反转|逆转/],
    ["trading_psychology", /personality|psychology|successful traders|心理|个性/],
  ];
  for (const [label, pattern] of concepts) {
    if (pattern.test(text)) labels.add(label);
  }
  return [...labels].sort();
}

function reviewRisk(row) {
  const tags = new Set(row.moduleTags || []);
  const highRiskTags = ["risk_management", "protective_stops", "orders", "execution_concepts", "trade_management", "scaling_in", "position_risk", "probability", "trading_styles"];
  return highRiskTags.some((tag) => tags.has(tag)) ? "p0_human_review_required" : "standard_reviewer_distillation_required";
}

function evidenceAnchors(transcript) {
  const segments = Array.isArray(transcript?.segments) ? transcript.segments : [];
  const picked = [];
  for (const segment of segments) {
    if (!shortText(segment.text, 120)) continue;
    if (picked.length === 0 || segment.start - picked[picked.length - 1].start >= 240) {
      picked.push({
        start: segment.start,
        end: segment.end,
        textPreview: shortText(segment.text, 120),
      });
    }
    if (picked.length >= 8) break;
  }
  return picked;
}

const intake = readJson(intakePath);
const transcriptStatus = readJson(transcriptStatusPath);
if (intake.educationOnly !== true || transcriptStatus.educationOnly !== true) fail("inputs must keep educationOnly:true");
if (intake.productionReady !== false || transcriptStatus.productionReady !== false) fail("inputs must keep productionReady:false");
const expectedVideoCount = intake.videoRows?.length || Number.parseInt(process.env.TRADEGYM_VIDEO_COURSE_EXPECTED_COUNT || "62", 10);
if (!Array.isArray(intake.videoRows) || intake.videoRows.length !== expectedVideoCount) fail(`expected ${expectedVideoCount} video rows`);

const transcriptById = new Map();
if (fs.existsSync(transcriptDir)) {
  for (const file of fs.readdirSync(transcriptDir).filter((name) => name.endsWith(".transcript.json"))) {
    const transcript = readJson(path.join(transcriptDir, file));
    transcriptById.set(transcript.intakeId, transcript);
  }
}

const semanticRows = intake.videoRows.map((row) => {
  const transcript = transcriptById.get(row.intakeId);
  const fullTranscript = transcript?.transcriptStatus === "full_transcript_created" && transcript?.isPartialTranscript === false;
  const tags = conceptCandidates(row);
  return {
    semanticId: `semantic_${row.intakeId}`,
    intakeId: row.intakeId,
    sourceId: row.sourceId,
    lessonCode: row.lessonCode,
    lessonTitle: row.lessonTitle,
    relativePath: row.relativePath,
    moduleTags: row.moduleTags,
    conceptCandidates: tags,
    reviewRisk: reviewRisk(row),
    transcriptStatus: transcript?.transcriptStatus || "not_started",
    hasFullTranscript: fullTranscript,
    transcriptPath: fullTranscript ? `${transcriptDir}/${row.intakeId}.transcript.json` : "",
    transcriptSegments: fullTranscript ? transcript.segments.length : 0,
    transcriptCharCount: fullTranscript ? String(transcript.text || "").length : 0,
    evidenceAnchors: fullTranscript ? evidenceAnchors(transcript) : [],
    privateResearchSummary: fullTranscript
      ? `${row.lessonCode} is privately indexed for reviewer distillation under ${tags.slice(0, 5).join(", ")}. Use transcript timestamps as evidence anchors; do not expose the private transcript as learner-facing source text.`
      : "",
    semanticAbsorptionStatus: fullTranscript
      ? "semantic_absorbed_private_research_only"
      : "blocked_missing_full_transcript",
    learnerFacingRelease: false,
    writeAllowedNow: false,
    nextGate: fullTranscript
      ? "human_reviewer_distillation_public_grounding_and_source_fit_review"
      : "finish_full_transcript_before_semantic_absorption",
  };
});

const absorbedRows = semanticRows.filter((row) => row.semanticAbsorptionStatus === "semantic_absorbed_private_research_only");
const highRiskRows = semanticRows.filter((row) => row.reviewRisk === "p0_human_review_required");
const moduleMap = new Map();
for (const row of semanticRows) {
  for (const module of row.moduleTags || []) {
    const moduleRow = moduleMap.get(module) || {
      module,
      videoRows: 0,
      semanticAbsorbedRows: 0,
      blockedRows: 0,
      p0ReviewRows: 0,
    };
    moduleRow.videoRows += 1;
    if (row.semanticAbsorptionStatus === "semantic_absorbed_private_research_only") moduleRow.semanticAbsorbedRows += 1;
    else moduleRow.blockedRows += 1;
    if (row.reviewRisk === "p0_human_review_required") moduleRow.p0ReviewRows += 1;
    moduleMap.set(module, moduleRow);
  }
}

const map = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  absorptionStatus: absorbedRows.length === expectedVideoCount
    ? "local_video_course_semantic_absorption_complete_release_blocked"
    : "local_video_course_semantic_absorption_in_progress_release_blocked",
  absorptionMode: "private_transcript_to_reviewer_knowledge_semantic_index",
  sourceVideos: expectedVideoCount,
  fullTranscriptRows: semanticRows.filter((row) => row.hasFullTranscript).length,
  semanticAbsorbedRows: absorbedRows.length,
  blockedMissingFullTranscriptRows: semanticRows.filter((row) => !row.hasFullTranscript).length,
  p0HumanReviewRows: highRiskRows.length,
  learnerFacingReadyRows: 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  moduleRows: [...moduleMap.values()].sort((left, right) => right.videoRows - left.videoRows || left.module.localeCompare(right.module)),
  semanticRows,
  commands: [
    "npm.cmd run build:local-video-course-semantic-absorption",
    "npm.cmd run check:local-video-course-semantic-absorption",
    "npm.cmd run verify",
  ],
  completionRule: `Semantic absorption is complete only when all ${expectedVideoCount} local video course transcripts are full transcripts, every row has semantic_absorbed_private_research_only, P0 rows remain queued for human review, and learner-facing release remains blocked until separate approval.`,
  boundary: "Local video course semantic absorption is reviewer-facing education-only private research material. It indexes transcript-derived concepts and timestamp evidence for review; it does not publish copied course material, approve learner-facing citations, generate trading advice, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(map, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Video Course Semantic Absorption Map",
  "",
  `- Absorption status: ${map.absorptionStatus}`,
  `- Source videos: ${map.sourceVideos}`,
  `- Full transcript rows: ${map.fullTranscriptRows}`,
  `- Semantic absorbed rows: ${map.semanticAbsorbedRows}`,
  `- Blocked missing full transcript rows: ${map.blockedMissingFullTranscriptRows}`,
  `- P0 human review rows: ${map.p0HumanReviewRows}`,
  `- Write allowed now: ${map.writeAllowedNow}`,
  "",
  "## Modules",
  "",
  "| Module | Videos | Absorbed | Blocked | P0 review |",
  "| --- | ---: | ---: | ---: | ---: |",
  ...map.moduleRows.map((row) => `| ${row.module} | ${row.videoRows} | ${row.semanticAbsorbedRows} | ${row.blockedRows} | ${row.p0ReviewRows} |`),
  "",
  "## Rows",
  "",
  "| Intake ID | Lesson | Status | Full transcript | P0 | Concepts |",
  "| --- | --- | --- | --- | --- | --- |",
  ...map.semanticRows.map((row) => `| ${row.intakeId} | ${row.lessonCode} | ${row.semanticAbsorptionStatus} | ${row.hasFullTranscript} | ${row.reviewRisk} | ${row.conceptCandidates.slice(0, 6).join(", ")} |`),
  "",
  "## Boundary",
  "",
  map.boundary,
  "",
].join("\n"), "utf8");

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
