import fs from "node:fs";

const templatePath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_2_P1_REVIEWER_INPUT_TEMPLATE.json";
const packPath = "docs/LOCAL_COURSE_5_WAVE_2_P1_EXECUTION_PACK.json";
const inputJsonPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_2_P1_AI_VISUAL_REVIEW_PILOT_INPUT.json";
const inputMdPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_2_P1_AI_VISUAL_REVIEW_PILOT_INPUT.md";
const validationJsonPath = "docs/LOCAL_COURSE_5_WAVE_2_P1_AI_VISUAL_REVIEW_PILOT_VALIDATION.json";
const validationMdPath = "docs/LOCAL_COURSE_5_WAVE_2_P1_AI_VISUAL_REVIEW_PILOT_VALIDATION.md";

const reviewedAt = "2026-06-25T00:00:00.000+08:00";
const reviewerName = "Codex visual review pilot";

const boundary = "Course 5 Wave 2 P1 AI visual review pilot is private reviewer-facing education operations material. It records model-assisted visual observations for the twelve Wave 2 ZIP samples so they can receive human confirmation before semantic merge preview, public grounding, originality review, teaching-module distillation, or deletion-readiness recomputation. It does not perform OCR, replace human approval, accept machine drafts as final review, merge content into learner-facing modules, delete files, approve source-folder deletion, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

const forbiddenPhrases = [
  "buy signal",
  "sell signal",
  "must buy",
  "must sell",
  "recommended buy",
  "recommended sell",
  "guaranteed return",
  "win rate",
  "stop loss instruction",
  "real money",
  "broker",
  "auto trading",
  "approved for release",
  "learner-facing approved",
  "write allowed",
  "delete source",
];

const pilotNotes = new Map([
  ["course5_zip_image_review_013", {
    modulePlacement: "trends_and_channels; trading_ranges; reversals",
    reviewerOwnedVisualObservation: "The sample shows an Emini five-minute day that begins with a bear trend from the open, then transitions into a lower-low major trend reversal attempt and an expanding-triangle structure. Several wedges near the EMA and failed breakout areas are marked.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include bear trend from the open, lower-high double top after five bear bars, breakout below wedge, wedge at EMA, lower-low major trend reversal, failed breakout above wedge, and expanding triangle.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row illustrates how an opening directional move can evolve into a broader two-way structure, where wedges, failed breakouts, and expanding-triangle boundaries become the main teaching objects.",
    representativenessNote: "High-value case for transition from trend-from-open into expanding triangle and reversal discussion.",
    evidenceLimitations: "One annotated session only. It should support chart-reading vocabulary and structure sequencing, not prescriptive action.",
  }],
  ["course5_zip_image_review_014", {
    modulePlacement: "reversals; trends_and_channels; chart_pattern_encyclopedia",
    reviewerOwnedVisualObservation: "The sample shows a double-bottom area followed by a small-pullback bull trend and then a tight trading range or final bull flag. It marks a parabolic wedge, breakout test, measuring-gap idea, and higher-high major trend reversal area.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include double bottom then bull trend from the open, parabolic wedge, small pullback bull trend, breakout test, possible measuring gap, tight trading range, final bull flag, and higher-high major trend reversal.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row supports a lesson on how a reversal base can become a trend-from-open sequence, then mature into a range where later continuation attempts need separate evaluation.",
    representativenessNote: "Strong case for double-bottom-to-trend transition and late-session range formation.",
    evidenceLimitations: "Some labels use course shorthand. Public grounding and originality review remain required before module use.",
  }],
  ["course5_zip_image_review_015", {
    modulePlacement: "reversals; trading_ranges; chart_pattern_encyclopedia",
    reviewerOwnedVisualObservation: "The chart starts with a sell climax and wedge sequence, rallies into a triangular range, fails above that triangle, and then resumes lower with another breakout below the trading range before a higher-low major trend reversal attempt.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include sell climax, rally, resumption down, double-top pullback, consecutive wedges, measured move, breakout below wedge, second-leg trap, double bottom pullback, failed breakout above triangle, breakout below trading range, and higher-low major trend reversal.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row illustrates sequence reading: climax, rally, range compression, failed breakout, and trend resumption can all appear in one session, so learners should track phase changes instead of naming one pattern in isolation.",
    representativenessNote: "High-density case for multi-phase day structure and failed-breakout vocabulary.",
    evidenceLimitations: "Dense annotations require reviewer simplification before becoming a learner-facing lesson.",
  }],
  ["course5_zip_image_review_016", {
    modulePlacement: "trends_and_channels; chart_pattern_encyclopedia; price_action_foundations",
    reviewerOwnedVisualObservation: "The sample shows a wedge bottom followed by a strong bull trend. The chart highlights a bull major surprise breakout, repeated green continuation areas, wedge-top attempts that fail, and later pullbacks around the moving average.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include wedge bottom and strong bull trend, small pullback bull trend, strong bull trends form many wedge tops that fail, dominant feature of the day, moving average, and profit-taking areas.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row shows how a strong trend can make multiple reversal-looking wedge tops fail, turning the main teaching point into trend strength and follow-through rather than pattern naming alone.",
    representativenessNote: "Useful for small-pullback bull trend, wedge-bottom launch, and failed counter-trend attempts.",
    evidenceLimitations: "Original slide contains action-oriented phrases. This artifact keeps it as neutral historical chart analysis.",
  }],
  ["course5_zip_image_review_017", {
    modulePlacement: "reversals; trading_ranges; volatility_events",
    reviewerOwnedVisualObservation: "The sample shows a bull trend and range-like behavior before a sharp FOMC-related reversal down. It marks wedge, Low 2, higher-high major trend reversal, major bear surprise, final flag, breakout test, and higher-low double bottom.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include bull trend then reversal down on FOMC, wedge, Low 2, higher-high major trend reversal, major bear surprise, final flag, breakout test, and higher-low double bottom.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row supports a volatility-event lesson where an established intraday structure can be abruptly repriced, requiring learners to separate pre-event pattern context from the later surprise move.",
    representativenessNote: "Good case for event-driven regime shift and post-shock structure review.",
    evidenceLimitations: "FOMC context is event-specific. It should not be generalized without public grounding and broader examples.",
  }],
  ["course5_zip_image_review_018", {
    modulePlacement: "trading_ranges; breakouts_and_pullbacks; reversals",
    reviewerOwnedVisualObservation: "The sample shows a trading range day with repeated failed breakouts above and below the range, a wedge/tight-channel area, consecutive wedges, a midday reversal, and a late bull breakout.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include trading range day, many failed breakouts up and down, failed breakout above double top, wedge but tails and tight channel, consecutive wedges, midday reversal, failed breakout below double bottom and trading range, and late bull breakout.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row illustrates trading-range logic where repeated failed breakouts are more central to the lesson than any single directional move.",
    representativenessNote: "Strong example for range-bound day classification and failed-breakout comparison.",
    evidenceLimitations: "Requires careful neutral phrasing; the course should teach observation of range behavior, not trading directives.",
  }],
  ["course5_zip_image_review_019", {
    modulePlacement: "trading_ranges; trends_and_channels; chart_pattern_encyclopedia",
    reviewerOwnedVisualObservation: "The sample shows a broad bull channel and trending trading range. It marks a big gap down, truncated wedge/double-triple bottom, measured move from a surprise breakout, multiple double tops and double bottoms, a micro-channel sell climax, and a double-top bull trap.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include broad bull channel, trending trading range, big gap down, double top trap, truncated wedge, double or triple bottom, measured move, wedge top, double top, double bottom, micro-channel sell climax, and double-top bull trap.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row supports teaching the difference between a directional channel and a range that trends gradually while still producing many two-sided failures.",
    representativenessNote: "High-value case for broad-channel/range hybrid classification.",
    evidenceLimitations: "The source includes order-management commentary. The distilled lesson must keep only structural analysis.",
  }],
  ["course5_zip_image_review_020", {
    modulePlacement: "reversals; trading_ranges; chart_pattern_encyclopedia",
    reviewerOwnedVisualObservation: "The chart shows an early bear trap and outside-up reversal, a rally into a failed breakout above a wedge, a lower-high double top, a major bear breakout, and later wedge/higher-low double-bottom structure inside a trading range day.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include bear trap then trading range day, failed breakout above wedge, lower-high double top, major bear breakout, outside-up reversal, wedge, and higher-low double bottom.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row illustrates how early trap behavior can lead to range development, with later breakout attempts and double-top/double-bottom structures needing context-based interpretation.",
    representativenessNote: "Useful for trap-to-range day sequencing and two-sided structure review.",
    evidenceLimitations: "Needs reviewer simplification before use in a beginner lesson.",
  }],
  ["course5_zip_image_review_021", {
    modulePlacement: "reversals; trends_and_channels; chart_pattern_encyclopedia",
    reviewerOwnedVisualObservation: "The sample shows a sell climax followed by reversal up. It marks a minor buy climax, a 15-bar bull micro-channel, a cup-and-handle region, and a minor wedge near the later high.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include sell climax, reversal up, minor buy climax, 15-bar bull micro-channel, cup and handle, and minor wedge.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row is useful for showing how a strong reversal can develop into a sustained micro-channel and later consolidation structure.",
    representativenessNote: "Good case for sell-climax reversal and subsequent bull micro-channel vocabulary.",
    evidenceLimitations: "The slide is one day sample; it needs public grounding and originality review before learner-facing use.",
  }],
  ["course5_zip_image_review_022", {
    modulePlacement: "reversals; trends_and_channels; chart_pattern_encyclopedia",
    reviewerOwnedVisualObservation: "The sample shows a bull trend from the open that transitions into a reversal down. It marks a parabolic wedge, minor higher-high double top, double-top lower high, major trend reversal, small-pullback bear trend, minor parabolic wedge, and higher low.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include bull trend from the open then reversal down, parabolic wedge, minor higher-high double top, double-top lower high, major trend reversal, small pullback bear trend, minor parabolic wedge, and higher low.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row supports a full-day lifecycle lesson from strong bullish opening structure into reversal and small-pullback bear trend behavior.",
    representativenessNote: "Strong case for trend exhaustion and reversal sequencing.",
    evidenceLimitations: "Do not present as prediction mechanics; use as retrospective chart reading.",
  }],
  ["course5_zip_image_review_023", {
    modulePlacement: "trends_and_channels; chart_pattern_encyclopedia; breakouts_and_pullbacks",
    reviewerOwnedVisualObservation: "The chart shows a small-pullback bear trend from the open, with a wedge/sell-climax area, sideways correction, continued lower movement, micro wedge, and a later pullback toward the moving average.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include small pullback bear trend, wedge and sell climax, expect at least two legs sideways to up, micro wedge, pullback to EMA, and 20-gap-bar context.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row helps teach how shallow pullbacks and repeated continuation behavior can define a small-pullback bear trend, while later wedges can introduce pause or correction.",
    representativenessNote: "High-value example for small-pullback bear trend structure.",
    evidenceLimitations: "Original text includes shorthand that can resemble action language. Keep lesson use observational and educational.",
  }],
  ["course5_zip_image_review_024", {
    modulePlacement: "reversals; trends_and_channels; chart_pattern_encyclopedia",
    reviewerOwnedVisualObservation: "The sample shows a bull trend from the open followed by reversal down. It marks a parabolic wedge/exhaustive buy climax, a lower-high double top major trend reversal, major bear breakout, Low 2, measured move, wedge, and later lower-high double top.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include bull trend from the open then reversal down, parabolic wedge exhaustive buy climax, lower-high double top, major trend reversal, major bear breakout, Low 2, measured move, wedge, and lower-high double top.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row can support a lesson on trend exhaustion, failed continuation, and the transition from bull trend to bear breakout and range-like follow-through.",
    representativenessNote: "Representative of reversal-down lifecycle after a strong opening trend.",
    evidenceLimitations: "Needs synthesis with other examples before becoming a learner-ready module.",
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

function requiredFieldsFor(row) {
  if (row.sourceType === "zip") {
    return [
      "reviewerOwnedVisualObservation",
      "reviewerVisibleTextOrLabelCheck",
      "paraphrasedTeachingConcept",
      "modulePlacement",
      "representativenessNote",
      "evidenceLimitations",
      "reviewerNameOrInitials",
      "reviewedAt",
    ];
  }
  return [
    "reviewerOwnedOcrTextExcerpt",
    "reviewerOwnedVisualObservation",
    "paraphrasedTeachingConcept",
    "modulePlacement",
    "evidenceLimitations",
    "reviewerNameOrInitials",
    "reviewedAt",
  ];
}

function forbiddenHits(value) {
  const blob = String(value || "").toLowerCase();
  return forbiddenPhrases.filter((phrase) => blob.includes(phrase));
}

const template = readJson(templatePath);
const pack = readJson(packPath);
assertBoundary("template", template);
assertBoundary("pack", pack);

const rows = template.rows.map((row) => {
  const note = pilotNotes.get(row.reviewRowId);
  if (!note) return { ...row };
  return {
    ...row,
    ...note,
    reviewerNameOrInitials: reviewerName,
    reviewedAt,
    pilotReviewMode: "ai_visual_review_requires_human_confirmation",
    reviewStatus: "blocked_missing_real_wave_2_reviewer_input",
    acceptedForWave2SemanticReview: false,
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
  inputTemplateStatus: "course_5_wave_2_p1_ai_visual_review_pilot_twelve_rows_ready_for_reviewer_confirmation",
  pilotReviewMode: "ai_visual_review_requires_human_confirmation",
  pilotRows: pilotNotes.size,
  readyRows: pilotNotes.size,
  blockedRows: rows.length - pilotNotes.size,
  sourceFolderMayBeDeleted: false,
  rows,
  boundary,
};

const sampleByReviewRowId = new Map(pack.sampleRowsDetail.map((row) => [row.reviewRowId, row]));
const validationRows = rows.map((row) => {
  const sample = sampleByReviewRowId.get(row.reviewRowId);
  const rowIssues = [];
  if (!sample) rowIssues.push("missing_matching_wave_2_sample");
  if (sample && row.sourceType !== sample.sourceType) rowIssues.push("source_type_mismatch");
  if (!fs.existsSync(row.sampleImagePath)) rowIssues.push("sample_image_missing");
  if (sample && row.sampleImagePath !== sample.sampleImagePath) rowIssues.push("sample_image_path_mismatch");
  if (pilotNotes.has(row.reviewRowId) && row.pilotReviewMode !== "ai_visual_review_requires_human_confirmation") rowIssues.push("pilot_row_missing_ai_review_boundary");

  const requiredFields = requiredFieldsFor(row);
  const missingFields = requiredFields.filter((field) => !text(row[field]));
  if (missingFields.length) rowIssues.push(`missing_fields:${missingFields.join(",")}`);

  const joinedInput = requiredFields.map((field) => text(row[field])).join("\n");
  const hits = forbiddenHits(joinedInput);
  if (hits.length) rowIssues.push(`forbidden_phrases:${hits.join(",")}`);
  if (text(row.paraphrasedTeachingConcept) && !/Original paraphrase, not copied:/.test(text(row.paraphrasedTeachingConcept))) rowIssues.push("paraphrased_teaching_concept_missing_originality_statement");
  if (row.publicGroundingNeeded !== true) rowIssues.push("public_grounding_must_remain_required_before_module_merge");
  if (row.acceptedForWave2SemanticReview !== false) rowIssues.push("row_must_not_self_accept_wave_2_semantic_review");
  if (row.acceptedForModuleDistillation !== false) rowIssues.push("row_must_not_self_accept_module_distillation");
  if (row.acceptedForDeletionReadiness !== false) rowIssues.push("row_must_not_self_accept_deletion_readiness");
  if (row.reviewStatus !== "blocked_missing_real_wave_2_reviewer_input") rowIssues.push("review_status_must_start_blocked");

  return {
    reviewRowId: row.reviewRowId,
    executionSampleNo: row.executionSampleNo,
    sourceType: row.sourceType,
    recordId: row.recordId,
    pilotRow: pilotNotes.has(row.reviewRowId),
    validationStatus: rowIssues.length ? "blocked_missing_or_invalid_wave_2_reviewer_input" : "ready_for_wave_2_ai_visual_reviewer_confirmation_gate",
    readyForWave2AiVisualConfirmationGate: rowIssues.length === 0,
    missingFields,
    qualityIssues: rowIssues.filter((issue) => !issue.startsWith("missing_fields:")),
    forbiddenHits: hits,
    nextGate: rowIssues.length
      ? "fill_real_wave_2_reviewer_fields_then_revalidate"
      : "human_confirm_ai_visual_note_then_public_grounding_and_semantic_route",
  };
});

const readyRows = validationRows.filter((row) => row.readyForWave2AiVisualConfirmationGate).length;
const blockedRows = validationRows.length - readyRows;
const validation = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  validationStatus: "course_5_wave_2_p1_ai_visual_review_pilot_partially_ready_release_and_deletion_blocked",
  validationMode: "wave_2_p1_ai_visual_review_pilot_gate",
  inputPath: inputJsonPath,
  sourceExecutionPack: packPath,
  inputRows: validationRows.length,
  pilotRows: pilotNotes.size,
  pdfRows: validationRows.filter((row) => row.sourceType === "pdf").length,
  zipRows: validationRows.filter((row) => row.sourceType === "zip").length,
  readyRows,
  blockedRows,
  missingFieldRows: validationRows.filter((row) => row.missingFields.length).length,
  qualityIssueRows: validationRows.filter((row) => row.qualityIssues.length).length,
  forbiddenHitRows: validationRows.filter((row) => row.forbiddenHits.length).length,
  acceptedForWave2SemanticReviewRows: 0,
  acceptedForModuleDistillationRows: 0,
  acceptedForDeletionReadinessRows: 0,
  sourceFolderMayBeDeleted: false,
  learnerReadyModules: 0,
  validationRows,
  nextOperationalGates: [
    "Human-confirm or correct the twelve AI visual pilot rows.",
    "Fill the remaining three Wave 2 PDF rows with reviewer-owned OCR or visual observations.",
    "Run source-type semantic route, public grounding, and originality review before module distillation.",
  ],
  completionRule: "This pilot validation is complete when exactly the twelve Wave 2 ZIP rows contain checked visual observations and all release, module, and deletion gates remain closed.",
  boundary,
};

fs.writeFileSync(inputJsonPath, `${JSON.stringify(input, null, 2)}\n`, "utf8");
fs.writeFileSync(validationJsonPath, `${JSON.stringify(validation, null, 2)}\n`, "utf8");

fs.writeFileSync(inputMdPath, [
  "# Course 5 Wave 2 P1 AI Visual Review Pilot Input",
  "",
  `- Pilot rows: ${input.pilotRows}`,
  `- Ready rows: ${input.readyRows}`,
  `- Blocked rows: ${input.blockedRows}`,
  `- Source folder may be deleted: ${input.sourceFolderMayBeDeleted}`,
  "",
  "## Pilot Rows",
  "",
  ...rows.filter((row) => pilotNotes.has(row.reviewRowId)).map((row) => [
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
  "# Course 5 Wave 2 P1 AI Visual Review Pilot Validation",
  "",
  `- Validation status: ${validation.validationStatus}`,
  `- Input rows: ${validation.inputRows}`,
  `- Pilot rows: ${validation.pilotRows}`,
  `- Ready rows: ${validation.readyRows}`,
  `- Blocked rows: ${validation.blockedRows}`,
  `- Missing-field rows: ${validation.missingFieldRows}`,
  `- Source folder may be deleted: ${validation.sourceFolderMayBeDeleted}`,
  "",
  "## Ready Rows",
  "",
  ...validationRows.filter((row) => row.readyForWave2AiVisualConfirmationGate).map((row) => `- ${row.reviewRowId}: ${row.nextGate}`),
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
  pilotRows: validation.pilotRows,
  readyRows: validation.readyRows,
  blockedRows: validation.blockedRows,
  sourceFolderMayBeDeleted: validation.sourceFolderMayBeDeleted,
}, null, 2));
