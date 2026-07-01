import fs from "node:fs";

const p0DraftsPath = "docs/LOCAL_COURSE_5_P0_MACHINE_VISUAL_SEMANTIC_DRAFTS.json";
const nonP0DraftsPath = "docs/LOCAL_COURSE_5_NON_P0_MACHINE_VISUAL_SEMANTIC_DRAFTS.json";
const controlAuditPath = "docs/LOCAL_COURSE_5_FOLLOWUP_ABSORPTION_CONTROL_AUDIT.json";
const outputJsonPath = "docs/reviewer-inputs/LOCAL_COURSE_5_FOLLOWUP_REAL_REVIEWER_INPUT_TEMPLATE.json";
const outputMdPath = "docs/reviewer-inputs/LOCAL_COURSE_5_FOLLOWUP_REAL_REVIEWER_INPUT_TEMPLATE.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function requireLocked(name, artifact) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${name} must keep approvalStatus:not_approved`);
  if ("writeAllowedNow" in artifact && artifact.writeAllowedNow !== false) fail(`${name} must keep writeAllowedNow:false`);
}

const p0Drafts = readJson(p0DraftsPath);
const nonP0Drafts = readJson(nonP0DraftsPath);
const controlAudit = readJson(controlAuditPath);
requireLocked("P0 drafts", p0Drafts);
requireLocked("non-P0 drafts", nonP0Drafts);
requireLocked("control audit", controlAudit);

if (controlAudit.followupRows !== 49 || controlAudit.cardRows !== 386 || controlAudit.draftRows !== 386) {
  fail("Course 5 control audit coverage drift");
}

fs.mkdirSync("docs/reviewer-inputs", { recursive: true });

const rows = [
  ...p0Drafts.draftRows.map((row) => ({ sourceTier: "P0", ...row })),
  ...nonP0Drafts.draftRows.map((row) => ({ sourceTier: "non_P0", ...row })),
].map((row, index) => ({
  inputId: `course5_followup_review_input_${String(index + 1).padStart(3, "0")}`,
  sourceTier: row.sourceTier,
  draftId: row.draftId,
  cardId: row.cardId,
  recordId: row.recordId,
  sourceRelativePath: row.sourceRelativePath,
  sampleImagePath: row.sampleImagePath,
  sampleKind: row.sampleKind,
  moduleTags: row.moduleTags || [],
  candidateConcepts: row.candidateConcepts || [],
  candidateSummaryForOrientationOnly: row.candidateSummary,
  reviewerQuestions: row.reviewerQuestions || [],
  riskFlags: row.riskFlags || [],
  requiredFields: [
    "reviewerName",
    "reviewedAt",
    "visibleElements",
    "visualSemanticNote",
    "ocrOrManualText",
    "uncertaintyNotes",
    "moduleDisposition",
    "publicGroundingNeeded",
    "originalRewriteGuidance",
    "sourceRetentionDecision",
  ],
  editableReviewerInput: {
    reviewerName: "",
    reviewedAt: "",
    visibleElements: "",
    visualSemanticNote: "",
    ocrOrManualText: "",
    uncertaintyNotes: "",
    moduleDisposition: "",
    publicGroundingNeeded: "",
    originalRewriteGuidance: "",
    sourceRetentionDecision: "",
  },
  allowedModuleDispositionValues: [
    "module_candidate_after_rewrite",
    "supporting_evidence_only",
    "archive_only",
    "needs_more_ocr_or_visual_review",
    "reject_for_course_use",
  ],
  allowedSourceRetentionDecisionValues: [
    "retain_source_required",
    "may_delete_after_all_related_cards_resolved",
    "retain_until_public_grounding_complete",
    "retain_until_full_ocr_complete",
  ],
  validationStatus: "blocked_missing_real_reviewer_input",
  acceptedForModuleDistillation: false,
  acceptedForDeletionReadiness: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  productionReady: false,
  writeAllowedNow: false,
}));

const template = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  sourceP0Drafts: p0DraftsPath,
  sourceNonP0Drafts: nonP0DraftsPath,
  sourceControlAudit: controlAuditPath,
  inputTemplateStatus: "course_5_followup_real_reviewer_input_template_ready_blocked_missing_input",
  inputMode: "reviewer_owned_copy_required_before_real_input",
  inputRows: rows.length,
  p0InputRows: rows.filter((row) => row.sourceTier === "P0").length,
  nonP0InputRows: rows.filter((row) => row.sourceTier === "non_P0").length,
  readyRows: 0,
  blockedRows: rows.length,
  acceptedForModuleDistillationRows: 0,
  acceptedForDeletionReadinessRows: 0,
  sourceFolderMayBeDeleted: false,
  rows,
  commands: [
    "npm.cmd run build:local-course-5-followup-real-reviewer-input-template",
    "npm.cmd run check:local-course-5-followup-real-reviewer-input-template",
    "npm.cmd run validate:local-course-5-followup-reviewer-input -- --input docs/reviewer-inputs/LOCAL_COURSE_5_FOLLOWUP_REAL_REVIEWER_INPUT_TEMPLATE.json",
    "npm.cmd run verify",
  ],
  completionRule: "This template is ready when every Course 5 follow-up draft has a reviewer-owned editable input row with required fields and locked release/delete status. It does not contain real reviewer notes and must be copied before filling.",
  boundary: "Course 5 follow-up real reviewer input template is private reviewer-facing education operations material. It provides blank fields for OCR or human visual notes, module disposition, public grounding needs, rewrite guidance, and source-retention decisions. It does not generate reviewer notes, accept machine drafts as human review, delete files, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(template, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Course 5 Follow-up Real Reviewer Input Template",
  "",
  `- Template status: ${template.inputTemplateStatus}`,
  `- Input rows: ${template.inputRows}`,
  `- P0 input rows: ${template.p0InputRows}`,
  `- Non-P0 input rows: ${template.nonP0InputRows}`,
  `- Ready rows: ${template.readyRows}`,
  `- Blocked rows: ${template.blockedRows}`,
  `- Accepted for module distillation: ${template.acceptedForModuleDistillationRows}`,
  `- Accepted for deletion readiness: ${template.acceptedForDeletionReadinessRows}`,
  `- Source folder may be deleted: ${template.sourceFolderMayBeDeleted}`,
  "",
  "## Required Editable Fields",
  "",
  ...template.rows[0].requiredFields.map((field) => `- ${field}`),
  "",
  "## Boundary",
  "",
  template.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  inputTemplateStatus: template.inputTemplateStatus,
  inputRows: template.inputRows,
  p0InputRows: template.p0InputRows,
  nonP0InputRows: template.nonP0InputRows,
  readyRows: template.readyRows,
  blockedRows: template.blockedRows,
  sourceFolderMayBeDeleted: template.sourceFolderMayBeDeleted,
}, null, 2));
