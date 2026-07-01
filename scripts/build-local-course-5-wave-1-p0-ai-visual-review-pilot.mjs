import fs from "node:fs";

const templatePath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_1_P0_REVIEWER_INPUT_TEMPLATE.json";
const packPath = "docs/LOCAL_COURSE_5_WAVE_1_P0_EXECUTION_PACK.json";
const inputJsonPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_1_P0_AI_VISUAL_REVIEW_PILOT_INPUT.json";
const inputMdPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_1_P0_AI_VISUAL_REVIEW_PILOT_INPUT.md";
const validationJsonPath = "docs/LOCAL_COURSE_5_WAVE_1_P0_AI_VISUAL_REVIEW_PILOT_VALIDATION.json";
const validationMdPath = "docs/LOCAL_COURSE_5_WAVE_1_P0_AI_VISUAL_REVIEW_PILOT_VALIDATION.md";

const reviewedAt = "2026-06-25T00:00:00.000+08:00";
const reviewerName = "Codex visual review pilot";

const boundary = "Course 5 Wave 1 P0 AI visual review pilot is private reviewer-facing education operations material. It records model-assisted visual observations for the first twelve Wave 1 ZIP samples so they can receive human confirmation before semantic merge preview, public grounding, originality review, teaching-module distillation, or deletion-readiness recomputation. It does not perform OCR, replace human approval, accept machine drafts as final review, merge content into learner-facing modules, delete files, approve source-folder deletion, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

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
  ["course5_zip_image_review_001", {
    modulePlacement: "chart_pattern_encyclopedia; course_slides_alignment",
    reviewerOwnedVisualObservation: "The sample is a title or section-opening slide for Brooks Trading Course Emini Setups. Most of the slide is text. A narrow chart strip on the right shows a five-minute candlestick sequence with a sharp selloff and rebound, but the chart is not annotated enough to teach a standalone setup.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include: Brooks Trading Course Emini Setups; Swing trade setups on Emini 5-minute chart; New Encyclopedia slides for current month; Slides presented in reverse chronological order; Al Brooks; The Brooks Encyclopedia of Chart Patterns.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row should be used as an orientation artifact that identifies the Emini five-minute swing-setup collection, not as proof of a specific chart rule.",
    representativenessNote: "Representative for source organization and course alignment, but weak as a rule example because it is primarily a cover slide.",
    evidenceLimitations: "Do not use this row for learner-facing pattern instruction without later case slides, public grounding, and originality review. The visible chart area is too small and under-annotated for rule extraction.",
  }],
  ["course5_zip_image_review_002", {
    modulePlacement: "chart_pattern_encyclopedia; trends_and_channels; price_action_foundations",
    reviewerOwnedVisualObservation: "The chart is an annotated bull-trend example. It shows price staying above or near the moving average through a small-pullback bull trend, a large bear bar that fails to create follow-through, and a continuation attempt back toward the prior high area before late profit taking.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include: Bear Surprise Failed: In Small Pullback Bull Trend; Minor wedge since no PB to EMA yet and small pullback bull Trend; Gap; Small PB bull trend; Bear surprise failed and was bear trap since strong bull trend; 20-Gap bar buy in small PB bull trend; 75% chance of test of high of day; Breakout test and body gap; possible MM up; MM; Possible late profit taking.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: in a strong small-pullback bull trend, a sudden bear bar may become a failed attempt to reverse if it lacks follow-through and price remains in the broader bull context; learners should study context, gaps, pullback depth, and follow-through instead of treating one bar as a standalone rule.",
    representativenessNote: "High-value representative case for failed bear surprise, small-pullback trend context, and annotated chart-reading vocabulary.",
    evidenceLimitations: "Contains probability-style wording on the slide; any lesson must reframe it as historical chart-reading context and remove predictive or advisory language. Public grounding and originality review are still required.",
  }],
  ["course5_zip_image_review_003", {
    modulePlacement: "chart_pattern_encyclopedia; deliberate_practice; course_slides_alignment",
    reviewerOwnedVisualObservation: "The sample is an unmarked Emini five-minute candlestick chart. It shows an early range or climb, a mid-session selloff into a low, a later recovery, and a final push higher. The moving average bends down during the decline and then turns up during the recovery.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include: Emini 5 Min: Unmarked Chart for Your Own Analysis; Unmarked chart provided for your own analysis before studying Encyclopedia charts. The time axis runs from 1/17 through 1/18 and the price axis spans roughly 4745 to 4775.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row is best treated as a practice worksheet where learners first mark trend phases, pullbacks, reversal attempts, and moving-average interaction before comparing against an annotated version.",
    representativenessNote: "Representative for deliberate-practice workflow because it intentionally withholds annotations and asks the learner to analyze structure first.",
    evidenceLimitations: "Not a final explanation slide. It should not be distilled into a rule without the matching annotated answer slide or reviewer notes that identify intended teaching points.",
  }],
  ["course5_zip_image_review_004", {
    modulePlacement: "chart_pattern_encyclopedia; trends_and_channels; trading_ranges",
    reviewerOwnedVisualObservation: "The sample is an annotated chart titled Low 2 Bear Flags: Bottom of TR and Bear Channel. It marks one Low 2 area near the bottom of a trading range and below the moving average, then another Low 2 area after a bear breakout as price forms a downward channel.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include: Low 2 Bear Flags; Bottom of TR and Bear Channel; Low 2 bear flag at bottom of TR and below EMA; Low 2 bear flag after bear BO. Red shading highlights bear bars near or below the moving average.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row illustrates how a repeated pullback pattern can have different instructional meaning depending on context, first inside a range and later during a developing bear channel.",
    representativenessNote: "High-value representative case for contrasting trading-range context with bear-channel continuation context.",
    evidenceLimitations: "The slide uses shorthand entry language. Any lesson must restate it as historical chart-structure analysis, not as actionable instruction.",
  }],
  ["course5_zip_image_review_005", {
    modulePlacement: "chart_pattern_encyclopedia; trends_and_channels; terminology_glossary",
    reviewerOwnedVisualObservation: "The sample compares a wedge bull channel with several parabolic wedge examples. Four panels show numbered pushes and different pullback depth, overlap, and acceleration characteristics.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include: Wedge Bull Channel: Compared to Parabolic Wedges; Wedge; Parabolic Wedges; pullback usually overlaps prior leg up; pullback usually does not overlap prior leg up; three legs in channel usually leads to pause or reversal.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row supports a taxonomy lesson that separates ordinary wedge channels from parabolic wedge advances by studying leg count, overlap, acceleration, and pullback depth.",
    representativenessNote: "Strong reference row for pattern taxonomy because it puts multiple variants side by side.",
    evidenceLimitations: "The panels are schematic examples without full market context. Distillation should use this as comparison vocabulary, not as a standalone rule.",
  }],
  ["course5_zip_image_review_006", {
    modulePlacement: "chart_pattern_encyclopedia; trends_and_channels; price_action_foundations",
    reviewerOwnedVisualObservation: "The sample shows a bull trend from the open after a gap up. It marks an early Low 2 top attempt that fails, followed by a new high of day and an extended upward sequence before a later pullback from the high area.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include: Bull Trend From The Open; Failed Low 2 Top after Gap Up; Low 2 top after big gap up; Failed Low 2 top; New H of day; Possible Bull Trend From The Open; B above bull bar closing near its H.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row illustrates that an early reversal attempt can fail when a larger gap-up context and follow-through keep the session aligned with a bull-trend-from-open structure.",
    representativenessNote: "Useful case for failed reversal vocabulary, trend-from-open recognition, and gap-context discussion.",
    evidenceLimitations: "Contains trade shorthand. Course use must focus on reading context and failure mechanics, not on prescribing action.",
  }],
  ["course5_zip_image_review_007", {
    modulePlacement: "reversals; terminology_glossary; course_slides_alignment",
    reviewerOwnedVisualObservation: "The sample is a title slide with a plain orange background and the text Major Trend Reversal Down from Higher High, but Failed. No chart is visible.",
    reviewerVisibleTextOrLabelCheck: "Visible label: Major Trend Reversal Down from Higher High, but Failed.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row is an orientation marker for a failed major trend reversal topic and should be linked to later chart examples before lesson distillation.",
    representativenessNote: "Representative as a section divider, not as evidence for chart mechanics.",
    evidenceLimitations: "No chart evidence appears on the slide. It cannot support a learner-facing explanation by itself.",
  }],
  ["course5_zip_image_review_008", {
    modulePlacement: "terminology_glossary; price_action_foundations; course_slides_alignment",
    reviewerOwnedVisualObservation: "The sample is a title slide with the text Strong Signal Bar on an orange background. No candlestick chart or example context is shown.",
    reviewerVisibleTextOrLabelCheck: "Visible label: Strong Signal Bar.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row is a vocabulary marker for a future lesson about evaluating bar strength, but it needs chart examples before it can teach criteria.",
    representativenessNote: "Representative as a glossary/section marker only.",
    evidenceLimitations: "No visual criteria are present. Do not treat this as a definition or evidence anchor without supporting examples.",
  }],
  ["course5_zip_image_review_009", {
    modulePlacement: "chart_pattern_encyclopedia; reversals; trends_and_channels",
    reviewerOwnedVisualObservation: "The sample shows a broad bear-channel context with a late large bull bar near the moving average and a lower-high area. The annotations frame the bull bar as a failed surprise and connect it to a micro double top and late bull trap idea.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include: Bull Surprise Bar: Micro DT and Late Bull Trap; Big bull bar late in day; Possible end of day Bull Trap; Micro DT at EMA and LH in bear channel; Strong reversal up from test of low in trading range day; Bull Surprise bar that fails is Bull Trap.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row illustrates how a large counter-trend bar can still fail if it appears late in a bear-channel context near resistance and lacks durable follow-through.",
    representativenessNote: "High-value case for failed surprise bar, lower-high, micro double-top, and trap vocabulary.",
    evidenceLimitations: "The slide uses compressed course shorthand and one selected example. Public grounding and originality review are required before lesson use.",
  }],
  ["course5_zip_image_review_010", {
    modulePlacement: "trends_and_channels; chart_pattern_encyclopedia; price_action_foundations",
    reviewerOwnedVisualObservation: "The sample shows a bear channel with several highlighted pullbacks toward or near the moving average. Red and brown blocks mark places where bear bars or closes appear near the EMA as the channel continues lower.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include: Bear Channel: S near EMA; Bear channel; S below bear bars at EMA; Bears S the close of big bull bars closing near EMA.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row supports a lesson on how repeated tests of the moving average can act as structure points inside a bear channel, especially when counter-trend bars do not change the larger channel.",
    representativenessNote: "Representative for EMA interaction in a bear channel and for repeated pullback structure.",
    evidenceLimitations: "The source text contains shorthand that resembles action language. It must be reframed as chart-reading terminology and not presented as instruction.",
  }],
  ["course5_zip_image_review_011", {
    modulePlacement: "trends_and_channels; risk_psychology; chart_pattern_encyclopedia",
    reviewerOwnedVisualObservation: "The sample shows a broad bear channel with multiple pullbacks and highlighted lower-high or pullback areas. It includes a note about trailing a protective reference above a recent major lower high after strong bear breakouts and emphasizes repeated pullbacks toward the moving average.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include: Always In Short: If Exit, S Again below Bear Bar in PB; Broad Bear Channel; if Always In Bears exit on reversal up, but still Always In Short; S Low 1, Low 2, and wedge bear flags; PB to EMA when bear bar. The slide also defines a good bear bar by close location and tail size.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row is useful for explaining persistent bear-channel context, repeated pullbacks, lower-high reference points, and why isolated rebounds may not change the dominant structure.",
    representativenessNote: "Strong case for broad bear channel continuation and pullback classification.",
    evidenceLimitations: "Contains explicit trade-management shorthand. It must be transformed into neutral educational analysis and cannot be used as real-money or action guidance.",
  }],
  ["course5_zip_image_review_012", {
    modulePlacement: "trends_and_channels; price_action_foundations; risk_psychology",
    reviewerOwnedVisualObservation: "The sample shows a tight bear channel with many small pullbacks and a shaded descending channel. Text notes that the channel persists for many bars, pullbacks are only one or two bars, and gaps or body gaps appear within the decline.",
    reviewerVisibleTextOrLabelCheck: "Visible labels include: Tight Bear Channel: Endless PB, Do Not B; Tight channel for 50 bars; PB grows into bear trend; gaps and body gaps in tight bear channel; each PB was only 1-2 bars; small PB bear trend; 30 min chart; strong bear BO.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row illustrates how a long sequence of shallow pullbacks and persistent gaps can make a decline function as a tight bear channel rather than a normal pullback pattern.",
    representativenessNote: "High-value example for distinguishing tight channel conditions from ordinary pullbacks.",
    evidenceLimitations: "The slide includes abbreviated action warnings. In this product it should only support educational recognition of tight-channel structure and limitation of counter-trend interpretation.",
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
    reviewStatus: "blocked_missing_real_wave_1_reviewer_input",
    acceptedForWave1SemanticReview: false,
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
  inputTemplateStatus: "course_5_wave_1_p0_ai_visual_review_pilot_twelve_rows_ready_for_reviewer_confirmation",
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
  if (!sample) rowIssues.push("missing_matching_wave_1_sample");
  if (sample && row.sourceType !== sample.sourceType) rowIssues.push("source_type_mismatch");
  if (!fs.existsSync(row.sampleImagePath)) rowIssues.push("sample_image_missing");
  if (sample && row.sampleImagePath !== sample.sampleImagePath) rowIssues.push("sample_image_path_mismatch");
  if (pilotNotes.has(row.reviewRowId) && row.pilotReviewMode !== "ai_visual_review_requires_human_confirmation") {
    rowIssues.push("pilot_row_missing_ai_review_boundary");
  }

  const requiredFields = requiredFieldsFor(row);
  const missingFields = requiredFields.filter((field) => !text(row[field]));
  if (missingFields.length) rowIssues.push(`missing_fields:${missingFields.join(",")}`);

  const joinedInput = requiredFields.map((field) => text(row[field])).join("\n");
  const hits = forbiddenHits(joinedInput);
  if (hits.length) rowIssues.push(`forbidden_phrases:${hits.join(",")}`);
  if (text(row.paraphrasedTeachingConcept) && !/Original paraphrase, not copied:/.test(text(row.paraphrasedTeachingConcept))) {
    rowIssues.push("paraphrased_teaching_concept_missing_originality_statement");
  }
  if (row.publicGroundingNeeded !== true) rowIssues.push("public_grounding_must_remain_required_before_module_merge");
  if (row.acceptedForWave1SemanticReview !== false) rowIssues.push("row_must_not_self_accept_wave_1_semantic_review");
  if (row.acceptedForModuleDistillation !== false) rowIssues.push("row_must_not_self_accept_module_distillation");
  if (row.acceptedForDeletionReadiness !== false) rowIssues.push("row_must_not_self_accept_deletion_readiness");
  if (row.reviewStatus !== "blocked_missing_real_wave_1_reviewer_input") rowIssues.push("review_status_must_start_blocked");

  return {
    reviewRowId: row.reviewRowId,
    executionSampleNo: row.executionSampleNo,
    sourceType: row.sourceType,
    recordId: row.recordId,
    pilotRow: pilotNotes.has(row.reviewRowId),
    validationStatus: rowIssues.length ? "blocked_missing_or_invalid_wave_1_reviewer_input" : "ready_for_wave_1_ai_visual_reviewer_confirmation_gate",
    readyForWave1AiVisualConfirmationGate: rowIssues.length === 0,
    missingFields,
    qualityIssues: rowIssues.filter((issue) => !issue.startsWith("missing_fields:")),
    forbiddenHits: hits,
    nextGate: rowIssues.length
      ? "fill_real_wave_1_reviewer_fields_then_revalidate"
      : "human_confirm_ai_visual_note_then_public_grounding_and_semantic_route",
  };
});

const readyRows = validationRows.filter((row) => row.readyForWave1AiVisualConfirmationGate).length;
const blockedRows = validationRows.length - readyRows;
const validation = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  validationStatus: "course_5_wave_1_p0_ai_visual_review_pilot_partially_ready_release_and_deletion_blocked",
  validationMode: "wave_1_p0_ai_visual_review_pilot_gate",
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
  acceptedForWave1SemanticReviewRows: 0,
  acceptedForModuleDistillationRows: 0,
  acceptedForDeletionReadinessRows: 0,
  sourceFolderMayBeDeleted: false,
  learnerReadyModules: 0,
  validationRows,
  nextOperationalGates: [
    "Human-confirm or correct the twelve AI visual pilot rows.",
    "Fill the remaining six Wave 1 PDF rows with reviewer-owned OCR or visual observations.",
    "Run source-type semantic route, public grounding, and originality review before module distillation.",
  ],
  completionRule: "This pilot validation is complete when exactly the first twelve Wave 1 ZIP rows contain checked visual observations and all release, module, and deletion gates remain closed.",
  boundary,
};

fs.writeFileSync(inputJsonPath, `${JSON.stringify(input, null, 2)}\n`, "utf8");
fs.writeFileSync(validationJsonPath, `${JSON.stringify(validation, null, 2)}\n`, "utf8");

fs.writeFileSync(inputMdPath, [
  "# Course 5 Wave 1 P0 AI Visual Review Pilot Input",
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
  "# Course 5 Wave 1 P0 AI Visual Review Pilot Validation",
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
  ...validationRows.filter((row) => row.readyForWave1AiVisualConfirmationGate).map((row) => `- ${row.reviewRowId}: ${row.nextGate}`),
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
