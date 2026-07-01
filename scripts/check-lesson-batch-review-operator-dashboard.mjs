import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/LESSON_BATCH_REVIEW_OPERATOR_DASHBOARD.json";
const outputMd = "docs/LESSON_BATCH_REVIEW_OPERATOR_DASHBOARD.md";
const paths = {
  coverage: "docs/LESSON_BATCH_PACKET_COVERAGE.json",
  workbench: "docs/LESSON_REWRITE_WORKBENCH.json",
  sourceFitRisk: "docs/LESSON_SOURCE_FIT_RISK_SUMMARY.json",
};
const batchIds = ["rewrite_batch_01", "rewrite_batch_02", "rewrite_batch_03", "rewrite_batch_04", "rewrite_batch_05", "rewrite_batch_06", "rewrite_batch_07", "rewrite_batch_08"];
const noteFields = ["originalRewriteNotes", "sourceFitNotes", "factCheckNotes", "boundaryCheckNotes", "copyingRiskNotes", "humanReviewerInitials"];

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

function countBy(items, keyFn) {
  return items.reduce((counts, item) => {
    const key = keyFn(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function riskRank(riskLevel) {
  return { high: 0, medium: 1, low: 2 }[riskLevel] ?? 9;
}

function batchAction(row) {
  if (row.riskCounts.high > 0) return "resolve_high_risk_source_fit_before_any_rewrite";
  if (row.riskCounts.medium >= 4) return "complete_medium_heavy_source_fit_notes_before_rewrite";
  if (row.riskCounts.medium > 0) return "complete_targeted_source_fit_notes_then_rewrite";
  return "queue_for_low_risk_fast_pass_human_rewrite";
}

function lessonAction(row) {
  if (row.riskLevel === "high") return "inspect_source_family_mismatch_and_block_or_downgrade";
  if (row.riskLevel === "medium") return "write_source_fit_downgrade_or_boundary_note";
  return "confirm_green_only_no_copy_no_advice_before_rewrite";
}

function sourceFamilyRole(family) {
  const normalized = family.toLowerCase();
  if (normalized.includes("investor.gov") || normalized.includes("cftc") || normalized.includes("consumerfinance")) {
    return "investor/consumer/fraud-risk boundary only; never chart, signal, forecast, or performance proof";
  }
  if (normalized.includes("sec") || normalized.includes("federalregister") || normalized.includes("financialresearch")) {
    return "regulatory/disclosure/systemic-risk context only; no trading-system validation";
  }
  if (normalized.includes("bls") || normalized.includes("bea") || normalized.includes("federal reserve") || normalized.includes("treasury") || normalized.includes("census") || normalized.includes("eia") || normalized.includes("dol.gov")) {
    return "macro/data/event-timing literacy only; no market-direction, chart, or candle proof";
  }
  if (normalized.includes("project gutenberg") || normalized.includes("internet archive")) {
    return "public-domain historical language/observation context only; strip buy/sell rules and profit voice";
  }
  if (normalized.includes("nist")) return "process/model-risk boundary only; no trading-system certification";
  return "boundary-only until a human reviewer confirms direct, safe, licensed use";
}

function validateDryRunNotes(dryRun) {
  if (dryRun.blankNoteFields !== 36) fail(`${dryRun.batchId} must keep 36 blank note fields`);
  if (dryRun.filledNoteFields !== 0) fail(`${dryRun.batchId} must keep filled note fields at 0`);
  if (dryRun.approvalReviewCandidates !== 0) fail(`${dryRun.batchId} cannot create approval candidates`);
  if (dryRun.commercialReadyPromotions !== 0) fail(`${dryRun.batchId} cannot promote commercial readiness`);
  if (dryRun.negativeCasesPassed !== dryRun.negativeCases) fail(`${dryRun.batchId} dry-run negative cases must all pass`);
  for (const card of dryRun.dryRunOverlay?.lessonCards || []) {
    if (card.trackingStatus !== "not_started") fail(`${card.lessonId} must remain not_started in dry-run`);
    if (card.currentGrade !== "structural_draft") fail(`${card.lessonId} must remain structural_draft in dry-run`);
    for (const field of noteFields) {
      if (card[field] !== "") fail(`${card.lessonId}.${field} must remain blank in dry-run`);
    }
  }
}

function markdown(report) {
  return [
    "# Lesson Batch Review Operator Dashboard",
    "",
    "This dashboard is the all-batch operator entrypoint after dedicated editor packets reached 8/8 coverage.",
    "It coordinates human review work across all 48 workbench lessons without creating real review evidence, approval, release, grade promotion, or production readiness.",
    "",
    "## Summary",
    "",
    `- Dashboard ready: ${report.dashboardReady}`,
    `- Operator mode: ${report.operatorMode}`,
    `- Rewrite batches: ${report.rewriteBatches}`,
    `- Lesson cards: ${report.lessonCards}`,
    `- Dedicated editor packets: ${report.dedicatedEditorPackets}`,
    `- Dedicated notes dry-runs: ${report.dedicatedNotesDryRuns}`,
    `- Fully covered batches: ${report.fullyCoveredBatches}`,
    `- Blank note fields: ${report.blankNoteFields}`,
    `- Filled note fields: ${report.filledNoteFields}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Approval review candidates: ${report.approvalReviewCandidates}`,
    `- Commercial-ready promotions: ${report.commercialReadyPromotions}`,
    `- Next manual action: ${report.nextManualAction}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Batch Operations",
    "",
    "| Batch | Risk mix | Lessons | Packet | Notes dry-run | Manual action | Source families |",
    "| --- | --- | ---: | --- | --- | --- | --- |",
    ...report.batchRows.map((row) => `| ${row.batchId} | H:${row.riskCounts.high || 0} M:${row.riskCounts.medium || 0} L:${row.riskCounts.low || 0} | ${row.lessonCards} | ${row.editorPacketReady} | ${row.notesDryRunReady} | ${row.manualAction} | ${row.sourceFamilies.join(", ")} |`),
    "",
    "## Lesson Review Queue",
    "",
    "| Lesson | Batch | Risk | Module | Topic | Manual action | Required blank notes |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...report.lessonRows.map((row) => `| ${row.lessonId} | ${row.batchId} | ${row.riskLevel} | ${row.module} | ${row.topic} | ${row.manualAction} | ${row.requiredNoteFields.join(", ")} |`),
    "",
    "## Source Family Roles",
    "",
    "| Source family | Reviewer use |",
    "| --- | --- |",
    ...report.sourceFamilyRows.map((row) => `| ${row.family} | ${row.reviewerUse} |`),
    "",
    "## Operator Rules",
    "",
    ...report.operatorRules.map((rule) => `- ${rule}`),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const [coverage, workbench, sourceFitRisk, realStatusOverlayPresent] = await Promise.all([
  readJson(paths.coverage),
  readJson(paths.workbench),
  readJson(paths.sourceFitRisk),
  exists(realStatusPath),
]);

assertEnvelope(coverage, "batch packet coverage");
assertEnvelope(workbench, "lesson rewrite workbench");
assertEnvelope(sourceFitRisk, "source fit risk summary");
if (coverage.coverageReady !== true) fail("coverage must be ready");
if (coverage.fullyCoveredBatches !== 8 || coverage.uncoveredBatches !== 0) fail("dashboard requires 8/8 packet coverage");
if (coverage.nextRecommendedBatch !== null) fail("dashboard expects no remaining packet batch");
if (workbench.items?.length !== 48) fail("workbench must expose 48 lesson items");
if (sourceFitRisk.rows?.length !== 48) fail("source fit risk summary must expose 48 rows");
if (sourceFitRisk.greenSourceLeaks !== 0) fail("source fit risk summary has green-source leaks");
if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; dashboard is pre-write only`);

const riskByLesson = new Map(sourceFitRisk.rows.map((row) => [row.lessonId, row]));
const batchCoverageById = new Map(coverage.batchRows.map((row) => [row.batchId, row]));
const batchGuideById = new Map(workbench.batchReviewGuide.batches.map((row) => [row.batchId, row]));

const editorPackets = new Map();
const notesDryRuns = new Map();
for (const batchId of batchIds) {
  const suffix = batchId.replace("rewrite_batch_", "");
  const editor = await readJson(`docs/LESSON_BATCH_${suffix}_EDITOR_PACKET.json`);
  const dryRun = await readJson(`docs/LESSON_BATCH_${suffix}_REVIEW_NOTES_DRY_RUN.json`);
  assertEnvelope(editor, `${batchId} editor packet`);
  assertEnvelope(dryRun, `${batchId} notes dry-run`);
  if (editor.batchId !== batchId || dryRun.batchId !== batchId) fail(`${batchId} packet/dry-run batch mismatch`);
  if (editor.packetReady !== true || dryRun.dryRunReady !== true) fail(`${batchId} packet and dry-run must be ready`);
  if (editor.nonGreenRefs !== 0 || editor.handAuthoredLessons !== 0 || editor.commercialReadyPromotions !== 0) fail(`${batchId} editor packet boundary drift`);
  validateDryRunNotes(dryRun);
  editorPackets.set(batchId, editor);
  notesDryRuns.set(batchId, dryRun);
}

const lessonRows = workbench.items.map((item) => {
  const risk = riskByLesson.get(item.lessonId);
  if (!risk) fail(`${item.lessonId} missing source-fit risk row`);
  if (item.currentGrade !== "structural_draft" || item.handAuthored !== false) fail(`${item.lessonId} must remain generated structural_draft`);
  if (item.educationOnly !== true || item.productionReady !== false) fail(`${item.lessonId} boundary changed`);
  const refs = [...(item.greenReviewedSources || []), ...(item.greenAuthoritySources || [])];
  const nonGreenRefs = refs.filter((source) => !String(source.sourceUseTier || "").startsWith("green_"));
  if (nonGreenRefs.length) fail(`${item.lessonId} has non-green refs`);
  return {
    lessonId: item.lessonId,
    nodeId: item.nodeId,
    batchId: risk.batchId,
    module: item.module,
    topic: item.topic,
    riskLevel: risk.riskLevel,
    riskReasons: risk.riskReasons || [],
    sourceFamilies: item.sourceFamilies || [],
    currentGrade: item.currentGrade,
    handAuthored: item.handAuthored,
    requiredNoteFields: noteFields,
    manualAction: lessonAction(risk),
    nonGreenRefs: nonGreenRefs.length,
    approvalStatus: "not_approved",
    learnerFacingRelease: false,
  };
}).sort((a, b) => riskRank(a.riskLevel) - riskRank(b.riskLevel) || a.batchId.localeCompare(b.batchId) || a.lessonId.localeCompare(b.lessonId));

const batchRows = batchIds.map((batchId) => {
  const coverageRow = batchCoverageById.get(batchId);
  const guideRow = batchGuideById.get(batchId);
  const editor = editorPackets.get(batchId);
  const dryRun = notesDryRuns.get(batchId);
  const rows = lessonRows.filter((row) => row.batchId === batchId);
  if (!coverageRow || !guideRow || !editor || !dryRun) fail(`${batchId} missing dashboard inputs`);
  if (rows.length !== 6 || guideRow.itemCount !== 6 || editor.lessonCards.length !== 6 || dryRun.lessonCards !== 6) fail(`${batchId} must keep six lesson cards everywhere`);
  const riskCounts = countBy(rows, (row) => row.riskLevel);
  return {
    batchId,
    lessonCards: rows.length,
    modules: guideRow.modules,
    sourceFamilies: uniq(rows.flatMap((row) => row.sourceFamilies)),
    riskCounts: { high: riskCounts.high || 0, medium: riskCounts.medium || 0, low: riskCounts.low || 0 },
    editorPacketReady: editor.packetReady,
    notesDryRunReady: dryRun.dryRunReady,
    blankNoteFields: dryRun.blankNoteFields,
    filledNoteFields: dryRun.filledNoteFields,
    manualAction: batchAction({ riskCounts: { high: riskCounts.high || 0, medium: riskCounts.medium || 0, low: riskCounts.low || 0 } }),
    approvalStatus: coverageRow.approvalStatus,
    learnerFacingRelease: coverageRow.learnerFacingRelease,
  };
});

const sourceFamilies = uniq(lessonRows.flatMap((row) => row.sourceFamilies));
const blankNoteFields = [...notesDryRuns.values()].reduce((sum, row) => sum + row.blankNoteFields, 0);
const filledNoteFields = [...notesDryRuns.values()].reduce((sum, row) => sum + row.filledNoteFields, 0);

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  dashboardReady: true,
  operatorMode: "all_batch_pre_write_reviewer_dashboard_only",
  realStatusPath,
  realStatusOverlayPresent,
  rewriteBatches: batchRows.length,
  lessonCards: lessonRows.length,
  dedicatedEditorPackets: coverage.dedicatedEditorPackets,
  dedicatedNotesDryRuns: coverage.dedicatedNotesDryRuns,
  fullyCoveredBatches: coverage.fullyCoveredBatches,
  uncoveredBatches: coverage.uncoveredBatches,
  riskCounts: countBy(lessonRows, (row) => row.riskLevel),
  blankNoteFields,
  filledNoteFields,
  approvalReviewCandidates: 0,
  commercialReadyPromotions: 0,
  handAuthoredClaims: 0,
  nonGreenRefs: lessonRows.reduce((sum, row) => sum + row.nonGreenRefs, 0),
  nextManualAction: "start_human_source_fit_notes_from_high_risk_batches_then_medium_then_low_without_approval_or_release",
  batchRows,
  lessonRows,
  sourceFamilyRows: sourceFamilies.map((family) => ({ family, reviewerUse: sourceFamilyRole(family) })),
  operatorRules: [
    "Use this dashboard as an all-batch orientation map after packet coverage reaches 8/8.",
    "Record real notes only in a deliberately created human-review overlay; generated dry-runs must stay blank.",
    "Resolve high-risk rows before medium and low rows.",
    "Use editor packets for source-fit, license, rewrite, and checklist guidance; do not copy packet text into learner-facing prose.",
    "Keep every generated lesson structural_draft and not_approved until separate human rewrite, fact-check, and approval review exist.",
    "Do not treat this dashboard as internal-trial readiness, launch readiness, commercial readiness, or production readiness.",
  ],
  sourceReports: {
    coverage: paths.coverage,
    workbench: paths.workbench,
    sourceFitRisk: paths.sourceFitRisk,
  },
  boundary: "This all-batch operator dashboard is reviewer-facing operations scaffolding only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, confirm source use, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, grant internal-trial readiness, or make the product production-ready.",
};

if (report.rewriteBatches !== 8 || report.lessonCards !== 48) fail("dashboard must cover all 8 batches and 48 lessons");
if (report.dedicatedEditorPackets !== 8 || report.dedicatedNotesDryRuns !== 8 || report.fullyCoveredBatches !== 8 || report.uncoveredBatches !== 0) fail("dashboard must preserve 8/8 packet coverage");
if (report.blankNoteFields !== 288 || report.filledNoteFields !== 0) fail("dashboard must preserve 288 blank fields and 0 filled fields");
if (report.nonGreenRefs !== 0 || report.handAuthoredClaims !== 0 || report.approvalReviewCandidates !== 0 || report.commercialReadyPromotions !== 0) fail("dashboard boundary counts drifted");

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  dashboardReady: report.dashboardReady,
  operatorMode: report.operatorMode,
  rewriteBatches: report.rewriteBatches,
  lessonCards: report.lessonCards,
  dedicatedEditorPackets: report.dedicatedEditorPackets,
  dedicatedNotesDryRuns: report.dedicatedNotesDryRuns,
  fullyCoveredBatches: report.fullyCoveredBatches,
  uncoveredBatches: report.uncoveredBatches,
  blankNoteFields: report.blankNoteFields,
  filledNoteFields: report.filledNoteFields,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  nonGreenRefs: report.nonGreenRefs,
  approvalReviewCandidates: report.approvalReviewCandidates,
  commercialReadyPromotions: report.commercialReadyPromotions,
  outputJson,
  outputMd,
}, null, 2));
