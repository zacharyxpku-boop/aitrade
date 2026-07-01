import fs from "node:fs";

const templatePath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_3_ZIP_REVIEWER_INPUT_TEMPLATE.json";
const packPath = "docs/LOCAL_COURSE_5_WAVE_3_ZIP_EXECUTION_PACK.json";
const inputJsonPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_3_ZIP_AI_VISUAL_REVIEW_BATCH_003_INPUT.json";
const inputMdPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_3_ZIP_AI_VISUAL_REVIEW_BATCH_003_INPUT.md";
const validationJsonPath = "docs/LOCAL_COURSE_5_WAVE_3_ZIP_AI_VISUAL_REVIEW_BATCH_003_VALIDATION.json";
const validationMdPath = "docs/LOCAL_COURSE_5_WAVE_3_ZIP_AI_VISUAL_REVIEW_BATCH_003_VALIDATION.md";

const reviewedAt = "2026-06-25T00:00:00.000+08:00";
const reviewerName = "Codex visual review batch 003";
const batchId = "wave_3_zip_ai_visual_review_batch_003";

const boundary = "Course 5 Wave 3 ZIP AI visual review batch 003 is private reviewer-facing education operations material. It records model-assisted visual observations for twelve Wave 3 ZIP chart samples so they can receive human confirmation before semantic merge preview, public grounding, originality review, teaching-module distillation, or deletion-readiness recomputation. It does not perform OCR, replace human approval, accept machine drafts as final review, merge content into learner-facing modules, delete files, approve source-folder deletion, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

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
  ["course5_zip_image_review_049", {
    modulePlacement: "trading_ranges; reversals; market_regime_transitions",
    reviewerOwnedVisualObservation: "The SPY monthly chart shows several multi-month range areas, large reversals, sharp selloffs, and later recoveries across a long historical span from 1999 to 2011.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure PIV.9 Trading Ranges Leading to Reversals, SPY monthly chart, numbered points 1 through 38, horizontal reference marks, and a moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach how large ranges may precede or frame reversal phases, especially when viewed across a higher timeframe.",
    representativenessNote: "Useful as a bridge between trading-range and reversal modules because it uses a long-term chart rather than an intraday-only example.",
    evidenceLimitations: "Historical index chart only. It should support regime-structure education, not market prediction.",
  }],
  ["course5_zip_image_review_050", {
    modulePlacement: "trends_and_channels; trading_ranges; market_regime_transitions",
    reviewerOwnedVisualObservation: "The Emini five-minute chart moves from a prior drift into a long flat middle area, then breaks lower sharply and rebounds from a later low.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 1.1 Extreme Trading Range and Trends, E-mini S&P five-minute chart, lettered points A through C, numbered points 1 through 3, and a moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach contrast between an extreme trading range and a later directional trend segment within the same session.",
    representativenessNote: "Good introductory trends example because it shows range behavior and trend behavior side by side.",
    evidenceLimitations: "Requires human review before deciding whether it belongs primarily in trends or trading ranges.",
  }],
  ["course5_zip_image_review_051", {
    modulePlacement: "price_action_foundations; trends_and_channels; candlestick_vocabulary",
    reviewerOwnedVisualObservation: "The sample compares a one-minute Emini chart with many small marked doji-like bars and a monthly Google chart with broader candle examples around major swings.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 2.1 Dojis Are Rarely Perfect, E-mini one-minute chart, GOOG monthly chart, multiple D labels, and numbered points 1 through 3.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach that doji-like candles often appear imperfect in real charts and need to be interpreted in context rather than by textbook shape alone.",
    representativenessNote: "Useful for candlestick vocabulary and multi-timeframe comparison.",
    evidenceLimitations: "D labels need reviewer confirmation; no OCR-based text extraction was performed.",
  }],
  ["course5_zip_image_review_052", {
    modulePlacement: "price_action_foundations; candlestick_vocabulary; intraday_context",
    reviewerOwnedVisualObservation: "The AAPL five-minute chart shows many intraday bars marked with D, including bars during sharp decline, sideways movement, and later recovery.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 2.2 Intraday Dojis, AAPL five-minute NASDAQ chart, many D markers, a moving average, and session time labels.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach that doji-like bars are frequent in intraday charts and that their meaning depends on surrounding trend or range context.",
    representativenessNote: "Good companion to the previous doji overview row, focused on intraday examples.",
    evidenceLimitations: "The chart has many labels; a learner-facing module should select only a few representative examples.",
  }],
  ["course5_zip_image_review_053", {
    modulePlacement: "reversals; price_action_foundations; volatility_events",
    reviewerOwnedVisualObservation: "The Emini chart highlights two lows where bars have large tails and small bodies, followed by movement away from those areas.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 5.2 Reversal Bar with Big Tail and Small Body, E-mini five-minute chart, numbered lows 1 and 2, volume panel, and moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach how a large tail and small body may be reviewed as rejection or reversal context when placed inside the surrounding session structure.",
    representativenessNote: "Useful for connecting candlestick shape to reversal context.",
    evidenceLimitations: "One or two highlighted bars are not enough for a standalone rule; it needs comparison examples.",
  }],
  ["course5_zip_image_review_054", {
    modulePlacement: "reversals; multi_timeframe_context; price_action_foundations",
    reviewerOwnedVisualObservation: "The sample shows two Emini charts side by side, comparing a smaller-timeframe view with a five-minute view around similar lows and reversal areas.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 6.9 An ii Pattern Is a Smaller Time Frame Reversal, E-mini one-minute and five-minute charts, numbered lows 1 and 2, and small boxed areas.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach that small inside-inside or compression patterns may reflect lower-timeframe reversal structure when compared across chart intervals.",
    representativenessNote: "Useful for multi-timeframe interpretation and compression-to-reversal vocabulary.",
    evidenceLimitations: "The ii pattern needs exact human confirmation before becoming module text.",
  }],
  ["course5_zip_image_review_055", {
    modulePlacement: "trends_and_channels; price_action_foundations; trend_strength",
    reviewerOwnedVisualObservation: "The Goldman Sachs five-minute chart shows a steady upward sequence after an early low, with many consecutive trend bars and shallow pauses before a later range near the high.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 11.1 Consecutive Trend Bars in a Trend, GS five-minute chart, numbered points 1 through 12, and moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach trend strength through repeated directional bars and shallow pullbacks rather than through any single candle.",
    representativenessNote: "Strong candidate for a trend-strength lesson.",
    evidenceLimitations: "Needs reviewer simplification before it can become a beginner-facing example.",
  }],
  ["course5_zip_image_review_056", {
    modulePlacement: "trends_and_channels; channel_context; risk_context",
    reviewerOwnedVisualObservation: "The Emini five-minute chart shows a broad upward channel with numbered swings, diagonal channel lines, pullbacks, and a later breakout-like rise from the channel area.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 15.8 Entering on Limit Orders in Channels, E-mini five-minute chart, numbered points 1 through 31, channel lines, and moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row should be distilled as channel-structure education, focusing on swing placement and channel boundaries rather than order execution.",
    representativenessNote: "Useful for channel geometry, pullbacks, and broad-channel rhythm.",
    evidenceLimitations: "The title is execution-oriented; downstream material must remove order-placement instruction.",
  }],
  ["course5_zip_image_review_057", {
    modulePlacement: "trends_and_channels; trend_strength; multi_timeframe_context",
    reviewerOwnedVisualObservation: "The sample shows a steep advance on a five-minute Emini chart with a higher-timeframe inset that also shows strong channel-like movement.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 21.6 Steep Channels Are Spikes, E-mini five-minute chart, E-mini sixty-minute inset, numbered points 1 through 13, and moving averages.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach that a very steep channel may behave more like a spike, changing how learners classify trend strength and pullback depth.",
    representativenessNote: "Good example for trend-strength classification across timeframes.",
    evidenceLimitations: "Requires reviewer confirmation of the inset relationship and exact classification wording.",
  }],
  ["course5_zip_image_review_058", {
    modulePlacement: "trends_and_channels; trading_ranges; market_regime_transitions",
    reviewerOwnedVisualObservation: "The Emini five-minute chart trends down overall, but has several two-sided range segments and failed upward attempts before continuing lower.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 22.6 Two-Sided Trading in a Trend Day, E-mini five-minute chart, numbered points 1 through 16, horizontal range marks, and moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach that a trend day can still contain two-sided trading and local ranges, so learners should separate local structure from the broader direction.",
    representativenessNote: "Useful bridge between trend-day and trading-range lessons.",
    evidenceLimitations: "Should be paired with other trend-day examples before learner-facing use.",
  }],
  ["course5_zip_image_review_059", {
    modulePlacement: "volatility_events; risk_context; trends_and_channels",
    reviewerOwnedVisualObservation: "The sample contains three separate chart panels showing abrupt downward moves followed by partial stabilization or rebound attempts.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure I.4 Crashes Are Common, three chart panels, moving averages, and TradeStation/Wiley marks.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach that abrupt downside moves are recurring chart events and that educational analysis should prepare learners to recognize regime shifts without making predictions.",
    representativenessNote: "Useful for risk-context and volatility-event modules.",
    evidenceLimitations: "The title is broad; it needs careful framing and public grounding before module merge.",
  }],
  ["course5_zip_image_review_060", {
    modulePlacement: "breakouts_and_pullbacks; trends_and_channels; price_action_foundations",
    reviewerOwnedVisualObservation: "The Emini five-minute chart shows an initial upward spike, then a long sequence of two-legged pullbacks and recoveries across a mostly sideways-to-up session.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure PI.1 Two-Legged Pullbacks, E-mini five-minute chart, numbered points 1 through 15, moving average, and time labels.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach two-legged pullback sequencing as a recurring structure inside a broader session narrative.",
    representativenessNote: "Good introductory example for pullback counting and rhythm.",
    evidenceLimitations: "Needs reviewer confirmation of each leg count before use as a teaching diagram.",
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
  validationStatus: "course_5_wave_3_zip_ai_visual_review_batch_003_partially_ready_release_and_deletion_blocked",
  validationMode: "wave_3_zip_ai_visual_review_batch_003_gate",
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
  inputTemplateStatus: "course_5_wave_3_zip_ai_visual_review_batch_003_twelve_rows_ready_for_reviewer_confirmation",
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
  "# Course 5 Wave 3 ZIP AI Visual Review Batch 003 Input",
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
  "# Course 5 Wave 3 ZIP AI Visual Review Batch 003 Validation",
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
