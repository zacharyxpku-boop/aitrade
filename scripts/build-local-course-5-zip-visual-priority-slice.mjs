import fs from "node:fs";
import path from "node:path";

const zipExecutionPath = "docs/LOCAL_COURSE_5_ZIP_IMAGE_PACKAGE_EXECUTION_PACK.json";
const zipDraftsPath = "docs/LOCAL_COURSE_5_ZIP_MACHINE_VISUAL_SEMANTIC_DRAFTS.json";
const zipValidationPath = "docs/LOCAL_COURSE_5_ZIP_IMAGE_PACKAGE_REVIEW_INPUT_VALIDATION.json";
const closurePath = "docs/LOCAL_COURSE_5_FOLLOWUP_CLOSURE_COCKPIT.json";

const outputJson = "docs/LOCAL_COURSE_5_ZIP_VISUAL_PRIORITY_SLICE.json";
const outputMd = "docs/LOCAL_COURSE_5_ZIP_VISUAL_PRIORITY_SLICE.md";
const outputHtml = "docs/local-course-5-zip-visual-priority-slice.html";
const inputJson = "docs/reviewer-inputs/LOCAL_COURSE_5_ZIP_VISUAL_PRIORITY_SLICE_INPUT_TEMPLATE.json";
const inputMd = "docs/reviewer-inputs/LOCAL_COURSE_5_ZIP_VISUAL_PRIORITY_SLICE_INPUT_TEMPLATE.md";

const boundary = "Course 5 ZIP visual priority slice is private reviewer-facing education operations material. It selects all locally resolvable ZIP image packages, links representative image samples to machine orientation drafts, and defines reviewer-owned visual input fields and acceptance gates. It does not perform OCR, generate reviewer conclusions, accept machine drafts as human review, merge content into learner-facing modules, delete files, approve source-folder deletion, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.";

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

function priorityRank(row) {
  if (row.priorityBand === "P0_space_and_curriculum_blocker") return 0;
  if (row.priorityBand === "P1_high_value_blocker") return 1;
  return 2;
}

function htmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const zipExecution = readJson(zipExecutionPath);
const zipDrafts = readJson(zipDraftsPath);
const zipValidation = readJson(zipValidationPath);
const closure = readJson(closurePath);

for (const [name, artifact] of Object.entries({ zipExecution, zipDrafts, zipValidation, closure })) {
  assertBoundary(name, artifact);
}

const draftByReviewId = new Map(zipDrafts.draftRows.map((row) => [row.reviewRowId, row]));
const selectedSources = [...zipExecution.sourceRows].sort(
  (a, b) => priorityRank(a) - priorityRank(b) || b.imageEntryCount - a.imageEntryCount || b.sizeMb - a.sizeMb,
);
const selectedRecordIds = new Set(selectedSources.map((row) => row.recordId));
const selectedSamples = zipExecution.sampleRows.filter((row) => selectedRecordIds.has(row.recordId));

const sourceRows = selectedSources.map((source, index) => ({
  sliceSourceNo: index + 1,
  recordId: source.recordId,
  relativePath: source.relativePath,
  sourceLocalPath: source.sourceLocalPath,
  sizeMb: source.sizeMb,
  entryCount: source.entryCount,
  imageEntryCount: source.imageEntryCount,
  sampleCount: source.sampleCount,
  priorityBand: source.priorityBand,
  moduleTags: source.moduleTags,
  courseAlignment: source.courseAlignment,
  canFullyResolveWithLocalToolsNow: source.canFullyResolveWithLocalToolsNow,
  immediateVisualAction: source.immediateVisualAction,
  finalResolutionGate: source.finalResolutionGate,
  sourceFolderMayBeDeleted: false,
}));

const sampleRows = selectedSamples.map((sample, index) => {
  const draft = draftByReviewId.get(sample.reviewRowId);
  return {
    sliceRowNo: index + 1,
    reviewRowId: sample.reviewRowId,
    zipSampleId: sample.zipSampleId,
    recordId: sample.recordId,
    relativePath: sample.relativePath,
    archiveImageIndex: sample.archiveImageIndex,
    archiveImageName: sample.archiveImageName,
    sampleImagePath: sample.sampleImagePath,
    sampleImageHref: sample.sampleImageHref,
    sampleImageExists: fs.existsSync(sample.sampleImagePath),
    priorityBand: sample.priorityBand,
    densityBand: sample.densityBand,
    moduleTags: sample.moduleTags,
    courseAlignment: sample.courseAlignment,
    visualMetrics: {
      width: sample.width,
      height: sample.height,
      edgeDensity: sample.edgeDensity,
      darkPixelRatio: sample.darkPixelRatio,
      visualDensity: sample.visualDensity,
    },
    candidateConcepts: draft?.candidateConcepts || [],
    reviewerQuestions: draft?.reviewerQuestions || [],
    riskFlags: draft?.riskFlags || [],
    acceptanceRequiredBeforeUse: draft?.acceptanceRequiredBeforeUse || [],
    reviewStatus: "blocked_missing_real_visual_reviewer_input",
    acceptedForZipSemanticReview: false,
    acceptedForModuleDistillation: false,
    acceptedForDeletionReadiness: false,
    educationOnly: true,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    productionReady: false,
    writeAllowedNow: false,
  };
});

const inputRows = sampleRows.map((sample) => ({
  reviewRowId: sample.reviewRowId,
  zipSampleId: sample.zipSampleId,
  recordId: sample.recordId,
  relativePath: sample.relativePath,
  archiveImageIndex: sample.archiveImageIndex,
  archiveImageName: sample.archiveImageName,
  sampleImagePath: sample.sampleImagePath,
  reviewerOwnedVisualObservation: "",
  reviewerVisibleTextOrLabelCheck: "",
  paraphrasedTeachingConcept: "",
  modulePlacement: "",
  representativenessNote: "",
  evidenceLimitations: "",
  publicGroundingNeeded: true,
  acceptedForZipSemanticReview: false,
  acceptedForModuleDistillation: false,
  acceptedForDeletionReadiness: false,
  reviewerNameOrInitials: "",
  reviewedAt: "",
  reviewStatus: "blocked_missing_real_visual_reviewer_input",
  educationOnly: true,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  productionReady: false,
  writeAllowedNow: false,
}));

const slice = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  sliceStatus: "course_5_zip_visual_priority_slice_ready_blocked_on_real_visual_reviewer_input",
  sliceMode: "all_locally_resolvable_zip_image_packages",
  sourceRoot: closure.sourceRoot,
  sourceFolderMayBeDeleted: false,
  currentKnowledgeArtifactsCanReplaceSourceFolder: false,
  sourceExecutionPack: zipExecutionPath,
  sourceMachineDrafts: zipDraftsPath,
  sourceValidation: zipValidationPath,
  sourceClosureCockpit: closurePath,
  totalZipFollowupRows: zipExecution.zipRows,
  totalZipImageEntries: zipExecution.totalImageEntries,
  totalZipSampleRows: zipExecution.sampleRowCount,
  selectedSourceRows: sourceRows.length,
  selectedSampleRows: sampleRows.length,
  selectedInputRows: inputRows.length,
  selectedP0SourceRows: sourceRows.filter((row) => row.priorityBand === "P0_space_and_curriculum_blocker").length,
  selectedP1SourceRows: sourceRows.filter((row) => row.priorityBand === "P1_high_value_blocker").length,
  selectedP2SourceRows: sourceRows.filter((row) => row.priorityBand === "P2_followup_blocker").length,
  selectedImageEntries: sourceRows.reduce((sum, row) => sum + row.imageEntryCount, 0),
  selectedSizeMb: Number(sourceRows.reduce((sum, row) => sum + row.sizeMb, 0).toFixed(3)),
  canFullyResolveWithLocalToolsNowRows: sourceRows.filter((row) => row.canFullyResolveWithLocalToolsNow === true).length,
  readyInputRows: 0,
  blockedInputRows: inputRows.length,
  acceptedForModuleDistillationRows: 0,
  acceptedForDeletionReadinessRows: 0,
  learnerReadyModules: 0,
  sourceRows,
  sampleRows,
  inputTemplate: {
    json: inputJson,
    markdown: inputMd,
    rowCount: inputRows.length,
    requiredReviewerOwnedFields: [
      "reviewerOwnedVisualObservation",
      "reviewerVisibleTextOrLabelCheck",
      "paraphrasedTeachingConcept",
      "modulePlacement",
      "representativenessNote",
      "evidenceLimitations",
      "reviewerNameOrInitials",
      "reviewedAt",
    ],
  },
  nextGate: "fill_real_zip_visual_reviewer_fields_then_validate_priority_slice_input",
  completionRule: "This ZIP visual priority slice is complete when all 8 locally resolvable ZIP source rows and all 85 representative image samples are linked to machine orientation drafts and blank reviewer-owned visual input rows, while all module/deletion gates remain blocked until real reviewer input is validated.",
  boundary,
};

fs.mkdirSync(path.dirname(inputJson), { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(slice, null, 2)}\n`, "utf8");
fs.writeFileSync(inputJson, `${JSON.stringify({
  generatedAt: slice.generatedAt,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  inputTemplateStatus: "course_5_zip_visual_priority_slice_input_template_ready_blocked_missing_input",
  sourceSlice: outputJson,
  inputRows: inputRows.length,
  readyRows: 0,
  blockedRows: inputRows.length,
  rows: inputRows,
  boundary,
}, null, 2)}\n`, "utf8");

fs.writeFileSync(outputMd, [
  "# Course 5 ZIP Visual Priority Slice",
  "",
  `- Slice status: ${slice.sliceStatus}`,
  `- Selected source rows: ${slice.selectedSourceRows}/${slice.totalZipFollowupRows}`,
  `- Selected sample rows: ${slice.selectedSampleRows}/${slice.totalZipSampleRows}`,
  `- Selected P0/P1/P2 sources: ${slice.selectedP0SourceRows}/${slice.selectedP1SourceRows}/${slice.selectedP2SourceRows}`,
  `- Selected image entries: ${slice.selectedImageEntries}`,
  `- Selected size MB: ${slice.selectedSizeMb}`,
  `- Can fully resolve with local tools now rows: ${slice.canFullyResolveWithLocalToolsNowRows}`,
  `- Ready input rows: ${slice.readyInputRows}`,
  `- Blocked input rows: ${slice.blockedInputRows}`,
  `- Source folder may be deleted: ${slice.sourceFolderMayBeDeleted}`,
  "",
  "## Source Rows",
  "",
  "| # | Priority | Images | MB | Samples | Source |",
  "|---:|---|---:|---:|---:|---|",
  ...sourceRows.map((row) => `| ${row.sliceSourceNo} | ${row.priorityBand} | ${row.imageEntryCount} | ${row.sizeMb} | ${row.sampleCount} | ${row.relativePath} |`),
  "",
  "## Boundary",
  "",
  boundary,
  "",
].join("\n"), "utf8");

fs.writeFileSync(inputMd, [
  "# Course 5 ZIP Visual Priority Slice Input Template",
  "",
  `- Source slice: ${outputJson}`,
  `- Input rows: ${inputRows.length}`,
  `- Ready rows: 0`,
  `- Blocked rows: ${inputRows.length}`,
  "",
  "Fill only reviewer-owned visual observations and visible label checks. Do not copy source prose into learner-facing content.",
  "",
  "## Rows",
  "",
  "| Review row | Archive image | Source |",
  "|---|---|---|",
  ...inputRows.map((row) => `| ${row.reviewRowId} | ${row.archiveImageName} | ${row.relativePath} |`),
  "",
  "## Boundary",
  "",
  boundary,
  "",
].join("\n"), "utf8");

const sourceHtml = sourceRows.map((row) => `
        <tr><td>${row.sliceSourceNo}</td><td>${htmlEscape(row.priorityBand)}</td><td>${row.imageEntryCount}</td><td>${row.sizeMb}</td><td>${row.sampleCount}</td><td>${htmlEscape(row.relativePath)}</td></tr>`).join("");
const sampleHtml = sampleRows.slice(0, 85).map((row) => `
        <tr><td>${htmlEscape(row.reviewRowId)}</td><td>${htmlEscape(row.archiveImageName)}</td><td><a href="${htmlEscape(row.sampleImageHref)}">sample</a></td><td>${htmlEscape(row.candidateConcepts.join(", "))}</td></tr>`).join("");

fs.writeFileSync(outputHtml, `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Course 5 ZIP Visual Priority Slice</title>
  <style>
    :root { font-family: Arial, Helvetica, sans-serif; background: #f7f7f3; color: #20211f; }
    body { margin: 0; }
    header { background: #fff; border-bottom: 1px solid #d9d9d2; padding: 18px 24px; }
    h1 { margin: 0 0 8px; font-size: 24px; letter-spacing: 0; }
    .status { color: #5c625b; font-size: 13px; }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; padding: 18px 24px; }
    .metric { background: #fff; border: 1px solid #d5d8d0; border-radius: 8px; padding: 12px; }
    .metric b { display: block; font-size: 22px; margin-bottom: 5px; }
    .metric span { color: #5c625b; font-size: 12px; }
    main { padding: 0 24px 24px; display: grid; gap: 18px; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #d5d8d0; border-radius: 8px; overflow: hidden; }
    th, td { border-bottom: 1px solid #e3e5df; padding: 8px 10px; text-align: left; font-size: 13px; vertical-align: top; }
    th { background: #eef0eb; }
    a { color: #285f7a; }
    footer { padding: 18px 24px 30px; color: #55584f; font-size: 12px; line-height: 1.5; }
  </style>
</head>
<body>
  <header>
    <h1>Course 5 ZIP Visual Priority Slice</h1>
    <div class="status">${htmlEscape(slice.sliceStatus)}</div>
  </header>
  <section class="metrics">
    <div class="metric"><b>${slice.selectedSourceRows}</b><span>selected source rows</span></div>
    <div class="metric"><b>${slice.selectedSampleRows}</b><span>selected sample rows</span></div>
    <div class="metric"><b>${slice.selectedP0SourceRows}/${slice.selectedP1SourceRows}/${slice.selectedP2SourceRows}</b><span>P0/P1/P2 sources</span></div>
    <div class="metric"><b>${slice.selectedImageEntries}</b><span>selected image entries</span></div>
    <div class="metric"><b>${slice.blockedInputRows}</b><span>blocked input rows</span></div>
    <div class="metric"><b>${slice.sourceFolderMayBeDeleted}</b><span>source folder may be deleted</span></div>
  </section>
  <main>
    <table><thead><tr><th>#</th><th>Priority</th><th>Images</th><th>MB</th><th>Samples</th><th>Source</th></tr></thead><tbody>${sourceHtml}</tbody></table>
    <table><thead><tr><th>Review Row</th><th>Archive Image</th><th>Image</th><th>Candidate Concepts</th></tr></thead><tbody>${sampleHtml}</tbody></table>
  </main>
  <footer>${htmlEscape(boundary)}</footer>
</body>
</html>
`, "utf8");

console.log(JSON.stringify({
  ok: true,
  sliceStatus: slice.sliceStatus,
  selectedSourceRows: slice.selectedSourceRows,
  selectedSampleRows: slice.selectedSampleRows,
  selectedP0SourceRows: slice.selectedP0SourceRows,
  selectedP1SourceRows: slice.selectedP1SourceRows,
  selectedP2SourceRows: slice.selectedP2SourceRows,
  canFullyResolveWithLocalToolsNowRows: slice.canFullyResolveWithLocalToolsNowRows,
  blockedInputRows: slice.blockedInputRows,
  sourceFolderMayBeDeleted: slice.sourceFolderMayBeDeleted,
}, null, 2));
