import fs from "node:fs";

const readinessPath = "docs/LOCAL_COURSE_5_DELETION_READINESS.json";
const readinessMdPath = "docs/LOCAL_COURSE_5_DELETION_READINESS.md";
const workPacksPath = "docs/LOCAL_COURSE_5_FOLLOWUP_WORK_PACKS.json";
const aiAbsorptionPath = "docs/LOCAL_COURSE_5_FOLLOWUP_AI_ABSORPTION_COVERAGE_AUDIT.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const readiness = readJson(readinessPath);
const workPacks = readJson(workPacksPath);
const aiAbsorption = readJson(aiAbsorptionPath);
if (!fs.existsSync(readinessMdPath)) fail(`missing ${readinessMdPath}`);

if (readiness.educationOnly !== true) fail("deletion readiness must keep educationOnly:true");
if (readiness.productionReady !== false) fail("deletion readiness must keep productionReady:false");
if (readiness.learnerFacingRelease !== false) fail("deletion readiness must keep learnerFacingRelease:false");
if (readiness.approvalStatus !== "not_approved") fail("deletion readiness must keep approvalStatus:not_approved");
if (readiness.writeAllowedNow !== false) fail("deletion readiness must keep writeAllowedNow:false");
if (readiness.readinessStatus !== "course_5_source_folder_not_deletable_internal_ai_absorption_complete_quality_gates_remaining") {
  fail(`unexpected readinessStatus: ${readiness.readinessStatus}`);
}
if (readiness.readinessMode !== "dual_gate_internal_ai_absorption_complete_source_removal_blocked") fail("unexpected readinessMode");
if (readiness.sourceFolderMayBeDeleted !== false) fail("Course 5 source folder must not be marked deletable");
if (readiness.deleteExecutedNow !== false) fail("Course 5 deletion must not be executed");
if (readiness.currentKnowledgeArtifactsCanReplaceSourceFolder !== false) {
  fail("Course 5 artifacts must not claim they can replace the source folder yet");
}
if (readiness.deletionRequiresExplicitUserConfirmation !== true) fail("explicit user confirmation gate missing");
if (readiness.internalKnowledgeAbsorptionComplete !== true) fail("internal knowledge absorption should be complete");
if (readiness.internalAiAbsorptionComplete !== true) fail("internal AI absorption should be complete");
if (readiness.aiOnlyAbsorptionAcceptedForKnowledgeBase !== true) fail("AI-only absorption should be accepted for knowledge base sedimentation");
if (aiAbsorption.internalAiAbsorptionComplete !== true) fail("AI absorption audit must be complete");
if (readiness.aiAbsorptionEvidence?.aiAbsorbedRows !== 386 || readiness.aiAbsorptionEvidence?.totalFollowupReviewerCards !== 386) fail("AI absorption evidence must cover 386/386");
if (readiness.aiAbsorptionEvidence?.rowsWithMachineDraftCoverage !== 386 || readiness.aiAbsorptionEvidence?.rowsWithSampleImageEvidence !== 386) fail("AI absorption evidence coverage drift");

const source = readiness.sourceEvidence || {};
if (source.totalFiles !== 134) fail("Course 5 total file count drift");
if (source.uniqueHashes !== 131) fail("Course 5 unique hash count drift");
if (source.intakeRows !== 134) fail("Course 5 intake row count drift");
if (source.uniquePrimaryRows !== 131) fail("Course 5 unique primary count drift");
if (source.textAbsorbedRows !== 82) fail("Course 5 text absorbed row count drift");
if (source.followupRequiredRows !== 49) fail("Course 5 follow-up count drift");
if (source.totalExtractedChars < 15000000) fail("Course 5 extracted text unexpectedly low");
if (source.knowledgeNodeCandidateRows !== 675) fail("Course 5 knowledge node candidate count drift");

const visual = readiness.visualEvidence || {};
if (visual.zipRows !== 8) fail("Course 5 ZIP row count drift");
if (visual.epubRows !== 2) fail("Course 5 EPUB row count drift");
if (visual.totalZipImageEntries !== 10569) fail("Course 5 ZIP image entry count drift");
if (visual.pdfVisualQueueRows !== 41) fail("Course 5 PDF visual queue count drift");
if (visual.pdfSampleImages !== 121) fail("Course 5 PDF sample count drift");
if (visual.zipSampleImages < 80) fail("Course 5 ZIP sample count unexpectedly low");
if (visual.totalSampleImages < 200) fail("Course 5 total sample count unexpectedly low");
if (visual.ocrEngineAvailable !== false) fail("OCR availability should remain false until an OCR layer is actually added");

const modules = readiness.moduleEvidence || {};
if (modules.modules !== 13) fail("Course 5 module count drift");
if (modules.modulesWithText !== 12) fail("Course 5 modules-with-text count drift");
if (modules.modulesWithVisuals !== 9) fail("Course 5 modules-with-visuals count drift");
if (modules.modulesWithFollowup !== 11) fail("Course 5 modules-with-followup count drift");
if (modules.learnerReadyModules !== 0) fail("Course 5 must not be learner-ready");
if (!Array.isArray(modules.moduleBlockers) || modules.moduleBlockers.length < 10) fail("module blocker rows missing");
if (!modules.moduleBlockers.some((row) => row.moduleId === "chart_pattern_encyclopedia" && row.followupRows === 25)) {
  fail("chart pattern encyclopedia blocker proof missing");
}

const blockers = readiness.blockerEvidence || {};
if (blockers.blockingFollowupRows !== 49) fail("blocking follow-up count drift");
if (readiness.internalAiAbsorptionComplete !== true && blockers.blockingFollowupRows > 0) fail("follow-up blockers must have AI absorption complete if still source-removal blocked");
if (blockers.pdfFollowupRows !== 41) fail("PDF follow-up count drift");
if (blockers.zipFollowupRows !== 8) fail("ZIP follow-up count drift");
if (blockers.largePdfRows !== 3) fail("large PDF blocker count drift");
if (blockers.scannedPdfRows !== 38) fail("scanned PDF blocker count drift");
if (blockers.blockingWorkPacks !== 8) fail("work pack count drift");
if (blockers.totalFollowupPages <= 40000) fail("follow-up page count unexpectedly low");
if (!Array.isArray(blockers.blockingCategories) || blockers.blockingCategories.length !== 3) {
  fail("blocking categories must capture large PDFs, scanned PDFs, and ZIP images");
}

if (workPacks.deletionReadiness?.course5SourceFolderMayBeDeleted !== readiness.sourceFolderMayBeDeleted) {
  fail("readiness disagrees with follow-up work-pack deletion gate");
}
if (workPacks.followupRows !== blockers.blockingFollowupRows) fail("readiness disagrees with work-pack follow-up count");

const gate = readiness.completionGate || {};
if (!Array.isArray(gate.requiredBeforeDeletion) || gate.requiredBeforeDeletion.length < 5) {
  fail("completion gate must list required deletion blockers");
}
const gateText = `${gate.requiredBeforeDeletion.join(" ")} ${gate.currentBlockingReason || ""}`.toLowerCase();
for (const phrase of ["internal ai absorption is complete", "ocr", "public-grounding", "learner-release", "knowledge-base sedimentation"]) {
  if (!gateText.includes(phrase)) fail(`completion gate missing phrase: ${phrase}`);
}

if (!Array.isArray(readiness.commands) || !readiness.commands.some((command) => /check:local-course-5-deletion-readiness/.test(command))) {
  fail("commands must include Course 5 deletion readiness check");
}

const boundaryText = `${readiness.boundary || ""} ${readiness.reason || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education",
  "internal ai knowledge-base absorption",
  "source-folder deletion remains blocked",
  "does not delete files",
  "approve learner-facing release",
  "copy private source wording",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
  "production readiness",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  readinessStatus: readiness.readinessStatus,
  sourceFolderMayBeDeleted: readiness.sourceFolderMayBeDeleted,
  deleteExecutedNow: readiness.deleteExecutedNow,
  currentKnowledgeArtifactsCanReplaceSourceFolder: readiness.currentKnowledgeArtifactsCanReplaceSourceFolder,
  blockingFollowupRows: blockers.blockingFollowupRows,
  pdfFollowupRows: blockers.pdfFollowupRows,
  zipFollowupRows: blockers.zipFollowupRows,
  learnerReadyModules: modules.learnerReadyModules,
}, null, 2));
