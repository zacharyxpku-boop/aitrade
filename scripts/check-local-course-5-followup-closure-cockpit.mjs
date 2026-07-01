import fs from "node:fs";

const cockpitPath = "docs/LOCAL_COURSE_5_FOLLOWUP_CLOSURE_COCKPIT.json";
const cockpitMdPath = "docs/LOCAL_COURSE_5_FOLLOWUP_CLOSURE_COCKPIT.md";
const cockpitHtmlPath = "docs/local-course-5-followup-closure-cockpit.html";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const cockpit = readJson(cockpitPath);
if (!fs.existsSync(cockpitMdPath)) fail(`missing ${cockpitMdPath}`);
if (!fs.existsSync(cockpitHtmlPath)) fail(`missing ${cockpitHtmlPath}`);
const html = fs.readFileSync(cockpitHtmlPath, "utf8");

if (cockpit.educationOnly !== true) fail("cockpit must keep educationOnly:true");
if (cockpit.productionReady !== false) fail("cockpit must keep productionReady:false");
if (cockpit.learnerFacingRelease !== false) fail("cockpit must keep learnerFacingRelease:false");
if (cockpit.approvalStatus !== "not_approved") fail("cockpit must keep approvalStatus:not_approved");
if (cockpit.writeAllowedNow !== false) fail("cockpit must keep writeAllowedNow:false");
if (cockpit.cockpitStatus !== "course_5_followup_closure_cockpit_ready_folder_deletion_blocked") fail(`unexpected cockpitStatus: ${cockpit.cockpitStatus}`);

if (cockpit.totalFiles !== 134 || cockpit.uniquePrimaryRows !== 131) fail("Course 5 source counts drift");
if (cockpit.textAbsorbedRows !== 82 || cockpit.totalExtractedChars !== 15315443) fail("absorbed text counts drift");
if (cockpit.followupRequiredRows !== 49 || cockpit.unresolvedSourceRows !== 49) fail("follow-up unresolved counts drift");
if (cockpit.pdfFollowupRows !== 41 || cockpit.zipFollowupRows !== 8) fail("PDF/ZIP follow-up split drift");
if (cockpit.fullTextOcrRequiredRows !== 41 || cockpit.ocrUnavailableBlockingRows !== 41) fail("OCR blocker counts drift");
if (cockpit.canAdvanceWithVisualReviewNowRows !== 49 || cockpit.canFullyResolveWithLocalToolsNowRows !== 8) fail("execution routing counts drift");

if (cockpit.teachingModules !== 13 || cockpit.lessonSeeds !== 52 || cockpit.evidenceAnchors !== 96) fail("teaching module distillation counts drift");
if (cockpit.modulesBlockedByVisualOrOcr !== 11) fail("module visual/OCR blocker count drift");
if (cockpit.learnerReadyModules !== 0) fail("no Course 5 modules may be learner-ready");

if (cockpit.pdfPages !== 44398 || cockpit.zipImageEntries !== 10569) fail("PDF page or ZIP image inventory drift");
if (cockpit.sampleRows !== 206) fail("expected 206 PDF/ZIP follow-up sample rows");
if (cockpit.machineDraftRows !== 206) fail("expected 206 machine orientation draft rows");
if (cockpit.validationInputRows !== 206) fail("expected 206 reviewer input rows");
if (cockpit.readyInputRows !== 0) fail("blank reviewer inputs must not be ready");
if (cockpit.blockedInputRows !== 206 || cockpit.missingFieldRows !== 206) fail("all reviewer inputs should remain blocked with missing fields");
if (cockpit.acceptedForModuleDistillationRows !== 0 || cockpit.acceptedForDeletionReadinessRows !== 0) fail("no rows may be accepted without real reviewer/OCR input");
if (cockpit.sourceFolderMayBeDeleted !== false || cockpit.currentKnowledgeArtifactsCanReplaceSourceFolder !== false) fail("source deletion boundary drift");

if (!cockpit.deletionGate || cockpit.deletionGate.readinessStatus !== "course_5_source_folder_not_deletable_absorption_incomplete") fail("deletion gate status drift");
if (cockpit.deletionGate.sourceFolderStillPresentAtBuild !== true) fail("source folder should still be present at build");
if (cockpit.deletionGate.deleteExecutedNow !== false) fail("check must not execute deletion");
if (cockpit.deletionGate.deletionRequiresExplicitUserConfirmation !== true) fail("deletion must require explicit user confirmation");

if (!Array.isArray(cockpit.workstreams) || cockpit.workstreams.length !== 2) fail("expected two closure workstreams");
const byName = new Map(cockpit.workstreams.map((row) => [row.workstream, row]));
const pdf = byName.get("pdf_ocr_visual_review");
const zip = byName.get("zip_image_package_review");
if (!pdf || !zip) fail("missing PDF or ZIP workstream");

if (pdf.sourceRows !== 41 || pdf.sampleRows !== 121 || pdf.machineDraftRows !== 121 || pdf.inputRows !== 121) fail("PDF workstream count drift");
if (pdf.readyRows !== 0 || pdf.blockedRows !== 121 || pdf.missingFieldRows !== 121) fail("PDF workstream should remain fully blocked");
if (pdf.localOcrAvailable !== false || pdf.canFullyResolveWithLocalToolsNowRows !== 0) fail("PDF local OCR capability drift");
if (zip.sourceRows !== 8 || zip.sampleRows !== 85 || zip.machineDraftRows !== 85 || zip.inputRows !== 85) fail("ZIP workstream count drift");
if (zip.readyRows !== 0 || zip.blockedRows !== 85 || zip.missingFieldRows !== 85) fail("ZIP workstream should remain fully blocked");
if (zip.canFullyResolveWithLocalToolsNowRows !== 8) fail("ZIP local visual-review routing count drift");

for (const row of cockpit.workstreams) {
  for (const key of ["executionPack", "machineDrafts", "validation"]) {
    if (!fs.existsSync(row[key])) fail(`missing workstream artifact: ${row[key]}`);
  }
}

if (!Array.isArray(cockpit.closureBlockers) || cockpit.closureBlockers.length < 4) fail("closure blockers missing");
for (const blocker of cockpit.closureBlockers) {
  if (!blocker.blocker || typeof blocker.count !== "number" || !fs.existsSync(blocker.evidence)) fail(`invalid closure blocker: ${JSON.stringify(blocker)}`);
}

for (const needle of [
  "PDF sample rows",
  "ZIP sample rows",
  "Machine draft rows",
  "Ready reviewer input rows",
  "Blocked reviewer input rows",
  "Source folder may be deleted",
  "LOCAL_COURSE_5_PDF_OCR_VISUAL_EXECUTION_PACK.json",
  "LOCAL_COURSE_5_ZIP_IMAGE_PACKAGE_EXECUTION_PACK.json",
]) {
  if (!html.includes(needle)) fail(`HTML cockpit missing: ${needle}`);
}

const boundaryText = `${cockpit.boundary || ""} ${cockpit.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education operations",
  "source-retention",
  "ocr/visual routing",
  "pdf and zip execution packs",
  "machine semantic drafts",
  "reviewer-input validations",
  "deletion-readiness",
  "does not perform ocr",
  "generate reviewer conclusions",
  "accept machine drafts as human review",
  "delete files",
  "source-folder deletion",
  "learner-facing release",
  "copy private source wording",
  "stock recommendations",
  "live signals",
  "return promises",
  "real-money guidance",
  "production readiness",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary/completion missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  cockpitStatus: cockpit.cockpitStatus,
  followupRequiredRows: cockpit.followupRequiredRows,
  sampleRows: cockpit.sampleRows,
  machineDraftRows: cockpit.machineDraftRows,
  readyInputRows: cockpit.readyInputRows,
  blockedInputRows: cockpit.blockedInputRows,
  sourceFolderMayBeDeleted: cockpit.sourceFolderMayBeDeleted,
}, null, 2));
