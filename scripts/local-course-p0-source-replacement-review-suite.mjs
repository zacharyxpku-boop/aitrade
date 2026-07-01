import fs from "node:fs";

const mode = process.argv[2] || "build-pack";
const worksheetPath = "docs/LOCAL_COURSE_SOURCE_REPLACEMENT_DECISION_WORKSHEET.json";
const noteTemplatePath = "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_NOTE_TEMPLATE.json";
const packPath = "docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_REVIEW_PACK.json";
const packMdPath = "docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_REVIEW_PACK.md";
const templatePath = "docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_INPUT_COPY_TEMPLATE.json";
const templateMdPath = "docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_INPUT_COPY_TEMPLATE.md";
const validationPath = "docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_INPUT_COPY_VALIDATION.json";
const lintPath = "docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_INPUT_COPY_LINT.json";
const lintMdPath = "docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_INPUT_COPY_LINT.md";
const fixturePath = "docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_POSITIVE_LINT_FIXTURE.json";
const fixtureMdPath = "docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_POSITIVE_LINT_FIXTURE.md";
const fixtureLintPath = "docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_POSITIVE_LINT_FIXTURE_LINT.json";
const fixtureValidationPath = "docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_POSITIVE_LINT_FIXTURE_VALIDATION.json";
const fixtureApplyPath = "docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_POSITIVE_LINT_FIXTURE_APPLY_REPORT.json";
const packId = "local_course_p0_source_replacement_review_pack";
const allowedDecisions = [
  "locate_external_original",
  "reexport_blank_source",
  "use_neighbor_as_context_only",
  "mark_unrecoverable",
];
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

function assertBoundary(artifact, name) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${name} must remain not_approved`);
}

function checklistDone(checklist = {}) {
  return Object.values(checklist).length > 0 && Object.values(checklist).every((value) => value === "done" || value === true);
}

function forbiddenHits(value) {
  const blob = JSON.stringify(value || {}).toLowerCase();
  return forbiddenPhrases.filter((phrase) => blob.includes(phrase.toLowerCase()));
}

function loadRows() {
  const worksheet = readJson(worksheetPath);
  const noteTemplate = readJson(noteTemplatePath);
  assertBoundary(worksheet, "decision worksheet");
  assertBoundary(noteTemplate, "note template");
  const noteByDoc = new Map((noteTemplate.noteCards || [])
    .filter((card) => card.category === "source_replacement")
    .map((card) => [card.documentId, card]));
  return (worksheet.decisionRows || []).map((row) => {
    const note = noteByDoc.get(row.documentId);
    if (!note) fail(`missing source replacement note for ${row.documentId}`);
    return { row, note };
  });
}

function buildPack() {
  const entries = loadRows().map(({ row, note }) => ({
    id: `source_replacement_review_${note.taskId}`,
    noteCardId: note.id,
    taskId: note.taskId,
    inputEntryId: note.inputEntryId,
    decisionRowId: row.id,
    category: "source_replacement",
    documentId: row.documentId,
    sourceId: row.sourceId,
    pageNumber: row.pageNumber,
    sourceRelativePath: row.sourceRelativePath,
    sourceModule: row.sourceModule,
    previewPath: row.previewPath,
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    reviewStatus: "blank_ready_for_human_decision",
    reviewerName: "",
    reviewedAt: "",
    allowedDecisions,
    selectedDecision: "",
    replacementSourcePath: "",
    replacementNote: "",
    rerunEvidence: "",
    candidateCount: row.candidateCount,
    directReplacementCandidateCount: row.directReplacementCandidateCount,
    recommendedAction: row.recommendedAction,
    topCandidates: row.topCandidates,
    qualityLintRules: [
      "Reviewer must choose one allowed decision before validation.",
      "No neighbor candidate can be treated as a direct replacement when directReplacementCandidateCount is 0.",
      "replacementSourcePath must be a real reviewed path, a reexport evidence path, or an unrecoverable marker with rationale.",
      "replacementNote must explain source identity, readability, and why private blank content was not inferred.",
      "rerunEvidence must identify the harvest/preview/quality rerun evidence to inspect before any next gate.",
    ],
    nextGate: "source_replacement_decision_then_validate_p0_review_input_copy",
  }));
  const pack = {
    generatedAt: new Date().toISOString(),
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    packId,
    packStatus: "blank_source_replacement_review_pack_ready",
    sourceDecisionWorksheet: worksheetPath,
    totalEntries: entries.length,
    sourceReplacementEntries: entries.length,
    entriesWithCandidates: entries.filter((entry) => entry.candidateCount > 0).length,
    entriesWithDirectReplacementCandidates: entries.filter((entry) => entry.directReplacementCandidateCount > 0).length,
    filledEntries: 0,
    readyForValidationEntries: 0,
    acceptedForOverlayEntries: 0,
    targetTaskIds: entries.map((entry) => entry.taskId),
    targetDocumentIds: entries.map((entry) => entry.documentId),
    reviewEntries: entries,
    completionRule: "This source replacement pack is complete only as blank reviewer work material. It becomes ready only after a human reviewer chooses an allowed decision, supplies source/evidence notes, reruns harvest or preview checks, and passes dry-run validation without writing overlay changes.",
    boundary: "Source replacement review pack is reviewer-only material for blank-preview private course PDFs. It does not replace files, infer missing content, approve learner-facing release, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
  };
  writeJson(packPath, pack);
  fs.writeFileSync(packMdPath, [
    "# Local Course P0 Source Replacement Review Pack",
    "",
    "Blank reviewer decision packet for P0 source replacement tasks.",
    "",
    `- Pack status: ${pack.packStatus}`,
    `- Entries: ${pack.totalEntries}`,
    `- Entries with candidates: ${pack.entriesWithCandidates}`,
    `- Direct replacement candidates: ${pack.entriesWithDirectReplacementCandidates}`,
    `- Ready for validation: ${pack.readyForValidationEntries}`,
    "",
    "| Entry | Source | Candidates | Direct | Recommended action |",
    "| --- | --- | ---: | ---: | --- |",
    ...entries.map((entry) => `| ${entry.taskId} | ${entry.sourceRelativePath} | ${entry.candidateCount} | ${entry.directReplacementCandidateCount} | ${entry.recommendedAction} |`),
    "",
  ].join("\n"), "utf8");
  return pack;
}

function checkPack() {
  const pack = readJson(packPath);
  const entries = pack.reviewEntries || [];
  assertBoundary(pack, "source replacement pack");
  if (pack.packId !== packId) fail(`unexpected packId: ${pack.packId}`);
  if (pack.packStatus !== "blank_source_replacement_review_pack_ready") fail(`unexpected packStatus: ${pack.packStatus}`);
  if (pack.totalEntries !== 3 || entries.length !== 3) fail(`expected 3 entries, got ${pack.totalEntries}/${entries.length}`);
  if (pack.entriesWithCandidates !== 3) fail("all replacement entries should expose candidates");
  if (pack.entriesWithDirectReplacementCandidates !== 0) fail("direct replacement candidates must remain 0 until confirmed externally");
  if (pack.filledEntries !== 0 || pack.readyForValidationEntries !== 0 || pack.acceptedForOverlayEntries !== 0) fail("blank pack must not be filled or accepted");
  for (const entry of entries) {
    assertBoundary(entry, entry.id);
    if (entry.category !== "source_replacement") fail(`${entry.id} category drift`);
    if (entry.reviewStatus !== "blank_ready_for_human_decision") fail(`${entry.id} must be blank-ready`);
    if (entry.reviewerName !== "" || entry.reviewedAt !== "") fail(`${entry.id} reviewer fields must be blank`);
    if (entry.selectedDecision !== "" || entry.replacementSourcePath !== "" || entry.replacementNote !== "" || entry.rerunEvidence !== "") fail(`${entry.id} decision fields must be blank`);
    if (!Array.isArray(entry.allowedDecisions) || allowedDecisions.some((decision) => !entry.allowedDecisions.includes(decision))) fail(`${entry.id} allowed decisions incomplete`);
    if (!Array.isArray(entry.topCandidates) || entry.topCandidates.length < 3) fail(`${entry.id} should expose top candidates`);
    if (entry.directReplacementCandidateCount !== 0) fail(`${entry.id} must not claim direct replacements`);
  }
  return pack;
}

function buildInputTemplate() {
  const pack = readJson(packPath);
  assertBoundary(pack, "source replacement pack");
  const inputEntries = (pack.reviewEntries || []).map((entry) => ({
    id: `input_copy_${entry.taskId}`,
    reviewEntryId: `review_${entry.taskId}`,
    taskId: entry.taskId,
    sourcePackEntryId: entry.id,
    decisionRowId: entry.decisionRowId,
    category: "source_replacement",
    sourceRelativePath: entry.sourceRelativePath,
    sourceModule: entry.sourceModule,
    documentId: entry.documentId,
    pageNumber: entry.pageNumber,
    previewPath: entry.previewPath,
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    inputStatus: "source_replacement_input_copy_blank",
    reviewerName: "",
    reviewedAt: "",
    decisionInput: {
      allowedDecisions: entry.allowedDecisions,
      selectedDecision: "",
      selectedCandidateSourceId: "",
      selectedCandidateRelativePath: "",
      candidateCount: entry.candidateCount,
      directReplacementCandidateCount: entry.directReplacementCandidateCount,
      recommendedAction: entry.recommendedAction,
      topCandidates: entry.topCandidates,
      qualityLintRules: entry.qualityLintRules,
    },
    manualInput: null,
    replacementInput: {
      replacementSourcePath: "",
      replacementNote: "",
      rerunEvidence: "",
      checklist: {
        sourceIdentityConfirmed: "not_started",
        replacementSourceReadable: "not_started",
        readablePreviewGenerated: "not_started",
        harvestRerunEvidenceAttached: "not_started",
        qualityAndIntakeRerunReady: "not_started",
      },
    },
    acceptanceCriteria: [
      "Reviewer selected one allowed source replacement decision.",
      "No neighbor candidate is treated as direct replacement unless independently confirmed.",
      "Replacement note explains source identity, readability, and no inference from blank private content.",
      "Rerun evidence names harvest, preview, or quality checks to inspect before the next gate.",
      "Dry-run apply reports ready entries with writtenEntries:0 before any write authorization.",
    ],
    nextGate: "validate_source_replacement_input_then_apply_dry_run_only",
  }));
  const template = {
    generatedAt: new Date().toISOString(),
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    fixtureOnly: false,
    templateStatus: "source_replacement_input_copy_blank",
    sourcePack: packPath,
    packId: pack.packId,
    totalEntries: inputEntries.length,
    sourceReplacementEntries: inputEntries.length,
    filledEntries: 0,
    readyForValidationEntries: 0,
    targetTaskIds: pack.targetTaskIds,
    targetDocumentIds: pack.targetDocumentIds,
    inputEntries,
    completionRule: "This input copy template is blank reviewer input material. It becomes ready only after a human reviewer fills decision and evidence fields, every checklist item is done, lint passes, and apply dry-run writes zero entries.",
    boundary: "Source replacement input copy template is blank reviewer input material. It does not replace files, infer missing content, approve learner-facing release, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
  };
  writeJson(templatePath, template);
  fs.writeFileSync(templateMdPath, [
    "# Local Course P0 Source Replacement Input Copy Template",
    "",
    `- Template status: ${template.templateStatus}`,
    `- Entries: ${template.totalEntries}`,
    `- Filled entries: ${template.filledEntries}`,
    `- Ready for validation: ${template.readyForValidationEntries}`,
    "",
  ].join("\n"), "utf8");
  return template;
}

function checkInputTemplate() {
  const template = readJson(templatePath);
  const validation = readJson(validationPath);
  assertBoundary(template, "source replacement input template");
  assertBoundary(validation, "source replacement validation");
  if (template.fixtureOnly !== false) fail("input template must not be fixtureOnly");
  if (template.templateStatus !== "source_replacement_input_copy_blank") fail(`unexpected templateStatus: ${template.templateStatus}`);
  if (template.packId !== packId) fail(`unexpected packId: ${template.packId}`);
  if (template.totalEntries !== 3 || (template.inputEntries || []).length !== 3) fail("template must include 3 entries");
  if (template.filledEntries !== 0 || template.readyForValidationEntries !== 0) fail("blank template must not be filled");
  if (normalizePath(validation.inputPath) !== normalizePath(templatePath)) fail(`validation should point to ${templatePath}`);
  if (validation.totalEntries !== 3 || validation.readyEntries !== 0 || validation.blockedEntries !== 3 || validation.forbiddenHitEntries !== 0) fail(`validation drift: ${validation.readyEntries}/${validation.blockedEntries}/${validation.forbiddenHitEntries}`);
  for (const entry of template.inputEntries || []) {
    if (entry.category !== "source_replacement") fail(`${entry.id} category drift`);
    if (entry.inputStatus !== "source_replacement_input_copy_blank") fail(`${entry.id} must remain blank`);
    if (entry.reviewerName !== "" || entry.reviewedAt !== "") fail(`${entry.id} reviewer fields must be blank`);
    if (entry.decisionInput?.selectedDecision !== "") fail(`${entry.id} selected decision must be blank`);
    if (entry.replacementInput?.replacementSourcePath !== "" || entry.replacementInput?.replacementNote !== "" || entry.replacementInput?.rerunEvidence !== "") fail(`${entry.id} replacement fields must be blank`);
  }
  return { template, validation };
}

function lintInput(inputPath = argValue("--input", templatePath), outputJsonPath = argValue("--output-json", lintPath), outputMdPath = argValue("--output-md", lintMdPath)) {
  const input = readJson(inputPath);
  assertBoundary(input, "source replacement input");
  if (input.packId !== packId) fail(`unexpected packId: ${input.packId}`);
  const lintRows = (input.inputEntries || []).map((entry) => {
    const missingFields = [];
    if (!text(entry.reviewerName)) missingFields.push("reviewerName");
    if (!text(entry.reviewedAt)) missingFields.push("reviewedAt");
    if (!text(entry.decisionInput?.selectedDecision)) missingFields.push("selectedDecision");
    if (!text(entry.replacementInput?.replacementSourcePath)) missingFields.push("replacementSourcePath");
    if (!text(entry.replacementInput?.replacementNote)) missingFields.push("replacementNote");
    if (!text(entry.replacementInput?.rerunEvidence)) missingFields.push("rerunEvidence");
    if (!checklistDone(entry.replacementInput?.checklist)) missingFields.push("replacementChecklist");
    const selectedDecision = text(entry.decisionInput?.selectedDecision);
    const invalidDecision = selectedDecision ? !allowedDecisions.includes(selectedDecision) : false;
    const directCandidateMisuse = Number(entry.decisionInput?.directReplacementCandidateCount || 0) === 0 &&
      selectedDecision === "locate_external_original" &&
      text(entry.decisionInput?.selectedCandidateRelativePath) &&
      (entry.decisionInput?.topCandidates || []).some((candidate) => candidate.relativePath === entry.decisionInput.selectedCandidateRelativePath);
    const noteText = text(entry.replacementInput?.replacementNote);
    const noInferenceMissing = !/not inferred|no inference|unrecoverable|context only|reexport|external original/i.test(noteText);
    const evidenceMissing = !/rerun|preview|harvest|quality|intake|audit/i.test(text(entry.replacementInput?.rerunEvidence));
    const hits = forbiddenHits(entry);
    const ready = missingFields.length === 0 && !invalidDecision && !directCandidateMisuse && !noInferenceMissing && !evidenceMissing && hits.length === 0;
    return {
      id: entry.id,
      taskId: entry.taskId,
      documentId: entry.documentId,
      sourceRelativePath: entry.sourceRelativePath,
      lintStatus: ready ? "ready_for_validation" : "blocked_quality_lint",
      readyForValidation: ready,
      selectedDecision,
      missingFields,
      invalidDecision,
      directCandidateMisuse,
      noInferenceMissing,
      evidenceMissing,
      forbiddenHits: hits,
      nextGate: entry.nextGate,
    };
  });
  const readyEntries = lintRows.filter((row) => row.readyForValidation).length;
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
    blockedEntries: lintRows.length - readyEntries,
    invalidDecisionEntries: lintRows.filter((row) => row.invalidDecision).length,
    directCandidateMisuseEntries: lintRows.filter((row) => row.directCandidateMisuse).length,
    noInferenceMissingEntries: lintRows.filter((row) => row.noInferenceMissing).length,
    evidenceMissingEntries: lintRows.filter((row) => row.evidenceMissing).length,
    forbiddenHitEntries: lintRows.filter((row) => row.forbiddenHits.length).length,
    lintRows,
    boundary: "Source replacement filled-copy lint is a dry-run quality gate. It does not write overlay changes, replace files, infer missing content, approve learner-facing release, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
  };
  writeJson(outputJsonPath, report);
  fs.writeFileSync(outputMdPath, [
    "# Local Course P0 Source Replacement Input Copy Lint",
    "",
    `- Lint status: ${report.lintStatus}`,
    `- Ready entries: ${report.readyEntries}`,
    `- Blocked entries: ${report.blockedEntries}`,
    `- Direct candidate misuse entries: ${report.directCandidateMisuseEntries}`,
    "",
    "| Entry | Status | Missing | Decision |",
    "| --- | --- | --- | --- |",
    ...lintRows.map((row) => `| ${row.taskId} | ${row.lintStatus} | ${row.missingFields.join(", ")} | ${row.selectedDecision} |`),
    "",
  ].join("\n"), "utf8");
  return report;
}

function checkLint() {
  const lint = readJson(lintPath);
  assertBoundary(lint, "source replacement lint");
  if (lint.packId !== packId) fail(`unexpected packId: ${lint.packId}`);
  if (lint.lintStatus !== "blocked_quality_lint") fail(`expected blocked_quality_lint, got ${lint.lintStatus}`);
  if (lint.totalEntries !== 3 || lint.readyEntries !== 0 || lint.blockedEntries !== 3) fail("blank lint should block all 3 entries");
  if (lint.noInferenceMissingEntries !== 3 || lint.evidenceMissingEntries !== 3) fail("blank lint must require inference/evidence notes");
  for (const row of lint.lintRows || []) {
    for (const field of ["reviewerName", "reviewedAt", "selectedDecision", "replacementSourcePath", "replacementNote", "rerunEvidence", "replacementChecklist"]) {
      if (!row.missingFields.includes(field)) fail(`${row.id} missing expected field ${field}`);
    }
  }
  return lint;
}

function buildPositiveFixture() {
  const template = readJson(templatePath);
  assertBoundary(template, "source replacement input template");
  const inputEntries = (template.inputEntries || []).map((entry) => ({
    ...entry,
    inputStatus: "positive_lint_fixture_ready",
    reviewerName: "Codex source replacement positive-control fixture",
    reviewedAt: "2026-06-21T00:00:00.000Z",
    decisionInput: {
      ...entry.decisionInput,
      selectedDecision: "mark_unrecoverable",
      selectedCandidateSourceId: "",
      selectedCandidateRelativePath: "",
    },
    replacementInput: {
      replacementSourcePath: `unrecoverable://${entry.documentId}/no-direct-replacement-confirmed`,
      replacementNote: "Fixture-only decision: mark unrecoverable because no direct replacement candidate is confirmed; neighbor candidates remain context only and missing private content is not inferred.",
      rerunEvidence: "Fixture-only rerun evidence: preview audit, harvest rerun, quality audit, and intake rerun would be attached before any real overlay write.",
      checklist: Object.fromEntries(Object.keys(entry.replacementInput?.checklist || {}).map((key) => [key, "done"])),
    },
  }));
  const fixture = {
    ...template,
    generatedAt: new Date().toISOString(),
    fixtureOnly: true,
    templateStatus: "source_replacement_positive_lint_fixture",
    filledEntries: inputEntries.length,
    readyForValidationEntries: inputEntries.length,
    inputEntries,
    boundary: "Source replacement positive lint fixture is pipeline validation material only. It is not a real source replacement decision, must not be written to the real overlay, does not approve learner-facing release, and does not provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
  };
  writeJson(fixturePath, fixture);
  fs.writeFileSync(fixtureMdPath, [
    "# Local Course P0 Source Replacement Positive Lint Fixture",
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
  if (fixture.templateStatus !== "source_replacement_positive_lint_fixture") fail(`unexpected fixture status: ${fixture.templateStatus}`);
  if (fixture.totalEntries !== 3 || fixture.filledEntries !== 3 || fixture.readyForValidationEntries !== 3) fail("fixture should fill all 3 entries");
  if (lint.lintStatus !== "ready_for_validation" || lint.readyEntries !== 3 || lint.blockedEntries !== 0) fail("positive fixture lint should be ready");
  if (lint.invalidDecisionEntries !== 0 || lint.directCandidateMisuseEntries !== 0 || lint.noInferenceMissingEntries !== 0 || lint.evidenceMissingEntries !== 0 || lint.forbiddenHitEntries !== 0) fail("positive fixture lint should have no quality issues");
  if (validation.totalEntries !== 3 || validation.readyEntries !== 3 || validation.blockedEntries !== 0 || validation.forbiddenHitEntries !== 0) fail("positive fixture validation should be ready");
  if (apply.applyMode !== "dry_run" || apply.readyToApplyEntries !== 3 || apply.blockedEntries !== 0 || apply.writtenEntries !== 0) fail(`positive fixture apply drift: ${apply.applyMode}/${apply.readyToApplyEntries}/${apply.blockedEntries}/${apply.writtenEntries}`);
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
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  packId,
  totalEntries: result.totalEntries ?? result.template?.totalEntries ?? result.fixture?.totalEntries,
  readyEntries: result.readyEntries ?? result.validation?.readyEntries ?? result.lint?.readyEntries,
  blockedEntries: result.blockedEntries ?? result.validation?.blockedEntries ?? result.lint?.blockedEntries,
  writtenEntries: result.apply?.writtenEntries,
}, null, 2));
