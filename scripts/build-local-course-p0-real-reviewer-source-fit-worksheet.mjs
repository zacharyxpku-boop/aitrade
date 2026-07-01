import fs from "node:fs";

const evidencePacketPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_EVIDENCE_PACKET.json";
const inputStarterPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_INPUT_STARTER.json";
const taskBoardPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_TASK_BOARD.json";
const outputJson = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_WORKSHEET.json";
const outputMd = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_WORKSHEET.md";

const manualBlankFields = [
  "reviewerSourceFitDecision",
  "sourceFitNote",
  "publicReferenceNotes",
  "selectedSuggestedRefIds",
  "rejectedSuggestedRefIds",
  "claimBoundaryConfirmation",
  "licenseAttributionCheck",
  "originalityNoCopyCheck",
];

const replacementBlankFields = [
  "reviewerSourceFitDecision",
  "sourceFitNote",
  "publicReferenceNotes",
  "selectedSuggestedRefIds",
  "rejectedSuggestedRefIds",
  "replacementSourceIdentityBasis",
  "claimBoundaryConfirmation",
  "replacementNoInferenceCheck",
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

const evidencePacket = readJson(evidencePacketPath);
const inputStarter = readJson(inputStarterPath);
const taskBoard = readJson(taskBoardPath);

assertBoundary(evidencePacket, "evidence packet");
assertBoundary(inputStarter, "input starter");
assertBoundary(taskBoard, "task board");

const taskById = new Map((taskBoard.taskRows || []).map((row) => [row.id, row]));
const cards = (evidencePacket.taskRows || []).map((row) => {
  const boardRow = taskById.get(row.id) || {};
  const blankFields = row.category === "source_replacement" ? replacementBlankFields : manualBlankFields;
  return {
    order: row.order,
    id: `source_fit_card_${String(row.order).padStart(2, "0")}`,
    taskId: row.taskId,
    inputEntryId: row.id,
    category: row.category,
    sourceRelativePath: row.sourceRelativePath,
    sourceModule: row.sourceModule,
    documentId: row.documentId,
    pageNumber: row.pageNumber,
    candidateId: row.candidateId,
    validationStatus: boardRow.validationStatus || "blocked_missing_reviewer_input",
    readyForOverlayApply: false,
    blankFields,
    blankFieldCount: blankFields.length,
    requiredReviewerDecisions: [
      "confirm_public_refs_support_neutral_vocabulary_only",
      "downgrade_refs_to_boundary_context_only",
      "reject_refs_as_not_fit_for_this_private_page",
      "block_until_replacement_or_transcription_review",
    ],
    suggestedPublicRefs: row.suggestedPublicRefs || [],
    sourceFitPrompt: row.sourceFitPrompt,
    publicReferenceNotesPrompt: row.publicReferenceNotesPrompt,
    claimBoundary: row.claimBoundary,
    acceptanceChecks: [
      "Reviewer names which suggested refs were inspected and which were rejected.",
      "sourceFitNote states the allowed role of each retained ref without copying source wording.",
      "publicReferenceNotes separate Wikipedia/share-alike attribution needs from open/public context refs.",
      "claimBoundaryConfirmation explicitly rejects setup, signal, outcome, strategy-edge, and real-money action claims.",
      "originality/no-inference check confirms private course wording and blank-page content are not reconstructed into learner-facing text.",
    ],
    unsafeAutofillFields: [
      "sourceFitNote",
      "publicReferenceNotes",
      "reviewerSourceFitDecision",
      "claimBoundaryConfirmation",
    ],
    generatedDecision: "",
    reviewerFilled: false,
    learnerCitationApproved: false,
    approvalStatus: "not_approved",
    learnerFacingRelease: false,
    nextGate: "human_fill_source_fit_worksheet_then_validate_reviewer_input_copy",
  };
});

const worksheet = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  worksheetStatus: "p0_real_reviewer_source_fit_worksheet_ready_blank",
  worksheetMode: "blank_human_source_fit_cards_with_public_ref_suggestions",
  sourceEvidencePacket: evidencePacketPath,
  sourceInputStarter: inputStarterPath,
  sourceTaskBoard: taskBoardPath,
  totalCards: cards.length,
  manualTranscriptionCards: cards.filter((card) => card.category === "manual_transcription").length,
  sourceReplacementCards: cards.filter((card) => card.category === "source_replacement").length,
  totalBlankFields: cards.reduce((sum, card) => sum + card.blankFieldCount, 0),
  cardsWithSuggestedRefs: cards.filter((card) => card.suggestedPublicRefs.length >= 3).length,
  cardsWithWikipediaRefs: cards.filter((card) =>
    card.suggestedPublicRefs.some((ref) => ref.tier === "share_alike" || ref.family === "Wikipedia")).length,
  cardsWithPublicContextRefs: cards.filter((card) =>
    card.suggestedPublicRefs.some((ref) => ref.tier !== "share_alike" && ref.family !== "Wikipedia")).length,
  reviewerFilledCards: 0,
  generatedDecisions: 0,
  learnerCitationApprovedCards: 0,
  realHumanInputEntries: 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  cards,
  commands: [
    "npm.cmd run build:local-course-p0-real-reviewer-source-fit-worksheet",
    "npm.cmd run check:local-course-p0-real-reviewer-source-fit-worksheet",
    "npm.cmd run check:local-course-p0-real-reviewer-evidence-packet",
    "npm.cmd run check:local-course-p0-real-reviewer-input-starter",
  ],
  completionRule: "This worksheet converts evidence suggestions into blank reviewer source-fit cards. It does not fill sourceFitNote or publicReferenceNotes, does not generate reviewer decisions, does not approve learner-facing citations, and does not authorize overlay writes.",
  boundary: "P0 real reviewer source-fit worksheet is reviewer-facing education-only operations material. It keeps all source-fit and public-reference judgment blank for real human review. Public refs may support terminology, taxonomy, attribution-aware context, and source-boundary review only; they do not prove a setup, signal, future outcome, strategy edge, real-money action, stock recommendation, live signal, return promise, broker workflow, or automation.",
};

fs.writeFileSync(outputJson, `${JSON.stringify(worksheet, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Local Course P0 Real Reviewer Source-Fit Worksheet",
  "",
  `- Status: ${worksheet.worksheetStatus}`,
  `- Cards: ${worksheet.totalCards}`,
  `- Manual transcription cards: ${worksheet.manualTranscriptionCards}`,
  `- Source replacement cards: ${worksheet.sourceReplacementCards}`,
  `- Blank fields: ${worksheet.totalBlankFields}`,
  `- Cards with suggested refs: ${worksheet.cardsWithSuggestedRefs}`,
  `- Reviewer-filled cards: ${worksheet.reviewerFilledCards}`,
  `- Generated decisions: ${worksheet.generatedDecisions}`,
  `- Write allowed now: ${worksheet.writeAllowedNow}`,
  "",
  "## Cards",
  "",
  "| # | Card | Category | Wiki refs | Public refs | Blank fields | Next gate |",
  "|---:|---|---|---:|---:|---:|---|",
  ...cards.map((card) => {
    const wiki = card.suggestedPublicRefs.filter((ref) => ref.tier === "share_alike" || ref.family === "Wikipedia").length;
    const publicRefs = card.suggestedPublicRefs.length - wiki;
    return `| ${card.order} | ${card.id} | ${card.category} | ${wiki} | ${publicRefs} | ${card.blankFieldCount} | ${card.nextGate} |`;
  }),
  "",
  "## Boundary",
  "",
  worksheet.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: worksheet.educationOnly,
  productionReady: worksheet.productionReady,
  learnerFacingRelease: worksheet.learnerFacingRelease,
  approvalStatus: worksheet.approvalStatus,
  worksheetStatus: worksheet.worksheetStatus,
  totalCards: worksheet.totalCards,
  totalBlankFields: worksheet.totalBlankFields,
  cardsWithSuggestedRefs: worksheet.cardsWithSuggestedRefs,
  reviewerFilledCards: worksheet.reviewerFilledCards,
  generatedDecisions: worksheet.generatedDecisions,
  learnerCitationApprovedCards: worksheet.learnerCitationApprovedCards,
  realHumanInputEntries: worksheet.realHumanInputEntries,
  writeAllowedNow: worksheet.writeAllowedNow,
  outputJson,
  outputMd,
}, null, 2));
