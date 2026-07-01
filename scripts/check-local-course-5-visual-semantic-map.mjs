import fs from "node:fs";

const mapPath = "docs/LOCAL_COURSE_5_VISUAL_SEMANTIC_MAP.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const map = readJson(mapPath);

if (map.educationOnly !== true) fail("visual semantic map must keep educationOnly:true");
if (map.productionReady !== false) fail("visual semantic map must keep productionReady:false");
if (map.learnerFacingRelease !== false) fail("visual semantic map must keep learnerFacingRelease:false");
if (map.approvalStatus !== "not_approved") fail("visual semantic map must keep approvalStatus:not_approved");
if (map.writeAllowedNow !== false) fail("visual semantic map must keep writeAllowedNow:false");
if (!Array.isArray(map.rows) || map.rows.length !== map.sourceRows) fail("source rows mismatch");
if (!Array.isArray(map.sampleRowsDetail) || map.sampleRowsDetail.length !== map.sampleRows) fail("sample rows mismatch");
if (map.sourceRows <= 0) fail("source rows missing");
if (map.sampleRows <= 0) fail("sample rows missing");
if (map.analyzedSampleRows !== map.sampleRows) fail("all visual samples should have metrics");
if (!map.semanticTagCounts || Object.keys(map.semanticTagCounts).length === 0) fail("semantic tag counts missing");

const badRows = [...map.rows, ...map.sampleRowsDetail].filter((row) =>
  row.productionReady !== false ||
  row.learnerFacingRelease !== false ||
  row.writeAllowedNow !== false ||
  row.approvalStatus !== "not_approved");
if (badRows.length) fail(`rows violate release boundary: ${badRows.slice(0, 3).map((row) => row.relativePath).join(", ")}`);

const missingImages = map.sampleRowsDetail.filter((row) => !fs.existsSync(row.imagePath));
if (missingImages.length) fail(`sample images missing: ${missingImages.slice(0, 3).map((row) => row.imagePath).join(", ")}`);

const missingMetrics = map.sampleRowsDetail.filter((row) =>
  row.analysisStatus !== "visual_metrics_ready" ||
  typeof row.width !== "number" ||
  typeof row.height !== "number" ||
  typeof row.edgeDensity !== "number");
if (missingMetrics.length) fail(`sample metrics missing: ${missingMetrics[0].imagePath}`);

console.log(JSON.stringify({
  ok: true,
  educationOnly: map.educationOnly,
  productionReady: map.productionReady,
  learnerFacingRelease: map.learnerFacingRelease,
  approvalStatus: map.approvalStatus,
  writeAllowedNow: map.writeAllowedNow,
  visualSemanticStatus: map.visualSemanticStatus,
  ocrEngineAvailable: map.ocrEngineAvailable,
  sourceRows: map.sourceRows,
  sampleRows: map.sampleRows,
  analyzedSampleRows: map.analyzedSampleRows,
}, null, 2));
