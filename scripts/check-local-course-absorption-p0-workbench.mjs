import fs from "node:fs";

const workbenchPath = "docs/LOCAL_COURSE_ABSORPTION_P0_WORKBENCH.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const workbench = readJson(workbenchPath);
const tasks = workbench.workbenchTasks || [];

if (workbench.educationOnly !== true) fail("P0 workbench must keep educationOnly:true");
if (workbench.productionReady !== false) fail("P0 workbench must keep productionReady:false");
if (workbench.learnerFacingRelease !== false) fail("P0 workbench must keep learnerFacingRelease:false");
if (workbench.approvalStatus !== "not_approved") fail("P0 workbench must remain not_approved");
if (workbench.workbenchStatus !== "p0_execution_ready") fail(`unexpected workbenchStatus: ${workbench.workbenchStatus}`);
if (workbench.totalP0Tasks !== 22 || tasks.length !== 22) fail(`expected 22 P0 tasks, got ${workbench.totalP0Tasks}/${tasks.length}`);
if (workbench.manualTranscriptionTasks !== 19) fail(`expected 19 manual transcription tasks, got ${workbench.manualTranscriptionTasks}`);
if (workbench.sourceReplacementTasks !== 3) fail(`expected 3 source replacement tasks, got ${workbench.sourceReplacementTasks}`);
if (workbench.completedTasks !== 0 || workbench.openTasks !== 22) fail(`expected 0 completed / 22 open, got ${workbench.completedTasks}/${workbench.openTasks}`);

const ids = new Set();
for (const task of tasks) {
  if (!task.id || ids.has(task.id)) fail(`duplicate or missing task id: ${task.id}`);
  ids.add(task.id);
  if (task.educationOnly !== true || task.productionReady !== false) fail(`${task.id} boundary drift`);
  if (task.learnerFacingRelease !== false || task.approvalStatus !== "not_approved") fail(`${task.id} release gate drift`);
  if (task.priority !== "P0" || task.status !== "open") fail(`${task.id} must remain open P0`);
  if (!["manual_transcription", "source_replacement"].includes(task.category)) fail(`${task.id} invalid P0 category`);
  if (!task.previewPath || !fs.existsSync(task.previewPath)) fail(`${task.id} preview missing`);
  if (task.previewUrl !== `/${task.previewPath.replace(/\\/g, "/")}`) fail(`${task.id} previewUrl drift`);
  if (!Array.isArray(task.fieldSchema) || task.fieldSchema.length < 5) fail(`${task.id} missing field schema`);
  if (!Array.isArray(task.acceptanceCriteria) || task.acceptanceCriteria.length < 4) fail(`${task.id} missing acceptance criteria`);
  if (!Array.isArray(task.nextCommandHints) || task.nextCommandHints.length < 4) fail(`${task.id} missing command hints`);
}

for (const task of tasks.filter((item) => item.category === "manual_transcription")) {
  if (task.workbenchMode !== "manual_visual_transcription") fail(`${task.id} manual workbench mode drift`);
  const fieldById = new Map(task.fieldSchema.map((field) => [field.id, field]));
  if (fieldById.get("humanTranscription")?.value !== "") fail(`${task.id} humanTranscription must start blank`);
  if (fieldById.get("humanSummary")?.value !== "") fail(`${task.id} humanSummary must start blank`);
  if (!Array.isArray(fieldById.get("uncertainWords")?.value) || fieldById.get("uncertainWords").value.length !== 0) {
    fail(`${task.id} uncertainWords must start empty`);
  }
  if (task.nextGate !== "fill_human_transcription_then_source_fit_public_grounding_originality_review") fail(`${task.id} next gate drift`);
}

for (const task of tasks.filter((item) => item.category === "source_replacement")) {
  if (task.workbenchMode !== "source_replacement_intake") fail(`${task.id} replacement workbench mode drift`);
  const fieldById = new Map(task.fieldSchema.map((field) => [field.id, field]));
  if (fieldById.get("replacementSourcePath")?.value !== "") fail(`${task.id} replacementSourcePath must start blank`);
  if (fieldById.get("replacementNote")?.value !== "") fail(`${task.id} replacementNote must start blank`);
  if (fieldById.get("rerunEvidence")?.value !== "") fail(`${task.id} rerunEvidence must start blank`);
  if (task.nextGate !== "replace_or_reexport_source_pdf_before_absorption") fail(`${task.id} next gate drift`);
}

const boundaryText = `${workbench.boundary || ""} ${workbench.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "does not perform ocr",
  "infer missing content",
  "copy private course wording",
  "approve learner-facing release",
  "trading advice",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
]) {
  if (!boundaryText.includes(phrase)) fail(`workbench boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: workbench.educationOnly,
  productionReady: workbench.productionReady,
  learnerFacingRelease: workbench.learnerFacingRelease,
  approvalStatus: workbench.approvalStatus,
  workbenchStatus: workbench.workbenchStatus,
  totalP0Tasks: workbench.totalP0Tasks,
  manualTranscriptionTasks: workbench.manualTranscriptionTasks,
  sourceReplacementTasks: workbench.sourceReplacementTasks,
  completedTasks: workbench.completedTasks,
  openTasks: workbench.openTasks,
}, null, 2));
