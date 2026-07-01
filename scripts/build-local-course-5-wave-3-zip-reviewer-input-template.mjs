import fs from "node:fs";
import path from "node:path";

const packPath = "docs/LOCAL_COURSE_5_WAVE_3_ZIP_EXECUTION_PACK.json";
const outputJson = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_3_ZIP_REVIEWER_INPUT_TEMPLATE.json";
const outputMd = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_3_ZIP_REVIEWER_INPUT_TEMPLATE.md";

const boundary = "Course 5 Wave 3 ZIP reviewer input template is private reviewer-facing education operations material. It provides blank reviewer-owned input rows for the six locally resolvable ZIP visual source blockers and their representative image samples. It does not perform OCR, generate reviewer conclusions, accept machine drafts as human review, merge content into learner-facing modules, delete files, approve source-folder deletion, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(name, artifact) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${name} must keep approvalStatus:not_approved`);
  if (artifact.writeAllowedNow !== false) fail(`${name} must keep writeAllowedNow:false`);
}

const pack = readJson(packPath);
assertBoundary("Wave 3 ZIP execution pack", pack);

const sourceByRecordId = new Map(pack.sourceRowsDetail.map((row) => [row.recordId, row]));
const rows = pack.sampleRowsDetail.map((sample) => ({
  reviewRowId: sample.reviewRowId,
  executionSampleNo: sample.executionSampleNo,
  sourceType: "zip",
  recordId: sample.recordId,
  relativePath: sourceByRecordId.get(sample.recordId)?.relativePath || "",
  zipSampleId: sample.zipSampleId,
  archiveImageName: sample.archiveImageName,
  sampleImagePath: sample.sampleImagePath,
  sampleImageExists: sample.sampleImageExists,
  priorityBand: sample.priorityBand,
  modulePlacement: "",
  reviewerOwnedVisualObservation: "",
  reviewerVisibleTextOrLabelCheck: "",
  paraphrasedTeachingConcept: "",
  representativenessNote: "",
  evidenceLimitations: "",
  publicGroundingNeeded: true,
  acceptedForWave3SemanticReview: false,
  acceptedForModuleDistillation: false,
  acceptedForDeletionReadiness: false,
  reviewerNameOrInitials: "",
  reviewedAt: "",
  reviewStatus: "blocked_missing_real_wave_3_visual_reviewer_input",
  educationOnly: true,
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
  inputTemplateStatus: "course_5_wave_3_zip_reviewer_input_template_ready_blocked_missing_input",
  sourceExecutionPack: packPath,
  waveId: pack.waveId,
  inputRows: rows.length,
  pdfRows: 0,
  zipRows: rows.length,
  readyRows: 0,
  blockedRows: rows.length,
  sourceFolderMayBeDeleted: false,
  requiredFieldsBySourceType: {
    zip: [
      "reviewerOwnedVisualObservation",
      "reviewerVisibleTextOrLabelCheck",
      "paraphrasedTeachingConcept",
      "modulePlacement",
      "representativenessNote",
      "evidenceLimitations",
      "reviewerNameOrInitials",
      "reviewedAt",
    ],
  },
  rows,
  completionRule: "This template is complete when all 61 Wave 3 ZIP sample rows are present as blank reviewer-owned input rows and all release, write, module-merge, and source-deletion gates remain closed.",
  boundary,
};

fs.mkdirSync(path.dirname(outputJson), { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(template, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Course 5 Wave 3 ZIP Reviewer Input Template",
  "",
  `- Template status: ${template.inputTemplateStatus}`,
  `- Input rows: ${template.inputRows}`,
  `- ZIP rows: ${template.zipRows}`,
  `- Blocked rows: ${template.blockedRows}`,
  `- Source folder may be deleted: ${template.sourceFolderMayBeDeleted}`,
  "",
  "## Rows",
  "",
  "| Sample | Review row | Archive image | Required mode |",
  "|---:|---|---|---|",
  ...rows.map((row) => `| ${row.executionSampleNo} | ${row.reviewRowId} | ${row.archiveImageName} | reviewer-owned visual input |`),
  "",
  "## Boundary",
  "",
  boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  inputTemplateStatus: template.inputTemplateStatus,
  inputRows: template.inputRows,
  zipRows: template.zipRows,
  blockedRows: template.blockedRows,
  sourceFolderMayBeDeleted: template.sourceFolderMayBeDeleted,
}, null, 2));
