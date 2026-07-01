import fs from "node:fs";
import path from "node:path";

const packPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_EXECUTION_PACK.json";
const outputJson = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_REVIEWER_INPUT_TEMPLATE.json";
const outputMd = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_REVIEWER_INPUT_TEMPLATE.md";

const boundary = "Course 5 Wave 5 PDF reviewer input template is private reviewer-facing education operations material. It provides blank reviewer-owned OCR, visual-semantic, and future-loss decision input rows for the 29 remaining PDF OCR or future-loss decision blockers and their representative page samples. It does not perform OCR, generate reviewer conclusions, accept machine drafts as human review, merge content into learner-facing modules, delete files, approve source-folder deletion, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

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
assertBoundary("Wave 5 PDF execution pack", pack);

if (!Array.isArray(pack.sourceRowsDetail) || pack.sourceRowsDetail.length !== 29) fail("expected 29 Wave 5 PDF source rows");
if (!Array.isArray(pack.sampleRowsDetail) || pack.sampleRowsDetail.length !== 85) fail("expected 85 Wave 5 PDF samples");

const sourceByRecordId = new Map(pack.sourceRowsDetail.map((row) => [row.recordId, row]));
const rows = pack.sampleRowsDetail.map((sample) => {
  if (sample.sourceType !== "pdf") fail(`Wave 5 sample must be pdf: ${sample.reviewRowId}`);
  const source = sourceByRecordId.get(sample.recordId);
  return {
    reviewRowId: sample.reviewRowId,
    executionSampleNo: sample.executionSampleNo,
    sourceType: "pdf",
    recordId: sample.recordId,
    relativePath: source?.relativePath || "",
    pageNumber: sample.pageNumber,
    sampleImagePath: sample.sampleImagePath,
    sampleImageExists: sample.sampleImageExists,
    sampleSource: sample.sampleSource,
    priorityBand: sample.priorityBand,
    moduleTags: sample.moduleTags || [],
    candidateConcepts: sample.candidateConcepts || [],
    reviewerOwnedOcrTextExcerpt: "",
    reviewerOwnedVisualObservation: "",
    paraphrasedTeachingConcept: "",
    modulePlacement: "",
    futureLossDecision: "",
    evidenceLimitations: "",
    publicGroundingNeeded: true,
    acceptedForWave5PdfSemanticReview: false,
    acceptedForModuleDistillation: false,
    acceptedForDeletionReadiness: false,
    reviewerNameOrInitials: "",
    reviewedAt: "",
    reviewStatus: "blocked_missing_real_wave_5_pdf_reviewer_input",
    educationOnly: true,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    productionReady: false,
    writeAllowedNow: false,
  };
});

const template = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  inputTemplateStatus: "course_5_wave_5_pdf_reviewer_input_template_ready_blocked_missing_input",
  sourceExecutionPack: packPath,
  waveId: pack.waveId,
  sourceRoot: pack.sourceRoot,
  inputRows: rows.length,
  pdfRows: rows.length,
  zipRows: 0,
  readyRows: 0,
  blockedRows: rows.length,
  sourceFolderMayBeDeleted: false,
  requiredFieldsBySourceType: {
    pdf: [
      "reviewerOwnedOcrTextExcerpt",
      "reviewerOwnedVisualObservation",
      "paraphrasedTeachingConcept",
      "modulePlacement",
      "futureLossDecision",
      "evidenceLimitations",
      "reviewerNameOrInitials",
      "reviewedAt",
    ],
  },
  rows,
  completionRule: "This template is complete when all 85 Wave 5 PDF representative page samples are present as blank reviewer-owned OCR, visual-semantic, and future-loss decision input rows and all release, write, module-merge, and source-deletion gates remain closed.",
  boundary,
};

fs.mkdirSync(path.dirname(outputJson), { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(template, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Course 5 Wave 5 PDF Reviewer Input Template",
  "",
  `- Template status: ${template.inputTemplateStatus}`,
  `- Input rows: ${template.inputRows}`,
  `- PDF rows: ${template.pdfRows}`,
  `- Blocked rows: ${template.blockedRows}`,
  `- Source folder may be deleted: ${template.sourceFolderMayBeDeleted}`,
  "",
  "## Rows",
  "",
  "| Sample | Review row | Page | Required mode |",
  "|---:|---|---:|---|",
  ...rows.map((row) => `| ${row.executionSampleNo} | ${row.reviewRowId} | ${row.pageNumber} | reviewer-owned PDF OCR/visual/future-loss input |`),
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
