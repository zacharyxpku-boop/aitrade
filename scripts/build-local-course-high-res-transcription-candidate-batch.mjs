import fs from "node:fs";

const highResPacketPath = "docs/LOCAL_COURSE_LOW_EXTRACTION_HIGH_RES_REVIEW_PACKET.json";
const outputJsonPath = "docs/LOCAL_COURSE_HIGH_RES_TRANSCRIPTION_CANDIDATE_BATCH_01.json";
const outputMdPath = "docs/LOCAL_COURSE_HIGH_RES_TRANSCRIPTION_CANDIDATE_BATCH_01.md";

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
    pageNumber: 1,
    visibleTextExtract: [
      "Page heading references using a large cycle to discover what happens in the small cycle.",
      "The page uses weekly/daily examples, support-position characteristics, a short-cycle conclusion, and risk-control reminders.",
      "Visible notes mention large-cycle downtrend context, possible multiple pushes, blue trendline/daily supports, and short-cycle strength requiring lower probability treatment.",
      "The page also marks a small-cycle operation strategy around time limits, entry conditions, batch exits, and avoiding forced counter-trend short positions.",
    ],
    educationOnlySummary: "This page can be rewritten as an education-only lesson on multi-timeframe context: first identify the large-cycle environment, then use the smaller cycle to observe structure, evidence quality, invalidation, and position-management concepts without turning them into trade instructions.",
    uncertainRegions: [
      "Some small chart annotations are too small for reliable exact transcription.",
      "Several numeric labels in embedded chart screenshots need human confirmation.",
    ],
    riskTermFlags: ["position_language", "entry_language", "stop_loss_language", "specific_price_levels", "counter_trend_language"],
    rewriteAngles: [
      "large_cycle_context_before_small_cycle_execution",
      "support_area_as_observation_not_signal",
      "invalidation_and_no_action_boundary",
    ],
  },
  {
    documentId: "corpus_1313",
    pageNumber: 2,
    visibleTextExtract: [
      "The page continues small-cycle entry framing, listing advantages such as filtering noise, exploiting small-cycle precision, and avoiding frequent switching confusion.",
      "It references verification indicators including EMA combinations and support-position confirmation conditions.",
      "A second section discusses observing whether a large cycle finds a small cycle and introduces a convergence-form recognition example.",
      "Visible notes describe convergence characteristics, cycle verification, false-breakout warnings, secondary pullback logic, structural verification, and left/right-side confirmation cautions.",
    ],
    educationOnlySummary: "This page can support a lesson on evidence stacking across cycles: use moving-average context, repeated tests, volume/structure confirmation, and false-breakout awareness as study prompts rather than action signals.",
    uncertainRegions: [
      "Exact chart labels and some chart-side text require human confirmation.",
      "Some bullet indentation and sub-bullet ordering may need reviewer cleanup.",
    ],
    riskTermFlags: ["entry_language", "stop_loss_language", "risk_reward_language", "right_side_confirmation_language"],
    rewriteAngles: [
      "evidence_stacking_for_structure_review",
      "false_breakout_as_training_case",
      "confirmation_before_action_in_classroom_language",
    ],
  },
  {
    documentId: "corpus_1313",
    pageNumber: 3,
    visibleTextExtract: [
      "The page covers a wedge-style first-push form, using a chart example and notes about identifying a complete three-push structure.",
      "It contrasts bullish and bearish signals around wedge behavior and prior key pressure levels.",
      "A multi-period coordination section lists analysis flow from large cycle to medium cycle to small cycle.",
      "A practice caution section mentions avoiding frequent-period switching, improving signal accuracy through filtering false breakouts, and using structural repetition for verification.",
      "The bottom references a risk-reward principle and a case where the ratio is not ideal.",
    ],
    educationOnlySummary: "This page can be transformed into a classroom concept on pattern recognition and multi-period coordination: describe wedge/three-push forms as observation vocabulary, then require learners to state uncertainty, confirmation needs, and when not to act.",
    uncertainRegions: [
      "Exact wedge chart annotations are partially legible but should be checked.",
      "The risk-reward example needs careful rewriting so it does not become performance guidance.",
    ],
    riskTermFlags: ["pattern_signal_language", "pressure_level_language", "risk_reward_language", "entry_avoidance_language"],
    rewriteAngles: [
      "pattern_vocabulary_without_signal_claims",
      "multi_period_analysis_flow",
      "risk_reward_as_literacy_not_recommendation",
    ],
  },
  {
    documentId: "corpus_1313",
    pageNumber: 4,
    visibleTextExtract: [
      "The page starts with order-management notes, including T1 position-setting needing actual price movement and reducing/clearing positions during flat execution or after a wedge completion.",
      "It emphasizes cycle selection, focusing on large cycle or trading cycle while using only the smaller cycle to verify structure.",
      "A section on price-behavior ability uses examples of secondary pullback and large-cycle small-cycle risk.",
      "Visible notes mention core ability as judging small-cycle trend from large-cycle context, examples involving EMA sets and Fibonacci-like retracement, and practical values around volatility interpretation, entry-condition cleanup, and risk-control position handling.",
      "The lower section warns about cycle conflict, novice confusion from switching periods, and counter-trend trades with low odds based on a specific range example.",
    ],
    educationOnlySummary: "This page can be rewritten as an education-only review of cycle conflict and decision hygiene: learners practice separating context, structure verification, order-management vocabulary, and risk-control language without receiving a trade setup.",
    uncertainRegions: [
      "Some numerical ranges and chart labels need human confirmation.",
      "Several source bullets use operational trading wording that must be rewritten before any learner-facing use.",
    ],
    riskTermFlags: ["order_management_language", "position_language", "entry_language", "risk_control_language", "specific_price_levels"],
    rewriteAngles: [
      "cycle_conflict_and_decision_hygiene",
      "position_terms_as_concepts_not_instructions",
      "specific_levels_to_generic_training_prompts",
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
    id: `candidate_batch_01_page_${String(index + 1).padStart(2, "0")}`,
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
      "Convert the machine-assisted extract into a human-reviewed transcription or mark uncertain regions.",
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
  batchId: "local_course_high_res_transcription_candidate_batch_01",
  documentId: "corpus_1313",
  candidatePages: candidatePages.length,
  acceptedForP0OverlayPages: 0,
  blockedUntilHumanReviewedPages: candidatePages.length,
  riskTermFlagCounts: candidatePages.reduce((counts, page) => {
    for (const flag of page.riskTermFlags) counts[flag] = (counts[flag] || 0) + 1;
    return counts;
  }, {}),
  candidatePagesList: candidatePages,
  completionRule: "These machine-assisted visual candidates are not human transcriptions and cannot be applied to the P0 review overlay until a reviewer verifies text, resolves uncertain regions, and confirms education-only rewriting boundaries.",
  boundary: "High-resolution transcription candidates are reviewer-only working notes. They do not perform accepted OCR, approve learner-facing release, copy private course wording into lessons, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course High-Resolution Transcription Candidate Batch 01",
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
