import fs from "node:fs";

const noteTemplatePath = "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_NOTE_TEMPLATE.json";
const outputJsonPath = "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_01.json";
const outputMdPath = "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_01.md";

const targetTaskIds = [
  "absorb_manual_transcription_09",
  "absorb_manual_transcription_10",
  "absorb_manual_transcription_11",
  "absorb_manual_transcription_12",
];

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const noteTemplate = readJson(noteTemplatePath);
if (noteTemplate.educationOnly !== true) fail("note template must keep educationOnly:true");
if (noteTemplate.productionReady !== false) fail("note template must keep productionReady:false");
if (noteTemplate.learnerFacingRelease !== false || noteTemplate.approvalStatus !== "not_approved") {
  fail("note template release gate drift");
}

const noteByTask = new Map((noteTemplate.noteCards || []).map((card) => [card.taskId, card]));
const packCards = targetTaskIds.map((taskId) => {
  const note = noteByTask.get(taskId);
  if (!note) fail(`missing note card ${taskId}`);
  if (note.category !== "manual_transcription") fail(`${taskId} must be a manual transcription card`);
  return {
    id: `fill_pack_01_${taskId}`,
    noteCardId: note.id,
    taskId: note.taskId,
    inputEntryId: note.inputEntryId,
    category: note.category,
    priority: note.priority,
    documentId: note.documentId,
    pageNumber: note.pageNumber,
    sourceRelativePath: note.sourceRelativePath,
    sourceModule: note.sourceModule,
    previewUrl: note.previewUrl,
    highResPreviewUrl: note.highResPreviewUrl,
    candidateId: note.candidateId,
    matchStatus: note.matchStatus,
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    fillStatus: "blank_ready_for_human_fill",
    reviewerName: "",
    reviewedAt: "",
    requiredFields: note.requiredFields,
    fieldValues: {
      humanTranscription: "",
      humanSummary: "",
      uncertainWords: [],
      publicReferenceNotes: "",
      originalityNotes: "",
      riskRewriteNotes: "",
    },
    checklist: note.checklist,
    candidateSummary: note.candidateSummary,
    uncertainRegions: note.uncertainRegions,
    riskTermFlags: note.riskTermFlags,
    riskRewriteChecklist: note.riskRewriteChecklist,
    qualityLintRules: [
      "humanTranscription must be human-verified against high-res preview, not copied from the machine candidate.",
      "humanSummary must be education-only and cannot contain advice, signal, return, broker, automation, or real-money guidance.",
      "riskRewriteNotes must address every riskTermFlag before validation.",
      "publicReferenceNotes must name public grounding needed for historical, terminology, or source claims.",
      "originalityNotes must confirm private course wording was not copied into learner-facing content.",
    ],
    nextGate: "human_fill_pack_then_validate_p0_review_input_copy",
  };
});

const riskTermFlagCounts = packCards.reduce((counts, card) => {
  for (const flag of card.riskTermFlags || []) counts[flag] = (counts[flag] || 0) + 1;
  return counts;
}, {});

const pack = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  packId: "local_course_p0_human_fill_pack_01",
  packStatus: "blank_human_fill_pack_ready",
  sourceNoteTemplate: noteTemplatePath,
  selectionRationale: "First human-fill pack uses corpus_1580 pages 1-4 because they emphasize provenance, history, and OHLC foundations rather than direct trade execution language.",
  totalPackCards: packCards.length,
  manualFillCards: packCards.length,
  filledCards: 0,
  readyForValidationCards: 0,
  acceptedForOverlayCards: 0,
  targetTaskIds,
  targetDocumentIds: [...new Set(packCards.map((card) => card.documentId))],
  targetPageNumbers: packCards.map((card) => card.pageNumber),
  riskTermFlagCounts,
  topRiskTermFlags: Object.entries(riskTermFlagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([flag, count]) => ({ flag, count })),
  packCards,
  requiredCommandsAfterHumanFill: [
    "node scripts/validate-local-course-absorption-p0-review-input.mjs --input <copied-filled-input.json>",
    "node scripts/apply-local-course-absorption-p0-review-input.mjs --input <copied-filled-input.json>",
    "npm.cmd run check:local-course-absorption-p0-review-overlay",
    "npm.cmd run check:local-course-absorption-readiness",
  ],
  completionRule: "This fill pack is complete only as a blank human execution packet. It becomes ready for overlay apply only after a human reviewer fills a copied input file, every quality lint rule passes, dry-run validation succeeds, and no learner-facing release is approved.",
  boundary: "P0 human fill pack is blank reviewer work material. It does not perform OCR, fill reviewer fields, approve learner-facing release, copy private course wording into lessons, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course P0 Human Fill Pack 01",
  "",
  "Blank human-fill execution packet for the first candidate-assisted P0 manual transcription cards.",
  "",
  `- Pack status: ${pack.packStatus}`,
  `- Cards: ${pack.totalPackCards}`,
  `- Filled cards: ${pack.filledCards}`,
  `- Ready for validation: ${pack.readyForValidationCards}`,
  `- Accepted for overlay: ${pack.acceptedForOverlayCards}`,
  `- Target tasks: ${pack.targetTaskIds.join(", ")}`,
  "",
  "## Cards",
  "",
  "| Card | Source | Page | Candidate | Risk flags |",
  "| --- | --- | ---: | --- | --- |",
  ...packCards.map((card) => `| ${card.id} | ${card.documentId} | ${card.pageNumber} | ${card.candidateId} | ${card.riskTermFlags.join(", ")} |`),
  "",
  "## Quality Lint Rules",
  "",
  ...packCards[0].qualityLintRules.map((rule) => `- ${rule}`),
  "",
  "## Completion Rule",
  "",
  pack.completionRule,
  "",
  "## Boundary",
  "",
  pack.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: pack.educationOnly,
  productionReady: pack.productionReady,
  learnerFacingRelease: pack.learnerFacingRelease,
  approvalStatus: pack.approvalStatus,
  packId: pack.packId,
  packStatus: pack.packStatus,
  totalPackCards: pack.totalPackCards,
  filledCards: pack.filledCards,
  readyForValidationCards: pack.readyForValidationCards,
  acceptedForOverlayCards: pack.acceptedForOverlayCards,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
