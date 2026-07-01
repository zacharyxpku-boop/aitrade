import fs from "node:fs";

const outputJsonPath = "docs/LOCAL_COURSE_P0_REVIEW_OPERATOR_INDEX.json";
const outputMdPath = "docs/LOCAL_COURSE_P0_REVIEW_OPERATOR_INDEX.md";

const manualPackIds = ["01", "02", "03", "04", "05"];
const sourceReplacementPackPath = "docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_REVIEW_PACK.json";
const overlayPath = "docs/LOCAL_COURSE_ABSORPTION_P0_REVIEW_OVERLAY.json";
const sourceReplacementWorksheetPath = "docs/LOCAL_COURSE_SOURCE_REPLACEMENT_DECISION_WORKSHEET.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(artifact, name) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${name} must remain not_approved`);
}

function readManualPack(packNumber) {
  const packPath = `docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_${packNumber}.json`;
  const inputPath = `docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_${packNumber}_INPUT_COPY_TEMPLATE.json`;
  const validationPath = `docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_${packNumber}_INPUT_COPY_VALIDATION.json`;
  const lintPath = `docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_${packNumber}_INPUT_COPY_LINT.json`;
  const fixtureApplyPath = `docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_${packNumber}_POSITIVE_LINT_FIXTURE_APPLY_REPORT.json`;
  const pack = readJson(packPath);
  const input = readJson(inputPath);
  const validation = readJson(validationPath);
  const lint = readJson(lintPath);
  const fixtureApply = readJson(fixtureApplyPath);
  for (const [name, artifact] of [
    [`pack ${packNumber}`, pack],
    [`pack ${packNumber} input`, input],
    [`pack ${packNumber} validation`, validation],
    [`pack ${packNumber} lint`, lint],
    [`pack ${packNumber} fixture apply`, fixtureApply],
  ]) assertBoundary(artifact, name);

  return {
    packNumber,
    packId: pack.packId,
    category: "manual_transcription",
    packStatus: pack.packStatus,
    templateStatus: input.templateStatus,
    documentIds: pack.targetDocumentIds || [],
    pageNumbers: pack.targetPageNumbers || [],
    taskIds: pack.targetTaskIds || [],
    totalEntries: pack.totalPackCards,
    blankReadyEntries: pack.packCards?.filter((card) => card.fillStatus === "blank_ready_for_human_fill").length || 0,
    filledEntries: pack.filledCards || 0,
    validationReadyEntries: validation.readyEntries || 0,
    validationBlockedEntries: validation.blockedEntries || 0,
    lintReadyEntries: lint.readyEntries || 0,
    lintBlockedEntries: lint.blockedEntries || 0,
    positiveFixtureReadyToApplyEntries: fixtureApply.readyToApplyEntries || 0,
    positiveFixtureWrittenEntries: fixtureApply.writtenEntries || 0,
    inputCopyPath: inputPath,
    packPath,
    nextGate: "human_fill_then_lint_validate_apply_dry_run",
  };
}

const manualPackRows = manualPackIds.map(readManualPack);
const sourceReplacementPack = readJson(sourceReplacementPackPath);
const sourceReplacementInput = readJson("docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_INPUT_COPY_TEMPLATE.json");
const sourceReplacementValidation = readJson("docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_INPUT_COPY_VALIDATION.json");
const sourceReplacementLint = readJson("docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_INPUT_COPY_LINT.json");
const sourceReplacementFixtureApply = readJson("docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_POSITIVE_LINT_FIXTURE_APPLY_REPORT.json");
const overlay = readJson(overlayPath);
const sourceReplacementWorksheet = readJson(sourceReplacementWorksheetPath);

for (const [name, artifact] of [
  ["source replacement pack", sourceReplacementPack],
  ["source replacement input", sourceReplacementInput],
  ["source replacement validation", sourceReplacementValidation],
  ["source replacement lint", sourceReplacementLint],
  ["source replacement fixture apply", sourceReplacementFixtureApply],
  ["p0 overlay", overlay],
  ["source replacement worksheet", sourceReplacementWorksheet],
]) assertBoundary(artifact, name);

const sourceReplacementRow = {
  packNumber: "source_replacement",
  packId: sourceReplacementPack.packId,
  category: "source_replacement",
  packStatus: sourceReplacementPack.packStatus,
  templateStatus: sourceReplacementInput.templateStatus,
  documentIds: sourceReplacementPack.targetDocumentIds || [],
  pageNumbers: [1],
  taskIds: sourceReplacementPack.targetTaskIds || [],
  totalEntries: sourceReplacementPack.totalEntries,
  blankReadyEntries: sourceReplacementPack.reviewEntries?.filter((entry) => entry.reviewStatus === "blank_ready_for_human_decision").length || 0,
  filledEntries: sourceReplacementPack.filledEntries || 0,
  validationReadyEntries: sourceReplacementValidation.readyEntries || 0,
  validationBlockedEntries: sourceReplacementValidation.blockedEntries || 0,
  lintReadyEntries: sourceReplacementLint.readyEntries || 0,
  lintBlockedEntries: sourceReplacementLint.blockedEntries || 0,
  positiveFixtureReadyToApplyEntries: sourceReplacementFixtureApply.readyToApplyEntries || 0,
  positiveFixtureWrittenEntries: sourceReplacementFixtureApply.writtenEntries || 0,
  inputCopyPath: "docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_INPUT_COPY_TEMPLATE.json",
  packPath: sourceReplacementPackPath,
  nextGate: "source_replacement_decision_then_lint_validate_apply_dry_run",
};

const packRows = [...manualPackRows, sourceReplacementRow];
const manualPackCards = manualPackRows.reduce((sum, row) => sum + row.totalEntries, 0);
const sourceReplacementPackEntries = sourceReplacementRow.totalEntries;
const totalReviewPackEntries = manualPackCards + sourceReplacementPackEntries;
const blankInputBlockedEntries = packRows.reduce((sum, row) => sum + row.validationBlockedEntries, 0);
const blankInputReadyEntries = packRows.reduce((sum, row) => sum + row.validationReadyEntries, 0);
const positiveFixtureReadyToApplyEntries = packRows.reduce((sum, row) => sum + row.positiveFixtureReadyToApplyEntries, 0);
const positiveFixtureWrittenEntries = packRows.reduce((sum, row) => sum + row.positiveFixtureWrittenEntries, 0);

const index = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  indexStatus: "p0_review_operator_index_ready_not_applied",
  totalP0Tasks: overlay.totalP0Tasks,
  manualTranscriptionTasks: overlay.manualTranscriptionTasks,
  sourceReplacementTasks: overlay.sourceReplacementTasks,
  manualPackCount: manualPackRows.length,
  manualPackCards,
  sourceReplacementPackEntries,
  totalReviewPackEntries,
  reviewPackCoverageComplete: totalReviewPackEntries === overlay.totalP0Tasks,
  overlayStatus: overlay.overlayStatus,
  overlayNotStartedTasks: overlay.notStartedTasks,
  overlayReadyForValidationTasks: overlay.readyForValidationTasks,
  overlayAcceptedForNextGateTasks: overlay.acceptedForNextGateTasks,
  blankInputReadyEntries,
  blankInputBlockedEntries,
  positiveFixtureReadyToApplyEntries,
  positiveFixtureWrittenEntries,
  sourceReplacementTargetsWithCandidates: sourceReplacementWorksheet.targetsWithCandidates,
  sourceReplacementTargetsWithDirectReplacementCandidates: sourceReplacementWorksheet.targetsWithDirectReplacementCandidates,
  sourceReplacementApprovedReplacements: sourceReplacementWorksheet.approvedReplacements,
  packRows,
  nextOperatorSteps: [
    "Open the relevant input copy template for a pack.",
    "Human reviewer fills only a copied file, never the blank template.",
    "Run pack lint, generic P0 validation, and apply dry-run.",
    "Do not run --write until dry-run output is inspected and explicitly authorized.",
  ],
  completionRule: "This operator index proves P0 review coverage, not P0 completion. P0 course absorption remains blocked until real human-reviewed input copies pass lint, validation, guarded apply, overlay checks, and downstream readiness gates.",
  boundary: "P0 review operator index is reviewer-only operational material. It does not write overlay changes, approve learner-facing release, infer missing private course content, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course P0 Review Operator Index",
  "",
  "Unified operator index for all P0 human-review packets.",
  "",
  `- Index status: ${index.indexStatus}`,
  `- Review pack coverage: ${index.totalReviewPackEntries}/${index.totalP0Tasks}`,
  `- Manual pack cards: ${index.manualPackCards}`,
  `- Source replacement entries: ${index.sourceReplacementPackEntries}`,
  `- Blank input ready/blocked: ${index.blankInputReadyEntries}/${index.blankInputBlockedEntries}`,
  `- Positive fixture ready/written: ${index.positiveFixtureReadyToApplyEntries}/${index.positiveFixtureWrittenEntries}`,
  `- Overlay: ${index.overlayStatus} / accepted ${index.overlayAcceptedForNextGateTasks}`,
  "",
  "## Pack Rows",
  "",
  "| Pack | Category | Entries | Blank blocked | Fixture ready | Written | Documents | Pages |",
  "| --- | --- | ---: | ---: | ---: | ---: | --- | --- |",
  ...packRows.map((row) => `| ${row.packNumber} | ${row.category} | ${row.totalEntries} | ${row.validationBlockedEntries} | ${row.positiveFixtureReadyToApplyEntries} | ${row.positiveFixtureWrittenEntries} | ${row.documentIds.join(", ")} | ${row.pageNumbers.join(", ")} |`),
  "",
  "## Next Operator Steps",
  "",
  ...index.nextOperatorSteps.map((step) => `- ${step}`),
  "",
  "## Completion Rule",
  "",
  index.completionRule,
  "",
  "## Boundary",
  "",
  index.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: index.educationOnly,
  productionReady: index.productionReady,
  learnerFacingRelease: index.learnerFacingRelease,
  approvalStatus: index.approvalStatus,
  indexStatus: index.indexStatus,
  totalP0Tasks: index.totalP0Tasks,
  totalReviewPackEntries: index.totalReviewPackEntries,
  reviewPackCoverageComplete: index.reviewPackCoverageComplete,
  blankInputBlockedEntries: index.blankInputBlockedEntries,
  positiveFixtureWrittenEntries: index.positiveFixtureWrittenEntries,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
