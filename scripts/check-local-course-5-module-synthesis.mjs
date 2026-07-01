import fs from "node:fs";

const synthesisPath = "docs/LOCAL_COURSE_5_MODULE_SYNTHESIS.json";
const synthesisMdPath = "docs/LOCAL_COURSE_5_MODULE_SYNTHESIS.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const synthesis = readJson(synthesisPath);
if (!fs.existsSync(synthesisMdPath)) fail(`missing ${synthesisMdPath}`);

if (synthesis.educationOnly !== true) fail("module synthesis must keep educationOnly:true");
if (synthesis.productionReady !== false) fail("module synthesis must keep productionReady:false");
if (synthesis.learnerFacingRelease !== false) fail("module synthesis must keep learnerFacingRelease:false");
if (synthesis.approvalStatus !== "not_approved") fail("module synthesis must keep approvalStatus:not_approved");
if (synthesis.writeAllowedNow !== false) fail("module synthesis must keep writeAllowedNow:false");
if (synthesis.synthesisStatus !== "course_5_module_synthesis_ready_private_research_release_blocked") {
  fail(`unexpected synthesisStatus: ${synthesis.synthesisStatus}`);
}
if (synthesis.totalFiles !== 134) fail("Course 5 total file count drift");
if (synthesis.uniquePrimaryRows !== 131) fail("Course 5 unique primary count drift");
if (synthesis.textAbsorbedRows < 82) fail("text absorbed rows regressed");
if (synthesis.followupRequiredRows > 49) fail("follow-up rows regressed");
if (synthesis.totalExtractedChars < 15315443) fail("extracted chars regressed");
if (synthesis.knowledgeNodeCandidateRows < 675) fail("knowledge node candidate rows regressed");
if (synthesis.containerRows !== 10) fail("container row count drift");
if (synthesis.totalContainerEntries !== 11079) fail("container entry count drift");
if (synthesis.totalImageEntries !== 10569) fail("image entry count drift");
if (synthesis.visualSourceRows !== 41 || synthesis.visualSampleRows !== 121) fail("visual sample counts drift");
if (synthesis.ocrEngineAvailable !== false) fail("OCR availability should currently be false");
if (synthesis.learnerReadyModules !== 0) fail("no Course 5 module may be learner-ready");

if (!Array.isArray(synthesis.moduleRows) || synthesis.moduleRows.length < 12) fail("module rows missing");
if (synthesis.modules !== synthesis.moduleRows.length) fail("module count mismatch");
if (synthesis.modulesWithText < 10) fail("too few modules with text evidence");
if (synthesis.modulesWithVisuals < 8) fail("too few modules with visual evidence");

const badRows = synthesis.moduleRows.filter((row) =>
  row.productionReady !== false ||
  row.learnerFacingRelease !== false ||
  row.writeAllowedNow !== false ||
  row.approvalStatus !== "not_approved" ||
  row.reviewStatus !== "needs_reviewer_distillation_public_grounding_and_originality_check");
if (badRows.length) fail(`module rows violate release boundary: ${badRows.slice(0, 3).map((row) => row.moduleId).join(", ")}`);

const chartRow = synthesis.moduleRows.find((row) => row.moduleId === "chart_pattern_encyclopedia");
if (!chartRow) fail("chart_pattern_encyclopedia module missing");
if (chartRow.sourceDocumentRows < 80 || chartRow.visualSampleRows < 60 || chartRow.imageEntries < 9000) {
  fail("chart pattern encyclopedia coverage too thin");
}

const slideRow = synthesis.moduleRows.find((row) => row.moduleId === "course_slides_alignment");
if (!slideRow || slideRow.sourceDocumentRows < 60 || slideRow.visualSampleRows < 6) fail("course slide alignment coverage too thin");

if (!Array.isArray(synthesis.priorityRows) || synthesis.priorityRows.length === 0) fail("priority rows missing");
if (!Array.isArray(synthesis.commands) || !synthesis.commands.some((command) => /check:local-course-5-module-synthesis/.test(command))) {
  fail("commands must include module synthesis check");
}

const boundaryText = `${synthesis.boundary || ""} ${synthesis.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education research",
  "module candidates",
  "not learner-facing",
  "publication-cleared",
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
  educationOnly: synthesis.educationOnly,
  productionReady: synthesis.productionReady,
  learnerFacingRelease: synthesis.learnerFacingRelease,
  approvalStatus: synthesis.approvalStatus,
  writeAllowedNow: synthesis.writeAllowedNow,
  synthesisStatus: synthesis.synthesisStatus,
  modules: synthesis.modules,
  modulesWithText: synthesis.modulesWithText,
  modulesWithVisuals: synthesis.modulesWithVisuals,
  textAbsorbedRows: synthesis.textAbsorbedRows,
  followupRequiredRows: synthesis.followupRequiredRows,
  learnerReadyModules: synthesis.learnerReadyModules,
}, null, 2));
