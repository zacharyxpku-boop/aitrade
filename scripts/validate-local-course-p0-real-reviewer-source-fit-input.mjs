import fs from "node:fs";

const defaultInputPath = "docs/reviewer-inputs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_REAL_INPUT_DRAFT.json";
const defaultGuidePath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_INPUT_GUIDE.json";
const defaultOutputJsonPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_INPUT_VALIDATION.json";
const defaultOutputMdPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_INPUT_VALIDATION.md";

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
  "learner-facing approved",
  "approved for release",
  "write allowed",
];

const allowedDecisionValues = [
  "confirm_public_refs_support_neutral_vocabulary_only",
  "downgrade_refs_to_boundary_context_only",
  "reject_refs_as_not_fit_for_this_private_page",
  "block_until_replacement_or_transcription_review",
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

function assertBoundary(artifact, label) {
  if (artifact.educationOnly !== true) fail(`${label} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${label} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${label} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${label} must remain not_approved`);
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getPath(obj, path) {
  return path.split(".").reduce((acc, part) => (acc && typeof acc === "object" ? acc[part] : undefined), obj);
}

function forbiddenHits(value) {
  const blob = JSON.stringify(value || {}).toLowerCase();
  return forbiddenPhrases.filter((phrase) => blob.includes(phrase.toLowerCase()));
}

function mentionsAny(value, candidates) {
  const blob = text(value).toLowerCase();
  return candidates.some((candidate) => candidate && blob.includes(String(candidate).toLowerCase()));
}

const inputPath = argValue("--input", defaultInputPath);
const guidePath = argValue("--guide", defaultGuidePath);
const outputJsonPath = argValue("--output-json", defaultOutputJsonPath);
const outputMdPath = argValue("--output-md", defaultOutputMdPath);
const allowFixture = process.argv.includes("--allow-fixture");

const input = readJson(inputPath);
const guide = readJson(guidePath);
assertBoundary(input, "source-fit input");
assertBoundary(guide, "source-fit guide");
if (input.fixtureOnly === true && !allowFixture) {
  fail("source-fit validator rejects fixture-only files unless --allow-fixture is provided");
}

const inputEntryById = new Map((input.inputEntries || []).map((entry) => [entry.id, entry]));
const validationRows = (guide.guideRows || []).map((guideRow) => {
  const missingFields = [];
  const qualityIssues = [];
  const entry = inputEntryById.get(guideRow.inputEntryId);
  if (!entry) {
    return {
      id: guideRow.id,
      inputEntryId: guideRow.inputEntryId,
      taskId: guideRow.taskId,
      category: guideRow.category,
      validationStatus: "blocked_missing_reviewer_input",
      readyForSourceFitGate: false,
      missingFields: ["inputEntry"],
      qualityIssues: ["Input entry is missing from reviewer-owned draft input."],
      forbiddenHits: [],
      nextGate: "restore_input_entry_then_revalidate",
    };
  }

  const sourceFitNote = getPath(entry, guideRow.sourceFitFieldPath);
  const publicReferenceNotes = getPath(entry, guideRow.publicReferenceNotesFieldPath);
  const combinedNotes = [sourceFitNote, publicReferenceNotes].map(text).join(" ");
  const hits = forbiddenHits({
    reviewerName: entry.reviewerName,
    reviewedAt: entry.reviewedAt,
    sourceFitNote,
    publicReferenceNotes,
  });

  if (!text(entry.reviewerName)) missingFields.push("reviewerName");
  if (!text(entry.reviewedAt)) missingFields.push("reviewedAt");
  if (!text(sourceFitNote)) missingFields.push(guideRow.sourceFitFieldPath);
  if (!text(publicReferenceNotes)) missingFields.push(guideRow.publicReferenceNotesFieldPath);

  if (text(sourceFitNote) && !allowedDecisionValues.some((decision) => sourceFitNote.includes(decision))) {
    qualityIssues.push("sourceFitNote must include one allowed reviewer decision value.");
  }
  if (text(combinedNotes) && !mentionsAny(combinedNotes, guideRow.suggestedRefIds || [])) {
    qualityIssues.push("sourceFit/publicReferenceNotes must mention at least one suggestedRefId from the guide.");
  }
  for (const requiredPhrase of ["setup", "signal", "future outcome", "strategy edge", "real-money action"]) {
    if (text(combinedNotes) && !combinedNotes.toLowerCase().includes(requiredPhrase)) {
      qualityIssues.push(`source-fit notes must explicitly preserve boundary phrase: ${requiredPhrase}`);
    }
  }
  if (text(combinedNotes) && !/no copy|not copied|original wording|original/i.test(combinedNotes)) {
    qualityIssues.push("source-fit notes must include an originality/no-copy statement.");
  }
  if (text(combinedNotes) && /approve|approved|release ready|write allowed|learner citation approved/i.test(combinedNotes)) {
    qualityIssues.push("source-fit notes must not claim approval, release readiness, learner citation approval, or write authorization.");
  }

  const readyForSourceFitGate = missingFields.length === 0 && qualityIssues.length === 0 && hits.length === 0;
  return {
    id: guideRow.id,
    inputEntryId: guideRow.inputEntryId,
    taskId: guideRow.taskId,
    category: guideRow.category,
    documentId: guideRow.documentId,
    pageNumber: guideRow.pageNumber,
    sourceFitFieldPath: guideRow.sourceFitFieldPath,
    publicReferenceNotesFieldPath: guideRow.publicReferenceNotesFieldPath,
    suggestedRefCount: guideRow.suggestedRefCount,
    validationStatus: readyForSourceFitGate ? "ready_for_source_fit_gate" : "blocked_missing_reviewer_input",
    readyForSourceFitGate,
    missingFields,
    qualityIssues,
    forbiddenHits: hits,
    nextGate: readyForSourceFitGate
      ? "run_bundle_validator_then_approval_and_write_authorization_gates"
      : "fill_source_fit_notes_then_revalidate",
  };
});

const readyRows = validationRows.filter((row) => row.readyForSourceFitGate).length;
const blockedRows = validationRows.length - readyRows;
const missingFieldRows = validationRows.filter((row) => row.missingFields.length).length;
const qualityIssueRows = validationRows.filter((row) => row.qualityIssues.length).length;
const forbiddenHitRows = validationRows.filter((row) => row.forbiddenHits.length).length;

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  validationStatus: readyRows === validationRows.length ? "ready_for_source_fit_gate" : "blocked_missing_reviewer_input",
  validationMode: "source_fit_and_public_reference_notes_gate",
  inputPath,
  guidePath,
  fixtureOnly: input.fixtureOnly === true,
  fixtureValidationAllowed: allowFixture,
  totalRows: validationRows.length,
  readyRows,
  blockedRows,
  missingFieldRows,
  qualityIssueRows,
  forbiddenHitRows,
  realHumanInputEntries: input.fixtureOnly === true ? 0 : readyRows,
  fixtureReadyRows: input.fixtureOnly === true ? readyRows : 0,
  generatedDecisions: 0,
  learnerCitationApprovedRows: 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  allowedDecisionValues,
  forbiddenPhrases,
  validationRows,
  completionRule: "This source-fit input validation only checks whether real reviewer sourceFitNote/publicReferenceNotes fields are complete enough for the next gate. It does not generate reviewer decisions, approve learner-facing citations, approve release, or authorize overlay writes.",
  boundary: "P0 real reviewer source-fit input validation is reviewer-facing education-only operations material. It validates source-fit note shape, public-reference note shape, forbidden wording, and boundary statements; it does not provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, learner-facing approval, or write authorization.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course P0 Real Reviewer Source-Fit Input Validation",
  "",
  `- Validation status: ${report.validationStatus}`,
  `- Input path: \`${report.inputPath}\``,
  `- Guide path: \`${report.guidePath}\``,
  `- Fixture only: ${report.fixtureOnly}`,
  `- Total rows: ${report.totalRows}`,
  `- Ready rows: ${report.readyRows}`,
  `- Blocked rows: ${report.blockedRows}`,
  `- Missing-field rows: ${report.missingFieldRows}`,
  `- Quality-issue rows: ${report.qualityIssueRows}`,
  `- Forbidden-hit rows: ${report.forbiddenHitRows}`,
  `- Write allowed now: ${report.writeAllowedNow}`,
  "",
  "| Row | Input entry | Category | Status | Missing fields | Quality issues | Forbidden hits |",
  "|---|---|---|---|---|---|---|",
  ...validationRows.map((row) => `| ${row.id} | ${row.inputEntryId} | ${row.category} | ${row.validationStatus} | ${row.missingFields.join(", ")} | ${row.qualityIssues.join("; ")} | ${row.forbiddenHits.join(", ")} |`),
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
  totalRows: report.totalRows,
  readyRows: report.readyRows,
  blockedRows: report.blockedRows,
  missingFieldRows: report.missingFieldRows,
  qualityIssueRows: report.qualityIssueRows,
  forbiddenHitRows: report.forbiddenHitRows,
  fixtureOnly: report.fixtureOnly,
  fixtureReadyRows: report.fixtureReadyRows,
  realHumanInputEntries: report.realHumanInputEntries,
  writeAllowedNow: report.writeAllowedNow,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
