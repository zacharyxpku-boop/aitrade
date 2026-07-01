import fs from "node:fs";

const defaultInputPath = "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_02_INPUT_COPY_TEMPLATE.json";
const defaultOutputJsonPath = "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_02_INPUT_COPY_LINT.json";
const defaultOutputMdPath = "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_02_INPUT_COPY_LINT.md";

const forbiddenPhrases = [
  "stock recommendation",
  "buy signal",
  "sell signal",
  "guaranteed return",
  "win rate promise",
  "broker workflow",
  "auto trading",
  "real money",
  "recommended buy",
  "recommended sell",
  "must buy",
  "must sell",
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
  const blob = JSON.stringify(value || {}).toLowerCase();
  return forbiddenPhrases.filter((phrase) => blob.includes(phrase.toLowerCase()));
}

function candidateCopyIssues(entry) {
  const issues = [];
  const candidateSummary = text(entry.packQualityRequirements?.candidateSummary);
  const transcription = text(entry.manualInput?.humanTranscription);
  const summary = text(entry.manualInput?.humanSummary);
  if (candidateSummary && transcription.includes(candidateSummary.slice(0, 80))) {
    issues.push("humanTranscription_contains_candidate_summary");
  }
  if (candidateSummary && summary.includes(candidateSummary.slice(0, 80))) {
    issues.push("humanSummary_contains_candidate_summary");
  }
  if (/candidate summary for orientation only/i.test(transcription) || /machine-assisted candidate/i.test(transcription)) {
    issues.push("humanTranscription_mentions_candidate_as_source");
  }
  return issues;
}

const inputPath = argValue("--input", defaultInputPath);
const outputJsonPath = argValue("--output-json", defaultOutputJsonPath);
const outputMdPath = argValue("--output-md", defaultOutputMdPath);
const input = readJson(inputPath);

if (input.educationOnly !== true) fail("input copy must keep educationOnly:true");
if (input.productionReady !== false) fail("input copy must keep productionReady:false");
if (input.learnerFacingRelease !== false) fail("input copy must keep learnerFacingRelease:false");
if (input.approvalStatus !== "not_approved") fail("input copy must remain not_approved");
if (input.packId !== "local_course_p0_human_fill_pack_02") fail(`unexpected packId: ${input.packId}`);

const lintRows = (input.inputEntries || []).map((entry) => {
  const missingFields = [];
  if (!text(entry.reviewerName)) missingFields.push("reviewerName");
  if (!text(entry.reviewedAt)) missingFields.push("reviewedAt");
  if (!text(entry.manualInput?.humanTranscription)) missingFields.push("humanTranscription");
  if (!text(entry.manualInput?.humanSummary)) missingFields.push("humanSummary");
  if (!text(entry.manualInput?.publicReferenceNotes)) missingFields.push("publicReferenceNotes");
  if (!text(entry.manualInput?.originalityNotes)) missingFields.push("originalityNotes");
  if (!text(entry.manualInput?.riskRewriteNotes)) missingFields.push("riskRewriteNotes");
  if (!checklistDone(entry.manualInput?.checklist)) missingFields.push("manualChecklist");

  const riskFlags = entry.packQualityRequirements?.riskTermFlags || [];
  const riskRewriteNotes = text(entry.manualInput?.riskRewriteNotes);
  const riskRewriteMissingFlags = riskFlags.filter((flag) => !riskRewriteNotes.includes(flag));
  const publicReferenceMissing = !/public|wikipedia|official|reference|source/i.test(text(entry.manualInput?.publicReferenceNotes));
  const originalityMissing = !/not copied|original|paraphrase|rewrite/i.test(text(entry.manualInput?.originalityNotes));
  const copyIssues = candidateCopyIssues(entry);
  const hits = forbiddenHits({
    humanTranscription: entry.manualInput?.humanTranscription,
    humanSummary: entry.manualInput?.humanSummary,
    publicReferenceNotes: entry.manualInput?.publicReferenceNotes,
    originalityNotes: entry.manualInput?.originalityNotes,
    riskRewriteNotes: entry.manualInput?.riskRewriteNotes,
  });

  const ready =
    missingFields.length === 0 &&
    riskRewriteMissingFlags.length === 0 &&
    publicReferenceMissing === false &&
    originalityMissing === false &&
    copyIssues.length === 0 &&
    hits.length === 0;

  return {
    id: entry.id,
    taskId: entry.taskId,
    category: entry.category,
    documentId: entry.documentId,
    pageNumber: entry.pageNumber,
    lintStatus: ready ? "ready_for_validation" : "blocked_quality_lint",
    readyForValidation: ready,
    missingFields,
    riskRewriteMissingFlags,
    publicReferenceMissing,
    originalityMissing,
    candidateCopyIssues: copyIssues,
    forbiddenHits: hits,
    nextGate: entry.nextGate,
  };
});

const readyEntries = lintRows.filter((row) => row.readyForValidation).length;
const blockedEntries = lintRows.length - readyEntries;
const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  fixtureOnly: input.fixtureOnly === true,
  inputPath,
  packId: input.packId,
  lintStatus: readyEntries === lintRows.length ? "ready_for_validation" : "blocked_quality_lint",
  totalEntries: lintRows.length,
  readyEntries,
  blockedEntries,
  candidateCopyIssueEntries: lintRows.filter((row) => row.candidateCopyIssues.length).length,
  riskRewriteIncompleteEntries: lintRows.filter((row) => row.riskRewriteMissingFlags.length).length,
  publicReferenceMissingEntries: lintRows.filter((row) => row.publicReferenceMissing).length,
  originalityMissingEntries: lintRows.filter((row) => row.originalityMissing).length,
  forbiddenHitEntries: lintRows.filter((row) => row.forbiddenHits.length).length,
  lintRows,
  nextStep: readyEntries === lintRows.length
    ? "Run the generic P0 review input validator and apply dry-run against the same copied input file."
    : "Fill missing reviewer fields and address every risk flag before validation.",
  boundary: "Pack 02 filled-copy lint is a dry-run quality gate. It does not write overlay changes, perform OCR, approve learner-facing release, copy private course wording into lessons, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course P0 Human Fill Pack 02 Input Copy Lint",
  "",
  "Dry-run quality lint for filled pack 02 reviewer input copies.",
  "",
  `- Lint status: ${report.lintStatus}`,
  `- Input path: ${report.inputPath}`,
  `- Total entries: ${report.totalEntries}`,
  `- Ready entries: ${report.readyEntries}`,
  `- Blocked entries: ${report.blockedEntries}`,
  `- Candidate-copy issue entries: ${report.candidateCopyIssueEntries}`,
  `- Risk rewrite incomplete entries: ${report.riskRewriteIncompleteEntries}`,
  `- Public reference missing entries: ${report.publicReferenceMissingEntries}`,
  `- Originality missing entries: ${report.originalityMissingEntries}`,
  "",
  "## Rows",
  "",
  "| Entry | Page | Status | Missing | Risk flags missing | Copy issues |",
  "| --- | ---: | --- | --- | --- | --- |",
  ...lintRows.map((row) => `| ${row.id} | ${row.pageNumber || ""} | ${row.lintStatus} | ${row.missingFields.join(", ")} | ${row.riskRewriteMissingFlags.join(", ")} | ${row.candidateCopyIssues.join(", ")} |`),
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
  lintStatus: report.lintStatus,
  totalEntries: report.totalEntries,
  readyEntries: report.readyEntries,
  blockedEntries: report.blockedEntries,
  candidateCopyIssueEntries: report.candidateCopyIssueEntries,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
