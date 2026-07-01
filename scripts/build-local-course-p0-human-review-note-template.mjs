import fs from "node:fs";

const assistMapPath = "docs/LOCAL_COURSE_P0_CANDIDATE_REVIEW_ASSIST_MAP.json";
const inputTemplatePath = "docs/LOCAL_COURSE_ABSORPTION_P0_REVIEW_INPUT_TEMPLATE.json";
const outputJsonPath = "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_NOTE_TEMPLATE.json";
const outputMdPath = "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_NOTE_TEMPLATE.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const assistMap = readJson(assistMapPath);
const inputTemplate = readJson(inputTemplatePath);

for (const [name, artifact] of [["assist map", assistMap], ["input template", inputTemplate]]) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false || artifact.approvalStatus !== "not_approved") {
    fail(`${name} release gate drift`);
  }
}

const inputByTask = new Map((inputTemplate.inputEntries || []).map((entry) => [entry.taskId, entry]));

const manualRequiredFields = [
  "reviewerName",
  "reviewedAt",
  "humanTranscription",
  "humanSummary",
  "uncertainWords",
  "visualTextCaptured",
  "chartLabelsCaptured",
  "unclearAreasFlagged",
  "noTradingAdviceAdded",
  "publicSourceGroundingReady",
  "originalRewriteReady",
  "riskRewriteNotes",
  "publicReferenceNotes",
  "originalityNotes",
];

const replacementRequiredFields = [
  "reviewerName",
  "reviewedAt",
  "replacementDecision",
  "replacementSourcePath",
  "replacementNote",
  "rerunEvidence",
  "sourceIdentityConfirmed",
  "replacementSourceReadable",
  "readablePreviewGenerated",
  "harvestRerunEvidenceAttached",
  "qualityAndIntakeRerunReady",
];

const noteCards = (assistMap.taskRows || []).map((row) => {
  const inputEntry = inputByTask.get(row.taskId);
  if (!inputEntry) fail(`missing input template entry for ${row.taskId}`);
  const manual = row.category === "manual_transcription";
  return {
    id: `human_note_${row.taskId}`,
    taskId: row.taskId,
    inputEntryId: inputEntry.id,
    category: row.category,
    priority: row.priority,
    documentId: row.documentId,
    pageNumber: row.pageNumber,
    sourceRelativePath: row.sourceRelativePath,
    sourceModule: row.sourceModule,
    previewUrl: row.previewUrl,
    highResPreviewUrl: row.highResPreviewUrl,
    candidateId: row.candidateId,
    matchStatus: row.matchStatus,
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    noteStatus: "blank_human_reviewer_note",
    reviewerName: "",
    reviewedAt: "",
    requiredFields: manual ? manualRequiredFields : replacementRequiredFields,
    humanFillFields: manual
      ? {
          humanTranscription: "",
          humanSummary: "",
          uncertainWords: [],
          publicReferenceNotes: "",
          originalityNotes: "",
          riskRewriteNotes: "",
        }
      : {
          replacementDecision: "",
          replacementSourcePath: "",
          replacementNote: "",
          rerunEvidence: "",
        },
    checklist: manual
      ? {
          visualTextCaptured: "not_started",
          chartLabelsCaptured: "not_started",
          unclearAreasFlagged: "not_started",
          noTradingAdviceAdded: "not_started",
          publicSourceGroundingReady: "not_started",
          originalRewriteReady: "not_started",
        }
      : {
          sourceIdentityConfirmed: "not_started",
          replacementSourceReadable: "not_started",
          readablePreviewGenerated: "not_started",
          harvestRerunEvidenceAttached: "not_started",
          qualityAndIntakeRerunReady: "not_started",
        },
    candidateSummary: row.candidateSummary,
    uncertainRegions: row.uncertainRegions || [],
    riskTermFlags: row.riskTermFlags || [],
    riskRewriteChecklist: (row.riskTermFlags || []).map((flag) => ({
      flag,
      requiredAction: "Rewrite or remove risky market-language before any learner-facing use.",
      status: "not_started",
    })),
    forbiddenClaims: [
      "stock_recommendation",
      "live_signal",
      "return_or_win_rate_promise",
      "broker_workflow",
      "auto_trading",
      "real_money_guidance",
    ],
    nextGate: manual
      ? "human_fill_review_input_then_validate_apply_dry_run"
      : "source_replacement_decision_then_rerun_quality_gates",
  };
});

const manualCards = noteCards.filter((card) => card.category === "manual_transcription");
const replacementCards = noteCards.filter((card) => card.category === "source_replacement");
const riskTermFlagCounts = manualCards.reduce((counts, card) => {
  for (const flag of card.riskTermFlags) counts[flag] = (counts[flag] || 0) + 1;
  return counts;
}, {});

const template = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  templateStatus: "blank_human_review_note_template_ready",
  sourceAssistMap: assistMapPath,
  sourceInputTemplate: inputTemplatePath,
  totalP0Tasks: noteCards.length,
  manualReviewCards: manualCards.length,
  sourceReplacementReviewCards: replacementCards.length,
  filledNoteCards: 0,
  readyForValidationCards: 0,
  acceptedForOverlayCards: 0,
  manualCardsWithCandidate: manualCards.filter((card) => card.matchStatus === "candidate_available_for_human_review").length,
  manualCardsMissingCandidate: manualCards.filter((card) => card.matchStatus !== "candidate_available_for_human_review").length,
  requiredManualFields: manualRequiredFields,
  requiredReplacementFields: replacementRequiredFields,
  riskTermFlagCounts,
  topRiskTermFlags: Object.entries(riskTermFlagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([flag, count]) => ({ flag, count })),
  noteCards,
  usage: [
    "Copy this template before filling real human reviewer notes.",
    "Machine candidates are only review aids; verify text against the high-resolution preview.",
    "Keep all risky market-language as chart-literacy context or remove it.",
    "Run validator and apply dry-run before any real overlay write.",
  ],
  completionRule: "This human review note template is complete only as a blank execution scaffold. The knowledge base is not course-ready until a human reviewer fills the required fields, resolves risk rewrite notes, validates input, applies only approved entries, and separate source-fit/public-grounding/originality gates pass.",
  boundary: "P0 human review note template is blank reviewer scaffolding. It does not perform OCR, fill reviewer fields, approve learner-facing release, copy private course wording into lessons, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(template, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course P0 Human Review Note Template",
  "",
  "Blank reviewer-note scaffold for P0 manual transcription and source replacement tasks.",
  "",
  `- Template status: ${template.templateStatus}`,
  `- Total P0 tasks: ${template.totalP0Tasks}`,
  `- Manual review cards: ${template.manualReviewCards}`,
  `- Source replacement cards: ${template.sourceReplacementReviewCards}`,
  `- Filled note cards: ${template.filledNoteCards}`,
  `- Ready for validation cards: ${template.readyForValidationCards}`,
  `- Accepted for overlay cards: ${template.acceptedForOverlayCards}`,
  "",
  "## Top Risk Flags",
  "",
  "| Flag | Count |",
  "| --- | ---: |",
  ...template.topRiskTermFlags.map((row) => `| ${row.flag} | ${row.count} |`),
  "",
  "## First Note Cards",
  "",
  "| Card | Category | Page | Candidate | Required fields | Risk flags |",
  "| --- | --- | ---: | --- | ---: | --- |",
  ...noteCards.slice(0, 12).map((card) => `| ${card.id} | ${card.category} | ${card.pageNumber || ""} | ${card.candidateId || ""} | ${card.requiredFields.length} | ${card.riskTermFlags.slice(0, 4).join(", ")} |`),
  "",
  "## Completion Rule",
  "",
  template.completionRule,
  "",
  "## Boundary",
  "",
  template.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: template.educationOnly,
  productionReady: template.productionReady,
  learnerFacingRelease: template.learnerFacingRelease,
  approvalStatus: template.approvalStatus,
  templateStatus: template.templateStatus,
  totalP0Tasks: template.totalP0Tasks,
  manualReviewCards: template.manualReviewCards,
  sourceReplacementReviewCards: template.sourceReplacementReviewCards,
  filledNoteCards: template.filledNoteCards,
  readyForValidationCards: template.readyForValidationCards,
  acceptedForOverlayCards: template.acceptedForOverlayCards,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
