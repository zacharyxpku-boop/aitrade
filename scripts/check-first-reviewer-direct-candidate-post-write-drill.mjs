import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const READY_STATUS = "ready_for_separate_human_approval_review";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const draftPath = "docs/LESSON_BATCH_REVIEW_STATUS_DRAFT_TEMPLATE_FOR_BATCH_01_05.json";
const directCandidateWorksheetPath = "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_DECISION_WORKSHEET.json";
const sourceFitAcceptancePath = "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_ACCEPTANCE.json";
const postWriteApprovalDrillPath = "docs/FIRST_REVIEWER_POST_WRITE_APPROVAL_DRILL.json";
const outputJson = "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_POST_WRITE_DRILL.json";
const outputMd = "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_POST_WRITE_DRILL.md";

const REQUIRED_NOTE_FIELDS = [
  "originalRewriteNotes",
  "sourceFitNotes",
  "factCheckNotes",
  "boundaryCheckNotes",
  "copyingRiskNotes",
  "humanReviewerInitials",
];

const ALLOWED_DECISIONS = [
  "confirm_direct_evidence_after_human_review",
  "downgrade_to_boundary_only",
  "blocked_needs_rewrite_or_source_replacement",
];

function fail(message) {
  throw new Error(message);
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function exists(filePath) {
  return fs.access(filePath).then(() => true, () => false);
}

function assertEnvelope(record, label) {
  if (record.educationOnly !== true) fail(`${label} must keep educationOnly true`);
  if (record.productionReady !== false) fail(`${label} must keep productionReady false`);
  if (record.learnerFacingRelease !== false) fail(`${label} cannot be learner-facing release`);
  if (record.approvalStatus !== "not_approved") fail(`${label} must stay not_approved`);
  if (record.expectedOutcome !== EXPECTED_OUTCOME) fail(`${label} expectedOutcome changed`);
}

function validateSourceFitNote(note, row) {
  const issues = [];
  const text = String(note || "");
  const lower = text.toLowerCase();
  const context = `${row.batchId}.${row.lessonId}.${row.family}`;
  if (!text.trim()) issues.push(`${context} sourceFitNotes is blank`);
  if (text.trim().length < 180) issues.push(`${context} sourceFitNotes is too short for post-write direct-candidate review`);
  if (!ALLOWED_DECISIONS.some((value) => lower.includes(value))) issues.push(`${context} lacks an allowed decision value`);
  for (const anchor of ["decision:", "source role:", "claim:", "rewrite action:", "source ids:"]) {
    if (!lower.includes(anchor)) issues.push(`${context} lacks ${anchor}`);
  }
  if (!lower.includes(row.family.toLowerCase())) issues.push(`${context} does not name the source family`);
  if (!/downgrade|boundary|blocked|confirm/.test(lower)) issues.push(`${context} lacks decision/action wording`);
  if (/chart-pattern proof|chart proof|signal support|entry\/exit proof|market direction proof|trading setup validator/.test(lower)) {
    issues.push(`${context} misuses source as chart or signal evidence`);
  }
  if (/approved|approval|learner-facing|launch ready|commercial_ready|commercial ready|productionready|production ready/.test(lower)) {
    issues.push(`${context} contains approval/readiness wording`);
  }
  if (/buy|sell|hold|entry signal|exit signal|win rate|profit|return|broker|order workflow|automation|real money|real-money/.test(lower)) {
    issues.push(`${context} contains trading or real-money wording`);
  }
  if (/copy this|quoted from|verbatim|paste source|external body text/.test(lower)) {
    issues.push(`${context} contains copying-risk wording`);
  }
  return issues;
}

function safeDecisionNote(row) {
  const refs = row.sourceRefsToInspect.map((ref) => ref.sourceId).join(", ");
  return [
    "decision: downgrade_to_boundary_only.",
    `source role: ${row.family} ${row.defaultRole}; source ids: ${refs}; source titles and metadata were checked only for boundary/source-literacy context.`,
    `claim: this source family does not directly prove the lesson's chart or price-action claim, so it must not be used as tactical evidence.`,
    "rewrite action: keep the lesson structural_draft, rewrite the source mention as macro-data, filing, fraud, oversight, or source-boundary context only, and do not copy external source body text.",
  ].join(" ");
}

function negativeCase(name, row, note, expectedPattern) {
  const issues = validateSourceFitNote(note, row);
  return {
    name,
    expectedFailure: true,
    passed: issues.some((issue) => expectedPattern.test(issue)),
    issueCount: issues.length,
    message: issues.join("; ") || "negative case unexpectedly passed",
  };
}

function completeCard(card, notesByLesson) {
  const sourceFitNotes = notesByLesson.get(card.lessonId)
    || "decision: downgrade_to_boundary_only. source role: no direct-candidate row for this card. claim: generic first-reviewer drill card stays boundary-only. rewrite action: keep structural_draft and do not copy external source body text.";
  return {
    ...card,
    trackingStatus: READY_STATUS,
    originalRewriteNotes: `DIRECT-CANDIDATE DRILL ONLY: original rewrite checked for ${card.lessonId}; no external source text copied.`,
    sourceFitNotes,
    factCheckNotes: `DIRECT-CANDIDATE DRILL ONLY: factual claims for ${card.lessonId} stay limited to green-source metadata and reviewer-visible source roles.`,
    boundaryCheckNotes: "DIRECT-CANDIDATE DRILL ONLY: no advice, signal, performance claim, broker/order workflow, automation, or real-money guidance.",
    copyingRiskNotes: "DIRECT-CANDIDATE DRILL ONLY: no source body text copied; wording remains original reviewer prose.",
    humanReviewerInitials: "QA_DIRECT",
    mustRemainStructuralDraft: true,
  };
}

function markdown(report) {
  return [
    "# First Reviewer Direct Candidate Post-Write Drill",
    "",
    "This drill validates the five BEA/BLS/CFTC/SEC direct-candidate source roles in a temporary post-write state.",
    "It proves candidate sourceFitNotes can express confirm/downgrade/block decisions without turning macro, filing, fraud, or oversight sources into chart-pattern proof, trading signals, release evidence, or grade promotion.",
    "",
    "## Summary",
    "",
    `- Drill ready: ${report.drillReady}`,
    `- Direct candidate rows: ${report.directCandidateRows}`,
    `- Families: ${report.families.join(", ")}`,
    `- Green refs inspected: ${report.greenRefsInspected}`,
    `- Safe decision notes passed: ${report.safeDecisionNotesPassed}/${report.safeDecisionNotes}`,
    `- Negative cases passed: ${report.negativeCasesPassed}/${report.negativeCases}`,
    `- Temporary overlay cards: ${report.temporaryOverlayCards}`,
    `- Real status overlay touched: ${report.realStatusOverlayTouched}`,
    `- Confirmed decisions: ${report.confirmedDecisions}`,
    `- Downgraded decisions: ${report.downgradedDecisions}`,
    `- Blocked decisions: ${report.blockedDecisions}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Candidate Rows",
    "",
    "| Lesson | Family | Decision | Refs | Role boundary |",
    "| --- | --- | --- | --- | --- |",
    ...report.candidateRows.map((row) => `| ${row.lessonId} | ${row.family} | ${row.decision} | ${row.sourceRefsToInspectCount} | ${row.roleBoundary} |`),
    "",
    "## Negative Cases",
    "",
    "| Case | Passed | Issues |",
    "| --- | --- | --- |",
    ...report.negativeCaseRows.map((row) => `| ${row.name} | ${row.passed} | ${row.message.replaceAll("|", "/")} |`),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const realBefore = await exists(realStatusPath);
const [draft, worksheet, sourceFitAcceptance, postWriteApprovalDrill] = await Promise.all([
  readJson(draftPath),
  readJson(directCandidateWorksheetPath),
  readJson(sourceFitAcceptancePath),
  readJson(postWriteApprovalDrillPath),
]);

for (const [label, record] of Object.entries({
  draft,
  worksheet,
  sourceFitAcceptance,
  postWriteApprovalDrill,
})) {
  assertEnvelope(record, label);
}

if (worksheet.decisionRows.length !== 5) fail("direct candidate worksheet must expose 5 rows");
if (sourceFitAcceptance.positiveControlsPassed !== sourceFitAcceptance.positiveControls) fail("sourceFitNotes acceptance positive controls must pass before drill");
if (sourceFitAcceptance.negativeCasesPassed !== sourceFitAcceptance.negativeCases) fail("sourceFitNotes acceptance negative cases must pass before drill");
if (postWriteApprovalDrill.drillReady !== true || postWriteApprovalDrill.realStatusOverlayTouched !== false) fail("post-write approval drill must pass before direct-candidate drill");

const notesByLesson = new Map();
const candidateRows = [];
let greenRefsInspected = 0;
for (const row of worksheet.decisionRows) {
  if (row.decisionWriteTarget !== "sourceFitNotes") fail(`${row.lessonId}/${row.family} must write to sourceFitNotes`);
  if (!row.allowedDecisionValues.every((value) => ALLOWED_DECISIONS.includes(value))) fail(`${row.lessonId}/${row.family} has unexpected allowed decisions`);
  if (row.mustRemainStructuralDraft !== true || row.learnerFacingUseAllowedNow !== false || row.approvalAllowedNow !== false) {
    fail(`${row.lessonId}/${row.family} must remain structural draft, non-learner-facing, and unapproved`);
  }
  for (const ref of row.sourceRefsToInspect) {
    if (ref.sourceUseTier !== "green_official_public_domain" && ref.sourceUseTier !== "green_public_domain_classic") fail(`${row.lessonId}/${row.family}/${ref.sourceId} is not green tier`);
    greenRefsInspected += 1;
  }
  const note = safeDecisionNote(row);
  const issues = validateSourceFitNote(note, row);
  if (issues.length) fail(`safe decision note failed for ${row.lessonId}/${row.family}: ${issues.join("; ")}`);
  const prior = notesByLesson.get(row.lessonId);
  notesByLesson.set(row.lessonId, prior ? `${prior} ${note}` : note);
  candidateRows.push({
    lessonId: row.lessonId,
    batchId: row.batchId,
    family: row.family,
    decision: "downgrade_to_boundary_only",
    sourceRefsToInspectCount: row.sourceRefsToInspectCount,
    roleBoundary: "boundary_or_source_literacy_only_not_chart_proof",
  });
}

const sampleRow = worksheet.decisionRows[0];
const negativeCaseRows = [
  negativeCase("missing_allowed_decision_rejected", sampleRow, "source role: CFTC boundary. claim: checked metadata. rewrite action: keep source context.", /allowed decision/),
  negativeCase("chart_proof_misuse_rejected", sampleRow, `${safeDecisionNote(sampleRow)} This is chart-pattern proof.`, /chart or signal/),
  negativeCase("signal_support_rejected", sampleRow, `${safeDecisionNote(sampleRow)} This is signal support for entries.`, /chart or signal|trading/),
  negativeCase("approval_wording_rejected", sampleRow, `${safeDecisionNote(sampleRow)} Approved for learner-facing release.`, /approval\/readiness/),
  negativeCase("commercial_ready_rejected", sampleRow, `${safeDecisionNote(sampleRow)} Promote to commercial_ready.`, /approval\/readiness/),
  negativeCase("copied_source_text_rejected", sampleRow, `${safeDecisionNote(sampleRow)} Paste source verbatim into the lesson.`, /copying-risk/),
  negativeCase("real_money_wording_rejected", sampleRow, `${safeDecisionNote(sampleRow)} Use this for real money trading decisions.`, /trading|real-money/),
  negativeCase("too_short_confirmation_rejected", sampleRow, "decision: confirm_direct_evidence_after_human_review.", /too short/),
];
const failedNegative = negativeCaseRows.filter((row) => !row.passed);
if (failedNegative.length) fail(`direct-candidate negative cases failed: ${failedNegative.map((row) => row.name).join(", ")}`);

const overlay = {
  ...draft,
  purpose: "Temporary direct-candidate post-write drill. Not real reviewer evidence.",
  batches: draft.batches.map((batch) => ({
    ...batch,
    reviewStatus: READY_STATUS,
    lessonCards: batch.lessonCards.map((card) => completeCard(card, notesByLesson)),
  })),
};
assertEnvelope(overlay, "temporary direct-candidate overlay");

let temporaryOverlayCards = 0;
for (const batch of overlay.batches) {
  assertEnvelope(batch, `temporary direct-candidate overlay ${batch.batchId}`);
  for (const card of batch.lessonCards) {
    temporaryOverlayCards += 1;
    if (card.trackingStatus !== READY_STATUS || card.mustRemainStructuralDraft !== true) fail(`${card.lessonId} must stay ready structural draft in temporary drill`);
    for (const field of REQUIRED_NOTE_FIELDS) {
      if (!card[field]) fail(`${card.lessonId}.${field} must be filled in temporary drill`);
    }
  }
}

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "tradegym-direct-candidate-drill-"));
try {
  await fs.writeFile(path.join(tempRoot, "LESSON_BATCH_REVIEW_STATUS.json"), `${JSON.stringify(overlay, null, 2)}\n`, "utf8");
} finally {
  await fs.rm(tempRoot, { recursive: true, force: true });
}

const realAfter = await exists(realStatusPath);
const realStatusOverlayTouched = realBefore !== realAfter || realAfter === true;
if (realStatusOverlayTouched) fail("direct-candidate post-write drill touched real status overlay");

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  drillReady: true,
  drillMode: "temporary_direct_candidate_sourceFitNotes_boundary_drill",
  realStatusPath,
  realStatusOverlayTouched,
  directCandidateRows: worksheet.decisionRows.length,
  families: worksheet.families,
  greenRefsInspected,
  safeDecisionNotes: candidateRows.length,
  safeDecisionNotesPassed: candidateRows.length,
  negativeCases: negativeCaseRows.length,
  negativeCasesPassed: negativeCaseRows.filter((row) => row.passed).length,
  negativeCaseRows,
  temporaryOverlayCards,
  confirmedDecisions: 0,
  downgradedDecisions: candidateRows.length,
  blockedDecisions: 0,
  candidateRows,
  allowedDecisionValues: ALLOWED_DECISIONS,
  sourceReports: {
    directCandidateWorksheet: directCandidateWorksheetPath,
    sourceFitAcceptance: sourceFitAcceptancePath,
    postWriteApprovalDrill: postWriteApprovalDrillPath,
  },
  boundary: "This direct-candidate post-write drill uses temporary files only. It does not create real reviewer notes, confirm source use, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, launch the course, or make the product production-ready.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  drillReady: report.drillReady,
  directCandidateRows: report.directCandidateRows,
  families: report.families,
  greenRefsInspected: report.greenRefsInspected,
  safeDecisionNotesPassed: report.safeDecisionNotesPassed,
  safeDecisionNotes: report.safeDecisionNotes,
  negativeCasesPassed: report.negativeCasesPassed,
  negativeCases: report.negativeCases,
  downgradedDecisions: report.downgradedDecisions,
  temporaryOverlayCards: report.temporaryOverlayCards,
  realStatusOverlayTouched: report.realStatusOverlayTouched,
  outputJson,
  outputMd,
}, null, 2));
