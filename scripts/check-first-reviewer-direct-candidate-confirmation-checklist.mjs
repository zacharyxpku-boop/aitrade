import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const outputJson = "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_CONFIRMATION_CHECKLIST.json";
const outputMd = "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_CONFIRMATION_CHECKLIST.md";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";

const paths = {
  dryRunPacket: "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json",
  sourceRoleDecisionTable: "docs/FIRST_REVIEWER_SOURCE_ROLE_DECISION_TABLE.json",
  noteReadinessMatrix: "docs/FIRST_REVIEWER_NOTE_READINESS_MATRIX.json",
  progressDashboard: "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.json",
  greenGrounding: "docs/GREEN_SOURCE_GROUNDING.json",
};

const FAMILY_RULES = {
  BEA: {
    defaultRole: "macro_data_boundary_until_confirmed",
    confirmIf: [
      "The lesson claim is specifically about reading BEA data definitions, release timing, or macro-data interpretation.",
      "The source title and metadata directly match the lesson claim without needing copied source body text.",
      "The rewritten lesson keeps the source as data-context education, not chart-pattern proof.",
    ],
    downgradeIf: [
      "The lesson claim is about price-action mechanics, liquidity sweeps, entries, exits, or chart prediction.",
      "The BEA source only provides API/data access context rather than direct support for the lesson topic.",
      "The reviewer would need to infer a market direction or trading rule from the source.",
    ],
    allowedUse: "Use as macro-data definition, release-reading, API/data-boundary, or source-literacy context after human confirmation.",
    disallowedUse: "Do not use as proof of chart patterns, liquidity sweeps, entries/exits, signals, or market direction.",
  },
  BLS: {
    defaultRole: "macro_data_boundary_until_confirmed",
    confirmIf: [
      "The lesson claim is specifically about BLS data definitions, release interpretation, or economic-data literacy.",
      "The source title and metadata directly support the lesson context without copied source body text.",
      "The rewritten lesson keeps the source as macro-data context, not a trading setup validator.",
    ],
    downgradeIf: [
      "The lesson claim is about chart behavior, liquidity sweeps, prediction, or tactical entries/exits.",
      "The BLS source only offers macro-data context and not direct support for the chart lesson.",
      "The proposed note converts economic data into a directional or performance implication.",
    ],
    allowedUse: "Use as macro-data definition, release-reading, and economic-source literacy context after human confirmation.",
    disallowedUse: "Do not use as chart-pattern authority, signal support, return implication, or real-money decision input.",
  },
  CFTC: {
    defaultRole: "fraud_or_market_boundary_until_confirmed",
    confirmIf: [
      "The lesson claim is specifically about fraud red flags, phony systems, AI trading bot risks, commodity-product risk, or market-surveillance literacy.",
      "The source title and metadata directly match the lesson claim without needing copied source body text.",
      "The rewrite frames the source as investor-protection or market-oversight education, not a trade rule.",
    ],
    downgradeIf: [
      "The lesson claim is about chart prediction, timeframe reading, liquidity sweeps, entries, exits, or profitability.",
      "The CFTC source only supports a safety boundary and not the lesson's explanatory claim.",
      "The reviewer would need to turn a fraud/oversight warning into tactical trading advice.",
    ],
    allowedUse: "Use as fraud, market-risk, commodity-product, AI-bot-risk, or oversight boundary context after human confirmation.",
    disallowedUse: "Do not use as chart-pattern authority, trading-signal support, system endorsement, or performance evidence.",
  },
  SEC: {
    defaultRole: "filing_or_data_boundary_until_confirmed",
    confirmIf: [
      "The lesson claim is specifically about SEC data access, filing literacy, disclosure source boundaries, or official metadata use.",
      "The source title and metadata directly match the source-literacy claim without copied source body text.",
      "The rewrite keeps the source as filing/data-access context rather than price-action proof.",
    ],
    downgradeIf: [
      "The lesson claim is about chart mechanics, liquidity sweeps, entries/exits, prediction, or outcome expectations.",
      "The SEC source only proves official data access exists and not the lesson's price-action claim.",
      "The proposed note uses SEC developer resources as trading evidence.",
    ],
    allowedUse: "Use as filing literacy, official-data access, disclosure-boundary, or source-boundary context after human confirmation.",
    disallowedUse: "Do not use as chart-pattern authority, signal support, performance proof, or trade-decision guidance.",
  },
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

function markdown(report) {
  const lines = [
    "# First Reviewer Direct Candidate Confirmation Checklist",
    "",
    "This checklist isolates the source refs that could be mistaken for direct lesson evidence.",
    "Every row still requires human confirmation and may need to be downgraded to boundary-only context.",
    "",
    "## Summary",
    "",
    `- Target batches: ${report.targetBatches.join(", ")}`,
    `- Direct candidates: ${report.directCandidates}`,
    `- Source refs to inspect: ${report.sourceRefsToInspect}`,
    `- Green source leaks: ${report.nonGreenRefs}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Candidate Rows",
    "",
  ];

  for (const row of report.rows) {
    lines.push(
      `- ${row.batchId} / ${row.lessonId} / ${row.family}: ${row.confirmationStatus}`,
      `  - Topic: ${row.module} / ${row.topic}`,
      `  - Default role: ${row.defaultRole}`,
      `  - Allowed use: ${row.allowedUse}`,
      `  - Disallowed use: ${row.disallowedUse}`,
      `  - Confirm if: ${row.confirmIf.join(" | ")}`,
      `  - Downgrade if: ${row.downgradeIf.join(" | ")}`,
      `  - Source refs: ${row.sourceRefs.map((ref) => `${ref.sourceId} ${ref.name}`).join("; ")}`,
    );
  }

  lines.push(
    "",
    "## Stop Conditions",
    "",
    ...report.stopConditions.map((condition) => `- ${condition}`),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  );

  return lines.join("\n");
}

const [
  dryRunPacket,
  sourceRoleDecisionTable,
  noteReadinessMatrix,
  progressDashboard,
  greenGrounding,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.dryRunPacket),
  readJson(paths.sourceRoleDecisionTable),
  readJson(paths.noteReadinessMatrix),
  readJson(paths.progressDashboard),
  readJson(paths.greenGrounding),
  exists(realStatusPath),
]);

for (const [label, report] of Object.entries({
  dryRunPacket,
  sourceRoleDecisionTable,
  noteReadinessMatrix,
  progressDashboard,
})) {
  assertEnvelope(report, label);
}
if (greenGrounding.educationOnly !== true) fail("green grounding must keep educationOnly true");
if (greenGrounding.productionReady !== false) fail("green grounding must keep productionReady false");

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; direct-candidate checklist must not depend on real notes`);
if (!dryRunPacket.requiredFiles.some((file) => file.path === outputMd)) fail("dry-run packet must include the direct-candidate checklist file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-direct-candidate-confirmation-checklist")) fail("dry-run packet must include the direct-candidate checklist command");
if (!progressDashboard.fileOrder.some((file) => file.path === outputMd)) fail("progress dashboard must include the direct-candidate checklist file");
if (!progressDashboard.requiredCommands.includes("npm.cmd run check:first-reviewer-direct-candidate-confirmation-checklist")) fail("progress dashboard must include the direct-candidate checklist command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Direct-candidate confirmation")) fail("progress dashboard must include direct-candidate confirmation status");
if (sourceRoleDecisionTable.directCandidatesNeedingConfirmation !== 5) fail("source-role table must expose 5 direct candidates");
if (noteReadinessMatrix.directCandidatesToConfirm !== 5 || noteReadinessMatrix.prefilledNoteFields !== 0) fail("note readiness matrix must keep 5 direct candidates and 0 prefilled notes");
if (progressDashboard.directCandidatesToConfirm !== 5 || progressDashboard.realReadyBatches !== 0) fail("progress dashboard must keep 5 direct candidates and 0 ready batches");
if (greenGrounding.badGroundingRefs !== 0) fail("green grounding must keep 0 bad grounding refs");

const rows = [];
let sourceRefsToInspect = 0;
let nonGreenRefs = 0;

for (const lesson of sourceRoleDecisionTable.lessonRows) {
  for (const role of lesson.sourceFamilyRoles) {
    if (role.suggestedRole !== "direct_candidate_needs_human_confirmation") continue;
    const rules = FAMILY_RULES[role.family];
    if (!rules) fail(`missing family rules for ${role.family}`);
    const sourceRefs = role.sourceRefsToInspect || [];
    if (sourceRefs.length < 1) fail(`${lesson.lessonId}/${role.family} must include source refs to inspect`);
    for (const ref of sourceRefs) {
      sourceRefsToInspect += 1;
      if (ref.sourceUseTier !== "green_official_public_domain" && ref.sourceUseTier !== "green_public_domain_classic") {
        nonGreenRefs += 1;
      }
      if (ref.reliabilityGrade !== "S" && ref.reliabilityGrade !== "A") fail(`${ref.sourceId} must remain high-reliability`);
    }
    rows.push({
      lessonId: lesson.lessonId,
      batchId: lesson.batchId,
      module: lesson.module,
      topic: lesson.topic,
      riskLevel: lesson.riskLevel,
      family: role.family,
      confirmationStatus: "needs_human_confirmation_or_downgrade",
      defaultRole: rules.defaultRole,
      confirmIf: rules.confirmIf,
      downgradeIf: rules.downgradeIf,
      allowedUse: rules.allowedUse,
      disallowedUse: rules.disallowedUse,
      requiredReviewerNoteField: "sourceFitNotes",
      sourceRefs: sourceRefs.map((ref) => ({
        sourceId: ref.sourceId,
        name: ref.name,
        url: ref.url,
        sourceUseTier: ref.sourceUseTier,
        reliabilityGrade: ref.reliabilityGrade,
        relevanceSignal: ref.relevanceSignal,
      })),
      mustRemainStructuralDraft: lesson.mustRemainStructuralDraft,
      learnerFacingUseAllowedNow: false,
    });
  }
}

if (rows.length !== 5) fail(`expected 5 direct-candidate rows, found ${rows.length}`);
if (nonGreenRefs !== 0) fail(`expected 0 non-green direct-candidate refs, found ${nonGreenRefs}`);
if (!rows.every((row) => row.mustRemainStructuralDraft === true)) fail("all direct-candidate lessons must remain structural draft");

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  targetBatches: sourceRoleDecisionTable.targetBatches,
  directCandidates: rows.length,
  sourceRefsToInspect,
  nonGreenRefs,
  realStatusPath,
  realStatusOverlayPresent,
  rows,
  stopConditions: [
    "Stop if a reviewer treats a direct candidate as approved without filling sourceFitNotes from real review work.",
    "Stop if any candidate requires copied external source body text to support the lesson claim.",
    "Stop if any source is used for buy/sell/hold advice, trading signals, broker/order workflow, automation, performance claims, or real-money guidance.",
    "Stop if macro-data, filing, fraud, or oversight sources are used as chart-pattern proof.",
    "Stop if yellow, red, or research_only sources are proposed as learner-facing evidence.",
    "Stop if any row changes lesson grade, approvalStatus, learnerFacingRelease, or productionReady.",
  ],
  sourceReports: paths,
  boundary: "This checklist is reviewer-facing source-fit scaffolding only. It does not approve direct source use, fill human notes, create docs/LESSON_BATCH_REVIEW_STATUS.json, publish learner-facing content, change lesson grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  targetBatches: report.targetBatches,
  directCandidates: report.directCandidates,
  sourceRefsToInspect: report.sourceRefsToInspect,
  nonGreenRefs: report.nonGreenRefs,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  outputJson,
  outputMd,
}, null, 2));
