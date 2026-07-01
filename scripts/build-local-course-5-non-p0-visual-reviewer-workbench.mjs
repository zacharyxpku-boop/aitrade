import fs from "node:fs";

const workPacksPath = "docs/LOCAL_COURSE_5_FOLLOWUP_WORK_PACKS.json";
const synthesisPath = "docs/LOCAL_COURSE_5_MODULE_SYNTHESIS.json";
const deletionPath = "docs/LOCAL_COURSE_5_DELETION_READINESS.json";
const outputJsonPath = "docs/LOCAL_COURSE_5_NON_P0_VISUAL_REVIEWER_WORKBENCH.json";
const outputMdPath = "docs/LOCAL_COURSE_5_NON_P0_VISUAL_REVIEWER_WORKBENCH.md";

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

function sourceHints(item) {
  const tags = new Set(item.moduleTags || []);
  const priority = item.priority || "";
  const hints = [];
  if (priority.startsWith("P1")) hints.push("important_supporting_source_candidate");
  if (priority.startsWith("P2")) hints.push("supplemental_source_candidate");
  if (tags.has("reversals")) hints.push("reversal_structure_review");
  if (tags.has("trends_and_channels")) hints.push("trend_or_channel_structure_review");
  if (tags.has("trading_ranges")) hints.push("trading_range_structure_review");
  if (tags.has("trade_management")) hints.push("trade_management_vocabulary_review");
  if (tags.has("bar_by_bar_reading")) hints.push("bar_by_bar_reading_review");
  if (tags.has("price_action_foundations")) hints.push("price_action_foundation_review");
  if (tags.has("terminology_glossary")) hints.push("terminology_or_translation_review");
  if (tags.has("unclassified_supplement")) hints.push("classification_needed_before_module_use");
  if (item.extension === ".zip") hints.push("zip_image_package_review");
  if (item.extension === ".pdf") hints.push("scanned_or_low_text_pdf_review");
  return uniq(hints);
}

function requiredFields(item) {
  const fields = [
    "visible_structure_summary",
    "candidate_module_placement",
    "teaching_value_assessment",
    "uncertainty_or_ocr_need",
    "public_grounding_needed",
    "rewrite_boundary_notes",
  ];
  if (item.priority?.startsWith("P2")) fields.push("keep_or_archive_decision");
  if (item.extension === ".zip") fields.push("image_package_coverage_note");
  return fields;
}

function samplePath(sample) {
  return sample.imagePath || sample.sampleImagePath || "";
}

const workPacks = readJson(workPacksPath);
const synthesis = readJson(synthesisPath);
const deletion = readJson(deletionPath);
requireLocked("followup work packs", workPacks);
requireLocked("module synthesis", synthesis);
requireLocked("deletion readiness", deletion);

if (workPacks.followupRows !== 49) fail("Course 5 follow-up count drift");
if (deletion.sourceFolderMayBeDeleted !== false) fail("Course 5 source folder must remain non-deletable");

const moduleById = new Map((synthesis.moduleRows || []).map((row) => [row.moduleId, row]));
const nonP0Items = workPacks.workItems.filter((item) => !String(item.priority || "").startsWith("P0"));

const sourceRows = nonP0Items.map((item) => {
  const hints = sourceHints(item);
  const sampleCards = (item.sampleImages || []).map((sample, index) => ({
    cardId: `course5_non_p0_visual_sample_card_${item.recordId}_${index + 1}`,
    recordId: item.recordId,
    sampleIndex: index + 1,
    sampleKind: item.extension === ".zip" ? "zip_image" : "pdf_page",
    pageNumber: sample.pageNumber || null,
    archiveImageName: sample.archiveImageName || null,
    sampleImagePath: samplePath(sample),
    semanticHypotheses: [
      ...hints,
      item.extension === ".zip" ? "standalone_chart_image_semantics" : "pdf_page_visual_semantics",
      index === 0 ? "front_matter_or_opening_example_check" : null,
    ].filter(Boolean),
    reviewerPrompt: "Summarize visible educational value and module placement only; do not copy source prose or infer trading instructions.",
    requiredFields: [
      "visible_elements",
      "candidate_concept",
      "module_fit",
      "uncertainties",
      "public_grounding_needed",
    ],
    reviewStatus: "needs_reviewer_visual_semantic_note",
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    productionReady: false,
    writeAllowedNow: false,
  }));
  const targetModules = (item.moduleTags || []).map((moduleId) => ({
    moduleId,
    moduleLabel: moduleById.get(moduleId)?.moduleLabel || moduleId,
    nextGate: moduleById.get(moduleId)?.nextGate || "resolve_visual_semantic_review_then_distill",
  }));
  return {
    workbenchSourceId: `course5_non_p0_visual_source_${item.recordId}`,
    recordId: item.recordId,
    relativePath: item.relativePath,
    sourceLocalPath: item.sourceLocalPath,
    extension: item.extension,
    priority: item.priority,
    moduleTags: item.moduleTags || [],
    targetModules,
    courseAlignment: item.courseAlignment || [],
    pageCount: item.pageCount || null,
    imageEntryCount: item.imageEntryCount || 0,
    sampleCount: sampleCards.length,
    semanticHypotheses: hints,
    requiredReviewerFields: requiredFields(item),
    sampleCards,
    sourceReviewStatus: "needs_reviewer_semantic_distillation",
    deletionBlockerStatus: "source_folder_not_deletable_until_review_resolved",
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    productionReady: false,
    writeAllowedNow: false,
  };
});

const sampleCards = sourceRows.flatMap((source) => source.sampleCards.map((card) => ({
  ...card,
  sourcePriority: source.priority,
  sourceRelativePath: source.relativePath,
  moduleTags: source.moduleTags,
})));

const priorityCounts = {};
for (const row of sourceRows) priorityCounts[row.priority] = (priorityCounts[row.priority] || 0) + 1;

const moduleRows = [...moduleById.values()]
  .map((module) => {
    const relatedSources = sourceRows.filter((source) => source.moduleTags.includes(module.moduleId));
    return {
      moduleId: module.moduleId,
      moduleLabel: module.moduleLabel,
      nonP0SourceRows: relatedSources.length,
      nonP0SampleCards: relatedSources.reduce((sum, source) => sum + source.sampleCount, 0),
      followupRows: module.followupRows,
      nextGate: module.nextGate,
      reviewerAction: relatedSources.length
        ? "review_non_p0_visual_sample_cards_then_decide_module_distillation_or_archive"
        : "no_non_p0_visual_workbench_items",
    };
  })
  .filter((row) => row.nonP0SourceRows > 0);

const artifact = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  sourceWorkPacks: workPacksPath,
  sourceModuleSynthesis: synthesisPath,
  sourceDeletionReadiness: deletionPath,
  workbenchStatus: "course_5_non_p0_visual_reviewer_workbench_ready_release_blocked",
  nonP0SourceRows: sourceRows.length,
  nonP0SampleCards: sampleCards.length,
  priorityCounts,
  modulesWithNonP0VisualWork: moduleRows.length,
  readyReviewerNotes: 0,
  blockedReviewerNotes: sampleCards.length,
  deletionStillBlocked: true,
  sourceFolderMayBeDeleted: false,
  moduleRows,
  sourceRows,
  sampleCards,
  reviewerRules: [
    "Use these cards to decide whether P1/P2 material should become a module note, support evidence, or archive-only reference.",
    "Do not copy private source wording into teaching content.",
    "Mark OCR needs and uncertainty explicitly.",
    "Require public grounding before learner-facing wording.",
    "Never provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.",
  ],
  commands: [
    "npm.cmd run build:local-course-5-non-p0-visual-reviewer-workbench",
    "npm.cmd run check:local-course-5-non-p0-visual-reviewer-workbench",
    "npm.cmd run verify",
  ],
  completionRule: "Course 5 non-P0 visual review becomes operational when every non-P0 follow-up source has sample cards, module mapping, semantic hypotheses, required reviewer fields, and release-blocked status. These cards do not count as OCR completion, human review, module acceptance, or deletion readiness.",
  boundary: "Course 5 non-P0 visual reviewer workbench is private reviewer-facing education operations material. It organizes P1/P2 visual evidence for later paraphrased teaching-module distillation or archive decisions. It does not OCR source text, fill reviewer conclusions, delete files, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Course 5 Non-P0 Visual Reviewer Workbench",
  "",
  `- Workbench status: ${artifact.workbenchStatus}`,
  `- Non-P0 source rows: ${artifact.nonP0SourceRows}`,
  `- Non-P0 sample cards: ${artifact.nonP0SampleCards}`,
  `- Modules with non-P0 visual work: ${artifact.modulesWithNonP0VisualWork}`,
  `- Ready reviewer notes: ${artifact.readyReviewerNotes}`,
  `- Blocked reviewer notes: ${artifact.blockedReviewerNotes}`,
  `- Source folder may be deleted: ${artifact.sourceFolderMayBeDeleted}`,
  "",
  "## Priority Counts",
  "",
  ...Object.entries(priorityCounts).map(([priority, count]) => `- ${priority}: ${count}`),
  "",
  "## Module Rows",
  "",
  "| Module | Sources | Sample cards | Follow-ups | Next gate |",
  "| --- | ---: | ---: | ---: | --- |",
  ...moduleRows.map((row) => `| ${row.moduleId} | ${row.nonP0SourceRows} | ${row.nonP0SampleCards} | ${row.followupRows} | ${row.nextGate} |`),
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
  nonP0SourceRows: artifact.nonP0SourceRows,
  nonP0SampleCards: artifact.nonP0SampleCards,
  modulesWithNonP0VisualWork: artifact.modulesWithNonP0VisualWork,
  readyReviewerNotes: artifact.readyReviewerNotes,
  blockedReviewerNotes: artifact.blockedReviewerNotes,
  sourceFolderMayBeDeleted: artifact.sourceFolderMayBeDeleted,
}, null, 2));
