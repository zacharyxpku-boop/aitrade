import fs from "node:fs";

const templatePath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_3_ZIP_REVIEWER_INPUT_TEMPLATE.json";
const packPath = "docs/LOCAL_COURSE_5_WAVE_3_ZIP_EXECUTION_PACK.json";
const inputJsonPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_3_ZIP_AI_VISUAL_REVIEW_BATCH_004_INPUT.json";
const inputMdPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_3_ZIP_AI_VISUAL_REVIEW_BATCH_004_INPUT.md";
const validationJsonPath = "docs/LOCAL_COURSE_5_WAVE_3_ZIP_AI_VISUAL_REVIEW_BATCH_004_VALIDATION.json";
const validationMdPath = "docs/LOCAL_COURSE_5_WAVE_3_ZIP_AI_VISUAL_REVIEW_BATCH_004_VALIDATION.md";

const reviewedAt = "2026-06-25T00:00:00.000+08:00";
const reviewerName = "Codex visual review batch 004";
const batchId = "wave_3_zip_ai_visual_review_batch_004";

const boundary = "Course 5 Wave 3 ZIP AI visual review batch 004 is private reviewer-facing education operations material. It records model-assisted visual observations for twelve Wave 3 ZIP chart samples so they can receive human confirmation before semantic merge preview, public grounding, originality review, teaching-module distillation, or deletion-readiness recomputation. It does not perform OCR, replace human approval, accept machine drafts as final review, merge content into learner-facing modules, delete files, approve source-folder deletion, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

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

const duplicateAware = "Duplicate-aware reinforcement row from a separate ZIP source; useful as an independent evidence record but not a new concept by itself.";
const batchNotes = new Map([
  ["course5_zip_image_review_061", {
    modulePlacement: "trends_and_channels; trendline_context; trading_ranges",
    reviewerOwnedVisualObservation: "The Emini five-minute chart uses drawn lines to mark an early broad range, a strong rise into a channel, a later horizontal consolidation, a sharp pullback, and a final rising channel.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure PII.1 Lines Highlight Trends, E-mini five-minute chart, numbered points 1 through 12, several drawn trend/range lines, and a moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach how lines can make trend, channel, and range transitions easier to inspect without turning lines into mechanical rules.",
    representativenessNote: "High-value addition for trendline and channel-context lessons because it explicitly shows line overlays as teaching aids.",
    evidenceLimitations: "Line placement needs human confirmation before being used in a learner-facing diagram.",
  }],
  ["course5_zip_image_review_062", {
    modulePlacement: "trends_and_channels; trading_ranges; market_regime_transitions",
    reviewerOwnedVisualObservation: "The Emini five-minute chart moves from a prior drift into a long flat middle area, then breaks lower sharply and rebounds from a later low.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 1.1 Extreme Trading Range and Trends, E-mini S&P five-minute chart, lettered points A through C, numbered points 1 through 3, and a moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row reinforces the contrast between an extreme trading range and a later directional trend segment within the same session.",
    representativenessNote: duplicateAware,
    evidenceLimitations: "Separate source copy of a previously reviewed theme; use for evidence coverage, not as a new learner-ready module.",
  }],
  ["course5_zip_image_review_063", {
    modulePlacement: "price_action_foundations; trends_and_channels; candlestick_vocabulary",
    reviewerOwnedVisualObservation: "The sample compares a one-minute Emini chart with many small marked doji-like bars and a monthly Google chart with broader candle examples around major swings.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 2.1 Dojis Are Rarely Perfect, E-mini one-minute chart, GOOG monthly chart, multiple D labels, and numbered points 1 through 3.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row reinforces that doji-like candles often appear imperfect in real charts and need surrounding context.",
    representativenessNote: duplicateAware,
    evidenceLimitations: "D labels and multi-timeframe relationship still require human confirmation.",
  }],
  ["course5_zip_image_review_064", {
    modulePlacement: "price_action_foundations; candlestick_vocabulary; intraday_context",
    reviewerOwnedVisualObservation: "The AAPL five-minute chart shows many intraday bars marked with D, including bars during sharp decline, sideways movement, and later recovery.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 2.2 Intraday Dojis, AAPL five-minute NASDAQ chart, many D markers, a moving average, and session time labels.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row reinforces that doji-like bars are frequent in intraday charts and depend on surrounding trend or range context.",
    representativenessNote: duplicateAware,
    evidenceLimitations: "Learner-facing use should select only a few representative labels.",
  }],
  ["course5_zip_image_review_065", {
    modulePlacement: "reversals; price_action_foundations; volatility_events",
    reviewerOwnedVisualObservation: "The Emini chart highlights two lows where bars have large tails and small bodies, followed by movement away from those areas.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 5.2 Reversal Bar with Big Tail and Small Body, E-mini five-minute chart, numbered lows 1 and 2, volume panel, and moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row reinforces how a large tail and small body may be reviewed as rejection or reversal context inside a session structure.",
    representativenessNote: duplicateAware,
    evidenceLimitations: "It remains an evidence row, not a standalone rule.",
  }],
  ["course5_zip_image_review_066", {
    modulePlacement: "reversals; multi_timeframe_context; price_action_foundations",
    reviewerOwnedVisualObservation: "The sample shows two Emini charts side by side, comparing a smaller-timeframe view with a five-minute view around similar lows and reversal areas.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 6.9 An ii Pattern Is a Smaller Time Frame Reversal, Emini one-minute and five-minute charts, numbered lows 1 and 2, and small boxed areas.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row reinforces that lower-timeframe compression can correspond to reversal structure on a broader chart.",
    representativenessNote: duplicateAware,
    evidenceLimitations: "The ii pattern needs exact human confirmation before module text.",
  }],
  ["course5_zip_image_review_067", {
    modulePlacement: "trends_and_channels; price_action_foundations; trend_strength",
    reviewerOwnedVisualObservation: "The Goldman Sachs five-minute chart shows a steady upward sequence after an early low, with many consecutive trend bars and shallow pauses before a later range near the high.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 11.1 Consecutive Trend Bars in a Trend, GS five-minute chart, numbered points 1 through 12, and moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row reinforces trend strength through repeated directional bars and shallow pullbacks rather than a single candle.",
    representativenessNote: duplicateAware,
    evidenceLimitations: "Needs reviewer simplification before beginner-facing use.",
  }],
  ["course5_zip_image_review_068", {
    modulePlacement: "trends_and_channels; channel_context; risk_context",
    reviewerOwnedVisualObservation: "The Emini five-minute chart shows a broad upward channel with numbered swings, diagonal channel lines, pullbacks, and a later breakout-like rise from the channel area.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 15.8 Entering on Limit Orders in Channels, E-mini five-minute chart, numbered points 1 through 31, channel lines, and moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row reinforces channel-structure education while avoiding conversion into order-execution instruction.",
    representativenessNote: duplicateAware,
    evidenceLimitations: "Original title is execution-oriented; downstream copy must stay structural and educational.",
  }],
  ["course5_zip_image_review_069", {
    modulePlacement: "trends_and_channels; trend_strength; multi_timeframe_context",
    reviewerOwnedVisualObservation: "The sample shows a steep advance on a five-minute Emini chart with a higher-timeframe inset that also shows strong channel-like movement.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 21.6 Steep Channels Are Spikes, E-mini five-minute chart, E-mini sixty-minute inset, numbered points 1 through 13, and moving averages.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row reinforces that a very steep channel may be classified more like a spike in trend-strength lessons.",
    representativenessNote: duplicateAware,
    evidenceLimitations: "Inset relationship still needs human confirmation.",
  }],
  ["course5_zip_image_review_070", {
    modulePlacement: "trends_and_channels; trading_ranges; market_regime_transitions",
    reviewerOwnedVisualObservation: "The Emini five-minute chart trends down overall, but has several two-sided range segments and failed upward attempts before continuing lower.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 22.6 Two-Sided Trading in a Trend Day, E-mini five-minute chart, numbered points 1 through 16, horizontal range marks, and moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row reinforces that a trend day can contain local two-sided trading and range-like sections.",
    representativenessNote: duplicateAware,
    evidenceLimitations: "Pair with non-duplicate trend-day examples before lesson merge.",
  }],
  ["course5_zip_image_review_071", {
    modulePlacement: "volatility_events; risk_context; trends_and_channels",
    reviewerOwnedVisualObservation: "The sample contains three separate chart panels showing abrupt downward moves followed by partial stabilization or rebound attempts.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure I.4 Crashes Are Common, three chart panels, moving averages, and TradeStation/Wiley marks.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row reinforces that abrupt downside moves are recurring chart events and belong in risk-context education.",
    representativenessNote: duplicateAware,
    evidenceLimitations: "The broad title needs careful public grounding before learner-facing use.",
  }],
  ["course5_zip_image_review_072", {
    modulePlacement: "breakouts_and_pullbacks; trends_and_channels; price_action_foundations",
    reviewerOwnedVisualObservation: "The Emini five-minute chart shows an initial upward spike, then a long sequence of two-legged pullbacks and recoveries across a mostly sideways-to-up session.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure PI.1 Two-Legged Pullbacks, E-mini five-minute chart, numbered points 1 through 15, moving average, and time labels.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row reinforces two-legged pullback sequencing as a recurring structure inside a broader session narrative.",
    representativenessNote: duplicateAware,
    evidenceLimitations: "Each leg count needs human confirmation before diagram use.",
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
  validationStatus: "course_5_wave_3_zip_ai_visual_review_batch_004_partially_ready_release_and_deletion_blocked",
  validationMode: "wave_3_zip_ai_visual_review_batch_004_gate",
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
  inputTemplateStatus: "course_5_wave_3_zip_ai_visual_review_batch_004_twelve_rows_ready_for_reviewer_confirmation",
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
  "# Course 5 Wave 3 ZIP AI Visual Review Batch 004 Input",
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
  "# Course 5 Wave 3 ZIP AI Visual Review Batch 004 Validation",
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
