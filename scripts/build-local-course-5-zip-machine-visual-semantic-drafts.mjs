import fs from "node:fs";

const executionPackPath = "docs/LOCAL_COURSE_5_ZIP_IMAGE_PACKAGE_EXECUTION_PACK.json";
const outputJson = "docs/LOCAL_COURSE_5_ZIP_MACHINE_VISUAL_SEMANTIC_DRAFTS.json";
const outputMd = "docs/LOCAL_COURSE_5_ZIP_MACHINE_VISUAL_SEMANTIC_DRAFTS.md";

const boundary = "Course 5 ZIP machine visual semantic drafts are private reviewer-facing education operations material. They provide heuristic orientation from ZIP package metadata, archive image names, module tags, and image metrics only. They do not perform OCR, read or transcribe source text, fill reviewer conclusions, delete files, approve folder deletion, approve learner-facing release, accept machine drafts as human review, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

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

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function textHaystack(row) {
  return [
    row.relativePath,
    row.archiveImageName,
    ...(row.moduleTags || []),
    ...(row.courseAlignment || []),
  ].join(" ").toLowerCase();
}

function candidateConcepts(row) {
  const tags = new Set(row.moduleTags || []);
  const haystack = textHaystack(row);
  const concepts = [];
  if (tags.has("chart_pattern_encyclopedia") || haystack.includes("encyclopedia")) concepts.push("chart_pattern_taxonomy");
  if (tags.has("trends_and_channels") || haystack.includes("trend")) concepts.push("trend_or_channel_chart_reading");
  if (tags.has("trading_ranges") || haystack.includes("range")) concepts.push("trading_range_chart_reading");
  if (tags.has("reversals") || haystack.includes("reversal") || haystack.includes("bottom") || haystack.includes("top")) concepts.push("reversal_chart_reading");
  if (tags.has("breakouts_and_pullbacks") || haystack.includes("breakout") || haystack.includes("pullback")) concepts.push("breakout_or_pullback_chart_reading");
  if (tags.has("bar_by_bar_reading") || haystack.includes("bar-by") || haystack.includes("bar by")) concepts.push("bar_by_bar_chart_reading");
  if (tags.has("terminology_glossary") || haystack.includes("术语") || haystack.includes("glossary")) concepts.push("terminology_or_label_review");
  if (row.densityBand === "dense_chart_or_annotation") concepts.push("dense_annotated_chart_review");
  if (row.densityBand === "sparse_or_low_contrast_chart") concepts.push("low_information_or_low_contrast_sample_check");
  concepts.push("zip_image_package_semantic_sampling");
  return uniq(concepts.length ? concepts : ["generic_chart_image_review"]);
}

function draftSummary(row) {
  const concepts = candidateConcepts(row);
  const modules = (row.moduleTags || []).join(", ") || "unclassified";
  return [
    `Machine-assisted ZIP image orientation for archive image ${row.archiveImageName}.`,
    `Use as a ${row.densityBand} sample for ${modules}.`,
    `Likely reviewer concepts: ${concepts.join(", ")}.`,
    "Reviewer must inspect the actual image and verify visible labels/text manually before any module or deletion decision.",
  ].join(" ");
}

function reviewerQuestions(row) {
  const concepts = new Set(candidateConcepts(row));
  const questions = [
    "What chart structures, labels, or annotations are visibly present in this image?",
    "Which teaching module should this image support, and what is the safest paraphrased concept?",
    "Is this sample representative of the ZIP package or only a local example?",
    "What evidence would be needed before accepting this ZIP row toward deletion readiness?",
  ];
  if (concepts.has("trend_or_channel_chart_reading")) questions.push("Does the image show trend direction, channel behavior, or a transition out of trend?");
  if (concepts.has("reversal_chart_reading")) questions.push("Does the image visibly support a reversal concept, failed breakout, climax, or double-top/bottom pattern?");
  if (concepts.has("trading_range_chart_reading")) questions.push("Does the image show range boundaries, failed breakouts, or mean-reversion context?");
  if (concepts.has("dense_annotated_chart_review")) questions.push("Which annotations are essential, and which should remain private-source-only?");
  return questions;
}

function riskFlags(row) {
  const flags = [
    "private_source_not_public_grounded",
    "not_ocr_verified",
    "not_human_reviewed",
    "zip_package_sample_not_full_extraction",
  ];
  if (row.priorityBand === "P0_space_and_curriculum_blocker") flags.push("p0_large_zip_space_and_curriculum_blocker");
  if (row.densityBand === "dense_chart_or_annotation") flags.push("dense_visual_requires_careful_review");
  if (row.densityBand === "sparse_or_low_contrast_chart") flags.push("sample_may_have_low_teaching_value");
  return uniq(flags);
}

const executionPack = readJson(executionPackPath);
assertBoundary("executionPack", executionPack);
if (executionPack.executionStatus !== "course_5_zip_image_package_execution_pack_ready_blocked_on_real_visual_review") fail("ZIP execution pack not ready");

const draftRows = (executionPack.sampleRows || []).map((row) => ({
  draftId: `course5_zip_machine_visual_draft_${row.reviewRowId}`,
  reviewRowId: row.reviewRowId,
  zipSampleId: row.zipSampleId,
  recordId: row.recordId,
  relativePath: row.relativePath,
  archiveImageName: row.archiveImageName,
  archiveImageIndex: row.archiveImageIndex,
  sampleImagePath: row.sampleImagePath,
  sampleImageHref: row.sampleImageHref,
  moduleTags: row.moduleTags || [],
  courseAlignment: row.courseAlignment || [],
  densityBand: row.densityBand,
  priorityBand: row.priorityBand,
  visualMetrics: {
    width: row.width,
    height: row.height,
    edgeDensity: row.edgeDensity,
    darkPixelRatio: row.darkPixelRatio,
    visualDensity: row.visualDensity,
  },
  candidateConcepts: candidateConcepts(row),
  candidateSummary: draftSummary(row),
  reviewerQuestions: reviewerQuestions(row),
  riskFlags: riskFlags(row),
  acceptanceRequiredBeforeUse: [
    "real_visual_reviewer_note",
    "visible_text_or_label_verification",
    "module_placement_confirmation",
    "public_grounding_check",
    "original_paraphrased_teaching_rewrite",
    "explicit_release_or_deletion_readiness_approval",
  ],
  draftStatus: "zip_machine_visual_semantic_draft_needs_real_reviewer_validation",
  acceptedForZipSemanticReview: false,
  acceptedForModuleDistillation: false,
  acceptedForDeletionReadiness: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  productionReady: false,
  writeAllowedNow: false,
}));

const moduleMap = new Map();
for (const row of draftRows) {
  for (const moduleId of row.moduleTags.length ? row.moduleTags : ["unclassified_supplement"]) {
    if (!moduleMap.has(moduleId)) moduleMap.set(moduleId, []);
    moduleMap.get(moduleId).push(row);
  }
}

const moduleRows = [...moduleMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([moduleId, rows]) => {
  const conceptCounts = {};
  const densityCounts = {};
  for (const row of rows) {
    densityCounts[row.densityBand] = (densityCounts[row.densityBand] || 0) + 1;
    for (const concept of row.candidateConcepts) conceptCounts[concept] = (conceptCounts[concept] || 0) + 1;
  }
  return {
    moduleId,
    draftRows: rows.length,
    sourceZipRows: new Set(rows.map((row) => row.recordId)).size,
    dominantCandidateConcepts: Object.entries(conceptCounts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
      .map(([concept, count]) => ({ concept, count })),
    densityCounts,
    reviewerNextAction: "validate_zip_machine_drafts_then_fill_real_visual_review_input",
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    productionReady: false,
    writeAllowedNow: false,
  };
});

const densityCounts = {};
const priorityCounts = {};
for (const row of draftRows) {
  densityCounts[row.densityBand] = (densityCounts[row.densityBand] || 0) + 1;
  priorityCounts[row.priorityBand] = (priorityCounts[row.priorityBand] || 0) + 1;
}

const artifact = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  sourceExecutionPack: executionPackPath,
  draftStatus: "course_5_zip_machine_visual_semantic_drafts_ready_blocked_on_real_visual_review",
  draftMode: "heuristic_zip_image_orientation_not_ocr_not_human_review",
  zipDraftRows: draftRows.length,
  sourceZipRows: executionPack.zipRows,
  sourceZipImageEntries: executionPack.totalImageEntries,
  sourceSampleRows: executionPack.sampleRowCount,
  moduleRowCount: moduleRows.length,
  readyReviewerNotes: 0,
  acceptedForZipSemanticReviewRows: 0,
  acceptedForModuleDistillationRows: 0,
  acceptedForDeletionReadinessRows: 0,
  sourceFolderMayBeDeleted: false,
  densityCounts,
  priorityCounts,
  moduleRows,
  draftRows,
  commands: [
    "npm.cmd run build:local-course-5-zip-machine-visual-semantic-drafts",
    "npm.cmd run check:local-course-5-zip-machine-visual-semantic-drafts",
    "npm.cmd run verify",
  ],
  completionRule: "Course 5 ZIP machine visual semantic drafts are complete when all 85 ZIP representative samples have heuristic candidate concepts, reviewer questions, risk flags, and explicit blocked status. They do not count as OCR, human review, module acceptance, deletion readiness, or learner-facing release.",
  boundary,
};

fs.writeFileSync(outputJson, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Course 5 ZIP Machine Visual Semantic Drafts",
  "",
  `- Draft status: ${artifact.draftStatus}`,
  `- Draft mode: ${artifact.draftMode}`,
  `- ZIP draft rows: ${artifact.zipDraftRows}`,
  `- Source ZIP rows: ${artifact.sourceZipRows}`,
  `- Source ZIP image entries: ${artifact.sourceZipImageEntries}`,
  `- Module rows: ${artifact.moduleRowCount}`,
  `- Ready reviewer notes: ${artifact.readyReviewerNotes}`,
  `- Accepted for ZIP semantic review: ${artifact.acceptedForZipSemanticReviewRows}`,
  `- Accepted for deletion readiness: ${artifact.acceptedForDeletionReadinessRows}`,
  `- Source folder may be deleted: ${artifact.sourceFolderMayBeDeleted}`,
  "",
  "## Density Counts",
  "",
  ...Object.entries(densityCounts).map(([name, count]) => `- ${name}: ${count}`),
  "",
  "## Module Coverage",
  "",
  "| Module | Draft rows | ZIP sources | Dominant concepts |",
  "|---|---:|---:|---|",
  ...moduleRows.map((row) => `| ${row.moduleId} | ${row.draftRows} | ${row.sourceZipRows} | ${row.dominantCandidateConcepts.map((item) => `${item.concept}:${item.count}`).join(", ")} |`),
  "",
  "## First Drafts",
  "",
  ...draftRows.slice(0, 12).map((row) => `- ${row.draftId}: ${row.candidateSummary}`),
  "",
  "## Boundary",
  "",
  boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  draftStatus: artifact.draftStatus,
  zipDraftRows: artifact.zipDraftRows,
  sourceZipRows: artifact.sourceZipRows,
  sourceZipImageEntries: artifact.sourceZipImageEntries,
  moduleRowCount: artifact.moduleRowCount,
  readyReviewerNotes: artifact.readyReviewerNotes,
  acceptedForZipSemanticReviewRows: artifact.acceptedForZipSemanticReviewRows,
  acceptedForDeletionReadinessRows: artifact.acceptedForDeletionReadinessRows,
  sourceFolderMayBeDeleted: artifact.sourceFolderMayBeDeleted,
}, null, 2));
