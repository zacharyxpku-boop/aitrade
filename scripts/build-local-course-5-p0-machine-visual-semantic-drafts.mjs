import fs from "node:fs";

const workbenchPath = "docs/LOCAL_COURSE_5_P0_VISUAL_REVIEWER_WORKBENCH.json";
const outputJsonPath = "docs/LOCAL_COURSE_5_P0_MACHINE_VISUAL_SEMANTIC_DRAFTS.json";
const outputMdPath = "docs/LOCAL_COURSE_5_P0_MACHINE_VISUAL_SEMANTIC_DRAFTS.md";

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

function classifyDensity(card) {
  const { edgeDensity = 0, darkPixelRatio = 0, visualDensity = 0 } = card.visualMetrics || {};
  if (visualDensity >= 0.24 || edgeDensity >= 0.11 || darkPixelRatio >= 0.18) return "dense_visual_review";
  if (visualDensity >= 0.13 || edgeDensity >= 0.055 || darkPixelRatio >= 0.07) return "medium_visual_review";
  return "sparse_visual_review";
}

function candidateConcepts(card) {
  const hints = new Set(card.semanticHypotheses || []);
  const tags = new Set(card.moduleTags || []);
  const concepts = [];
  if (hints.has("chart_pattern_taxonomy_candidate")) concepts.push("chart_pattern_taxonomy");
  if (hints.has("pattern_name_definition_candidate")) concepts.push("pattern_definition_or_name_mapping");
  if (hints.has("example_chart_structure_candidate")) concepts.push("example_chart_structure_reading");
  if (hints.has("course_1_to_4_alignment_candidate")) concepts.push("course_sequence_alignment");
  if (hints.has("term_translation_or_glossary_candidate") || tags.has("terminology_glossary")) concepts.push("terminology_or_translation_review");
  if (hints.has("standalone_chart_image_semantics")) concepts.push("standalone_chart_image_review");
  if (hints.has("pdf_page_visual_semantics")) concepts.push("pdf_page_visual_review");
  if (hints.has("machine_translation_quality_check_required")) concepts.push("translation_quality_check");
  if (tags.has("reversals")) concepts.push("reversal_vocabulary_candidate");
  if (tags.has("trends_and_channels")) concepts.push("trend_or_channel_vocabulary_candidate");
  if (tags.has("trading_ranges")) concepts.push("trading_range_vocabulary_candidate");
  return uniq(concepts.length ? concepts : ["generic_chart_literacy_candidate"]);
}

function draftSummary(card) {
  const concepts = candidateConcepts(card);
  const density = classifyDensity(card);
  const sourceType = card.sampleKind === "zip_image" ? "standalone image-package sample" : "PDF page sample";
  const moduleList = (card.moduleTags || []).join(", ") || "unclassified";
  const location = card.pageNumber ? `page ${card.pageNumber}` : card.archiveImageName ? `archive image ${card.archiveImageName}` : "sample";
  return [
    `Machine-assisted reviewer orientation for a ${sourceType} at ${location}.`,
    `Treat it as a ${density} item for ${moduleList}.`,
    `Likely review concepts: ${concepts.join(", ")}.`,
    "Reviewer must verify visible labels/text manually or with OCR before using any wording.",
  ].join(" ");
}

function riskFlags(card) {
  const flags = ["private_source_not_public_grounded", "not_ocr_verified", "not_human_reviewed"];
  const hints = new Set(card.semanticHypotheses || []);
  if (hints.has("machine_translation_quality_check_required")) flags.push("machine_translation_quality_risk");
  if (hints.has("large_encyclopedia_source_stratified_sample")) flags.push("stratified_sample_not_exhaustive");
  if (classifyDensity(card) === "dense_visual_review") flags.push("dense_visual_requires_careful_review");
  if (card.sampleKind === "zip_image") flags.push("zip_package_sample_not_full_extraction");
  return uniq(flags);
}

function reviewerQuestions(card) {
  const concepts = new Set(candidateConcepts(card));
  const questions = [
    "What visible chart or slide elements can be described without copying source prose?",
    "Which teaching module should this evidence support, and why?",
    "What uncertainty must remain until OCR or human visual review confirms it?",
    "What public source would be needed before learner-facing use?",
  ];
  if (concepts.has("terminology_or_translation_review") || concepts.has("translation_quality_check")) {
    questions.push("Are any terms machine-translated, ambiguous, or unsuitable for learner-facing wording?");
  }
  if (concepts.has("standalone_chart_image_review")) {
    questions.push("Is this image representative of the ZIP package, or only a visual example needing broader sampling?");
  }
  return questions;
}

const workbench = readJson(workbenchPath);
if (workbench.educationOnly !== true) fail("workbench must keep educationOnly:true");
if (workbench.productionReady !== false) fail("workbench must keep productionReady:false");
if (workbench.learnerFacingRelease !== false) fail("workbench must keep learnerFacingRelease:false");
if (workbench.writeAllowedNow !== false) fail("workbench must keep writeAllowedNow:false");
if (workbench.workbenchStatus !== "course_5_p0_visual_reviewer_workbench_ready_release_blocked") fail("workbench not ready");

const draftRows = workbench.sampleCards.map((card) => ({
  draftId: `course5_p0_machine_visual_draft_${card.sampleId}`,
  cardId: card.cardId,
  sampleId: card.sampleId,
  recordId: card.recordId,
  sourceRelativePath: card.sourceRelativePath,
  sampleImagePath: card.sampleImagePath,
  sampleKind: card.sampleKind,
  moduleTags: card.moduleTags || [],
  candidateConcepts: candidateConcepts(card),
  candidateSummary: draftSummary(card),
  visualReviewDensity: classifyDensity(card),
  visualMetrics: card.visualMetrics,
  reviewerQuestions: reviewerQuestions(card),
  riskFlags: riskFlags(card),
  acceptanceRequiredBeforeUse: [
    "human_or_ocr_verification_of_visible_text",
    "reviewer_visual_semantic_note",
    "public_grounding_check",
    "original_paraphrased_teaching_rewrite",
    "explicit_release_approval",
  ],
  draftStatus: "machine_assisted_visual_semantic_draft_needs_reviewer_validation",
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
    p0DraftRows: rows.length,
    p0SourceRows: module.p0SourceRows,
    dominantCandidateConcepts: Object.entries(conceptCounts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
      .map(([concept, count]) => ({ concept, count })),
    reviewerNextAction: rows.length
      ? "validate_machine_visual_drafts_then_write_reviewer_notes"
      : "no_p0_machine_visual_drafts",
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    productionReady: false,
    writeAllowedNow: false,
  };
});

const densityCounts = {};
for (const row of draftRows) densityCounts[row.visualReviewDensity] = (densityCounts[row.visualReviewDensity] || 0) + 1;

const artifact = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  sourceWorkbench: workbenchPath,
  draftStatus: "course_5_p0_machine_visual_semantic_drafts_ready_release_blocked",
  draftMode: "heuristic_machine_assisted_orientation_not_ocr_not_human_review",
  p0DraftRows: draftRows.length,
  sourceWorkbenchCards: workbench.p0SampleCards,
  moduleRows: moduleRows.length,
  readyReviewerNotes: 0,
  acceptedForModuleDistillationRows: 0,
  acceptedForDeletionReadinessRows: 0,
  sourceFolderMayBeDeleted: false,
  densityCounts,
  moduleRows,
  draftRows,
  commands: [
    "npm.cmd run build:local-course-5-p0-machine-visual-semantic-drafts",
    "npm.cmd run check:local-course-5-p0-machine-visual-semantic-drafts",
    "npm.cmd run verify",
  ],
  completionRule: "Course 5 P0 machine visual semantic drafts are only reviewer orientation. They help reviewers triage chart/slide samples into candidate concepts, questions, and risk flags, but they do not count as OCR, human review, module acceptance, deletion readiness, or learner-facing release.",
  boundary: "Course 5 P0 machine visual semantic drafts are private reviewer-facing education operations material. They are heuristic orientation based on metadata, file context, module tags, and image metrics only. They do not read or transcribe source text, fill reviewer conclusions, delete files, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Course 5 P0 Machine Visual Semantic Drafts",
  "",
  `- Draft status: ${artifact.draftStatus}`,
  `- Draft mode: ${artifact.draftMode}`,
  `- P0 draft rows: ${artifact.p0DraftRows}`,
  `- Source workbench cards: ${artifact.sourceWorkbenchCards}`,
  `- Ready reviewer notes: ${artifact.readyReviewerNotes}`,
  `- Accepted for module distillation: ${artifact.acceptedForModuleDistillationRows}`,
  `- Accepted for deletion readiness: ${artifact.acceptedForDeletionReadinessRows}`,
  `- Source folder may be deleted: ${artifact.sourceFolderMayBeDeleted}`,
  "",
  "## Density Counts",
  "",
  ...Object.entries(densityCounts).map(([name, count]) => `- ${name}: ${count}`),
  "",
  "## Module Draft Coverage",
  "",
  "| Module | Draft rows | Sources | Dominant concepts |",
  "| --- | ---: | ---: | --- |",
  ...moduleRows.map((row) => `| ${row.moduleId} | ${row.p0DraftRows} | ${row.p0SourceRows} | ${row.dominantCandidateConcepts.map((item) => `${item.concept}:${item.count}`).join(", ")} |`),
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
  p0DraftRows: artifact.p0DraftRows,
  moduleRows: artifact.moduleRows,
  readyReviewerNotes: artifact.readyReviewerNotes,
  acceptedForModuleDistillationRows: artifact.acceptedForModuleDistillationRows,
  acceptedForDeletionReadinessRows: artifact.acceptedForDeletionReadinessRows,
  sourceFolderMayBeDeleted: artifact.sourceFolderMayBeDeleted,
}, null, 2));
