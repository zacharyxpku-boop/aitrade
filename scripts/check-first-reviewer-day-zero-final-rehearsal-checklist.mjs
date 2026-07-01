import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_DAY_ZERO_FINAL_REHEARSAL_CHECKLIST.json";
const outputMd = "docs/FIRST_REVIEWER_DAY_ZERO_FINAL_REHEARSAL_CHECKLIST.md";
const paths = {
  allBatchOperatorIndex: "docs/LESSON_BATCH_REVIEW_OPERATOR_INDEX.json",
  firstReviewerOperatorIndex: "docs/FIRST_REVIEWER_OPERATOR_INDEX.json",
  dayZeroWriteHandoff: "docs/FIRST_REVIEWER_DAY_ZERO_WRITE_HANDOFF.json",
  writeAuthorizationPreview: "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_AUTHORIZATION_PREVIEW.json",
  writeReadinessLock: "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_READINESS_LOCK.json",
  directCandidateWorksheet: "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_DECISION_WORKSHEET.json",
  sourceFitDecisionSummary: "docs/FIRST_REVIEWER_SOURCE_FIT_DECISION_SUMMARY.json",
  sourceFitNotesAcceptance: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_ACCEPTANCE.json",
  postWriteCommandPack: "docs/FIRST_REVIEWER_POST_WRITE_COMMAND_PACK.json",
  rehearsalChecklist: "docs/FIRST_REVIEWER_REHEARSAL_CHECKLIST.json",
  launchReadinessDashboard: "docs/FIRST_REVIEWER_LAUNCH_READINESS_DASHBOARD.json",
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
  if ("learnerFacingRelease" in record && record.learnerFacingRelease !== false) fail(`${label} cannot be learner-facing release`);
  if ("approvalStatus" in record && record.approvalStatus !== "not_approved") fail(`${label} must stay not_approved`);
  if (record.expectedOutcome !== EXPECTED_OUTCOME) fail(`${label} expectedOutcome changed`);
}

function assertBlocked(record, label) {
  if ("realStatusOverlayPresent" in record && record.realStatusOverlayPresent !== false) fail(`${label} must see no real status overlay`);
  if ("writeAllowedNow" in record && record.writeAllowedNow !== false) fail(`${label} cannot allow write now`);
  if ("manualDecisionRequired" in record && record.manualDecisionRequired !== true) fail(`${label} must require manual decision`);
  if ("humanAuthorizationRecorded" in record && record.humanAuthorizationRecorded !== false) fail(`${label} cannot record human authorization`);
  if ("executionAllowedNow" in record && record.executionAllowedNow !== false) fail(`${label} cannot allow post-write execution now`);
  if ("internalTrialReady" in record && record.internalTrialReady !== false) fail(`${label} cannot be internal trial ready`);
  if ("launchReady" in record && record.launchReady !== false) fail(`${label} cannot be launch ready`);
  if ("approvalReviewCandidates" in record && record.approvalReviewCandidates !== 0) fail(`${label} cannot create approval candidates`);
  if ("commercialReadyPromotions" in record && record.commercialReadyPromotions !== 0) fail(`${label} cannot promote commercial readiness`);
}

function checklistItem(order, label, status, evidence, humanBox, hardStop) {
  return { order, label, status, evidence, humanBox, hardStop };
}

function markdown(report) {
  return [
    "# First Reviewer Day-Zero Final Rehearsal Checklist",
    "",
    "This is the final rehearsal checklist before any future human-created review overlay for rewrite_batch_01 and rewrite_batch_05.",
    "It is checklist scaffolding only: it does not authorize write mode, create real notes, approve lessons, or make learner-facing claims.",
    "",
    "## Summary",
    "",
    `- Checklist ready: ${report.checklistReady}`,
    `- Checklist mode: ${report.checklistMode}`,
    `- Target batches: ${report.targetBatches.join(", ")}`,
    `- Lesson cards: ${report.lessonCards}`,
    `- Blank note fields: ${report.blankNoteFields}`,
    `- Direct candidate decisions: ${report.directCandidateDecisions}`,
    `- Confirmed decisions: ${report.confirmedDecisions}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Write allowed now: ${report.writeAllowedNow}`,
    `- Manual decision required: ${report.manualDecisionRequired}`,
    `- Human authorization recorded: ${report.humanAuthorizationRecorded}`,
    `- Approval review candidates: ${report.approvalReviewCandidates}`,
    `- Internal trial ready: ${report.internalTrialReady}`,
    `- Launch ready: ${report.launchReady}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Checklist",
    "",
    "| Order | Item | Status | Evidence | Human box | Hard stop |",
    "| --- | --- | --- | --- | --- | --- |",
    ...report.checklistRows.map((row) => `| ${row.order} | ${row.label} | ${row.status} | ${row.evidence} | ${row.humanBox} | ${row.hardStop} |`),
    "",
    "## Command Order",
    "",
    ...report.commandOrder.map((command, index) => `${index + 1}. \`${command}\``),
    "",
    "## Forbidden Actions",
    "",
    ...report.forbiddenActions.map((action) => `- ${action}`),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const [
  allBatchOperatorIndex,
  firstReviewerOperatorIndex,
  dayZeroWriteHandoff,
  writeAuthorizationPreview,
  writeReadinessLock,
  directCandidateWorksheet,
  sourceFitDecisionSummary,
  sourceFitNotesAcceptance,
  postWriteCommandPack,
  rehearsalChecklist,
  launchReadinessDashboard,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.allBatchOperatorIndex),
  readJson(paths.firstReviewerOperatorIndex),
  readJson(paths.dayZeroWriteHandoff),
  readJson(paths.writeAuthorizationPreview),
  readJson(paths.writeReadinessLock),
  readJson(paths.directCandidateWorksheet),
  readJson(paths.sourceFitDecisionSummary),
  readJson(paths.sourceFitNotesAcceptance),
  readJson(paths.postWriteCommandPack),
  readJson(paths.rehearsalChecklist),
  readJson(paths.launchReadinessDashboard),
  exists(realStatusPath),
]);

for (const [label, record] of [
  ["all-batch operator index", allBatchOperatorIndex],
  ["first reviewer operator index", firstReviewerOperatorIndex],
  ["day-zero write handoff", dayZeroWriteHandoff],
  ["write authorization preview", writeAuthorizationPreview],
  ["write readiness lock", writeReadinessLock],
  ["direct candidate worksheet", directCandidateWorksheet],
  ["source-fit decision summary", sourceFitDecisionSummary],
  ["sourceFitNotes acceptance", sourceFitNotesAcceptance],
  ["post-write command pack", postWriteCommandPack],
  ["rehearsal checklist", rehearsalChecklist],
  ["launch readiness dashboard", launchReadinessDashboard],
]) {
  assertEnvelope(record, label);
  assertBlocked(record, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; final rehearsal must stay pre-write`);
if (allBatchOperatorIndex.operatorIndexReady !== true || firstReviewerOperatorIndex.operatorIndexReady !== true) fail("operator indexes must be ready");
if (dayZeroWriteHandoff.handoffReady !== true || dayZeroWriteHandoff.handoffMode !== "day_zero_pre_write_handoff_only") fail("day-zero handoff must be ready and pre-write only");
if (writeAuthorizationPreview.authorizationPreviewReady !== true || writeAuthorizationPreview.machineGatesSatisfied !== writeAuthorizationPreview.machineGates) fail("authorization preview machine gates must be satisfied");
if (writeReadinessLock.lockReady !== true) fail("write readiness lock must be ready");
if (directCandidateWorksheet.worksheetReady !== true || directCandidateWorksheet.confirmedDecisions !== 0) fail("direct-candidate worksheet must be blank and unconfirmed");
if (directCandidateWorksheet.decisionRows?.length !== 5 || directCandidateWorksheet.sourceRefsToInspect !== 8) fail("direct-candidate worksheet must cover 5 decision rows and 8 source refs");
if (sourceFitDecisionSummary.summaryReady !== true || sourceFitDecisionSummary.decisionRows.length !== 5 || sourceFitDecisionSummary.confirmedDecisions !== 0 || sourceFitDecisionSummary.writeAllowedNow !== false) fail("source-fit decision summary must stay blank and write-blocked");
if (sourceFitNotesAcceptance.acceptanceGateReady !== true || sourceFitNotesAcceptance.confirmedDecisions !== 0) fail("sourceFitNotes acceptance must remain future-only with 0 confirmed decisions");
if (postWriteCommandPack.commandPackReady !== true || postWriteCommandPack.commandRows?.length !== 12) fail("post-write command pack must expose 12 future commands");
if (rehearsalChecklist.rehearsalReady !== true || rehearsalChecklist.lessonRehearsalCards !== 12 || rehearsalChecklist.noteFieldsRehearsed !== 72) fail("rehearsal checklist must cover 12 lesson cards and 72 note fields");
if (launchReadinessDashboard.completeNoteCards !== 0 || launchReadinessDashboard.approvalReviewCandidates !== 0) fail("launch readiness dashboard must stay empty and blocked");

for (const row of directCandidateWorksheet.decisionRows) {
  if (row.currentDecisionStatus !== "blank_requires_human_decision") fail(`${row.lessonId}/${row.family} decision cannot be prefilled`);
  if (row.mustRemainStructuralDraft !== true || row.learnerFacingUseAllowedNow !== false || row.approvalAllowedNow !== false) fail(`${row.lessonId}/${row.family} boundary drifted`);
}

const commandOrder = [
  "npm.cmd run check:lesson-batch-review-operator-index",
  "npm.cmd run check:first-reviewer-operator-index",
  "npm.cmd run check:first-reviewer-rehearsal-checklist",
  "npm.cmd run check:first-reviewer-direct-candidate-decision-worksheet",
  "npm.cmd run check:first-reviewer-source-fit-decision-summary",
  "npm.cmd run check:first-reviewer-real-overlay-write-readiness-lock",
  "npm.cmd run check:first-reviewer-real-overlay-write-authorization-preview",
  "npm.cmd run check:first-reviewer-day-zero-write-handoff",
  "npm.cmd run check:first-reviewer-day-zero-final-rehearsal-checklist",
  "npm.cmd run init:first-reviewer-status-overlay:dry-run",
  "npm.cmd run check:first-reviewer-status-init-protection",
];

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  checklistReady: true,
  checklistMode: "day_zero_final_rehearsal_pre_write_only",
  targetBatches: dayZeroWriteHandoff.targetBatches,
  realStatusPath,
  realStatusOverlayPresent,
  lessonCards: rehearsalChecklist.lessonRehearsalCards,
  blankNoteFields: rehearsalChecklist.noteFieldsRehearsed,
  directCandidateDecisions: directCandidateWorksheet.decisionRows.length,
  sourceFitDecisionRows: sourceFitDecisionSummary.decisionRows.length,
  sourceRefsToInspect: directCandidateWorksheet.sourceRefsToInspect,
  confirmedDecisions: 0,
  writeAllowedNow: false,
  manualDecisionRequired: true,
  humanAuthorizationRecorded: false,
  completeNoteCards: 0,
  approvalReviewCandidates: 0,
  commercialReadyPromotions: 0,
  internalTrialReady: false,
  launchReady: false,
  checklistRows: [
    checklistItem(1, "Broad operator index opened", "machine_ready_human_must_read", "48-lesson index ready; writeAllowedNow:false.", "Human has opened broad index.", "Stop if broad index implies approval, release, launch, or production readiness."),
    checklistItem(2, "First-reviewer scope accepted", "manual_required", "targetBatches: rewrite_batch_01, rewrite_batch_05.", "Human accepts scope exactly.", "Stop if scope expands to all 48 lessons for write mode."),
    checklistItem(3, "Direct candidates rehearsed", "manual_required", "5 blank decisions, 8 green refs, 0 confirmed decisions.", "Human can explain confirm/downgrade/block criteria.", "Stop if generated output confirms any direct source role."),
    checklistItem(3.5, "Source-fit summary read", "manual_required", "One-page summary covers 5 decision rows and keeps writeAllowedNow:false.", "Human reads summary before future sourceFitNotes.", "Stop if the summary is treated as a decision or write authorization."),
    checklistItem(4, "Blank notes confirmed", "machine_checked_blank", "12 lesson cards, 72 note fields rehearsed, 0 complete note cards.", "Human confirms real notes will start blank.", "Stop if generated prompts or examples are copied as notes."),
    checklistItem(5, "Write lock understood", "write_blocked_manual_required", "writeAllowedNow:false; manualDecisionRequired:true.", "Human understands generated checks do not authorize write mode.", "Stop if any script grants write permission automatically."),
    checklistItem(6, "Authorization blockers visible", "manual_required", "Reviewer identity and direct-candidate decisions remain blockers.", "Human can name reviewer and unresolved candidate process.", "Stop if no real human reviewer is identified."),
    checklistItem(7, "Post-write validation rehearsed", "future_only", "12 future post-write commands; executionAllowedNow:false.", "Human understands post-write order and failure routes.", "Stop if post-write pack is run as evidence before overlay exists."),
    checklistItem(8, "Launch/readiness blocked", "not_ready", "internalTrialReady:false; launchReady:false; productionReady:false.", "Human confirms no readiness claim follows rehearsal.", "Stop if any readiness flag or learner-facing release is asserted."),
  ],
  commandOrder,
  forbiddenActions: [
    "Do not run write mode from this final rehearsal checklist alone.",
    "Do not create or overwrite docs/LESSON_BATCH_REVIEW_STATUS.json without explicit human note-taking intent.",
    "Do not copy generated checklist, prompt, sample, drill, or packet wording into real reviewer notes.",
    "Do not confirm direct-candidate sources without original human sourceFitNotes.",
    "Do not approve lessons, publish learner-facing content, promote generated drafts to commercial_ready, mark internalTrialReady, mark launchReady, or set productionReady true.",
    "Do not add buy/sell/hold advice, trading signals, performance claims, broker/order workflow, automation, copied source prose, or real-money guidance.",
    "Do not use yellow, red, or research_only sources as learner-facing evidence.",
  ],
  sourceReports: paths,
  boundary: "This day-zero final rehearsal checklist is reviewer-facing operations scaffolding only. It does not authorize write mode, create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, confirm source use, approve lessons, publish learner-facing content, promote grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, grant internal-trial readiness, launch the course, or make the product production-ready.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  checklistReady: report.checklistReady,
  checklistMode: report.checklistMode,
  targetBatches: report.targetBatches,
  lessonCards: report.lessonCards,
  blankNoteFields: report.blankNoteFields,
  directCandidateDecisions: report.directCandidateDecisions,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  writeAllowedNow: report.writeAllowedNow,
  manualDecisionRequired: report.manualDecisionRequired,
  humanAuthorizationRecorded: report.humanAuthorizationRecorded,
  approvalReviewCandidates: report.approvalReviewCandidates,
  commercialReadyPromotions: report.commercialReadyPromotions,
  internalTrialReady: report.internalTrialReady,
  launchReady: report.launchReady,
  outputJson,
  outputMd,
}, null, 2));
