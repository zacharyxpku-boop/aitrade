import fs from "node:fs";

const templatePath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_3_ZIP_REVIEWER_INPUT_TEMPLATE.json";
const packPath = "docs/LOCAL_COURSE_5_WAVE_3_ZIP_EXECUTION_PACK.json";
const inputJsonPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_3_ZIP_AI_VISUAL_REVIEW_BATCH_002_INPUT.json";
const inputMdPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_3_ZIP_AI_VISUAL_REVIEW_BATCH_002_INPUT.md";
const validationJsonPath = "docs/LOCAL_COURSE_5_WAVE_3_ZIP_AI_VISUAL_REVIEW_BATCH_002_VALIDATION.json";
const validationMdPath = "docs/LOCAL_COURSE_5_WAVE_3_ZIP_AI_VISUAL_REVIEW_BATCH_002_VALIDATION.md";

const reviewedAt = "2026-06-25T00:00:00.000+08:00";
const reviewerName = "Codex visual review batch 002";
const batchId = "wave_3_zip_ai_visual_review_batch_002";

const boundary = "Course 5 Wave 3 ZIP AI visual review batch 002 is private reviewer-facing education operations material. It records model-assisted visual observations for twelve Wave 3 ZIP chart samples so they can receive human confirmation before semantic merge preview, public grounding, originality review, teaching-module distillation, or deletion-readiness recomputation. It does not perform OCR, replace human approval, accept machine drafts as final review, merge content into learner-facing modules, delete files, approve source-folder deletion, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

const forbiddenPhrases = [
  "buy signal",
  "sell signal",
  "must buy",
  "must sell",
  "recommended buy",
  "recommended sell",
  "guaranteed return",
  "win rate",
  "profit target",
  "stop loss instruction",
  "real money",
  "broker",
  "auto trading",
  "approved for release",
  "learner-facing approved",
  "write allowed",
  "delete source",
];

const batchNotes = new Map([
  ["course5_zip_image_review_037", {
    modulePlacement: "course_structure; trading_ranges; chart_pattern_encyclopedia",
    reviewerOwnedVisualObservation: "The sample is a very tall course-structure image with nested branches, miniature chart examples, and many compact text labels. It appears to summarize how the market-analysis framework organizes multiple price-action topics.",
    reviewerVisibleTextOrLabelCheck: "Visible content is a long hierarchical outline with embedded chart thumbnails. Much of the small text is not reliably readable at this resolution, but the layout clearly functions as a structural map.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row is best treated as a curriculum-map artifact that can help organize topics, not as a standalone lesson or evidence for a specific chart pattern.",
    representativenessNote: "Useful for course navigation and module taxonomy, especially around trading-range and price-action subtopics.",
    evidenceLimitations: "Small labels are not fully readable without OCR or higher-resolution review, so this row should remain an index clue only.",
  }],
  ["course5_zip_image_review_038", {
    modulePlacement: "breakouts_and_pullbacks; trading_ranges; trends_and_channels",
    reviewerOwnedVisualObservation: "The ten-year Treasury note five-minute chart shows an early decline, a basing area, a gradual rise, then a boxed breakout region followed by continued upward movement and later consolidation.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 1.1 Breakouts Are Reliable Setups, numbered points 1 through 25, a shaded breakout box, horizontal reference marks, and a moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can support a lesson on how a range can develop into a breakout sequence, where the educational focus is the transition from compression to follow-through.",
    representativenessNote: "Representative for breakout-from-range structure and post-breakout continuation review.",
    evidenceLimitations: "The title is strong; the module should phrase it as retrospective pattern study rather than a general reliability claim.",
  }],
  ["course5_zip_image_review_039", {
    modulePlacement: "breakouts_and_pullbacks; reversals; trading_ranges",
    reviewerOwnedVisualObservation: "The Emini chart declines into a low, reverses upward, breaks above a small range, pulls back toward a shaded support area, then continues into later higher highs.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 1.2 Breakout Pullback, E-mini S&P five-minute chart, numbered points 1 through 23, shaded pullback area, and moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach breakout-pullback sequencing: after an initial breakout, later tests of the prior area can become important context for chart interpretation.",
    representativenessNote: "Good case for linking reversal, breakout, and pullback vocabulary in one session.",
    evidenceLimitations: "Needs human confirmation of the shaded area interpretation before module merge.",
  }],
  ["course5_zip_image_review_040", {
    modulePlacement: "breakouts_and_pullbacks; trading_ranges; trends_and_channels",
    reviewerOwnedVisualObservation: "The EUR/USD daily chart shows many horizontal range boundaries and repeated breaks, then a larger downward channel-like move, a lower range, and a later rebound.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 2.1 Breakouts Happen Many Times Every Day, EUR/USD daily chart, numbered points 1 through 38, multiple horizontal range lines, and descending channel marks.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row supports teaching that breakout analysis is often repeated across many small structures, so learners should track sequences of ranges, breaks, channels, and rebounds.",
    representativenessNote: "High-density example for repeated breakout mapping across a multi-week chart.",
    evidenceLimitations: "Dense annotations should be simplified into a limited set of teaching moments before learner-facing use.",
  }],
  ["course5_zip_image_review_041", {
    modulePlacement: "breakouts_and_pullbacks; trading_ranges; trends_and_channels",
    reviewerOwnedVisualObservation: "The Google five-minute chart shows an early breakout, a pullback into a sideways middle section, a later lower test, then a strong gap or session transition into another upward structure with a circled consolidation.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 5.2 Breakout Pullbacks, GOOG five-minute chart, numbered points 1 through 34, circled pullback areas, horizontal marks, and moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach multiple breakout-pullback examples in one chart, including how the same structure can appear before and after a session boundary.",
    representativenessNote: "Useful for comparing early and later pullback behavior around breakout structures.",
    evidenceLimitations: "The image has session context and multiple examples; reviewer simplification is required.",
  }],
  ["course5_zip_image_review_042", {
    modulePlacement: "breakouts_and_pullbacks; trends_and_channels; moving_average_context",
    reviewerOwnedVisualObservation: "The Emini chart shows a multi-day rising sequence with several pullbacks toward moving averages, followed by consolidation and a later sharp advance that also pulls back toward shorter moving-average lines.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 11.2 Moving Average Pullbacks, E-mini S&P five-minute chart, numbered points 1 through 8, several moving-average curves, and vertical day separators.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can support teaching how pullbacks are evaluated relative to moving-average context across more than one session.",
    representativenessNote: "Good evidence anchor for moving-average context within trend and range transitions.",
    evidenceLimitations: "Requires public grounding before using moving-average terminology in a formal module.",
  }],
  ["course5_zip_image_review_043", {
    modulePlacement: "trading_ranges; volatility_events; breakouts_and_pullbacks",
    reviewerOwnedVisualObservation: "The Emini chart rises before a session boundary, then breaks sharply lower and continues downward with several numbered pullback attempts during the decline.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 15.1 Late Stop Runs, E-mini S&P five-minute chart, numbered points 1 through 10, session separator, and moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach late-session or late-move liquidity pressure as a chart-reading phenomenon, using neutral language around sharp continuation after a prior range or trend.",
    representativenessNote: "Useful for discussing sharp late moves and failed stabilization attempts.",
    evidenceLimitations: "The title includes trading jargon; the course artifact should preserve only structural and educational interpretation.",
  }],
  ["course5_zip_image_review_044", {
    modulePlacement: "chart_pattern_encyclopedia; trading_ranges; reversals",
    reviewerOwnedVisualObservation: "The Emini chart shows a sharp early drop, then a slanted range and wedge-like three-push area, followed by a breakout from that structure and later rising range behavior.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 18.8 Three-Push Patterns, numbered points 1 through 16, diagonal range lines, a small triangular push area, and moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can support a lesson on three-push structures inside ranges, where repeated pushes and converging lines can mark a change in short-term rhythm.",
    representativenessNote: "Representative for range-bound pattern reading and three-push vocabulary.",
    evidenceLimitations: "Human review should confirm whether the smaller triangular area is the intended teaching focus.",
  }],
  ["course5_zip_image_review_045", {
    modulePlacement: "breakouts_and_pullbacks; measured_move_concepts; risk_context",
    reviewerOwnedVisualObservation: "The sample compares four narrow Emini panels. Each panel highlights a different spike size and a corresponding measured-move distance during a downward move.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 25.1 As a Spike Grows, So Does the measured objective concept, 5 tick spike, 10 tick spike, 16 tick spike, 19 tick spike, and matched measured-move labels.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach the visual relationship between the size of an initial spike and later measured-move projections without turning it into a performance or execution promise.",
    representativenessNote: "Useful for measured-move vocabulary and comparative chart annotation.",
    evidenceLimitations: "Original wording contains target-oriented language; this artifact must remain neutral and educational.",
  }],
  ["course5_zip_image_review_046", {
    modulePlacement: "trading_ranges; trendline_context; breakouts_and_pullbacks",
    reviewerOwnedVisualObservation: "The FCX five-minute chart shows a downward channel-like structure with repeated tests of drawn lines, a brief sideways middle section, then a renewed decline into the final bars.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 28.4 Fading Tests of Lines with Limit Orders, FCX five-minute chart, numbered points 1 through 16, several sloped line tests, and moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach how repeated tests of trendlines or channel lines are reviewed as structure, while avoiding conversion into order-placement instruction.",
    representativenessNote: "Good case for line-test context and channel interpretation.",
    evidenceLimitations: "The title includes execution-oriented wording; module use must keep only chart-observation content.",
  }],
  ["course5_zip_image_review_047", {
    modulePlacement: "trading_ranges; reversals; market_session_context",
    reviewerOwnedVisualObservation: "The Emini chart shows a range-like middle section that later breaks down into a lower test, forms a rounded bottom area, and then rallies strongly. An inset higher-timeframe chart provides broader context.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure PIV.7 A Trading Range Can Be a Reversal Setup, numbered points 1 through 16, curved bottom marking, diagonal lines, and an inset fifteen-minute chart.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach how a trading range may become the base for a reversal narrative when later price action confirms a change in direction.",
    representativenessNote: "Strong candidate for linking trading-range structure with reversal modules.",
    evidenceLimitations: "The inset and main chart need reviewer alignment before the lesson is simplified.",
  }],
  ["course5_zip_image_review_048", {
    modulePlacement: "trading_ranges; volatility_events; price_action_foundations",
    reviewerOwnedVisualObservation: "The Emini chart shows a sharp upward climax around midday, an abrupt decline, and then overlapping two-way movement before a later rebound from the lower area.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure PIV.8 Buy Climax, Then Trading Range, E-mini S&P five-minute chart, numbered points 1 through 10, session/time marks, and moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach how an exhaustion-like upward surge may be followed by a two-way range, helping learners separate climax behavior from later range development.",
    representativenessNote: "Useful trading-range module example because it shows a clear transition from sharp movement into overlapping price action.",
    evidenceLimitations: "The visible title uses action-oriented vocabulary; downstream module copy should translate it into neutral climax-and-range language.",
  }],
]);

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(name, artifact) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${name} must keep approvalStatus:not_approved`);
  if (artifact.writeAllowedNow !== false) fail(`${name} must keep writeAllowedNow:false`);
}

function text(value) {
  return String(value || "").trim();
}

function forbiddenHits(value) {
  const blob = String(value || "").toLowerCase();
  return forbiddenPhrases.filter((phrase) => blob.includes(phrase.toLowerCase()));
}

const requiredFields = [
  "reviewerOwnedVisualObservation",
  "reviewerVisibleTextOrLabelCheck",
  "paraphrasedTeachingConcept",
  "modulePlacement",
  "representativenessNote",
  "evidenceLimitations",
  "reviewerNameOrInitials",
  "reviewedAt",
];

const template = readJson(templatePath);
const pack = readJson(packPath);
assertBoundary("template", template);
assertBoundary("pack", pack);

const rows = template.rows.map((row) => {
  const note = batchNotes.get(row.reviewRowId);
  if (!note) return { ...row };
  return {
    ...row,
    ...note,
    reviewerNameOrInitials: reviewerName,
    reviewedAt,
    batchReviewMode: "ai_visual_review_requires_human_confirmation",
    reviewStatus: "blocked_missing_real_wave_3_visual_reviewer_input",
    acceptedForWave3SemanticReview: false,
    acceptedForModuleDistillation: false,
    acceptedForDeletionReadiness: false,
    publicGroundingNeeded: true,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    productionReady: false,
    writeAllowedNow: false,
  };
});

const sampleByReviewRowId = new Map(pack.sampleRowsDetail.map((row) => [row.reviewRowId, row]));
const validationRows = rows.map((row) => {
  const sample = sampleByReviewRowId.get(row.reviewRowId);
  const rowIssues = [];
  if (!sample) rowIssues.push("missing_matching_wave_3_zip_sample");
  if (sample && row.sourceType !== sample.sourceType) rowIssues.push("source_type_mismatch");
  if (!fs.existsSync(row.sampleImagePath)) rowIssues.push("sample_image_missing");
  if (sample && row.sampleImagePath !== sample.sampleImagePath) rowIssues.push("sample_image_path_mismatch");
  if (batchNotes.has(row.reviewRowId) && row.batchReviewMode !== "ai_visual_review_requires_human_confirmation") rowIssues.push("batch_row_missing_ai_review_boundary");
  const missingFields = requiredFields.filter((field) => !text(row[field]));
  if (missingFields.length) rowIssues.push(`missing_fields:${missingFields.join(",")}`);
  const joinedInput = requiredFields.map((field) => text(row[field])).join("\n");
  const hits = forbiddenHits(joinedInput);
  if (hits.length) rowIssues.push(`forbidden_phrases:${hits.join(",")}`);
  if (text(row.paraphrasedTeachingConcept) && !text(row.paraphrasedTeachingConcept).startsWith("Original paraphrase, not copied:")) rowIssues.push("paraphrased_teaching_concept_missing_originality_statement");
  if (row.publicGroundingNeeded !== true) rowIssues.push("public_grounding_must_remain_required_before_module_merge");
  if (row.acceptedForWave3SemanticReview !== false) rowIssues.push("row_must_not_self_accept_wave_3_semantic_review");
  if (row.acceptedForModuleDistillation !== false) rowIssues.push("row_must_not_self_accept_module_distillation");
  if (row.acceptedForDeletionReadiness !== false) rowIssues.push("row_must_not_self_accept_deletion_readiness");
  if (row.reviewStatus !== "blocked_missing_real_wave_3_visual_reviewer_input") rowIssues.push("review_status_must_start_blocked");
  return {
    reviewRowId: row.reviewRowId,
    executionSampleNo: row.executionSampleNo,
    sourceType: row.sourceType,
    recordId: row.recordId,
    batchRow: batchNotes.has(row.reviewRowId),
    validationStatus: rowIssues.length ? "blocked_missing_or_invalid_wave_3_zip_reviewer_input" : "ready_for_wave_3_ai_visual_reviewer_confirmation_gate",
    readyForWave3AiVisualConfirmationGate: rowIssues.length === 0,
    missingFields,
    qualityIssues: rowIssues.filter((issue) => !issue.startsWith("missing_fields:")),
    forbiddenHits: hits,
    nextGate: rowIssues.length
      ? "fill_real_wave_3_zip_reviewer_fields_then_revalidate"
      : "human_confirm_ai_visual_note_then_public_grounding_and_semantic_route",
  };
});

const readyRows = validationRows.filter((row) => row.readyForWave3AiVisualConfirmationGate).length;
const validation = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  validationStatus: "course_5_wave_3_zip_ai_visual_review_batch_002_partially_ready_release_and_deletion_blocked",
  validationMode: "wave_3_zip_ai_visual_review_batch_002_gate",
  inputPath: inputJsonPath,
  sourceExecutionPack: packPath,
  inputRows: validationRows.length,
  batchRows: batchNotes.size,
  pdfRows: 0,
  zipRows: validationRows.length,
  readyRows,
  blockedRows: validationRows.length - readyRows,
  missingFieldRows: validationRows.filter((row) => row.missingFields.length).length,
  qualityIssueRows: validationRows.filter((row) => row.qualityIssues.length).length,
  forbiddenHitRows: validationRows.filter((row) => row.forbiddenHits.length).length,
  acceptedForWave3SemanticReviewRows: 0,
  acceptedForModuleDistillationRows: 0,
  acceptedForDeletionReadinessRows: 0,
  sourceFolderMayBeDeleted: false,
  learnerReadyModules: 0,
  validationRows,
  nextOperationalGates: [
    "Human-confirm or correct the twelve Wave 3 ZIP AI visual batch rows.",
    "Continue Wave 3 ZIP visual review for the remaining unresolved rows.",
    "Run public grounding, originality review, and module distillation gates before any learner-facing use.",
  ],
  completionRule: "This batch validation is complete when exactly twelve Wave 3 ZIP rows contain checked visual observations and all release, module, and deletion gates remain closed.",
  boundary,
};

const input = {
  ...template,
  generatedAt: validation.generatedAt,
  inputTemplateStatus: "course_5_wave_3_zip_ai_visual_review_batch_002_twelve_rows_ready_for_reviewer_confirmation",
  batchReviewMode: "ai_visual_review_requires_human_confirmation",
  batchId,
  batchRows: batchNotes.size,
  readyRows,
  blockedRows: validation.blockedRows,
  sourceFolderMayBeDeleted: false,
  rows,
  boundary,
};

fs.writeFileSync(inputJsonPath, `${JSON.stringify(input, null, 2)}\n`, "utf8");
fs.writeFileSync(validationJsonPath, `${JSON.stringify(validation, null, 2)}\n`, "utf8");
fs.writeFileSync(inputMdPath, [
  "# Course 5 Wave 3 ZIP AI Visual Review Batch 002 Input",
  "",
  `- Batch rows: ${input.batchRows}`,
  `- Ready rows: ${input.readyRows}`,
  `- Blocked rows: ${input.blockedRows}`,
  `- Source folder may be deleted: ${input.sourceFolderMayBeDeleted}`,
  "",
  "## Batch Rows",
  "",
  ...rows.filter((row) => batchNotes.has(row.reviewRowId)).map((row) => [
    `### ${row.reviewRowId}`,
    "",
    `- Module placement: ${row.modulePlacement}`,
    `- Visual observation: ${row.reviewerOwnedVisualObservation}`,
    `- Visible text or labels: ${row.reviewerVisibleTextOrLabelCheck}`,
    `- Teaching concept: ${row.paraphrasedTeachingConcept}`,
    `- Evidence limitations: ${row.evidenceLimitations}`,
    "",
  ].join("\n")),
  "## Boundary",
  "",
  boundary,
  "",
].join("\n"), "utf8");

fs.writeFileSync(validationMdPath, [
  "# Course 5 Wave 3 ZIP AI Visual Review Batch 002 Validation",
  "",
  `- Validation status: ${validation.validationStatus}`,
  `- Input rows: ${validation.inputRows}`,
  `- Batch rows: ${validation.batchRows}`,
  `- Ready rows: ${validation.readyRows}`,
  `- Blocked rows: ${validation.blockedRows}`,
  `- Missing-field rows: ${validation.missingFieldRows}`,
  `- Source folder may be deleted: ${validation.sourceFolderMayBeDeleted}`,
  "",
  "## Ready Rows",
  "",
  ...validationRows.filter((row) => row.readyForWave3AiVisualConfirmationGate).map((row) => `- ${row.reviewRowId}: ${row.nextGate}`),
  "",
  "## Boundary",
  "",
  boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  validationStatus: validation.validationStatus,
  inputRows: validation.inputRows,
  batchRows: validation.batchRows,
  readyRows: validation.readyRows,
  blockedRows: validation.blockedRows,
  sourceFolderMayBeDeleted: validation.sourceFolderMayBeDeleted,
}, null, 2));
