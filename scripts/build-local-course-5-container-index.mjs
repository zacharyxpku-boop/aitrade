import fs from "node:fs";

const intakePath = "docs/LOCAL_COURSE_5_DOCUMENT_INTAKE.json";
const outputJson = "docs/LOCAL_COURSE_5_CONTAINER_INDEX.json";
const outputMd = "docs/LOCAL_COURSE_5_CONTAINER_INDEX.md";

const boundary = "Course 5 container index is private reviewer-facing education research only. It inventories EPUB and ZIP source containers for module distillation. It is not learner-facing, not publication-cleared, and does not provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const intake = readJson(intakePath);
if (intake.educationOnly !== true) fail("intake must keep educationOnly:true");
if (intake.productionReady !== false) fail("intake must keep productionReady:false");

const rows = intake.rows
  .filter((row) => [".zip", ".epub"].includes(row.extension) && !row.duplicateOf)
  .map((row) => {
    const detail = row.extractionDetail || {};
    const entryKindCounts = detail.entryKindCounts || {};
    const imageSamples = detail.sampleImageDimensions || [];
    const isEpub = row.extension === ".epub";
    const indexedStatus = isEpub
      ? (row.textExtraction === "epub_text_extracted"
        ? "epub_body_text_absorbed_private_research"
        : "epub_container_indexed_text_attention_required")
      : "zip_container_deep_indexed_images_not_ocr_complete";
    return {
      containerId: `course5_container_${row.recordId}`,
      recordId: row.recordId,
      relativePath: row.relativePath,
      extension: row.extension,
      sizeMb: row.sizeMb,
      sha256: row.sha256,
      moduleTags: row.moduleTags || [],
      courseAlignment: row.courseAlignment || [],
      textExtraction: row.textExtraction,
      charCount: row.charCount || 0,
      entryCount: detail.entryCount || 0,
      entryKindCounts,
      imageEntryCount: entryKindCounts.image || 0,
      pdfEntryCount: entryKindCounts.pdf || 0,
      markupFilesRead: detail.markupFilesRead || 0,
      sampleImageDimensions: imageSamples.slice(0, 30),
      indexedStatus,
      nextGate: isEpub
        ? "reviewer_distillation_and_public_grounding_before_teaching_use"
        : "select_representative_images_for_visual_semantic_review_or_ocr_then_distill",
      learnerFacingRelease: false,
      approvalStatus: "not_approved",
      productionReady: false,
      writeAllowedNow: false,
    };
  })
  .sort((left, right) => right.sizeMb - left.sizeMb || left.relativePath.localeCompare(right.relativePath, "zh-Hans-CN"));

const zipRows = rows.filter((row) => row.extension === ".zip");
const epubRows = rows.filter((row) => row.extension === ".epub");
const imagePackageRows = zipRows.filter((row) => row.imageEntryCount > 0);
const totalImageEntries = rows.reduce((sum, row) => sum + row.imageEntryCount, 0);
const totalEntries = rows.reduce((sum, row) => sum + row.entryCount, 0);
const epubTextRows = epubRows.filter((row) => row.indexedStatus === "epub_body_text_absorbed_private_research");

const artifact = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  sourceIntake: intakePath,
  indexStatus: rows.length > 0 && epubTextRows.length === epubRows.length
    ? "course_5_containers_indexed_epub_text_absorbed_zip_images_pending_visual_semantics_release_blocked"
    : "course_5_container_index_attention_required",
  containerRows: rows.length,
  zipRows: zipRows.length,
  epubRows: epubRows.length,
  epubTextRows: epubTextRows.length,
  imagePackageRows: imagePackageRows.length,
  totalContainerEntries: totalEntries,
  totalImageEntries,
  totalContainerExtractedChars: rows.reduce((sum, row) => sum + row.charCount, 0),
  rows,
  commands: [
    "npm.cmd run build:local-course-5-container-index",
    "npm.cmd run check:local-course-5-container-index",
    "npm.cmd run verify",
  ],
  completionRule: "EPUB containers count as private research text absorbed only when body text is extracted. ZIP containers count as source-managed only when entry counts, image/package type counts, and representative image dimensions are indexed; they still require visual semantic review or OCR before learner-facing module use.",
  boundary,
};

fs.writeFileSync(outputJson, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Local Course 5 Container Index",
  "",
  `- Index status: ${artifact.indexStatus}`,
  `- Container rows: ${artifact.containerRows}`,
  `- ZIP rows: ${artifact.zipRows}`,
  `- EPUB rows: ${artifact.epubRows}`,
  `- EPUB text rows: ${artifact.epubTextRows}`,
  `- Image package rows: ${artifact.imagePackageRows}`,
  `- Total container entries: ${artifact.totalContainerEntries}`,
  `- Total image entries: ${artifact.totalImageEntries}`,
  `- Write allowed now: ${artifact.writeAllowedNow}`,
  "",
  "## Containers",
  "",
  "| Path | Type | Entries | Images | Chars | Status |",
  "|---|---:|---:|---:|---:|---|",
  ...rows.map((row) => `| ${row.relativePath} | ${row.extension} | ${row.entryCount} | ${row.imageEntryCount} | ${row.charCount} | ${row.indexedStatus} |`),
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
  indexStatus: artifact.indexStatus,
  containerRows: artifact.containerRows,
  zipRows: artifact.zipRows,
  epubRows: artifact.epubRows,
  epubTextRows: artifact.epubTextRows,
  totalContainerEntries: artifact.totalContainerEntries,
  totalImageEntries: artifact.totalImageEntries,
}, null, 2));
