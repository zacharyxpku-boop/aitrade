import fs from "node:fs";

const starterPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_INPUT_STARTER.json";
const draftPath = "docs/reviewer-inputs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_REAL_INPUT_DRAFT.json";
const validationPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_INPUT_STARTER_VALIDATION.json";
const outputJson = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_TASK_BOARD.json";
const outputMd = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_TASK_BOARD.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(artifact, label) {
  if (artifact.educationOnly !== true) fail(`${label} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${label} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${label} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${label} must remain not_approved`);
}

const starter = readJson(starterPath);
const draft = readJson(draftPath);
const validation = readJson(validationPath);
[["starter", starter], ["draft", draft], ["validation", validation]].forEach(([label, artifact]) => assertBoundary(artifact, label));

const validationById = new Map((validation.validationRows || []).map((row) => [row.id, row]));
const taskRows = (draft.inputEntries || []).map((entry, index) => {
  const validationRow = validationById.get(entry.id) || {};
  const requirements = entry.packQualityRequirements || {};
  return {
    order: index + 1,
    id: entry.id,
    taskId: entry.taskId,
    category: entry.category,
    sourceRelativePath: entry.sourceRelativePath,
    sourceModule: entry.sourceModule,
    documentId: entry.documentId,
    pageNumber: entry.pageNumber,
    previewUrl: entry.previewUrl,
    highResPreviewUrl: entry.highResPreviewUrl,
    candidateId: entry.candidateId,
    validationStatus: validationRow.validationStatus || "blocked_missing_reviewer_input",
    readyForOverlayApply: validationRow.readyForOverlayApply === true,
    missingFields: validationRow.missingFields || [],
    riskTermFlags: requirements.riskTermFlags || [],
    qualityLintRules: requirements.qualityLintRules || [],
    uncertainRegions: requirements.uncertainRegions || [],
    candidateSummary: requirements.candidateSummary || "",
    acceptanceCriteria: entry.acceptanceCriteria || [],
    nextGate: entry.nextGate,
    reviewerAction: entry.category === "manual_transcription"
      ? "Inspect preview/high-res preview, then fill human transcription, education-only summary, source-fit/public refs, originality notes, risk rewrite notes, and checklist."
      : "Inspect blank-preview source, choose replacement/unrecoverable decision, attach replacement path or rationale, rerun evidence, and checklist.",
  };
});

const manualRows = taskRows.filter((row) => row.category === "manual_transcription");
const replacementRows = taskRows.filter((row) => row.category === "source_replacement");
const blockedRows = taskRows.filter((row) => row.readyForOverlayApply !== true);
const rowsMissingReviewerIdentity = taskRows.filter((row) =>
  row.missingFields.includes("reviewerName") && row.missingFields.includes("reviewedAt"));

const board = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  boardStatus: "p0_real_reviewer_task_board_ready_all_tasks_blocked",
  boardMode: "reviewer_execution_board_for_blank_owned_copy",
  starterPath,
  draftInputPath: starter.draftInputPath,
  validationPath,
  totalTasks: taskRows.length,
  manualTranscriptionTasks: manualRows.length,
  sourceReplacementTasks: replacementRows.length,
  readyTasks: taskRows.length - blockedRows.length,
  blockedTasks: blockedRows.length,
  rowsMissingReviewerIdentity: rowsMissingReviewerIdentity.length,
  realHumanInputEntries: starter.realHumanInputEntries,
  writeAllowedNow: starter.writeAllowedNow,
  manualAuthorizationRequired: starter.manualAuthorizationRequired,
  groupedCounts: {
    byCategory: {
      manual_transcription: manualRows.length,
      source_replacement: replacementRows.length,
    },
    byDocument: taskRows.reduce((acc, row) => {
      acc[row.documentId] = (acc[row.documentId] || 0) + 1;
      return acc;
    }, {}),
  },
  taskRows,
  commands: [
    `npm.cmd run validate:local-course-p0-human-review-bundle-input-copy -- --input ${starter.draftInputPath} --output-json ${starter.draftValidationJsonPath} --output-md ${starter.draftValidationMdPath}`,
    "npm.cmd run check:local-course-p0-real-reviewer-input-starter",
    "npm.cmd run check:local-course-p0-real-reviewer-task-board",
    "npm.cmd run check:local-course-p0-write-authorization-preview",
  ],
  completionRule: "This task board makes the 22 P0 reviewer tasks executable, but it does not fill reviewer notes, does not complete human review, does not approve learner-facing release, and does not authorize overlay writes.",
  boundary: "P0 real reviewer task board is reviewer-facing education-only operations material. It organizes missing real reviewer input and evidence links; it does not create reviewer judgment, infer private-course content, approve learner-facing release, write overlay changes, provide stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.writeFileSync(outputJson, `${JSON.stringify(board, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Local Course P0 Real Reviewer Task Board",
  "",
  `- Status: ${board.boardStatus}`,
  `- Draft input: \`${board.draftInputPath}\``,
  `- Tasks: ${board.totalTasks}`,
  `- Manual transcription: ${board.manualTranscriptionTasks}`,
  `- Source replacement: ${board.sourceReplacementTasks}`,
  `- Ready: ${board.readyTasks}`,
  `- Blocked: ${board.blockedTasks}`,
  `- Missing reviewer identity: ${board.rowsMissingReviewerIdentity}`,
  `- Write allowed now: ${board.writeAllowedNow}`,
  "",
  "## Tasks",
  "",
  "| # | Task | Category | Source | Page | Missing fields | Preview |",
  "|---:|---|---|---|---:|---|---|",
  ...taskRows.map((row) => `| ${row.order} | ${row.id} | ${row.category} | ${row.sourceRelativePath} | ${row.pageNumber || ""} | ${row.missingFields.join(", ")} | ${row.highResPreviewUrl || row.previewUrl || ""} |`),
  "",
  "## Commands",
  "",
  ...board.commands.map((command) => `- \`${command}\``),
  "",
  "## Boundary",
  "",
  board.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: board.educationOnly,
  productionReady: board.productionReady,
  learnerFacingRelease: board.learnerFacingRelease,
  approvalStatus: board.approvalStatus,
  boardStatus: board.boardStatus,
  totalTasks: board.totalTasks,
  readyTasks: board.readyTasks,
  blockedTasks: board.blockedTasks,
  rowsMissingReviewerIdentity: board.rowsMissingReviewerIdentity,
  realHumanInputEntries: board.realHumanInputEntries,
  writeAllowedNow: board.writeAllowedNow,
  outputJson,
  outputMd,
}, null, 2));
