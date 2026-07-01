import fs from "node:fs";

const inventoryPath = "docs/LOCAL_COURSE_5_SOURCE_INVENTORY.json";
const intakePath = "docs/LOCAL_COURSE_5_DOCUMENT_INTAKE.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(artifact, name) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${name} must keep approvalStatus:not_approved`);
  if (String(artifact.boundary || "").length < 80) fail(`${name} boundary is too thin`);
}

const inventory = readJson(inventoryPath);
const intake = readJson(intakePath);

assertBoundary(inventory, "inventory");
assertBoundary(intake, "intake");

if (intake.writeAllowedNow !== false) fail("intake must keep writeAllowedNow:false");
if (!Array.isArray(inventory.inventoryRows) || inventory.inventoryRows.length === 0) fail("inventory rows missing");
if (!Array.isArray(intake.rows) || intake.rows.length === 0) fail("intake rows missing");
if (inventory.totalFiles < 100) fail("Course 5 inventory unexpectedly small");
if (inventory.totalFiles !== inventory.inventoryRows.length) fail("inventory totalFiles must equal inventoryRows length");
if (intake.totalFiles !== inventory.totalFiles) fail("intake totalFiles must match inventory");
if ((inventory.extensionCounts?.[".pdf"] || 0) < 100) fail("Course 5 should include the expected PDF majority");
if ((inventory.extensionCounts?.[".zip"] || 0) < 1) fail("Course 5 zip files not represented");
if ((inventory.extensionCounts?.[".xlsx"] || 0) < 1) fail("Course 5 xlsx files not represented");
if ((inventory.extensionCounts?.[".epub"] || 0) < 1) fail("Course 5 epub files not represented");
if (intake.uniquePrimaryRows <= 0) fail("unique primary rows missing");
if (intake.textAbsorbedRows <= 0) fail("no text absorbed rows");
if (intake.totalExtractedChars <= 0) fail("no extracted text");
if (intake.knowledgeNodeCandidateRows <= 0) fail("no knowledge node candidates");
if (!intake.moduleCounts || Object.keys(intake.moduleCounts).length < 3) fail("module mapping too thin");
if (!intake.courseAlignmentCounts || Object.keys(intake.courseAlignmentCounts).length < 1) fail("course alignment missing");

const badRows = intake.rows.filter((row) =>
  row.productionReady !== false ||
  row.learnerFacingRelease !== false ||
  row.writeAllowedNow !== false ||
  row.approvalStatus !== "not_approved");
if (badRows.length) fail(`rows violate release boundary: ${badRows.slice(0, 3).map((row) => row.relativePath).join(", ")}`);

const primaryRows = intake.rows.filter((row) => !row.duplicateOf);
const primaryWithoutModule = primaryRows.filter((row) => !Array.isArray(row.moduleTags) || row.moduleTags.length === 0);
if (primaryWithoutModule.length) fail(`primary rows missing module tags: ${primaryWithoutModule[0].relativePath}`);

console.log(JSON.stringify({
  ok: true,
  educationOnly: intake.educationOnly,
  productionReady: intake.productionReady,
  learnerFacingRelease: intake.learnerFacingRelease,
  approvalStatus: intake.approvalStatus,
  writeAllowedNow: intake.writeAllowedNow,
  intakeStatus: intake.intakeStatus,
  totalFiles: intake.totalFiles,
  intakeRows: intake.intakeRows,
  uniquePrimaryRows: intake.uniquePrimaryRows,
  textAbsorbedRows: intake.textAbsorbedRows,
  followupRequiredRows: intake.followupRequiredRows,
  totalExtractedChars: intake.totalExtractedChars,
  knowledgeNodeCandidateRows: intake.knowledgeNodeCandidateRows,
}, null, 2));
