import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_PREWRITE_SAMPLE_DOSSIER.json";
const outputMd = "docs/FIRST_REVIEWER_PREWRITE_SAMPLE_DOSSIER.md";

const paths = {
  dryRunPacket: "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json",
  progressDashboard: "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.json",
  humanExecutionBundle: "docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.json",
  operatorIndex: "docs/FIRST_REVIEWER_OPERATOR_INDEX.json",
  onePageRunbook: "docs/FIRST_REVIEWER_ONE_PAGE_RUNBOOK.json",
  runbookNegativeCases: "docs/FIRST_REVIEWER_RUNBOOK_NEGATIVE_CASES.json",
  worksheet: "docs/FIRST_REVIEWER_WORKSHEET.json",
  sourceRoleDecisionTable: "docs/FIRST_REVIEWER_SOURCE_ROLE_DECISION_TABLE.json",
  noteReadinessMatrix: "docs/FIRST_REVIEWER_NOTE_READINESS_MATRIX.json",
  directCandidateWorksheet: "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_DECISION_WORKSHEET.json",
  sourceFitDecisionSummary: "docs/FIRST_REVIEWER_SOURCE_FIT_DECISION_SUMMARY.json",
  sourceFitNotesCardPack: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_PACK.json",
  sourceFitNotesCardNegativeCases: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_NEGATIVE_CASES.json",
  sourceFitNotesPositiveMatrix: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_POSITIVE_MATRIX.json",
  sourceFitNotesHumanFillPreflight: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_HUMAN_FILL_PREFLIGHT.json",
  postWriteCommandPack: "docs/FIRST_REVIEWER_POST_WRITE_COMMAND_PACK.json",
  postWriteValidationSimulator: "docs/FIRST_REVIEWER_POST_WRITE_VALIDATION_SIMULATOR.json",
  preflightSummary: "docs/FIRST_REVIEWER_REAL_OVERLAY_PREFLIGHT_SUMMARY.json",
  realOverlayDryRunBundleAudit: "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.json",
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

function flattenLessons(worksheet) {
  return worksheet.batchWorksheets.flatMap((batch) => batch.lessons.map((lesson) => ({
    ...lesson,
    batchId: batch.batchId,
  })));
}

function markdown(report) {
  return [
    "# First Reviewer Pre-Write Sample Dossier",
    "",
    "This dossier packages the first reviewer pre-write sample set for a human reviewer.",
    "It is read-only scaffolding: it does not create real notes, approve lessons, publish learner-facing content, promote grades, or certify readiness.",
    "",
    "## Summary",
    "",
    `- Dossier ready: ${report.dossierReady}`,
    `- Dossier mode: ${report.dossierMode}`,
    `- Target batches: ${report.targetBatches.join(", ")}`,
    `- Lesson cards: ${report.lessonCards}`,
    `- High-risk lessons: ${report.highRiskLessons}`,
    `- Note fields: ${report.noteFields}`,
    `- Source-family decisions: ${report.sourceFamilyDecisions}`,
      `- Direct candidates: ${report.directCandidates}`,
      `- Source-fit decision rows: ${report.sourceFitDecisionRows}`,
      `- SourceFitNotes cards: ${report.sourceFitNotesCards}`,
      `- SourceFitNotes card negative cases: ${report.sourceFitNotesCardNegativeCases}`,
      `- SourceFitNotes positive samples: ${report.sourceFitNotesPositiveSamples}`,
      `- SourceFitNotes human-fill preflight rows: ${report.sourceFitNotesHumanFillPreflightRows}`,
      `- Runbook negative cases: ${report.runbookNegativeCasesPassed}/${report.runbookNegativeCases}`,
    `- Post-write commands: ${report.postWriteCommands}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Write allowed now: ${report.writeAllowedNow}`,
    `- Execution allowed now: ${report.executionAllowedNow}`,
    `- Complete note cards: ${report.completeNoteCards}`,
    `- Approval review candidates: ${report.approvalReviewCandidates}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Reviewer Packet Order",
    "",
    ...report.packetOrder.map((item, index) => `${index + 1}. \`${item.file}\` - ${item.use}`),
    "",
    "## Lesson Sample Rows",
    "",
    "| Batch | Lesson | Risk | Module | Topic | Note fields | Direct candidates |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...report.lessonRows.map((row) => `| ${row.batchId} | ${row.lessonId} | ${row.riskLevel} | ${row.module} | ${row.topic} | ${row.noteFields} | ${row.directCandidates} |`),
    "",
    "## Required Gates",
    "",
    ...report.requiredGates.map((gate) => `- ${gate}`),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const [
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  operatorIndex,
  onePageRunbook,
  runbookNegativeCases,
  worksheet,
  sourceRoleDecisionTable,
  noteReadinessMatrix,
  directCandidateWorksheet,
  sourceFitDecisionSummary,
  sourceFitNotesCardPack,
  sourceFitNotesCardNegativeCases,
  sourceFitNotesPositiveMatrix,
  sourceFitNotesHumanFillPreflight,
  postWriteCommandPack,
  postWriteValidationSimulator,
  preflightSummary,
  realOverlayDryRunBundleAudit,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.dryRunPacket),
  readJson(paths.progressDashboard),
  readJson(paths.humanExecutionBundle),
  readJson(paths.operatorIndex),
  readJson(paths.onePageRunbook),
  readJson(paths.runbookNegativeCases),
  readJson(paths.worksheet),
  readJson(paths.sourceRoleDecisionTable),
  readJson(paths.noteReadinessMatrix),
  readJson(paths.directCandidateWorksheet),
  readJson(paths.sourceFitDecisionSummary),
  readJson(paths.sourceFitNotesCardPack),
  readJson(paths.sourceFitNotesCardNegativeCases),
  readJson(paths.sourceFitNotesPositiveMatrix),
  readJson(paths.sourceFitNotesHumanFillPreflight),
  readJson(paths.postWriteCommandPack),
  readJson(paths.postWriteValidationSimulator),
  readJson(paths.preflightSummary),
  readJson(paths.realOverlayDryRunBundleAudit),
  exists(realStatusPath),
]);

for (const [label, record] of Object.entries({
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  operatorIndex,
  onePageRunbook,
  runbookNegativeCases,
  worksheet,
  sourceRoleDecisionTable,
  noteReadinessMatrix,
  directCandidateWorksheet,
  sourceFitDecisionSummary,
  sourceFitNotesCardPack,
  sourceFitNotesCardNegativeCases,
  sourceFitNotesPositiveMatrix,
  sourceFitNotesHumanFillPreflight,
  postWriteCommandPack,
  postWriteValidationSimulator,
  preflightSummary,
  realOverlayDryRunBundleAudit,
})) {
  assertEnvelope(record, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; pre-write dossier must remain read-only`);
if (!dryRunPacket.requiredFiles.some((file) => file.path === outputMd)) fail("dry-run packet must include pre-write sample dossier file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-prewrite-sample-dossier")) fail("dry-run packet must include pre-write sample dossier command");
if (!progressDashboard.fileOrder.some((file) => file.path === outputMd)) fail("progress dashboard must include pre-write sample dossier file");
if (!progressDashboard.requiredCommands.includes("npm.cmd run check:first-reviewer-prewrite-sample-dossier")) fail("progress dashboard must include pre-write sample dossier command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Pre-write sample dossier" && row.status === "read_only_human_handoff_ready")) fail("progress dashboard must include pre-write sample dossier status");
if (!humanExecutionBundle.executionSteps.some((row) => row.file === outputMd)) fail("human execution bundle must point to pre-write sample dossier");
if (!operatorIndex.phaseRows.some((row) => row.primaryFile === outputMd)) fail("operator index must point to pre-write sample dossier");
if (!operatorIndex.criticalCommands.includes("npm.cmd run check:first-reviewer-prewrite-sample-dossier")) fail("operator index must include pre-write sample dossier command");
if (!operatorIndex.phaseRows.some((row) => row.primaryFile === "docs/FIRST_REVIEWER_FILLED_NOTES_POSITIVE_CONTROL_V2.md")) fail("operator index must point to filled-notes positive control v2");
if (!operatorIndex.criticalCommands.includes("npm.cmd run check:first-reviewer-filled-notes-positive-control-v2")) fail("operator index must include filled-notes positive control v2 command");
if (!operatorIndex.phaseRows.some((row) => row.primaryFile === "docs/FIRST_REVIEWER_POST_WRITE_APPROVAL_DRILL.md")) fail("operator index must point to post-write approval drill");
if (!operatorIndex.criticalCommands.includes("npm.cmd run check:first-reviewer-post-write-approval-drill")) fail("operator index must include post-write approval drill command");
if (!operatorIndex.phaseRows.some((row) => row.primaryFile === "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_POST_WRITE_DRILL.md")) fail("operator index must point to direct-candidate post-write drill");
if (!operatorIndex.criticalCommands.includes("npm.cmd run check:first-reviewer-direct-candidate-post-write-drill")) fail("operator index must include direct-candidate post-write drill command");
if (!operatorIndex.phaseRows.some((row) => row.primaryFile === "docs/FIRST_REVIEWER_POST_WRITE_VALIDATION_SIMULATOR.md")) fail("operator index must point to post-write validation simulator");
if (!operatorIndex.criticalCommands.includes("npm.cmd run check:first-reviewer-post-write-validation-simulator")) fail("operator index must include post-write validation simulator command");
if (!operatorIndex.phaseRows.some((row) => row.primaryFile === "docs/FIRST_REVIEWER_SEQUENCE_CONSISTENCY.md")) fail("operator index must point to sequence consistency gate");
if (!operatorIndex.criticalCommands.includes("npm.cmd run check:first-reviewer-sequence-consistency")) fail("operator index must include sequence consistency command");
if (!operatorIndex.phaseRows.some((row) => row.primaryFile === "docs/FIRST_REVIEWER_DAY_OF_REVIEW_PACKET_FREEZE.md")) fail("operator index must point to day-of-review packet freeze");
if (!operatorIndex.criticalCommands.includes("npm.cmd run check:first-reviewer-day-of-review-packet-freeze")) fail("operator index must include day-of-review packet freeze command");
if (!operatorIndex.phaseRows.some((row) => row.primaryFile === "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_READINESS_LOCK.md")) fail("operator index must point to real overlay write readiness lock");
if (!operatorIndex.criticalCommands.includes("npm.cmd run check:first-reviewer-real-overlay-write-readiness-lock")) fail("operator index must include real overlay write readiness lock command");
if (!operatorIndex.phaseRows.some((row) => row.primaryFile === "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_AUTHORIZATION_PREVIEW.md")) fail("operator index must point to real overlay write authorization preview");
if (!operatorIndex.criticalCommands.includes("npm.cmd run check:first-reviewer-real-overlay-write-authorization-preview")) fail("operator index must include real overlay write authorization preview command");
if (!operatorIndex.phaseRows.some((row) => row.primaryFile === "docs/FIRST_REVIEWER_DAY_ZERO_WRITE_HANDOFF.md")) fail("operator index must point to day-zero write handoff");
if (!operatorIndex.criticalCommands.includes("npm.cmd run check:first-reviewer-day-zero-write-handoff")) fail("operator index must include day-zero write handoff command");
if (!operatorIndex.phaseRows.some((row) => row.primaryFile === "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.md")) fail("operator index must point to dry-run bundle audit");
if (!operatorIndex.criticalCommands.includes("npm.cmd run check:first-reviewer-real-overlay-dry-run-bundle-audit")) fail("operator index must include dry-run bundle audit command");

if (onePageRunbook.runbookMode !== "printable_pre_write_operator_runbook") fail("one-page runbook must remain printable pre-write mode");
if (runbookNegativeCases.failedCases !== 0 || runbookNegativeCases.passedCases !== runbookNegativeCases.negativeCases) fail("runbook negative cases must pass before dossier");
if (worksheet.worksheetLessons !== 12 || worksheet.highRiskLessons !== 2) fail("worksheet must keep 12 lesson cards and 2 high-risk rows");
if (sourceRoleDecisionTable.lessonRows.length !== 12 || sourceRoleDecisionTable.directCandidatesNeedingConfirmation !== 5) fail("source-role table must keep 12 rows and 5 direct candidates");
if (noteReadinessMatrix.matrixRows !== 72 || noteReadinessMatrix.prefilledNoteFields !== 0) fail("note readiness must keep 72 blank fields and zero prefilled notes");
if (directCandidateWorksheet.confirmedDecisions !== 0) fail("direct candidate worksheet cannot confirm generated decisions");
if (sourceFitDecisionSummary.summaryReady !== true || sourceFitDecisionSummary.decisionRows.length !== 5 || sourceFitDecisionSummary.writeAllowedNow !== false) fail("source-fit decision summary must cover 5 write-blocked rows");
if (sourceFitNotesCardPack.cardPackReady !== true || sourceFitNotesCardPack.blankCards !== 5 || sourceFitNotesCardPack.filledFields !== 0) fail("sourceFitNotes card pack must keep 5 blank cards");
if (sourceFitNotesCardNegativeCases.negativeCasesReady !== true || sourceFitNotesCardNegativeCases.failedCases !== 0) fail("sourceFitNotes card negative cases must keep misuse guard passing");
if (sourceFitNotesPositiveMatrix.matrixReady !== true || sourceFitNotesPositiveMatrix.sampleOnly !== true || sourceFitNotesPositiveMatrix.failedSamples !== 0) fail("sourceFitNotes positive matrix must keep sample-only positive samples passing");
if (sourceFitNotesHumanFillPreflight.preflightReady !== true || sourceFitNotesHumanFillPreflight.humanFillAllowedNow !== false || sourceFitNotesHumanFillPreflight.directCandidates !== 5) fail("sourceFitNotes human-fill preflight must stay manual-blocked with 5 candidates");
if (postWriteCommandPack.executionAllowedNow !== false || postWriteCommandPack.commandRows.length !== 12) fail("post-write command pack must stay future-only with 12 commands");
if (postWriteValidationSimulator.simulatorReady !== true || postWriteValidationSimulator.realStatusOverlayTouched !== false) fail("post-write validation simulator must pass without touching real overlay");
if (preflightSummary.writeAllowedNow !== false || preflightSummary.manualDecisionRequired !== true) fail("preflight must keep write blocked until human decision");
if (realOverlayDryRunBundleAudit.auditReady !== true || realOverlayDryRunBundleAudit.writeAllowedNow !== false || realOverlayDryRunBundleAudit.commandOrderConsistent !== true) fail("dry-run bundle audit must stay ready, consistent, and write-blocked");

const lessons = flattenLessons(worksheet);
const noteRowsByLesson = new Map();
for (const row of noteReadinessMatrix.rows) {
  if (!noteRowsByLesson.has(row.lessonId)) noteRowsByLesson.set(row.lessonId, []);
  noteRowsByLesson.get(row.lessonId).push(row);
}
const directRowsByLesson = new Map();
for (const row of directCandidateWorksheet.decisionRows || []) {
  if (!directRowsByLesson.has(row.lessonId)) directRowsByLesson.set(row.lessonId, []);
  directRowsByLesson.get(row.lessonId).push(row);
}

const lessonRows = lessons.map((lesson) => ({
  batchId: lesson.batchId,
  lessonId: lesson.lessonId,
  riskLevel: lesson.riskLevel,
  module: lesson.module,
  topic: lesson.topic,
  currentGrade: lesson.currentGrade,
  noteFields: (noteRowsByLesson.get(lesson.lessonId) || []).length,
  directCandidates: (directRowsByLesson.get(lesson.lessonId) || []).length,
}));

for (const row of lessonRows) {
  if (row.currentGrade !== "structural_draft") fail(`${row.lessonId} must remain structural_draft`);
  if (row.noteFields !== 6) fail(`${row.lessonId} must expose exactly 6 note fields`);
}

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  dossierReady: true,
  dossierMode: "read_only_pre_write_human_handoff",
  realStatusPath,
  realStatusOverlayPresent,
  targetBatches: worksheet.targetBatches,
  lessonCards: lessonRows.length,
  highRiskLessons: worksheet.highRiskLessons,
  noteFields: noteReadinessMatrix.matrixRows,
  sourceFamilyDecisions: sourceRoleDecisionTable.sourceFamilyDecisions,
    directCandidates: directCandidateWorksheet.decisionRows.length,
    sourceFitDecisionRows: sourceFitDecisionSummary.decisionRows.length,
    sourceFitNotesCards: sourceFitNotesCardPack.blankCards,
    sourceFitNotesCardNegativeCases: sourceFitNotesCardNegativeCases.negativeCases,
    sourceFitNotesPositiveSamples: sourceFitNotesPositiveMatrix.decisionSamples,
    sourceFitNotesHumanFillPreflightRows: sourceFitNotesHumanFillPreflight.directCandidates,
    runbookNegativeCases: runbookNegativeCases.negativeCases,
  runbookNegativeCasesPassed: runbookNegativeCases.passedCases,
  postWriteCommands: postWriteCommandPack.commandRows.length,
  dryRunBundleAuditReady: realOverlayDryRunBundleAudit.auditReady,
  writeAllowedNow: preflightSummary.writeAllowedNow,
  executionAllowedNow: postWriteCommandPack.executionAllowedNow,
  completeNoteCards: onePageRunbook.completeNoteCards,
  approvalReviewCandidates: onePageRunbook.approvalReviewCandidates,
  packetOrder: [
    { file: "docs/FIRST_REVIEWER_OPERATOR_INDEX.md", use: "start here and confirm all readiness flags remain false" },
    { file: "docs/FIRST_REVIEWER_ONE_PAGE_RUNBOOK.md", use: "printable day-of-review sequence" },
    { file: "docs/FIRST_REVIEWER_RUNBOOK_NEGATIVE_CASES.md", use: "misuse guard for runbook-as-evidence drift" },
    { file: "docs/FIRST_REVIEWER_FILLED_NOTES_POSITIVE_CONTROL_V2.md", use: "temporary-file control proving completed notes become candidate-only rows" },
    { file: "docs/FIRST_REVIEWER_POST_WRITE_APPROVAL_DRILL.md", use: "temporary post-write drill proving approval-review candidates remain blocked from release and readiness" },
    { file: "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_POST_WRITE_DRILL.md", use: "temporary sourceFitNotes drill for BEA, BLS, CFTC, and SEC candidate boundaries" },
    { file: "docs/FIRST_REVIEWER_POST_WRITE_VALIDATION_SIMULATOR.md", use: "temporary full post-write simulator chaining completion, intake, separate approval, and release-drift guards" },
    { file: "docs/FIRST_REVIEWER_SEQUENCE_CONSISTENCY.md", use: "pre-write order-integrity gate for execution steps, operator phases, commands, and packet order" },
    { file: "docs/FIRST_REVIEWER_DAY_OF_REVIEW_PACKET_FREEZE.md", use: "frozen day-of-review packet with step inputs, expected outputs, failure routes, and forbidden actions" },
    { file: "docs/FIRST_REVIEWER_SOURCE_FIT_DECISION_SUMMARY.md", use: "one-page confirm/downgrade/block summary for 5 direct-candidate source roles before sourceFitNotes" },
    { file: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_PACK.md", use: "blank printable sourceFitNotes cards with 35 empty fields for the 5 direct-candidate rows" },
    { file: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_NEGATIVE_CASES.md", use: "simulated card pollution guard before any future sourceFitNotes acceptance" },
    { file: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_POSITIVE_MATRIX.md", use: "sample-only confirm/downgrade/block sourceFitNotes shapes before future human note writing" },
    { file: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_HUMAN_FILL_PREFLIGHT.md", use: "manual preflight for reviewer identity, 5 candidate decisions, source identity basis, and no-copy checks before real sourceFitNotes" },
    { file: "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_READINESS_LOCK.md", use: "generated hard stop before any real reviewer overlay write command" },
    { file: "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_AUTHORIZATION_PREVIEW.md", use: "generated authorization preview showing machine gates while still requiring a human write decision" },
    { file: "docs/FIRST_REVIEWER_DAY_ZERO_WRITE_HANDOFF.md", use: "one-page day-zero route for pre-write checks, human authorization blockers, write-command preview, and future post-write validation order" },
    { file: "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.md", use: "pre-write consistency audit tying dry-run, overwrite protection, day-zero handoff, final rehearsal, authorization preview, and write lock together" },
    { file: "docs/FIRST_REVIEWER_WORKSHEET.md", use: "12 lesson cards across the first two reviewer batches" },
    { file: "docs/FIRST_REVIEWER_SOURCE_ROLE_DECISION_TABLE.md", use: "45 source-family role decisions and 5 direct candidates" },
    { file: "docs/FIRST_REVIEWER_NOTE_READINESS_MATRIX.md", use: "72 blank required note fields" },
    { file: "docs/FIRST_REVIEWER_POST_WRITE_COMMAND_PACK.md", use: "future-only validation command order after a real overlay exists" },
  ],
  lessonRows,
  requiredGates: [
    "Do not create docs/LESSON_BATCH_REVIEW_STATUS.json from this dossier.",
    "Do not treat the runbook, worksheet, or dossier as real reviewer notes.",
    "Read the source-fit decision summary before writing future sourceFitNotes, but do not treat the summary as a decision.",
    "Use the sourceFitNotes card pack only as blank cards; do not prefill decision, sourceRole, claimSupported, rewriteAction, sourceIdentityBasis, noCopyOriginalityCheck, or reviewerInitials.",
    "Resolve all 5 direct candidates through human sourceFitNotes before evidence intake.",
    "Run post-write commands only after a deliberately human-created overlay exists.",
    "Keep the dry-run bundle audit passing before any future real overlay write.",
    "Keep approvalStatus:not_approved, learnerFacingRelease:false, productionReady:false, internalTrialReady:false, and launchReady:false.",
  ],
  sourceReports: paths,
  boundary: "This pre-write sample dossier is a read-only human handoff packet. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, confirm source use, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, grant internal-trial readiness, or make the product production-ready.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  dossierReady: report.dossierReady,
  dossierMode: report.dossierMode,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  lessonCards: report.lessonCards,
  noteFields: report.noteFields,
  directCandidates: report.directCandidates,
  sourceFitDecisionRows: report.sourceFitDecisionRows,
  sourceFitNotesCards: report.sourceFitNotesCards,
  runbookNegativeCasesPassed: report.runbookNegativeCasesPassed,
  runbookNegativeCases: report.runbookNegativeCases,
  postWriteCommands: report.postWriteCommands,
  writeAllowedNow: report.writeAllowedNow,
  executionAllowedNow: report.executionAllowedNow,
  completeNoteCards: report.completeNoteCards,
  approvalReviewCandidates: report.approvalReviewCandidates,
  outputJson,
  outputMd,
}, null, 2));
