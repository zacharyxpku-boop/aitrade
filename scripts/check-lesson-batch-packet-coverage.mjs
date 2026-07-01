import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const outputJson = "docs/LESSON_BATCH_PACKET_COVERAGE.json";
const outputMd = "docs/LESSON_BATCH_PACKET_COVERAGE.md";
const paths = {
  workbench: "docs/LESSON_REWRITE_WORKBENCH.json",
  sourceFitRisk: "docs/LESSON_SOURCE_FIT_RISK_SUMMARY.json",
};
const DEDICATED_PACKET_BATCHES = ["rewrite_batch_01", "rewrite_batch_02", "rewrite_batch_03", "rewrite_batch_04", "rewrite_batch_05", "rewrite_batch_06", "rewrite_batch_07", "rewrite_batch_08"];

function fail(message) {
  throw new Error(message);
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function assertEnvelope(record, label) {
  if (record.educationOnly !== true) fail(`${label} must keep educationOnly true`);
  if (record.productionReady !== false) fail(`${label} must keep productionReady false`);
  if (record.expectedOutcome !== EXPECTED_OUTCOME) fail(`${label} expectedOutcome changed`);
}

function assertReviewScaffoldEnvelope(record, label) {
  assertEnvelope(record, label);
  if (record.learnerFacingRelease !== false) fail(`${label} cannot be learner-facing release`);
  if (record.approvalStatus !== "not_approved") fail(`${label} must stay not_approved`);
  if (record.nonGreenRefs !== 0) fail(`${label} must keep nonGreenRefs 0`);
  if (record.handAuthoredLessons !== 0) fail(`${label} must not claim hand-authored lessons`);
  if (record.commercialReadyPromotions !== 0) fail(`${label} must not promote commercial readiness`);
}

function assertDryRunEnvelope(record, label) {
  assertEnvelope(record, label);
  if (record.learnerFacingRelease !== false) fail(`${label} cannot be learner-facing release`);
  if (record.approvalStatus !== "not_approved") fail(`${label} must stay not_approved`);
  if (record.dryRunReady !== true) fail(`${label} must be dry-run ready`);
  if (record.filledNoteFields !== 0) fail(`${label} must keep filled note fields at 0`);
  if (record.blankNoteFields !== 36) fail(`${label} must keep 36 blank note fields`);
  if (record.approvalReviewCandidates !== 0) fail(`${label} cannot create approval review candidates`);
  if (record.commercialReadyPromotions !== 0) fail(`${label} cannot promote commercial readiness`);
  if (record.negativeCasesPassed !== record.negativeCases) fail(`${label} must pass all negative cases`);
}

function nextActionFor(row) {
  if (row.hasDedicatedEditorPacket && row.hasDedicatedNotesDryRun) {
    return "ready_for_human_editor_packet_use_only";
  }
  if (row.riskCounts.high > 0) {
    return "create_or_refresh_high_risk_editor_packet_before_any_notes";
  }
  if (row.riskCounts.medium >= 4) {
    return "create_medium_heavy_editor_packet_with_source_fit_warnings";
  }
  if (row.riskCounts.medium > 0) {
    return "create_targeted_editor_packet_then_blank_notes_dry_run";
  }
  return "create_low_risk_fast_pass_editor_packet_after_higher_risk_batches";
}

function priorityScore(row) {
  if (row.hasDedicatedEditorPacket && row.hasDedicatedNotesDryRun) return -1;
  return row.riskCounts.high * 100 + row.riskCounts.medium * 10 + row.riskCounts.low;
}

function markdown(report) {
  return [
    "# Lesson Batch Packet Coverage",
    "",
    "This report audits dedicated editor-packet and blank-notes dry-run coverage across the 8 rewrite batches.",
    "It is a reviewer operations map only; it does not create real review evidence, approval, learner-facing release, or grade promotion.",
    "",
    "## Summary",
    "",
    `- Coverage ready: ${report.coverageReady}`,
    `- Rewrite batches: ${report.rewriteBatches}`,
    `- Dedicated editor packets: ${report.dedicatedEditorPackets}`,
    `- Dedicated notes dry-runs: ${report.dedicatedNotesDryRuns}`,
    `- Fully covered batches: ${report.fullyCoveredBatches}`,
    `- Uncovered batches: ${report.uncoveredBatches}`,
    `- Next recommended batch: ${report.nextRecommendedBatch}`,
    `- Approval review candidates: ${report.approvalReviewCandidates}`,
    `- Commercial-ready promotions: ${report.commercialReadyPromotions}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Batch Rows",
    "",
    "| Batch | Dedicated packet | Notes dry-run | Risk mix | Modules | Next action |",
    "| --- | --- | --- | --- | --- | --- |",
    ...report.batchRows.map((row) => `| ${row.batchId} | ${row.hasDedicatedEditorPacket} | ${row.hasDedicatedNotesDryRun} | H:${row.riskCounts.high} M:${row.riskCounts.medium} L:${row.riskCounts.low} | ${row.modules.join(", ")} | ${row.nextAction} |`),
    "",
    "## Next Queue",
    "",
    "| Rank | Batch | Score | Next action |",
    "| ---: | --- | ---: | --- |",
    ...report.nextQueue.map((row, index) => `| ${index + 1} | ${row.batchId} | ${row.priorityScore} | ${row.nextAction} |`),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const workbench = await readJson(paths.workbench);
const sourceFitRisk = await readJson(paths.sourceFitRisk);
assertEnvelope(workbench, "lesson rewrite workbench");
assertEnvelope(sourceFitRisk, "source fit risk summary");
if (workbench.batchReviewGuide?.batches?.length !== 8) fail("workbench must expose 8 rewrite batches");
if (!Array.isArray(sourceFitRisk.rows) || sourceFitRisk.rows.length !== 48) fail("source fit risk summary must expose 48 rows");

const sourceRiskByBatch = new Map();
for (const row of sourceFitRisk.rows) {
  const riskCounts = sourceRiskByBatch.get(row.batchId) || { high: 0, medium: 0, low: 0 };
  const risk = row.riskLevel || "low";
  if (!(risk in riskCounts)) riskCounts[risk] = 0;
  riskCounts[risk] += 1;
  sourceRiskByBatch.set(row.batchId, riskCounts);
}

const verifiedDedicatedPackets = [];
const verifiedDedicatedNotes = [];
for (const batchId of DEDICATED_PACKET_BATCHES) {
  const suffix = batchId.replace("rewrite_batch_", "");
  const editorPath = `docs/LESSON_BATCH_${suffix}_EDITOR_PACKET.json`;
  const notesPath = `docs/LESSON_BATCH_${suffix}_REVIEW_NOTES_DRY_RUN.json`;
  if (!(await exists(editorPath))) fail(`${editorPath} missing`);
  if (!(await exists(notesPath))) fail(`${notesPath} missing`);
  const editorPacket = await readJson(editorPath);
  const notesDryRun = await readJson(notesPath);
  assertReviewScaffoldEnvelope(editorPacket, editorPath);
  assertDryRunEnvelope(notesDryRun, notesPath);
  if (editorPacket.batchId !== batchId || notesDryRun.batchId !== batchId) fail(`${batchId} dedicated reports disagree on batch id`);
  if (editorPacket.lessonCards.length !== 6 || notesDryRun.lessonCards !== 6) fail(`${batchId} reports must cover 6 lesson cards`);
  verifiedDedicatedPackets.push(batchId);
  verifiedDedicatedNotes.push(batchId);
}

const batchRows = workbench.batchReviewGuide.batches.map((batch) => {
  const riskCounts = sourceRiskByBatch.get(batch.batchId) || { high: 0, medium: 0, low: 0 };
  const row = {
    batchId: batch.batchId,
    itemCount: batch.itemCount,
    modules: batch.modules,
    priorityFocus: batch.priorityFocus,
    sourceFamilies: batch.sourceFamilies,
    riskCounts,
    hasDedicatedEditorPacket: verifiedDedicatedPackets.includes(batch.batchId),
    hasDedicatedNotesDryRun: verifiedDedicatedNotes.includes(batch.batchId),
    approvalStatus: batch.approvalStatus,
    learnerFacingRelease: batch.learnerFacingRelease,
    nextAction: "",
  };
  row.nextAction = nextActionFor(row);
  return row;
});
for (const row of batchRows) {
  if (row.itemCount !== 6) fail(`${row.batchId} must keep 6 lesson cards`);
  if (row.approvalStatus !== "not_approved") fail(`${row.batchId} must remain not_approved`);
  if (row.learnerFacingRelease !== false) fail(`${row.batchId} must not be learner-facing release`);
}

const nextQueue = batchRows
  .map((row) => ({ ...row, priorityScore: priorityScore(row) }))
  .filter((row) => row.priorityScore >= 0)
  .sort((a, b) => b.priorityScore - a.priorityScore || a.batchId.localeCompare(b.batchId))
  .map((row) => ({
    batchId: row.batchId,
    priorityScore: row.priorityScore,
    riskCounts: row.riskCounts,
    modules: row.modules,
    nextAction: row.nextAction,
  }));

const fullyCoveredBatches = batchRows.filter((row) => row.hasDedicatedEditorPacket && row.hasDedicatedNotesDryRun).length;
const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  coverageReady: true,
  coverageMode: "reviewer_operations_map_only",
  rewriteBatches: batchRows.length,
  dedicatedEditorPackets: verifiedDedicatedPackets.length,
  dedicatedNotesDryRuns: verifiedDedicatedNotes.length,
  fullyCoveredBatches,
  uncoveredBatches: batchRows.length - fullyCoveredBatches,
  nextRecommendedBatch: nextQueue[0]?.batchId || null,
  batchRows,
  nextQueue,
  approvalReviewCandidates: 0,
  commercialReadyPromotions: 0,
  sourceReports: paths,
  boundary: "This batch packet coverage report is reviewer-facing operations scaffolding only. It does not create real review evidence, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, or make the product production-ready.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  coverageReady: report.coverageReady,
  rewriteBatches: report.rewriteBatches,
  dedicatedEditorPackets: report.dedicatedEditorPackets,
  dedicatedNotesDryRuns: report.dedicatedNotesDryRuns,
  fullyCoveredBatches: report.fullyCoveredBatches,
  uncoveredBatches: report.uncoveredBatches,
  nextRecommendedBatch: report.nextRecommendedBatch,
  approvalReviewCandidates: report.approvalReviewCandidates,
  commercialReadyPromotions: report.commercialReadyPromotions,
  outputJson,
  outputMd,
}, null, 2));
