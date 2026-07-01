import fs from "node:fs";

const outputJsonPath = "docs/LOCAL_COURSE_ABSORPTION_OPERATOR_QUEUE.json";
const outputMdPath = "docs/LOCAL_COURSE_ABSORPTION_OPERATOR_QUEUE.md";

const paths = {
  readiness: "docs/LOCAL_COURSE_ABSORPTION_READINESS_AUDIT.json",
  manualPack: "docs/LOCAL_COURSE_LOW_EXTRACTION_MANUAL_TRANSCRIPTION_PACK.json",
  sourceReplacementPack: "docs/LOCAL_COURSE_LOW_EXTRACTION_SOURCE_REPLACEMENT_PACK.json",
  sourceQuality: "docs/LOCAL_COURSE_SOURCE_QUALITY_AUDIT.json",
  rewriteBatchIndex: "docs/LOCAL_COURSE_REWRITE_BATCH_INDEX.json",
};

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function requireBoundary(name, data) {
  if (data.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (data.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (data.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (data.approvalStatus !== "not_approved") fail(`${name} must remain not_approved`);
}

function loadRewriteDraftItems(batchIndex) {
  const items = [];
  for (const batch of batchIndex.batches || []) {
    const batchData = readJson(batch.json);
    requireBoundary(batch.batchId || batch.json, batchData);
    for (const draft of batchData.draftItems || []) {
      items.push({ ...draft, batchNumber: batch.batchNumber });
    }
  }
  return items;
}

const readiness = readJson(paths.readiness);
const manualPack = readJson(paths.manualPack);
const sourceReplacementPack = readJson(paths.sourceReplacementPack);
const sourceQuality = readJson(paths.sourceQuality);
const rewriteBatchIndex = readJson(paths.rewriteBatchIndex);

for (const [name, data] of Object.entries({ readiness, manualPack, sourceReplacementPack, sourceQuality, rewriteBatchIndex })) {
  requireBoundary(name, data);
}

const rewriteDraftItems = loadRewriteDraftItems(rewriteBatchIndex);

const manualTasks = (manualPack.transcriptionCards || []).map((card, index) => ({
  id: `absorb_manual_transcription_${String(index + 1).padStart(2, "0")}`,
  category: "manual_transcription",
  priority: "P0",
  status: "open",
  title: `Transcribe visible low-extraction page ${card.documentId} p${card.pageNumber}`,
  documentId: card.documentId,
  sourceId: card.sourceId,
  sourceRelativePath: card.sourceRelativePath,
  sourceModule: card.sourceModule,
  pageNumber: card.pageNumber,
  previewPath: card.previewPath,
  evidencePointer: card.previewPath,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  reviewerInputRequired: ["humanTranscription", "humanSummary", "uncertainWords", "qualityChecklist"],
  acceptanceCriteria: [
    "Human transcription captures visible text and chart labels without inventing missing content.",
    "Unclear areas are flagged instead of guessed.",
    "Summary is education-only and contains no trading advice, signal, return promise, broker workflow, automation, or real-money guidance.",
    "After completion, rerun transcript intake and source-fit/public-grounding/originality review before any learner-facing use.",
  ],
  nextCommandHints: [
    "npm.cmd run build:low-extraction-transcription-work-packs",
    "npm.cmd run check:low-extraction-transcription-work-packs",
    "npm.cmd run build:local-course-absorption-readiness",
    "npm.cmd run check:local-course-absorption-readiness",
  ],
  nextGate: "fill_human_transcription_then_source_fit_public_grounding_originality_review",
}));

const replacementTasks = (sourceReplacementPack.replacementCards || []).map((card, index) => ({
  id: `absorb_source_replacement_${String(index + 1).padStart(2, "0")}`,
  category: "source_replacement",
  priority: "P0",
  status: "open",
  title: `Replace or re-export blank-preview source ${card.documentId}`,
  documentId: card.documentId,
  sourceId: card.sourceId,
  sourceRelativePath: card.sourceRelativePath,
  sourceModule: card.sourceModule,
  pageNumber: card.pageNumber,
  previewPath: card.previewPath,
  evidencePointer: card.previewPath,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  reviewerInputRequired: ["replacementSourcePath", "replacementNote", "rerunEvidence"],
  acceptanceCriteria: [
    "Original PDF or cleaner export is located and verified as the same course source.",
    "Blank preview is replaced by readable preview evidence after rerun.",
    "Harvest, source quality, visual review, transcript intake, and absorption readiness checks are regenerated.",
    "No missing content is inferred from the blank preview.",
  ],
  nextCommandHints: [
    "npm.cmd run harvest:local-investment-course",
    "npm.cmd run build:local-course-source-quality",
    "npm.cmd run build:low-extraction-visual-review",
    "npm.cmd run build:low-extraction-transcript-intake",
    "npm.cmd run check:local-course-absorption-readiness",
  ],
  nextGate: "replace_or_reexport_source_pdf_before_absorption",
}));

const riskyLanguageTasks = (sourceQuality.forbiddenLanguageList || []).map((item, index) => ({
  id: `absorb_risky_language_${String(index + 1).padStart(2, "0")}`,
  category: "risky_language_review",
  priority: "P1",
  status: "open",
  title: `Rewrite risky-language source safely: ${item.documentId || item.id}`,
  documentId: item.id,
  sourceId: item.sourceId,
  sourceRelativePath: item.sourceRelativePath,
  sourceModule: item.sourceModule,
  forbiddenHits: item.forbiddenHits || [],
  evidencePointer: item.sourceRelativePath,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  reviewerInputRequired: ["riskyPhraseDecision", "safeRewriteNote", "approvalReviewer"],
  acceptanceCriteria: [
    "Forbidden or actionable trading language is identified and not copied into learner-facing text.",
    "Rewrite uses neutral education-only framing and describes concepts as historical/classroom examples.",
    "Reviewer confirms no advice, signal, return promise, broker workflow, automation, or real-money guidance remains.",
  ],
  nextCommandHints: [
    "npm.cmd run build:local-course-source-quality",
    "npm.cmd run check:local-course-source-quality",
    "npm.cmd run build:local-course-absorption-readiness",
    "npm.cmd run check:local-course-absorption-readiness",
  ],
  nextGate: "safe_rewrite_and_reviewer_approval",
}));

const refinementTasks = rewriteDraftItems.map((draft, index) => ({
  id: `absorb_reviewer_refinement_${String(index + 1).padStart(3, "0")}`,
  category: "reviewer_refinement",
  priority: "P2",
  status: "open",
  title: `Review local-course-assisted draft ${draft.id}`,
  draftId: draft.id,
  batchId: draft.batchId,
  batchNumber: draft.batchNumber,
  nodeId: draft.nodeId,
  lessonId: draft.lessonId,
  module: draft.module,
  topic: draft.topic,
  sourceRelativePath: draft.localCourseEvidence?.[0]?.sourceRelativePath || "",
  evidencePointer: draft.id,
  localEvidenceCount: (draft.localCourseEvidence || []).length,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  reviewerInputRequired: ["reviewerNote", "sourceFitDecision", "originalityDecision", "publicGroundingDecision"],
  acceptanceCriteria: [
    "Reviewer confirms draft is original education content and does not copy private course wording.",
    "Public source grounding supports the concept without using private PDFs as public citations.",
    "No stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance are introduced.",
    "Separate approval gate is completed before learner-facing release.",
  ],
  nextCommandHints: [
    "npm.cmd run check:local-course-rewrite-review",
    "npm.cmd run check:local-course-refinement-packet",
    "npm.cmd run build:local-course-absorption-readiness",
    "npm.cmd run check:local-course-absorption-readiness",
  ],
  nextGate: "reviewer_refinement_source_fit_originality_and_separate_approval",
}));

const queueItems = [
  ...manualTasks,
  ...replacementTasks,
  ...riskyLanguageTasks,
  ...refinementTasks,
];

const byCategory = queueItems.reduce((acc, item) => {
  acc[item.category] = (acc[item.category] || 0) + 1;
  return acc;
}, {});
const byPriority = queueItems.reduce((acc, item) => {
  acc[item.priority] = (acc[item.priority] || 0) + 1;
  return acc;
}, {});

const queue = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  queueStatus: "open_absorption_blocker_queue",
  readinessStatus: readiness.readinessStatus,
  sourceRoot: readiness.sourceRoot,
  totalTasks: queueItems.length,
  openTasks: queueItems.filter((item) => item.status === "open").length,
  blockedLearnerFacingRelease: true,
  byCategory,
  byPriority,
  firstP0Tasks: queueItems.filter((item) => item.priority === "P0").slice(0, 12),
  queueItems,
  sourceReports: paths,
  completionRule: "This queue is complete only when all tasks are cleared, the readiness audit no longer reports manual transcription/source replacement/risky-language/refinement blockers, source-fit/public-grounding/originality review passes, and learnerFacingRelease remains false until a separate approval artifact explicitly changes it.",
  boundary: "Local course absorption operator queue is internal education-only workflow management. It does not approve learner-facing release, infer missing PDF content, copy private course wording, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(queue, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course Absorption Operator Queue",
  "",
  "Action queue for clearing blockers before local private course content can be absorbed into learner-facing course knowledge.",
  "",
  `- Queue status: ${queue.queueStatus}`,
  `- Readiness status: ${queue.readinessStatus}`,
  `- Total tasks: ${queue.totalTasks}`,
  `- Open tasks: ${queue.openTasks}`,
  `- P0 tasks: ${queue.byPriority.P0 || 0}`,
  `- P1 tasks: ${queue.byPriority.P1 || 0}`,
  `- P2 tasks: ${queue.byPriority.P2 || 0}`,
  `- Learner-facing release: ${queue.learnerFacingRelease}`,
  "",
  "## Category Counts",
  "",
  "| Category | Count |",
  "| --- | ---: |",
  ...Object.entries(byCategory).map(([category, count]) => `| ${category} | ${count} |`),
  "",
  "## First P0 Tasks",
  "",
  "| Task | Category | Source | Page | Next gate |",
  "| --- | --- | --- | ---: | --- |",
  ...queue.firstP0Tasks.map((item) => `| ${item.id} | ${item.category} | ${item.sourceRelativePath || item.documentId || ""} | ${item.pageNumber || ""} | ${item.nextGate} |`),
  "",
  "## Completion Rule",
  "",
  queue.completionRule,
  "",
  "## Boundary",
  "",
  queue.boundary,
  "",
].join("\n"), "utf8");

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
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
