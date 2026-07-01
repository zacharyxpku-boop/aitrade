import fs from "node:fs/promises";

const sourceRolePath = "docs/FIRST_REVIEWER_SOURCE_ROLE_DECISION_TABLE.json";
const draftTemplatePath = "docs/LESSON_BATCH_REVIEW_STATUS_DRAFT_TEMPLATE_FOR_BATCH_01_05.json";
const dryRunPacketPath = "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_HUMAN_NOTE_STARTER_TEMPLATE.json";
const outputMd = "docs/FIRST_REVIEWER_HUMAN_NOTE_STARTER_TEMPLATE.md";
const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const REQUIRED_NOTE_FIELDS = [
  "originalRewriteNotes",
  "sourceFitNotes",
  "factCheckNotes",
  "boundaryCheckNotes",
  "copyingRiskNotes",
  "humanReviewerInitials",
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

function buildNoteGuidance(lesson) {
  const roles = lesson.sourceFamilyRoles || [];
  const direct = roles.filter((role) => role.suggestedRole === "direct_candidate_needs_human_confirmation");
  const boundary = roles.filter((role) => role.suggestedRole !== "direct_candidate_needs_human_confirmation");
  return {
    originalRewriteNotes: {
      value: "",
      prompt: "Describe the original education rewrite angle after source roles are confirmed.",
      mustMention: ["original wording", "observation or education practice", "structural_draft"],
    },
    sourceFitNotes: {
      value: "",
      prompt: "Record human-confirmed direct vs boundary-only roles. Start from the role hints, but do not treat them as approval.",
      roleHints: roles.map((role) => ({
        family: role.family,
        suggestedRole: role.suggestedRole,
        confidence: role.confidence,
        reviewerDecision: role.reviewerDecision,
      })),
      directCandidatesToConfirm: direct.map((role) => role.family),
      boundaryFamiliesToConfirm: boundary.map((role) => role.family),
    },
    factCheckNotes: {
      value: "",
      prompt: "List only metadata-supported claims and unresolved claims to remove; do not invent facts from source titles.",
      mustMention: ["checked claims", "unresolved claims", "removed or retained"],
    },
    boundaryCheckNotes: {
      value: "",
      prompt: "Confirm no advice, signal, performance, broker/order, automation, production, or real-money wording.",
      mustMention: ["education-only", "non-production", "no advice", "no signal", "no real-money guidance"],
    },
    copyingRiskNotes: {
      value: "",
      prompt: "Confirm no external source body text is copied into notes or lesson prose.",
      mustMention: ["no source-body copying", "original wording"],
    },
    humanReviewerInitials: {
      value: "",
      prompt: "Fill only after real human review work is performed.",
      mustMention: ["human initials only"],
    },
  };
}

function renderMarkdown(report) {
  const lines = [
    "# First Reviewer Human Note Starter Template",
    "",
    "This starter maps the source-role decision table into blank reviewer note fields.",
    "It is not completed review, real notes, approval, learner-facing release, or production readiness.",
    "",
    "## Summary",
    "",
    `- Target batches: ${report.targetBatches.join(", ")}`,
    `- Lesson cards: ${report.lessonCards}`,
    `- Blank note fields: ${report.blankNoteFields}`,
    `- Role hints: ${report.roleHints}`,
    `- Direct candidates to confirm: ${report.directCandidatesToConfirm}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Use Rules",
    "",
    ...report.useRules.map((rule) => `- ${rule}`),
    "",
    "## Starter Rows",
    "",
    "| Batch | Lesson | Risk | Role hints | Blank fields |",
    "| --- | --- | --- | ---: | ---: |",
    ...report.batches.flatMap((batch) => batch.lessonCards.map((card) => `| ${batch.batchId} | ${card.lessonId} | ${card.riskLevel} | ${card.roleHints.length} | ${card.blankFields.length} |`)),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ];
  return lines.join("\n");
}

const [sourceRoleTable, draftTemplate, dryRunPacket, realStatusOverlayPresent] = await Promise.all([
  readJson(sourceRolePath),
  readJson(draftTemplatePath),
  readJson(dryRunPacketPath),
  exists(realStatusPath),
]);

assertEnvelope(sourceRoleTable, "source-role decision table");
assertEnvelope(draftTemplate, "first reviewer status draft template");
assertEnvelope(dryRunPacket, "first reviewer dry-run packet");
if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; starter template must not run against real notes`);
if (sourceRoleTable.lessonRows.length !== 12) fail("starter template must cover 12 source-role lesson rows");
if (draftTemplate.notesFilled !== 0) fail("status draft must keep notes blank");
if (dryRunPacket.realStatusOverlayPresent !== false || dryRunPacket.realReadyBatches !== 0) fail("dry-run packet must keep real status absent");

const sourceRows = new Map(sourceRoleTable.lessonRows.map((lesson) => [lesson.lessonId, lesson]));
const batches = draftTemplate.batches.map((batch) => {
  assertEnvelope(batch, `draft batch ${batch.batchId}`);
  return {
    batchId: batch.batchId,
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    expectedOutcome: EXPECTED_OUTCOME,
    reviewStatus: "not_started",
    lessonCards: batch.lessonCards.map((card) => {
      const sourceRow = sourceRows.get(card.lessonId);
      if (!sourceRow) fail(`missing source-role row for ${card.lessonId}`);
      if (card.trackingStatus !== "not_started") fail(`${card.lessonId} draft card must stay not_started`);
      if (card.mustRemainStructuralDraft !== true) fail(`${card.lessonId} must remain structural draft`);
      for (const field of REQUIRED_NOTE_FIELDS) {
        if (card[field] !== "") fail(`${card.lessonId}.${field} must stay blank`);
      }
      const noteGuidance = buildNoteGuidance(sourceRow);
      return {
        lessonId: card.lessonId,
        riskLevel: card.riskLevel,
        trackingStatus: "not_started",
        mustRemainStructuralDraft: true,
        roleHints: sourceRow.sourceFamilyRoles.map((role) => ({
          family: role.family,
          suggestedRole: role.suggestedRole,
          confidence: role.confidence,
          humanDecisionRequired: true,
        })),
        blankFields: REQUIRED_NOTE_FIELDS,
        noteGuidance,
        disallowedNoteContent: [
          "approval or final-ready wording",
          "buy/sell/hold or trading signals",
          "return, win-rate, or backtest-profit claims",
          "broker/order/automation workflow",
          "real-money guidance",
          "copied external source body text",
        ],
      };
    }),
  };
});

const allCards = batches.flatMap((batch) => batch.lessonCards);
const blankNoteFields = allCards.reduce((sum, card) => sum + card.blankFields.length, 0);
const roleHints = allCards.reduce((sum, card) => sum + card.roleHints.length, 0);
const directCandidatesToConfirm = allCards.reduce((sum, card) => sum + card.roleHints.filter((role) => role.suggestedRole === "direct_candidate_needs_human_confirmation").length, 0);
if (blankNoteFields !== 72) fail(`expected 72 blank note fields, got ${blankNoteFields}`);
for (const card of allCards) {
  for (const field of REQUIRED_NOTE_FIELDS) {
    if (card.noteGuidance[field].value !== "") fail(`${card.lessonId}.${field} starter value must stay blank`);
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  targetBatches: draftTemplate.targetBatches,
  sourceRoleTable: sourceRolePath,
  sourceDraftTemplate: draftTemplatePath,
  sourceDryRunPacket: dryRunPacketPath,
  realStatusPath,
  realStatusOverlayPresent,
  lessonCards: allCards.length,
  blankNoteFields,
  roleHints,
  directCandidatesToConfirm,
  useRules: [
    "Use this starter after reading the source-role decision table and before copying any blank overlay into real note-taking.",
    "Every note value starts blank and must be filled only by a human after real review work.",
    "Role hints are prompts, not source-use approval.",
    "Keep approvalStatus:not_approved, learnerFacingRelease:false, productionReady:false, and structural_draft.",
    "Run note-quality lint and completion audit after any real notes are filled.",
  ],
  batches,
  boundary: "This starter template is reviewer-facing scaffolding only. It does not create real reviewer notes, approve lessons or sources, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, renderMarkdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  targetBatches: report.targetBatches,
  lessonCards: report.lessonCards,
  blankNoteFields: report.blankNoteFields,
  roleHints: report.roleHints,
  directCandidatesToConfirm: report.directCandidatesToConfirm,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  outputJson,
  outputMd,
}, null, 2));
