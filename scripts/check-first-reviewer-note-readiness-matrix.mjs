import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_NOTE_READINESS_MATRIX.json";
const outputMd = "docs/FIRST_REVIEWER_NOTE_READINESS_MATRIX.md";

const paths = {
  noteStarter: "docs/FIRST_REVIEWER_HUMAN_NOTE_STARTER_TEMPLATE.json",
  sourceRoleDecisionTable: "docs/FIRST_REVIEWER_SOURCE_ROLE_DECISION_TABLE.json",
  progressDashboard: "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.json",
  creationChecklist: "docs/FIRST_REVIEWER_REAL_OVERLAY_CREATION_CHECKLIST.json",
  noteQualityLint: "docs/REVIEWER_NOTE_QUALITY_LINT.json",
};

const FIELD_READINESS = {
  originalRewriteNotes: {
    readyWhen: "Reviewer has decided the original education rewrite angle and confirmed it remains structural_draft.",
    blocker: "No real human rewrite-angle decision exists yet.",
  },
  sourceFitNotes: {
    readyWhen: "Reviewer has confirmed each source family as direct evidence, boundary-only context, or unsuitable.",
    blocker: "Source roles are still prompts and require human confirmation.",
  },
  factCheckNotes: {
    readyWhen: "Reviewer has checked claims against source metadata and marked unresolved claims to remove.",
    blocker: "No real fact-check pass exists yet.",
  },
  boundaryCheckNotes: {
    readyWhen: "Reviewer has checked no advice, signal, performance, broker/order, automation, production, or real-money wording.",
    blocker: "No real safety-boundary pass exists yet.",
  },
  copyingRiskNotes: {
    readyWhen: "Reviewer has checked notes and rewrite prose for no copied external source body text.",
    blocker: "No real copying-risk pass exists yet.",
  },
  humanReviewerInitials: {
    readyWhen: "Reviewer has actually completed the required review work for the lesson.",
    blocker: "Human initials must remain blank until real review work is complete.",
  },
};

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

function markdown(report) {
  const lines = [
    "# First Reviewer Note Readiness Matrix",
    "",
    "This matrix expands the first reviewer note starter into per-lesson required note fields.",
    "It is a readiness checklist only; it does not fill notes, approve lessons, publish content, or create the real status overlay.",
    "",
    "## Summary",
    "",
    `- Target batches: ${report.targetBatches.join(", ")}`,
    `- Lesson cards: ${report.lessonCards}`,
    `- Required note fields: ${report.requiredNoteFields}`,
    `- Matrix rows: ${report.matrixRows}`,
    `- Blank note fields: ${report.blankNoteFields}`,
    `- Prefilled note fields: ${report.prefilledNoteFields}`,
    `- Direct candidates to confirm: ${report.directCandidatesToConfirm}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Creation allowed now: ${report.creationAllowedNow}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Field Rules",
    "",
    ...report.fieldRules.map((rule) => `- \`${rule.field}\`: ${rule.readyWhen} Current blocker: ${rule.blocker}`),
    "",
    "## Matrix",
    "",
  ];

  for (const row of report.rows) {
    lines.push(
      `- ${row.batchId} / ${row.lessonId} / \`${row.field}\`: ${row.status} - ${row.readyWhen} Blocker: ${row.currentBlocker}`
    );
  }

  lines.push(
    "",
    "## Stop Conditions",
    "",
    ...report.stopConditions.map((condition) => `- ${condition}`),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  );

  return lines.join("\n");
}

const [
  noteStarter,
  sourceRoleDecisionTable,
  progressDashboard,
  creationChecklist,
  noteQualityLint,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.noteStarter),
  readJson(paths.sourceRoleDecisionTable),
  readJson(paths.progressDashboard),
  readJson(paths.creationChecklist),
  readJson(paths.noteQualityLint),
  exists(realStatusPath),
]);

for (const [label, report] of Object.entries({
  noteStarter,
  sourceRoleDecisionTable,
  progressDashboard,
  creationChecklist,
  noteQualityLint,
})) {
  assertEnvelope(report, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; readiness matrix must not require real notes`);
if (noteStarter.realStatusOverlayPresent !== false || noteStarter.blankNoteFields !== 72) fail("note starter must keep 72 blank fields and no real overlay");
if (creationChecklist.creationAllowedNow !== false || creationChecklist.realStatusOverlayPresent !== false) fail("creation checklist must keep real overlay creation blocked");
if (progressDashboard.realStatusOverlayPresent !== false || progressDashboard.realReadyBatches !== 0 || progressDashboard.realNoteIssues !== 0) fail("progress dashboard must show no real ready batches or note issues");
if (noteQualityLint.realStatusOverlayPresent !== false || noteQualityLint.realNoteIssues !== 0) fail("note quality lint must show no real notes");
if (sourceRoleDecisionTable.lessonRows.length !== 12) fail("source-role table must cover 12 first-reviewer lessons");

const sourceRoleByLesson = new Map(sourceRoleDecisionTable.lessonRows.map((row) => [row.lessonId, row]));
const rows = [];
let lessonCards = 0;
let prefilledNoteFields = 0;
const requiredFieldSet = new Set();

for (const batch of noteStarter.batches) {
  assertEnvelope(batch, `note starter batch ${batch.batchId}`);
  if (batch.reviewStatus !== "not_started") fail(`${batch.batchId} must remain not_started`);
  for (const card of batch.lessonCards) {
    lessonCards += 1;
    if (card.trackingStatus !== "not_started") fail(`${card.lessonId} must remain not_started`);
    if (card.mustRemainStructuralDraft !== true) fail(`${card.lessonId} must remain structural draft`);
    if (!sourceRoleByLesson.has(card.lessonId)) fail(`${card.lessonId} missing from source-role decision table`);
    for (const field of card.blankFields) {
      requiredFieldSet.add(field);
      const guidance = card.noteGuidance[field];
      if (!guidance) fail(`${card.lessonId}.${field} missing note guidance`);
      if (guidance.value !== "") {
        prefilledNoteFields += 1;
      }
      if (!FIELD_READINESS[field]) fail(`${field} missing readiness rule`);
      rows.push({
        batchId: batch.batchId,
        lessonId: card.lessonId,
        riskLevel: card.riskLevel,
        field,
        status: "blocked_until_real_human_review",
        readyWhen: FIELD_READINESS[field].readyWhen,
        currentBlocker: FIELD_READINESS[field].blocker,
        prompt: guidance.prompt,
        mustMention: guidance.mustMention || [],
        roleHintFamilies: (card.roleHints || []).map((hint) => hint.family),
        directCandidatesToConfirm: guidance.directCandidatesToConfirm || [],
        disallowedNoteContent: card.disallowedNoteContent,
      });
    }
  }
}

if (lessonCards !== 12) fail(`expected 12 lesson cards, found ${lessonCards}`);
if (rows.length !== 72) fail(`expected 72 matrix rows, found ${rows.length}`);
if (prefilledNoteFields !== 0) fail(`expected 0 prefilled note fields, found ${prefilledNoteFields}`);
if (requiredFieldSet.size !== 6) fail(`expected 6 required note fields, found ${requiredFieldSet.size}`);
if (sourceRoleDecisionTable.directCandidatesNeedingConfirmation !== noteStarter.directCandidatesToConfirm) fail("direct candidates mismatch between source-role table and note starter");

const fieldRules = Object.entries(FIELD_READINESS).map(([field, rule]) => ({
  field,
  ...rule,
}));

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  targetBatches: noteStarter.targetBatches,
  lessonCards,
  requiredNoteFields: requiredFieldSet.size,
  matrixRows: rows.length,
  blankNoteFields: noteStarter.blankNoteFields,
  prefilledNoteFields,
  directCandidatesToConfirm: noteStarter.directCandidatesToConfirm,
  realStatusPath,
  realStatusOverlayPresent,
  creationAllowedNow: creationChecklist.creationAllowedNow,
  fieldRules,
  rows,
  stopConditions: [
    "Stop if any required note field is prefilled before real human review.",
    "Stop if docs/LESSON_BATCH_REVIEW_STATUS.json appears without explicit human note-taking.",
    "Stop if any field asks for approval, release, commercial_ready, production readiness, or grade promotion.",
    "Stop if any note suggests buy/sell/hold advice, trading signals, broker/order workflow, automation, performance claims, or real-money guidance.",
    "Stop if any note copies external source body text.",
    "Stop if yellow, red, or research_only sources are proposed as learner-facing evidence.",
  ],
  sourceReports: paths,
  boundary: "This matrix is reviewer-facing note readiness scaffolding only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, approve lessons, publish learner-facing content, change lesson grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  targetBatches: report.targetBatches,
  lessonCards: report.lessonCards,
  requiredNoteFields: report.requiredNoteFields,
  matrixRows: report.matrixRows,
  blankNoteFields: report.blankNoteFields,
  prefilledNoteFields: report.prefilledNoteFields,
  directCandidatesToConfirm: report.directCandidatesToConfirm,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  creationAllowedNow: report.creationAllowedNow,
  outputJson,
  outputMd,
}, null, 2));
