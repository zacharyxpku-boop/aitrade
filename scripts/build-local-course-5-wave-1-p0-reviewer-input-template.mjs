import fs from "node:fs";
import path from "node:path";

const packPath = "docs/LOCAL_COURSE_5_WAVE_1_P0_EXECUTION_PACK.json";
const outputJson = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_1_P0_REVIEWER_INPUT_TEMPLATE.json";
const outputMd = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_1_P0_REVIEWER_INPUT_TEMPLATE.md";

const boundary = "Course 5 Wave 1 P0 reviewer input template is private reviewer-facing education operations material. It provides blank reviewer-owned input rows for the first three P0 source blockers and their representative ZIP/PDF samples. It does not perform OCR, generate reviewer conclusions, accept machine drafts as human review, merge content into learner-facing modules, delete files, approve source-folder deletion, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

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
assertBoundary("Wave 1 P0 execution pack", pack);

const rows = pack.sampleRowsDetail.map((sample) => {
  const base = {
    reviewRowId: sample.reviewRowId,
    executionSampleNo: sample.executionSampleNo,
    sourceType: sample.sourceType,
    recordId: sample.recordId,
    relativePath: pack.sourceRowsDetail.find((row) => row.recordId === sample.recordId)?.relativePath || "",
    sampleImagePath: sample.sampleImagePath,
    sampleImageExists: sample.sampleImageExists,
    priorityBand: sample.priorityBand,
    modulePlacement: "",
    paraphrasedTeachingConcept: "",
    evidenceLimitations: "",
    publicGroundingNeeded: true,
    acceptedForWave1SemanticReview: false,
    acceptedForModuleDistillation: false,
    acceptedForDeletionReadiness: false,
    reviewerNameOrInitials: "",
    reviewedAt: "",
    reviewStatus: "blocked_missing_real_wave_1_reviewer_input",
    educationOnly: true,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    productionReady: false,
    writeAllowedNow: false,
  };

  if (sample.sourceType === "zip") {
    return {
      ...base,
      zipSampleId: sample.zipSampleId,
      archiveImageName: sample.archiveImageName,
      reviewerOwnedVisualObservation: "",
      reviewerVisibleTextOrLabelCheck: "",
      representativenessNote: "",
    };
  }

  return {
    ...base,
    pageNumber: sample.pageNumber,
    reviewerOwnedOcrTextExcerpt: "",
    reviewerOwnedVisualObservation: "",
  };
});

const template = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  inputTemplateStatus: "course_5_wave_1_p0_reviewer_input_template_ready_blocked_missing_input",
  sourceExecutionPack: packPath,
  waveId: pack.waveId,
  inputRows: rows.length,
  pdfRows: rows.filter((row) => row.sourceType === "pdf").length,
  zipRows: rows.filter((row) => row.sourceType === "zip").length,
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
    pdf: [
      "reviewerOwnedOcrTextExcerpt",
      "reviewerOwnedVisualObservation",
      "paraphrasedTeachingConcept",
      "modulePlacement",
      "evidenceLimitations",
      "reviewerNameOrInitials",
      "reviewedAt",
    ],
  },
  rows,
  completionRule: "This template is complete when all 18 Wave 1 P0 sample rows are present as blank reviewer-owned input rows and all release, write, module-merge, and source-deletion gates remain closed.",
  boundary,
};

fs.mkdirSync(path.dirname(outputJson), { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(template, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Course 5 Wave 1 P0 Reviewer Input Template",
  "",
  `- Template status: ${template.inputTemplateStatus}`,
  `- Input rows: ${template.inputRows}`,
  `- PDF rows: ${template.pdfRows}`,
  `- ZIP rows: ${template.zipRows}`,
  `- Blocked rows: ${template.blockedRows}`,
  `- Source folder may be deleted: ${template.sourceFolderMayBeDeleted}`,
  "",
  "## Rows",
  "",
  "| Sample | Type | Review row | Required mode |",
  "|---:|---|---|---|",
  ...rows.map((row) => `| ${row.executionSampleNo} | ${row.sourceType} | ${row.reviewRowId} | reviewer-owned input |`),
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
  pdfRows: template.pdfRows,
  zipRows: template.zipRows,
  blockedRows: template.blockedRows,
  sourceFolderMayBeDeleted: template.sourceFolderMayBeDeleted,
}, null, 2));
