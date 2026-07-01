import fs from "node:fs";

const handoffPath = "docs/KNOWLEDGE_FIRST_REVIEWER_ACTION_HANDOFF.json";
const draftPath = "docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json";
const validationPath = "docs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_INPUT_VALIDATION.json";
const outputJsonPath = "docs/KNOWLEDGE_FIRST_REVIEWER_FIELD_MAP.json";
const outputMdPath = "docs/KNOWLEDGE_FIRST_REVIEWER_FIELD_MAP.md";

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

const handoff = readJson(handoffPath);
const draft = readJson(draftPath);
const validation = readJson(validationPath);
assertBoundary("handoff", handoff);
assertBoundary("draft", draft);
assertBoundary("validation", validation);

const lessonRows = draft.lessonRows || [];
const directRows = draft.directSourceDecisionRows || [];
const lessonByCandidate = new Map(lessonRows.map((row, index) => [row.candidateId, { row, index }]));
const directByResolution = new Map(directRows.map((row, index) => [row.sourceResolutionId, { row, index }]));

const fieldRows = [];
for (const action of handoff.firstActionRows || []) {
  if (action.actionType === "high_risk_lesson_reviewer_notes") {
    const match = lessonByCandidate.get(action.targetId);
    if (!match) fail(`missing draft lesson for ${action.targetId}`);
    const notePaths = (match.row.realReviewerNotes || []).map((note, noteIndex) => ({
      noteId: note.id,
      sourceNoteId: note.sourceNoteId,
      dimension: note.dimension,
      jsonPath: `lessonRows[${match.index}].realReviewerNotes[${noteIndex}]`,
      requiredFields: note.requiredReviewerFields || [],
      allowedDecisionValues: note.allowedDecisionValues || [],
      prompt: note.prompt,
      noteStatus: note.noteStatus,
      readyForApprovalGate: note.readyForApprovalGate,
      learnerFacingRelease: note.learnerFacingRelease,
      approvalStatus: note.approvalStatus,
    }));
    fieldRows.push({
      handoffRank: action.handoffRank,
      queueRank: action.queueRank,
      actionId: action.actionId,
      actionType: action.actionType,
      module: action.module,
      topic: action.topic,
      targetId: action.targetId,
      lessonId: action.lessonId,
      draftPath,
      jsonPath: `lessonRows[${match.index}]`,
      blockedItems: action.blockedItems,
      mappedFieldCount: notePaths.length,
      fieldKind: "six_real_reviewer_note_slots",
      reviewerTask: "Fill six real reviewer notes in the mapped note slots after real review.",
      notePaths,
      evidenceSamples: action.evidenceSamples || [],
      reviewStatus: action.reviewStatus,
      learnerFacingRelease: false,
      writeAllowedNow: false,
      realHumanInput: false,
    });
  } else if (action.actionType === "direct_source_candidate_decision") {
    const match = directByResolution.get(action.targetId);
    if (!match) fail(`missing draft direct-source decision for ${action.targetId}`);
    fieldRows.push({
      handoffRank: action.handoffRank,
      queueRank: action.queueRank,
      actionId: action.actionId,
      actionType: action.actionType,
      module: action.module,
      topic: action.topic,
      targetId: action.targetId,
      lessonId: action.lessonId,
      draftPath,
      jsonPath: `directSourceDecisionRows[${match.index}]`,
      blockedItems: action.blockedItems,
      mappedFieldCount: 1,
      fieldKind: "one_direct_source_decision_row",
      reviewerTask: "Fill reviewerName, reviewedAt, decision, evidenceChecked, and reviewerNote for this direct-source decision.",
      requiredFields: match.row.requiredReviewerFields || [],
      allowedDecisionValues: match.row.allowedDecisionValues || [],
      privateOrDirectCandidateSource: match.row.privateOrDirectCandidateSource,
      publicReplacementRefSamples: match.row.publicReplacementRefSamples || [],
      reviewStatus: action.reviewStatus,
      learnerFacingRelease: false,
      writeAllowedNow: false,
      realHumanInput: false,
    });
  } else if (action.actionType === "source_fit_packet_rows") {
    const packetNumber = String((action.targetId || "").match(/batch-(\d+)/)?.[1] || "").padStart(3, "0");
    const packetInputPath = `docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_${packetNumber}_INPUT_COPY_TEMPLATE.json`;
    fieldRows.push({
      handoffRank: action.handoffRank,
      queueRank: action.queueRank,
      actionId: action.actionId,
      actionType: action.actionType,
      module: action.module,
      topic: action.topic,
      targetId: action.targetId,
      lessonId: action.lessonId,
      draftPath: packetInputPath,
      jsonPath: "reviewRows[*]",
      blockedItems: action.blockedItems,
      mappedFieldCount: action.blockedItems,
      fieldKind: "source_fit_packet_review_rows",
      reviewerTask: "Fill reviewerDecision, sourceFitNotes, citationUse, reviewerName, reviewedAt, and realHumanInput for each packet row after real review.",
      packetInputPath,
      packetInputExists: fs.existsSync(packetInputPath),
      evidenceSamples: action.evidenceSamples || [],
      reviewStatus: action.reviewStatus,
      learnerFacingRelease: false,
      writeAllowedNow: false,
      realHumanInput: false,
    });
  }
}

const highRiskRows = fieldRows.filter((row) => row.actionType === "high_risk_lesson_reviewer_notes");
const directSourceRows = fieldRows.filter((row) => row.actionType === "direct_source_candidate_decision");
const sourceFitRows = fieldRows.filter((row) => row.actionType === "source_fit_packet_rows");

const fieldMap = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  fieldMapStatus: "first_reviewer_field_map_ready_blocked_on_real_input",
  fieldMapMode: "handoff_actions_to_human_owned_input_fields",
  handoffStatus: handoff.handoffStatus,
  validationStatus: validation.validationStatus,
  handoffActionRows: handoff.handoffActionRows,
  mappedActionRows: fieldRows.length,
  highRiskLessonActions: highRiskRows.length,
  directSourceDecisionActions: directSourceRows.length,
  sourceFitPacketActions: sourceFitRows.length,
  highRiskReviewerNoteFields: highRiskRows.reduce((sum, row) => sum + row.mappedFieldCount, 0),
  directSourceDecisionFields: directSourceRows.reduce((sum, row) => sum + row.mappedFieldCount, 0),
  sourceFitReviewRows: sourceFitRows.reduce((sum, row) => sum + row.mappedFieldCount, 0),
  blockedWorkItems: fieldRows.reduce((sum, row) => sum + (row.blockedItems || 0), 0),
  readyWorkItems: 0,
  realHumanInputEntries: 0,
  learnerCitationApprovedRows: 0,
  learnerReleaseReadyModules: 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  inputPaths: [
    draftPath,
    ...sourceFitRows.map((row) => row.packetInputPath),
  ],
  fieldRows,
  reviewerChecklist: [
    "Open the mapped draftPath before editing; use jsonPath to find the exact field group.",
    "For high-risk lesson rows, fill all six notePaths and keep every readyForApprovalGate value false until separate approval.",
    "For direct-source rows, decide private/direct-source handling without approving learner citations.",
    "For source-fit packet rows, use the packet input copy template and do not edit generated packet source files.",
    "Every reviewer note must preserve no setup, no signal, no future outcome, no strategy edge, and no real-money action boundaries.",
    "Do not copy Codex self-review text, private PDF prose, Wikipedia prose, or public source prose into the real reviewer note.",
  ],
  commands: [
    "npm.cmd run build:knowledge-first-reviewer-field-map",
    "npm.cmd run check:knowledge-first-reviewer-field-map",
    "npm.cmd run check:knowledge-first-reviewer-action-handoff",
    "npm.cmd run validate:local-course-high-risk-real-reviewer-overlay-input",
    "npm.cmd run validate:knowledge-node-public-source-fit-review-input",
    "npm.cmd run verify",
  ],
  completionRule: "This field map is complete when the first 20 handoff actions are mapped to concrete human-owned input fields: 72 high-risk reviewer note fields, 5 direct-source decision fields, and 180 source-fit packet rows. It does not fill, generate, approve, or write real reviewer input.",
  boundary: "Knowledge first reviewer field map is reviewer-facing education-only operations material. It maps absorbed local course evidence, public/Wikipedia/official context, high-risk lesson note slots, direct-source decision rows, and source-fit packet review rows to human-owned input fields; it does not generate reviewer notes, approve copied text, approve learner-facing citations, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(fieldMap, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Knowledge First Reviewer Field Map",
  "",
  `- Field map status: ${fieldMap.fieldMapStatus}`,
  `- Handoff actions mapped: ${fieldMap.mappedActionRows}/${fieldMap.handoffActionRows}`,
  `- High-risk reviewer note fields: ${fieldMap.highRiskReviewerNoteFields}`,
  `- Direct-source decision fields: ${fieldMap.directSourceDecisionFields}`,
  `- Source-fit review rows: ${fieldMap.sourceFitReviewRows}`,
  `- Blocked work items: ${fieldMap.blockedWorkItems}`,
  `- Real human input entries: ${fieldMap.realHumanInputEntries}`,
  `- Write allowed now: ${fieldMap.writeAllowedNow}`,
  "",
  "## Field Rows",
  "",
  "| Handoff | Queue | Type | Module | Target | JSON path | Fields | Input |",
  "| ---: | ---: | --- | --- | --- | --- | ---: | --- |",
  ...fieldMap.fieldRows.map((row) => `| ${row.handoffRank} | ${row.queueRank} | ${row.actionType} | ${row.module} | ${row.targetId} | ${row.jsonPath} | ${row.mappedFieldCount} | ${row.draftPath} |`),
  "",
  "## Reviewer Checklist",
  "",
  ...fieldMap.reviewerChecklist.map((item) => `- ${item}`),
  "",
  "## Completion Rule",
  "",
  fieldMap.completionRule,
  "",
  "## Boundary",
  "",
  fieldMap.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  fieldMapStatus: fieldMap.fieldMapStatus,
  mappedActionRows: fieldMap.mappedActionRows,
  highRiskReviewerNoteFields: fieldMap.highRiskReviewerNoteFields,
  directSourceDecisionFields: fieldMap.directSourceDecisionFields,
  sourceFitReviewRows: fieldMap.sourceFitReviewRows,
  blockedWorkItems: fieldMap.blockedWorkItems,
  realHumanInputEntries: fieldMap.realHumanInputEntries,
  writeAllowedNow: fieldMap.writeAllowedNow,
}, null, 2));
