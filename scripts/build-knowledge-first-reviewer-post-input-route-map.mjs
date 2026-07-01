import fs from "node:fs";

const cardMatrixPath = "docs/KNOWLEDGE_FIRST_REVIEWER_CARD_STATUS_MATRIX.json";
const completionGatePath = "docs/KNOWLEDGE_FIRST_REVIEWER_COMPLETION_GATE.json";
const workbenchPath = "docs/KNOWLEDGE_FIRST_REVIEWER_WORKBENCH.json";
const outputJsonPath = "docs/KNOWLEDGE_FIRST_REVIEWER_POST_INPUT_ROUTE_MAP.json";
const outputMdPath = "docs/KNOWLEDGE_FIRST_REVIEWER_POST_INPUT_ROUTE_MAP.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(label, artifact) {
  if (artifact.educationOnly !== true) fail(`${label} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${label} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${label} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${label} must remain not_approved`);
  if (artifact.writeAllowedNow !== false) fail(`${label} must keep writeAllowedNow:false`);
}

const matrix = readJson(cardMatrixPath);
const completionGate = readJson(completionGatePath);
const workbench = readJson(workbenchPath);
for (const [label, artifact] of Object.entries({ matrix, completionGate, workbench })) {
  assertBoundary(label, artifact);
}

const routeRowsData = [
  {
    routeRank: 1,
    routeId: "high_risk_overlay_notes_and_direct_sources",
    routeType: "validate_high_risk_overlay_input",
    inputPath: "docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json",
    validationPath: "docs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_INPUT_VALIDATION.json",
    requiredItems: 77,
    readyItems: 0,
    blockedItems: 77,
    validationCommand: "npm.cmd run validate:local-course-high-risk-real-reviewer-overlay-input",
    postValidationCommand: "npm.cmd run build:knowledge-first-reviewer-completion-gate",
    applyOrMergeCommand: "",
    nextGate: "separate_human_release_approval_after_all_257_items_ready",
    routeStatus: "route_blocked_missing_real_reviewer_input",
    mergeAllowedNow: false,
    writeAllowedNow: false,
  },
  {
    routeRank: 2,
    routeId: "source_fit_packet_001",
    routeType: "validate_source_fit_packet_input_copy",
    inputPath: "docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_001_INPUT_COPY_TEMPLATE.json",
    validationPath: "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_INPUT_COPY_TEMPLATE_VALIDATION.json",
    requiredItems: 60,
    readyItems: 0,
    blockedItems: 60,
    validationCommand: "npm.cmd run validate:knowledge-node-public-source-fit-review-packet-input-copy-template",
    postValidationCommand: "npm.cmd run build:knowledge-node-public-source-fit-review-packet-merge-preview",
    applyOrMergeCommand: "npm.cmd run apply:knowledge-node-public-source-fit-review-packet-merge",
    nextGate: "merge_preview_then_dry_run_apply_report_only_when_all_60_rows_ready",
    routeStatus: "route_blocked_missing_real_reviewer_input",
    mergeAllowedNow: false,
    writeAllowedNow: false,
  },
  {
    routeRank: 3,
    routeId: "source_fit_packet_002",
    routeType: "validate_source_fit_packet_input_copy",
    inputPath: "docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_002_INPUT_COPY_TEMPLATE.json",
    validationPath: "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_002_INPUT_COPY_TEMPLATE_VALIDATION.json",
    requiredItems: 60,
    readyItems: 0,
    blockedItems: 60,
    validationCommand: "npm.cmd run validate:knowledge-node-public-source-fit-review-packet-002-input-copy-template",
    postValidationCommand: "npm.cmd run build:knowledge-node-public-source-fit-review-packet-002-merge-preview",
    applyOrMergeCommand: "npm.cmd run apply:knowledge-node-public-source-fit-review-packet-002-merge",
    nextGate: "merge_preview_then_dry_run_apply_report_only_when_all_60_rows_ready",
    routeStatus: "route_blocked_missing_real_reviewer_input",
    mergeAllowedNow: false,
    writeAllowedNow: false,
  },
  {
    routeRank: 4,
    routeId: "source_fit_packet_003",
    routeType: "validate_source_fit_packet_input_copy",
    inputPath: "docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_003_INPUT_COPY_TEMPLATE.json",
    validationPath: "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_003_INPUT_COPY_TEMPLATE_VALIDATION.json",
    requiredItems: 60,
    readyItems: 0,
    blockedItems: 60,
    validationCommand: "npm.cmd run validate:knowledge-node-public-source-fit-review-input --input docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_003_INPUT_COPY_TEMPLATE.json --output-json docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_003_INPUT_COPY_TEMPLATE_VALIDATION.json --output-md docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_003_INPUT_COPY_TEMPLATE_VALIDATION.md",
    postValidationCommand: "npm.cmd run build:knowledge-first-reviewer-completion-gate",
    applyOrMergeCommand: "",
    nextGate: "completion_gate_then_separate_source_fit_merge_route_if_packet_003_apply_script_is_added",
    routeStatus: "route_blocked_missing_real_reviewer_input",
    mergeAllowedNow: false,
    writeAllowedNow: false,
  },
];

const routeMap = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  routeMapStatus: "first_reviewer_post_input_route_map_ready_blocked_on_real_input",
  routeMapMode: "post_reviewer_input_validation_then_locked_merge_and_approval_routes",
  cardMatrixStatus: matrix.matrixStatus,
  workbenchStatus: workbench.workbenchStatus,
  completionGateStatus: completionGate.completionGateStatus,
  routeRows: routeRowsData.length,
  validationRoutes: routeRowsData.length,
  sourceFitMergeRoutes: 2,
  highRiskApprovalRoutes: 1,
  requiredWorkItems: completionGate.requiredWorkItems,
  readyWorkItems: completionGate.readyWorkItems,
  blockedWorkItems: completionGate.blockedWorkItems,
  highRiskReviewerNoteFields: completionGate.highRiskReviewerNoteFields,
  directSourceDecisionFields: completionGate.directSourceDecisionFields,
  sourceFitReviewRows: completionGate.sourceFitReviewRows,
  readySourceFitReviewRows: completionGate.readySourceFitReviewRows,
  blockedSourceFitReviewRows: completionGate.blockedSourceFitReviewRows,
  realHumanInputEntries: 0,
  learnerCitationApprovedRows: 0,
  learnerReleaseReadyModules: 0,
  readyForSeparateApproval: false,
  mergeAllowedNow: false,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  routeRowsData,
  lockedGates: [
    "No validation route is ready until realHumanInputEntries equals required items.",
    "No packet merge may write when readyRows is 0 or mergeAllowedNow is false.",
    "No high-risk overlay may unlock learner release without separate human approval.",
    "No copied text or learner-facing citation approval may be inferred from source-fit decisions.",
  ],
  commands: [
    "npm.cmd run build:knowledge-first-reviewer-post-input-route-map",
    "npm.cmd run check:knowledge-first-reviewer-post-input-route-map",
    "npm.cmd run check:knowledge-first-reviewer-card-status-matrix",
    "npm.cmd run check:knowledge-first-reviewer-workbench",
    "npm.cmd run check:knowledge-first-reviewer-completion-gate",
    "npm.cmd run verify",
  ],
  completionRule: "This first reviewer post-input route map is complete when all four reviewer-owned input copies have explicit validation commands, post-validation rebuild commands, locked merge/apply routes where available, and separate approval gates for the 257 first-handoff work items. It does not complete review, run merge writes, approve copied text, approve learner-facing citations, or unlock learner release.",
  boundary: "Knowledge first reviewer post-input route map is reviewer-facing education-only operations material for absorbed local course material and public/Wikipedia/official source-fit review rows. It maps post-input validation and locked merge/apply routes for 72 high-risk reviewer notes, 5 direct-source decisions, and 180 source-fit packet rows; it does not generate reviewer notes, approve copied text, approve learner-facing citations, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(routeMap, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Knowledge First Reviewer Post-Input Route Map",
  "",
  `- Route map status: ${routeMap.routeMapStatus}`,
  `- Routes: ${routeMap.routeRows}`,
  `- Ready work items: ${routeMap.readyWorkItems}/${routeMap.requiredWorkItems}`,
  `- Blocked work items: ${routeMap.blockedWorkItems}`,
  `- Source-fit merge routes: ${routeMap.sourceFitMergeRoutes}`,
  `- Merge allowed now: ${routeMap.mergeAllowedNow}`,
  `- Write allowed now: ${routeMap.writeAllowedNow}`,
  "",
  "## Route Rows",
  "",
  "| Rank | Route | Required | Ready | Blocked | Validation | Post-validation | Merge/apply | Status |",
  "| ---: | --- | ---: | ---: | ---: | --- | --- | --- | --- |",
  ...routeRowsData.map((row) => `| ${row.routeRank} | ${row.routeId} | ${row.requiredItems} | ${row.readyItems} | ${row.blockedItems} | ${row.validationCommand} | ${row.postValidationCommand} | ${row.applyOrMergeCommand || "separate approval only"} | ${row.routeStatus} |`),
  "",
  "## Locked Gates",
  "",
  ...routeMap.lockedGates.map((item) => `- ${item}`),
  "",
  "## Boundary",
  "",
  routeMap.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  routeMapStatus: routeMap.routeMapStatus,
  routeRows: routeMap.routeRows,
  requiredWorkItems: routeMap.requiredWorkItems,
  readyWorkItems: routeMap.readyWorkItems,
  blockedWorkItems: routeMap.blockedWorkItems,
  sourceFitMergeRoutes: routeMap.sourceFitMergeRoutes,
  realHumanInputEntries: routeMap.realHumanInputEntries,
  mergeAllowedNow: routeMap.mergeAllowedNow,
  writeAllowedNow: routeMap.writeAllowedNow,
}, null, 2));
