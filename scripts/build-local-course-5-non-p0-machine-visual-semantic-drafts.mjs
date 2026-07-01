import fs from "node:fs";

const workbenchPath = "docs/LOCAL_COURSE_5_NON_P0_VISUAL_REVIEWER_WORKBENCH.json";
const outputJsonPath = "docs/LOCAL_COURSE_5_NON_P0_MACHINE_VISUAL_SEMANTIC_DRAFTS.json";
const outputMdPath = "docs/LOCAL_COURSE_5_NON_P0_MACHINE_VISUAL_SEMANTIC_DRAFTS.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function reviewMode(card) {
  if (card.sourcePriority === "P1_glossary_or_translation") return "terminology_translation_review";
  if (card.sourcePriority === "P1_price_action_structure") return "structure_module_review";
  if (card.sourcePriority === "P2_supplemental") return "supplemental_keep_or_archive_review";
  return "general_followup_review";
}

function candidateConcepts(card) {
  const hints = new Set(card.semanticHypotheses || []);
  const tags = new Set(card.moduleTags || []);
  const concepts = [];
  if (hints.has("reversal_structure_review") || tags.has("reversals")) concepts.push("reversal_structure_review");
  if (hints.has("trend_or_channel_structure_review") || tags.has("trends_and_channels")) concepts.push("trend_or_channel_structure_review");
  if (hints.has("trading_range_structure_review") || tags.has("trading_ranges")) concepts.push("trading_range_structure_review");
  if (hints.has("trade_management_vocabulary_review") || tags.has("trade_management")) concepts.push("trade_management_vocabulary_review");
  if (hints.has("bar_by_bar_reading_review") || tags.has("bar_by_bar_reading")) concepts.push("bar_by_bar_reading_review");
  if (hints.has("price_action_foundation_review") || tags.has("price_action_foundations")) concepts.push("price_action_foundation_review");
  if (hints.has("terminology_or_translation_review") || tags.has("terminology_glossary")) concepts.push("terminology_or_translation_review");
  if (hints.has("classification_needed_before_module_use") || tags.has("unclassified_supplement")) concepts.push("classification_needed_before_module_use");
  if (hints.has("pdf_page_visual_semantics")) concepts.push("pdf_page_visual_review");
  if (hints.has("standalone_chart_image_semantics")) concepts.push("standalone_chart_image_review");
  return uniq(concepts.length ? concepts : ["generic_supporting_visual_review"]);
}

function draftSummary(card) {
  const sourceType = card.sampleKind === "zip_image" ? "ZIP image-package sample" : "PDF page sample";
  const location = card.pageNumber ? `page ${card.pageNumber}` : card.archiveImageName ? `archive image ${card.archiveImageName}` : `sample ${card.sampleIndex}`;
  const moduleList = (card.moduleTags || []).join(", ") || "unclassified";
  const concepts = candidateConcepts(card);
  return [
    `Machine-assisted non-P0 reviewer orientation for a ${sourceType} at ${location}.`,
    `Use it for ${reviewMode(card)} under ${moduleList}.`,
    `Likely review concepts: ${concepts.join(", ")}.`,
    "Reviewer must verify visible text/labels manually or with OCR before using any wording.",
  ].join(" ");
}

function riskFlags(card) {
  const flags = ["private_source_not_public_grounded", "not_ocr_verified", "not_human_reviewed"];
  if (card.sourcePriority?.startsWith("P2")) flags.push("supplemental_value_must_be_justified");
  if (card.sourcePriority === "P1_glossary_or_translation") flags.push("terminology_translation_quality_risk");
  if (card.sampleKind === "zip_image") flags.push("zip_package_sample_not_full_extraction");
  if (card.semanticHypotheses?.includes("classification_needed_before_module_use")) flags.push("module_classification_uncertain");
  return uniq(flags);
}

function reviewerQuestions(card) {
  const questions = [
    "What visible educational concept can be described without copying source prose?",
    "Should this support a module, remain reviewer-only evidence, or be archived?",
    "What OCR or human visual check is needed before any wording can be used?",
    "What public grounding would be needed before learner-facing use?",
  ];
  if (card.sourcePriority?.startsWith("P2")) questions.push("Is this supplemental source worth retaining as module evidence?");
  if (card.sourcePriority === "P1_glossary_or_translation") questions.push("Are the visible terms clear, translated reliably, and safe to paraphrase?");
  return questions;
}

const workbench = readJson(workbenchPath);
if (workbench.educationOnly !== true) fail("workbench must keep educationOnly:true");
if (workbench.productionReady !== false) fail("workbench must keep productionReady:false");
if (workbench.learnerFacingRelease !== false) fail("workbench must keep learnerFacingRelease:false");
if (workbench.writeAllowedNow !== false) fail("workbench must keep writeAllowedNow:false");
if (workbench.workbenchStatus !== "course_5_non_p0_visual_reviewer_workbench_ready_release_blocked") fail("workbench not ready");

const draftRows = workbench.sampleCards.map((card) => ({
  draftId: `course5_non_p0_machine_visual_draft_${card.cardId}`,
  cardId: card.cardId,
  recordId: card.recordId,
  sourceRelativePath: card.sourceRelativePath,
  sampleImagePath: card.sampleImagePath,
  sampleKind: card.sampleKind,
  sourcePriority: card.sourcePriority,
  moduleTags: card.moduleTags || [],
  candidateConcepts: candidateConcepts(card),
  candidateSummary: draftSummary(card),
  reviewMode: reviewMode(card),
  reviewerQuestions: reviewerQuestions(card),
  riskFlags: riskFlags(card),
  acceptanceRequiredBeforeUse: [
    "human_or_ocr_verification_of_visible_text",
    "reviewer_visual_semantic_note",
    "public_grounding_check",
    "original_paraphrased_teaching_rewrite_or_archive_decision",
    "explicit_release_approval",
  ],
  draftStatus: "machine_assisted_non_p0_visual_semantic_draft_needs_reviewer_validation",
  acceptedForModuleDistillation: false,
  acceptedForDeletionReadiness: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  productionReady: false,
  writeAllowedNow: false,
}));

const moduleRows = workbench.moduleRows.map((module) => {
  const rows = draftRows.filter((row) => row.moduleTags.includes(module.moduleId));
  const conceptCounts = {};
  for (const row of rows) {
    for (const concept of row.candidateConcepts) conceptCounts[concept] = (conceptCounts[concept] || 0) + 1;
  }
  return {
    moduleId: module.moduleId,
    moduleLabel: module.moduleLabel,
    nonP0DraftRows: rows.length,
    nonP0SourceRows: module.nonP0SourceRows,
    dominantCandidateConcepts: Object.entries(conceptCounts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
      .map(([concept, count]) => ({ concept, count })),
    reviewerNextAction: rows.length
      ? "validate_non_p0_machine_visual_drafts_then_distill_or_archive"
      : "no_non_p0_machine_visual_drafts",
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    productionReady: false,
    writeAllowedNow: false,
  };
});

const priorityCounts = {};
const reviewModeCounts = {};
for (const row of draftRows) {
  priorityCounts[row.sourcePriority] = (priorityCounts[row.sourcePriority] || 0) + 1;
  reviewModeCounts[row.reviewMode] = (reviewModeCounts[row.reviewMode] || 0) + 1;
}

const artifact = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  sourceWorkbench: workbenchPath,
  draftStatus: "course_5_non_p0_machine_visual_semantic_drafts_ready_release_blocked",
  draftMode: "heuristic_non_p0_machine_assisted_orientation_not_ocr_not_human_review",
  nonP0DraftRows: draftRows.length,
  sourceWorkbenchCards: workbench.nonP0SampleCards,
  moduleRows: moduleRows.length,
  readyReviewerNotes: 0,
  acceptedForModuleDistillationRows: 0,
  acceptedForDeletionReadinessRows: 0,
  sourceFolderMayBeDeleted: false,
  priorityCounts,
  reviewModeCounts,
  moduleRows,
  draftRows,
  commands: [
    "npm.cmd run build:local-course-5-non-p0-machine-visual-semantic-drafts",
    "npm.cmd run check:local-course-5-non-p0-machine-visual-semantic-drafts",
    "npm.cmd run verify",
  ],
  completionRule: "Course 5 non-P0 machine visual semantic drafts are only reviewer orientation. They help reviewers triage P1/P2 samples into candidate concepts, questions, and keep/archive decisions, but they do not count as OCR, human review, module acceptance, deletion readiness, or learner-facing release.",
  boundary: "Course 5 non-P0 machine visual semantic drafts are private reviewer-facing education operations material. They are heuristic orientation based on metadata, file context, module tags, priority, and sample type only. They do not read or transcribe source text, fill reviewer conclusions, delete files, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Course 5 Non-P0 Machine Visual Semantic Drafts",
  "",
  `- Draft status: ${artifact.draftStatus}`,
  `- Draft mode: ${artifact.draftMode}`,
  `- Non-P0 draft rows: ${artifact.nonP0DraftRows}`,
  `- Source workbench cards: ${artifact.sourceWorkbenchCards}`,
  `- Ready reviewer notes: ${artifact.readyReviewerNotes}`,
  `- Accepted for module distillation: ${artifact.acceptedForModuleDistillationRows}`,
  `- Accepted for deletion readiness: ${artifact.acceptedForDeletionReadinessRows}`,
  `- Source folder may be deleted: ${artifact.sourceFolderMayBeDeleted}`,
  "",
  "## Priority Counts",
  "",
  ...Object.entries(priorityCounts).map(([name, count]) => `- ${name}: ${count}`),
  "",
  "## Review Mode Counts",
  "",
  ...Object.entries(reviewModeCounts).map(([name, count]) => `- ${name}: ${count}`),
  "",
  "## Module Draft Coverage",
  "",
  "| Module | Draft rows | Sources | Dominant concepts |",
  "| --- | ---: | ---: | --- |",
  ...moduleRows.map((row) => `| ${row.moduleId} | ${row.nonP0DraftRows} | ${row.nonP0SourceRows} | ${row.dominantCandidateConcepts.map((item) => `${item.concept}:${item.count}`).join(", ")} |`),
  "",
  "## First Drafts",
  "",
  ...draftRows.slice(0, 12).map((row) => `- ${row.draftId}: ${row.candidateSummary}`),
  "",
  "## Boundary",
  "",
  artifact.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  draftStatus: artifact.draftStatus,
  nonP0DraftRows: artifact.nonP0DraftRows,
  moduleRows: artifact.moduleRows,
  readyReviewerNotes: artifact.readyReviewerNotes,
  acceptedForModuleDistillationRows: artifact.acceptedForModuleDistillationRows,
  acceptedForDeletionReadinessRows: artifact.acceptedForDeletionReadinessRows,
  sourceFolderMayBeDeleted: artifact.sourceFolderMayBeDeleted,
}, null, 2));
