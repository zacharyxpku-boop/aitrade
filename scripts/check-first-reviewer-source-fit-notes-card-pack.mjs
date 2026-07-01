import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_PACK.json";
const outputMd = "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_PACK.md";

const paths = {
  dryRunPacket: "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json",
  progressDashboard: "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.json",
  humanExecutionBundle: "docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.json",
  sourceFitDecisionSummary: "docs/FIRST_REVIEWER_SOURCE_FIT_DECISION_SUMMARY.json",
  directCandidateDecisionWorksheet: "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_DECISION_WORKSHEET.json",
  sourceFitNotesAcceptance: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_ACCEPTANCE.json",
};

const requiredBlankFields = [
  "decision",
  "sourceRole",
  "claimSupported",
  "rewriteAction",
  "sourceIdentityBasis",
  "noCopyOriginalityCheck",
  "reviewerInitials",
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

function blankField(name) {
  return {
    field: name,
    value: "",
    blank: true,
    requiredForRealReview: true,
  };
}

function cardFromRow(row, summaryRow) {
  if (!summaryRow) fail(`${row.lessonId}/${row.family} missing source-fit summary row`);
  if (row.currentDecisionStatus !== "blank_requires_human_decision") fail(`${row.lessonId}/${row.family} must stay blank`);
  if (row.mustRemainStructuralDraft !== true) fail(`${row.lessonId}/${row.family} must remain structural_draft`);
  if (summaryRow.recommendedDefault !== "downgrade_to_boundary_only_unless_human_confirms_direct_claim_fit") fail(`${row.lessonId}/${row.family} summary default changed`);
  for (const ref of summaryRow.sourceRefsToInspect) {
    if (ref.sourceUseTier !== "green_official_public_domain" && ref.sourceUseTier !== "green_public_domain_classic") fail(`${row.lessonId}/${row.family}/${ref.sourceId} must stay green`);
  }
  return {
    batchId: row.batchId,
    lessonId: row.lessonId,
    module: row.module,
    topic: row.topic,
    riskLevel: row.riskLevel,
    sourceFamily: row.family,
    recommendedDefault: summaryRow.recommendedDefault,
    sourceRefsToInspect: summaryRow.sourceRefsToInspect,
    allowedDecisionValues: row.allowedDecisionValues,
    confirmIf: row.confirmIf,
    downgradeIf: row.downgradeIf,
    blockIf: row.blockIf,
    blankFields: requiredBlankFields.map(blankField),
    filledFieldCount: 0,
    reviewerWriteTarget: "sourceFitNotes",
    mustRemainStructuralDraft: true,
    learnerFacingUseAllowedNow: false,
    approvalAllowedNow: false,
  };
}

function markdown(report) {
  const lines = [
    "# First Reviewer SourceFitNotes Card Pack",
    "",
    "This pack gives the first reviewer printable blank cards for the 5 direct-candidate source-fit notes.",
    "It does not fill reviewer notes, choose decisions, confirm sources, approve lessons, publish content, or authorize write mode.",
    "",
    "## Summary",
    "",
    `- Card pack ready: ${report.cardPackReady}`,
    `- Card pack mode: ${report.cardPackMode}`,
    `- Target batches: ${report.targetBatches.join(", ")}`,
    `- Blank cards: ${report.blankCards}`,
    `- Blank fields: ${report.blankFields}`,
    `- Filled fields: ${report.filledFields}`,
    `- Source refs to inspect: ${report.sourceRefsToInspect}`,
    `- Families: ${report.families.join(", ")}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Write allowed now: ${report.writeAllowedNow}`,
    `- Confirmed decisions: ${report.confirmedDecisions}`,
    `- Approval review candidates: ${report.approvalReviewCandidates}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Blank Cards",
    "",
  ];

  for (const card of report.cards) {
    lines.push(
      "---",
      "",
      `### ${card.batchId} / ${card.lessonId} / ${card.sourceFamily}`,
      "",
      `- Topic: ${card.topic}`,
      `- Risk: ${card.riskLevel}`,
      `- Recommended default: ${card.recommendedDefault}`,
      `- Write target: ${card.reviewerWriteTarget}`,
      `- Source refs: ${card.sourceRefsToInspect.length}`,
      "",
      "Allowed decision values:",
      ...card.allowedDecisionValues.map((value) => `- [ ] ${value}`),
      "",
      "Required blank fields:",
      ...card.blankFields.map((field) => `- [ ] ${field.field}: ______________________________`),
      "",
      "Hard stops:",
      "- [ ] No copied external source body text.",
      "- [ ] No chart-pattern proof unless direct claim fit is confirmed by a human reviewer.",
      "- [ ] No buy/sell/hold, signal, performance, broker/order, automation, or real-money wording.",
      "- [ ] No approval, learner-facing release, commercial-ready, launch-ready, or production-ready wording.",
      ""
    );
  }

  lines.push("## Boundary", "", report.boundary, "");
  return lines.join("\n");
}

const [
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  sourceFitDecisionSummary,
  directCandidateDecisionWorksheet,
  sourceFitNotesAcceptance,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.dryRunPacket),
  readJson(paths.progressDashboard),
  readJson(paths.humanExecutionBundle),
  readJson(paths.sourceFitDecisionSummary),
  readJson(paths.directCandidateDecisionWorksheet),
  readJson(paths.sourceFitNotesAcceptance),
  exists(realStatusPath),
]);

for (const [label, record] of Object.entries({
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  sourceFitDecisionSummary,
  directCandidateDecisionWorksheet,
  sourceFitNotesAcceptance,
})) {
  assertEnvelope(record, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; sourceFitNotes card pack must stay pre-write`);
if (!dryRunPacket.requiredFiles.some((file) => file.path === outputMd)) fail("dry-run packet must include sourceFitNotes card pack file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-source-fit-notes-card-pack")) fail("dry-run packet must include sourceFitNotes card pack command");
if (!progressDashboard.fileOrder.some((file) => file.path === outputMd)) fail("progress dashboard must include sourceFitNotes card pack file");
if (!progressDashboard.requiredCommands.includes("npm.cmd run check:first-reviewer-source-fit-notes-card-pack")) fail("progress dashboard must include sourceFitNotes card pack command");
if (!progressDashboard.statusBoard.some((row) => row.name === "SourceFitNotes card pack" && row.status === "blank_printable_cards_ready")) fail("progress dashboard must include sourceFitNotes card pack status");
if (!humanExecutionBundle.executionSteps.some((row) => row.file === outputMd)) fail("human execution bundle must point to sourceFitNotes card pack");

if (sourceFitDecisionSummary.summaryReady !== true || sourceFitDecisionSummary.decisionRows.length !== 5) fail("source-fit summary must cover 5 rows");
if (sourceFitDecisionSummary.confirmedDecisions !== 0 || sourceFitDecisionSummary.writeAllowedNow !== false) fail("source-fit summary must remain blank and write-blocked");
if (directCandidateDecisionWorksheet.decisionRows.length !== 5 || directCandidateDecisionWorksheet.confirmedDecisions !== 0) fail("direct candidate worksheet must stay blank");
if (sourceFitNotesAcceptance.acceptanceGateReady !== true || sourceFitNotesAcceptance.confirmedDecisions !== 0) fail("sourceFitNotes acceptance must remain future-only");

const summaryByKey = new Map(sourceFitDecisionSummary.decisionRows.map((row) => [`${row.lessonId}:${row.sourceFamily}`, row]));
const cards = directCandidateDecisionWorksheet.decisionRows.map((row) => cardFromRow(row, summaryByKey.get(`${row.lessonId}:${row.family}`)));
const families = [...new Set(cards.map((card) => card.sourceFamily))].sort();
const blankFields = cards.reduce((sum, card) => sum + card.blankFields.length, 0);
const filledFields = cards.reduce((sum, card) => sum + card.filledFieldCount, 0);
const sourceRefsToInspect = cards.reduce((sum, card) => sum + card.sourceRefsToInspect.length, 0);

if (cards.length !== 5) fail("sourceFitNotes card pack must contain 5 blank cards");
if (blankFields !== 35 || filledFields !== 0) fail("sourceFitNotes card pack must keep 35 blank fields and 0 filled fields");
if (sourceRefsToInspect !== 8) fail("sourceFitNotes card pack must cover 8 source refs");
if (JSON.stringify(families) !== JSON.stringify(["BEA", "BLS", "CFTC", "SEC"])) fail(`sourceFitNotes card families changed: ${families.join(", ")}`);

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  cardPackReady: true,
  cardPackMode: "blank_printable_sourceFitNotes_cards_only",
  targetBatches: sourceFitDecisionSummary.targetBatches,
  realStatusPath,
  realStatusOverlayPresent,
  blankCards: cards.length,
  requiredFields: requiredBlankFields,
  blankFields,
  filledFields,
  sourceRefsToInspect,
  families,
  cards,
  confirmedDecisions: 0,
  approvalReviewCandidates: 0,
  writeAllowedNow: false,
  manualDecisionRequired: true,
  humanAuthorizationRecorded: false,
  sourceReports: paths,
  boundary: "This sourceFitNotes card pack is blank reviewer-facing scaffolding only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, choose decisions, confirm source use, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, or make the product production-ready.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  cardPackReady: report.cardPackReady,
  cardPackMode: report.cardPackMode,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  blankCards: report.blankCards,
  blankFields: report.blankFields,
  filledFields: report.filledFields,
  sourceRefsToInspect: report.sourceRefsToInspect,
  families: report.families,
  confirmedDecisions: report.confirmedDecisions,
  approvalReviewCandidates: report.approvalReviewCandidates,
  writeAllowedNow: report.writeAllowedNow,
  outputJson,
  outputMd,
}, null, 2));
