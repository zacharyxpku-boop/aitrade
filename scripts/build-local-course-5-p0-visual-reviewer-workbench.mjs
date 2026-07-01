import fs from "node:fs";

const evidencePath = "docs/LOCAL_COURSE_5_P0_VISUAL_EVIDENCE_PACK.json";
const synthesisPath = "docs/LOCAL_COURSE_5_MODULE_SYNTHESIS.json";
const deletionPath = "docs/LOCAL_COURSE_5_DELETION_READINESS.json";
const outputJsonPath = "docs/LOCAL_COURSE_5_P0_VISUAL_REVIEWER_WORKBENCH.json";
const outputMdPath = "docs/LOCAL_COURSE_5_P0_VISUAL_REVIEWER_WORKBENCH.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function requireLocked(name, artifact) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${name} must keep approvalStatus:not_approved`);
  if ("writeAllowedNow" in artifact && artifact.writeAllowedNow !== false) fail(`${name} must keep writeAllowedNow:false`);
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function semanticHintsForSource(source) {
  const tags = new Set(source.moduleTags || []);
  const path = String(source.relativePath || "").toLowerCase();
  const hints = [];
  if (tags.has("chart_pattern_encyclopedia")) hints.push("chart_pattern_taxonomy_candidate", "pattern_name_definition_candidate", "example_chart_structure_candidate");
  if (tags.has("course_slides_alignment")) hints.push("course_1_to_4_alignment_candidate", "lesson_sequence_bridge_candidate");
  if (tags.has("terminology_glossary")) hints.push("term_translation_or_glossary_candidate");
  if (/reversal|反转|回转/.test(path)) hints.push("reversal_pattern_candidate");
  if (/trend|趋势|channel|通道/.test(path)) hints.push("trend_or_channel_candidate");
  if (/trading range|range|区间/.test(path)) hints.push("trading_range_candidate");
  if (/bar-by-bar|bars|逐根|k线/.test(path)) hints.push("bar_by_bar_reading_candidate");
  if (/google|有道|机翻|translation|翻译/.test(path)) hints.push("machine_translation_quality_check_required");
  if (source.extension === ".zip") hints.push("image_package_representative_sample_candidate");
  if ((source.pageCount || 0) >= 9000 || (source.imageEntryCount || 0) >= 9000) hints.push("large_encyclopedia_source_stratified_sample");
  return uniq(hints);
}

function semanticHintsForSample(sample, sourceHints) {
  const hints = [...sourceHints];
  if (sample.sampleKind === "pdf_page") hints.push("pdf_page_visual_semantics");
  if (sample.sampleKind === "zip_image") hints.push("standalone_chart_image_semantics");
  if ((sample.edgeDensity || 0) >= 0.08) hints.push("dense_chart_or_annotation_candidate");
  if ((sample.darkPixelRatio || 0) >= 0.12) hints.push("high_text_or_dark_marking_candidate");
  if ((sample.visualDensity || 0) < 0.08) hints.push("low_density_slide_or_sparse_chart_candidate");
  if (sample.pageNumber === 1 || sample.archiveImageIndex === 0) hints.push("front_matter_or_opening_example_check");
  return uniq(hints);
}

function reviewFieldsForSource(source) {
  const base = [
    "visible_chart_or_slide_summary",
    "candidate_teaching_concept",
    "pattern_or_structure_terms_seen",
    "module_placement_decision",
    "public_grounding_needed",
    "rewrite_boundary_notes",
  ];
  if (source.moduleTags?.includes("terminology_glossary")) base.push("translation_or_term_quality_note");
  if (source.extension === ".zip") base.push("representative_image_package_coverage_note");
  if ((source.pageCount || 0) >= 9000) base.push("large_pdf_sampling_sufficiency_note");
  return base;
}

function sourcePriorityRank(source) {
  if (source.priority === "P0_chart_encyclopedia_core" && (source.pageCount || source.imageEntryCount || 0) >= 9000) return 1;
  if (source.priority === "P0_chart_encyclopedia_core") return 2;
  if (source.priority === "P0_course_slide_alignment") return 3;
  return 4;
}

const evidence = readJson(evidencePath);
const synthesis = readJson(synthesisPath);
const deletion = readJson(deletionPath);
requireLocked("P0 visual evidence", evidence);
requireLocked("module synthesis", synthesis);
requireLocked("deletion readiness", deletion);

if (evidence.evidenceStatus !== "course_5_p0_visual_evidence_deepened_release_blocked") fail("P0 visual evidence is not ready");
if (deletion.sourceFolderMayBeDeleted !== false) fail("Course 5 source folder must remain non-deletable");
if (synthesis.learnerReadyModules !== 0) fail("Course 5 must not have learner-ready modules");

const moduleById = new Map((synthesis.moduleRows || []).map((row) => [row.moduleId, row]));
const sourceRows = evidence.sourceRows.map((source) => {
  const sourceHints = semanticHintsForSource(source);
  const targetModules = (source.moduleTags || []).map((moduleId) => {
    const module = moduleById.get(moduleId);
    return {
      moduleId,
      moduleLabel: module?.moduleLabel || moduleId,
      nextGate: module?.nextGate || "resolve_visual_semantic_review_then_distill",
    };
  });
  const sampleCards = (source.samples || []).map((sample) => ({
    cardId: `course5_p0_visual_sample_card_${sample.sampleId}`,
    sampleId: sample.sampleId,
    sampleKind: sample.sampleKind,
    pageNumber: sample.pageNumber || null,
    archiveImageName: sample.archiveImageName || null,
    sampleImagePath: sample.sampleImagePath,
    visualMetrics: {
      edgeDensity: sample.edgeDensity,
      darkPixelRatio: sample.darkPixelRatio,
      visualDensity: sample.visualDensity,
      width: sample.width,
      height: sample.height,
    },
    semanticHypotheses: semanticHintsForSample(sample, sourceHints),
    reviewerPrompt: "Describe only visible chart/slide structure and teaching relevance; do not copy source prose or infer trading instructions.",
    requiredFields: [
      "visible_elements",
      "chart_structure_or_pattern_candidate",
      "teaching_use",
      "uncertainties",
      "public_grounding_needed",
    ],
    reviewStatus: "needs_reviewer_visual_semantic_note",
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    productionReady: false,
    writeAllowedNow: false,
  }));
  return {
    workbenchSourceId: `course5_p0_visual_source_${source.recordId}`,
    recordId: source.recordId,
    relativePath: source.relativePath,
    sourceLocalPath: source.sourceLocalPath,
    extension: source.extension,
    priority: source.priority,
    priorityRank: sourcePriorityRank(source),
    moduleTags: source.moduleTags || [],
    targetModules,
    courseAlignment: source.courseAlignment || [],
    pageCount: source.pageCount || null,
    imageEntryCount: source.imageEntryCount || 0,
    sampleCount: source.sampleCount,
    semanticHypotheses: sourceHints,
    requiredReviewerFields: reviewFieldsForSource(source),
    sampleCards,
    sourceReviewStatus: "needs_reviewer_semantic_distillation",
    deletionBlockerStatus: "source_folder_not_deletable_until_review_resolved",
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    productionReady: false,
    writeAllowedNow: false,
  };
}).sort((a, b) => a.priorityRank - b.priorityRank || b.sampleCount - a.sampleCount || a.recordId.localeCompare(b.recordId));

const sampleCards = sourceRows.flatMap((source) => source.sampleCards.map((card) => ({
  ...card,
  recordId: source.recordId,
  sourcePriority: source.priority,
  sourceRelativePath: source.relativePath,
  moduleTags: source.moduleTags,
})));

const moduleRows = [...moduleById.values()]
  .map((module) => {
    const relatedSources = sourceRows.filter((source) => source.moduleTags.includes(module.moduleId));
    return {
      moduleId: module.moduleId,
      moduleLabel: module.moduleLabel,
      p0SourceRows: relatedSources.length,
      p0SampleCards: relatedSources.reduce((sum, source) => sum + source.sampleCount, 0),
      followupRows: module.followupRows,
      nextGate: module.nextGate,
      reviewerAction: relatedSources.length
        ? "review_p0_visual_sample_cards_then_write_paraphrased_module_notes"
        : "no_p0_visual_workbench_items",
    };
  })
  .filter((row) => row.p0SourceRows > 0);

const artifact = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  sourceP0EvidencePack: evidencePath,
  sourceModuleSynthesis: synthesisPath,
  sourceDeletionReadiness: deletionPath,
  workbenchStatus: "course_5_p0_visual_reviewer_workbench_ready_release_blocked",
  p0SourceRows: sourceRows.length,
  p0SampleCards: sampleCards.length,
  p0PdfSources: sourceRows.filter((row) => row.extension === ".pdf").length,
  p0ZipSources: sourceRows.filter((row) => row.extension === ".zip").length,
  modulesWithP0VisualWork: moduleRows.length,
  readyReviewerNotes: 0,
  blockedReviewerNotes: sampleCards.length,
  deletionStillBlocked: true,
  sourceFolderMayBeDeleted: false,
  reviewFieldCount: sourceRows.reduce((sum, source) => sum + source.requiredReviewerFields.length, 0),
  moduleRows,
  sourceRows,
  sampleCards,
  reviewerRules: [
    "Write concise visual-semantic notes, not copied source text.",
    "Convert visible examples into paraphrased education-only module candidates.",
    "Mark uncertainty when OCR, labels, pattern names, or translations are unclear.",
    "Require public grounding before any learner-facing lesson wording.",
    "Never produce stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.",
  ],
  commands: [
    "npm.cmd run build:local-course-5-p0-visual-reviewer-workbench",
    "npm.cmd run check:local-course-5-p0-visual-reviewer-workbench",
    "npm.cmd run verify",
  ],
  completionRule: "Course 5 P0 visual review becomes operational when every P0 visual evidence sample is converted into a reviewer card with module mapping, semantic hypotheses, required note fields, safety rules, and release-blocked status. It is still not absorbed enough to delete the source folder until reviewer/OCR outputs resolve the blocker rows.",
  boundary: "Course 5 P0 visual reviewer workbench is private reviewer-facing education operations material. It organizes visual evidence into review tasks for later paraphrased teaching-module distillation. It does not OCR source text, fill reviewer conclusions, delete files, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Course 5 P0 Visual Reviewer Workbench",
  "",
  `- Workbench status: ${artifact.workbenchStatus}`,
  `- P0 source rows: ${artifact.p0SourceRows}`,
  `- P0 sample cards: ${artifact.p0SampleCards}`,
  `- Modules with P0 visual work: ${artifact.modulesWithP0VisualWork}`,
  `- Ready reviewer notes: ${artifact.readyReviewerNotes}`,
  `- Blocked reviewer notes: ${artifact.blockedReviewerNotes}`,
  `- Source folder may be deleted: ${artifact.sourceFolderMayBeDeleted}`,
  `- Write allowed now: ${artifact.writeAllowedNow}`,
  "",
  "## Module Rows",
  "",
  "| Module | Sources | Sample cards | Follow-ups | Next gate |",
  "| --- | ---: | ---: | ---: | --- |",
  ...moduleRows.map((row) => `| ${row.moduleId} | ${row.p0SourceRows} | ${row.p0SampleCards} | ${row.followupRows} | ${row.nextGate} |`),
  "",
  "## First Source Rows",
  "",
  "| Source | Priority | Samples | Semantic hypotheses |",
  "| --- | --- | ---: | --- |",
  ...sourceRows.slice(0, 20).map((row) => `| ${row.relativePath} | ${row.priority} | ${row.sampleCount} | ${row.semanticHypotheses.join(", ")} |`),
  "",
  "## Reviewer Rules",
  "",
  ...artifact.reviewerRules.map((rule) => `- ${rule}`),
  "",
  "## Boundary",
  "",
  artifact.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  workbenchStatus: artifact.workbenchStatus,
  p0SourceRows: artifact.p0SourceRows,
  p0SampleCards: artifact.p0SampleCards,
  modulesWithP0VisualWork: artifact.modulesWithP0VisualWork,
  readyReviewerNotes: artifact.readyReviewerNotes,
  blockedReviewerNotes: artifact.blockedReviewerNotes,
  sourceFolderMayBeDeleted: artifact.sourceFolderMayBeDeleted,
}, null, 2));
