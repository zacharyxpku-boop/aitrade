import fs from "node:fs/promises";

const worksheetPath = "docs/FIRST_REVIEWER_WORKSHEET.json";
const draftTemplatePath = "docs/LESSON_BATCH_REVIEW_STATUS_DRAFT_TEMPLATE_FOR_BATCH_01_05.json";
const completionAuditPath = "docs/LESSON_BATCH_COMPLETION_AUDIT.json";
const negativeCasesPath = "docs/LESSON_BATCH_STATUS_NEGATIVE_CASES.json";
const outputJson = "docs/FIRST_REVIEWER_HANDOFF.json";
const outputMd = "docs/FIRST_REVIEWER_HANDOFF.md";
const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const REQUIRED_COMMANDS = [
  "npm.cmd run init:first-reviewer-status-overlay:dry-run",
  "npm.cmd run check:first-reviewer-status-init-protection",
  "npm.cmd run check:lesson-batch-completed-notes-example",
  "npm.cmd run check:first-reviewer-worksheet",
  "npm.cmd run check:first-reviewer-status-draft-template",
  "npm.cmd run check:first-reviewer-notes-prompt",
  "npm.cmd run check:reviewer-note-quality-lint",
  "npm.cmd run check:first-reviewer-real-overlay-creation-checklist",
  "npm.cmd run check:lesson-batch-completion",
  "npm.cmd run check:curriculum-review",
];
const DISALLOWED_STATUS_WORDS = [
  "approved_final",
  "commercial_ready",
  "learner_facing_ready",
  "production_ready",
  "trading_signal_ready",
];

function fail(message) {
  throw new Error(message);
}

async function readJson(path) {
  return JSON.parse(await fs.readFile(path, "utf8"));
}

function assertEnvelope(report, label) {
  if (report.educationOnly !== true) fail(`${label} must keep educationOnly true`);
  if (report.productionReady !== false) fail(`${label} must keep productionReady false`);
  if (report.learnerFacingRelease !== false) fail(`${label} cannot be learner-facing release`);
  if (report.approvalStatus !== "not_approved") fail(`${label} must stay not_approved`);
  if (report.expectedOutcome !== EXPECTED_OUTCOME) fail(`${label} expectedOutcome changed`);
}

function renderMarkdown(report) {
  return [
    "# First Reviewer Handoff",
    "",
    "This handoff gives a human reviewer the first safe operating path for the high-risk source-fit batches.",
    "It is not completed review, approval, learner-facing release, production readiness, or trading guidance.",
    "",
    "## Summary",
    "",
    `- Target batches: ${report.targetBatches.join(", ")}`,
    `- Worksheet lessons: ${report.worksheetLessons}`,
    `- Draft lesson cards: ${report.draftLessonCards}`,
    `- High-risk lessons: ${report.highRiskLessons}`,
    `- Negative cases passing: ${report.negativeCasesPassed}/${report.negativeCases}`,
    `- Status overlay present: ${report.statusOverlayPresent}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Files",
    "",
    ...report.files.map((file) => `- ${file.label}: \`${file.path}\` - ${file.use}`),
    "",
    "## Operating Steps",
    "",
    ...report.operatingSteps.map((step, index) => `${index + 1}. ${step}`),
    "",
    "## Commands",
    "",
    ...report.requiredCommands.map((command) => `- \`${command}\``),
    "",
    "## Do Not Write",
    "",
    ...report.disallowedStatusWords.map((word) => `- \`${word}\``),
    "",
    "## Required Notes",
    "",
    ...report.requiredReviewerNotes.map((note) => `- \`${note}\``),
    "",
    "## Ready Rule",
    "",
    report.readyRule,
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const worksheet = await readJson(worksheetPath);
const draftTemplate = await readJson(draftTemplatePath);
const completionAudit = await readJson(completionAuditPath);
const negativeCases = await readJson(negativeCasesPath);

assertEnvelope(worksheet, "first reviewer worksheet");
assertEnvelope(draftTemplate, "first reviewer draft template");
assertEnvelope(completionAudit, "lesson batch completion audit");
assertEnvelope(negativeCases, "lesson batch negative cases");

if (worksheet.worksheetLessons !== 12 || draftTemplate.draftLessonCards !== 12) fail("handoff must cover the 12 first-reviewer lesson cards");
if (worksheet.highRiskLessons !== 2) fail("handoff must include two high-risk lessons");
if (draftTemplate.notesFilled !== 0) fail("draft template must keep all notes blank");
if (completionAudit.readyBatches !== 0) fail("handoff must not start with ready batches");
if (negativeCases.failedCases !== 0 || negativeCases.passedCases !== negativeCases.negativeCases) fail("negative cases must all pass");

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  targetBatches: draftTemplate.targetBatches,
  worksheetLessons: worksheet.worksheetLessons,
  draftLessonCards: draftTemplate.draftLessonCards,
  highRiskLessons: worksheet.highRiskLessons,
  statusOverlayPresent: completionAudit.statusOverlayPresent,
  negativeCases: negativeCases.negativeCases,
  negativeCasesPassed: negativeCases.passedCases,
  files: [
    {
      label: "Worksheet",
      path: "docs/FIRST_REVIEWER_WORKSHEET.md",
      use: "review source-fit order, high-risk questions, safe rewrite directions, and green-only source metadata",
    },
    {
      label: "Draft status template",
      path: "docs/LESSON_BATCH_REVIEW_STATUS_DRAFT_TEMPLATE_FOR_BATCH_01_05.json",
      use: "copy only when a human reviewer is ready to create docs/LESSON_BATCH_REVIEW_STATUS.json and record real notes",
    },
    {
      label: "Notes prompt",
      path: "docs/FIRST_REVIEWER_NOTES_PROMPT.md",
      use: "use before filling real notes to classify source roles, fact-check scope, boundary checks, and copying-risk checks",
    },
    {
      label: "Note quality lint",
      path: "docs/REVIEWER_NOTE_QUALITY_LINT.md",
      use: "confirm future ready notes are specific, non-placeholder, non-approving, and free of unsafe trading/readiness wording",
    },
    {
      label: "Real overlay creation checklist",
      path: "docs/FIRST_REVIEWER_REAL_OVERLAY_CREATION_CHECKLIST.md",
      use: "confirm dry-run, overwrite protection, blank-note readiness, and explicit human-decision requirements before creating the real reviewer status overlay",
    },
    {
      label: "Completion audit",
      path: "docs/LESSON_BATCH_COMPLETION_AUDIT.md",
      use: "confirm whether any real status overlay can advance to a separate human approval review",
    },
    {
      label: "Negative cases",
      path: "docs/LESSON_BATCH_STATUS_NEGATIVE_CASES.md",
      use: "confirm unsafe or incomplete overlay states are rejected",
    },
    {
      label: "Init protection",
      path: "docs/LESSON_BATCH_REVIEW_STATUS_INIT_PROTECTION.md",
      use: "confirm write mode will not overwrite an existing reviewer status overlay without explicit force",
    },
    {
      label: "Completed-notes positive example",
      path: "docs/LESSON_BATCH_COMPLETED_NOTES_EXAMPLE.md",
      use: "confirm a temporary fully noted batch can pass completion audit without touching the real status overlay",
    },
  ],
  operatingSteps: [
    "Open docs/FIRST_REVIEWER_WORKSHEET.md and start with the high-risk lesson in each target batch.",
    "Decide which source refs are direct evidence, boundary-only metadata, or unsuitable for explanatory prose.",
    "Use docs/FIRST_REVIEWER_NOTES_PROMPT.md to draft real reviewer notes only after the underlying source-fit and boundary checks are actually performed.",
    "Rewrite only original education prose outside this handoff file; do not copy external source body text.",
    "Run the dry-run status initializer before creating any real status overlay.",
    "Open docs/FIRST_REVIEWER_REAL_OVERLAY_CREATION_CHECKLIST.md before running the write initializer; creationAllowedNow remains false until an explicit human reviewer decision starts real note-taking.",
    "When real review starts, use the explicit write initializer or copy docs/LESSON_BATCH_REVIEW_STATUS_DRAFT_TEMPLATE_FOR_BATCH_01_05.json into docs/LESSON_BATCH_REVIEW_STATUS.json and fill only real reviewer notes.",
    "Run the reviewer note quality lint after notes are filled and before any batch is treated as ready for a separate approval review.",
    "Keep approvalStatus:not_approved and learnerFacingRelease:false even after notes are filled.",
    "Run the required commands before treating a batch as ready for a separate approval review.",
  ],
  requiredCommands: REQUIRED_COMMANDS,
  disallowedStatusWords: DISALLOWED_STATUS_WORDS,
  requiredReviewerNotes: [
    "originalRewriteNotes",
    "sourceFitNotes",
    "factCheckNotes",
    "boundaryCheckNotes",
    "copyingRiskNotes",
    "humanReviewerInitials",
  ],
  readyRule: "A batch can only be ready_for_separate_human_approval_review after every lesson card has all required real reviewer notes; even then, lessons remain structural_draft and not_approved until separate approval.",
  boundary: "This handoff is reviewer-facing process guidance only. It does not approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.",
};

const rendered = renderMarkdown(report);
for (const command of REQUIRED_COMMANDS) {
  if (!rendered.includes(command)) fail(`handoff markdown missing command ${command}`);
}
for (const word of DISALLOWED_STATUS_WORDS) {
  if (!rendered.includes(word)) fail(`handoff markdown missing disallowed status ${word}`);
}
if (!rendered.includes("approvalStatus:not_approved")) fail("handoff must explicitly keep approvalStatus:not_approved");
if (!rendered.includes("learnerFacingRelease:false")) fail("handoff must explicitly keep learnerFacingRelease:false");

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, rendered, "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  targetBatches: report.targetBatches,
  worksheetLessons: report.worksheetLessons,
  draftLessonCards: report.draftLessonCards,
  highRiskLessons: report.highRiskLessons,
  negativeCasesPassed: report.negativeCasesPassed,
  negativeCases: report.negativeCases,
  outputJson,
  outputMd,
}, null, 2));
