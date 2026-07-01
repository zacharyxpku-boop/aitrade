import fs from "node:fs";

const candidatesPath = "docs/LOCAL_COURSE_SOURCE_REPLACEMENT_CANDIDATES.json";
const outputJsonPath = "docs/LOCAL_COURSE_SOURCE_REPLACEMENT_DECISION_WORKSHEET.json";
const outputMdPath = "docs/LOCAL_COURSE_SOURCE_REPLACEMENT_DECISION_WORKSHEET.md";

const allowedDecisions = [
  "locate_external_original",
  "reexport_blank_source",
  "use_neighbor_as_context_only",
  "mark_unrecoverable",
];

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const candidates = readJson(candidatesPath);
if (candidates.educationOnly !== true) fail("candidate report must keep educationOnly:true");
if (candidates.productionReady !== false) fail("candidate report must keep productionReady:false");
if (candidates.learnerFacingRelease !== false) fail("candidate report must keep learnerFacingRelease:false");
if (candidates.approvalStatus !== "not_approved") fail("candidate report must remain not_approved");

const decisionRows = (candidates.targetRows || []).map((target) => ({
  id: `decision_${target.id}`,
  targetId: target.id,
  documentId: target.documentId,
  sourceId: target.sourceId,
  sourceRelativePath: target.sourceRelativePath,
  sourceModule: target.sourceModule,
  pageNumber: target.pageNumber,
  previewPath: target.previewPath,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  decisionStatus: "not_started",
  reviewerName: "",
  reviewedAt: "",
  allowedDecisions,
  selectedDecision: "",
  selectedCandidateSourceId: "",
  selectedCandidateRelativePath: "",
  candidateCount: target.candidateCount || 0,
  directReplacementCandidateCount: target.directReplacementCandidateCount || 0,
  recommendedAction: target.recommendedAction,
  topCandidates: (target.candidates || []).slice(0, 5).map((candidate) => ({
    sourceId: candidate.sourceId,
    relativePath: candidate.relativePath,
    module: candidate.module,
    bytes: candidate.bytes,
    sameModule: candidate.sameModule,
    exactNumberHits: candidate.exactNumberHits,
    similarity: candidate.similarity,
    score: candidate.score,
    confidence: candidate.confidence,
    reviewerUse: candidate.reviewerUse,
  })),
  requiredEvidence: {
    replacementSourcePath: "",
    reviewerNote: "",
    rerunEvidence: "",
    previewRerunStatus: "not_started",
  },
  fieldCompletion: {
    requiredFieldsTotal: 5,
    requiredFieldsFilled: 0,
    complete: false,
  },
  validationStatus: "not_ready",
  nextGate: "source_replacement_decision_then_reexport_or_unrecoverable_review",
}));

const worksheet = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  worksheetStatus: "source_replacement_decision_not_started",
  sourceCandidateReport: candidatesPath,
  replacementTargets: decisionRows.length,
  targetsWithCandidates: decisionRows.filter((row) => row.candidateCount > 0).length,
  targetsWithDirectReplacementCandidates: decisionRows.filter((row) => row.directReplacementCandidateCount > 0).length,
  totalCandidateRows: candidates.totalCandidateRows || 0,
  notStartedDecisions: decisionRows.filter((row) => row.decisionStatus === "not_started").length,
  readyDecisions: 0,
  approvedReplacements: 0,
  unrecoverableMarked: 0,
  allowedDecisions,
  decisionRows,
  completionRule: "Each blank-preview target needs one explicit reviewer decision, reviewer note, evidence path or unrecoverable rationale, and rerun evidence before source-fit and public-grounding gates can continue.",
  boundary: "Source replacement decision worksheet is a reviewer-only control layer for blank-preview local private course PDFs. It does not replace files, infer missing content, approve learner-facing release, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance. Neighbor candidates may be used as context only after reviewer confirmation, not as direct replacements.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(worksheet, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course Source Replacement Decision Worksheet",
  "",
  "Reviewer decision layer for blank-preview source replacement targets.",
  "",
  `- Worksheet status: ${worksheet.worksheetStatus}`,
  `- Replacement targets: ${worksheet.replacementTargets}`,
  `- Targets with candidates: ${worksheet.targetsWithCandidates}`,
  `- Direct replacement candidates: ${worksheet.targetsWithDirectReplacementCandidates}`,
  `- Not started decisions: ${worksheet.notStartedDecisions}`,
  `- Ready decisions: ${worksheet.readyDecisions}`,
  `- Approved replacements: ${worksheet.approvedReplacements}`,
  "",
  "## Allowed Decisions",
  "",
  ...allowedDecisions.map((decision) => `- ${decision}`),
  "",
  "## Decision Rows",
  "",
  "| Target | Candidates | Direct | Decision status | Recommended action |",
  "| --- | ---: | ---: | --- | --- |",
  ...decisionRows.map((row) => `| ${row.sourceRelativePath} | ${row.candidateCount} | ${row.directReplacementCandidateCount} | ${row.decisionStatus} | ${row.recommendedAction} |`),
  "",
  "## Top Candidates",
  "",
  ...decisionRows.flatMap((row) => [
    `### ${row.sourceRelativePath}`,
    "",
    "| Candidate | Score | Confidence | Reviewer use |",
    "| --- | ---: | --- | --- |",
    ...row.topCandidates.map((candidate) => `| ${candidate.relativePath} | ${candidate.score} | ${candidate.confidence} | ${candidate.reviewerUse} |`),
    "",
  ]),
  "## Completion Rule",
  "",
  worksheet.completionRule,
  "",
  "## Boundary",
  "",
  worksheet.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: worksheet.educationOnly,
  productionReady: worksheet.productionReady,
  learnerFacingRelease: worksheet.learnerFacingRelease,
  approvalStatus: worksheet.approvalStatus,
  worksheetStatus: worksheet.worksheetStatus,
  replacementTargets: worksheet.replacementTargets,
  targetsWithCandidates: worksheet.targetsWithCandidates,
  targetsWithDirectReplacementCandidates: worksheet.targetsWithDirectReplacementCandidates,
  notStartedDecisions: worksheet.notStartedDecisions,
  readyDecisions: worksheet.readyDecisions,
  approvedReplacements: worksheet.approvedReplacements,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
