import fs from "node:fs";

const defaultInputPath = "docs/LOCAL_COURSE_ABSORPTION_P0_REVIEW_INPUT_TEMPLATE.json";
const defaultOutputJsonPath = "docs/LOCAL_COURSE_ABSORPTION_P0_REVIEW_INPUT_VALIDATION.json";
const defaultOutputMdPath = "docs/LOCAL_COURSE_ABSORPTION_P0_REVIEW_INPUT_VALIDATION.md";

const forbiddenPhrases = [
  "推荐买入",
  "推荐卖出",
  "保证收益",
  "胜率承诺",
  "实盘信号",
  "自动下单",
  "接入券商",
  "真实资金建议",
];

function fail(message) {
  throw new Error(message);
}

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function checklistDone(checklist = {}) {
  return Object.values(checklist).length > 0 && Object.values(checklist).every((value) => value === "done" || value === true);
}

function forbiddenHits(value) {
  const blob = JSON.stringify(value || {});
  return forbiddenPhrases.filter((phrase) => blob.includes(phrase));
}

const inputPath = argValue("--input", defaultInputPath);
const outputJsonPath = argValue("--output-json", defaultOutputJsonPath);
const outputMdPath = argValue("--output-md", defaultOutputMdPath);
const input = readJson(inputPath);
if (input.educationOnly !== true) fail("review input must keep educationOnly:true");
if (input.productionReady !== false) fail("review input must keep productionReady:false");
if (input.learnerFacingRelease !== false) fail("review input must keep learnerFacingRelease:false");
if (input.approvalStatus !== "not_approved") fail("review input must remain not_approved");

const validationRows = (input.inputEntries || []).map((entry) => {
  const hits = forbiddenHits(entry);
  const manual = entry.category === "manual_transcription";
  const replacement = entry.category === "source_replacement";
  const missing = [];
  let ready = false;

  if (!text(entry.reviewerName)) missing.push("reviewerName");
  if (!text(entry.reviewedAt)) missing.push("reviewedAt");

  if (manual) {
    if (!text(entry.manualInput?.humanTranscription)) missing.push("humanTranscription");
    if (!text(entry.manualInput?.humanSummary)) missing.push("humanSummary");
    if (!checklistDone(entry.manualInput?.checklist)) missing.push("manualChecklist");
    ready = missing.length === 0 && hits.length === 0;
  } else if (replacement) {
    if (!text(entry.replacementInput?.replacementSourcePath)) missing.push("replacementSourcePath");
    if (!text(entry.replacementInput?.replacementNote)) missing.push("replacementNote");
    if (!text(entry.replacementInput?.rerunEvidence)) missing.push("rerunEvidence");
    if (!checklistDone(entry.replacementInput?.checklist)) missing.push("replacementChecklist");
    ready = missing.length === 0 && hits.length === 0;
  } else {
    missing.push("supportedCategory");
  }

  return {
    id: entry.id,
    taskId: entry.taskId,
    category: entry.category,
    sourceRelativePath: entry.sourceRelativePath,
    pageNumber: entry.pageNumber,
    validationStatus: ready ? "ready_for_overlay_apply" : "blocked_missing_reviewer_input",
    readyForOverlayApply: ready,
    missingFields: missing,
    forbiddenHits: hits,
    nextGate: entry.nextGate,
  };
});

const readyEntries = validationRows.filter((row) => row.readyForOverlayApply).length;
const blockedEntries = validationRows.length - readyEntries;
const forbiddenHitEntries = validationRows.filter((row) => row.forbiddenHits.length).length;

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  validationStatus: readyEntries === validationRows.length ? "ready_for_overlay_apply" : "blocked_missing_reviewer_input",
  fixtureOnly: input.fixtureOnly === true,
  inputPath,
  totalEntries: validationRows.length,
  readyEntries,
  blockedEntries,
  forbiddenHitEntries,
  validationRows,
  nextStep: readyEntries === validationRows.length
    ? "Apply validated input to the P0 review overlay, then rerun overlay and absorption readiness gates."
    : "Fill missing reviewer fields in a copied input file, then rerun this dry-run validator.",
  boundary: "P0 review input validation is a dry-run gate. It does not write overlay changes, approve learner-facing release, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course Absorption P0 Review Input Validation",
  "",
  "Dry-run validation report for reviewer-filled P0 input.",
  "",
  `- Validation status: ${report.validationStatus}`,
  `- Input path: ${report.inputPath}`,
  `- Total entries: ${report.totalEntries}`,
  `- Ready entries: ${report.readyEntries}`,
  `- Blocked entries: ${report.blockedEntries}`,
  `- Forbidden-hit entries: ${report.forbiddenHitEntries}`,
  "",
  "## First Rows",
  "",
  "| Entry | Category | Page | Status | Missing fields | Forbidden hits |",
  "| --- | --- | ---: | --- | --- | --- |",
  ...validationRows.slice(0, 12).map((row) => `| ${row.id} | ${row.category} | ${row.pageNumber || ""} | ${row.validationStatus} | ${row.missingFields.join(", ")} | ${row.forbiddenHits.join(", ")} |`),
  "",
  "## Next Step",
  "",
  report.nextStep,
  "",
  "## Boundary",
  "",
  report.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  validationStatus: report.validationStatus,
  totalEntries: report.totalEntries,
  readyEntries: report.readyEntries,
  blockedEntries: report.blockedEntries,
  forbiddenHitEntries: report.forbiddenHitEntries,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
