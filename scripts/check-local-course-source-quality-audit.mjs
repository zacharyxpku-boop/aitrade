import fs from "node:fs";

const auditPath = "docs/LOCAL_COURSE_SOURCE_QUALITY_AUDIT.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const audit = readJson(auditPath);

if (audit.educationOnly !== true) fail("source quality audit must keep educationOnly:true");
if (audit.productionReady !== false) fail("source quality audit must keep productionReady:false");
if (audit.learnerFacingRelease !== false) fail("source quality audit must keep learnerFacingRelease:false");
if (audit.approvalStatus !== "not_approved") fail("source quality audit must remain not_approved");
if (!audit.sourceRoot || !fs.existsSync(audit.sourceRoot)) fail("source root missing");
if (audit.folderFiles < 300) fail(`expected at least 300 folder files, got ${audit.folderFiles}`);
if (audit.pdfOnlyFolder !== true) fail("local course folder must currently be PDF-only");
if (audit.manifestPdfFiles !== audit.folderFiles) fail("manifest PDF count must match folder file count");
if (audit.uniquePdfFiles < 298) fail(`expected at least 298 unique PDFs, got ${audit.uniquePdfFiles}`);
if (audit.importedUniquePdfFiles !== audit.uniquePdfFiles) {
  fail(`all unique PDFs must be imported, got ${audit.importedUniquePdfFiles}/${audit.uniquePdfFiles}`);
}
if (audit.missingUniquePdfFiles !== 0) fail(`missing unique PDFs: ${audit.missingUniquePdfFiles}`);
if (audit.duplicatePdfFiles < 4) fail(`expected duplicate PDF accounting, got ${audit.duplicatePdfFiles}`);
if (audit.localPrivateCourseCorpusDocs !== audit.uniquePdfFiles) {
  fail(`local corpus docs must match unique PDFs, got ${audit.localPrivateCourseCorpusDocs}/${audit.uniquePdfFiles}`);
}
if ((audit.fullExtractionDocs || 0) < 290) fail(`full extraction docs too low: ${audit.fullExtractionDocs}`);
if ((audit.lowExtractionDocs || 0) < 1) fail("low extraction docs must be explicitly flagged, not hidden");
if (!Array.isArray(audit.lowExtractionList) || audit.lowExtractionList.length !== audit.lowExtractionDocs) {
  fail("low extraction list count mismatch");
}
if (!Array.isArray(audit.forbiddenLanguageList) || audit.forbiddenLanguageList.length !== audit.forbiddenLanguageDocs) {
  fail("forbidden language list count mismatch");
}
for (const item of audit.lowExtractionList) {
  if (item.reviewerGate !== "manual_ocr_or_visual_review_required_before_lesson_use") {
    fail(`${item.sourceRelativePath} missing low-extraction reviewer gate`);
  }
}
for (const item of audit.forbiddenLanguageList) {
  if (item.reviewerGate !== "keep_reviewer_only_and_rewrite_without_actionable_trading_language") {
    fail(`${item.sourceRelativePath} missing forbidden-language reviewer gate`);
  }
}
if (audit.absorptionStatus !== "all_unique_pdfs_imported_with_quality_flags") {
  fail(`unexpected absorptionStatus: ${audit.absorptionStatus}`);
}
if (!/private reviewer-only/i.test(audit.boundary || "")) fail("audit boundary must keep private reviewer-only language");

console.log(JSON.stringify({
  ok: true,
  educationOnly: audit.educationOnly,
  productionReady: audit.productionReady,
  learnerFacingRelease: audit.learnerFacingRelease,
  approvalStatus: audit.approvalStatus,
  folderFiles: audit.folderFiles,
  pdfOnlyFolder: audit.pdfOnlyFolder,
  uniquePdfFiles: audit.uniquePdfFiles,
  importedUniquePdfFiles: audit.importedUniquePdfFiles,
  missingUniquePdfFiles: audit.missingUniquePdfFiles,
  lowExtractionDocs: audit.lowExtractionDocs,
  forbiddenLanguageDocs: audit.forbiddenLanguageDocs,
  absorptionStatus: audit.absorptionStatus,
}, null, 2));
