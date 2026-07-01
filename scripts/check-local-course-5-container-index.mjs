import fs from "node:fs";

const indexPath = "docs/LOCAL_COURSE_5_CONTAINER_INDEX.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const index = readJson(indexPath);

if (index.educationOnly !== true) fail("container index must keep educationOnly:true");
if (index.productionReady !== false) fail("container index must keep productionReady:false");
if (index.learnerFacingRelease !== false) fail("container index must keep learnerFacingRelease:false");
if (index.approvalStatus !== "not_approved") fail("container index must keep approvalStatus:not_approved");
if (index.writeAllowedNow !== false) fail("container index must keep writeAllowedNow:false");
if (!Array.isArray(index.rows) || index.rows.length !== index.containerRows) fail("container rows mismatch");
if (index.zipRows < 1) fail("zip rows missing");
if (index.epubRows < 1) fail("epub rows missing");
if (index.epubTextRows !== index.epubRows) fail("all epubs should have extracted body text");
if (index.totalContainerEntries <= 0) fail("container entries missing");
if (index.totalImageEntries <= 0) fail("image entries missing");

const badRows = index.rows.filter((row) =>
  row.productionReady !== false ||
  row.learnerFacingRelease !== false ||
  row.writeAllowedNow !== false ||
  row.approvalStatus !== "not_approved");
if (badRows.length) fail(`rows violate release boundary: ${badRows.slice(0, 3).map((row) => row.relativePath).join(", ")}`);

const imageZipWithoutSamples = index.rows.filter((row) =>
  row.extension === ".zip" &&
  row.imageEntryCount > 0 &&
  (!Array.isArray(row.sampleImageDimensions) || row.sampleImageDimensions.length === 0));
if (imageZipWithoutSamples.length) fail(`image zip rows missing dimensions: ${imageZipWithoutSamples[0].relativePath}`);

console.log(JSON.stringify({
  ok: true,
  educationOnly: index.educationOnly,
  productionReady: index.productionReady,
  learnerFacingRelease: index.learnerFacingRelease,
  approvalStatus: index.approvalStatus,
  writeAllowedNow: index.writeAllowedNow,
  indexStatus: index.indexStatus,
  containerRows: index.containerRows,
  zipRows: index.zipRows,
  epubRows: index.epubRows,
  epubTextRows: index.epubTextRows,
  totalContainerEntries: index.totalContainerEntries,
  totalImageEntries: index.totalImageEntries,
}, null, 2));
