import fs from "node:fs";

const worksheetPath = "docs/LOCAL_COURSE_SOURCE_REPLACEMENT_DECISION_WORKSHEET.json";

const requiredAllowedDecisions = [
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

const worksheet = readJson(worksheetPath);
const rows = worksheet.decisionRows || [];

if (worksheet.educationOnly !== true) fail("worksheet must keep educationOnly:true");
if (worksheet.productionReady !== false) fail("worksheet must keep productionReady:false");
if (worksheet.learnerFacingRelease !== false) fail("worksheet must keep learnerFacingRelease:false");
if (worksheet.approvalStatus !== "not_approved") fail("worksheet must remain not_approved");
if (worksheet.worksheetStatus !== "source_replacement_decision_not_started") fail(`unexpected worksheetStatus: ${worksheet.worksheetStatus}`);
if (worksheet.replacementTargets !== 3 || rows.length !== 3) fail(`expected 3 decision rows, got ${worksheet.replacementTargets}/${rows.length}`);
if (worksheet.targetsWithCandidates !== 3) fail(`expected candidates for all 3 targets, got ${worksheet.targetsWithCandidates}`);
if (worksheet.targetsWithDirectReplacementCandidates !== 0) fail(`expected 0 direct replacement candidates, got ${worksheet.targetsWithDirectReplacementCandidates}`);
if (worksheet.notStartedDecisions !== 3) fail(`expected 3 not-started decisions, got ${worksheet.notStartedDecisions}`);
if (worksheet.readyDecisions !== 0 || worksheet.approvedReplacements !== 0 || worksheet.unrecoverableMarked !== 0) {
  fail("initial worksheet must not mark decisions ready, approved, or unrecoverable");
}

for (const decision of requiredAllowedDecisions) {
  if (!worksheet.allowedDecisions?.includes(decision)) fail(`worksheet missing allowed decision: ${decision}`);
}

const ids = new Set();
for (const row of rows) {
  if (!row.id || ids.has(row.id)) fail(`duplicate or missing row id: ${row.id}`);
  ids.add(row.id);
  if (row.educationOnly !== true || row.productionReady !== false) fail(`${row.id} boundary drift`);
  if (row.learnerFacingRelease !== false || row.approvalStatus !== "not_approved") fail(`${row.id} release gate drift`);
  if (row.decisionStatus !== "not_started" || row.validationStatus !== "not_ready") fail(`${row.id} must start not_started/not_ready`);
  if (row.reviewerName !== "" || row.reviewedAt !== "") fail(`${row.id} reviewer fields must start blank`);
  if (row.selectedDecision !== "" || row.selectedCandidateSourceId !== "" || row.selectedCandidateRelativePath !== "") {
    fail(`${row.id} selected decision fields must start blank`);
  }
  if (!row.previewPath || !fs.existsSync(row.previewPath)) fail(`${row.id} preview missing`);
  if (!Array.isArray(row.allowedDecisions) || requiredAllowedDecisions.some((decision) => !row.allowedDecisions.includes(decision))) {
    fail(`${row.id} allowed decisions incomplete`);
  }
  if (!Array.isArray(row.topCandidates) || row.topCandidates.length < 3) fail(`${row.id} should expose at least 3 top candidates`);
  if (row.directReplacementCandidateCount !== 0) fail(`${row.id} should not claim direct replacement candidates`);
  if (row.fieldCompletion?.requiredFieldsFilled !== 0 || row.fieldCompletion?.complete !== false) fail(`${row.id} field completion drift`);
  if (row.requiredEvidence?.replacementSourcePath !== "" || row.requiredEvidence?.reviewerNote !== "" || row.requiredEvidence?.rerunEvidence !== "") {
    fail(`${row.id} evidence fields must start blank`);
  }
  if (row.requiredEvidence?.previewRerunStatus !== "not_started") fail(`${row.id} preview rerun status must start not_started`);
  if (row.nextGate !== "source_replacement_decision_then_reexport_or_unrecoverable_review") fail(`${row.id} next gate drift`);
  for (const candidate of row.topCandidates) {
    if (!candidate.sourceId || !candidate.relativePath) fail(`${row.id} candidate missing source identity`);
    if (candidate.relativePath === row.sourceRelativePath) fail(`${row.id} top candidate cannot be the blank source itself`);
    if (!candidate.reviewerUse?.includes("candidate_only")) fail(`${row.id} candidate must remain candidate-only`);
    if (!["direct_replacement_candidate", "same_module_neighbor_candidate", "context_reference_candidate", "weak_reference_only"].includes(candidate.confidence)) {
      fail(`${row.id} invalid candidate confidence: ${candidate.confidence}`);
    }
  }
}

const boundaryText = `${worksheet.boundary || ""} ${worksheet.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-only control layer",
  "does not replace files",
  "infer missing content",
  "approve learner-facing release",
  "trading advice",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
  "context only",
]) {
  if (!boundaryText.includes(phrase)) fail(`worksheet boundary missing phrase: ${phrase}`);
}

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
}, null, 2));
