import fs from "node:fs";

const defaultInputPath = "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_INPUT_COPY_TEMPLATE.json";
const defaultOutputJsonPath = "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_INPUT_COPY_VALIDATION.json";
const defaultOutputMdPath = "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_INPUT_COPY_VALIDATION.md";
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
  "profit target",
  "stop loss instruction",
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

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function checklistDone(checklist = {}) {
  const values = Object.values(checklist || {});
  return values.length > 0 && values.every((value) => value === "done" || value === true);
}

function forbiddenHits(value) {
  const blob = JSON.stringify(value || {}).toLowerCase();
  return forbiddenPhrases.filter((phrase) => blob.includes(phrase.toLowerCase()));
}

function manualInput(entry) {
  return entry.manualInput || entry;
}

function replacementInput(entry) {
  return entry.replacementInput || entry;
}

const inputPath = argValue("--input", defaultInputPath);
const outputJsonPath = argValue("--output-json", defaultOutputJsonPath);
const outputMdPath = argValue("--output-md", defaultOutputMdPath);
const input = readJson(inputPath);
const allowFixture = process.argv.includes("--allow-fixture");

if (input.educationOnly !== true) fail("bundle input must keep educationOnly:true");
if (input.productionReady !== false) fail("bundle input must keep productionReady:false");
if (input.learnerFacingRelease !== false) fail("bundle input must keep learnerFacingRelease:false");
if (input.approvalStatus !== "not_approved") fail("bundle input must remain not_approved");
if (input.fixtureOnly === true && !allowFixture) fail("bundle input validator rejects fixture-only files for real-review validation");

const validationRows = (input.inputEntries || []).map((entry) => {
  const missingFields = [];
  const category = entry.category;
  const reviewerText = {
    reviewerName: entry.reviewerName,
    reviewedAt: entry.reviewedAt,
    manualInput: entry.manualInput,
    replacementInput: entry.replacementInput,
    selectedDecision: entry.selectedDecision,
    replacementSourcePath: entry.replacementSourcePath,
    replacementNote: entry.replacementNote,
    rerunEvidence: entry.rerunEvidence,
    humanTranscription: entry.humanTranscription,
    humanSummary: entry.humanSummary,
    sourceFitNote: entry.sourceFitNote,
    rewriteBoundaryNote: entry.rewriteBoundaryNote,
  };
  const hits = forbiddenHits(reviewerText);

  if (!text(entry.reviewerName)) missingFields.push("reviewerName");
  if (!text(entry.reviewedAt)) missingFields.push("reviewedAt");

  if (category === "manual_transcription") {
    const fields = manualInput(entry);
    if (!text(fields.humanTranscription)) missingFields.push("humanTranscription");
    if (!text(fields.humanSummary)) missingFields.push("humanSummary");
    if (!text(fields.sourceFitNote) && !text(fields.publicReferenceNotes)) missingFields.push("sourceFitNote");
    if (!text(fields.rewriteBoundaryNote) && !text(fields.originalityNotes)) missingFields.push("rewriteBoundaryNote");
    if (!checklistDone(fields.checklist)) missingFields.push("manualChecklist");
  } else if (category === "source_replacement") {
    const fields = replacementInput(entry);
    const decision = entry.decisionInput || {};
    if (!text(fields.selectedDecision) && !text(decision.selectedDecision)) missingFields.push("selectedDecision");
    if (!text(fields.replacementSourcePath)) missingFields.push("replacementSourcePath");
    if (!text(fields.replacementNote)) missingFields.push("replacementNote");
    if (!text(fields.rerunEvidence)) missingFields.push("rerunEvidence");
    if (!checklistDone(fields.checklist)) missingFields.push("replacementChecklist");
  } else {
    missingFields.push("supportedCategory");
  }

  const readyForOverlayApply = missingFields.length === 0 && hits.length === 0;
  return {
    id: entry.id,
    taskId: entry.taskId,
    category,
    documentId: entry.documentId,
    pageNumber: entry.pageNumber,
    sourceRelativePath: entry.sourceRelativePath,
    validationStatus: readyForOverlayApply ? "ready_for_overlay_apply" : "blocked_missing_reviewer_input",
    readyForOverlayApply,
    missingFields,
    forbiddenHits: hits,
    sourceTemplatePath: entry.sourceTemplatePath,
    nextGate: entry.nextGate,
  };
});

const readyEntries = validationRows.filter((row) => row.readyForOverlayApply).length;
const blockedEntries = validationRows.length - readyEntries;
const forbiddenHitEntries = validationRows.filter((row) => row.forbiddenHits.length).length;

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  validationStatus: readyEntries === validationRows.length ? "ready_for_overlay_apply" : "blocked_missing_reviewer_input",
  fixtureOnly: input.fixtureOnly === true,
  fixtureValidationAllowed: allowFixture,
  inputPath,
  totalEntries: validationRows.length,
  manualTranscriptionEntries: validationRows.filter((row) => row.category === "manual_transcription").length,
  sourceReplacementEntries: validationRows.filter((row) => row.category === "source_replacement").length,
  readyEntries,
  blockedEntries,
  forbiddenHitEntries,
  validationRows,
  nextStep: readyEntries === validationRows.length
    ? "Run the separate lint, approval, and write-authorization gates before any overlay write."
    : "Fill missing real reviewer fields in a copied bundle input file, then rerun this validator.",
  boundary: "P0 human review bundle input validation is a dry-run gate. It does not write overlay changes, approve learner-facing release, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course P0 Human Review Bundle Input Validation",
  "",
  `- Validation status: ${report.validationStatus}`,
  `- Input path: ${report.inputPath}`,
  `- Total entries: ${report.totalEntries}`,
  `- Ready entries: ${report.readyEntries}`,
  `- Blocked entries: ${report.blockedEntries}`,
  `- Forbidden-hit entries: ${report.forbiddenHitEntries}`,
  "",
  "| Entry | Category | Page | Status | Missing fields | Forbidden hits |",
  "| --- | --- | ---: | --- | --- | --- |",
  ...validationRows.slice(0, 22).map((row) => `| ${row.id} | ${row.category} | ${row.pageNumber || ""} | ${row.validationStatus} | ${row.missingFields.join(", ")} | ${row.forbiddenHits.join(", ")} |`),
  "",
  "## Boundary",
  "",
  report.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  validationStatus: report.validationStatus,
  totalEntries: report.totalEntries,
  manualTranscriptionEntries: report.manualTranscriptionEntries,
  sourceReplacementEntries: report.sourceReplacementEntries,
  readyEntries: report.readyEntries,
  blockedEntries: report.blockedEntries,
  forbiddenHitEntries: report.forbiddenHitEntries,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
