import fs from "node:fs";

const highResPacketPath = "docs/LOCAL_COURSE_LOW_EXTRACTION_HIGH_RES_REVIEW_PACKET.json";
const outputJsonPath = "docs/LOCAL_COURSE_HIGH_RES_TRANSCRIPTION_CANDIDATE_BATCH_02.json";
const outputMdPath = "docs/LOCAL_COURSE_HIGH_RES_TRANSCRIPTION_CANDIDATE_BATCH_02.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const seedCandidates = [
  {
    documentId: "corpus_1313",
    pageNumber: 5,
    visibleTextExtract: [
      "The page continues with practical-method notes, including one-way verification, cycle switching, profit/loss ratio notes, and SB-structure recognition.",
      "A multi-period comprehensive analysis section warns that unfinished small-cycle structures cannot be used as valid analysis evidence.",
      "Visible notes mention cycle-choice logic, technical indicator use, EMA combinations, support/resistance adjustment areas, and signal-recognition framing.",
      "The page includes several specific price references and retracement-percentage references that require reviewer confirmation before any rewrite.",
    ],
    educationOnlySummary: "This page should be rewritten as a study checklist for evidence validity: learners compare completed versus unfinished structures, review when cycle switching creates confusion, and treat indicator/level references as examples for observation rather than instructions.",
    uncertainRegions: [
      "Exact numeric levels and percentage references need human confirmation.",
      "The first chart annotations and several short bullets are partially legible.",
    ],
    riskTermFlags: ["profit_loss_language", "cycle_switching_language", "specific_price_levels", "indicator_parameter_language", "signal_language"],
    rewriteAngles: [
      "evidence_validity_before_analysis",
      "cycle_switching_confusion_as_mistake",
      "indicator_parameters_as_observation_context",
    ],
  },
  {
    documentId: "corpus_1313",
    pageNumber: 6,
    visibleTextExtract: [
      "The page discusses convergence form after downward breakthrough and rebound-breakthrough structure, including support-position testing, volume behavior, and group-candle trend descriptions.",
      "A trading-execution strategy section mentions pending-order technique, retracement locations, waiting for signal confirmation, and not using very small cycles when profit space is insufficient.",
      "A risk-control reality section warns about fragmented risk, extended original trend after several small rebound candles, and rejecting non-primary trading cycles.",
      "The page contains operational trading language that should be transformed into decision-hygiene and risk-literacy prompts.",
    ],
    educationOnlySummary: "This page can support an education-only lesson on structural confirmation and false precision: learners identify when a visible pattern still lacks sufficient evidence, then explain why very small-cycle signals and fragmented setups can create review errors.",
    uncertainRegions: [
      "Some chart labels and exact retracement ranges require human verification.",
      "The execution-strategy bullets must be carefully rewritten to avoid instructions.",
    ],
    riskTermFlags: ["execution_strategy_language", "pending_order_language", "retracement_level_language", "signal_confirmation_language", "small_cycle_language", "risk_control_language"],
    rewriteAngles: [
      "structural_confirmation_not_execution",
      "false_precision_from_small_cycles",
      "risk_fragmentation_as_review_prompt",
    ],
  },
  {
    documentId: "corpus_1313",
    pageNumber: 7,
    visibleTextExtract: [
      "The page lists three signal-confirmation elements: key-position test, classic-form appearance, and volume cooperation.",
      "A knowledge-summary table begins, with rows for large-cycle/small-cycle relationship, convergence-form recognition, secondary pullback/SB structure, wedge-first-push form, order-management principles, and cycle-switching logic.",
      "The table includes core content, strategy/mistake points, and difficulty ratings shown with star markers.",
      "Visible summary language repeatedly references trend judgment, support positions, confirmation signals, position handling, and avoiding confusion from frequent cycle switching.",
    ],
    educationOnlySummary: "This page is useful as a structured curriculum map: convert the source table into a learner-facing concept taxonomy covering cycle relationship, pattern recognition, review mistakes, uncertainty, and difficulty level without preserving operational trade actions.",
    uncertainRegions: [
      "Some table cells are small and require reviewer verification.",
      "Star ratings are visible but should be treated as source difficulty hints, not product grading until reviewed.",
    ],
    riskTermFlags: ["signal_confirmation_language", "support_position_language", "position_management_language", "cycle_switching_language", "difficulty_rating_language"],
    rewriteAngles: [
      "source_table_to_curriculum_taxonomy",
      "difficulty_rating_as_reviewer_hint",
      "trade_actions_to_review_mistakes",
    ],
  },
  {
    documentId: "corpus_1313",
    pageNumber: 8,
    visibleTextExtract: [
      "The final visible page continues the knowledge-summary table, including cycle-switching logic and an ETH practical case row.",
      "The cycle-switching row references large-cycle direction, small-cycle entry points, frequent switching confusion, and prioritizing the large-cycle trend when periods resonate.",
      "The ETH case row references daily support position, unfinished first decline, small-cycle rebound opportunities, target area, stop-loss position, and profit/loss ratio.",
      "The table uses difficulty star markers and contains multiple operational terms that need education-only rewriting before any lesson use.",
    ],
    educationOnlySummary: "This page can become a reviewer-only source for a lesson-map appendix: summarize cycle-switching logic and case-analysis vocabulary as conceptual review prompts, while replacing target/stop/profit wording with neutral evidence, uncertainty, and risk-boundary language.",
    uncertainRegions: [
      "The table starts mid-row from the previous page; reviewer should merge it with page 7 before final transcription.",
      "Specific level ranges and case labels require human confirmation.",
    ],
    riskTermFlags: ["entry_language", "target_area_language", "stop_loss_language", "profit_loss_language", "specific_price_levels", "case_study_language"],
    rewriteAngles: [
      "multi_page_table_merge_before_review",
      "case_vocabulary_to_neutral_review_prompt",
      "targets_and_stops_to_risk_boundary_language",
    ],
  },
];

const highResPacket = readJson(highResPacketPath);
if (highResPacket.educationOnly !== true) fail("high-res packet must keep educationOnly:true");
if (highResPacket.productionReady !== false) fail("high-res packet must keep productionReady:false");
if (highResPacket.learnerFacingRelease !== false || highResPacket.approvalStatus !== "not_approved") {
  fail("high-res packet release gate drift");
}

const highResByKey = new Map((highResPacket.pageRows || []).map((row) => [`${row.documentId}:${row.pageNumber}`, row]));
const candidatePages = seedCandidates.map((candidate, index) => {
  const highRes = highResByKey.get(`${candidate.documentId}:${candidate.pageNumber}`);
  if (!highRes) fail(`missing high-res page ${candidate.documentId}:${candidate.pageNumber}`);
  if (highRes.visualEvidenceStatus !== "high_res_preview_ready_for_manual_transcription") {
    fail(`${candidate.documentId}:${candidate.pageNumber} is not a manual transcription high-res page`);
  }
  return {
    id: `candidate_batch_02_page_${String(index + 1).padStart(2, "0")}`,
    documentId: candidate.documentId,
    sourceId: highRes.sourceId,
    sourceRelativePath: highRes.sourceRelativePath,
    sourceModule: highRes.sourceModule,
    pageNumber: candidate.pageNumber,
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    candidateStatus: "machine_assisted_visual_candidate_needs_human_review",
    acceptedForP0Overlay: false,
    highResPreviewPath: highRes.highResPreviewPath,
    highResPreviewBytes: highRes.highResPreviewBytes,
    visualEvidenceStatus: highRes.visualEvidenceStatus,
    visibleTextExtract: candidate.visibleTextExtract,
    educationOnlySummary: candidate.educationOnlySummary,
    uncertainRegions: candidate.uncertainRegions,
    riskTermFlags: candidate.riskTermFlags,
    rewriteAngles: candidate.rewriteAngles,
    requiredReviewerActions: [
      "Open the high-resolution preview and verify every visible-text extract.",
      "Merge table continuation pages before treating the summary as a complete source note.",
      "Rewrite operational trading wording into education-only concepts before lesson use.",
      "Run P0 input validation, source-fit review, public grounding, originality review, and approval gates before learner-facing release.",
    ],
    nextGate: "human_review_before_p0_overlay_apply",
  };
});

const batch = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  batchStatus: "machine_assisted_transcription_candidates_ready_for_human_review",
  sourceHighResPacket: highResPacketPath,
  batchId: "local_course_high_res_transcription_candidate_batch_02",
  documentId: "corpus_1313",
  candidatePages: candidatePages.length,
  acceptedForP0OverlayPages: 0,
  blockedUntilHumanReviewedPages: candidatePages.length,
  riskTermFlagCounts: candidatePages.reduce((counts, page) => {
    for (const flag of page.riskTermFlags) counts[flag] = (counts[flag] || 0) + 1;
    return counts;
  }, {}),
  candidatePagesList: candidatePages,
  completionRule: "These machine-assisted visual candidates are not human transcriptions and cannot be applied to the P0 review overlay until a reviewer verifies text, resolves uncertain regions, merges table continuations, and confirms education-only rewriting boundaries.",
  boundary: "High-resolution transcription candidates are reviewer-only working notes. They do not perform accepted OCR, approve learner-facing release, copy private course wording into lessons, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course High-Resolution Transcription Candidate Batch 02",
  "",
  "Machine-assisted visual extraction candidates from high-resolution low-extraction previews.",
  "",
  `- Batch status: ${batch.batchStatus}`,
  `- Document: ${batch.documentId}`,
  `- Candidate pages: ${batch.candidatePages}`,
  `- Accepted for P0 overlay: ${batch.acceptedForP0OverlayPages}`,
  `- Blocked until human reviewed: ${batch.blockedUntilHumanReviewedPages}`,
  "",
  "## Candidate Pages",
  "",
  "| Page | Status | Risk flags | Summary |",
  "| ---: | --- | --- | --- |",
  ...candidatePages.map((page) => `| ${page.pageNumber} | ${page.candidateStatus} | ${page.riskTermFlags.join(", ")} | ${page.educationOnlySummary} |`),
  "",
  "## Completion Rule",
  "",
  batch.completionRule,
  "",
  "## Boundary",
  "",
  batch.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: batch.educationOnly,
  productionReady: batch.productionReady,
  learnerFacingRelease: batch.learnerFacingRelease,
  approvalStatus: batch.approvalStatus,
  batchStatus: batch.batchStatus,
  candidatePages: batch.candidatePages,
  acceptedForP0OverlayPages: batch.acceptedForP0OverlayPages,
  blockedUntilHumanReviewedPages: batch.blockedUntilHumanReviewedPages,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
