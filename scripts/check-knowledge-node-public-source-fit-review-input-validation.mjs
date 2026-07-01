import fs from "node:fs";

const starterPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_STARTER.json";
const draftPath = "docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_DRAFT.json";
const validationPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_VALIDATION.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const starter = readJson(starterPath);
const draft = readJson(draftPath);
const validation = readJson(validationPath);

for (const [name, data] of Object.entries({ starter, draft, validation })) {
  if (data.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (data.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (data.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (data.approvalStatus !== "not_approved") fail(`${name} must remain not_approved`);
  if (data.writeAllowedNow !== false) fail(`${name} must not allow writes`);
}

if (starter.starterStatus !== "node_public_source_fit_review_input_starter_ready_blank") fail("unexpected starter status");
if (draft.inputStatus !== "blank_node_public_source_fit_review_input_ready_for_human") fail("unexpected draft input status");
if (validation.validationStatus !== "blocked_missing_real_reviewer_source_fit_input") fail("unexpected validation status");
if (starter.candidateTargetNodes !== 273 || draft.candidateTargetNodes !== 273) fail("candidate target nodes drifted");
if (starter.reviewRows !== 1638 || draft.reviewRows !== 1638 || validation.inputRows !== 1638) fail("review row count drifted");
if (starter.readyReviewRows !== 0 || draft.readyReviewRows !== 0 || validation.readyRows !== 0) fail("blank input should not have ready rows");
if (starter.blockedReviewRows !== 1638 || draft.blockedReviewRows !== 1638 || validation.blockedRows !== 1638) {
  fail("blank input should have 1638 blocked rows");
}
if (validation.missingFieldRows !== 1638) fail("blank input must report 1638 missing field rows");
if (validation.invalidDecisionRows !== 0) fail("blank input should not have invalid decision rows");
if (validation.forbiddenHitRows !== 0) fail("blank input should not have forbidden hits");
if (validation.realHumanInputEntries !== 0) fail("blank input should not have real human entries");
if (validation.learnerCitationApprovedRows !== 0) fail("learner citation approvals must remain zero");
if (validation.copiedTextApprovedRows !== 0) fail("copied text approvals must remain zero");
if (validation.manualAuthorizationRequired !== true) fail("manual authorization must be required");

if (!Array.isArray(draft.rows) || draft.rows.length !== 1638) fail("draft rows must contain 1638 rows");
for (const row of draft.rows.slice(0, 50)) {
  if (!row.reviewId || !row.nodeId || !row.documentId || !row.name || !row.url) fail("draft row missing identity fields");
  if (row.reviewerDecision !== "" || row.sourceFitNotes !== "" || row.citationUse !== "") fail("draft row must remain blank");
  if (row.learnerCitationApproved !== false || row.copiedTextApproved !== false || row.realHumanInput !== false) {
    fail("draft row must not approve citation/copy or claim real human input");
  }
}
if (!Array.isArray(validation.validationRows) || validation.validationRows.length !== 1638) fail("validation rows must contain 1638 rows");
if (!Array.isArray(validation.blockedSamples) || validation.blockedSamples.length < 10) fail("blocked samples too small");
if (!Array.isArray(starter.commands) || !starter.commands.some((item) => item.includes("validate:knowledge-node-public-source-fit-review-input"))) {
  fail("starter commands missing validation command");
}

const boundaryText = `${starter.boundary || ""} ${draft.boundary || ""} ${validation.boundary || ""} ${validation.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "real human reviewer",
  "does not approve copied text",
  "learner-facing citations",
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
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  starterStatus: starter.starterStatus,
  validationStatus: validation.validationStatus,
  candidateTargetNodes: starter.candidateTargetNodes,
  reviewRows: starter.reviewRows,
  readyRows: validation.readyRows,
  blockedRows: validation.blockedRows,
  missingFieldRows: validation.missingFieldRows,
  forbiddenHitRows: validation.forbiddenHitRows,
  realHumanInputEntries: validation.realHumanInputEntries,
  writeAllowedNow: validation.writeAllowedNow,
}, null, 2));
