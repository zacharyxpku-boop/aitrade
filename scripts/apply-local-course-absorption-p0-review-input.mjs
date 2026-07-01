import fs from "node:fs";

const defaultInputPath = "docs/LOCAL_COURSE_ABSORPTION_P0_REVIEW_INPUT_TEMPLATE.json";
const overlayPath = "docs/LOCAL_COURSE_ABSORPTION_P0_REVIEW_OVERLAY.json";
const defaultOutputJsonPath = "docs/LOCAL_COURSE_ABSORPTION_P0_REVIEW_APPLY_REPORT.json";
const defaultOutputMdPath = "docs/LOCAL_COURSE_ABSORPTION_P0_REVIEW_APPLY_REPORT.md";

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

function validateEntry(entry) {
  const hits = forbiddenHits(entry);
  const missing = [];
  const manual = entry.category === "manual_transcription";
  const replacement = entry.category === "source_replacement";

  if (!text(entry.reviewerName)) missing.push("reviewerName");
  if (!text(entry.reviewedAt)) missing.push("reviewedAt");

  if (manual) {
    if (!text(entry.manualInput?.humanTranscription)) missing.push("humanTranscription");
    if (!text(entry.manualInput?.humanSummary)) missing.push("humanSummary");
    if (!checklistDone(entry.manualInput?.checklist)) missing.push("manualChecklist");
  } else if (replacement) {
    if (!text(entry.replacementInput?.replacementSourcePath)) missing.push("replacementSourcePath");
    if (!text(entry.replacementInput?.replacementNote)) missing.push("replacementNote");
    if (!text(entry.replacementInput?.rerunEvidence)) missing.push("rerunEvidence");
    if (!checklistDone(entry.replacementInput?.checklist)) missing.push("replacementChecklist");
  } else {
    missing.push("supportedCategory");
  }

  return {
    ready: missing.length === 0 && hits.length === 0,
    missingFields: missing,
    forbiddenHits: hits,
  };
}

function applyEntry(overlayEntry, inputEntry) {
  const manual = inputEntry.category === "manual_transcription";
  const updated = {
    ...overlayEntry,
    reviewStatus: "ready_for_validation",
    reviewerName: text(inputEntry.reviewerName),
    reviewedAt: text(inputEntry.reviewedAt),
    validationStatus: "ready_for_next_gate",
    fieldCompletion: {
      ...overlayEntry.fieldCompletion,
      requiredFieldsFilled: overlayEntry.fieldCompletion?.requiredFieldsTotal || 0,
      complete: true,
    },
  };
  if (manual) {
    updated.humanTranscription = text(inputEntry.manualInput.humanTranscription);
    updated.humanSummary = text(inputEntry.manualInput.humanSummary);
    updated.uncertainWords = Array.isArray(inputEntry.manualInput.uncertainWords) ? inputEntry.manualInput.uncertainWords : [];
    updated.checklist = inputEntry.manualInput.checklist;
  } else {
    updated.replacementSourcePath = text(inputEntry.replacementInput.replacementSourcePath);
    updated.replacementNote = text(inputEntry.replacementInput.replacementNote);
    updated.rerunEvidence = text(inputEntry.replacementInput.rerunEvidence);
    updated.checklist = inputEntry.replacementInput.checklist;
  }
  return updated;
}

const inputPath = argValue("--input", defaultInputPath);
const outputJsonPath = argValue("--output-json", defaultOutputJsonPath);
const outputMdPath = argValue("--output-md", defaultOutputMdPath);
const write = process.argv.includes("--write");
const input = readJson(inputPath);
const overlay = readJson(overlayPath);
if (write && input.fixtureOnly === true) fail("fixtureOnly input cannot be applied with --write");

for (const [label, data] of [["review input", input], ["overlay", overlay]]) {
  if (data.educationOnly !== true) fail(`${label} must keep educationOnly:true`);
  if (data.productionReady !== false) fail(`${label} must keep productionReady:false`);
  if (data.learnerFacingRelease !== false) fail(`${label} must keep learnerFacingRelease:false`);
  if (data.approvalStatus !== "not_approved") fail(`${label} must remain not_approved`);
}

const overlayByTask = new Map((overlay.reviewEntries || []).map((entry) => [entry.taskId, entry]));
const applyRows = (input.inputEntries || []).map((entry) => {
  const validation = validateEntry(entry);
  const overlayEntry = overlayByTask.get(entry.taskId);
  const canApply = Boolean(overlayEntry) && validation.ready;
  return {
    id: entry.id,
    taskId: entry.taskId,
    reviewEntryId: entry.reviewEntryId,
    category: entry.category,
    sourceRelativePath: entry.sourceRelativePath,
    pageNumber: entry.pageNumber,
    applyStatus: canApply ? "ready_to_apply" : "blocked_not_ready",
    willWrite: write && canApply,
    missingFields: validation.missingFields,
    forbiddenHits: validation.forbiddenHits,
    nextGate: entry.nextGate,
  };
});

const readyRows = applyRows.filter((row) => row.applyStatus === "ready_to_apply");
const blockedRows = applyRows.filter((row) => row.applyStatus !== "ready_to_apply");
const writtenRows = applyRows.filter((row) => row.willWrite);

if (write && writtenRows.length) {
  const updatedEntries = (overlay.reviewEntries || []).map((overlayEntry) => {
    const inputEntry = (input.inputEntries || []).find((entry) => entry.taskId === overlayEntry.taskId);
    if (!inputEntry) return overlayEntry;
    const row = applyRows.find((item) => item.taskId === overlayEntry.taskId);
    return row?.willWrite ? applyEntry(overlayEntry, inputEntry) : overlayEntry;
  });
  const readyForValidationTasks = updatedEntries.filter((entry) => entry.reviewStatus === "ready_for_validation").length;
  const acceptedForNextGateTasks = updatedEntries.filter((entry) => entry.validationStatus === "ready_for_next_gate").length;
  const notStartedTasks = updatedEntries.filter((entry) => entry.reviewStatus === "not_started").length;
  const updatedOverlay = {
    ...overlay,
    generatedAt: new Date().toISOString(),
    overlayStatus: readyForValidationTasks ? "p0_review_partially_ready" : overlay.overlayStatus,
    notStartedTasks,
    inProgressTasks: 0,
    readyForValidationTasks,
    acceptedForNextGateTasks,
    blockedTasks: updatedEntries.length - acceptedForNextGateTasks,
    reviewEntries: updatedEntries,
  };
  fs.writeFileSync(overlayPath, `${JSON.stringify(updatedOverlay, null, 2)}\n`, "utf8");
}

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  applyMode: write ? "write" : "dry_run",
  fixtureOnly: input.fixtureOnly === true,
  applyStatus: writtenRows.length
    ? "applied_ready_entries"
    : readyRows.length
      ? "ready_entries_not_written"
      : "blocked_no_ready_entries",
  inputPath,
  overlayPath,
  totalEntries: applyRows.length,
  readyToApplyEntries: readyRows.length,
  blockedEntries: blockedRows.length,
  writtenEntries: writtenRows.length,
  applyRows,
  nextStep: readyRows.length
    ? (write ? "Rerun P0 overlay, input validation, absorption readiness, and source-fit gates." : "Rerun with --write only after confirming the dry-run report.")
    : "Fill reviewer input fields in a copied input file, validate it, then rerun this apply dry-run.",
  boundary: "P0 review input apply is a guarded overlay update pipeline. Dry-run mode writes no overlay changes. It does not approve learner-facing release, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course Absorption P0 Review Apply Report",
  "",
  "Guarded apply report for reviewer-filled P0 input.",
  "",
  `- Apply mode: ${report.applyMode}`,
  `- Apply status: ${report.applyStatus}`,
  `- Total entries: ${report.totalEntries}`,
  `- Ready to apply entries: ${report.readyToApplyEntries}`,
  `- Blocked entries: ${report.blockedEntries}`,
  `- Written entries: ${report.writtenEntries}`,
  "",
  "## First Rows",
  "",
  "| Entry | Category | Page | Apply status | Will write | Missing fields |",
  "| --- | --- | ---: | --- | --- | --- |",
  ...applyRows.slice(0, 12).map((row) => `| ${row.id} | ${row.category} | ${row.pageNumber || ""} | ${row.applyStatus} | ${row.willWrite} | ${row.missingFields.join(", ")} |`),
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
  applyMode: report.applyMode,
  applyStatus: report.applyStatus,
  totalEntries: report.totalEntries,
  readyToApplyEntries: report.readyToApplyEntries,
  blockedEntries: report.blockedEntries,
  writtenEntries: report.writtenEntries,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
