import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_SEQUENCE_CONSISTENCY.json";
const outputMd = "docs/FIRST_REVIEWER_SEQUENCE_CONSISTENCY.md";

const paths = {
  dryRunPacket: "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json",
  progressDashboard: "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.json",
  humanExecutionBundle: "docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.json",
  operatorIndex: "docs/FIRST_REVIEWER_OPERATOR_INDEX.json",
  postWriteCommandPack: "docs/FIRST_REVIEWER_POST_WRITE_COMMAND_PACK.json",
  prewriteSampleDossier: "docs/FIRST_REVIEWER_PREWRITE_SAMPLE_DOSSIER.json",
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

function checkOrder(name, rows) {
  if (!Array.isArray(rows) || rows.length === 0) fail(`${name} must have ordered rows`);
  const orderValues = rows.map((row) => row.order);
  const duplicateOrders = orderValues.filter((order, index) => orderValues.indexOf(order) !== index);
  const missingOrders = [];
  for (let order = 1; order <= rows.length; order += 1) {
    if (!orderValues.includes(order)) missingOrders.push(order);
  }
  const nonNumericOrders = orderValues.filter((order) => !Number.isInteger(order));
  const passed = duplicateOrders.length === 0 && missingOrders.length === 0 && nonNumericOrders.length === 0;
  if (!passed) {
    fail(`${name} order is not contiguous: duplicates=${duplicateOrders.join(",") || "none"} missing=${missingOrders.join(",") || "none"} nonNumeric=${nonNumericOrders.join(",") || "none"}`);
  }
  return {
    name,
    rows: rows.length,
    firstOrder: orderValues[0],
    lastOrder: orderValues.at(-1),
    duplicateOrders,
    missingOrders,
    passed,
  };
}

function hasFile(list, filePath) {
  return list.some((row) => row.path === filePath || row.file === filePath || row.primaryFile === filePath);
}

function markdown(report) {
  return [
    "# First Reviewer Sequence Consistency",
    "",
    "This report checks that first-reviewer operator files have contiguous execution order and cross-links.",
    "It is an operations consistency gate only; it does not create notes, approve lessons, publish learner-facing content, or change readiness.",
    "",
    "## Summary",
    "",
    `- Sequence gate ready: ${report.sequenceGateReady}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Ordered groups checked: ${report.orderRows.length}`,
    `- Cross-links checked: ${report.crossLinkRows.length}`,
    `- Failed checks: ${report.failedChecks}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Order Checks",
    "",
    "| Group | Rows | First | Last | Passed |",
    "| --- | ---: | ---: | ---: | --- |",
    ...report.orderRows.map((row) => `| ${row.name} | ${row.rows} | ${row.firstOrder} | ${row.lastOrder} | ${row.passed} |`),
    "",
    "## Cross-Link Checks",
    "",
    "| Check | Passed | Evidence |",
    "| --- | --- | --- |",
    ...report.crossLinkRows.map((row) => `| ${row.name} | ${row.passed} | ${row.evidence.replaceAll("|", "/")} |`),
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
  postWriteCommandPack,
  prewriteSampleDossier,
  realOverlayDryRunBundleAudit,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.dryRunPacket),
  readJson(paths.progressDashboard),
  readJson(paths.humanExecutionBundle),
  readJson(paths.operatorIndex),
  readJson(paths.postWriteCommandPack),
  readJson(paths.prewriteSampleDossier),
  readJson(paths.realOverlayDryRunBundleAudit),
  exists(realStatusPath),
]);

for (const [label, record] of Object.entries({
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  operatorIndex,
  postWriteCommandPack,
  prewriteSampleDossier,
  realOverlayDryRunBundleAudit,
})) {
  assertEnvelope(record, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; sequence consistency gate expects pre-write state`);
if (realOverlayDryRunBundleAudit.auditReady !== true || realOverlayDryRunBundleAudit.writeAllowedNow !== false || realOverlayDryRunBundleAudit.humanAuthorizationRecorded !== false) {
  fail("dry-run bundle audit must remain ready and write-blocked for sequence consistency");
}

const orderRows = [
  checkOrder("human execution steps", humanExecutionBundle.executionSteps),
  checkOrder("operator phase rows", operatorIndex.phaseRows),
  checkOrder("post-write command rows", postWriteCommandPack.commandRows),
  checkOrder("dry-run command order", dryRunPacket.requiredCommands.map((command, index) => ({ order: index + 1, command }))),
  checkOrder("pre-write packet order", prewriteSampleDossier.packetOrder.map((row, index) => ({ ...row, order: index + 1 }))),
];

const crossLinkRows = [
  {
    name: "dry-run includes sequence report file",
    passed: hasFile(dryRunPacket.requiredFiles, outputMd),
    evidence: outputMd,
  },
  {
    name: "dry-run includes sequence command",
    passed: dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-sequence-consistency"),
    evidence: "npm.cmd run check:first-reviewer-sequence-consistency",
  },
  {
    name: "progress dashboard includes sequence status",
    passed: progressDashboard.statusBoard.some((row) => row.name === "Sequence consistency gate" && row.status === "pre_write_order_integrity_ready"),
    evidence: "statusBoard.Sequence consistency gate",
  },
  {
    name: "human execution bundle points to sequence report",
    passed: hasFile(humanExecutionBundle.executionSteps, outputMd),
    evidence: outputMd,
  },
  {
    name: "operator index points to sequence report",
    passed: hasFile(operatorIndex.phaseRows, outputMd),
    evidence: outputMd,
  },
  {
    name: "pre-write dossier includes sequence report",
    passed: hasFile(prewriteSampleDossier.packetOrder, outputMd),
    evidence: outputMd,
  },
  {
    name: "dry-run includes source-fit decision summary file",
    passed: hasFile(dryRunPacket.requiredFiles, "docs/FIRST_REVIEWER_SOURCE_FIT_DECISION_SUMMARY.md"),
    evidence: "docs/FIRST_REVIEWER_SOURCE_FIT_DECISION_SUMMARY.md",
  },
  {
    name: "dry-run includes source-fit decision summary command",
    passed: dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-source-fit-decision-summary"),
    evidence: "npm.cmd run check:first-reviewer-source-fit-decision-summary",
  },
  {
    name: "progress dashboard includes source-fit decision summary status",
    passed: progressDashboard.statusBoard.some((row) => row.name === "Source-fit decision summary" && row.status === "one_page_decision_summary_ready"),
    evidence: "statusBoard.Source-fit decision summary",
  },
  {
    name: "human execution bundle points to source-fit decision summary",
    passed: hasFile(humanExecutionBundle.executionSteps, "docs/FIRST_REVIEWER_SOURCE_FIT_DECISION_SUMMARY.md"),
    evidence: "docs/FIRST_REVIEWER_SOURCE_FIT_DECISION_SUMMARY.md",
  },
  {
    name: "operator index points to source-fit decision summary",
    passed: hasFile(operatorIndex.phaseRows, "docs/FIRST_REVIEWER_SOURCE_FIT_DECISION_SUMMARY.md"),
    evidence: "docs/FIRST_REVIEWER_SOURCE_FIT_DECISION_SUMMARY.md",
  },
  {
    name: "pre-write dossier includes source-fit decision summary",
    passed: hasFile(prewriteSampleDossier.packetOrder, "docs/FIRST_REVIEWER_SOURCE_FIT_DECISION_SUMMARY.md"),
    evidence: "docs/FIRST_REVIEWER_SOURCE_FIT_DECISION_SUMMARY.md",
  },
  {
    name: "dry-run includes sourceFitNotes card pack file",
    passed: hasFile(dryRunPacket.requiredFiles, "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_PACK.md"),
    evidence: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_PACK.md",
  },
  {
    name: "dry-run includes sourceFitNotes card pack command",
    passed: dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-source-fit-notes-card-pack"),
    evidence: "npm.cmd run check:first-reviewer-source-fit-notes-card-pack",
  },
  {
    name: "progress dashboard includes sourceFitNotes card pack status",
    passed: progressDashboard.statusBoard.some((row) => row.name === "SourceFitNotes card pack" && row.status === "blank_printable_cards_ready"),
    evidence: "statusBoard.SourceFitNotes card pack",
  },
  {
    name: "human execution bundle points to sourceFitNotes card pack",
    passed: hasFile(humanExecutionBundle.executionSteps, "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_PACK.md"),
    evidence: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_PACK.md",
  },
  {
    name: "operator index points to sourceFitNotes card pack",
    passed: hasFile(operatorIndex.phaseRows, "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_PACK.md"),
    evidence: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_PACK.md",
  },
  {
    name: "pre-write dossier includes sourceFitNotes card pack",
    passed: hasFile(prewriteSampleDossier.packetOrder, "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_PACK.md"),
    evidence: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_PACK.md",
  },
  {
    name: "dry-run includes sourceFitNotes card negative cases file",
    passed: hasFile(dryRunPacket.requiredFiles, "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_NEGATIVE_CASES.md"),
    evidence: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_NEGATIVE_CASES.md",
  },
  {
    name: "dry-run includes sourceFitNotes card negative cases command",
    passed: dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-source-fit-notes-card-negative-cases"),
    evidence: "npm.cmd run check:first-reviewer-source-fit-notes-card-negative-cases",
  },
  {
    name: "progress dashboard includes sourceFitNotes card negative cases status",
    passed: progressDashboard.statusBoard.some((row) => row.name === "SourceFitNotes card negative cases" && row.status === "card_misuse_guard_ready"),
    evidence: "statusBoard.SourceFitNotes card negative cases",
  },
  {
    name: "human execution bundle points to sourceFitNotes card negative cases",
    passed: hasFile(humanExecutionBundle.executionSteps, "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_NEGATIVE_CASES.md"),
    evidence: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_NEGATIVE_CASES.md",
  },
  {
    name: "operator index points to sourceFitNotes card negative cases",
    passed: hasFile(operatorIndex.phaseRows, "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_NEGATIVE_CASES.md"),
    evidence: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_NEGATIVE_CASES.md",
  },
  {
    name: "pre-write dossier includes sourceFitNotes card negative cases",
    passed: hasFile(prewriteSampleDossier.packetOrder, "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_NEGATIVE_CASES.md"),
    evidence: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_NEGATIVE_CASES.md",
  },
  {
    name: "dry-run includes sourceFitNotes positive matrix file",
    passed: hasFile(dryRunPacket.requiredFiles, "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_POSITIVE_MATRIX.md"),
    evidence: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_POSITIVE_MATRIX.md",
  },
  {
    name: "dry-run includes sourceFitNotes positive matrix command",
    passed: dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-source-fit-notes-positive-matrix"),
    evidence: "npm.cmd run check:first-reviewer-source-fit-notes-positive-matrix",
  },
  {
    name: "progress dashboard includes sourceFitNotes positive matrix status",
    passed: progressDashboard.statusBoard.some((row) => row.name === "SourceFitNotes positive matrix" && row.status === "sample_only_positive_shapes_ready"),
    evidence: "statusBoard.SourceFitNotes positive matrix",
  },
  {
    name: "human execution bundle points to sourceFitNotes positive matrix",
    passed: hasFile(humanExecutionBundle.executionSteps, "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_POSITIVE_MATRIX.md"),
    evidence: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_POSITIVE_MATRIX.md",
  },
  {
    name: "operator index points to sourceFitNotes positive matrix",
    passed: hasFile(operatorIndex.phaseRows, "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_POSITIVE_MATRIX.md"),
    evidence: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_POSITIVE_MATRIX.md",
  },
  {
    name: "pre-write dossier includes sourceFitNotes positive matrix",
    passed: hasFile(prewriteSampleDossier.packetOrder, "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_POSITIVE_MATRIX.md"),
    evidence: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_POSITIVE_MATRIX.md",
  },
  {
    name: "dry-run includes sourceFitNotes human-fill preflight file",
    passed: hasFile(dryRunPacket.requiredFiles, "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_HUMAN_FILL_PREFLIGHT.md"),
    evidence: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_HUMAN_FILL_PREFLIGHT.md",
  },
  {
    name: "dry-run includes sourceFitNotes human-fill preflight command",
    passed: dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-source-fit-notes-human-fill-preflight"),
    evidence: "npm.cmd run check:first-reviewer-source-fit-notes-human-fill-preflight",
  },
  {
    name: "progress dashboard includes sourceFitNotes human-fill preflight status",
    passed: progressDashboard.statusBoard.some((row) => row.name === "SourceFitNotes human-fill preflight" && row.status === "manual_fill_preflight_ready_write_blocked"),
    evidence: "statusBoard.SourceFitNotes human-fill preflight",
  },
  {
    name: "human execution bundle points to sourceFitNotes human-fill preflight",
    passed: hasFile(humanExecutionBundle.executionSteps, "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_HUMAN_FILL_PREFLIGHT.md"),
    evidence: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_HUMAN_FILL_PREFLIGHT.md",
  },
  {
    name: "operator index points to sourceFitNotes human-fill preflight",
    passed: hasFile(operatorIndex.phaseRows, "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_HUMAN_FILL_PREFLIGHT.md"),
    evidence: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_HUMAN_FILL_PREFLIGHT.md",
  },
  {
    name: "pre-write dossier includes sourceFitNotes human-fill preflight",
    passed: hasFile(prewriteSampleDossier.packetOrder, "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_HUMAN_FILL_PREFLIGHT.md"),
    evidence: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_HUMAN_FILL_PREFLIGHT.md",
  },
  {
    name: "dry-run includes dry-run bundle audit file",
    passed: hasFile(dryRunPacket.requiredFiles, "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.md"),
    evidence: "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.md",
  },
  {
    name: "dry-run includes dry-run bundle audit command",
    passed: dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-real-overlay-dry-run-bundle-audit"),
    evidence: "npm.cmd run check:first-reviewer-real-overlay-dry-run-bundle-audit",
  },
  {
    name: "progress dashboard includes dry-run bundle audit status",
    passed: progressDashboard.statusBoard.some((row) => row.name === "Dry-run bundle audit" && row.status === "dry_run_bundle_audit_ready_pre_write_only"),
    evidence: "statusBoard.Dry-run bundle audit",
  },
  {
    name: "human execution bundle points to dry-run bundle audit",
    passed: hasFile(humanExecutionBundle.executionSteps, "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.md"),
    evidence: "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.md",
  },
  {
    name: "operator index points to dry-run bundle audit",
    passed: hasFile(operatorIndex.phaseRows, "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.md"),
    evidence: "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.md",
  },
  {
    name: "pre-write dossier includes dry-run bundle audit",
    passed: hasFile(prewriteSampleDossier.packetOrder, "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.md"),
    evidence: "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.md",
  },
  {
    name: "dry-run bundle audit remains write-blocked",
    passed: realOverlayDryRunBundleAudit.writeAllowedNow === false && realOverlayDryRunBundleAudit.humanAuthorizationRecorded === false,
    evidence: "writeAllowedNow:false; humanAuthorizationRecorded:false",
  },
];
const failedCrossLinks = crossLinkRows.filter((row) => !row.passed);
if (failedCrossLinks.length) fail(`sequence cross-links failed: ${failedCrossLinks.map((row) => row.name).join(", ")}`);

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  sequenceGateReady: true,
  realStatusPath,
  realStatusOverlayPresent,
  orderRows,
  crossLinkRows,
  failedChecks: 0,
  sourceReports: paths,
  boundary: "This sequence consistency gate only checks first-reviewer operations ordering and cross-links. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, confirm source use, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, grant internal-trial readiness, launch the course, or make the product production-ready.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  sequenceGateReady: report.sequenceGateReady,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  orderedGroups: report.orderRows.length,
  crossLinks: report.crossLinkRows.length,
  failedChecks: report.failedChecks,
  outputJson,
  outputMd,
}, null, 2));
