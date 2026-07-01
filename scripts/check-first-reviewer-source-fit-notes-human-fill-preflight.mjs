import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_HUMAN_FILL_PREFLIGHT.json";
const outputMd = "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_HUMAN_FILL_PREFLIGHT.md";

const paths = {
  directCandidateDecisionWorksheet: "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_DECISION_WORKSHEET.json",
  sourceFitDecisionSummary: "docs/FIRST_REVIEWER_SOURCE_FIT_DECISION_SUMMARY.json",
  sourceFitNotesCardPack: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_PACK.json",
  sourceFitNotesCardNegativeCases: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_NEGATIVE_CASES.json",
  sourceFitNotesPositiveMatrix: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_POSITIVE_MATRIX.json",
  sourceFitNotesAcceptance: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_ACCEPTANCE.json",
  humanReviewStartChecklist: "docs/FIRST_REVIEWER_HUMAN_REVIEW_START_CHECKLIST.json",
  noteReadinessMatrix: "docs/FIRST_REVIEWER_NOTE_READINESS_MATRIX.json",
};

const allowedDecisionValues = [
  "confirm_direct_evidence_after_human_review",
  "downgrade_to_boundary_only",
  "blocked_needs_rewrite_or_source_replacement",
];

function fail(message) {
  throw new Error(message);
}

async function readJson(path) {
  return JSON.parse(await fs.readFile(path, "utf8"));
}

async function exists(path) {
  return fs.access(path).then(() => true, () => false);
}

function assertEnvelope(record, label) {
  if (record.educationOnly !== true) fail(`${label} must keep educationOnly true`);
  if (record.productionReady !== false) fail(`${label} must keep productionReady false`);
  if (record.learnerFacingRelease !== false) fail(`${label} cannot be learner-facing release`);
  if (record.approvalStatus !== "not_approved") fail(`${label} must stay not_approved`);
  if (record.expectedOutcome !== EXPECTED_OUTCOME) fail(`${label} expectedOutcome changed`);
}

function checklistRow(row, card) {
  return {
    batchId: row.batchId,
    lessonId: row.lessonId,
    family: row.family,
    riskLevel: row.riskLevel,
    requiredDecisionValues: allowedDecisionValues,
    requiredFields: card.blankFields.map((field) => field.field),
    sourceRefsToInspect: row.sourceRefsToInspectCount,
    sourceIdentityBasisRequired: true,
    noCopyOriginalityCheckRequired: true,
    reviewerInitialsRequired: true,
    currentStatus: "blocked_until_human_fills_sourceFitNotes",
    currentDecisionStatus: row.currentDecisionStatus,
    readyForHumanFill: false,
    blocker: "Generated preflight cannot prove reviewer identity, source inspection, chosen decision, or original human note text.",
  };
}

function markdown(report) {
  return [
    "# First Reviewer SourceFitNotes Human-Fill Preflight",
    "",
    "This preflight lists the manual requirements before a human fills real `sourceFitNotes` for the 5 direct candidates.",
    "It does not create the real overlay, fill notes, choose decisions, confirm sources, approve lessons, or publish learner-facing content.",
    "",
    "## Summary",
    "",
    `- Preflight ready: ${report.preflightReady}`,
    `- Human fill allowed now: ${report.humanFillAllowedNow}`,
    `- Start allowed now: ${report.startAllowedNow}`,
    `- Write allowed now: ${report.writeAllowedNow}`,
    `- Direct candidates: ${report.directCandidates}`,
    `- Source refs to inspect: ${report.sourceRefsToInspect}`,
    `- Required fields per candidate: ${report.requiredFieldsPerCandidate}`,
    `- Positive samples: ${report.positiveSamplesPassed}/${report.positiveSamples}`,
    `- Negative cases: ${report.cardNegativeCasesPassed}/${report.cardNegativeCases}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Confirmed decisions: ${report.confirmedDecisions}`,
    `- Approval review candidates: ${report.approvalReviewCandidates}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Candidate Preflight Rows",
    "",
    "| Lesson | Family | Refs | Required fields | Current status |",
    "| --- | --- | ---: | ---: | --- |",
    ...report.candidateRows.map((row) => `| ${row.lessonId} | ${row.family} | ${row.sourceRefsToInspect} | ${row.requiredFields.length} | ${row.currentStatus} |`),
    "",
    "## Manual Requirements",
    "",
    ...report.manualRequirements.map((item) => `- [ ] ${item}`),
    "",
    "## Stop Conditions",
    "",
    ...report.stopConditions.map((item) => `- ${item}`),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const [
  directCandidateDecisionWorksheet,
  sourceFitDecisionSummary,
  sourceFitNotesCardPack,
  sourceFitNotesCardNegativeCases,
  sourceFitNotesPositiveMatrix,
  sourceFitNotesAcceptance,
  humanReviewStartChecklist,
  noteReadinessMatrix,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.directCandidateDecisionWorksheet),
  readJson(paths.sourceFitDecisionSummary),
  readJson(paths.sourceFitNotesCardPack),
  readJson(paths.sourceFitNotesCardNegativeCases),
  readJson(paths.sourceFitNotesPositiveMatrix),
  readJson(paths.sourceFitNotesAcceptance),
  readJson(paths.humanReviewStartChecklist),
  readJson(paths.noteReadinessMatrix),
  exists(realStatusPath),
]);

for (const [label, record] of Object.entries({
  directCandidateDecisionWorksheet,
  sourceFitDecisionSummary,
  sourceFitNotesCardPack,
  sourceFitNotesCardNegativeCases,
  sourceFitNotesPositiveMatrix,
  sourceFitNotesAcceptance,
  humanReviewStartChecklist,
  noteReadinessMatrix,
})) {
  assertEnvelope(record, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; human-fill preflight must stay pre-write`);
if (directCandidateDecisionWorksheet.decisionRows.length !== 5 || directCandidateDecisionWorksheet.confirmedDecisions !== 0) fail("direct candidate worksheet must keep 5 blank rows");
if (sourceFitDecisionSummary.decisionRows.length !== 5 || sourceFitDecisionSummary.confirmedDecisions !== 0 || sourceFitDecisionSummary.writeAllowedNow !== false) fail("source-fit summary must keep 5 blank write-blocked rows");
if (sourceFitNotesCardPack.blankCards !== 5 || sourceFitNotesCardPack.blankFields !== 35 || sourceFitNotesCardPack.filledFields !== 0) fail("sourceFitNotes card pack must keep 5 cards, 35 blanks, and 0 filled fields");
if (sourceFitNotesCardNegativeCases.failedCases !== 0 || sourceFitNotesCardNegativeCases.passedCases !== sourceFitNotesCardNegativeCases.negativeCases) fail("card negative cases must pass before human-fill preflight");
if (sourceFitNotesPositiveMatrix.sampleOnly !== true || sourceFitNotesPositiveMatrix.failedSamples !== 0 || sourceFitNotesPositiveMatrix.confirmedDecisions !== 0) fail("positive matrix must stay sample-only with 0 confirmed decisions");
if (sourceFitNotesAcceptance.confirmedDecisions !== 0 || sourceFitNotesAcceptance.approvalReviewCandidates !== 0) fail("acceptance gate cannot confirm decisions before real notes");
if (humanReviewStartChecklist.startAllowedNow !== false || humanReviewStartChecklist.realStatusOverlayPresent !== false) fail("human review start must remain manually blocked");
if (noteReadinessMatrix.blankNoteFields !== 72 || noteReadinessMatrix.prefilledNoteFields !== 0) fail("note readiness matrix must keep all fields blank");

const cardsByKey = new Map(sourceFitNotesCardPack.cards.map((card) => [`${card.lessonId}:${card.sourceFamily}`, card]));
const candidateRows = directCandidateDecisionWorksheet.decisionRows.map((row) => {
  const card = cardsByKey.get(`${row.lessonId}:${row.family}`);
  if (!card) fail(`${row.lessonId}/${row.family} missing sourceFitNotes card`);
  if (row.currentDecisionStatus !== "blank_requires_human_decision") fail(`${row.lessonId}/${row.family} must still require a human decision`);
  if (row.sourceRefsToInspectCount < 1) fail(`${row.lessonId}/${row.family} must keep source refs to inspect`);
  for (const ref of row.sourceRefsToInspect) {
    if (ref.sourceUseTier !== "green_official_public_domain" && ref.sourceUseTier !== "green_public_domain_classic") fail(`${row.lessonId}/${row.family}/${ref.sourceId} must stay green`);
  }
  return checklistRow(row, card);
});

const sourceRefsToInspect = candidateRows.reduce((sum, row) => sum + row.sourceRefsToInspect, 0);
const requiredFieldsPerCandidate = new Set(candidateRows.map((row) => row.requiredFields.length));
if (requiredFieldsPerCandidate.size !== 1 || !requiredFieldsPerCandidate.has(7)) fail("each candidate must require 7 sourceFitNotes fields");
if (sourceRefsToInspect !== 8) fail("sourceFitNotes human-fill preflight must cover 8 source refs");

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  preflightReady: true,
  preflightMode: "manual_sourceFitNotes_fill_preflight_only",
  realStatusPath,
  realStatusOverlayPresent,
  humanFillAllowedNow: false,
  startAllowedNow: false,
  writeAllowedNow: false,
  manualDecisionRequired: true,
  humanAuthorizationRecorded: false,
  directCandidates: candidateRows.length,
  sourceRefsToInspect,
  requiredFieldsPerCandidate: [...requiredFieldsPerCandidate][0],
  candidateRows,
  allowedDecisionValues,
  positiveSamples: sourceFitNotesPositiveMatrix.decisionSamples,
  positiveSamplesPassed: sourceFitNotesPositiveMatrix.passedSamples,
  cardNegativeCases: sourceFitNotesCardNegativeCases.negativeCases,
  cardNegativeCasesPassed: sourceFitNotesCardNegativeCases.passedCases,
  confirmedDecisions: 0,
  approvalReviewCandidates: 0,
  commercialReadyPromotions: 0,
  manualRequirements: [
    "Name the human reviewer outside generated scaffolding.",
    "Confirm the scope is rewrite_batch_01 and rewrite_batch_05 only.",
    "For each of the 5 direct candidates, choose exactly one allowed decision value.",
    "For each candidate, record source role, claim supported or narrowed, rewrite action, source identity basis, no-copy originality check, and reviewer initials.",
    "Keep every lesson structural_draft until separate human approval review is complete.",
    "Do not copy sample notes, source body text, or external page prose into the real overlay.",
  ],
  stopConditions: [
    "Stop if a reviewer identity is missing.",
    "Stop if any direct candidate has no explicit confirm/downgrade/block decision.",
    "Stop if source identity basis or no-copy originality check is missing.",
    "Stop if a macro, filing, oversight, or fraud source is used as chart-pattern proof.",
    "Stop if any note contains advice, signals, performance, broker/order, automation, production, launch, commercial-ready, or real-money wording.",
    "Stop if yellow, red, or research_only sources are proposed as learner-facing evidence.",
  ],
  sourceReports: paths,
  boundary: "This human-fill preflight is reviewer-facing scaffolding only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill notes, choose decisions, confirm source use, approve lessons, publish learner-facing content, promote grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, or make the product production-ready.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  preflightReady: report.preflightReady,
  humanFillAllowedNow: report.humanFillAllowedNow,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  directCandidates: report.directCandidates,
  sourceRefsToInspect: report.sourceRefsToInspect,
  requiredFieldsPerCandidate: report.requiredFieldsPerCandidate,
  confirmedDecisions: report.confirmedDecisions,
  approvalReviewCandidates: report.approvalReviewCandidates,
  outputJson,
  outputMd,
}, null, 2));
