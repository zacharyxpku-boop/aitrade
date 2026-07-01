import fs from "node:fs";

const templatePath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_3_ZIP_REVIEWER_INPUT_TEMPLATE.json";
const packPath = "docs/LOCAL_COURSE_5_WAVE_3_ZIP_EXECUTION_PACK.json";
const inputJsonPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_3_ZIP_AI_VISUAL_REVIEW_BATCH_001_INPUT.json";
const inputMdPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_3_ZIP_AI_VISUAL_REVIEW_BATCH_001_INPUT.md";
const validationJsonPath = "docs/LOCAL_COURSE_5_WAVE_3_ZIP_AI_VISUAL_REVIEW_BATCH_001_VALIDATION.json";
const validationMdPath = "docs/LOCAL_COURSE_5_WAVE_3_ZIP_AI_VISUAL_REVIEW_BATCH_001_VALIDATION.md";

const reviewedAt = "2026-06-25T00:00:00.000+08:00";
const reviewerName = "Codex visual review batch 001";

const boundary = "Course 5 Wave 3 ZIP AI visual review batch 001 is private reviewer-facing education operations material. It records model-assisted visual observations for the first twelve Wave 3 ZIP chart samples so they can receive human confirmation before semantic merge preview, public grounding, originality review, teaching-module distillation, or deletion-readiness recomputation. It does not perform OCR, replace human approval, accept machine drafts as final review, merge content into learner-facing modules, delete files, approve source-folder deletion, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

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
  ["course5_zip_image_review_025", {
    modulePlacement: "reversals; trends_and_channels; price_action_foundations",
    reviewerOwnedVisualObservation: "The sample shows a CAT five-minute chart with a sharp reversal up from a low, a long numbered advance, a later horizontal range near the high, and then a selloff from that upper structure.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 1.1 Trading a Major Reversal, CAT five-minute chart, numbered swing labels 1 through 30, and Wiley/TradeStation marks.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can introduce major reversal reading as a sequence of reversal launch, follow-through, range formation, and later opposite-side pressure rather than a single isolated candle.",
    representativenessNote: "Useful opening case for the reversal module because it contains both the reversal impulse and the later context shift.",
    evidenceLimitations: "One historical chart image only. It needs human confirmation, public grounding, and originality review before any teaching-module merge.",
  }],
  ["course5_zip_image_review_026", {
    modulePlacement: "reversals; trends_and_channels; chart_pattern_encyclopedia",
    reviewerOwnedVisualObservation: "The AAPL five-minute chart rises through a channel-like structure, makes a higher high, then produces a lower high and a sharp drop before recovering into later two-way movement.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 3.1 A Higher High Followed by a Lower High, AAPL five-minute chart, trendline markings, numbered points, and a moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row supports teaching the higher-high then lower-high reversal setup as a context pattern where weakening follow-through after an extreme can matter more than the high itself.",
    representativenessNote: "Representative for swing-structure reversal vocabulary and trendline-break discussion.",
    evidenceLimitations: "The image is a single selected example and should be distilled as retrospective structure reading only.",
  }],
  ["course5_zip_image_review_027", {
    modulePlacement: "reversals; trading_ranges; chart_pattern_encyclopedia",
    reviewerOwnedVisualObservation: "The Emini five-minute chart declines into a lower low, rebounds, forms a later higher low, and then rallies into a range-like upper area with several numbered swing points.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 3.2 A Lower Low Followed by a Higher Low, E-mini S&P five-minute chart, numbered lows and highs, moving average, and TradeStation/Wiley marks.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach the lower-low then higher-low reversal pattern as a bottoming sequence where the second low changes the structure from continuation into potential reversal context.",
    representativenessNote: "Good counterpart to the higher-high/lower-high sample and useful for a paired reversal lesson.",
    evidenceLimitations: "Needs cross-example synthesis before it becomes a learner-ready pattern card.",
  }],
  ["course5_zip_image_review_028", {
    modulePlacement: "reversals; trends_and_channels; price_action_foundations",
    reviewerOwnedVisualObservation: "The Emini five-minute chart shows an upward move whose slope accelerates into a climactic-looking high, followed by a rapid decline and then a later recovery or range.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 4.14 Increased Slope Usually Means Climactic Emotion, E-mini S&P five-minute chart, numbered points 1 through 18, and moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row supports a lesson on parabolic acceleration, where a steeper slope can mark emotional late-stage movement and increase the need to reassess trend maturity.",
    representativenessNote: "High-value example for trend-slope acceleration and climactic context.",
    evidenceLimitations: "The teaching point must stay observational and should not be converted into a directive rule.",
  }],
  ["course5_zip_image_review_029", {
    modulePlacement: "trading_ranges; reversals; chart_pattern_encyclopedia",
    reviewerOwnedVisualObservation: "The Emini chart contains a tight sideways area after an earlier move, then a later downward continuation and several numbered attempts to stabilize into range behavior.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 7.2 Tight Trading Range as a Final Flag, E-mini five-minute chart, numbered points, horizontal range area, and moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row helps teach how a compact range can act as a final flag or transition area, so learners should inspect what follows the compression rather than treating the range as neutral by itself.",
    representativenessNote: "Useful case for linking trading-range compression with final-flag vocabulary.",
    evidenceLimitations: "Requires human reviewer confirmation of the range boundaries and relation to the following leg.",
  }],
  ["course5_zip_image_review_030", {
    modulePlacement: "reversals; trends_and_channels; chart_pattern_encyclopedia",
    reviewerOwnedVisualObservation: "The Emini chart compares two sessions with tests around trend extremes. The left side shows a push up and later decline, while the right side shows a strong rise, pullback, and retest behavior near the high.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 9.12 Two-Legged Test of Trend Extreme, E-mini S&P five-minute chart, numbered points, vertical session separators, and moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can support teaching two-legged tests of an extreme, where the second attempt around a high or low is reviewed as context rather than as a standalone pattern name.",
    representativenessNote: "Good evidence for a lesson on retests and second attempts around extremes.",
    evidenceLimitations: "The two-session comparison needs careful simplification before learner-facing use.",
  }],
  ["course5_zip_image_review_031", {
    modulePlacement: "trading_ranges; reversals; market_session_context",
    reviewerOwnedVisualObservation: "The Emini premarket chart shows an early range, a downward break or probe from that area, and then a bounce with numbered reference points around the premarket structure.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 14.2 Trading the Premarket, E-mini five-minute chart, numbered points 1 through 6, session timing labels, and moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row supports a session-context lesson about how premarket range boundaries and early probes can frame later chart interpretation without becoming standalone instructions.",
    representativenessNote: "Useful for separating session-context material from core pattern vocabulary.",
    evidenceLimitations: "Premarket examples are context-sensitive and require public grounding before module use.",
  }],
  ["course5_zip_image_review_032", {
    modulePlacement: "trading_ranges; trends_and_channels; market_session_context",
    reviewerOwnedVisualObservation: "The EUR/USD five-minute chart shows a strong open into upper range behavior, a later channel down toward a low, and then a recovery back through the moving average.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 21.2 Strong Open in the EUR/USD, EUR/USD five-minute chart, numbered points, moving average, and TradeStation/Wiley marks.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach that a strong open may later transition into a range or channel, so learners should update the session story as new swings appear.",
    representativenessNote: "Good case for open-drive context followed by range/channel transition.",
    evidenceLimitations: "Foreign-exchange context should be kept generic and educational unless grounded with public sources.",
  }],
  ["course5_zip_image_review_033", {
    modulePlacement: "breakouts_and_pullbacks; trading_ranges; reversals",
    reviewerOwnedVisualObservation: "The FCX daily chart shows several stair-step breakout areas drawn with horizontal levels. The sequence includes upward stair steps, failed continuation into a decline, lower stair steps, and a later recovery toward a range.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure 23.2 Fade Stair Breakouts with Options, FCX daily NYSE chart, numbered points 1 through 16, horizontal breakout levels, and moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can support a lesson on stair-step breakout structures and why repeated level breaks need context from follow-through, retests, and range development.",
    representativenessNote: "Useful for breakout-level mapping and failed-continuation discussion.",
    evidenceLimitations: "The title references options, but this artifact should only preserve chart-structure education unless separately grounded and reviewed.",
  }],
  ["course5_zip_image_review_034", {
    modulePlacement: "market_session_context; trends_and_channels; reversals",
    reviewerOwnedVisualObservation: "The Emini five-minute chart shows early bars setting a tone after the session boundary, followed by an initial rally attempt, pullback into a low, gradual rise, range near midday, and a late spike with pullback.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure PIII.2 The First Few Bars Can Set the Tone, E-mini S&P five-minute chart, numbered points 1 through 15, session separator, and moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row supports a lesson on opening context, where the first few bars are used to frame possible session character while later swings can still revise the story.",
    representativenessNote: "Good sample for a module on open analysis and intraday narrative updates.",
    evidenceLimitations: "Opening behavior is not deterministic and must be taught as retrospective interpretation.",
  }],
  ["course5_zip_image_review_035", {
    modulePlacement: "trading_ranges; price_action_foundations; risk_context",
    reviewerOwnedVisualObservation: "The INTC five-minute chart shows a prior strong rise, then a narrow post-open range with small swings, overlapping bars, and limited distance between highs and lows before a later recovery.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure PIII.3 Don't Scalp Stocks with Small Ranges, INTC five-minute NASDAQ chart, numbered points 1 through 6, session separator, and moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach range-size awareness: when the chart is compressed and overlapping, the educational focus is on recognizing limited movement and noisy structure.",
    representativenessNote: "Useful as a cautionary chart-reading case for small-range conditions.",
    evidenceLimitations: "The title contains action-oriented wording; the module should convert it into neutral range-recognition education.",
  }],
  ["course5_zip_image_review_036", {
    modulePlacement: "trading_ranges; market_session_context; trends_and_channels",
    reviewerOwnedVisualObservation: "The Emini five-minute chart shows early overlapping bars around the open, then a long two-way range with gradual drift down and a later recovery into the afternoon.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure PIII.4 Early Barbwire Often Leads to a Trading Range Day, E-mini S&P five-minute chart, numbered points 1 through 10, session separator, and moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row supports a lesson on early overlapping price action as a clue for later range-like behavior, while still requiring learners to track subsequent swings.",
    representativenessNote: "Strong candidate for the trading-range module because it connects early bar overlap with later range development.",
    evidenceLimitations: "Needs comparison with other range-day examples before becoming a complete teaching module.",
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

const input = {
  ...template,
  generatedAt: new Date().toISOString(),
  inputTemplateStatus: "course_5_wave_3_zip_ai_visual_review_batch_001_twelve_rows_ready_for_reviewer_confirmation",
  batchReviewMode: "ai_visual_review_requires_human_confirmation",
  batchId: "wave_3_zip_ai_visual_review_batch_001",
  batchRows: batchNotes.size,
  readyRows: batchNotes.size,
  blockedRows: rows.length - batchNotes.size,
  sourceFolderMayBeDeleted: false,
  rows,
  boundary,
};

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
  if (text(row.paraphrasedTeachingConcept) && !/Original paraphrase, not copied:/.test(text(row.paraphrasedTeachingConcept))) rowIssues.push("paraphrased_teaching_concept_missing_originality_statement");
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
const blockedRows = validationRows.length - readyRows;
const validation = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  validationStatus: "course_5_wave_3_zip_ai_visual_review_batch_001_partially_ready_release_and_deletion_blocked",
  validationMode: "wave_3_zip_ai_visual_review_batch_001_gate",
  inputPath: inputJsonPath,
  sourceExecutionPack: packPath,
  inputRows: validationRows.length,
  batchRows: batchNotes.size,
  pdfRows: 0,
  zipRows: validationRows.length,
  readyRows,
  blockedRows,
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
    "Continue Wave 3 ZIP visual review for the remaining forty-nine rows.",
    "Run public grounding, originality review, and module distillation gates before any learner-facing use.",
  ],
  completionRule: "This batch validation is complete when exactly the first twelve Wave 3 ZIP rows contain checked visual observations and all release, module, and deletion gates remain closed.",
  boundary,
};

fs.writeFileSync(inputJsonPath, `${JSON.stringify(input, null, 2)}\n`, "utf8");
fs.writeFileSync(validationJsonPath, `${JSON.stringify(validation, null, 2)}\n`, "utf8");

fs.writeFileSync(inputMdPath, [
  "# Course 5 Wave 3 ZIP AI Visual Review Batch 001 Input",
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
  "# Course 5 Wave 3 ZIP AI Visual Review Batch 001 Validation",
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
