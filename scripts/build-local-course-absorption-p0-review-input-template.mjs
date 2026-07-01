import fs from "node:fs";

const overlayPath = "docs/LOCAL_COURSE_ABSORPTION_P0_REVIEW_OVERLAY.json";
const outputJsonPath = "docs/LOCAL_COURSE_ABSORPTION_P0_REVIEW_INPUT_TEMPLATE.json";
const outputMdPath = "docs/LOCAL_COURSE_ABSORPTION_P0_REVIEW_INPUT_TEMPLATE.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const overlay = readJson(overlayPath);
if (overlay.educationOnly !== true) fail("overlay must keep educationOnly:true");
if (overlay.productionReady !== false) fail("overlay must keep productionReady:false");
if (overlay.learnerFacingRelease !== false) fail("overlay must keep learnerFacingRelease:false");
if (overlay.approvalStatus !== "not_approved") fail("overlay must remain not_approved");

const inputEntries = (overlay.reviewEntries || []).map((entry) => {
  const manual = entry.category === "manual_transcription";
  return {
    id: `input_${entry.taskId}`,
    reviewEntryId: entry.id,
    taskId: entry.taskId,
    category: entry.category,
    sourceRelativePath: entry.sourceRelativePath,
    sourceModule: entry.sourceModule,
    documentId: entry.documentId,
    pageNumber: entry.pageNumber,
    previewUrl: entry.previewUrl,
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    inputStatus: "template_blank",
    reviewerName: "",
    reviewedAt: "",
    manualInput: manual
      ? {
          humanTranscription: "",
          humanSummary: "",
          uncertainWords: [],
          checklist: {
            visualTextCaptured: "not_started",
            chartLabelsCaptured: "not_started",
            unclearAreasFlagged: "not_started",
            noTradingAdviceAdded: "not_started",
            publicSourceGroundingReady: "not_started",
            originalRewriteReady: "not_started",
          },
        }
      : null,
    replacementInput: manual
      ? null
      : {
          replacementSourcePath: "",
          replacementNote: "",
          rerunEvidence: "",
          checklist: {
            sourceIdentityConfirmed: "not_started",
            replacementSourceReadable: "not_started",
            readablePreviewGenerated: "not_started",
            harvestRerunEvidenceAttached: "not_started",
            qualityAndIntakeRerunReady: "not_started",
          },
        },
    acceptanceCriteria: entry.acceptanceCriteria,
    nextGate: entry.nextGate,
  };
});

const inputTemplate = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  templateStatus: "blank_reviewer_input_template",
  sourceOverlay: overlayPath,
  totalEntries: inputEntries.length,
  manualTranscriptionEntries: inputEntries.filter((entry) => entry.category === "manual_transcription").length,
  sourceReplacementEntries: inputEntries.filter((entry) => entry.category === "source_replacement").length,
  filledEntries: 0,
  readyForValidationEntries: 0,
  inputEntries,
  usage: [
    "Copy this template before filling reviewer input.",
    "For manual_transcription entries, fill humanTranscription, humanSummary, uncertainWords if needed, and checklist values.",
    "For source_replacement entries, fill replacementSourcePath, replacementNote, rerunEvidence, and checklist values.",
    "Run npm.cmd run validate:local-course-absorption-p0-review-input after filling a copy.",
  ],
  boundary: "P0 review input template is a blank human-input carrier for local private course absorption blockers. It does not perform OCR, infer missing content, approve learner-facing release, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(inputTemplate, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course Absorption P0 Review Input Template",
  "",
  "Blank input carrier for reviewer-filled P0 transcription and source replacement work.",
  "",
  `- Template status: ${inputTemplate.templateStatus}`,
  `- Total entries: ${inputTemplate.totalEntries}`,
  `- Manual transcription entries: ${inputTemplate.manualTranscriptionEntries}`,
  `- Source replacement entries: ${inputTemplate.sourceReplacementEntries}`,
  `- Filled entries: ${inputTemplate.filledEntries}`,
  `- Ready for validation entries: ${inputTemplate.readyForValidationEntries}`,
  "",
  "## Usage",
  "",
  ...inputTemplate.usage.map((item) => `- ${item}`),
  "",
  "## First Entries",
  "",
  "| Input entry | Category | Source | Page | Status |",
  "| --- | --- | --- | ---: | --- |",
  ...inputEntries.slice(0, 12).map((entry) => `| ${entry.id} | ${entry.category} | ${entry.sourceRelativePath} | ${entry.pageNumber || ""} | ${entry.inputStatus} |`),
  "",
  "## Boundary",
  "",
  inputTemplate.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: inputTemplate.educationOnly,
  productionReady: inputTemplate.productionReady,
  learnerFacingRelease: inputTemplate.learnerFacingRelease,
  approvalStatus: inputTemplate.approvalStatus,
  templateStatus: inputTemplate.templateStatus,
  totalEntries: inputTemplate.totalEntries,
  manualTranscriptionEntries: inputTemplate.manualTranscriptionEntries,
  sourceReplacementEntries: inputTemplate.sourceReplacementEntries,
  filledEntries: inputTemplate.filledEntries,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
