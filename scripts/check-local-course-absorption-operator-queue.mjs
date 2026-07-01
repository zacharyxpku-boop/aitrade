import fs from "node:fs";

const queuePath = "docs/LOCAL_COURSE_ABSORPTION_OPERATOR_QUEUE.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const queue = readJson(queuePath);
const items = queue.queueItems || [];

if (queue.educationOnly !== true) fail("operator queue must keep educationOnly:true");
if (queue.productionReady !== false) fail("operator queue must keep productionReady:false");
if (queue.learnerFacingRelease !== false) fail("operator queue must keep learnerFacingRelease:false");
if (queue.approvalStatus !== "not_approved") fail("operator queue must remain not_approved");
if (queue.queueStatus !== "open_absorption_blocker_queue") fail(`unexpected queueStatus: ${queue.queueStatus}`);
if (queue.readinessStatus !== "blocked_for_learner_facing_absorption") fail(`unexpected readinessStatus: ${queue.readinessStatus}`);
if (queue.blockedLearnerFacingRelease !== true) fail("queue must explicitly block learner-facing release");

if (queue.totalTasks !== 144 || items.length !== 144) fail(`expected 144 queue items, got ${queue.totalTasks}/${items.length}`);
if (queue.openTasks !== 144) fail(`expected 144 open tasks, got ${queue.openTasks}`);

const expectedCategoryCounts = {
  manual_transcription: 19,
  source_replacement: 3,
  risky_language_review: 2,
  reviewer_refinement: 120,
};
for (const [category, count] of Object.entries(expectedCategoryCounts)) {
  if (queue.byCategory?.[category] !== count) fail(`category ${category} expected ${count}, got ${queue.byCategory?.[category]}`);
  const actual = items.filter((item) => item.category === category).length;
  if (actual !== count) fail(`items category ${category} expected ${count}, got ${actual}`);
}

if (queue.byPriority?.P0 !== 22) fail(`expected 22 P0 tasks, got ${queue.byPriority?.P0}`);
if (queue.byPriority?.P1 !== 2) fail(`expected 2 P1 tasks, got ${queue.byPriority?.P1}`);
if (queue.byPriority?.P2 !== 120) fail(`expected 120 P2 tasks, got ${queue.byPriority?.P2}`);
if (!Array.isArray(queue.firstP0Tasks) || queue.firstP0Tasks.length !== 12) fail("firstP0Tasks must expose 12 queue items");

const ids = new Set();
for (const item of items) {
  if (!item.id || ids.has(item.id)) fail(`duplicate or missing task id: ${item.id}`);
  ids.add(item.id);
  if (item.educationOnly !== true || item.productionReady !== false) fail(`${item.id} boundary drift`);
  if (item.learnerFacingRelease !== false || item.approvalStatus !== "not_approved") fail(`${item.id} release gate drift`);
  if (item.status !== "open") fail(`${item.id} must start open`);
  if (!item.category || !item.priority || !item.title || !item.nextGate) fail(`${item.id} missing task metadata`);
  if (!Array.isArray(item.acceptanceCriteria) || item.acceptanceCriteria.length < 3) fail(`${item.id} missing acceptance criteria`);
  if (!Array.isArray(item.nextCommandHints) || item.nextCommandHints.length < 2) fail(`${item.id} missing command hints`);
  if (!Array.isArray(item.reviewerInputRequired) || item.reviewerInputRequired.length < 2) fail(`${item.id} missing reviewer input fields`);
  if (/buy|sell|win rate|return promise|broker|auto-trading/i.test(item.title)) {
    fail(`${item.id} title contains unsafe trading language`);
  }
}

for (const item of items.filter((task) => task.category === "manual_transcription")) {
  if (item.priority !== "P0") fail(`${item.id} manual task priority drift`);
  if (!item.previewPath || !fs.existsSync(item.previewPath)) fail(`${item.id} preview missing`);
  if (!item.reviewerInputRequired.includes("humanTranscription")) fail(`${item.id} missing humanTranscription input`);
  if (item.nextGate !== "fill_human_transcription_then_source_fit_public_grounding_originality_review") fail(`${item.id} next gate drift`);
}

for (const item of items.filter((task) => task.category === "source_replacement")) {
  if (item.priority !== "P0") fail(`${item.id} replacement task priority drift`);
  if (!item.previewPath || !fs.existsSync(item.previewPath)) fail(`${item.id} preview missing`);
  if (!item.reviewerInputRequired.includes("replacementSourcePath")) fail(`${item.id} missing replacementSourcePath input`);
  if (item.nextGate !== "replace_or_reexport_source_pdf_before_absorption") fail(`${item.id} next gate drift`);
}

for (const item of items.filter((task) => task.category === "risky_language_review")) {
  if (item.priority !== "P1") fail(`${item.id} risky-language task priority drift`);
  if (!Array.isArray(item.forbiddenHits) || item.forbiddenHits.length < 1) fail(`${item.id} missing forbiddenHits`);
  if (item.nextGate !== "safe_rewrite_and_reviewer_approval") fail(`${item.id} next gate drift`);
}

for (const item of items.filter((task) => task.category === "reviewer_refinement")) {
  if (item.priority !== "P2") fail(`${item.id} refinement task priority drift`);
  if (!item.draftId || !item.nodeId || !item.lessonId || !item.module) fail(`${item.id} missing refinement target`);
  if ((item.localEvidenceCount || 0) < 2) fail(`${item.id} needs at least 2 local evidence references`);
  if (item.nextGate !== "reviewer_refinement_source_fit_originality_and_separate_approval") fail(`${item.id} next gate drift`);
}

const boundaryText = `${queue.boundary || ""} ${queue.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "does not approve learner-facing release",
  "infer missing pdf content",
  "copy private course wording",
  "trading advice",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
]) {
  if (!boundaryText.includes(phrase)) fail(`queue boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: queue.educationOnly,
  productionReady: queue.productionReady,
  learnerFacingRelease: queue.learnerFacingRelease,
  approvalStatus: queue.approvalStatus,
  queueStatus: queue.queueStatus,
  totalTasks: queue.totalTasks,
  openTasks: queue.openTasks,
  byCategory: queue.byCategory,
  byPriority: queue.byPriority,
}, null, 2));
