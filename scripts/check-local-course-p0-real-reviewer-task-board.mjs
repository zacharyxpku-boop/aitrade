import fs from "node:fs";

const boardPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_TASK_BOARD.json";
const boardMdPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_TASK_BOARD.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const board = readJson(boardPath);
if (!fs.existsSync(boardMdPath)) fail(`missing ${boardMdPath}`);

if (board.educationOnly !== true) fail("task board must keep educationOnly:true");
if (board.productionReady !== false) fail("task board must keep productionReady:false");
if (board.learnerFacingRelease !== false) fail("task board must keep learnerFacingRelease:false");
if (board.approvalStatus !== "not_approved") fail("task board must remain not_approved");
if (board.boardStatus !== "p0_real_reviewer_task_board_ready_all_tasks_blocked") fail(`unexpected boardStatus: ${board.boardStatus}`);
if (board.boardMode !== "reviewer_execution_board_for_blank_owned_copy") fail("unexpected boardMode");
if (board.totalTasks !== 22) fail(`expected 22 tasks, got ${board.totalTasks}`);
if (board.manualTranscriptionTasks !== 19) fail(`expected 19 manual tasks, got ${board.manualTranscriptionTasks}`);
if (board.sourceReplacementTasks !== 3) fail(`expected 3 source replacement tasks, got ${board.sourceReplacementTasks}`);
if (board.readyTasks !== 0) fail("blank task board must have 0 ready tasks");
if (board.blockedTasks !== 22) fail("blank task board must block all 22 tasks");
if (board.rowsMissingReviewerIdentity !== 22) fail("all rows must still miss reviewer identity");
if (board.realHumanInputEntries !== 0) fail("task board must not claim real human input");
if (board.writeAllowedNow !== false) fail("task board must not allow writes");
if (board.manualAuthorizationRequired !== true) fail("manual authorization must be required");
if (!Array.isArray(board.taskRows) || board.taskRows.length !== 22) fail("taskRows must contain 22 rows");
if (!Array.isArray(board.commands) || board.commands.length < 4) fail("task board must include command rows");

const manualRows = board.taskRows.filter((row) => row.category === "manual_transcription");
const replacementRows = board.taskRows.filter((row) => row.category === "source_replacement");
if (manualRows.length !== 19) fail("manual task row count drifted");
if (replacementRows.length !== 3) fail("source replacement task row count drifted");
if (!manualRows.every((row) =>
  row.highResPreviewUrl &&
  row.candidateSummary &&
  row.missingFields.includes("humanTranscription") &&
  row.missingFields.includes("humanSummary") &&
  row.missingFields.includes("manualChecklist") &&
  row.qualityLintRules.length >= 4
)) fail("manual task rows must expose high-res previews, candidate summaries, and missing fields");
if (!replacementRows.every((row) =>
  row.missingFields.includes("selectedDecision") &&
  row.missingFields.includes("replacementSourcePath") &&
  row.missingFields.includes("replacementNote") &&
  row.missingFields.includes("rerunEvidence") &&
  row.missingFields.includes("replacementChecklist")
)) fail("replacement task rows must expose replacement missing fields");
if (!board.taskRows.every((row) =>
  row.validationStatus === "blocked_missing_reviewer_input" &&
  row.readyForOverlayApply === false &&
  row.missingFields.includes("reviewerName") &&
  row.missingFields.includes("reviewedAt") &&
  row.acceptanceCriteria.length >= 4
)) fail("all task rows must stay blocked with reviewer identity missing");

const boundaryText = `${board.boundary || ""} ${board.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "does not create reviewer judgment",
  "does not complete human review",
  "approve learner-facing release",
  "write overlay changes",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "real-money guidance",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

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
}, null, 2));
