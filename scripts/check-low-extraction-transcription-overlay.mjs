import fs from "node:fs";

const overlayPath = "docs/LOCAL_COURSE_LOW_EXTRACTION_TRANSCRIPTION_OVERLAY.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const overlay = readJson(overlayPath);
const pageEntries = overlay.pageEntries || [];
const documentRows = overlay.documentRows || [];

if (overlay.educationOnly !== true) fail("transcription overlay must keep educationOnly:true");
if (overlay.productionReady !== false) fail("transcription overlay must keep productionReady:false");
if (overlay.learnerFacingRelease !== false) fail("transcription overlay must keep learnerFacingRelease:false");
if (overlay.approvalStatus !== "not_approved") fail("transcription overlay must remain not_approved");
if (overlay.overlayStatus !== "manual_transcription_not_started") fail(`unexpected overlayStatus: ${overlay.overlayStatus}`);
if (overlay.lowExtractionDocs !== 5 || documentRows.length !== 5) fail(`expected 5 low-extraction documents, got ${overlay.lowExtractionDocs}/${documentRows.length}`);
if (overlay.totalPages !== 22 || overlay.transcriptionPages !== 22 || pageEntries.length !== 22) {
  fail(`expected 22 page entries, got total:${overlay.totalPages} transcription:${overlay.transcriptionPages} entries:${pageEntries.length}`);
}
if (overlay.previewPages !== overlay.totalPages) fail("preview pages must cover every transcription page");
if (overlay.pagesNotStarted !== 22) fail(`all pages must start not_started, got ${overlay.pagesNotStarted}`);
if (overlay.pagesTranscribed !== 0) fail(`generated overlay must not prefill transcribed pages, got ${overlay.pagesTranscribed}`);
if (overlay.pagesUnusable !== 0) fail(`generated overlay must not mark unusable pages, got ${overlay.pagesUnusable}`);
if (overlay.pagesNeedSourceReplacement !== 0) fail(`generated overlay must not mark source replacement pages, got ${overlay.pagesNeedSourceReplacement}`);

const seenPageIds = new Set();
for (const entry of pageEntries) {
  if (seenPageIds.has(entry.id)) fail(`duplicate page entry ${entry.id}`);
  seenPageIds.add(entry.id);
  if (entry.educationOnly !== true || entry.productionReady !== false) fail(`${entry.id} boundary drift`);
  if (entry.learnerFacingRelease !== false || entry.approvalStatus !== "not_approved") fail(`${entry.id} release gate drift`);
  if (entry.transcriptionStatus !== "not_started") fail(`${entry.id} should start not_started`);
  if (entry.visualDecision !== "pending") fail(`${entry.id} should start pending`);
  if (entry.reviewerTranscription !== "" || entry.reviewerSummary !== "" || entry.unusableReason !== "") {
    fail(`${entry.id} generated overlay must keep human fields blank`);
  }
  if (entry.replacementSourceNeeded !== false) fail(`${entry.id} should not pre-mark replacement needed`);
  if (entry.publicSourceGroundingNeeded !== true) fail(`${entry.id} must require public-source grounding`);
  if (!entry.previewPath || !fs.existsSync(entry.previewPath)) fail(`${entry.id} preview missing: ${entry.previewPath}`);
  if (!Array.isArray(entry.checklist) || entry.checklist.length < 4) fail(`${entry.id} missing checklist`);
  if (!entry.checklist.every((item) => item.required === true && item.status === "not_started")) {
    fail(`${entry.id} checklist must start required/not_started`);
  }
}

for (const row of documentRows) {
  if (row.transcriptionStatus !== "not_started") fail(`${row.documentId} document status drift`);
  if (row.pagesNotStarted !== row.pageEntries) fail(`${row.documentId} all pages must start not_started`);
  if (row.pagesTranscribed !== 0 || row.pagesUnusable !== 0 || row.pagesNeedSourceReplacement !== 0) {
    fail(`${row.documentId} generated document row must not prefill outcomes`);
  }
}

if (!/Fields start blank/i.test(overlay.boundary || "")) fail("overlay boundary must say fields start blank");

console.log(JSON.stringify({
  ok: true,
  educationOnly: overlay.educationOnly,
  productionReady: overlay.productionReady,
  learnerFacingRelease: overlay.learnerFacingRelease,
  approvalStatus: overlay.approvalStatus,
  overlayStatus: overlay.overlayStatus,
  lowExtractionDocs: overlay.lowExtractionDocs,
  transcriptionPages: overlay.transcriptionPages,
  pagesNotStarted: overlay.pagesNotStarted,
  pagesTranscribed: overlay.pagesTranscribed,
}, null, 2));
