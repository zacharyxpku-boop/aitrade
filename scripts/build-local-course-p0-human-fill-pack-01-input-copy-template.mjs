import fs from "node:fs";

const packPath = "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_01.json";
const outputJsonPath = "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_01_INPUT_COPY_TEMPLATE.json";
const outputMdPath = "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_01_INPUT_COPY_TEMPLATE.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const pack = readJson(packPath);
if (pack.educationOnly !== true) fail("fill pack must keep educationOnly:true");
if (pack.productionReady !== false) fail("fill pack must keep productionReady:false");
if (pack.learnerFacingRelease !== false || pack.approvalStatus !== "not_approved") {
  fail("fill pack release gate drift");
}

const inputEntries = (pack.packCards || []).map((card) => ({
  id: `input_copy_${card.taskId}`,
  reviewEntryId: `review_${card.taskId}`,
  taskId: card.taskId,
  sourcePackCardId: card.id,
  category: card.category,
  sourceRelativePath: card.sourceRelativePath,
  sourceModule: card.sourceModule,
  documentId: card.documentId,
  pageNumber: card.pageNumber,
  previewUrl: card.previewUrl,
  highResPreviewUrl: card.highResPreviewUrl,
  candidateId: card.candidateId,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  inputStatus: "human_fill_copy_blank",
  reviewerName: "",
  reviewedAt: "",
  packQualityRequirements: {
    riskTermFlags: card.riskTermFlags,
    riskRewriteChecklist: card.riskRewriteChecklist,
    qualityLintRules: card.qualityLintRules,
    uncertainRegions: card.uncertainRegions,
    candidateSummary: card.candidateSummary,
    warning: "Do not copy machine candidate text as human transcription. Verify against the high-resolution preview.",
  },
  manualInput: {
    humanTranscription: "",
    humanSummary: "",
    uncertainWords: [],
    publicReferenceNotes: "",
    originalityNotes: "",
    riskRewriteNotes: "",
    checklist: {
      visualTextCaptured: "not_started",
      chartLabelsCaptured: "not_started",
      unclearAreasFlagged: "not_started",
      noTradingAdviceAdded: "not_started",
      publicSourceGroundingReady: "not_started",
      originalRewriteReady: "not_started",
    },
  },
  replacementInput: null,
  acceptanceCriteria: [
    "Human transcription is verified from the high-resolution preview and does not copy machine candidate wording.",
    "Human summary is education-only and contains no trading advice, signal, return promise, broker workflow, automation, or real-money guidance.",
    "Risk rewrite notes address every riskTermFlag.",
    "Public reference notes identify historical, terminology, or source claims that need public grounding.",
    "Originality notes confirm private course wording is not copied into learner-facing lessons.",
  ],
  nextGate: "validate_pack_01_input_then_apply_dry_run_only",
}));

const inputCopyTemplate = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  fixtureOnly: false,
  templateStatus: "pack_01_input_copy_blank",
  sourceFillPack: packPath,
  packId: pack.packId,
  totalEntries: inputEntries.length,
  manualTranscriptionEntries: inputEntries.length,
  sourceReplacementEntries: 0,
  filledEntries: 0,
  readyForValidationEntries: 0,
  targetTaskIds: pack.targetTaskIds,
  targetDocumentIds: pack.targetDocumentIds,
  targetPageNumbers: pack.targetPageNumbers,
  inputEntries,
  usage: [
    "Copy this file before a human reviewer fills pack 01.",
    "Fill reviewerName, reviewedAt, humanTranscription, humanSummary, publicReferenceNotes, originalityNotes, riskRewriteNotes, uncertainWords, and checklist values.",
    "Run npm.cmd run check:local-course-p0-human-fill-pack-01-input-copy-template before and after filling a copy.",
    "Run validator and apply dry-run against the copied file; do not use --write until explicitly authorized after review.",
  ],
  completionRule: "This input copy template is only a blank carrier for pack 01. It is not ready until a human reviewer fills all required fields, every risk flag is addressed, validation succeeds, and apply dry-run reports ready entries with writtenEntries:0.",
  boundary: "Pack 01 input copy template is blank reviewer input material. It does not perform OCR, fill reviewer fields, approve learner-facing release, copy private course wording into lessons, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(inputCopyTemplate, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course P0 Human Fill Pack 01 Input Copy Template",
  "",
  "Blank reviewer-input copy template scoped to fill pack 01.",
  "",
  `- Template status: ${inputCopyTemplate.templateStatus}`,
  `- Entries: ${inputCopyTemplate.totalEntries}`,
  `- Filled entries: ${inputCopyTemplate.filledEntries}`,
  `- Ready for validation: ${inputCopyTemplate.readyForValidationEntries}`,
  `- Target tasks: ${inputCopyTemplate.targetTaskIds.join(", ")}`,
  "",
  "## Entries",
  "",
  "| Entry | Task | Page | Candidate | Status |",
  "| --- | --- | ---: | --- | --- |",
  ...inputEntries.map((entry) => `| ${entry.id} | ${entry.taskId} | ${entry.pageNumber} | ${entry.candidateId} | ${entry.inputStatus} |`),
  "",
  "## Usage",
  "",
  ...inputCopyTemplate.usage.map((item) => `- ${item}`),
  "",
  "## Completion Rule",
  "",
  inputCopyTemplate.completionRule,
  "",
  "## Boundary",
  "",
  inputCopyTemplate.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: inputCopyTemplate.educationOnly,
  productionReady: inputCopyTemplate.productionReady,
  learnerFacingRelease: inputCopyTemplate.learnerFacingRelease,
  approvalStatus: inputCopyTemplate.approvalStatus,
  fixtureOnly: inputCopyTemplate.fixtureOnly,
  templateStatus: inputCopyTemplate.templateStatus,
  totalEntries: inputCopyTemplate.totalEntries,
  filledEntries: inputCopyTemplate.filledEntries,
  readyForValidationEntries: inputCopyTemplate.readyForValidationEntries,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
