import fs from "node:fs";

const batchPaths = [
  "docs/LOCAL_COURSE_HIGH_RES_TRANSCRIPTION_CANDIDATE_BATCH_01.json",
  "docs/LOCAL_COURSE_HIGH_RES_TRANSCRIPTION_CANDIDATE_BATCH_02.json",
  "docs/LOCAL_COURSE_HIGH_RES_TRANSCRIPTION_CANDIDATE_BATCH_03.json",
  "docs/LOCAL_COURSE_HIGH_RES_TRANSCRIPTION_CANDIDATE_BATCH_04.json",
  "docs/LOCAL_COURSE_HIGH_RES_TRANSCRIPTION_CANDIDATE_BATCH_05.json",
];
const outputJsonPath = "docs/LOCAL_COURSE_HIGH_RES_TRANSCRIPTION_CANDIDATE_INDEX.json";
const outputMdPath = "docs/LOCAL_COURSE_HIGH_RES_TRANSCRIPTION_CANDIDATE_INDEX.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const batches = batchPaths.map(readJson);
for (const batch of batches) {
  if (batch.educationOnly !== true) fail(`${batch.batchId} must keep educationOnly:true`);
  if (batch.productionReady !== false) fail(`${batch.batchId} must keep productionReady:false`);
  if (batch.learnerFacingRelease !== false || batch.approvalStatus !== "not_approved") {
    fail(`${batch.batchId} release gate drift`);
  }
  if (batch.batchStatus !== "machine_assisted_transcription_candidates_ready_for_human_review") {
    fail(`${batch.batchId} status drift`);
  }
}

const candidatePages = batches.flatMap((batch) => batch.candidatePagesList || []);
const riskTermFlagCounts = candidatePages.reduce((counts, page) => {
  for (const flag of page.riskTermFlags || []) counts[flag] = (counts[flag] || 0) + 1;
  return counts;
}, {});
const documentIds = [...new Set(candidatePages.map((page) => page.documentId))];
const pageNumbers = candidatePages.map((page) => page.pageNumber).sort((a, b) => a - b);

const index = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  indexStatus: "machine_assisted_candidate_index_ready_for_human_review",
  sourceBatches: batchPaths,
  batchCount: batches.length,
  documentIds,
  candidatePages: candidatePages.length,
  candidatePageNumbers: pageNumbers,
  acceptedForP0OverlayPages: candidatePages.filter((page) => page.acceptedForP0Overlay === true).length,
  blockedUntilHumanReviewedPages: candidatePages.filter((page) => page.acceptedForP0Overlay !== true).length,
  riskTermFlagCounts,
  topRiskTermFlags: Object.entries(riskTermFlagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([flag, count]) => ({ flag, count })),
  pageRows: candidatePages.map((page) => ({
    id: page.id,
    documentId: page.documentId,
    sourceRelativePath: page.sourceRelativePath,
    sourceModule: page.sourceModule,
    pageNumber: page.pageNumber,
    candidateStatus: page.candidateStatus,
    acceptedForP0Overlay: page.acceptedForP0Overlay,
    highResPreviewPath: page.highResPreviewPath,
    educationOnlySummary: page.educationOnlySummary,
    uncertainRegions: page.uncertainRegions,
    riskTermFlags: page.riskTermFlags,
    rewriteAngles: page.rewriteAngles,
    nextGate: page.nextGate,
  })),
  completionRule: "The candidate index now covers all 19 manual-transcription high-resolution pages for corpus_1313 and corpus_1580 only as a machine-assisted reviewer work queue. It cannot be counted as accepted transcription until each page is human-reviewed and applied through the P0 overlay validation pipeline.",
  boundary: "High-resolution transcription candidate index is reviewer-only working material. It does not perform accepted OCR, approve learner-facing release, copy private course wording into lessons, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course High-Resolution Transcription Candidate Index",
  "",
  "Index of machine-assisted high-resolution visual transcription candidates.",
  "",
  `- Index status: ${index.indexStatus}`,
  `- Batches: ${index.batchCount}`,
  `- Documents: ${index.documentIds.join(", ")}`,
  `- Candidate pages: ${index.candidatePages}`,
  `- Accepted for P0 overlay: ${index.acceptedForP0OverlayPages}`,
  `- Blocked until human reviewed: ${index.blockedUntilHumanReviewedPages}`,
  "",
  "## Top Risk Flags",
  "",
  "| Flag | Count |",
  "| --- | ---: |",
  ...index.topRiskTermFlags.map((row) => `| ${row.flag} | ${row.count} |`),
  "",
  "## Page Rows",
  "",
  "| Page | Status | Accepted | Risk flags | Next gate |",
  "| ---: | --- | --- | --- | --- |",
  ...index.pageRows.map((row) => `| ${row.pageNumber} | ${row.candidateStatus} | ${row.acceptedForP0Overlay} | ${(row.riskTermFlags || []).join(", ")} | ${row.nextGate} |`),
  "",
  "## Completion Rule",
  "",
  index.completionRule,
  "",
  "## Boundary",
  "",
  index.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: index.educationOnly,
  productionReady: index.productionReady,
  learnerFacingRelease: index.learnerFacingRelease,
  approvalStatus: index.approvalStatus,
  indexStatus: index.indexStatus,
  batchCount: index.batchCount,
  candidatePages: index.candidatePages,
  acceptedForP0OverlayPages: index.acceptedForP0OverlayPages,
  blockedUntilHumanReviewedPages: index.blockedUntilHumanReviewedPages,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
