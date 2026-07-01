import fs from "node:fs";

const queuePath = "docs/LOCAL_COURSE_5_VISUAL_REVIEW_QUEUE.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const queue = readJson(queuePath);

if (queue.educationOnly !== true) fail("visual queue must keep educationOnly:true");
if (queue.productionReady !== false) fail("visual queue must keep productionReady:false");
if (queue.learnerFacingRelease !== false) fail("visual queue must keep learnerFacingRelease:false");
if (queue.approvalStatus !== "not_approved") fail("visual queue must keep approvalStatus:not_approved");
if (queue.writeAllowedNow !== false) fail("visual queue must keep writeAllowedNow:false");
if (!Array.isArray(queue.rows) || queue.rows.length === 0) fail("visual queue rows missing");
if (queue.queueRows !== queue.rows.length) fail("queueRows must match rows length");
if (queue.sampleImageRows <= 0) fail("visual samples missing");

const badRows = queue.rows.filter((row) =>
  row.productionReady !== false ||
  row.learnerFacingRelease !== false ||
  row.writeAllowedNow !== false ||
  row.approvalStatus !== "not_approved");
if (badRows.length) fail(`rows violate release boundary: ${badRows.slice(0, 3).map((row) => row.relativePath).join(", ")}`);

const rowsWithoutSamples = queue.rows.filter((row) => row.sampleCount <= 0);
if (rowsWithoutSamples.length) fail(`visual rows missing samples: ${rowsWithoutSamples[0].relativePath}`);

const missingImages = [];
for (const row of queue.rows) {
  for (const sample of row.samples || []) {
    if (!fs.existsSync(sample.imagePath)) missingImages.push(sample.imagePath);
  }
}
if (missingImages.length) fail(`sample images missing: ${missingImages.slice(0, 3).join(", ")}`);

console.log(JSON.stringify({
  ok: true,
  educationOnly: queue.educationOnly,
  productionReady: queue.productionReady,
  learnerFacingRelease: queue.learnerFacingRelease,
  approvalStatus: queue.approvalStatus,
  writeAllowedNow: queue.writeAllowedNow,
  queueStatus: queue.queueStatus,
  queueRows: queue.queueRows,
  sampleImageRows: queue.sampleImageRows,
}, null, 2));
