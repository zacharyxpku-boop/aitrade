import fs from "node:fs";
import path from "node:path";

const sourceTemplatePath = "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_INPUT_COPY_TEMPLATE.json";
const starterJsonPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_INPUT_STARTER.json";
const starterMdPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_INPUT_STARTER.md";
const draftInputPath = "docs/reviewer-inputs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_REAL_INPUT_DRAFT.json";
const draftValidationJsonPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_INPUT_STARTER_VALIDATION.json";
const draftValidationMdPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_INPUT_STARTER_VALIDATION.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function checklistDone(checklist = {}) {
  const values = Object.values(checklist || {});
  return values.length > 0 && values.every((value) => value === "done" || value === true);
}

function validationRowsFor(input) {
  return (input.inputEntries || []).map((entry) => {
    const missingFields = [];
    if (!text(entry.reviewerName)) missingFields.push("reviewerName");
    if (!text(entry.reviewedAt)) missingFields.push("reviewedAt");
    if (entry.category === "manual_transcription") {
      const fields = entry.manualInput || {};
      if (!text(fields.humanTranscription)) missingFields.push("humanTranscription");
      if (!text(fields.humanSummary)) missingFields.push("humanSummary");
      if (!text(fields.sourceFitNote) && !text(fields.publicReferenceNotes)) missingFields.push("sourceFitNote");
      if (!text(fields.rewriteBoundaryNote) && !text(fields.originalityNotes)) missingFields.push("rewriteBoundaryNote");
      if (!checklistDone(fields.checklist)) missingFields.push("manualChecklist");
    } else if (entry.category === "source_replacement") {
      const fields = entry.replacementInput || {};
      if (!text(fields.selectedDecision)) missingFields.push("selectedDecision");
      if (!text(fields.replacementSourcePath)) missingFields.push("replacementSourcePath");
      if (!text(fields.replacementNote)) missingFields.push("replacementNote");
      if (!text(fields.rerunEvidence)) missingFields.push("rerunEvidence");
      if (!checklistDone(fields.checklist)) missingFields.push("replacementChecklist");
    } else {
      missingFields.push("supportedCategory");
    }
    return {
      id: entry.id,
      taskId: entry.taskId,
      category: entry.category,
      documentId: entry.documentId,
      pageNumber: entry.pageNumber,
      sourceRelativePath: entry.sourceRelativePath,
      validationStatus: "blocked_missing_reviewer_input",
      readyForOverlayApply: false,
      missingFields,
      forbiddenHits: [],
      sourceTemplatePath: entry.sourceTemplatePath,
      nextGate: entry.nextGate,
    };
  });
}

const template = readJson(sourceTemplatePath);
if (template.educationOnly !== true) fail("source template must keep educationOnly:true");
if (template.productionReady !== false) fail("source template must keep productionReady:false");
if (template.learnerFacingRelease !== false) fail("source template must keep learnerFacingRelease:false");
if (template.approvalStatus !== "not_approved") fail("source template must remain not_approved");
if (template.fixtureOnly !== false) fail("source template must not be fixture-only");
if (template.totalEntries !== 22) fail("source template must contain 22 entries");

const draftInput = {
  ...template,
  generatedAt: new Date().toISOString(),
  starterGeneratedAt: new Date().toISOString(),
  sourceTemplatePath,
  reviewerOwnedCopy: true,
  fixtureOnly: false,
  templateStatus: "p0_human_review_bundle_real_input_draft_blank",
  inputDraftStatus: "blank_reviewer_owned_copy_write_blocked",
  filledEntries: 0,
  readyForValidationEntries: 0,
  validationPath: draftValidationJsonPath,
  inputEntries: (template.inputEntries || []).map((entry) => ({
    ...entry,
    inputStatus: "awaiting_real_reviewer_fill",
    bundleInputStatus: "reviewer_owned_copy_blank",
    reviewerName: "",
    reviewedAt: "",
  })),
  usage: [
    "Fill this reviewer-owned copy, not the generated source template.",
    "A real reviewer must inspect each preview/high-res preview before writing reviewerName, reviewedAt, transcription, summary, source-fit, and rewrite-boundary notes.",
    "Run validation against this copy; do not write overlay changes from a blank or fixture file.",
  ],
  completionRule: "This starter draft is only an empty reviewer-owned input copy. It does not contain real reviewer input, does not approve learner-facing release, and does not authorize overlay writes.",
  boundary: "P0 real reviewer input starter is reviewer-facing education-only operations material. It does not create real reviewer judgment, infer private-course content, approve learner-facing release, write overlay changes, provide stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

const validationRows = validationRowsFor(draftInput);
const validation = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  validationStatus: "blocked_missing_reviewer_input",
  fixtureOnly: false,
  reviewerOwnedCopy: true,
  inputPath: draftInputPath,
  sourceTemplatePath,
  totalEntries: validationRows.length,
  manualTranscriptionEntries: validationRows.filter((row) => row.category === "manual_transcription").length,
  sourceReplacementEntries: validationRows.filter((row) => row.category === "source_replacement").length,
  readyEntries: 0,
  blockedEntries: validationRows.length,
  forbiddenHitEntries: 0,
  validationRows,
  nextStep: "A real reviewer fills the reviewer-owned draft copy, then runs validate:local-course-p0-human-review-bundle-input-copy with --input pointing to the draft path.",
  boundary: "Starter validation proves the reviewer-owned draft is still blank and blocked. It does not write overlay changes, approve learner-facing release, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

const starter = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  starterStatus: "real_reviewer_input_starter_ready_waiting_for_human_fill",
  starterMode: "reviewer_owned_blank_copy_plus_blocked_validation",
  sourceTemplatePath,
  draftInputPath,
  draftValidationJsonPath,
  draftValidationMdPath,
  totalEntries: draftInput.totalEntries,
  manualTranscriptionEntries: draftInput.manualTranscriptionEntries,
  sourceReplacementEntries: draftInput.sourceReplacementEntries,
  filledEntries: draftInput.filledEntries,
  readyForValidationEntries: draftInput.readyForValidationEntries,
  validationStatus: validation.validationStatus,
  validationReadyEntries: validation.readyEntries,
  validationBlockedEntries: validation.blockedEntries,
  realHumanInputEntries: 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  reviewerSteps: [
    "Open the draft input path, not the generated template.",
    "Fill all 22 entries after inspecting the original preview and high-resolution preview.",
    "Use reviewerName and reviewedAt on every entry.",
    "For manual transcription rows, fill humanTranscription, humanSummary, public/source-fit notes, rewrite-boundary/originality notes, and every checklist item.",
    "For source replacement rows, fill selectedDecision, replacementSourcePath, replacementNote, rerunEvidence, and every checklist item.",
    "Run validation against the draft path and stop if any entry remains blocked.",
    "Keep writeAllowedNow:false until separate write authorization is explicit.",
  ],
  commands: [
    `npm.cmd run validate:local-course-p0-human-review-bundle-input-copy -- --input ${draftInputPath} --output-json ${draftValidationJsonPath} --output-md ${draftValidationMdPath}`,
    "npm.cmd run check:local-course-p0-real-reviewer-input-starter",
    "npm.cmd run check:local-course-p0-write-authorization-preview",
  ],
  completionRule: "This starter makes the real reviewer input copy concrete and validates that it is still blank. It does not complete human review, does not approve learner-facing release, and does not authorize overlay writes.",
  boundary: "P0 real reviewer input starter is reviewer-facing education-only operations scaffolding. It does not create real reviewer judgment, approve learner-facing release, write overlay changes, provide stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.mkdirSync(path.dirname(draftInputPath), { recursive: true });
fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync(draftInputPath, `${JSON.stringify(draftInput, null, 2)}\n`, "utf8");
fs.writeFileSync(draftValidationJsonPath, `${JSON.stringify(validation, null, 2)}\n`, "utf8");
fs.writeFileSync(draftValidationMdPath, [
  "# Local Course P0 Real Reviewer Input Starter Validation",
  "",
  `- Validation status: ${validation.validationStatus}`,
  `- Input path: ${validation.inputPath}`,
  `- Total entries: ${validation.totalEntries}`,
  `- Ready entries: ${validation.readyEntries}`,
  `- Blocked entries: ${validation.blockedEntries}`,
  "",
  "| Entry | Category | Page | Status | Missing fields |",
  "| --- | --- | ---: | --- | --- |",
  ...validationRows.map((row) => `| ${row.id} | ${row.category} | ${row.pageNumber || ""} | ${row.validationStatus} | ${row.missingFields.join(", ")} |`),
  "",
  "## Boundary",
  "",
  validation.boundary,
  "",
].join("\n"), "utf8");
fs.writeFileSync(starterJsonPath, `${JSON.stringify(starter, null, 2)}\n`, "utf8");
fs.writeFileSync(starterMdPath, [
  "# Local Course P0 Real Reviewer Input Starter",
  "",
  `- Status: ${starter.starterStatus}`,
  `- Draft input: \`${draftInputPath}\``,
  `- Validation: ${starter.validationReadyEntries} ready / ${starter.validationBlockedEntries} blocked`,
  `- Real human input entries: ${starter.realHumanInputEntries}`,
  `- Write allowed now: ${starter.writeAllowedNow}`,
  "",
  "## Reviewer Steps",
  "",
  ...starter.reviewerSteps.map((step) => `- ${step}`),
  "",
  "## Commands",
  "",
  ...starter.commands.map((command) => `- \`${command}\``),
  "",
  "## Boundary",
  "",
  starter.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  starterStatus: starter.starterStatus,
  totalEntries: starter.totalEntries,
  readyEntries: starter.validationReadyEntries,
  blockedEntries: starter.validationBlockedEntries,
  realHumanInputEntries: starter.realHumanInputEntries,
  writeAllowedNow: starter.writeAllowedNow,
  draftInputPath,
  starterJsonPath,
}, null, 2));
