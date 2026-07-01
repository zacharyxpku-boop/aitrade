import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_POSITIVE_MATRIX.json";
const outputMd = "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_POSITIVE_MATRIX.md";

const paths = {
  sourceFitDecisionSummary: "docs/FIRST_REVIEWER_SOURCE_FIT_DECISION_SUMMARY.json",
  sourceFitNotesCardPack: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_PACK.json",
  sourceFitNotesCardNegativeCases: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_NEGATIVE_CASES.json",
  sourceFitNotesAcceptance: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_ACCEPTANCE.json",
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

function validateSampleNote(note, decisionValue) {
  const issues = [];
  const text = String(note || "");
  const lower = text.toLowerCase();
  for (const anchor of ["decision:", "source role:", "claim:", "rewrite action:", "source identity basis:", "no-copy originality check:"]) {
    if (!lower.includes(anchor)) issues.push(`missing_${anchor.replace(/[^a-z]/g, "_")}`);
  }
  if (!lower.includes(decisionValue)) issues.push("missing_expected_decision");
  if (!allowedDecisionValues.some((value) => lower.includes(value))) issues.push("missing_allowed_decision");
  if (text.trim().length < 180) issues.push("sample_too_short");
  if (!/source id|metadata|title|document role|release table|filing metadata/i.test(text)) issues.push("missing_source_identity_basis");
  if (!/structural_draft|boundary-only|rewrite|block/i.test(text)) issues.push("missing_structural_draft_or_rewrite_boundary");
  if (/approved|approval|learner-facing|launch ready|commercial_ready|commercial ready|productionReady|production ready/i.test(text)) issues.push("approval_readiness_wording");
  if (/buy|sell|hold|entry|exit|signal|win rate|profit|return|broker|order|automation|real money|real-money/i.test(text)) issues.push("trading_or_real_money_wording");
  if (/copy this|quoted from|verbatim|paste source|external body text/i.test(text)) issues.push("copied_source_body_instruction");
  return issues;
}

function sampleNote({ decisionValue, sourceFamily, sourceRole, claim, rewriteAction, sourceIdentityBasis }) {
  return [
    `decision: ${decisionValue}.`,
    `source role: ${sourceFamily} is treated as ${sourceRole} after a human checks the source title, metadata, and document role.`,
    `claim: ${claim}`,
    `rewrite action: ${rewriteAction} Keep the lesson as structural_draft until separate human review is complete.`,
    `source identity basis: ${sourceIdentityBasis}`,
    "no-copy originality check: write original reviewer prose only; do not copy external source body text into notes or lesson copy.",
  ].join(" ");
}

function markdown(report) {
  return [
    "# First Reviewer SourceFitNotes Positive Matrix",
    "",
    "This sample-only matrix shows the acceptable shape of future human `sourceFitNotes` for the three allowed decisions.",
    "It is not real reviewer evidence, source confirmation, approval, release, commercial readiness, or production readiness.",
    "",
    "## Summary",
    "",
    `- Matrix ready: ${report.matrixReady}`,
    `- Sample only: ${report.sampleOnly}`,
    `- Decision samples: ${report.decisionSamples}`,
    `- Passed samples: ${report.passedSamples}`,
    `- Failed samples: ${report.failedSamples}`,
    `- Source refs checked: ${report.sourceRefsChecked}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Confirmed decisions: ${report.confirmedDecisions}`,
    `- Approval review candidates: ${report.approvalReviewCandidates}`,
    `- Write allowed now: ${report.writeAllowedNow}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Decision Samples",
    "",
    "| Decision | Family | Intended use | Passed | Issues |",
    "| --- | --- | --- | --- | --- |",
    ...report.sampleRows.map((row) => `| ${row.decisionValue} | ${row.sourceFamily} | ${row.intendedUse} | ${row.passed} | ${row.issues.join(", ") || "none"} |`),
    "",
    "## Sample Notes",
    "",
    ...report.sampleRows.flatMap((row) => [
      `### ${row.decisionValue} / ${row.sourceFamily}`,
      "",
      row.note,
      "",
    ]),
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const [
  sourceFitDecisionSummary,
  sourceFitNotesCardPack,
  sourceFitNotesCardNegativeCases,
  sourceFitNotesAcceptance,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.sourceFitDecisionSummary),
  readJson(paths.sourceFitNotesCardPack),
  readJson(paths.sourceFitNotesCardNegativeCases),
  readJson(paths.sourceFitNotesAcceptance),
  exists(realStatusPath),
]);

for (const [label, record] of Object.entries({
  sourceFitDecisionSummary,
  sourceFitNotesCardPack,
  sourceFitNotesCardNegativeCases,
  sourceFitNotesAcceptance,
})) {
  assertEnvelope(record, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; positive matrix must stay pre-write`);
if (sourceFitDecisionSummary.decisionRows.length !== 5 || sourceFitDecisionSummary.confirmedDecisions !== 0 || sourceFitDecisionSummary.writeAllowedNow !== false) fail("source-fit decision summary must stay blank and write-blocked");
if (sourceFitNotesCardPack.blankCards !== 5 || sourceFitNotesCardPack.filledFields !== 0 || sourceFitNotesCardPack.writeAllowedNow !== false) fail("card pack must stay blank and write-blocked");
if (sourceFitNotesCardNegativeCases.failedCases !== 0 || sourceFitNotesCardNegativeCases.passedCases !== sourceFitNotesCardNegativeCases.negativeCases) fail("card negative cases must all pass before positive matrix");
if (sourceFitNotesAcceptance.confirmedDecisions !== 0 || sourceFitNotesAcceptance.approvalReviewCandidates !== 0) fail("acceptance gate cannot confirm decisions before real notes");

const summaryRows = sourceFitDecisionSummary.decisionRows;
const sampleRows = [
  {
    decisionValue: "confirm_direct_evidence_after_human_review",
    sourceFamily: "SEC",
    intendedUse: "future direct filing-literacy support only after human source inspection",
    note: sampleNote({
      decisionValue: "confirm_direct_evidence_after_human_review",
      sourceFamily: "SEC",
      sourceRole: "direct evidence for filing-literacy mechanics, not chart interpretation",
      claim: "the lesson claim is narrowed to reading filing metadata and event context; no chart outcome or trading action is inferred.",
      rewriteAction: "rewrite the source reference as filing-literacy support and remove any wording that treats the filing as market direction.",
      sourceIdentityBasis: "source id and filing metadata are recorded from the reviewer-inspected SEC document title and metadata.",
    }),
  },
  {
    decisionValue: "downgrade_to_boundary_only",
    sourceFamily: "BLS",
    intendedUse: "macro-data context without direct chart proof",
    note: sampleNote({
      decisionValue: "downgrade_to_boundary_only",
      sourceFamily: "BLS",
      sourceRole: "macro-data context and source-boundary evidence only",
      claim: "the source can explain CPI or employment release context, but it does not directly support a candlestick, liquidity, or pattern claim.",
      rewriteAction: "downgrade the citation to boundary-only context and rewrite the lesson claim so macro data is separated from chart observation.",
      sourceIdentityBasis: "release table title, source id, and metadata are recorded without copying table text.",
    }),
  },
  {
    decisionValue: "blocked_needs_rewrite_or_source_replacement",
    sourceFamily: "CFTC",
    intendedUse: "block when fraud education is being misused as direct pattern evidence",
    note: sampleNote({
      decisionValue: "blocked_needs_rewrite_or_source_replacement",
      sourceFamily: "CFTC",
      sourceRole: "fraud-risk education, unsuitable for direct chart or execution claims",
      claim: "the current lesson claim asks the source to support a pattern-specific market interpretation that this fraud-education source does not support.",
      rewriteAction: "block the source fit until the lesson is rewritten as fraud-risk literacy or a better direct source is selected.",
      sourceIdentityBasis: "document role, title metadata, and source id show investor-protection context rather than technical chart evidence.",
    }),
  },
];

for (const row of sampleRows) {
  row.sourceCandidateRows = summaryRows.filter((summaryRow) => summaryRow.sourceFamily === row.sourceFamily).length;
  row.issues = validateSampleNote(row.note, row.decisionValue);
  row.passed = row.issues.length === 0;
}

const failedSamples = sampleRows.filter((row) => !row.passed);
if (failedSamples.length) fail(`positive sourceFitNotes samples failed: ${failedSamples.map((row) => row.decisionValue).join(", ")}`);

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  matrixReady: true,
  matrixMode: "sample_only_future_sourceFitNotes_positive_shape_matrix",
  sampleOnly: true,
  appliesToRealOverlay: false,
  realStatusPath,
  realStatusOverlayPresent,
  allowedDecisionValues,
  decisionSamples: sampleRows.length,
  passedSamples: sampleRows.filter((row) => row.passed).length,
  failedSamples: failedSamples.length,
  sourceRefsChecked: sourceFitNotesCardPack.sourceRefsToInspect,
  sampleRows,
  confirmedDecisions: 0,
  approvalReviewCandidates: 0,
  commercialReadyPromotions: 0,
  writeAllowedNow: false,
  manualDecisionRequired: true,
  humanAuthorizationRecorded: false,
  sourceReports: paths,
  boundary: "This positive matrix is sample-only reviewer training scaffolding. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, confirm source use, approve lessons, publish learner-facing content, promote grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, or make the product production-ready.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  matrixReady: report.matrixReady,
  sampleOnly: report.sampleOnly,
  decisionSamples: report.decisionSamples,
  passedSamples: report.passedSamples,
  failedSamples: report.failedSamples,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  confirmedDecisions: report.confirmedDecisions,
  approvalReviewCandidates: report.approvalReviewCandidates,
  writeAllowedNow: report.writeAllowedNow,
  outputJson,
  outputMd,
}, null, 2));
