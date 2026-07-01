import fs from "node:fs";

const indexPath = "docs/LOCAL_COURSE_5_ZIP_VISUAL_SAMPLE_INDEX.json";
const indexMdPath = "docs/LOCAL_COURSE_5_ZIP_VISUAL_SAMPLE_INDEX.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const index = readJson(indexPath);
if (!fs.existsSync(indexMdPath)) fail(`missing ${indexMdPath}`);

if (index.educationOnly !== true) fail("zip sample index must keep educationOnly:true");
if (index.productionReady !== false) fail("zip sample index must keep productionReady:false");
if (index.learnerFacingRelease !== false) fail("zip sample index must keep learnerFacingRelease:false");
if (index.approvalStatus !== "not_approved") fail("zip sample index must keep approvalStatus:not_approved");
if (index.writeAllowedNow !== false) fail("zip sample index must keep writeAllowedNow:false");
if (index.zipSampleStatus !== "course_5_zip_visual_samples_ready_release_blocked") {
  fail(`unexpected zipSampleStatus: ${index.zipSampleStatus}`);
}
if (index.zipRows !== 8) fail("expected 8 ZIP sample rows");
if (index.totalImageEntries !== 10569) fail("ZIP image entry count drift");
if (index.sampleRows < 80) fail("not enough ZIP representative samples");
if (index.samplesPerZipLimit !== 12) fail("unexpected samples per ZIP limit");
if (index.ocrEngineAvailable !== false) fail("OCR should currently be unavailable");
if (index.cvMetricsAvailable !== true) fail("CV metrics should be available");

if (!Array.isArray(index.rows) || index.rows.length !== index.zipRows) fail("ZIP source rows mismatch");
if (!Array.isArray(index.sampleRowsDetail) || index.sampleRowsDetail.length !== index.sampleRows) fail("sample rows mismatch");

const badRows = [...index.rows, ...index.sampleRowsDetail].filter((row) =>
  row.productionReady !== false ||
  row.learnerFacingRelease !== false ||
  row.writeAllowedNow !== false ||
  row.approvalStatus !== "not_approved");
if (badRows.length) fail(`rows violate release boundary: ${badRows.slice(0, 3).map((row) => row.relativePath).join(", ")}`);

const rowsWithoutSamples = index.rows.filter((row) => row.sampleCount <= 0);
if (rowsWithoutSamples.length) fail(`ZIP row missing samples: ${rowsWithoutSamples[0].relativePath}`);

const missingFiles = index.sampleRowsDetail.filter((row) => !fs.existsSync(row.sampleImagePath));
if (missingFiles.length) fail(`sample image missing: ${missingFiles.slice(0, 3).map((row) => row.sampleImagePath).join(", ")}`);

const missingMetrics = index.sampleRowsDetail.filter((row) =>
  row.analysisStatus !== "visual_metrics_ready" ||
  typeof row.edgeDensity !== "number" ||
  typeof row.visualDensity !== "number");
if (missingMetrics.length) fail(`sample metrics missing: ${missingMetrics[0].sampleImagePath}`);

const largest = index.rows.find((row) => /8800图片版/.test(row.relativePath));
if (!largest || largest.imageEntryCount < 9000 || largest.sampleCount !== 12) fail("8800 image package sample coverage drift");

const boundaryText = `${index.boundary || ""} ${index.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education research",
  "bounded representative image samples",
  "not exhaustive extraction",
  "not ocr-complete",
  "not learner-facing",
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
  educationOnly: index.educationOnly,
  productionReady: index.productionReady,
  learnerFacingRelease: index.learnerFacingRelease,
  approvalStatus: index.approvalStatus,
  writeAllowedNow: index.writeAllowedNow,
  zipSampleStatus: index.zipSampleStatus,
  zipRows: index.zipRows,
  totalImageEntries: index.totalImageEntries,
  sampleRows: index.sampleRows,
}, null, 2));
