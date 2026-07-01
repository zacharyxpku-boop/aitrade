import fs from "node:fs";

const fieldMapPath = "docs/KNOWLEDGE_FIRST_REVIEWER_FIELD_MAP.json";
const fieldMapMdPath = "docs/KNOWLEDGE_FIRST_REVIEWER_FIELD_MAP.md";
const handoffPath = "docs/KNOWLEDGE_FIRST_REVIEWER_ACTION_HANDOFF.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const fieldMap = readJson(fieldMapPath);
const handoff = readJson(handoffPath);
if (!fs.existsSync(fieldMapMdPath)) fail(`missing ${fieldMapMdPath}`);

if (fieldMap.educationOnly !== true) fail("field map must keep educationOnly:true");
if (fieldMap.productionReady !== false) fail("field map must keep productionReady:false");
if (fieldMap.learnerFacingRelease !== false) fail("field map must keep learnerFacingRelease:false");
if (fieldMap.approvalStatus !== "not_approved") fail("field map must remain not_approved");
if (fieldMap.fieldMapStatus !== "first_reviewer_field_map_ready_blocked_on_real_input") fail("unexpected fieldMapStatus");
if (fieldMap.fieldMapMode !== "handoff_actions_to_human_owned_input_fields") fail("unexpected fieldMapMode");
if (fieldMap.handoffStatus !== "first_reviewer_action_handoff_ready_blocked_on_real_input") fail("handoff status drift");
if (fieldMap.validationStatus !== "blocked_missing_real_reviewer_overlay_input") fail("validation status drift");

if (fieldMap.handoffActionRows !== 20 || fieldMap.mappedActionRows !== 20) fail("expected 20 mapped actions");
if (fieldMap.highRiskLessonActions !== 12) fail("expected 12 high-risk mapped actions");
if (fieldMap.directSourceDecisionActions !== 5) fail("expected 5 direct-source mapped actions");
if (fieldMap.sourceFitPacketActions !== 3) fail("expected 3 source-fit mapped actions");
if (fieldMap.highRiskReviewerNoteFields !== 72) fail("expected 72 high-risk reviewer note fields");
if (fieldMap.directSourceDecisionFields !== 5) fail("expected 5 direct-source decision fields");
if (fieldMap.sourceFitReviewRows !== 180) fail("expected 180 source-fit review rows");
if (fieldMap.blockedWorkItems !== 257 || fieldMap.readyWorkItems !== 0) fail("blocked/ready work drift");
if (
  fieldMap.realHumanInputEntries !== 0 ||
  fieldMap.learnerCitationApprovedRows !== 0 ||
  fieldMap.learnerReleaseReadyModules !== 0
) {
  fail("field map must not claim real input, citation approval, or learner release");
}
if (fieldMap.writeAllowedNow !== false || fieldMap.manualAuthorizationRequired !== true) fail("field map write gate must stay locked");

if (!Array.isArray(fieldMap.inputPaths) || fieldMap.inputPaths.length !== 4) fail("expected draft plus 3 packet input paths");
for (const inputPath of fieldMap.inputPaths) {
  if (!fs.existsSync(inputPath)) fail(`mapped input path missing: ${inputPath}`);
}

const rows = fieldMap.fieldRows || [];
if (!Array.isArray(rows) || rows.length !== 20) fail("fieldRows must contain 20 rows");
if (!rows.every((row, index) =>
  row.handoffRank === index + 1 &&
  row.queueRank === index + 1 &&
  row.actionId === handoff.firstActionRows[index].actionId &&
  row.actionType === handoff.firstActionRows[index].actionType &&
  row.module &&
  row.targetId &&
  row.draftPath &&
  row.jsonPath &&
  row.blockedItems === handoff.firstActionRows[index].blockedItems &&
  row.mappedFieldCount >= 1 &&
  row.reviewStatus === "blocked_missing_real_reviewer_input" &&
  row.learnerFacingRelease === false &&
  row.writeAllowedNow === false &&
  row.realHumanInput === false
)) {
  fail("field row mapping drift");
}

if (!rows.slice(0, 12).every((row, index) =>
  row.actionType === "high_risk_lesson_reviewer_notes" &&
  row.fieldKind === "six_real_reviewer_note_slots" &&
  row.jsonPath === `lessonRows[${index}]` &&
  row.mappedFieldCount === 6 &&
  Array.isArray(row.notePaths) &&
  row.notePaths.length === 6 &&
  row.notePaths.every((note, noteIndex) =>
    note.jsonPath === `lessonRows[${index}].realReviewerNotes[${noteIndex}]` &&
    note.noteId &&
    note.dimension &&
    Array.isArray(note.requiredFields) &&
    note.requiredFields.includes("reviewerName") &&
    note.requiredFields.includes("reviewedAt") &&
    note.requiredFields.includes("decision") &&
    note.requiredFields.includes("evidenceChecked") &&
    note.requiredFields.includes("reviewerNote") &&
    note.noteStatus === "blank_waiting_real_reviewer" &&
    note.readyForApprovalGate === false &&
    note.learnerFacingRelease === false &&
    note.approvalStatus === "not_approved")
)) {
  fail("high-risk note field paths drift");
}

if (!rows.slice(12, 17).every((row, index) =>
  row.actionType === "direct_source_candidate_decision" &&
  row.fieldKind === "one_direct_source_decision_row" &&
  row.jsonPath === `directSourceDecisionRows[${index}]` &&
  row.mappedFieldCount === 1 &&
  Array.isArray(row.requiredFields) &&
  row.requiredFields.includes("reviewerName") &&
  row.requiredFields.includes("reviewedAt") &&
  row.requiredFields.includes("decision") &&
  row.requiredFields.includes("evidenceChecked") &&
  row.requiredFields.includes("reviewerNote") &&
  Array.isArray(row.allowedDecisionValues) &&
  row.privateOrDirectCandidateSource &&
  Array.isArray(row.publicReplacementRefSamples) &&
  row.publicReplacementRefSamples.length >= 3
)) {
  fail("direct-source field paths drift");
}

if (!rows.slice(17, 20).every((row, index) => {
  const packetNumber = String(index + 1).padStart(3, "0");
  return row.actionType === "source_fit_packet_rows" &&
    row.fieldKind === "source_fit_packet_review_rows" &&
    row.jsonPath === "reviewRows[*]" &&
    row.mappedFieldCount === 60 &&
    row.packetInputPath === `docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_${packetNumber}_INPUT_COPY_TEMPLATE.json` &&
    row.packetInputExists === true;
})) {
  fail("source-fit packet field paths drift");
}

if (!Array.isArray(fieldMap.reviewerChecklist) || fieldMap.reviewerChecklist.length < 6) fail("reviewer checklist too thin");
if (!Array.isArray(fieldMap.commands) || !fieldMap.commands.some((command) => /check:knowledge-first-reviewer-field-map/.test(command))) {
  fail("commands must include field map check");
}

const boundaryText = `${fieldMap.boundary || ""} ${fieldMap.completionRule || ""} ${fieldMap.reviewerChecklist.join(" ")}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "absorbed local course evidence",
  "public/wikipedia/official context",
  "72 high-risk reviewer note fields",
  "5 direct-source decision fields",
  "180 source-fit packet rows",
  "does not generate reviewer notes",
  "approve copied text",
  "approve learner-facing citations",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
  "production readiness",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

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
