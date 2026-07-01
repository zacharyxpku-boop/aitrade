import fs from "node:fs";

const templatePath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_3_ZIP_REVIEWER_INPUT_TEMPLATE.json";
const packPath = "docs/LOCAL_COURSE_5_WAVE_3_ZIP_EXECUTION_PACK.json";
const inputJsonPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_3_ZIP_AI_VISUAL_REVIEW_BATCH_005_INPUT.json";
const inputMdPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_3_ZIP_AI_VISUAL_REVIEW_BATCH_005_INPUT.md";
const validationJsonPath = "docs/LOCAL_COURSE_5_WAVE_3_ZIP_AI_VISUAL_REVIEW_BATCH_005_VALIDATION.json";
const validationMdPath = "docs/LOCAL_COURSE_5_WAVE_3_ZIP_AI_VISUAL_REVIEW_BATCH_005_VALIDATION.md";

const reviewedAt = "2026-06-25T00:00:00.000+08:00";
const reviewerName = "Codex visual review batch 005";
const batchId = "wave_3_zip_ai_visual_review_batch_005";
const boundary = "Course 5 Wave 3 ZIP AI visual review batch 005 is private reviewer-facing education operations material. It closes the remaining Wave 3 ZIP chart samples with model-assisted visual observations for later human confirmation. It does not perform OCR, replace human approval, merge content into learner-facing modules, approve source-folder deletion, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, execution instructions, automation, write authorization, or production readiness.";

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
  ["course5_zip_image_review_073", {
    modulePlacement: "trends_and_channels; trendline_context; trading_ranges",
    reviewerOwnedVisualObservation: "The Emini five-minute chart uses drawn range and channel lines to mark an early broad range, a strong advance, a later horizontal pause, a sharp pullback, and a final rising channel.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Figure PII.1 Lines Highlight Trends, E-mini five-minute chart, numbered points 1 through 12, several drawn trend or range lines, and a moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row reinforces how chart lines can make trend, channel, and range transitions easier to inspect as visual context.",
    representativenessNote: duplicateAware,
    evidenceLimitations: "Line placement remains reviewer-confirmation material before any learner-facing diagram use.",
  }],
  ["course5_zip_image_review_074", {
    modulePlacement: "trend_reversals; swing_structure; price_action_foundations",
    reviewerOwnedVisualObservation: "The AAPL daily chart marks multiple swing highs and lows across an advance, a deep decline, and a later recovery, with B and S labels placed near turning areas.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include AAPL Daily NASDAQ, numbered points 1 through 14, B and S markers, a moving average, and monthly time labels.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can support teaching how annotated swing points summarize alternating pressure across a larger chart cycle.",
    representativenessNote: "High-value addition because it moves from intraday examples to a daily chart with several regime shifts.",
    evidenceLimitations: "The B and S labels should be treated as historical annotations, not learner instructions.",
  }],
  ["course5_zip_image_review_075", {
    modulePlacement: "breakouts_and_pullbacks; gaps_and_volatility; trading_ranges",
    reviewerOwnedVisualObservation: "The Costco five-minute chart starts with quiet range behavior, spikes upward, reverses sharply through the range, rebounds, and later drops into a lower range.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include COST five-minute NASDAQ, numbered points 1 through 7, two horizontal reference lines, and a moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach how range breaks, reversal pressure, and later lower consolidation can appear in one intraday sequence.",
    representativenessNote: "Useful as a compact regime-transition example with both upside expansion and downside continuation.",
    evidenceLimitations: "Horizontal reference levels need reviewer confirmation before being used as teaching overlays.",
  }],
  ["course5_zip_image_review_076", {
    modulePlacement: "volatility_events; trend_reversals; comparative_chart_reading",
    reviewerOwnedVisualObservation: "The three-panel image compares separate intraday charts that each show a sharp downward leg followed by partial stabilization or rebound attempts.",
    reviewerVisibleTextOrLabelCheck: "Visible text is mostly cropped, but three chart panels, moving averages, and vertical session separators are visible.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can support a comparison lesson on abrupt downside moves recurring across different chart contexts.",
    representativenessNote: "Useful for pattern comparison, but weaker than single-chart samples because labels and instrument names are cropped.",
    evidenceLimitations: "Cropped labels limit source-specific interpretation; retain as supporting evidence only.",
  }],
  ["course5_zip_image_review_077", {
    modulePlacement: "trends_and_channels; trend_reversals; pullback_structure",
    reviewerOwnedVisualObservation: "The Emini five-minute chart rises early, flattens, then forms a long downward drift with numbered pauses and a late rebound from the lowest area.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include Emini five-minute CME, numbered points 1 through 7, price scale, time labels, and a moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach how an early advance can transition into a sustained downward sequence with intermediate pauses.",
    representativenessNote: "Useful for showing trend transition and later exhaustion-like rebound context.",
    evidenceLimitations: "The numbered sequence needs human confirmation before being used for lesson steps.",
  }],
  ["course5_zip_image_review_078", {
    modulePlacement: "trends_and_channels; trendline_context; reversals",
    reviewerOwnedVisualObservation: "The AAPL five-minute chart shows a sharp decline from a marked high, several descending trendline overlays, a lower horizontal base, and a later recovery.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include AAPL five-minute NASDAQ, numbered points 1 through 9, multiple downward sloping lines, a horizontal line near the base, and a moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach how several candidate trendlines frame a down move before price shifts into basing and recovery behavior.",
    representativenessNote: "High-value trendline-context sample because it shows multiple line choices on the same decline.",
    evidenceLimitations: "Trendline choice is interpretive and should remain reviewer-confirmed.",
  }],
  ["course5_zip_image_review_079", {
    modulePlacement: "trends_and_channels; pullback_structure; trend_strength",
    reviewerOwnedVisualObservation: "The SPY five-minute chart trends downward with repeated small rebounds below a falling moving average and many numbered swing points along the decline.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include SPY five-minute AMEX, numbered points 1 through 19, price scale, time labels, and a moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach a trend day as a chain of weak rebounds and lower pushes rather than one continuous bar sequence.",
    representativenessNote: "Strong teaching sample for segmented trend reading and repeated pullback comparison.",
    evidenceLimitations: "The dense numbering should be simplified before beginner-facing use.",
  }],
  ["course5_zip_image_review_080", {
    modulePlacement: "trends_and_channels; pullback_structure; market_regime_transitions",
    reviewerOwnedVisualObservation: "The Emini three-minute chart shows a sharp mid-session selloff, five numbered continuation points, then a lower range and partial rebound attempt.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include ESM08 three-minute CME, numbered points 1 through 5, price scale, time labels, and a moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach how a strong directional leg can later slow into range-like behavior without immediately erasing the earlier trend context.",
    representativenessNote: "Useful as a compact example of selloff, pause, and late rebound behavior.",
    evidenceLimitations: "It needs reviewer context before being connected to any named setup.",
  }],
  ["course5_zip_image_review_081", {
    modulePlacement: "trends_and_channels; pullback_structure; trend_strength",
    reviewerOwnedVisualObservation: "The Emini five-minute chart trends down overall, includes a mid-chart rebound into the moving average, then resumes lower with a small late pause near the lows.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include ESU08 five-minute CME, numbered points 1 through 13, a short drawn line around points 7 and 8, price scale, and moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach how a downtrend can include countertrend pushes that remain structurally below prior resistance areas.",
    representativenessNote: "Useful for comparing pullbacks within an ongoing decline.",
    evidenceLimitations: "The drawn mini-channel around points 7 and 8 needs human confirmation.",
  }],
  ["course5_zip_image_review_082", {
    modulePlacement: "trading_ranges; breakouts_and_pullbacks; reversals",
    reviewerOwnedVisualObservation: "The Emini five-minute chart begins with choppy two-sided movement, repeatedly tests local highs and lows, then breaks upward strongly from the right side of the range.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include ESM08 five-minute CME, numbered points 1 through 14, several short horizontal marks, time labels, price scale, and a moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach how repeated range tests can precede a later directional expansion.",
    representativenessNote: "Useful as a range-to-breakout example with many annotated tests.",
    evidenceLimitations: "The many numbered tests should be reduced to a simpler subset before module writing.",
  }],
  ["course5_zip_image_review_083", {
    modulePlacement: "trends_and_channels; trading_ranges; trend_strength",
    reviewerOwnedVisualObservation: "The Goldman Sachs five-minute chart shows a steady decline below a falling moving average, a brief mid-chart pause, and a late tight downward channel marked by a line.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include GS five-minute NYSE, numbered points 1 through 3, a drawn descending line near the lows, price scale, time labels, and a moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach how a trend can compress into a tight channel after a long directional move.",
    representativenessNote: "Useful as a simple downtrend-to-tight-channel evidence row.",
    evidenceLimitations: "The tight channel line is interpretive and should remain reviewer-confirmed.",
  }],
  ["course5_zip_image_review_084", {
    modulePlacement: "trends_and_channels; trendline_context; pullback_structure",
    reviewerOwnedVisualObservation: "The Goldman Sachs five-minute chart shows an early downward channel overlay, continuation below a falling moving average, a midday low, and a later rebound that fails to fully reverse the day.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include GS five-minute NYSE, numbered points 1 through 5, several descending trendlines, price scale, time labels, and a moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can teach how early trendline structure can frame a larger downtrend and later rebound attempt.",
    representativenessNote: "Useful paired with the prior GS sample because it shows a wider view of the same type of decline.",
    evidenceLimitations: "Possible overlap with nearby samples should be handled as reinforcement evidence.",
  }],
  ["course5_zip_image_review_085", {
    modulePlacement: "comparative_chart_reading; volatility_events; trend_reversals",
    reviewerOwnedVisualObservation: "The six-panel screen compares multiple five-minute stock charts, each marked with one numbered event around sharp spikes, reversals, or strong directional moves.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include AMZN, RIMM, POT, FCX, GS, SKF five-minute charts, numbered points 1 through 6, moving averages, and a TradeStation toolbar.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can support a comparative lesson on how abrupt event bars and reversals appear across several instruments.",
    representativenessNote: "Useful for cross-example comparison, but not ideal for a primary lesson graphic because each panel is small.",
    evidenceLimitations: "Panel-level details are compressed; use as overview evidence unless individual panels are re-extracted.",
  }],
]);

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
    archiveImageName: row.archiveImageName,
    sampleImagePath: row.sampleImagePath,
    batchRow: batchNotes.has(row.reviewRowId),
    readyForReviewerConfirmation: rowIssues.length === 0,
    issues: rowIssues,
  };
});

const batchRows = validationRows.filter((row) => row.batchRow);
const readyRows = validationRows.filter((row) => row.readyForReviewerConfirmation);
const blockedRows = validationRows.filter((row) => !row.readyForReviewerConfirmation);
const forbiddenHitRows = validationRows.filter((row) => row.issues.some((issue) => issue.startsWith("forbidden_phrases:")));
const missingFieldRows = validationRows.filter((row) => row.issues.some((issue) => issue.startsWith("missing_fields:")));
const expectedIds = Array.from({ length: 13 }, (_, index) => `course5_zip_image_review_${String(index + 73).padStart(3, "0")}`);
const actualIds = batchRows.map((row) => row.reviewRowId);

if (rows.length !== 61) fail(`expected 61 input rows, got ${rows.length}`);
if (batchRows.length !== 13) fail(`expected 13 batch rows, got ${batchRows.length}`);
if (readyRows.length !== 13) fail(`expected 13 ready rows, got ${readyRows.length}`);
if (blockedRows.length !== 48) fail(`expected 48 blocked rows, got ${blockedRows.length}`);
if (forbiddenHitRows.length !== 0) fail(`expected 0 forbidden hit rows, got ${forbiddenHitRows.length}`);
if (missingFieldRows.length !== 48) fail(`expected 48 missing field rows, got ${missingFieldRows.length}`);
if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) fail(`unexpected batch ids ${actualIds.join(",")}`);

const inputArtifact = {
  ...template,
  generatedAt: reviewedAt,
  inputTemplateStatus: "course_5_wave_3_zip_ai_visual_review_batch_005_final_rows_ready_for_reviewer_confirmation",
  rows,
  readyRows: readyRows.length,
  blockedRows: blockedRows.length,
  batchReviewMode: "ai_visual_review_requires_human_confirmation",
  batchId,
  batchRows: batchRows.length,
  sourceFolderMayBeDeleted: false,
  boundary,
};

const validationArtifact = {
  generatedAt: reviewedAt,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  validationStatus: "course_5_wave_3_zip_ai_visual_review_batch_005_final_rows_ready_release_and_deletion_blocked",
  validationMode: "wave_3_zip_ai_visual_review_batch_005_gate",
  inputPath: inputJsonPath,
  sourceExecutionPack: packPath,
  inputRows: rows.length,
  batchRows: batchRows.length,
  pdfRows: 0,
  zipRows: rows.length,
  readyRows: readyRows.length,
  blockedRows: blockedRows.length,
  missingFieldRows: missingFieldRows.length,
  qualityIssueRows: validationRows.filter((row) => row.issues.some((issue) => !issue.startsWith("missing_fields:"))).length,
  forbiddenHitRows: forbiddenHitRows.length,
  acceptedForWave3SemanticReviewRows: 0,
  acceptedForModuleDistillationRows: 0,
  acceptedForDeletionReadinessRows: 0,
  sourceFolderMayBeDeleted: false,
  learnerReadyModules: 0,
  validationRows,
  nextOperationalGates: [
    "Human reviewer confirmation is still required before semantic merge.",
    "Public grounding and originality review must remain blocked.",
    "Course 5 source folder deletion remains blocked.",
  ],
  completionRule: "Batch 005 closes the remaining Wave 3 ZIP AI visual review rows but does not approve module merge, learner-facing release, or source-folder deletion.",
  boundary,
};

assertBoundary("input", inputArtifact);
assertBoundary("validation", validationArtifact);

fs.writeFileSync(inputJsonPath, `${JSON.stringify(inputArtifact, null, 2)}\n`);
fs.writeFileSync(validationJsonPath, `${JSON.stringify(validationArtifact, null, 2)}\n`);

const mdRows = rows
  .filter((row) => batchNotes.has(row.reviewRowId))
  .map((row) => `| ${row.reviewRowId} | ${row.executionSampleNo} | ${row.archiveImageName} | ${row.modulePlacement} | ${row.reviewerOwnedVisualObservation} |`)
  .join("\n");

fs.writeFileSync(inputMdPath, `# Local Course 5 Wave 3 ZIP AI Visual Review Batch 005\n\n${boundary}\n\n| Review row | Sample | Archive image | Module placement | Visual observation |\n|---|---:|---|---|---|\n${mdRows}\n\nSource folder may be deleted: false\n`);

fs.writeFileSync(validationMdPath, `# Local Course 5 Wave 3 ZIP AI Visual Review Batch 005 Validation\n\n- Status: ${validationArtifact.validationStatus}\n- Input rows: ${validationArtifact.inputRows}\n- Batch rows: ${validationArtifact.batchRows}\n- Ready rows: ${validationArtifact.readyRows}\n- Blocked rows: ${validationArtifact.blockedRows}\n- Missing field rows: ${validationArtifact.missingFieldRows}\n- Forbidden hit rows: ${validationArtifact.forbiddenHitRows}\n- Source folder may be deleted: ${validationArtifact.sourceFolderMayBeDeleted}\n- Learner-ready modules: ${validationArtifact.learnerReadyModules}\n`);

console.log(JSON.stringify({
  ok: true,
  validationStatus: validationArtifact.validationStatus,
  inputRows: validationArtifact.inputRows,
  batchRows: validationArtifact.batchRows,
  readyRows: validationArtifact.readyRows,
  blockedRows: validationArtifact.blockedRows,
  sourceFolderMayBeDeleted: validationArtifact.sourceFolderMayBeDeleted,
}, null, 2));
