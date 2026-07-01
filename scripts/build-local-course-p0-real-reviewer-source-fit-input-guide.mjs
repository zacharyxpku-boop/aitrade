import fs from "node:fs";

const worksheetPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_WORKSHEET.json";
const draftInputPath = "docs/reviewer-inputs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_REAL_INPUT_DRAFT.json";
const outputJson = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_INPUT_GUIDE.json";
const outputMd = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_INPUT_GUIDE.md";

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

function inputFieldPaths(entry) {
  if (entry.category === "manual_transcription") {
    return [
      "reviewerName",
      "reviewedAt",
      "manualInput.humanTranscription",
      "manualInput.humanSummary",
      "manualInput.sourceFitNote",
      "manualInput.publicReferenceNotes",
      "manualInput.rewriteBoundaryNote",
      "manualInput.originalityNotes",
      "manualInput.riskRewriteNotes",
      "manualInput.checklist",
    ];
  }
  return [
    "reviewerName",
    "reviewedAt",
    "replacementInput.selectedDecision",
    "replacementInput.replacementSourcePath",
    "replacementInput.replacementNote",
    "replacementInput.rerunEvidence",
    "replacementInput.publicReferenceNotes",
    "replacementInput.checklist",
  ];
}

function suggestedRefIds(card) {
  return (card.suggestedPublicRefs || []).map((ref) => ref.sourceId || ref.documentId || ref.url).filter(Boolean);
}

const worksheet = readJson(worksheetPath);
const draftInput = readJson(draftInputPath);

assertBoundary(worksheet, "source-fit worksheet");
assertBoundary(draftInput, "draft input");

const entryById = new Map((draftInput.inputEntries || []).map((entry) => [entry.id, entry]));
const guideRows = (worksheet.cards || []).map((card) => {
  const entry = entryById.get(card.inputEntryId);
  if (!entry) fail(`worksheet card ${card.id} missing draft input entry ${card.inputEntryId}`);
  return {
    order: card.order,
    id: `source_fit_input_guide_${String(card.order).padStart(2, "0")}`,
    cardId: card.id,
    inputEntryId: card.inputEntryId,
    taskId: card.taskId,
    category: card.category,
    sourceRelativePath: card.sourceRelativePath,
    documentId: card.documentId,
    pageNumber: card.pageNumber,
    draftInputPath,
    jsonPointer: `/inputEntries/${draftInput.inputEntries.indexOf(entry)}`,
    requiredFieldPaths: inputFieldPaths(entry),
    sourceFitFieldPath: card.category === "manual_transcription"
      ? "manualInput.sourceFitNote"
      : "replacementInput.publicReferenceNotes",
    publicReferenceNotesFieldPath: card.category === "manual_transcription"
      ? "manualInput.publicReferenceNotes"
      : "replacementInput.publicReferenceNotes",
    suggestedRefIds: suggestedRefIds(card),
    suggestedRefCount: (card.suggestedPublicRefs || []).length,
    wikipediaRefCount: (card.suggestedPublicRefs || []).filter((ref) => ref.tier === "share_alike" || ref.family === "Wikipedia").length,
    publicContextRefCount: (card.suggestedPublicRefs || []).filter((ref) => ref.tier !== "share_alike" && ref.family !== "Wikipedia").length,
    requiredReviewerDecisionValues: card.requiredReviewerDecisions || [],
    unsafeAutofillFields: card.unsafeAutofillFields || [],
    forbiddenPhrases,
    fillInstructions: [
      "Use the high-res preview and source page first; suggested public refs only ground vocabulary, taxonomy, attribution, and boundaries.",
      "Write original reviewer notes in sourceFitNote/publicReferenceNotes; do not copy private course wording or public-source passages.",
      "Select or reject suggestedRefIds explicitly in the note text so a later reviewer can audit the decision trail.",
      "Keep any setup/signal/outcome/strategy-edge/real-money wording out of the note; downgrade the source role to boundary context when unsure.",
    ],
    validationCommand: `npm.cmd run validate:local-course-p0-human-review-bundle-input-copy -- --input ${draftInputPath} --output-json docs/LOCAL_COURSE_P0_REAL_REVIEWER_INPUT_STARTER_VALIDATION.json --output-md docs/LOCAL_COURSE_P0_REAL_REVIEWER_INPUT_STARTER_VALIDATION.md`,
    reviewerFilled: false,
    generatedDecision: "",
    learnerCitationApproved: false,
    approvalStatus: "not_approved",
    learnerFacingRelease: false,
    writeAllowedNow: false,
    nextGate: "fill_draft_input_copy_then_validate_and_lint",
  };
});

const guide = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  guideStatus: "p0_real_reviewer_source_fit_input_guide_ready_blank",
  guideMode: "maps_source_fit_cards_to_reviewer_owned_draft_input_fields",
  sourceWorksheet: worksheetPath,
  sourceDraftInput: draftInputPath,
  totalGuideRows: guideRows.length,
  manualTranscriptionRows: guideRows.filter((row) => row.category === "manual_transcription").length,
  sourceReplacementRows: guideRows.filter((row) => row.category === "source_replacement").length,
  rowsWithSourceFitFieldPath: guideRows.filter((row) => row.sourceFitFieldPath).length,
  rowsWithPublicReferenceNotesFieldPath: guideRows.filter((row) => row.publicReferenceNotesFieldPath).length,
  rowsWithSuggestedRefs: guideRows.filter((row) => row.suggestedRefCount >= 3).length,
  rowsWithWikipediaRefs: guideRows.filter((row) => row.wikipediaRefCount >= 1).length,
  rowsWithPublicContextRefs: guideRows.filter((row) => row.publicContextRefCount >= 1).length,
  reviewerFilledRows: 0,
  generatedDecisions: 0,
  learnerCitationApprovedRows: 0,
  realHumanInputEntries: 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  forbiddenPhrases,
  guideRows,
  commands: [
    "npm.cmd run build:local-course-p0-real-reviewer-source-fit-input-guide",
    "npm.cmd run check:local-course-p0-real-reviewer-source-fit-input-guide",
    "npm.cmd run check:local-course-p0-real-reviewer-source-fit-worksheet",
    `npm.cmd run validate:local-course-p0-human-review-bundle-input-copy -- --input ${draftInputPath} --output-json docs/LOCAL_COURSE_P0_REAL_REVIEWER_INPUT_STARTER_VALIDATION.json --output-md docs/LOCAL_COURSE_P0_REAL_REVIEWER_INPUT_STARTER_VALIDATION.md`,
  ],
  completionRule: "This guide maps blank source-fit cards to the reviewer-owned draft input fields. It does not fill sourceFitNote or publicReferenceNotes, does not generate reviewer decisions, does not approve learner-facing citations, and does not authorize overlay writes.",
  boundary: "P0 real reviewer source-fit input guide is reviewer-facing education-only operations material. It shows where humans should write source-fit and public-reference notes, but keeps all judgment blank. Public refs may support terminology, taxonomy, attribution-aware context, and source-boundary review only; they do not prove a setup, signal, future outcome, strategy edge, real-money action, stock recommendation, live signal, return promise, broker workflow, or automation.",
};

fs.writeFileSync(outputJson, `${JSON.stringify(guide, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Local Course P0 Real Reviewer Source-Fit Input Guide",
  "",
  `- Status: ${guide.guideStatus}`,
  `- Draft input: \`${guide.sourceDraftInput}\``,
  `- Rows: ${guide.totalGuideRows}`,
  `- Source-fit field paths: ${guide.rowsWithSourceFitFieldPath}`,
  `- Public reference field paths: ${guide.rowsWithPublicReferenceNotesFieldPath}`,
  `- Rows with suggested refs: ${guide.rowsWithSuggestedRefs}`,
  `- Reviewer-filled rows: ${guide.reviewerFilledRows}`,
  `- Generated decisions: ${guide.generatedDecisions}`,
  `- Write allowed now: ${guide.writeAllowedNow}`,
  "",
  "## Guide Rows",
  "",
  "| # | Input entry | Category | JSON pointer | Source-fit path | Public refs path | Suggested refs |",
  "|---:|---|---|---|---|---|---:|",
  ...guideRows.map((row) => `| ${row.order} | ${row.inputEntryId} | ${row.category} | ${row.jsonPointer} | ${row.sourceFitFieldPath} | ${row.publicReferenceNotesFieldPath} | ${row.suggestedRefCount} |`),
  "",
  "## Boundary",
  "",
  guide.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: guide.educationOnly,
  productionReady: guide.productionReady,
  learnerFacingRelease: guide.learnerFacingRelease,
  approvalStatus: guide.approvalStatus,
  guideStatus: guide.guideStatus,
  totalGuideRows: guide.totalGuideRows,
  rowsWithSourceFitFieldPath: guide.rowsWithSourceFitFieldPath,
  rowsWithPublicReferenceNotesFieldPath: guide.rowsWithPublicReferenceNotesFieldPath,
  rowsWithSuggestedRefs: guide.rowsWithSuggestedRefs,
  reviewerFilledRows: guide.reviewerFilledRows,
  generatedDecisions: guide.generatedDecisions,
  learnerCitationApprovedRows: guide.learnerCitationApprovedRows,
  realHumanInputEntries: guide.realHumanInputEntries,
  writeAllowedNow: guide.writeAllowedNow,
  outputJson,
  outputMd,
}, null, 2));
