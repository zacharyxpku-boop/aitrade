import fs from "node:fs";

const intakePath = "docs/LOCAL_COURSE_5_DOCUMENT_INTAKE.json";
const containerPath = "docs/LOCAL_COURSE_5_CONTAINER_INDEX.json";
const visualQueuePath = "docs/LOCAL_COURSE_5_VISUAL_REVIEW_QUEUE.json";
const visualMapPath = "docs/LOCAL_COURSE_5_VISUAL_SEMANTIC_MAP.json";
const moduleSynthesisPath = "docs/LOCAL_COURSE_5_MODULE_SYNTHESIS.json";
const zipSampleIndexPath = "docs/LOCAL_COURSE_5_ZIP_VISUAL_SAMPLE_INDEX.json";
const outputJson = "docs/LOCAL_COURSE_5_FOLLOWUP_WORK_PACKS.json";
const outputMd = "docs/LOCAL_COURSE_5_FOLLOWUP_WORK_PACKS.md";

const boundary = "Course 5 follow-up work packs are private reviewer-facing education operations only. They prepare OCR, visual review, and ZIP image-package review tasks for local supplemental sources. They do not perform OCR, fill reviewer conclusions, approve learner-facing release, copy private source wording into lessons, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

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

function priorityFor(row) {
  const modules = row.moduleTags || [];
  if (modules.includes("chart_pattern_encyclopedia")) return "P0_chart_encyclopedia_core";
  if (modules.includes("course_slides_alignment")) return "P0_course_slide_alignment";
  if (modules.includes("terminology_glossary")) return "P1_glossary_or_translation";
  if (modules.some((module) => ["reversals", "trends_and_channels", "trading_ranges"].includes(module))) {
    return "P1_price_action_structure";
  }
  return "P2_supplemental";
}

function nextActionFor(row) {
  if (row.extension === ".zip") {
    return "select_representative_images_extract_or_review_then_create_chart_semantic_notes";
  }
  if (row.extractionBucket === "large_file_deferred_for_dedicated_visual_or_ocr_pass") {
    return "sample_or_split_large_pdf_then_ocr_or_visual_review_selected_pages";
  }
  if (row.extractionBucket === "very_low_text_likely_scanned_or_visual") {
    return "ocr_or_manual_transcribe_visible_text_then_visual_semantic_review";
  }
  return "ocr_or_manual_visual_review_scanned_pages_then_distill_module_notes";
}

function batchIdFor(kind, index) {
  return `course5_${kind}_pack_${String(index).padStart(2, "0")}`;
}

function sourceKey(row) {
  return row.recordId || row.containerId || row.visualReviewId || row.relativePath;
}

const intake = readJson(intakePath);
const containerIndex = readJson(containerPath);
const visualQueue = readJson(visualQueuePath);
const visualMap = readJson(visualMapPath);
const moduleSynthesis = readJson(moduleSynthesisPath);
const zipSampleIndex = readJson(zipSampleIndexPath);
for (const [name, artifact] of Object.entries({ intake, containerIndex, visualQueue, visualMap, moduleSynthesis, zipSampleIndex })) {
  assertBoundary(name, artifact);
}

const visualByRecord = new Map((visualQueue.rows || []).map((row) => [row.recordId, row]));
const semanticByRecord = new Map((visualMap.rows || []).map((row) => [row.recordId, row]));
const containerByRecord = new Map((containerIndex.rows || []).map((row) => [row.recordId, row]));
const zipSamplesByRecord = new Map((zipSampleIndex.rows || []).map((row) => [row.recordId, row]));

const followupRows = (intake.rows || [])
  .filter((row) => !row.duplicateOf && row.absorptionStatus !== "absorbed_private_research_text")
  .map((row) => {
    const visual = visualByRecord.get(row.recordId);
    const semantic = semanticByRecord.get(row.recordId);
    const container = containerByRecord.get(row.recordId);
    const zipSamples = zipSamplesByRecord.get(row.recordId);
    const sampleImages = row.extension === ".zip"
      ? (zipSamples?.sampleRows || []).map((sample) => ({
          archiveImageIndex: sample.archiveImageIndex,
          archiveImageName: sample.archiveImageName,
          imagePath: sample.sampleImagePath,
        }))
      : (visual?.samples || []).map((sample) => ({
          pageNumber: sample.pageNumber,
          imagePath: sample.imagePath,
        }));
    return {
      workItemId: `course5_followup_${row.recordId}`,
      recordId: row.recordId,
      relativePath: row.relativePath,
      extension: row.extension,
      sourceLocalPath: row.sourceLocalPath,
      sizeMb: row.sizeMb,
      sha256: row.sha256,
      moduleTags: row.moduleTags || [],
      courseAlignment: row.courseAlignment || [],
      textExtraction: row.textExtraction,
      extractionBucket: row.extractionBucket,
      charCount: row.charCount || 0,
      pageCount: row.extractionDetail?.pageCount || visual?.pageCount || null,
      entryCount: container?.entryCount || 0,
      imageEntryCount: container?.imageEntryCount || 0,
      sampleImages,
      semanticTags: semantic?.semanticTags || [],
      visualSampleCount: row.extension === ".zip" ? (zipSamples?.sampleCount || 0) : (visual?.sampleCount || 0),
      ocrStatus: semantic?.ocrStatus || (row.extension === ".pdf" ? "ocr_engine_missing_not_text_complete" : "not_applicable_zip_package"),
      priority: priorityFor(row),
      nextAction: nextActionFor(row),
      reviewStatus: "needs_ocr_or_visual_reviewer_input",
      learnerFacingRelease: false,
      approvalStatus: "not_approved",
      productionReady: false,
      writeAllowedNow: false,
    };
  })
  .sort((left, right) =>
    left.priority.localeCompare(right.priority) ||
    right.sizeMb - left.sizeMb ||
    left.relativePath.localeCompare(right.relativePath, "zh-Hans-CN"));

const pdfRows = followupRows.filter((row) => row.extension === ".pdf");
const zipRows = followupRows.filter((row) => row.extension === ".zip");
const largePdfRows = pdfRows.filter((row) => row.extractionBucket === "large_file_deferred_for_dedicated_visual_or_ocr_pass");
const scannedPdfRows = pdfRows.filter((row) => row.extractionBucket !== "large_file_deferred_for_dedicated_visual_or_ocr_pass");

function makePack(kind, rows, packSize) {
  const packs = [];
  for (let index = 0; index < rows.length; index += packSize) {
    const packRows = rows.slice(index, index + packSize);
    const packNumber = packs.length + 1;
    packs.push({
      packId: batchIdFor(kind, packNumber),
      kind,
      priority: packRows[0]?.priority || "P2_supplemental",
      itemCount: packRows.length,
      sourceRecordIds: packRows.map((row) => row.recordId),
      totalPages: packRows.reduce((sum, row) => sum + (row.pageCount || 0), 0),
      totalImageEntries: packRows.reduce((sum, row) => sum + (row.imageEntryCount || 0), 0),
      sampleImageCount: packRows.reduce((sum, row) => sum + (row.sampleImages?.length || 0), 0),
      moduleTags: [...new Set(packRows.flatMap((row) => row.moduleTags || []))].sort(),
      courseAlignment: [...new Set(packRows.flatMap((row) => row.courseAlignment || []))].sort(),
      reviewInstructions: [
        "Do not copy private source wording into learner-facing lessons.",
        "Capture only reviewer notes, visible chart semantics, terminology, and module-placement hints.",
        "Convert any future teaching content into paraphrased education-only concepts with public-source grounding.",
        "Keep all trading examples bounded as training scenarios, not signals or recommendations.",
      ],
      rows: packRows,
      learnerFacingRelease: false,
      approvalStatus: "not_approved",
      productionReady: false,
      writeAllowedNow: false,
      completionGate: "all_rows_need_reviewer_notes_or_ocr_outputs_before_source_can_be_considered_deletable",
    });
  }
  return packs;
}

const packs = [
  ...makePack("large_pdf_split_or_ocr", largePdfRows, 3),
  ...makePack("scanned_pdf_ocr_or_visual_review", scannedPdfRows, 8),
  ...makePack("zip_image_package_visual_review", zipRows, 4),
];

const moduleRows = (moduleSynthesis.moduleRows || []).map((row) => ({
  moduleId: row.moduleId,
  moduleLabel: row.moduleLabel,
  followupRows: row.followupRows,
  visualSampleRows: row.visualSampleRows,
  imageEntries: row.imageEntries,
  relatedWorkItems: followupRows
    .filter((item) => (item.moduleTags || []).includes(row.moduleId))
    .map((item) => item.workItemId),
  nextGate: row.nextGate,
}));

const artifact = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  workPackStatus: "course_5_followup_work_packs_ready_release_blocked",
  sourceIntake: intakePath,
  sourceContainerIndex: containerPath,
  sourceVisualReviewQueue: visualQueuePath,
  sourceVisualSemanticMap: visualMapPath,
  sourceModuleSynthesis: moduleSynthesisPath,
  sourceZipVisualSampleIndex: zipSampleIndexPath,
  followupRows: followupRows.length,
  pdfFollowupRows: pdfRows.length,
  zipFollowupRows: zipRows.length,
  largePdfRows: largePdfRows.length,
  scannedPdfRows: scannedPdfRows.length,
  workPacks: packs.length,
  ocrEngineAvailable: visualMap.ocrEngineAvailable,
  totalFollowupPages: pdfRows.reduce((sum, row) => sum + (row.pageCount || 0), 0),
  totalZipImageEntries: zipRows.reduce((sum, row) => sum + (row.imageEntryCount || 0), 0),
  totalPdfSampleImages: pdfRows.reduce((sum, row) => sum + (row.sampleImages?.length || 0), 0),
  totalZipSampleImages: zipRows.reduce((sum, row) => sum + (row.sampleImages?.length || 0), 0),
  totalSampleImages: followupRows.reduce((sum, row) => sum + (row.sampleImages?.length || 0), 0),
  packs,
  workItems: followupRows,
  moduleRows,
  deletionReadiness: {
    course5SourceFolderMayBeDeleted: false,
    reason: "49 follow-up source rows still require OCR, visual semantic review, or ZIP image-package review before source files can be considered replaceable by knowledge artifacts.",
    blockingFollowupRows: followupRows.length,
    blockingWorkPacks: packs.length,
    ocrEngineAvailable: visualMap.ocrEngineAvailable,
    deleteExecutedNow: false,
    writeAllowedNow: false,
  },
  commands: [
    "npm.cmd run build:local-course-5-followup-work-packs",
    "npm.cmd run check:local-course-5-followup-work-packs",
    "npm.cmd run verify",
  ],
  completionRule: "Course 5 follow-up is operationally ready when every non-absorbed source row is assigned to an OCR, visual review, or ZIP image-package pack with sample evidence, module tags, next action, and deletion blocker status. The source folder is not deletable until these packs are resolved or explicitly accepted as future-loss limitations.",
  boundary,
};

fs.writeFileSync(outputJson, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Local Course 5 Follow-up Work Packs",
  "",
  `- Work pack status: ${artifact.workPackStatus}`,
  `- Follow-up rows: ${artifact.followupRows}`,
  `- PDF follow-up rows: ${artifact.pdfFollowupRows}`,
  `- ZIP follow-up rows: ${artifact.zipFollowupRows}`,
  `- Large PDF rows: ${artifact.largePdfRows}`,
  `- Scanned/low-text PDF rows: ${artifact.scannedPdfRows}`,
  `- Work packs: ${artifact.workPacks}`,
  `- Total follow-up PDF pages: ${artifact.totalFollowupPages}`,
  `- Total ZIP image entries: ${artifact.totalZipImageEntries}`,
  `- Total sample images: ${artifact.totalSampleImages}`,
  `- PDF sample images: ${artifact.totalPdfSampleImages}`,
  `- ZIP sample images: ${artifact.totalZipSampleImages}`,
  `- OCR engine available: ${artifact.ocrEngineAvailable}`,
  `- Course 5 source folder may be deleted: ${artifact.deletionReadiness.course5SourceFolderMayBeDeleted}`,
  `- Write allowed now: ${artifact.writeAllowedNow}`,
  "",
  "## Packs",
  "",
  "| Pack | Kind | Items | Pages | ZIP images | Sample images | Modules |",
  "|---|---|---:|---:|---:|---:|---|",
  ...packs.map((pack) => `| ${pack.packId} | ${pack.kind} | ${pack.itemCount} | ${pack.totalPages} | ${pack.totalImageEntries} | ${pack.sampleImageCount} | ${pack.moduleTags.join(", ")} |`),
  "",
  "## Deletion Readiness",
  "",
  artifact.deletionReadiness.reason,
  "",
  "## Boundary",
  "",
  boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: artifact.educationOnly,
  productionReady: artifact.productionReady,
  learnerFacingRelease: artifact.learnerFacingRelease,
  approvalStatus: artifact.approvalStatus,
  writeAllowedNow: artifact.writeAllowedNow,
  workPackStatus: artifact.workPackStatus,
  followupRows: artifact.followupRows,
  pdfFollowupRows: artifact.pdfFollowupRows,
  zipFollowupRows: artifact.zipFollowupRows,
  workPacks: artifact.workPacks,
  course5SourceFolderMayBeDeleted: artifact.deletionReadiness.course5SourceFolderMayBeDeleted,
}, null, 2));
