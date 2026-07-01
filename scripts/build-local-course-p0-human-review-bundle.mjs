import fs from "node:fs";

const manualPackNumbers = ["01", "02", "03", "04", "05"];
const outputPath = "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE.json";
const outputMdPath = "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function assertBoundary(artifact, label) {
  if (artifact.educationOnly !== true) fail(`${label} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${label} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${label} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${label} must remain not_approved`);
}

function validationSummary(path) {
  const validation = readJson(path);
  return {
    validationStatus: validation.validationStatus,
    readyEntries: validation.readyEntries || validation.validationReadyEntries || 0,
    blockedEntries: validation.blockedEntries || validation.validationBlockedEntries || 0,
    forbiddenHitEntries: validation.forbiddenHitEntries || 0,
  };
}

function lintSummary(path) {
  const lint = readJson(path);
  return {
    lintStatus: lint.lintStatus,
    readyEntries: lint.readyEntries || lint.lintReadyEntries || 0,
    blockedEntries: lint.blockedEntries || lint.lintBlockedEntries || 0,
    forbiddenHitEntries: lint.forbiddenHitEntries || 0,
    candidateCopyIssueEntries: lint.candidateCopyIssueEntries || 0,
    directCandidateMisuseEntries: lint.directCandidateMisuseEntries || 0,
  };
}

function fixtureSummary(path) {
  const fixture = readJson(path);
  assertBoundary(fixture, path);
  return {
    fixtureOnly: fixture.fixtureOnly === true,
    totalEntries: fixture.totalEntries || 0,
    readyForValidationEntries: fixture.readyForValidationEntries || 0,
    filledEntries: fixture.filledEntries || 0,
  };
}

function packRow(number) {
  const prefix = `docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_${number}`;
  const pack = readJson(`${prefix}.json`);
  const template = readJson(`${prefix}_INPUT_COPY_TEMPLATE.json`);
  assertBoundary(pack, `${prefix}.json`);
  assertBoundary(template, `${prefix}_INPUT_COPY_TEMPLATE.json`);
  return {
    packNumber: number,
    packId: pack.packId,
    category: "manual_transcription",
    packStatus: pack.packStatus,
    templateStatus: template.templateStatus,
    totalPackCards: pack.totalPackCards || 0,
    totalInputEntries: template.totalEntries || 0,
    filledCards: pack.filledCards || 0,
    filledEntries: template.filledEntries || 0,
    readyForValidationCards: pack.readyForValidationCards || 0,
    readyForValidationEntries: template.readyForValidationEntries || 0,
    acceptedForOverlayCards: pack.acceptedForOverlayCards || 0,
    targetTaskIds: pack.targetTaskIds || [],
    targetDocumentIds: pack.targetDocumentIds || [],
    targetPageNumbers: pack.targetPageNumbers || [],
    topRiskTermFlags: pack.topRiskTermFlags || [],
    validation: validationSummary(`${prefix}_INPUT_COPY_VALIDATION.json`),
    lint: lintSummary(`${prefix}_INPUT_COPY_LINT.json`),
    positiveFixture: fixtureSummary(`${prefix}_POSITIVE_LINT_FIXTURE.json`),
    sampleCards: (pack.packCards || []).slice(0, 2).map((card) => ({
      id: card.id,
      taskId: card.taskId,
      documentId: card.documentId,
      pageNumber: card.pageNumber,
      sourceRelativePath: card.sourceRelativePath,
      highResPreviewUrl: card.highResPreviewUrl,
      fillStatus: card.fillStatus,
      candidateId: card.candidateId,
      nextGate: card.nextGate,
    })),
  };
}

function sourceReplacementRow() {
  const pack = readJson("docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_REVIEW_PACK.json");
  const template = readJson("docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_INPUT_COPY_TEMPLATE.json");
  assertBoundary(pack, "source replacement review pack");
  assertBoundary(template, "source replacement input copy template");
  return {
    packNumber: "source_replacement",
    packId: pack.packId,
    category: "source_replacement",
    packStatus: pack.packStatus,
    templateStatus: template.templateStatus,
    totalPackCards: pack.totalEntries || 0,
    totalInputEntries: template.totalEntries || 0,
    filledCards: pack.filledEntries || 0,
    filledEntries: template.filledEntries || 0,
    readyForValidationCards: pack.readyForValidationEntries || 0,
    readyForValidationEntries: template.readyForValidationEntries || 0,
    acceptedForOverlayCards: pack.acceptedForOverlayEntries || 0,
    targetTaskIds: pack.targetTaskIds || [],
    targetDocumentIds: pack.targetDocumentIds || [],
    targetPageNumbers: (pack.reviewEntries || []).map((entry) => entry.pageNumber).filter((value) => value != null),
    entriesWithCandidates: pack.entriesWithCandidates || 0,
    entriesWithDirectReplacementCandidates: pack.entriesWithDirectReplacementCandidates || 0,
    validation: validationSummary("docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_INPUT_COPY_VALIDATION.json"),
    lint: lintSummary("docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_INPUT_COPY_LINT.json"),
    positiveFixture: fixtureSummary("docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_POSITIVE_LINT_FIXTURE.json"),
    sampleCards: (pack.reviewEntries || []).slice(0, 2).map((entry) => ({
      id: entry.id,
      taskId: entry.taskId,
      documentId: entry.documentId,
      pageNumber: entry.pageNumber,
      sourceRelativePath: entry.sourceRelativePath,
      reviewStatus: entry.reviewStatus,
      candidateCount: entry.candidateCount,
      selectedDecision: entry.selectedDecision,
      nextGate: entry.nextGate,
    })),
  };
}

const packRows = [...manualPackNumbers.map(packRow), sourceReplacementRow()];
const manualRows = packRows.filter((row) => row.category === "manual_transcription");
const sourceRows = packRows.filter((row) => row.category === "source_replacement");
const totalReviewEntries = packRows.reduce((sum, row) => sum + row.totalInputEntries, 0);
const validationBlockedEntries = packRows.reduce((sum, row) => sum + row.validation.blockedEntries, 0);
const validationReadyEntries = packRows.reduce((sum, row) => sum + row.validation.readyEntries, 0);
const lintBlockedEntries = packRows.reduce((sum, row) => sum + row.lint.blockedEntries, 0);
const lintReadyEntries = packRows.reduce((sum, row) => sum + row.lint.readyEntries, 0);
const fixtureReadyEntries = packRows.reduce((sum, row) => sum + row.positiveFixture.readyForValidationEntries, 0);
const fixtureOnlyReadyEntries = packRows.reduce((sum, row) => sum + (row.positiveFixture.fixtureOnly ? row.positiveFixture.readyForValidationEntries : 0), 0);

const bundle = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  bundleStatus: "p0_human_review_bundle_ready_not_applied",
  manualPackCount: manualRows.length,
  sourceReplacementPackCount: sourceRows.length,
  totalPackRows: packRows.length,
  manualTranscriptionEntries: manualRows.reduce((sum, row) => sum + row.totalInputEntries, 0),
  sourceReplacementEntries: sourceRows.reduce((sum, row) => sum + row.totalInputEntries, 0),
  totalReviewEntries,
  filledEntries: packRows.reduce((sum, row) => sum + row.filledEntries, 0),
  validationReadyEntries,
  validationBlockedEntries,
  lintReadyEntries,
  lintBlockedEntries,
  acceptedForOverlayEntries: packRows.reduce((sum, row) => sum + row.acceptedForOverlayCards, 0),
  positiveFixtureReadyEntries: fixtureReadyEntries,
  fixtureOnlyReadyEntries,
  fixtureWrittenEntries: 0,
  realHumanInputEntries: 0,
  writeAllowedNow: false,
  approvalGatePassed: false,
  humanApprovalRequired: true,
  realReviewerInputRequired: true,
  packRows,
  completionRule: "This bundle proves all 22 P0 review entries have blank human-review intake paths and fixture-only controls. It does not prove human review completion and does not authorize overlay writes.",
  boundary: "P0 human review bundle is internal reviewer scaffolding only. It does not perform OCR, replace real reviewer judgment, approve learner-facing release, write overlay changes, provide stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

if (bundle.manualTranscriptionEntries !== 19) fail(`expected 19 manual entries, got ${bundle.manualTranscriptionEntries}`);
if (bundle.sourceReplacementEntries !== 3) fail(`expected 3 source replacement entries, got ${bundle.sourceReplacementEntries}`);
if (bundle.totalReviewEntries !== 22) fail(`expected 22 total review entries, got ${bundle.totalReviewEntries}`);
if (bundle.validationBlockedEntries !== 22) fail(`expected 22 blocked blank validation entries, got ${bundle.validationBlockedEntries}`);
if (bundle.validationReadyEntries !== 0) fail(`expected 0 validation-ready blank entries, got ${bundle.validationReadyEntries}`);
if (bundle.filledEntries !== 0 || bundle.acceptedForOverlayEntries !== 0) fail("blank bundle must not contain filled or accepted entries");
if (bundle.positiveFixtureReadyEntries !== 22 || bundle.fixtureOnlyReadyEntries !== 22) fail("positive fixture coverage must remain 22 fixture-only entries");

writeJson(outputPath, bundle);
fs.writeFileSync(outputMdPath, [
  "# Local Course P0 Human Review Bundle",
  "",
  `- Status: ${bundle.bundleStatus}`,
  `- Manual packs: ${bundle.manualPackCount} (${bundle.manualTranscriptionEntries} entries)`,
  `- Source replacement packs: ${bundle.sourceReplacementPackCount} (${bundle.sourceReplacementEntries} entries)`,
  `- Total review entries: ${bundle.totalReviewEntries}`,
  `- Blank validation blocked: ${bundle.validationBlockedEntries}`,
  `- Validation ready: ${bundle.validationReadyEntries}`,
  `- Real human input entries: ${bundle.realHumanInputEntries}`,
  `- Write allowed now: ${bundle.writeAllowedNow}`,
  "",
  "This is reviewer scaffolding, not human approval or learner-facing release.",
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  bundleStatus: bundle.bundleStatus,
  manualTranscriptionEntries: bundle.manualTranscriptionEntries,
  sourceReplacementEntries: bundle.sourceReplacementEntries,
  totalReviewEntries: bundle.totalReviewEntries,
  validationBlockedEntries: bundle.validationBlockedEntries,
  positiveFixtureReadyEntries: bundle.positiveFixtureReadyEntries,
  writeAllowedNow: bundle.writeAllowedNow,
}, null, 2));
