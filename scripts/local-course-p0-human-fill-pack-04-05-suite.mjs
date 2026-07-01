import fs from "node:fs";

const configs = {
  "04": {
    packId: "local_course_p0_human_fill_pack_04",
    targetTaskIds: [
      "absorb_manual_transcription_01",
      "absorb_manual_transcription_02",
      "absorb_manual_transcription_03",
      "absorb_manual_transcription_04",
    ],
    targetPages: [1, 2, 3, 4],
    highRiskFlags: ["entry_language", "stop_loss_language", "position_language", "specific_price_levels", "risk_reward_language"],
    rationale: "Fourth human-fill pack starts corpus_1313 pages 1-4, where multi-timeframe, entry, stop-loss, position, order-management, and risk/reward language must be rewritten into education-only review notes.",
    fixtureSummary: "Fixture-only education summary: multi-timeframe and structure review should become evidence-quality practice without entry, stop-loss, position, target, or risk/reward instructions.",
  },
  "05": {
    packId: "local_course_p0_human_fill_pack_05",
    targetTaskIds: [
      "absorb_manual_transcription_05",
      "absorb_manual_transcription_06",
      "absorb_manual_transcription_07",
      "absorb_manual_transcription_08",
    ],
    targetPages: [5, 6, 7, 8],
    highRiskFlags: ["signal_language", "execution_strategy_language", "pending_order_language", "stop_loss_language", "target_area_language", "profit_loss_language"],
    rationale: "Fifth human-fill pack closes corpus_1313 pages 5-8, where signal, execution, pending-order, stop-loss, target, profit/loss, and case-study language must stay in reviewer-only material until rewritten.",
    fixtureSummary: "Fixture-only education summary: cycle-switching, false precision, and case-review material should become neutral study prompts without signals, execution steps, targets, stops, or profit/loss claims.",
  },
};

const packNumber = process.argv[2];
const mode = process.argv[3] || "build-pack";
if (!configs[packNumber]) throw new Error(`unknown pack number ${packNumber}`);
const cfg = configs[packNumber];
const tag = `PACK_${packNumber}`;
const noteTemplatePath = "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_NOTE_TEMPLATE.json";
const packPath = `docs/LOCAL_COURSE_P0_HUMAN_FILL_${tag}.json`;
const packMdPath = `docs/LOCAL_COURSE_P0_HUMAN_FILL_${tag}.md`;
const templatePath = `docs/LOCAL_COURSE_P0_HUMAN_FILL_${tag}_INPUT_COPY_TEMPLATE.json`;
const templateMdPath = `docs/LOCAL_COURSE_P0_HUMAN_FILL_${tag}_INPUT_COPY_TEMPLATE.md`;
const validationPath = `docs/LOCAL_COURSE_P0_HUMAN_FILL_${tag}_INPUT_COPY_VALIDATION.json`;
const lintPath = `docs/LOCAL_COURSE_P0_HUMAN_FILL_${tag}_INPUT_COPY_LINT.json`;
const lintMdPath = `docs/LOCAL_COURSE_P0_HUMAN_FILL_${tag}_INPUT_COPY_LINT.md`;
const fixturePath = `docs/LOCAL_COURSE_P0_HUMAN_FILL_${tag}_POSITIVE_LINT_FIXTURE.json`;
const fixtureMdPath = `docs/LOCAL_COURSE_P0_HUMAN_FILL_${tag}_POSITIVE_LINT_FIXTURE.md`;
const fixtureLintPath = `docs/LOCAL_COURSE_P0_HUMAN_FILL_${tag}_POSITIVE_LINT_FIXTURE_LINT.json`;
const fixtureValidationPath = `docs/LOCAL_COURSE_P0_HUMAN_FILL_${tag}_POSITIVE_LINT_FIXTURE_VALIDATION.json`;
const fixtureApplyPath = `docs/LOCAL_COURSE_P0_HUMAN_FILL_${tag}_POSITIVE_LINT_FIXTURE_APPLY_REPORT.json`;
const forbiddenPhrases = [
  "stock recommendation",
  "buy signal",
  "sell signal",
  "guaranteed return",
  "win rate promise",
  "broker workflow",
  "auto trading",
  "real money",
  "recommended buy",
  "recommended sell",
  "must buy",
  "must sell",
];

function fail(message) {
  throw new Error(message);
}

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePath(value) {
  return String(value || "").replace(/\\/g, "/");
}

function checklistDone(checklist = {}) {
  return Object.values(checklist).length > 0 && Object.values(checklist).every((value) => value === "done" || value === true);
}

function assertBoundary(artifact, name) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${name} must remain not_approved`);
}

function forbiddenHits(value) {
  const blob = JSON.stringify(value || {}).toLowerCase();
  return forbiddenPhrases.filter((phrase) => blob.includes(phrase.toLowerCase()));
}

function candidateCopyIssues(entry) {
  const candidateSummary = text(entry.packQualityRequirements?.candidateSummary);
  const transcription = text(entry.manualInput?.humanTranscription);
  const summary = text(entry.manualInput?.humanSummary);
  const issues = [];
  if (candidateSummary && transcription.includes(candidateSummary.slice(0, 80))) issues.push("humanTranscription_contains_candidate_summary");
  if (candidateSummary && summary.includes(candidateSummary.slice(0, 80))) issues.push("humanSummary_contains_candidate_summary");
  if (/candidate summary for orientation only/i.test(transcription) || /machine-assisted candidate/i.test(transcription)) issues.push("humanTranscription_mentions_candidate_as_source");
  return issues;
}

function makePackCards() {
  const noteTemplate = readJson(noteTemplatePath);
  assertBoundary(noteTemplate, "note template");
  const noteByTask = new Map((noteTemplate.noteCards || []).map((card) => [card.taskId, card]));
  return cfg.targetTaskIds.map((taskId) => {
    const note = noteByTask.get(taskId);
    if (!note) fail(`missing note card ${taskId}`);
    if (note.category !== "manual_transcription") fail(`${taskId} must be manual_transcription`);
    return {
      id: `fill_pack_${packNumber}_${taskId}`,
      noteCardId: note.id,
      taskId: note.taskId,
      inputEntryId: note.inputEntryId,
      category: note.category,
      priority: note.priority,
      documentId: note.documentId,
      pageNumber: note.pageNumber,
      sourceRelativePath: note.sourceRelativePath,
      sourceModule: note.sourceModule,
      previewUrl: note.previewUrl,
      highResPreviewUrl: note.highResPreviewUrl,
      candidateId: note.candidateId,
      matchStatus: note.matchStatus,
      educationOnly: true,
      productionReady: false,
      learnerFacingRelease: false,
      approvalStatus: "not_approved",
      fillStatus: "blank_ready_for_human_fill",
      reviewerName: "",
      reviewedAt: "",
      requiredFields: note.requiredFields,
      fieldValues: {
        humanTranscription: "",
        humanSummary: "",
        uncertainWords: [],
        publicReferenceNotes: "",
        originalityNotes: "",
        riskRewriteNotes: "",
      },
      checklist: note.checklist,
      candidateSummary: note.candidateSummary,
      uncertainRegions: note.uncertainRegions,
      riskTermFlags: note.riskTermFlags,
      riskRewriteChecklist: note.riskRewriteChecklist,
      qualityLintRules: [
        "humanTranscription must be human-verified against high-res preview, not copied from the machine candidate.",
        "humanSummary must be education-only and cannot contain advice, signal, return, broker, automation, or real-money guidance.",
        `riskRewriteNotes must address every riskTermFlag before validation, especially ${cfg.highRiskFlags.join(", ")}.`,
        "publicReferenceNotes must name public grounding needed for terminology, chart examples, cycle concepts, or case-study claims.",
        "originalityNotes must confirm private course wording was not copied into learner-facing content.",
      ],
      nextGate: "human_fill_pack_then_validate_p0_review_input_copy",
    };
  });
}

function buildPack() {
  const packCards = makePackCards();
  const riskTermFlagCounts = packCards.reduce((counts, card) => {
    for (const flag of card.riskTermFlags || []) counts[flag] = (counts[flag] || 0) + 1;
    return counts;
  }, {});
  const pack = {
    generatedAt: new Date().toISOString(),
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    packId: cfg.packId,
    packStatus: "blank_human_fill_pack_ready",
    sourceNoteTemplate: noteTemplatePath,
    selectionRationale: cfg.rationale,
    totalPackCards: packCards.length,
    manualFillCards: packCards.length,
    filledCards: 0,
    readyForValidationCards: 0,
    acceptedForOverlayCards: 0,
    targetTaskIds: cfg.targetTaskIds,
    targetDocumentIds: [...new Set(packCards.map((card) => card.documentId))],
    targetPageNumbers: packCards.map((card) => card.pageNumber),
    riskTermFlagCounts,
    topRiskTermFlags: Object.entries(riskTermFlagCounts).sort((a, b) => b[1] - a[1]).map(([flag, count]) => ({ flag, count })),
    packCards,
    requiredCommandsAfterHumanFill: [
      "node scripts/validate-local-course-absorption-p0-review-input.mjs --input <copied-filled-input.json>",
      "node scripts/apply-local-course-absorption-p0-review-input.mjs --input <copied-filled-input.json>",
      "npm.cmd run check:local-course-absorption-p0-review-overlay",
      "npm.cmd run check:local-course-absorption-readiness",
    ],
    completionRule: `This fill pack is complete only as a blank human execution packet. It becomes ready for overlay apply only after a human reviewer fills a copied input file, every quality lint rule passes, dry-run validation succeeds, and no learner-facing release is approved.`,
    boundary: "P0 human fill pack is blank reviewer work material. It does not perform OCR, fill reviewer fields, approve learner-facing release, copy private course wording into lessons, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
  };
  writeJson(packPath, pack);
  fs.writeFileSync(packMdPath, [
    `# Local Course P0 Human Fill Pack ${packNumber}`,
    "",
    `Blank human-fill execution packet for corpus_1313 pages ${cfg.targetPages.join(", ")}.`,
    "",
    `- Pack status: ${pack.packStatus}`,
    `- Cards: ${pack.totalPackCards}`,
    `- Filled cards: ${pack.filledCards}`,
    `- Ready for validation: ${pack.readyForValidationCards}`,
    `- Accepted for overlay: ${pack.acceptedForOverlayCards}`,
    `- Target tasks: ${pack.targetTaskIds.join(", ")}`,
    "",
    "## Cards",
    "",
    "| Card | Source | Page | Candidate | Risk flags |",
    "| --- | --- | ---: | --- | --- |",
    ...packCards.map((card) => `| ${card.id} | ${card.documentId} | ${card.pageNumber} | ${card.candidateId} | ${card.riskTermFlags.join(", ")} |`),
    "",
  ].join("\n"), "utf8");
  return pack;
}

function checkPack() {
  const pack = readJson(packPath);
  const cards = pack.packCards || [];
  assertBoundary(pack, "fill pack");
  if (pack.packId !== cfg.packId) fail(`unexpected packId: ${pack.packId}`);
  if (pack.packStatus !== "blank_human_fill_pack_ready") fail(`unexpected packStatus: ${pack.packStatus}`);
  if (pack.totalPackCards !== 4 || cards.length !== 4) fail(`expected 4 pack cards, got ${pack.totalPackCards}/${cards.length}`);
  if (pack.manualFillCards !== 4) fail(`expected 4 manual fill cards, got ${pack.manualFillCards}`);
  if (pack.filledCards !== 0 || pack.readyForValidationCards !== 0 || pack.acceptedForOverlayCards !== 0) fail("blank fill pack must not fill, validate, or accept cards");
  for (const expected of cfg.targetPages) if (!pack.targetPageNumbers?.includes(expected)) fail(`missing target page ${expected}`);
  for (const card of cards) {
    assertBoundary(card, card.id);
    if (card.category !== "manual_transcription") fail(`${card.id} should be manual_transcription`);
    if (card.documentId !== "corpus_1313") fail(`${card.id} document drift`);
    if (!cfg.targetPages.includes(card.pageNumber)) fail(`${card.id} page drift`);
    if (card.fillStatus !== "blank_ready_for_human_fill") fail(`${card.id} must be blank-ready`);
    if (card.reviewerName !== "" || card.reviewedAt !== "") fail(`${card.id} reviewer fields must be blank`);
    if (!card.candidateId || card.matchStatus !== "candidate_available_for_human_review") fail(`${card.id} missing candidate match`);
    if (!card.highResPreviewUrl?.startsWith("/docs/local-course-low-extraction-high-res-previews/")) fail(`${card.id} high-res URL drift`);
    if (!Array.isArray(card.riskTermFlags) || card.riskTermFlags.length < 4) fail(`${card.id} risk flags too thin`);
    if (!Array.isArray(card.riskRewriteChecklist) || card.riskRewriteChecklist.length !== card.riskTermFlags.length) fail(`${card.id} risk rewrite checklist must cover every risk flag`);
    if (!Array.isArray(card.qualityLintRules) || !card.qualityLintRules.some((rule) => /not copied from the machine candidate/i.test(rule))) fail(`${card.id} must prohibit candidate copying`);
  }
  for (const flag of cfg.highRiskFlags) if (!pack.riskTermFlagCounts?.[flag]) fail(`risk term counts should include ${flag}`);
  return pack;
}

function buildInputTemplate() {
  const pack = readJson(packPath);
  assertBoundary(pack, "fill pack");
  const inputEntries = (pack.packCards || []).map((card) => ({
    id: `input_copy_${card.taskId}`,
    reviewEntryId: `review_${card.taskId}`,
    taskId: card.taskId,
    sourcePackCardId: card.id,
    category: card.category,
    sourceRelativePath: card.sourceRelativePath,
    sourceModule: card.sourceModule,
    documentId: card.documentId,
    pageNumber: card.pageNumber,
    previewUrl: card.previewUrl,
    highResPreviewUrl: card.highResPreviewUrl,
    candidateId: card.candidateId,
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    inputStatus: "human_fill_copy_blank",
    reviewerName: "",
    reviewedAt: "",
    packQualityRequirements: {
      riskTermFlags: card.riskTermFlags,
      riskRewriteChecklist: card.riskRewriteChecklist,
      qualityLintRules: card.qualityLintRules,
      uncertainRegions: card.uncertainRegions,
      candidateSummary: card.candidateSummary,
      warning: "Do not copy machine candidate text as human transcription. Verify against the high-resolution preview.",
    },
    manualInput: {
      humanTranscription: "",
      humanSummary: "",
      uncertainWords: [],
      publicReferenceNotes: "",
      originalityNotes: "",
      riskRewriteNotes: "",
      checklist: {
        visualTextCaptured: "not_started",
        chartLabelsCaptured: "not_started",
        unclearAreasFlagged: "not_started",
        noTradingAdviceAdded: "not_started",
        publicSourceGroundingReady: "not_started",
        originalRewriteReady: "not_started",
      },
    },
    replacementInput: null,
    acceptanceCriteria: [
      "Human transcription is verified from the high-resolution preview and does not copy machine candidate wording.",
      "Human summary is education-only and contains no trading advice, signal, return promise, broker workflow, automation, or real-money guidance.",
      `Risk rewrite notes address every riskTermFlag, especially ${cfg.highRiskFlags.join(", ")}.`,
      "Public reference notes identify terminology, chart examples, cycle concepts, or case-study claims that need public grounding.",
      "Originality notes confirm private course wording is not copied into learner-facing lessons.",
    ],
    nextGate: `validate_pack_${packNumber}_input_then_apply_dry_run_only`,
  }));
  const inputCopyTemplate = {
    generatedAt: new Date().toISOString(),
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    fixtureOnly: false,
    templateStatus: `pack_${packNumber}_input_copy_blank`,
    sourceFillPack: packPath,
    packId: pack.packId,
    totalEntries: inputEntries.length,
    manualTranscriptionEntries: inputEntries.length,
    sourceReplacementEntries: 0,
    filledEntries: 0,
    readyForValidationEntries: 0,
    targetTaskIds: pack.targetTaskIds,
    targetDocumentIds: pack.targetDocumentIds,
    targetPageNumbers: pack.targetPageNumbers,
    inputEntries,
    usage: [
      `Copy this file before a human reviewer fills pack ${packNumber}.`,
      "Fill reviewerName, reviewedAt, humanTranscription, humanSummary, publicReferenceNotes, originalityNotes, riskRewriteNotes, uncertainWords, and checklist values.",
      `Run npm.cmd run check:local-course-p0-human-fill-pack-${packNumber}-input-copy-template before and after filling a copy.`,
      "Run validator and apply dry-run against the copied file; do not use --write until explicitly authorized after review.",
    ],
    completionRule: `This input copy template is only a blank carrier for pack ${packNumber}. It is not ready until a human reviewer fills all required fields, every risk flag is addressed, validation succeeds, and apply dry-run reports ready entries with writtenEntries:0.`,
    boundary: `Pack ${packNumber} input copy template is blank reviewer input material. It does not perform OCR, fill reviewer fields, approve learner-facing release, copy private course wording into lessons, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.`,
  };
  writeJson(templatePath, inputCopyTemplate);
  fs.writeFileSync(templateMdPath, [
    `# Local Course P0 Human Fill Pack ${packNumber} Input Copy Template`,
    "",
    `Blank reviewer-input copy template scoped to fill pack ${packNumber}.`,
    "",
    `- Template status: ${inputCopyTemplate.templateStatus}`,
    `- Entries: ${inputCopyTemplate.totalEntries}`,
    `- Filled entries: ${inputCopyTemplate.filledEntries}`,
    `- Ready for validation: ${inputCopyTemplate.readyForValidationEntries}`,
    "",
  ].join("\n"), "utf8");
  return inputCopyTemplate;
}

function checkInputTemplate() {
  const template = readJson(templatePath);
  const validation = readJson(validationPath);
  assertBoundary(template, "input copy");
  assertBoundary(validation, "validation");
  if (template.fixtureOnly !== false) fail("input copy template must not be fixtureOnly");
  if (template.templateStatus !== `pack_${packNumber}_input_copy_blank`) fail(`unexpected templateStatus: ${template.templateStatus}`);
  if (template.packId !== cfg.packId) fail(`unexpected packId: ${template.packId}`);
  if (template.totalEntries !== 4 || (template.inputEntries || []).length !== 4) fail("input copy must contain 4 entries");
  if (template.filledEntries !== 0 || template.readyForValidationEntries !== 0) fail("blank input copy must not be filled or ready");
  if (normalizePath(validation.inputPath) !== normalizePath(templatePath)) fail(`validation should point to ${templatePath}`);
  if (validation.totalEntries !== 4 || validation.readyEntries !== 0 || validation.blockedEntries !== 4 || validation.forbiddenHitEntries !== 0) fail(`validation drift: ${validation.readyEntries}/${validation.blockedEntries}/${validation.forbiddenHitEntries}`);
  for (const entry of template.inputEntries || []) {
    if (entry.category !== "manual_transcription") fail(`${entry.id} must be manual transcription`);
    if (entry.documentId !== "corpus_1313") fail(`${entry.id} document drift`);
    if (!cfg.targetPages.includes(entry.pageNumber)) fail(`${entry.id} page drift`);
    if (entry.inputStatus !== "human_fill_copy_blank") fail(`${entry.id} must remain blank`);
    if (entry.reviewerName !== "" || entry.reviewedAt !== "") fail(`${entry.id} reviewer fields must be blank`);
    if (entry.manualInput?.humanTranscription !== "" || entry.manualInput?.humanSummary !== "") fail(`${entry.id} manual text fields must be blank`);
    if (entry.nextGate !== `validate_pack_${packNumber}_input_then_apply_dry_run_only`) fail(`${entry.id} next gate drift`);
  }
  return { template, validation };
}

function lintInput(inputPath = argValue("--input", templatePath), outputJsonPath = argValue("--output-json", lintPath), outputMdPath = argValue("--output-md", lintMdPath)) {
  const input = readJson(inputPath);
  assertBoundary(input, "input copy");
  if (input.packId !== cfg.packId) fail(`unexpected packId: ${input.packId}`);
  const lintRows = (input.inputEntries || []).map((entry) => {
    const missingFields = [];
    if (!text(entry.reviewerName)) missingFields.push("reviewerName");
    if (!text(entry.reviewedAt)) missingFields.push("reviewedAt");
    if (!text(entry.manualInput?.humanTranscription)) missingFields.push("humanTranscription");
    if (!text(entry.manualInput?.humanSummary)) missingFields.push("humanSummary");
    if (!text(entry.manualInput?.publicReferenceNotes)) missingFields.push("publicReferenceNotes");
    if (!text(entry.manualInput?.originalityNotes)) missingFields.push("originalityNotes");
    if (!text(entry.manualInput?.riskRewriteNotes)) missingFields.push("riskRewriteNotes");
    if (!checklistDone(entry.manualInput?.checklist)) missingFields.push("manualChecklist");
    const riskFlags = entry.packQualityRequirements?.riskTermFlags || [];
    const riskRewriteNotes = text(entry.manualInput?.riskRewriteNotes);
    const riskRewriteMissingFlags = riskFlags.filter((flag) => !riskRewriteNotes.includes(flag));
    const publicReferenceMissing = !/public|wikipedia|official|reference|source/i.test(text(entry.manualInput?.publicReferenceNotes));
    const originalityMissing = !/not copied|original|paraphrase|rewrite/i.test(text(entry.manualInput?.originalityNotes));
    const copyIssues = candidateCopyIssues(entry);
    const hits = forbiddenHits({
      humanTranscription: entry.manualInput?.humanTranscription,
      humanSummary: entry.manualInput?.humanSummary,
      publicReferenceNotes: entry.manualInput?.publicReferenceNotes,
      originalityNotes: entry.manualInput?.originalityNotes,
      riskRewriteNotes: entry.manualInput?.riskRewriteNotes,
    });
    const ready = missingFields.length === 0 && riskRewriteMissingFlags.length === 0 && !publicReferenceMissing && !originalityMissing && copyIssues.length === 0 && hits.length === 0;
    return {
      id: entry.id,
      taskId: entry.taskId,
      category: entry.category,
      documentId: entry.documentId,
      pageNumber: entry.pageNumber,
      lintStatus: ready ? "ready_for_validation" : "blocked_quality_lint",
      readyForValidation: ready,
      missingFields,
      riskRewriteMissingFlags,
      publicReferenceMissing,
      originalityMissing,
      candidateCopyIssues: copyIssues,
      forbiddenHits: hits,
      nextGate: entry.nextGate,
    };
  });
  const readyEntries = lintRows.filter((row) => row.readyForValidation).length;
  const blockedEntries = lintRows.length - readyEntries;
  const report = {
    generatedAt: new Date().toISOString(),
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    fixtureOnly: input.fixtureOnly === true,
    inputPath,
    packId: input.packId,
    lintStatus: readyEntries === lintRows.length ? "ready_for_validation" : "blocked_quality_lint",
    totalEntries: lintRows.length,
    readyEntries,
    blockedEntries,
    candidateCopyIssueEntries: lintRows.filter((row) => row.candidateCopyIssues.length).length,
    riskRewriteIncompleteEntries: lintRows.filter((row) => row.riskRewriteMissingFlags.length).length,
    publicReferenceMissingEntries: lintRows.filter((row) => row.publicReferenceMissing).length,
    originalityMissingEntries: lintRows.filter((row) => row.originalityMissing).length,
    forbiddenHitEntries: lintRows.filter((row) => row.forbiddenHits.length).length,
    lintRows,
    boundary: `Pack ${packNumber} filled-copy lint is a dry-run quality gate. It does not write overlay changes, perform OCR, approve learner-facing release, copy private course wording into lessons, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.`,
  };
  writeJson(outputJsonPath, report);
  fs.writeFileSync(outputMdPath, [
    `# Local Course P0 Human Fill Pack ${packNumber} Input Copy Lint`,
    "",
    `- Lint status: ${report.lintStatus}`,
    `- Ready entries: ${report.readyEntries}`,
    `- Blocked entries: ${report.blockedEntries}`,
    "",
    "| Entry | Page | Status | Missing | Risk flags missing |",
    "| --- | ---: | --- | --- | --- |",
    ...lintRows.map((row) => `| ${row.id} | ${row.pageNumber || ""} | ${row.lintStatus} | ${row.missingFields.join(", ")} | ${row.riskRewriteMissingFlags.join(", ")} |`),
    "",
  ].join("\n"), "utf8");
  return report;
}

function checkLint() {
  const lint = readJson(lintPath);
  assertBoundary(lint, "lint");
  if (lint.packId !== cfg.packId) fail(`unexpected packId: ${lint.packId}`);
  if (lint.lintStatus !== "blocked_quality_lint") fail(`expected blocked_quality_lint, got ${lint.lintStatus}`);
  if (lint.totalEntries !== 4 || (lint.lintRows || []).length !== 4) fail("expected 4 lint rows");
  if (lint.readyEntries !== 0 || lint.blockedEntries !== 4) fail(`expected 0/4 ready/blocked, got ${lint.readyEntries}/${lint.blockedEntries}`);
  if (lint.riskRewriteIncompleteEntries !== 4 || lint.publicReferenceMissingEntries !== 4 || lint.originalityMissingEntries !== 4) fail("blank lint should block all quality fields");
  const allMissingFlags = new Set((lint.lintRows || []).flatMap((row) => row.riskRewriteMissingFlags));
  for (const flag of cfg.highRiskFlags) if (!allMissingFlags.has(flag)) fail(`lint must surface high-risk flag ${flag}`);
  return lint;
}

function buildPositiveFixture() {
  const template = readJson(templatePath);
  assertBoundary(template, "input copy template");
  const inputEntries = (template.inputEntries || []).map((entry) => {
    const flags = entry.packQualityRequirements?.riskTermFlags || [];
    return {
      ...entry,
      inputStatus: "positive_lint_fixture_ready",
      reviewerName: `Codex pack ${packNumber} lint positive-control fixture`,
      reviewedAt: "2026-06-21T00:00:00.000Z",
      manualInput: {
        ...entry.manualInput,
        humanTranscription: [
          "Positive-control fixture only.",
          "A real reviewer would place the human-verified transcription from the high-resolution preview here.",
          "This placeholder proves the filled-copy lint and dry-run validation flow for corpus_1313; it is not private course transcription.",
        ].join(" "),
        humanSummary: cfg.fixtureSummary,
        uncertainWords: ["fixture_only_not_private_course_transcription"],
        publicReferenceNotes: "Public reference needed: verify multi-timeframe, chart-pattern, indicator, cycle, terminology, and case-study claims against Wikipedia, official documentation, or open educational references before learner-facing use.",
        originalityNotes: "Original rewrite required: not copied from private course wording or the machine candidate; paraphrase as original education-only chart-literacy content.",
        riskRewriteNotes: flags.map((flag) => `${flag}: rewrite or remove this risk before learner-facing use.`).join(" "),
        checklist: Object.fromEntries(Object.keys(entry.manualInput?.checklist || {}).map((key) => [key, "done"])),
      },
    };
  });
  const fixture = {
    ...template,
    generatedAt: new Date().toISOString(),
    fixtureOnly: true,
    templateStatus: `pack_${packNumber}_positive_lint_fixture`,
    filledEntries: inputEntries.length,
    readyForValidationEntries: inputEntries.length,
    inputEntries,
    usage: [
      `This fixture proves pack ${packNumber} filled-copy lint can pass a structurally complete input.`,
      "Do not apply this fixture with --write.",
      "Do not use fixture text as absorbed course content.",
    ],
    boundary: `Pack ${packNumber} positive lint fixture is pipeline validation material only. It is not a human transcription of private course content, must not be written to the real overlay, does not approve learner-facing release, and does not provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.`,
  };
  writeJson(fixturePath, fixture);
  fs.writeFileSync(fixtureMdPath, [
    `# Local Course P0 Human Fill Pack ${packNumber} Positive Lint Fixture`,
    "",
    `- Fixture only: ${fixture.fixtureOnly}`,
    `- Entries: ${fixture.totalEntries}`,
    `- Ready for validation entries: ${fixture.readyForValidationEntries}`,
    "",
  ].join("\n"), "utf8");
  return fixture;
}

function checkPositiveFixture() {
  const fixture = readJson(fixturePath);
  const lint = readJson(fixtureLintPath);
  const validation = readJson(fixtureValidationPath);
  const apply = readJson(fixtureApplyPath);
  for (const [name, artifact] of [["fixture", fixture], ["lint", lint], ["validation", validation], ["apply", apply]]) {
    assertBoundary(artifact, name);
    if (artifact.fixtureOnly !== true) fail(`${name} must be fixtureOnly`);
  }
  if (fixture.templateStatus !== `pack_${packNumber}_positive_lint_fixture`) fail(`unexpected fixture status: ${fixture.templateStatus}`);
  if (fixture.totalEntries !== 4 || fixture.filledEntries !== 4 || fixture.readyForValidationEntries !== 4) fail("fixture should fill all 4 entries");
  if (lint.lintStatus !== "ready_for_validation" || lint.readyEntries !== 4 || lint.blockedEntries !== 0) fail("positive fixture lint should be ready");
  if (lint.candidateCopyIssueEntries !== 0 || lint.riskRewriteIncompleteEntries !== 0 || lint.publicReferenceMissingEntries !== 0 || lint.originalityMissingEntries !== 0 || lint.forbiddenHitEntries !== 0) fail("positive fixture lint should have no quality issues");
  if (validation.totalEntries !== 4 || validation.readyEntries !== 4 || validation.blockedEntries !== 0 || validation.forbiddenHitEntries !== 0) fail("positive fixture validation should be ready");
  if (apply.applyMode !== "dry_run" || apply.readyToApplyEntries !== 4 || apply.blockedEntries !== 0 || apply.writtenEntries !== 0) fail(`positive fixture apply drift: ${apply.applyMode}/${apply.readyToApplyEntries}/${apply.blockedEntries}/${apply.writtenEntries}`);
  if (apply.applyStatus !== "ready_entries_not_written") fail(`unexpected applyStatus: ${apply.applyStatus}`);
  return { fixture, lint, validation, apply };
}

const actions = {
  "build-pack": buildPack,
  "check-pack": checkPack,
  "build-input-template": buildInputTemplate,
  "check-input-template": checkInputTemplate,
  "lint-input": () => lintInput(),
  "check-lint": checkLint,
  "build-positive-fixture": buildPositiveFixture,
  "check-positive-fixture": checkPositiveFixture,
};

if (!actions[mode]) fail(`unknown mode ${mode}`);
const result = actions[mode]();
console.log(JSON.stringify({
  ok: true,
  mode,
  packNumber,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  packId: cfg.packId,
  totalEntries: result.totalEntries ?? result.totalPackCards ?? result.template?.totalEntries ?? result.fixture?.totalEntries,
  readyEntries: result.readyEntries ?? result.validation?.readyEntries ?? result.lint?.readyEntries,
  blockedEntries: result.blockedEntries ?? result.validation?.blockedEntries ?? result.lint?.blockedEntries,
  writtenEntries: result.apply?.writtenEntries,
}, null, 2));
