import fs from "node:fs";

const packsPath = "docs/LOCAL_COURSE_5_FOLLOWUP_WORK_PACKS.json";
const packsMdPath = "docs/LOCAL_COURSE_5_FOLLOWUP_WORK_PACKS.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const artifact = readJson(packsPath);
if (!fs.existsSync(packsMdPath)) fail(`missing ${packsMdPath}`);

if (artifact.educationOnly !== true) fail("work packs must keep educationOnly:true");
if (artifact.productionReady !== false) fail("work packs must keep productionReady:false");
if (artifact.learnerFacingRelease !== false) fail("work packs must keep learnerFacingRelease:false");
if (artifact.approvalStatus !== "not_approved") fail("work packs must keep approvalStatus:not_approved");
if (artifact.writeAllowedNow !== false) fail("work packs must keep writeAllowedNow:false");
if (artifact.workPackStatus !== "course_5_followup_work_packs_ready_release_blocked") {
  fail(`unexpected workPackStatus: ${artifact.workPackStatus}`);
}
if (artifact.followupRows !== 49) fail("expected 49 follow-up rows");
if (artifact.pdfFollowupRows !== 41) fail("expected 41 PDF follow-up rows");
if (artifact.zipFollowupRows !== 8) fail("expected 8 ZIP follow-up rows");
if (artifact.largePdfRows !== 3) fail("expected 3 large PDF rows");
if (artifact.scannedPdfRows !== 38) fail("expected 38 scanned/low-text PDF rows");
if (artifact.workPacks < 7) fail("expected bounded work packs");
if (artifact.totalFollowupPages <= 25000) fail("follow-up PDF page count unexpectedly low");
if (artifact.totalZipImageEntries !== 10569) fail("zip image entry count drift");
if (artifact.totalPdfSampleImages !== 121) fail("PDF sample image count drift");
if (artifact.totalZipSampleImages < 80) fail("ZIP sample image count too low");
if (artifact.totalSampleImages < 200) fail("combined sample image count too low");
if (artifact.ocrEngineAvailable !== false) fail("OCR should currently be unavailable");
if (artifact.deletionReadiness?.course5SourceFolderMayBeDeleted !== false) fail("Course 5 source folder must not be marked deletable");
if (artifact.deletionReadiness?.deleteExecutedNow !== false) fail("delete must not be executed");
if (artifact.deletionReadiness?.writeAllowedNow !== false) fail("delete readiness must keep writeAllowedNow:false");

if (!Array.isArray(artifact.workItems) || artifact.workItems.length !== artifact.followupRows) fail("work item count mismatch");
if (!Array.isArray(artifact.packs) || artifact.packs.length !== artifact.workPacks) fail("pack count mismatch");
const itemIds = new Set(artifact.workItems.map((item) => item.workItemId));
const packedIds = new Set(artifact.packs.flatMap((pack) => pack.rows.map((row) => row.workItemId)));
if (itemIds.size !== artifact.followupRows || packedIds.size !== itemIds.size) fail("packed work item coverage mismatch");
for (const id of itemIds) {
  if (!packedIds.has(id)) fail(`unpacked work item: ${id}`);
}

const badRows = [
  ...artifact.workItems,
  ...artifact.packs,
].filter((row) =>
  row.productionReady !== false ||
  row.learnerFacingRelease !== false ||
  row.writeAllowedNow !== false ||
  row.approvalStatus !== "not_approved");
if (badRows.length) fail(`rows violate release boundary: ${badRows.slice(0, 3).map((row) => row.workItemId || row.packId).join(", ")}`);

const rowsWithoutSamples = artifact.workItems.filter((item) => item.sampleImages.length === 0);
if (rowsWithoutSamples.length) fail(`follow-up row missing sample images: ${rowsWithoutSamples[0].relativePath}`);

const zipWithoutImages = artifact.workItems.filter((item) => item.extension === ".zip" && item.imageEntryCount <= 0);
if (zipWithoutImages.length) fail(`ZIP follow-up missing image entry count: ${zipWithoutImages[0].relativePath}`);

const missingSampleFiles = artifact.workItems
  .flatMap((item) => item.sampleImages || [])
  .filter((sample) => !fs.existsSync(sample.imagePath));
if (missingSampleFiles.length) fail(`sample image files missing: ${missingSampleFiles.slice(0, 3).map((sample) => sample.imagePath).join(", ")}`);

const boundaryText = `${artifact.boundary || ""} ${artifact.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education operations",
  "do not perform ocr",
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
