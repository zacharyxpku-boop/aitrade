import fs from "node:fs";

const cockpitPath = "docs/LOCAL_COURSE_5_ABSORPTION_COCKPIT.json";
const cockpitMdPath = "docs/LOCAL_COURSE_5_ABSORPTION_COCKPIT.md";
const cockpitHtmlPath = "docs/local-course-5-absorption-cockpit.html";

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
if (cockpit.cockpitStatus !== "course_5_absorption_cockpit_ready_release_and_deletion_blocked") fail(`unexpected cockpitStatus: ${cockpit.cockpitStatus}`);
if (cockpit.totalFiles !== 134 || cockpit.uniquePrimaryRows !== 131) fail("source file counts drift");
if (cockpit.textAbsorbedRows !== 82 || cockpit.followupRequiredRows !== 49) fail("text/followup counts drift");
if (cockpit.teachingModules !== 13 || cockpit.totalLessonSeeds !== 52 || cockpit.totalEvidenceAnchors < 90) fail("teaching distillation coverage drift");
if (cockpit.visualOcrReviewerCards !== 386 || cockpit.visualOcrCardsBatched !== 386 || cockpit.visualOcrCardsUnbatched !== 0) fail("visual/OCR batch coverage drift");
if (cockpit.visualOcrBatches !== 10) fail("expected 10 visual/OCR batches");
if (cockpit.visualOcrMissingImages !== 0) fail("missing visual/OCR images");
if (cockpit.visualOcrReadyRows !== 0 || cockpit.visualOcrBlockedRows !== 386) fail("reviewer input gate should remain fully blocked");
if (cockpit.readyReviewerNotes !== 0 || cockpit.acceptedForModuleDistillationRows !== 0 || cockpit.acceptedForDeletionReadinessRows !== 0) fail("real reviewer/acceptance counts must remain zero");
if (cockpit.sourceFolderMayBeDeleted !== false || cockpit.currentKnowledgeArtifactsCanReplaceSourceFolder !== false) fail("source deletion boundary drift");
if (cockpit.learnerReadyModules !== 0) fail("no Course 5 module may be learner-ready");
if (!Array.isArray(cockpit.batchRows) || cockpit.batchRows.length !== 10) fail("batch rows missing");

for (const row of cockpit.batchRows) {
  if (!fs.existsSync(row.workbenchHtml)) fail(`missing workbench: ${row.workbenchHtml}`);
  if (!fs.existsSync(row.inputCopyJson)) fail(`missing input copy: ${row.inputCopyJson}`);
  if (!fs.existsSync(row.validationJson)) fail(`missing validation: ${row.validationJson}`);
  if (!html.includes(row.workbenchHref)) fail(`cockpit HTML missing workbench link: ${row.workbenchHref}`);
  if (row.readyRows !== 0) fail(`batch should not have ready rows yet: ${row.batchNo}`);
}

const boundaryText = `${cockpit.boundary || ""} ${cockpit.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education operations",
  "source intake",
  "teaching-module seed",
  "batch review",
  "deletion-readiness",
  "does not generate reviewer conclusions",
  "accept machine drafts as human review",
  "delete files",
  "learner-facing release",
  "copy private source wording",
  "stock recommendations",
  "live signals",
  "return promises",
  "real-money guidance",
  "production readiness",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  cockpitStatus: cockpit.cockpitStatus,
  totalFiles: cockpit.totalFiles,
  visualOcrCardsBatched: cockpit.visualOcrCardsBatched,
  visualOcrReviewerCards: cockpit.visualOcrReviewerCards,
  visualOcrBatches: cockpit.visualOcrBatches,
  visualOcrReadyRows: cockpit.visualOcrReadyRows,
  visualOcrBlockedRows: cockpit.visualOcrBlockedRows,
  sourceFolderMayBeDeleted: cockpit.sourceFolderMayBeDeleted,
}, null, 2));
