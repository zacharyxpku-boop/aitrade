import fs from "node:fs";

const fieldMapPath = "docs/KNOWLEDGE_FIRST_REVIEWER_FIELD_MAP.json";
const handoffPath = "docs/KNOWLEDGE_FIRST_REVIEWER_ACTION_HANDOFF.json";
const highRiskValidationPath = "docs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_INPUT_VALIDATION.json";
const packetValidationPaths = [
  "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_INPUT_COPY_TEMPLATE_VALIDATION.json",
  "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_002_INPUT_COPY_TEMPLATE_VALIDATION.json",
  "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_003_INPUT_COPY_TEMPLATE_VALIDATION.json",
];
const outputJsonPath = "docs/KNOWLEDGE_FIRST_REVIEWER_COMPLETION_GATE.json";
const outputMdPath = "docs/KNOWLEDGE_FIRST_REVIEWER_COMPLETION_GATE.md";

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

const fieldMap = readJson(fieldMapPath);
const handoff = readJson(handoffPath);
const highRiskValidation = readJson(highRiskValidationPath);
const packetValidations = packetValidationPaths.map(readJson);

assertBoundary("fieldMap", fieldMap);
assertBoundary("handoff", handoff);
assertBoundary("highRiskValidation", highRiskValidation);
packetValidations.forEach((packet, index) => assertBoundary(`packetValidation${index + 1}`, packet));

const highRiskReady = highRiskValidation.readyReviewerNotes || 0;
const highRiskBlocked = highRiskValidation.blockedReviewerNotes || 0;
const directReady = highRiskValidation.readyDirectSourceDecisions || 0;
const directBlocked = highRiskValidation.blockedDirectSourceDecisions || 0;
const packetReady = packetValidations.reduce((sum, packet) => sum + (packet.readyRows || 0), 0);
const packetBlocked = packetValidations.reduce((sum, packet) => sum + (packet.blockedRows || 0), 0);
const packetMissingFields = packetValidations.reduce((sum, packet) => sum + (packet.missingFieldRows || 0), 0);
const packetRealHumanInput = packetValidations.reduce((sum, packet) => sum + (packet.realHumanInputEntries || 0), 0);
const totalReady = highRiskReady + directReady + packetReady;
const totalBlocked = highRiskBlocked + directBlocked + packetBlocked;
const totalRequired = fieldMap.blockedWorkItems || 257;
const realHumanInputEntries = (highRiskValidation.realHumanInputEntries || 0) + packetRealHumanInput;
const readyForSeparateApproval = totalReady === totalRequired &&
  totalBlocked === 0 &&
  realHumanInputEntries === totalRequired &&
  highRiskValidation.validationStatus === "ready_for_separate_human_release_approval_gate" &&
  packetValidations.every((packet) => packet.validationStatus === "ready_for_node_public_source_fit_review_apply");

const gateRows = [
  {
    gateId: "high_risk_reviewer_notes",
    label: "72 high-risk reviewer notes",
    inputPath: highRiskValidation.inputPath,
    validationPath: highRiskValidationPath,
    requiredItems: fieldMap.highRiskReviewerNoteFields,
    readyItems: highRiskReady,
    blockedItems: highRiskBlocked,
    validationStatus: highRiskValidation.validationStatus,
    nextAction: "Fill every mapped realReviewerNotes slot, then rerun high-risk overlay validation.",
  },
  {
    gateId: "direct_source_decisions",
    label: "5 direct-source decisions",
    inputPath: highRiskValidation.inputPath,
    validationPath: highRiskValidationPath,
    requiredItems: fieldMap.directSourceDecisionFields,
    readyItems: directReady,
    blockedItems: directBlocked,
    validationStatus: highRiskValidation.validationStatus,
    nextAction: "Fill every directSourceDecisionRows decision, then rerun high-risk overlay validation.",
  },
  {
    gateId: "source_fit_packets_001_003",
    label: "180 source-fit packet rows",
    inputPath: packetValidations.map((packet) => packet.inputPath).join("; "),
    validationPath: packetValidationPaths.join("; "),
    requiredItems: fieldMap.sourceFitReviewRows,
    readyItems: packetReady,
    blockedItems: packetBlocked,
    missingFieldRows: packetMissingFields,
    validationStatus: packetValidations.every((packet) => packet.validationStatus === "ready_for_node_public_source_fit_review_apply")
      ? "ready_for_node_public_source_fit_review_apply"
      : "blocked_missing_real_reviewer_source_fit_input",
    nextAction: "Fill packet 001-003 source-fit review rows, then rerun packet validation for each packet.",
  },
];

const gate = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  completionGateStatus: readyForSeparateApproval
    ? "first_reviewer_completion_gate_ready_for_separate_approval"
    : "first_reviewer_completion_gate_blocked_missing_real_input",
  gateMode: "first_20_actions_257_work_items_completion_gate",
  fieldMapStatus: fieldMap.fieldMapStatus,
  handoffStatus: handoff.handoffStatus,
  handoffActionRows: handoff.handoffActionRows,
  mappedActionRows: fieldMap.mappedActionRows,
  requiredWorkItems: totalRequired,
  readyWorkItems: totalReady,
  blockedWorkItems: totalBlocked,
  highRiskReviewerNoteFields: fieldMap.highRiskReviewerNoteFields,
  highRiskReadyReviewerNotes: highRiskReady,
  highRiskBlockedReviewerNotes: highRiskBlocked,
  directSourceDecisionFields: fieldMap.directSourceDecisionFields,
  readyDirectSourceDecisions: directReady,
  blockedDirectSourceDecisions: directBlocked,
  sourceFitReviewRows: fieldMap.sourceFitReviewRows,
  readySourceFitReviewRows: packetReady,
  blockedSourceFitReviewRows: packetBlocked,
  missingSourceFitFieldRows: packetMissingFields,
  realHumanInputEntries,
  learnerCitationApprovedRows: 0,
  learnerReleaseReadyModules: 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  readyForSeparateApproval,
  inputPaths: [
    highRiskValidation.inputPath,
    ...packetValidations.map((packet) => packet.inputPath),
  ],
  validationPaths: [
    highRiskValidationPath,
    ...packetValidationPaths,
  ],
  gateRows,
  commands: [
    "npm.cmd run build:knowledge-first-reviewer-completion-gate",
    "npm.cmd run check:knowledge-first-reviewer-completion-gate",
    "npm.cmd run check:knowledge-first-reviewer-field-map",
    "npm.cmd run validate:local-course-high-risk-real-reviewer-overlay-input",
    "npm.cmd run validate:knowledge-node-public-source-fit-review-input --input docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_001_INPUT_COPY_TEMPLATE.json --output-json docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_INPUT_COPY_TEMPLATE_VALIDATION.json --output-md docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_INPUT_COPY_TEMPLATE_VALIDATION.md",
    "npm.cmd run validate:knowledge-node-public-source-fit-review-input --input docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_002_INPUT_COPY_TEMPLATE.json --output-json docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_002_INPUT_COPY_TEMPLATE_VALIDATION.json --output-md docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_002_INPUT_COPY_TEMPLATE_VALIDATION.md",
    "npm.cmd run validate:knowledge-node-public-source-fit-review-input --input docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_003_INPUT_COPY_TEMPLATE.json --output-json docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_003_INPUT_COPY_TEMPLATE_VALIDATION.json --output-md docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_003_INPUT_COPY_TEMPLATE_VALIDATION.md",
    "npm.cmd run verify",
  ],
  completionRule: "This first reviewer completion gate passes only when all 257 first-handoff work items are complete with real human input: 72 high-risk reviewer notes, 5 direct-source decisions, and 180 source-fit packet rows. Passing this gate still requires a separate approval gate before any learner-facing citation or release.",
  boundary: "Knowledge first reviewer completion gate is reviewer-facing education-only governance. It aggregates validation evidence for absorbed local course material and public/Wikipedia/official source-fit review rows; it does not generate reviewer notes, approve copied text, approve learner-facing citations, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(gate, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Knowledge First Reviewer Completion Gate",
  "",
  `- Completion gate status: ${gate.completionGateStatus}`,
  `- Ready work items: ${gate.readyWorkItems}/${gate.requiredWorkItems}`,
  `- Blocked work items: ${gate.blockedWorkItems}`,
  `- High-risk reviewer notes: ${gate.highRiskReadyReviewerNotes}/${gate.highRiskReviewerNoteFields}`,
  `- Direct-source decisions: ${gate.readyDirectSourceDecisions}/${gate.directSourceDecisionFields}`,
  `- Source-fit review rows: ${gate.readySourceFitReviewRows}/${gate.sourceFitReviewRows}`,
  `- Real human input entries: ${gate.realHumanInputEntries}`,
  `- Write allowed now: ${gate.writeAllowedNow}`,
  "",
  "## Gate Rows",
  "",
  "| Gate | Required | Ready | Blocked | Status | Next action |",
  "| --- | ---: | ---: | ---: | --- | --- |",
  ...gateRows.map((row) => `| ${row.label} | ${row.requiredItems} | ${row.readyItems} | ${row.blockedItems} | ${row.validationStatus} | ${row.nextAction} |`),
  "",
  "## Completion Rule",
  "",
  gate.completionRule,
  "",
  "## Boundary",
  "",
  gate.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  completionGateStatus: gate.completionGateStatus,
  requiredWorkItems: gate.requiredWorkItems,
  readyWorkItems: gate.readyWorkItems,
  blockedWorkItems: gate.blockedWorkItems,
  highRiskReadyReviewerNotes: gate.highRiskReadyReviewerNotes,
  readyDirectSourceDecisions: gate.readyDirectSourceDecisions,
  readySourceFitReviewRows: gate.readySourceFitReviewRows,
  realHumanInputEntries: gate.realHumanInputEntries,
  writeAllowedNow: gate.writeAllowedNow,
}, null, 2));
