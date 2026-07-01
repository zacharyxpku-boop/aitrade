import fs from "node:fs";

const artifactPrefix = process.env.TRADEGYM_VIDEO_COURSE_ARTIFACT_PREFIX || "LOCAL_VIDEO_COURSE";
const frameIndexPath = process.env.TRADEGYM_VIDEO_COURSE_VISUAL_FRAME_INDEX_JSON || `docs/${artifactPrefix}_VISUAL_FRAME_INDEX.json`;
const semanticPath = process.env.TRADEGYM_VIDEO_COURSE_SEMANTIC_JSON || `docs/${artifactPrefix}_SEMANTIC_ABSORPTION_MAP.json`;
const candidatesPath = process.env.TRADEGYM_VIDEO_COURSE_CANDIDATES_JSON || `docs/${artifactPrefix}_KNOWLEDGE_NODE_CANDIDATES.json`;
const outputJsonPath = process.env.TRADEGYM_VIDEO_COURSE_VISUAL_SEMANTIC_JSON || `docs/${artifactPrefix}_VISUAL_SEMANTIC_MAP.json`;
const outputMdPath = process.env.TRADEGYM_VIDEO_COURSE_VISUAL_SEMANTIC_MD || `docs/${artifactPrefix}_VISUAL_SEMANTIC_MAP.md`;

function fail(message) { throw new Error(message); }
function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const frameIndex = readJson(frameIndexPath);
const semantic = readJson(semanticPath);
const candidates = readJson(candidatesPath);
for (const [name, artifact] of Object.entries({ frameIndex, semantic, candidates })) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
}

const expectedVideoCount = frameIndex.sourceVideos || frameIndex.videoRows?.length || Number.parseInt(process.env.TRADEGYM_VIDEO_COURSE_EXPECTED_COUNT || "62", 10);
const rows = frameIndex.videoRows.map((videoRow) => {
  const semanticRow = semantic.semanticRows.find((row) => row.intakeId === videoRow.intakeId);
  const frameRows = frameIndex.frames.filter((frame) => frame.intakeId === videoRow.intakeId);
  const candidateRows = candidates.candidates.filter((candidate) => candidate.intakeId === videoRow.intakeId);
  const visualTags = [...new Set(frameRows.flatMap((frame) => frame.visualTags || []))];
  const highRiskVisual = frameRows.some((frame) => frame.containsOrdersStopsRisk === true) || semanticRow?.reviewRisk === "p0_human_review_required";
  return {
    visualSemanticId: `visual_semantic_${videoRow.intakeId}`,
    intakeId: videoRow.intakeId,
    sourceId: videoRow.sourceId,
    lessonCode: videoRow.lessonCode,
    lessonTitle: videoRow.lessonTitle,
    moduleTags: semanticRow?.moduleTags || [],
    conceptCandidates: semanticRow?.conceptCandidates || [],
    knowledgeCandidateIds: candidateRows.map((candidate) => candidate.candidateId).slice(0, 20),
    visualFrameCount: frameRows.length,
    visualTags,
    highRiskVisual,
    reviewRisk: highRiskVisual ? "p0_visual_human_review_required" : "standard_visual_reviewer_distillation_required",
    ocrStatus: videoRow.ocrStatus,
    transcriptLinkedFrameRows: frameRows.filter((frame) => (frame.transcriptWindow || []).length > 0).length,
    sampleFrameRefs: frameRows.slice(0, 5).map((frame) => ({
      frameId: frame.frameId,
      timestamp: frame.timestamp,
      imagePath: frame.imagePath,
      visualTags: frame.visualTags,
      transcriptWindowCount: (frame.transcriptWindow || []).length,
      ocrStatus: frame.ocrStatus,
    })),
    visualSemanticStatus: frameRows.length > 0
      ? "visual_semantic_absorbed_private_review_only"
      : "blocked_missing_visual_frames",
    learnerFacingRelease: false,
    writeAllowedNow: false,
    nextGate: highRiskVisual
      ? "p0_human_visual_review_ocr_or_manual_chart_note_then_public_grounding"
      : "standard_human_visual_review_then_public_grounding",
  };
});

const artifact = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  visualSemanticStatus: rows.length === expectedVideoCount && rows.every((row) => row.visualSemanticStatus === "visual_semantic_absorbed_private_review_only")
    ? "local_video_course_visual_semantic_map_complete_release_blocked"
    : "local_video_course_visual_semantic_map_in_progress_release_blocked",
  visualSemanticMode: "visual_frame_to_transcript_window_to_knowledge_candidate_map",
  sourceVideos: expectedVideoCount,
  visualSemanticRows: rows.length,
  rowsWithFrames: rows.filter((row) => row.visualFrameCount > 0).length,
  blockedRows: rows.filter((row) => row.visualFrameCount === 0).length,
  highRiskVisualRows: rows.filter((row) => row.highRiskVisual).length,
  ocrBlockedRows: rows.filter((row) => row.ocrStatus !== "ocr_completed_for_some_frames").length,
  learnerFacingReadyRows: 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  rows,
  commands: [
    "npm.cmd run build:local-video-course-visual-semantic-map",
    "npm.cmd run check:local-video-course-visual-semantic-map",
    "npm.cmd run verify",
  ],
  boundary: "Local video course visual semantic map is reviewer-facing education-only private research material. It links selected screenshots to transcript windows and knowledge candidates for visual review; it does not publish copied course frames, approve learner-facing citations, generate trading advice, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Video Course Visual Semantic Map",
  "",
  `- Status: ${artifact.visualSemanticStatus}`,
  `- Visual semantic rows: ${artifact.visualSemanticRows}/${artifact.sourceVideos}`,
  `- Rows with frames: ${artifact.rowsWithFrames}`,
  `- Blocked rows: ${artifact.blockedRows}`,
  `- High-risk visual rows: ${artifact.highRiskVisualRows}`,
  `- OCR blocked rows: ${artifact.ocrBlockedRows}`,
  `- Write allowed now: ${artifact.writeAllowedNow}`,
  "",
  "## Rows",
  "",
  "| Intake | Lesson | Frames | Risk | Tags | Status |",
  "| --- | --- | ---: | --- | --- | --- |",
  ...artifact.rows.map((row) => `| ${row.intakeId} | ${row.lessonCode} | ${row.visualFrameCount} | ${row.reviewRisk} | ${row.visualTags.join(", ")} | ${row.visualSemanticStatus} |`),
  "",
  "## Boundary",
  "",
  artifact.boundary,
  "",
].join("\n"), "utf8");

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
