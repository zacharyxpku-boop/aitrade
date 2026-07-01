import fs from "node:fs";

const packPath = "docs/LOCAL_COURSE_5_P0_VISUAL_EVIDENCE_PACK.json";
const packMdPath = "docs/LOCAL_COURSE_5_P0_VISUAL_EVIDENCE_PACK.md";
const workPacksPath = "docs/LOCAL_COURSE_5_FOLLOWUP_WORK_PACKS.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const pack = readJson(packPath);
const workPacks = readJson(workPacksPath);
if (!fs.existsSync(packMdPath)) fail(`missing ${packMdPath}`);

if (pack.educationOnly !== true) fail("P0 visual evidence pack must keep educationOnly:true");
if (pack.productionReady !== false) fail("P0 visual evidence pack must keep productionReady:false");
if (pack.learnerFacingRelease !== false) fail("P0 visual evidence pack must keep learnerFacingRelease:false");
if (pack.approvalStatus !== "not_approved") fail("P0 visual evidence pack must remain not_approved");
if (pack.writeAllowedNow !== false) fail("P0 visual evidence pack must keep writeAllowedNow:false");
if (pack.evidenceStatus !== "course_5_p0_visual_evidence_deepened_release_blocked") {
  fail(`unexpected evidenceStatus: ${pack.evidenceStatus}`);
}
if (pack.p0SourceRows !== 28) fail("expected 28 P0 follow-up source rows");
if (pack.p0PdfRows !== 26) fail("expected 26 P0 PDF rows");
if (pack.p0ZipRows !== 2) fail("expected 2 P0 ZIP rows");
if (pack.pdfSamplesPerSourceLimit !== 9) fail("unexpected PDF sample limit");
if (pack.zipSamplesPerSourceLimit !== 24) fail("unexpected ZIP sample limit");
if (pack.pdfSampleRows < 230) fail("P0 PDF sample coverage unexpectedly low");
if (pack.zipSampleRows < 45) fail("P0 ZIP sample coverage unexpectedly low");
if (pack.sampleRows < 280) fail("P0 total sample coverage unexpectedly low");
if (pack.cvMetricsAvailable !== true) fail("CV metrics should be available for P0 visual evidence");
if (pack.ocrEngineAvailable !== false) fail("OCR must not be claimed available");

const expectedP0Rows = workPacks.workItems.filter((item) => String(item.priority || "").startsWith("P0"));
if (expectedP0Rows.length !== pack.p0SourceRows) fail("P0 source row count disagrees with work packs");

if (!Array.isArray(pack.sourceRows) || pack.sourceRows.length !== pack.p0SourceRows) fail("source row count mismatch");
if (!Array.isArray(pack.sampleRowsDetail) || pack.sampleRowsDetail.length !== pack.sampleRows) fail("sample row detail count mismatch");

const sourceIds = new Set(pack.sourceRows.map((row) => row.recordId));
for (const item of expectedP0Rows) {
  if (!sourceIds.has(item.recordId)) fail(`missing P0 source in evidence pack: ${item.recordId}`);
}

const badSourceRows = pack.sourceRows.filter((row) =>
  row.sampleCount <= 0 ||
  row.reviewStatus !== "p0_visual_evidence_ready_needs_reviewer_semantics" ||
  row.learnerFacingRelease !== false ||
  row.approvalStatus !== "not_approved" ||
  row.productionReady !== false ||
  row.writeAllowedNow !== false
);
if (badSourceRows.length) fail(`bad P0 source rows: ${badSourceRows.slice(0, 3).map((row) => row.recordId).join(", ")}`);

const missingSampleFiles = pack.sampleRowsDetail.filter((sample) => !fs.existsSync(sample.sampleImagePath));
if (missingSampleFiles.length) fail(`missing P0 visual sample files: ${missingSampleFiles.slice(0, 3).map((sample) => sample.sampleImagePath).join(", ")}`);

const badSamples = pack.sampleRowsDetail.filter((sample) =>
  sample.analysisStatus !== "visual_metrics_ready" ||
  typeof sample.edgeDensity !== "number" ||
  typeof sample.darkPixelRatio !== "number" ||
  typeof sample.visualDensity !== "number" ||
  sample.learnerFacingRelease !== false ||
  sample.approvalStatus !== "not_approved" ||
  sample.productionReady !== false ||
  sample.writeAllowedNow !== false
);
if (badSamples.length) fail(`bad P0 sample rows: ${badSamples.slice(0, 3).map((sample) => sample.sampleId).join(", ")}`);

const chartEncyclopediaRows = pack.sourceRows.filter((row) => row.priority === "P0_chart_encyclopedia_core");
const slideRows = pack.sourceRows.filter((row) => row.priority === "P0_course_slide_alignment");
if (chartEncyclopediaRows.length !== 25) fail("chart encyclopedia P0 coverage drift");
if (slideRows.length !== 3) fail("course slide P0 coverage drift");
const p0ZipRows = chartEncyclopediaRows.filter((row) => row.extension === ".zip");
if (p0ZipRows.length !== 2) fail("P0 ZIP chart package coverage drift");
if (!p0ZipRows.some((row) => row.imageEntryCount === 9027 && row.sampleCount >= 20)) {
  fail("P0 8800 image ZIP coverage missing");
}
if (!p0ZipRows.some((row) => row.imageEntryCount === 691 && row.sampleCount >= 20)) {
  fail("P0 SP500 image ZIP coverage missing");
}
if (!chartEncyclopediaRows.some((row) => row.pageCount >= 9000 && row.sampleCount === 9)) {
  fail("P0 large chart encyclopedia PDF coverage missing");
}

const boundaryText = `${pack.boundary || ""} ${pack.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education research",
  "paraphrased teaching modules",
  "not exhaustive ocr",
  "not learner-facing",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
  "production readiness",
  "deletion still remains blocked",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary/completion missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  evidenceStatus: pack.evidenceStatus,
  p0SourceRows: pack.p0SourceRows,
  p0PdfRows: pack.p0PdfRows,
  p0ZipRows: pack.p0ZipRows,
  sampleRows: pack.sampleRows,
  pdfSampleRows: pack.pdfSampleRows,
  zipSampleRows: pack.zipSampleRows,
  cvMetricsAvailable: pack.cvMetricsAvailable,
  ocrEngineAvailable: pack.ocrEngineAvailable,
}, null, 2));
