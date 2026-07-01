import fs from "node:fs";

const inventoryPath = "docs/LOCAL_COURSE_5_SOURCE_INVENTORY.json";
const intakePath = "docs/LOCAL_COURSE_5_DOCUMENT_INTAKE.json";
const containerPath = "docs/LOCAL_COURSE_5_CONTAINER_INDEX.json";
const zipSamplePath = "docs/LOCAL_COURSE_5_ZIP_VISUAL_SAMPLE_INDEX.json";
const visualQueuePath = "docs/LOCAL_COURSE_5_VISUAL_REVIEW_QUEUE.json";
const visualMapPath = "docs/LOCAL_COURSE_5_VISUAL_SEMANTIC_MAP.json";
const synthesisPath = "docs/LOCAL_COURSE_5_MODULE_SYNTHESIS.json";
const workPacksPath = "docs/LOCAL_COURSE_5_FOLLOWUP_WORK_PACKS.json";
const aiAbsorptionPath = "docs/LOCAL_COURSE_5_FOLLOWUP_AI_ABSORPTION_COVERAGE_AUDIT.json";
const outputJsonPath = "docs/LOCAL_COURSE_5_DELETION_READINESS.json";
const outputMdPath = "docs/LOCAL_COURSE_5_DELETION_READINESS.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function requireLockedArtifact(name, artifact) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${name} must keep approvalStatus:not_approved`);
  if ("writeAllowedNow" in artifact && artifact.writeAllowedNow !== false) {
    fail(`${name} must keep writeAllowedNow:false`);
  }
}

const inventory = readJson(inventoryPath);
const intake = readJson(intakePath);
const container = readJson(containerPath);
const zipSample = readJson(zipSamplePath);
const visualQueue = readJson(visualQueuePath);
const visualMap = readJson(visualMapPath);
const synthesis = readJson(synthesisPath);
const workPacks = readJson(workPacksPath);
const aiAbsorption = readJson(aiAbsorptionPath);

for (const [name, artifact] of [
  ["inventory", inventory],
  ["intake", intake],
  ["container", container],
  ["zipSample", zipSample],
  ["visualQueue", visualQueue],
  ["visualMap", visualMap],
  ["synthesis", synthesis],
  ["workPacks", workPacks],
  ["aiAbsorption", aiAbsorption],
]) {
  requireLockedArtifact(name, artifact);
}

if (inventory.totalFiles !== 134 || intake.totalFiles !== 134) fail("Course 5 total file count drift");
if (inventory.uniqueHashes !== 131 || intake.uniquePrimaryRows !== 131) fail("Course 5 unique source count drift");
if (intake.textAbsorbedRows !== 82) fail("Course 5 text absorbed count drift");
if (intake.followupRequiredRows !== 49 || synthesis.followupRequiredRows !== 49 || workPacks.followupRows !== 49) {
  fail("Course 5 follow-up blocker count drift");
}
if (workPacks.pdfFollowupRows !== 41 || workPacks.zipFollowupRows !== 8) fail("Course 5 PDF/ZIP blocker split drift");
if (workPacks.largePdfRows !== 3 || workPacks.scannedPdfRows !== 38) fail("Course 5 OCR blocker split drift");
if (workPacks.ocrEngineAvailable !== false || synthesis.ocrEngineAvailable !== false || visualMap.ocrEngineAvailable !== false) {
  fail("Course 5 OCR availability drift");
}
if (synthesis.learnerReadyModules !== 0) fail("Course 5 must not have learner-ready modules");
if (workPacks.deletionReadiness?.course5SourceFolderMayBeDeleted !== false) {
  fail("Course 5 work packs must block source folder deletion");
}
if (workPacks.deletionReadiness?.deleteExecutedNow !== false || workPacks.deletionReadiness?.writeAllowedNow !== false) {
  fail("Course 5 work packs must keep delete/write gates locked");
}

if (aiAbsorption.internalAiAbsorptionComplete !== true) fail("Course 5 AI absorption coverage must be complete");
if (aiAbsorption.aiAbsorbedRows !== 386 || aiAbsorption.totalFollowupReviewerCards !== 386) fail("Course 5 AI absorption coverage count drift");
if (aiAbsorption.sourceFolderMayBeDeleted !== false) fail("AI absorption audit must not open source folder deletion");

const sourceFolderStillPresentAtBuild = fs.existsSync(inventory.sourceRoot);
const blockingCategories = [
  {
    category: "large_pdf_split_or_ocr",
    blockingRows: workPacks.largePdfRows,
    reason: "Large chart encyclopedia PDFs were intentionally size-deferred and still need split/OCR or selected-page visual review before they can replace source files.",
  },
  {
    category: "scanned_pdf_ocr_or_visual_review",
    blockingRows: workPacks.scannedPdfRows,
    reason: "Scanned or very-low-text PDFs have representative visual samples, but no full OCR text layer is available yet.",
  },
  {
    category: "zip_image_package_visual_review",
    blockingRows: workPacks.zipFollowupRows,
    reason: "ZIP chart packages are inventoried and sampled, but their full image sets have not been semantically reviewed as teaching evidence.",
  },
];

const moduleBlockers = synthesis.moduleRows
  .filter((row) => row.followupRows > 0 || row.imageEntries > 0 || row.visualSampleRows > 0)
  .map((row) => ({
    moduleId: row.moduleId,
    moduleLabel: row.moduleLabel,
    followupRows: row.followupRows,
    visualSampleRows: row.visualSampleRows,
    imageEntries: row.imageEntries,
    nextGate: row.nextGate,
  }))
  .sort((a, b) => b.followupRows - a.followupRows || b.imageEntries - a.imageEntries);

const readiness = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  readinessStatus: "course_5_source_folder_not_deletable_internal_ai_absorption_complete_quality_gates_remaining",
  readinessMode: "dual_gate_internal_ai_absorption_complete_source_removal_blocked",
  sourceRoot: inventory.sourceRoot,
  sourceFolderStillPresentAtBuild,
  sourceFolderMayBeDeleted: false,
  deleteExecutedNow: false,
  deletionRequiresExplicitUserConfirmation: true,
  currentKnowledgeArtifactsCanReplaceSourceFolder: false,
  internalKnowledgeAbsorptionComplete: true,
  internalAiAbsorptionComplete: true,
  aiOnlyAbsorptionAcceptedForKnowledgeBase: true,
  aiAbsorptionEvidence: {
    sourceAudit: aiAbsorptionPath,
    aiAbsorbedRows: aiAbsorption.aiAbsorbedRows,
    totalFollowupReviewerCards: aiAbsorption.totalFollowupReviewerCards,
    p0Rows: aiAbsorption.p0Rows,
    nonP0Rows: aiAbsorption.nonP0Rows,
    rowsWithMachineDraftCoverage: aiAbsorption.rowsWithMachineDraftCoverage,
    rowsWithSampleImageEvidence: aiAbsorption.rowsWithSampleImageEvidence,
    moduleCounts: aiAbsorption.moduleCounts,
    sourceRetentionCounts: aiAbsorption.sourceRetentionCounts,
  },
  reason: "Course 5 is now fully sedimented into the internal AI knowledge-base absorption layer: all 386 follow-up visual reviewer cards have AI absorption notes, module routing, machine-draft coverage, and sample-image evidence. Source-folder removal remains blocked separately because OCR/public-grounding/learner-release quality gates are not the same as internal knowledge absorption.",
  sourceEvidence: {
    totalFiles: inventory.totalFiles,
    uniqueHashes: inventory.uniqueHashes,
    duplicateFiles: inventory.duplicateFiles,
    totalGb: inventory.totalGb,
    totalBytes: inventory.totalBytes,
    intakeRows: intake.intakeRows,
    uniquePrimaryRows: intake.uniquePrimaryRows,
    textAbsorbedRows: intake.textAbsorbedRows,
    followupRequiredRows: intake.followupRequiredRows,
    totalExtractedChars: intake.totalExtractedChars,
    knowledgeNodeCandidateRows: intake.knowledgeNodeCandidateRows,
  },
  visualEvidence: {
    containerRows: container.containerRows,
    zipRows: container.zipRows,
    epubRows: container.epubRows,
    totalContainerEntries: container.totalContainerEntries,
    totalZipImageEntries: workPacks.totalZipImageEntries,
    pdfVisualQueueRows: visualQueue.queueRows,
    pdfSampleImages: workPacks.totalPdfSampleImages,
    zipSampleImages: workPacks.totalZipSampleImages,
    totalSampleImages: workPacks.totalSampleImages,
    visualSemanticSourceRows: visualMap.sourceRows,
    visualSemanticSampleRows: visualMap.sampleRows,
    analyzedVisualSampleRows: visualMap.analyzedSampleRows,
    ocrEngineAvailable: workPacks.ocrEngineAvailable,
  },
  moduleEvidence: {
    modules: synthesis.modules,
    modulesWithText: synthesis.modulesWithText,
    modulesWithVisuals: synthesis.modulesWithVisuals,
    modulesWithFollowup: synthesis.modulesWithFollowup,
    learnerReadyModules: synthesis.learnerReadyModules,
    moduleBlockers,
  },
  blockerEvidence: {
    blockingFollowupRows: workPacks.followupRows,
    pdfFollowupRows: workPacks.pdfFollowupRows,
    zipFollowupRows: workPacks.zipFollowupRows,
    largePdfRows: workPacks.largePdfRows,
    scannedPdfRows: workPacks.scannedPdfRows,
    blockingWorkPacks: workPacks.workPacks,
    totalFollowupPages: workPacks.totalFollowupPages,
    blockingCategories,
  },
  completionGate: {
    requiredBeforeDeletion: [
      "Reduce blockingFollowupRows to 0, or explicitly accept documented future-loss limitations for every remaining blocker.",
      "Add a usable OCR or manual transcription output layer for scanned and very-low-text PDFs that matter to teaching modules.",
      "Convert ZIP chart packages from representative samples into reviewed chart-semantic notes or accepted nonessential references.",
      "Regenerate module synthesis so every intended teaching module has source evidence, reviewer notes, and public-grounding/originality gates.",
      "Keep learner-facing release locked until reviewer distillation, public grounding, originality checks, and explicit approval are complete.",
    ],
    currentBlockingReason: "Internal AI absorption is complete for 386/386 follow-up cards, but source removal stays blocked because OCR/public-grounding/learner-release quality gates are separate from knowledge-base sedimentation.",
  },
  commands: [
    "npm.cmd run build:local-course-5-deletion-readiness",
    "npm.cmd run check:local-course-5-deletion-readiness",
    "npm.cmd run verify",
  ],
  boundary: "This Course 5 deletion-readiness artifact is a private reviewer-facing education operation. It now distinguishes internal AI knowledge-base absorption from source-folder removal. It confirms Course 5 follow-up material is AI-absorbed internally while source-folder deletion remains blocked by OCR, public grounding, originality, learner-release, and explicit deletion gates. It does not delete files, approve learner-facing release, copy private source wording into lessons, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(readiness, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Course 5 Deletion Readiness",
  "",
  `- Readiness status: ${readiness.readinessStatus}`,
  `- Source root: ${readiness.sourceRoot}`,
  `- Source folder still present at build: ${readiness.sourceFolderStillPresentAtBuild}`,
  `- Source folder may be deleted: ${readiness.sourceFolderMayBeDeleted}`,
  `- Delete executed now: ${readiness.deleteExecutedNow}`,
  `- Current artifacts can replace source folder: ${readiness.currentKnowledgeArtifactsCanReplaceSourceFolder}`,
  `- Internal AI absorption complete: ${readiness.internalAiAbsorptionComplete}`,
  `- AI absorbed follow-up cards: ${readiness.aiAbsorptionEvidence.aiAbsorbedRows}/${readiness.aiAbsorptionEvidence.totalFollowupReviewerCards}`,
  `- Blocking follow-up rows: ${readiness.blockerEvidence.blockingFollowupRows}`,
  `- OCR engine available: ${readiness.visualEvidence.ocrEngineAvailable}`,
  `- Learner-ready modules: ${readiness.moduleEvidence.learnerReadyModules}`,
  "",
  "## Absorption Evidence",
  "",
  `- Files inventoried: ${readiness.sourceEvidence.totalFiles}`,
  `- Unique hashes: ${readiness.sourceEvidence.uniqueHashes}`,
  `- Text absorbed rows: ${readiness.sourceEvidence.textAbsorbedRows}`,
  `- Extracted characters: ${readiness.sourceEvidence.totalExtractedChars}`,
  `- Knowledge node candidates: ${readiness.sourceEvidence.knowledgeNodeCandidateRows}`,
  `- PDF sample images: ${readiness.visualEvidence.pdfSampleImages}`,
  `- ZIP sample images: ${readiness.visualEvidence.zipSampleImages}`,
  `- Total sample images: ${readiness.visualEvidence.totalSampleImages}`,
  "",
  "## Blockers",
  "",
  "| Category | Rows | Reason |",
  "| --- | ---: | --- |",
  ...readiness.blockerEvidence.blockingCategories.map((row) => `| ${row.category} | ${row.blockingRows} | ${row.reason} |`),
  "",
  "## Module Gates",
  "",
  "| Module | Follow-ups | Visual samples | Image entries | Next gate |",
  "| --- | ---: | ---: | ---: | --- |",
  ...readiness.moduleEvidence.moduleBlockers.map((row) => `| ${row.moduleId} | ${row.followupRows} | ${row.visualSampleRows} | ${row.imageEntries} | ${row.nextGate} |`),
  "",
  "## Completion Gate",
  "",
  ...readiness.completionGate.requiredBeforeDeletion.map((item) => `- ${item}`),
  "",
  "## Boundary",
  "",
  readiness.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  readinessStatus: readiness.readinessStatus,
  sourceFolderMayBeDeleted: readiness.sourceFolderMayBeDeleted,
  deleteExecutedNow: readiness.deleteExecutedNow,
  currentKnowledgeArtifactsCanReplaceSourceFolder: readiness.currentKnowledgeArtifactsCanReplaceSourceFolder,
  blockingFollowupRows: readiness.blockerEvidence.blockingFollowupRows,
  pdfFollowupRows: readiness.blockerEvidence.pdfFollowupRows,
  zipFollowupRows: readiness.blockerEvidence.zipFollowupRows,
  learnerReadyModules: readiness.moduleEvidence.learnerReadyModules,
}, null, 2));
