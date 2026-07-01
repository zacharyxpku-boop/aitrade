import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_NEGATIVE_CASES.json";
const outputMd = "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_NEGATIVE_CASES.md";

const paths = {
  sourceFitNotesCardPack: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_PACK.json",
  sourceFitDecisionSummary: "docs/FIRST_REVIEWER_SOURCE_FIT_DECISION_SUMMARY.json",
  sourceFitNotesAcceptance: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_ACCEPTANCE.json",
  dryRunPacket: "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json",
  progressDashboard: "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.json",
  humanExecutionBundle: "docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.json",
};

const allowedGreenTiers = new Set([
  "green_official_public_domain",
  "green_public_domain_classic",
]);

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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function collectFillableText(pack) {
  return (pack.cards ?? [])
    .flatMap((card) => card.blankFields ?? [])
    .map((field) => String(field.value ?? ""))
    .join("\n");
}

function validateMutatedPack(pack) {
  const issues = [];
  const text = collectFillableText(pack);

  if (pack.educationOnly !== true) issues.push("education_only_drift");
  if (pack.productionReady !== false) issues.push("production_ready_drift");
  if (pack.learnerFacingRelease !== false) issues.push("learner_facing_release_drift");
  if (pack.approvalStatus !== "not_approved") issues.push("approval_status_drift");
  if (pack.expectedOutcome !== EXPECTED_OUTCOME) issues.push("expected_outcome_drift");
  if (pack.writeAllowedNow !== false) issues.push("write_allowed_drift");
  if (pack.confirmedDecisions !== 0) issues.push("confirmed_decision_drift");
  if (pack.approvalReviewCandidates !== 0) issues.push("approval_candidate_drift");
  if (pack.commercialReadyPromotions && pack.commercialReadyPromotions !== 0) issues.push("commercial_ready_promotion_drift");
  if (pack.realStatusOverlayPresent !== false) issues.push("real_overlay_drift");

  for (const card of pack.cards ?? []) {
    for (const field of card.blankFields ?? []) {
      if (field.value !== "" || field.blank !== true) issues.push(`prefilled_field:${field.field}`);
    }
    for (const ref of card.sourceRefsToInspect ?? []) {
      if (!allowedGreenTiers.has(ref.sourceUseTier)) issues.push(`non_green_source_ref:${ref.sourceId ?? "unknown"}`);
    }
  }

  if (/approved|approval|learner-facing|launch ready|commercial_ready|commercial ready|productionReady|production ready/i.test(text)) issues.push("approval_readiness_wording");
  if (/buy|sell|hold|entry|exit|signal|win rate|profit|return|broker|order|automation|real money|real-money/i.test(text)) issues.push("trading_or_real_money_wording");
  if (/copy this|quoted from|verbatim|paste source|external body text/i.test(text)) issues.push("copied_source_body_instruction");
  if (/chart-pattern proof|proves the chart|confirms liquidity sweep|entry signal/i.test(text)) issues.push("macro_or_regulatory_as_chart_proof");

  return [...new Set(issues)];
}

function mutateField(pack, fieldName, value) {
  const mutated = clone(pack);
  const target = mutated.cards?.[0]?.blankFields?.find((field) => field.field === fieldName);
  if (!target) fail(`missing field for negative case: ${fieldName}`);
  target.value = value;
  target.blank = false;
  mutated.filledFields = 1;
  return mutated;
}

function caseRow(name, pack, expectedIssue) {
  const issues = validateMutatedPack(pack);
  return {
    name,
    expectedIssue,
    passed: issues.includes(expectedIssue),
    issueCount: issues.length,
    issues,
  };
}

function markdown(report) {
  return [
    "# First Reviewer SourceFitNotes Card Negative Cases",
    "",
    "This gate mutates a simulated copy of the blank SourceFitNotes card pack and proves unsafe card states are rejected.",
    "It does not fill the real card pack, create reviewer notes, confirm source use, approve lessons, publish learner-facing content, or authorize write mode.",
    "",
    "## Summary",
    "",
    `- Negative cases ready: ${report.negativeCasesReady}`,
    `- Negative cases: ${report.negativeCases}`,
    `- Passed cases: ${report.passedCases}`,
    `- Failed cases: ${report.failedCases}`,
    `- Real card pack blank fields: ${report.realBlankFields}`,
    `- Real card pack filled fields: ${report.realFilledFields}`,
    `- Green refs checked: ${report.greenRefsChecked}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Write allowed now: ${report.writeAllowedNow}`,
    `- Confirmed decisions: ${report.confirmedDecisions}`,
    `- Approval review candidates: ${report.approvalReviewCandidates}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Negative Cases",
    "",
    "| Case | Expected issue | Passed | Detected issues |",
    "| --- | --- | --- | --- |",
    ...report.caseRows.map((row) => `| ${row.name} | ${row.expectedIssue} | ${row.passed} | ${row.issues.join(", ").replaceAll("|", "/")} |`),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const [
  sourceFitNotesCardPack,
  sourceFitDecisionSummary,
  sourceFitNotesAcceptance,
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.sourceFitNotesCardPack),
  readJson(paths.sourceFitDecisionSummary),
  readJson(paths.sourceFitNotesAcceptance),
  readJson(paths.dryRunPacket),
  readJson(paths.progressDashboard),
  readJson(paths.humanExecutionBundle),
  exists(realStatusPath),
]);

for (const [label, record] of Object.entries({
  sourceFitNotesCardPack,
  sourceFitDecisionSummary,
  sourceFitNotesAcceptance,
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
})) {
  assertEnvelope(record, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; card negative cases must stay pre-write`);
if (sourceFitNotesCardPack.cardPackReady !== true || sourceFitNotesCardPack.blankCards !== 5) fail("sourceFitNotes card pack must stay ready with 5 cards");
if (sourceFitNotesCardPack.blankFields !== 35 || sourceFitNotesCardPack.filledFields !== 0) fail("real sourceFitNotes card pack must keep 35 blank fields and 0 filled fields");
if (sourceFitNotesCardPack.confirmedDecisions !== 0 || sourceFitNotesCardPack.approvalReviewCandidates !== 0 || sourceFitNotesCardPack.writeAllowedNow !== false) fail("real sourceFitNotes card pack must stay blank and write-blocked");
if (sourceFitDecisionSummary.confirmedDecisions !== 0 || sourceFitDecisionSummary.writeAllowedNow !== false) fail("source-fit decision summary must stay blank and write-blocked");
if (sourceFitNotesAcceptance.confirmedDecisions !== 0 || sourceFitNotesAcceptance.acceptanceGateReady !== true) fail("sourceFitNotes acceptance must stay future-only");

const greenRefs = sourceFitNotesCardPack.cards.flatMap((card) => card.sourceRefsToInspect ?? []);
if (greenRefs.length !== 8) fail("sourceFitNotes card pack must keep 8 source refs");
for (const ref of greenRefs) {
  if (!allowedGreenTiers.has(ref.sourceUseTier)) fail(`${ref.sourceId} is not an allowed green source tier`);
}

const unsafeReadyPack = clone(sourceFitNotesCardPack);
unsafeReadyPack.approvalStatus = "approved";
unsafeReadyPack.learnerFacingRelease = true;

const nonGreenPack = clone(sourceFitNotesCardPack);
const nonGreenSourceId = nonGreenPack.cards[0].sourceRefsToInspect[0].sourceId ?? "unknown";
nonGreenPack.cards[0].sourceRefsToInspect[0].sourceUseTier = "yellow_metadata_citation_only";

const commercialPack = clone(sourceFitNotesCardPack);
commercialPack.commercialReadyPromotions = 1;

const brokerPack = mutateField(sourceFitNotesCardPack, "rewriteAction", "Connect broker order automation for real money after source check.");

const caseRows = [
  caseRow("prefilled_decision_field_rejected", mutateField(sourceFitNotesCardPack, "decision", "confirm_direct_evidence_after_human_review"), "prefilled_field:decision"),
  caseRow("prefilled_source_role_field_rejected", mutateField(sourceFitNotesCardPack, "sourceRole", "direct evidence"), "prefilled_field:sourceRole"),
  caseRow("prefilled_claim_supported_field_rejected", mutateField(sourceFitNotesCardPack, "claimSupported", "claim is supported"), "prefilled_field:claimSupported"),
  caseRow("prefilled_rewrite_action_field_rejected", mutateField(sourceFitNotesCardPack, "rewriteAction", "keep as-is"), "prefilled_field:rewriteAction"),
  caseRow("prefilled_source_identity_basis_field_rejected", mutateField(sourceFitNotesCardPack, "sourceIdentityBasis", "source title checked"), "prefilled_field:sourceIdentityBasis"),
  caseRow("prefilled_no_copy_originality_check_field_rejected", mutateField(sourceFitNotesCardPack, "noCopyOriginalityCheck", "ok"), "prefilled_field:noCopyOriginalityCheck"),
  caseRow("prefilled_reviewer_initials_field_rejected", mutateField(sourceFitNotesCardPack, "reviewerInitials", "AI"), "prefilled_field:reviewerInitials"),
  caseRow("approval_readiness_wording_rejected", mutateField(sourceFitNotesCardPack, "decision", "approved for learner-facing launch ready commercial_ready use"), "approval_readiness_wording"),
  caseRow("trading_signal_wording_rejected", mutateField(sourceFitNotesCardPack, "claimSupported", "this proves an entry signal and exit plan"), "trading_or_real_money_wording"),
  caseRow("copied_source_body_instruction_rejected", mutateField(sourceFitNotesCardPack, "rewriteAction", "paste source verbatim as external body text"), "copied_source_body_instruction"),
  caseRow("macro_or_regulatory_as_chart_proof_rejected", mutateField(sourceFitNotesCardPack, "sourceRole", "SEC source proves the chart-pattern proof and confirms liquidity sweep"), "macro_or_regulatory_as_chart_proof"),
  caseRow("yellow_red_research_only_source_rejected", nonGreenPack, `non_green_source_ref:${nonGreenSourceId}`),
  caseRow("commercial_ready_promotion_rejected", commercialPack, "commercial_ready_promotion_drift"),
  caseRow("real_money_or_broker_workflow_rejected", brokerPack, "trading_or_real_money_wording"),
  caseRow("approval_state_drift_rejected", unsafeReadyPack, "learner_facing_release_drift"),
];

const failedCases = caseRows.filter((row) => !row.passed);
if (failedCases.length) fail(`sourceFitNotes card negative cases failed: ${failedCases.map((row) => row.name).join(", ")}`);

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  negativeCasesReady: true,
  gateMode: "simulated_card_pack_mutation_guard_pre_write_only",
  realStatusPath,
  realStatusOverlayPresent,
  negativeCases: caseRows.length,
  passedCases: caseRows.filter((row) => row.passed).length,
  failedCases: failedCases.length,
  caseRows,
  realBlankFields: sourceFitNotesCardPack.blankFields,
  realFilledFields: sourceFitNotesCardPack.filledFields,
  greenRefsChecked: greenRefs.length,
  sourceFamilies: sourceFitNotesCardPack.families,
  confirmedDecisions: 0,
  approvalReviewCandidates: 0,
  commercialReadyPromotions: 0,
  writeAllowedNow: false,
  manualDecisionRequired: true,
  humanAuthorizationRecorded: false,
  sourceReports: paths,
  boundary: "This negative-case gate mutates only simulated copies of the SourceFitNotes card pack. It does not alter the real blank card pack, create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, confirm source use, approve lessons, publish learner-facing content, promote grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, or allow yellow/red/research_only sources into learner-facing evidence.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  negativeCasesReady: report.negativeCasesReady,
  negativeCases: report.negativeCases,
  passedCases: report.passedCases,
  failedCases: report.failedCases,
  realFilledFields: report.realFilledFields,
  greenRefsChecked: report.greenRefsChecked,
  writeAllowedNow: report.writeAllowedNow,
  outputJson,
  outputMd,
}, null, 2));
